"""Topic AI content, quiz generation, gating."""
import json
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
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
NUM_MCQ = 8
NUM_DESC = 2
NUM_Q = NUM_MCQ + NUM_DESC


def _is_mcq(q: dict[str, Any]) -> bool:
    if q.get("type") == "descriptive":
        return False
    if q.get("type") == "mcq":
        return True
    opts = q.get("options") or []
    return len(opts) == 4


def _is_descriptive(q: dict[str, Any]) -> bool:
    return not _is_mcq(q)


class QuizQuestionPublic(BaseModel):
    index: int
    kind: str = Field(description='"mcq" or "descriptive"')
    question: str
    options: list[str] = []


class QuizPublic(BaseModel):
    topic_id: uuid.UUID
    questions: list[QuizQuestionPublic]


class QuizSubmitBody(BaseModel):
    answers: list[int | str]


class WrongExplain(BaseModel):
    index: int
    your_answer: str
    correct_answer: str
    explanation: str


class DescriptiveFeedback(BaseModel):
    index: int
    your_answer: str
    ideal_answer: str
    comparison: str
    tips: str
    score_percent: int = Field(ge=0, le=100)


class QuizSubmitResult(BaseModel):
    passed: bool
    score_percent: int
    wrong_explanations: list[WrongExplain]
    descriptive_feedback: list[DescriptiveFeedback] = []


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
                    f"Create a quiz ONLY from the lesson text. "
                    f"Exactly {NUM_MCQ} multiple-choice questions (4 options each) and exactly {NUM_DESC} short descriptive "
                    "questions (1-3 sentence answers). Everything must be answerable from the lesson alone. "
                    'Return JSON {"mcq":[{"question":str,"options":[4 strings],"correct_index":0-3,"explanation":str}],'
                    '"descriptive":[{"question":str,"ideal_answer":str,"explanation":str}]} '
                    "For descriptive items, ideal_answer is the concise model answer; explanation is a brief grading hint."
                ),
                user=topic.content[:12000],
            )
            mcq_list = raw.get("mcq") or []
            desc_list = raw.get("descriptive") or []
            if len(mcq_list) < NUM_MCQ or len(desc_list) < NUM_DESC:
                raise ValueError("not enough questions")
            cleaned: list[dict[str, Any]] = []
            for q in mcq_list[:NUM_MCQ]:
                opts = q.get("options") or []
                if len(opts) != 4:
                    raise ValueError("invalid mcq options")
                ci = int(q.get("correct_index", 0))
                cleaned.append(
                    {
                        "type": "mcq",
                        "question": str(q.get("question", ""))[:500],
                        "options": [str(o)[:300] for o in opts],
                        "correct_index": max(0, min(3, ci)),
                        "explanation": str(q.get("explanation", ""))[:1500],
                    }
                )
            for q in desc_list[:NUM_DESC]:
                ideal = str(q.get("ideal_answer", "")).strip()
                if len(ideal) < 5:
                    raise ValueError("invalid descriptive ideal_answer")
                cleaned.append(
                    {
                        "type": "descriptive",
                        "question": str(q.get("question", ""))[:500],
                        "ideal_answer": ideal[:2000],
                        "explanation": str(q.get("explanation", ""))[:1500],
                    }
                )
            if len(cleaned) != NUM_Q:
                raise ValueError("invalid quiz shape")
            qz = TopicQuiz(topic_id=topic_id, questions=cleaned)
            db.add(qz)
            await db.flush()
        except Exception as e:
            raise HTTPException(502, f"Quiz generation failed: {e}") from e

    public = []
    for i, q in enumerate(qz.questions):
        if _is_mcq(q):
            public.append(
                QuizQuestionPublic(
                    index=i,
                    kind="mcq",
                    question=q["question"],
                    options=list(q.get("options") or []),
                )
            )
        else:
            public.append(
                QuizQuestionPublic(
                    index=i,
                    kind="descriptive",
                    question=q["question"],
                    options=[],
                )
            )
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
    qs: list[dict[str, Any]] = qz.questions
    if len(body.answers) != len(qs):
        raise HTTPException(400, "Answer count mismatch")

    desc_items: list[dict[str, Any]] = []
    for i, q in enumerate(qs):
        if not _is_descriptive(q):
            continue
        sel = body.answers[i]
        text = sel.strip() if isinstance(sel, str) else ""
        if not text:
            raise HTTPException(400, f"Please answer the written question {i + 1}.")
        desc_items.append(
            {
                "question_index": i,
                "question": q["question"],
                "ideal_answer": q.get("ideal_answer", ""),
                "rubric_hint": q.get("explanation", ""),
                "student_answer": text[:8000],
            }
        )

    grades_by_index: dict[int, dict[str, Any]] = {}
    if desc_items:
        try:
            grade_raw = chat_json(
                system=(
                    "You grade short written answers for a study quiz. Compare each student answer to the ideal answer. "
                    "Be fair: award partial credit when appropriate. "
                    'Return JSON {"grades":[{"score":0-100,"comparison":str,"tips":str}]} '
                    "with exactly one object per item in the SAME ORDER as the input items. "
                    "comparison: 2-4 sentences on how the student's answer differs from the ideal (gaps, inaccuracies, or what they got right). "
                    "tips: 2-4 sentences on how to write a strong answer (what a model answer should include, clarity, structure). "
                    "Use the same language as the questions."
                ),
                user=json.dumps({"items": desc_items}, ensure_ascii=False),
            )
            grades = grade_raw.get("grades") or []
            if len(grades) != len(desc_items):
                raise ValueError("grade count mismatch")
            for item, g in zip(desc_items, grades):
                idx = int(item["question_index"])
                grades_by_index[idx] = g
        except Exception as e:
            raise HTTPException(502, f"Written answer grading failed: {e}") from e

    points = 0.0
    wrong: list[WrongExplain] = []
    descriptive_feedback: list[DescriptiveFeedback] = []

    for i, q in enumerate(qs):
        sel = body.answers[i]
        if _is_mcq(q):
            if not isinstance(sel, int):
                raise HTTPException(400, f"Question {i + 1} expects a multiple-choice answer.")
            if not (0 <= sel <= 3):
                raise HTTPException(400, f"Invalid choice for question {i + 1}.")
            ci = int(q["correct_index"])
            opts = q.get("options") or []
            if sel == ci:
                points += 10.0
            else:
                wrong.append(
                    WrongExplain(
                        index=i,
                        your_answer=opts[sel] if 0 <= sel < len(opts) else "?",
                        correct_answer=opts[ci] if 0 <= ci < len(opts) else "?",
                        explanation=str(q.get("explanation", "")),
                    )
                )
        else:
            g = grades_by_index.get(i)
            if not g:
                raise HTTPException(502, "Missing grade for written question")
            score = int(g.get("score", 0))
            score = max(0, min(100, score))
            points += score / 10.0
            student = body.answers[i]
            student_s = student.strip() if isinstance(student, str) else ""
            descriptive_feedback.append(
                DescriptiveFeedback(
                    index=i,
                    your_answer=student_s[:8000],
                    ideal_answer=str(q.get("ideal_answer", ""))[:2000],
                    comparison=str(g.get("comparison", ""))[:2000],
                    tips=str(g.get("tips", ""))[:2000],
                    score_percent=score,
                )
            )

    pct = int(round(points))
    pct = max(0, min(100, pct))
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
    return QuizSubmitResult(
        passed=passed,
        score_percent=pct,
        wrong_explanations=wrong,
        descriptive_feedback=descriptive_feedback,
    )


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
