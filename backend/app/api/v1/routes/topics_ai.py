"""Topic AI content, quiz generation, gating."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.topic import Topic
from app.models.topic_quiz import TopicQuiz
from app.models.quiz_attempt import QuizAttempt
from app.models.user_topic_state import UserTopicState
from app.services.ai_client import chat_json
from app.services.topic_unlock import is_topic_unlocked
from app.services.activity import record_activity_day

router = APIRouter()

PASS_PCT = 70
NUM_Q = 10


class QuizQuestionPublic(BaseModel):
    index: int
    question: str
    options: list[str]


class QuizPublic(BaseModel):
    topic_id: uuid.UUID
    questions: list[QuizQuestionPublic]


class QuizSubmitBody(BaseModel):
    answers: list[int]


class WrongExplain(BaseModel):
    index: int
    your_answer: str
    correct_answer: str
    explanation: str


class QuizSubmitResult(BaseModel):
    passed: bool
    score_percent: int
    wrong_explanations: list[WrongExplain]


class TopicStateResponse(BaseModel):
    unlocked: bool
    has_content: bool
    quiz_passed: bool
    model_config = ConfigDict(from_attributes=True)


@router.get("/{topic_id}/state", response_model=TopicStateResponse)
async def topic_state(
    topic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    res = await db.execute(select(Topic).where(Topic.id == topic_id))
    topic = res.scalars().first()
    if not topic:
        raise HTTPException(404, "Topic not found")
    unlocked = await is_topic_unlocked(db, user.id, topic)
    st_res = await db.execute(
        select(UserTopicState).where(UserTopicState.user_id == user.id, UserTopicState.topic_id == topic_id)
    )
    st = st_res.scalars().first()
    quiz_passed = bool(st and st.quiz_passed_at)
    has_content = bool(topic.content and len(topic.content.strip()) > 20)
    return TopicStateResponse(unlocked=unlocked, has_content=has_content, quiz_passed=quiz_passed)


@router.post("/{topic_id}/generate-content")
async def generate_topic_content(
    topic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    res = await db.execute(select(Topic).where(Topic.id == topic_id))
    topic = res.scalars().first()
    if not topic:
        raise HTTPException(404, "Topic not found")
    if not await is_topic_unlocked(db, user.id, topic):
        raise HTTPException(403, "Topic locked")
    from app.models.module import Module
    from app.models.subject import Subject

    mod_res = await db.execute(select(Module).where(Module.id == topic.module_id))
    mod = mod_res.scalars().first()
    sub_res = await db.execute(select(Subject).where(Subject.id == mod.subject_id)) if mod else None
    sub = sub_res.scalars().first() if sub_res else None
    ctx = f"Subject: {sub.name if sub else ''}. Module: {mod.title if mod else ''}."
    try:
        data = chat_json(
            system=(
                "You write clear study notes for students. Return JSON {\"content\": string} "
                "where content is markdown (headings, bullets). "
                "Base explanation only on the topic title and context; be accurate and concise (600-1200 words)."
            ),
            user=f"{ctx}\nTopic: {topic.title}\nExpand into lesson content.",
        )
        content = (data.get("content") or "").strip()
        if len(content) < 80:
            raise ValueError("short content")
    except Exception as e:
        raise HTTPException(502, f"Content generation failed: {e}") from e
    topic.content = content
    await db.execute(delete(TopicQuiz).where(TopicQuiz.topic_id == topic_id))
    await db.flush()
    return {"ok": True, "length": len(content)}


@router.get("/{topic_id}/quiz", response_model=QuizPublic)
async def get_quiz(
    topic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    res = await db.execute(select(Topic).where(Topic.id == topic_id))
    topic = res.scalars().first()
    if not topic:
        raise HTTPException(404, "Topic not found")
    if not await is_topic_unlocked(db, user.id, topic):
        raise HTTPException(403, "Topic locked")
    if not topic.content or len(topic.content.strip()) < 40:
        raise HTTPException(400, "Generate content first")

    qz_res = await db.execute(select(TopicQuiz).where(TopicQuiz.topic_id == topic_id))
    qz = qz_res.scalars().first()
    if not qz:
        try:
            raw = chat_json(
                system=(
                    f"Create exactly {NUM_Q} multiple-choice questions ONLY about the lesson text provided. "
                    "Each question must be answerable from that text alone. "
                    'Return JSON {"questions":[{"question":str,"options":[4 strings],"correct_index":0-3,"explanation":str}]}'
                ),
                user=topic.content[:12000],
            )
            qs = raw.get("questions") or []
            if len(qs) < NUM_Q:
                raise ValueError("not enough questions")
            cleaned = []
            for q in qs[:NUM_Q]:
                opts = q.get("options") or []
                if len(opts) != 4:
                    continue
                ci = int(q.get("correct_index", 0))
                cleaned.append(
                    {
                        "question": str(q.get("question", ""))[:500],
                        "options": [str(o)[:300] for o in opts],
                        "correct_index": max(0, min(3, ci)),
                        "explanation": str(q.get("explanation", ""))[:1500],
                    }
                )
            if len(cleaned) < NUM_Q:
                raise ValueError("invalid questions shape")
            qz = TopicQuiz(topic_id=topic_id, questions=cleaned)
            db.add(qz)
            await db.flush()
        except Exception as e:
            raise HTTPException(502, f"Quiz generation failed: {e}") from e

    public = [
        QuizQuestionPublic(index=i, question=q["question"], options=q["options"])
        for i, q in enumerate(qz.questions)
    ]
    return QuizPublic(topic_id=topic_id, questions=public)


@router.post("/{topic_id}/quiz/submit", response_model=QuizSubmitResult)
async def submit_quiz(
    topic_id: uuid.UUID,
    body: QuizSubmitBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    res = await db.execute(select(TopicQuiz).where(TopicQuiz.topic_id == topic_id))
    qz = res.scalars().first()
    if not qz:
        raise HTTPException(404, "No quiz for topic")
    qs = qz.questions
    if len(body.answers) != len(qs):
        raise HTTPException(400, "Answer count mismatch")
    correct = 0
    wrong: list[WrongExplain] = []
    for i, q in enumerate(qs):
        sel = body.answers[i]
        ci = q["correct_index"]
        if sel == ci:
            correct += 1
        else:
            opts = q["options"]
            wrong.append(
                WrongExplain(
                    index=i,
                    your_answer=opts[sel] if 0 <= sel < len(opts) else "?",
                    correct_answer=opts[ci] if 0 <= ci < len(opts) else "?",
                    explanation=q.get("explanation", ""),
                )
            )
    pct = int(100 * correct / len(qs))
    passed = pct >= PASS_PCT
    att = QuizAttempt(
        user_id=user.id,
        topic_id=topic_id,
        topic_quiz_id=qz.id,
        answers=body.answers,
        score_percent=pct,
        passed=passed,
    )
    db.add(att)
    if passed:
        st_res = await db.execute(
            select(UserTopicState).where(UserTopicState.user_id == user.id, UserTopicState.topic_id == topic_id)
        )
        st = st_res.scalars().first()
        if not st:
            st = UserTopicState(user_id=user.id, topic_id=topic_id, content_viewed=True)
            db.add(st)
        st.quiz_passed_at = datetime.now(timezone.utc)
        st.content_viewed = True
        await record_activity_day(db, user.id)
    await db.flush()
    return QuizSubmitResult(passed=passed, score_percent=pct, wrong_explanations=wrong)


@router.post("/{topic_id}/content-viewed")
async def mark_content_viewed(
    topic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    res = await db.execute(select(Topic).where(Topic.id == topic_id))
    topic = res.scalars().first()
    if not topic:
        raise HTTPException(404, "Topic not found")
    if not await is_topic_unlocked(db, user.id, topic):
        raise HTTPException(403, "Topic locked")
    st_res = await db.execute(
        select(UserTopicState).where(UserTopicState.user_id == user.id, UserTopicState.topic_id == topic_id)
    )
    st = st_res.scalars().first()
    if not st:
        st = UserTopicState(user_id=user.id, topic_id=topic_id, content_viewed=True)
        db.add(st)
    else:
        st.content_viewed = True
    await db.flush()
    return {"ok": True}
