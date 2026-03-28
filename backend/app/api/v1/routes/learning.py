"""AI: home intent routing + dynamic learning path generation."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.subject import Subject
from app.models.module import Module
from app.models.topic import Topic
from app.schemas.learning import SubjectRead
from app.services.ai_client import chat_json

router = APIRouter()


class HomeIntentBody(BaseModel):
    text: str


class HomeIntentResponse(BaseModel):
    target: str  # daily_goals | analysis | learning_path
    learning_topic: str | None = None


class GeneratePathBody(BaseModel):
    topic_name: str


@router.post("/home/classify", response_model=HomeIntentResponse)
async def classify_home_intent(body: HomeIntentBody, user: User = Depends(get_current_user)):
    _ = user
    try:
        data = chat_json(
            system=(
                "Classify the user's message into exactly one navigation target for a study app. "
                'Reply JSON: {"target": "daily_goals"|"analysis"|"learning_path", '
                '"learning_topic": string or null}. '
                "Use daily_goals for todos, goals, tasks, schedule. "
                "Use analysis for stats, progress, how am I doing, analytics. "
                "Use learning_path for learning a subject, course, tutorial, teach me X. "
                "If learning_path, set learning_topic to the subject (e.g. DBMS)."
            ),
            user=body.text[:2000],
        )
        t = data.get("target", "learning_path")
        if t not in ("daily_goals", "analysis", "learning_path"):
            t = "learning_path"
        return HomeIntentResponse(target=t, learning_topic=data.get("learning_topic"))
    except Exception:
        return HomeIntentResponse(target="learning_path", learning_topic=body.text[:120])


@router.post("/paths/generate", response_model=SubjectRead)
async def generate_learning_path(
    body: GeneratePathBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    name = body.topic_name.strip()
    if len(name) < 2:
        raise HTTPException(400, "Topic name too short")
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

    # reload with relationships
    from sqlalchemy.orm import selectinload
    from sqlalchemy.future import select as fselect

    res = await db.execute(
        fselect(Subject)
        .options(selectinload(Subject.modules).selectinload(Module.topics))
        .where(Subject.id == sub.id)
    )
    s = res.scalars().first()
    s.modules = sorted(s.modules, key=lambda x: x.order)
    for mo in s.modules:
        mo.topics = sorted(mo.topics, key=lambda x: x.order)
    return s
