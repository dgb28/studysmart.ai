"""AI: home intent routing + dynamic learning path generation."""
import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.subject import Subject
from app.models.module import Module
from app.models.topic import Topic
from app.models.daily_goal import DailyGoal
from app.schemas.learning import SubjectRead
from app.services.ai_client import chat_json

router = APIRouter()


class HomeIntentBody(BaseModel):
    text: str


class HomeCreatedGoal(BaseModel):
    id: uuid.UUID
    title: str
    target_date: date
    completed: bool = False


class HomeIntentResponse(BaseModel):
    target: str  # daily_goals | analysis | learning_path
    learning_topic: str | None = None
    goal: HomeCreatedGoal | None = None


class GeneratePathBody(BaseModel):
    topic_name: str


def _normalize_path_name(s: str) -> str:
    return " ".join(s.strip().split()).lower()


async def _find_existing_user_subject(
    db: AsyncSession, user: User, topic_name: str
) -> Subject | None:
    want = _normalize_path_name(topic_name)
    if len(want) < 2:
        return None
    res = await db.execute(select(Subject).where(Subject.user_id == user.id))
    for subj in res.scalars().all():
        if _normalize_path_name(subj.name) == want:
            return subj
    return None


async def _load_subject_with_tree(db: AsyncSession, subject_id: uuid.UUID) -> Subject:
    res = await db.execute(
        select(Subject)
        .options(selectinload(Subject.modules).selectinload(Module.topics))
        .where(Subject.id == subject_id)
    )
    s = res.scalars().first()
    if not s:
        raise HTTPException(404, "Subject not found")
    s.modules = sorted(s.modules, key=lambda x: x.order)
    for mo in s.modules:
        mo.topics = sorted(mo.topics, key=lambda x: x.order)
    return s


async def _create_goal_from_home_text(raw: str, user: User, db: AsyncSession) -> HomeCreatedGoal:
    today = datetime.now(timezone.utc).date()
    text = raw.strip()
    title = text[:512] if text else "Task"
    target_d = today
    try:
        parsed = chat_json(
            system=(
                f"Extract a single calendar task from the user message. "
                f"Reference date (UTC): today = {today.isoformat()}. "
                'Return JSON {"title": string, "target_date": "YYYY-MM-DD"}. '
                "title: a short, readable task name only (e.g. 'Meeting at 6pm' from 'set a meeting at 6pm today'). "
                "target_date: the calendar day for this task. Map 'today' to the reference today; "
                "'tomorrow' to today plus one day; interpret weekday names relative to the reference date. "
                "If the user only specifies a time with 'today', use today's date."
            ),
            user=text[:2000],
        )
        t = (parsed.get("title") or "").strip()[:512]
        if t:
            title = t
        ds = (parsed.get("target_date") or "").strip()[:10]
        if ds:
            try:
                target_d = date.fromisoformat(ds)
            except ValueError:
                target_d = today
    except Exception:
        pass

    if not title:
        title = "Task"

    g = DailyGoal(user_id=user.id, title=title, target_date=target_d, completed=False)
    db.add(g)
    await db.flush()
    await db.refresh(g)
    return HomeCreatedGoal(id=g.id, title=g.title, target_date=g.target_date, completed=g.completed)


@router.post("/home/classify", response_model=HomeIntentResponse)
async def classify_home_intent(
    body: HomeIntentBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        data = chat_json(
            system=(
                "Classify the user's message into exactly one navigation target for a study app. "
                'Reply JSON: {"target": "daily_goals"|"analysis"|"learning_path", '
                '"learning_topic": string or null}. '
                "Use daily_goals for todos, goals, tasks, schedule, reminders, meetings, appointments, "
                "set a meeting, add a task, due dates, 'at 6pm today', etc. "
                "Use analysis for stats, progress, how am I doing, analytics. "
                "Use learning_path for learning a subject, course, tutorial, teach me X. "
                "If learning_path, set learning_topic to the subject (e.g. DBMS)."
            ),
            user=body.text[:2000],
        )
        t = data.get("target", "learning_path")
        if t not in ("daily_goals", "analysis", "learning_path"):
            t = "learning_path"
        goal: HomeCreatedGoal | None = None
        if t == "daily_goals":
            try:
                goal = await _create_goal_from_home_text(body.text, user, db)
            except Exception:
                goal = None
        return HomeIntentResponse(target=t, learning_topic=data.get("learning_topic"), goal=goal)
    except Exception:
        return HomeIntentResponse(target="learning_path", learning_topic=body.text[:120], goal=None)


@router.post("/paths/generate", response_model=SubjectRead)
async def generate_learning_path(
    body: GeneratePathBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    name = body.topic_name.strip()
    if len(name) < 2:
        raise HTTPException(400, "Topic name too short")

    existing = await _find_existing_user_subject(db, user, name)
    if existing:
        return await _load_subject_with_tree(db, existing.id)

    try:
        outline = chat_json(
            system=(
                "You design a short course outline. Return JSON: "
                '{"modules":[{"title":str,"description":str,"topics":[{"title":str,"summary":str}]}]} '
                "Use 2-4 modules, 2-5 topics each. Titles only, no long text in summary."
            ),
            user=f"Create a learning path for: {name}",
        )
    except Exception as e:
        raise HTTPException(502, f"AI outline failed: {e}") from e
    mods = outline.get("modules") or []
    if not mods:
        raise HTTPException(502, "Empty outline from AI")

    sub = Subject(
        user_id=user.id,
        name=name[:255],
        icon="Sparkles",
        color="bg-emerald-600",
        description=f"Personal path: {name}",
    )
    db.add(sub)
    await db.flush()

    for mi, m in enumerate(mods):
        mod = Module(
            subject_id=sub.id,
            title=(m.get("title") or f"Module {mi+1}")[:255],
            description=(m.get("description") or "")[:2000],
            order=mi + 1,
        )
        db.add(mod)
        await db.flush()
        for ti, t in enumerate(m.get("topics") or []):
            top = Topic(
                module_id=mod.id,
                title=(t.get("title") or f"Topic {ti+1}")[:255],
                content=None,
                order=ti + 1,
            )
            db.add(top)
    await db.flush()

    return await _load_subject_with_tree(db, sub.id)
