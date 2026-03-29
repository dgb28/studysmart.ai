"""Daily goals CRUD + calendar summaries."""
from datetime import date, datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.daily_goal import DailyGoal
from app.services.activity import record_activity_day
from app.services.goal_suggestions import (
    get_or_create_profile,
    record_completion_adaptation,
    record_module_activity,
    sync_today_suggestions,
)

router = APIRouter()


class GoalCreate(BaseModel):
    title: str
    target_date: date


class GoalUpdate(BaseModel):
    title: str | None = None
    target_date: date | None = None
    completed: bool | None = None


class GoalRead(BaseModel):
    id: uuid.UUID
    title: str
    target_date: date
    completed: bool
    completed_at: datetime | None
    is_suggested: bool = False
    user_edited: bool = False
    model_config = ConfigDict(from_attributes=True)


class DaySummary(BaseModel):
    day: date
    total: int
    completed: int
    percent: int


class ActivityBody(BaseModel):
    module_id: uuid.UUID
    topic_id: uuid.UUID | None = None
    event: str  # content_viewed | quiz_passed | topic_opened


@router.post("/activity")
async def record_study_activity(
    body: ActivityBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Called from module study page to adapt future suggestions."""
    await record_module_activity(
        db, user.id, body.module_id, body.topic_id, body.event
    )
    return {"ok": True}


@router.post("/suggestions/sync")
async def sync_goal_suggestions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Fill today's list toward 5 tasks using learning-path context (adds only empty slots)."""
    return await sync_today_suggestions(db, user)


@router.get("/", response_model=list[GoalRead])
async def list_goals(
    from_date: date | None = None,
    to_date: date | None = None,
    include_past_incomplete: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = select(DailyGoal).where(DailyGoal.user_id == user.id)
    if from_date:
        q = q.where(DailyGoal.target_date >= from_date)
    if to_date:
        q = q.where(DailyGoal.target_date <= to_date)
    if not include_past_incomplete:
        today = datetime.now(timezone.utc).date()
        q = q.where(
            (DailyGoal.target_date >= today)
            | (DailyGoal.completed == False)
        )
    q = q.order_by(DailyGoal.target_date, DailyGoal.created_at)
    res = await db.execute(q)
    return list(res.scalars().all())


@router.get("/calendar", response_model=list[DaySummary])
async def calendar_summary(
    from_date: date,
    to_date: date,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goals_res = await db.execute(
        select(DailyGoal).where(
            DailyGoal.user_id == user.id,
            DailyGoal.target_date >= from_date,
            DailyGoal.target_date <= to_date,
        )
    )
    goals = goals_res.scalars().all()
    by_day: dict[date, list[DailyGoal]] = {}
    for g in goals:
        by_day.setdefault(g.target_date, []).append(g)
    out: list[DaySummary] = []
    d = from_date
    while d <= to_date:
        gs = by_day.get(d, [])
        total = len(gs)
        done = sum(1 for x in gs if x.completed)
        pct = int(100 * done / total) if total else 0
        out.append(DaySummary(day=d, total=total, completed=done, percent=pct))
        d = date.fromordinal(d.toordinal() + 1)
    return out


@router.get("/day/{day}", response_model=list[GoalRead])
async def goals_for_day(
    day: date,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    res = await db.execute(
        select(DailyGoal).where(DailyGoal.user_id == user.id, DailyGoal.target_date == day)
    )
    return list(res.scalars().all())


@router.post("/", response_model=GoalRead)
async def create_goal(
    body: GoalCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    g = DailyGoal(user_id=user.id, title=body.title, target_date=body.target_date, completed=False)
    db.add(g)
    await db.flush()
    await db.refresh(g)
    return g


@router.patch("/{goal_id}", response_model=GoalRead)
async def update_goal(
    goal_id: uuid.UUID,
    body: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    res = await db.execute(select(DailyGoal).where(DailyGoal.id == goal_id, DailyGoal.user_id == user.id))
    g = res.scalars().first()
    if not g:
        raise HTTPException(404, "Goal not found")
    if body.title is not None:
        if body.title.strip() != g.title.strip():
            g.user_edited = True
        g.title = body.title
    if body.target_date is not None:
        g.target_date = body.target_date
    if body.completed is not None:
        g.completed = body.completed
        g.completed_at = datetime.now(timezone.utc) if body.completed else None
        if body.completed:
            await record_activity_day(db, user.id)
            prof = await get_or_create_profile(db, user.id)
            record_completion_adaptation(prof, g.target_date)
    await db.flush()
    await db.refresh(g)
    return g


@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    res = await db.execute(select(DailyGoal).where(DailyGoal.id == goal_id, DailyGoal.user_id == user.id))
    g = res.scalars().first()
    if not g:
        raise HTTPException(404, "Goal not found")
    await db.execute(delete(DailyGoal).where(DailyGoal.id == goal_id))
    return {"ok": True}
