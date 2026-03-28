from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta, timezone
import uuid

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.topic_progress import TopicProgress
from app.models.timer_segment import TimerSegment
from pydantic import BaseModel

from app.services.streak import current_streak

router = APIRouter()


class DailyFocus(BaseModel):
    date: str
    minutes: int


class AnalyticsSummary(BaseModel):
    total_minutes_studied: int
    modules_completed: int
    topics_completed: int
    daily_focus: List[DailyFocus]
    avg_session_minutes_last_week: float
    avg_session_minutes_this_week: float
    week_trend: str  # better | worse | on_track
    current_streak: int
    recommendation: str


@router.get("/me", response_model=AnalyticsSummary)
async def get_my_analytics(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    uid = user.id
    prog_result = await db.execute(
        select(func.coalesce(func.sum(TopicProgress.time_spent_seconds), 0)).where(TopicProgress.user_id == uid)
    )
    total_seconds = int(prog_result.scalar() or 0)

    topics_count = await db.execute(
        select(func.count(TopicProgress.id)).where(TopicProgress.user_id == uid)
    )
    t_count = int(topics_count.scalar() or 0)

    now = datetime.now(timezone.utc)
    seg_res = await db.execute(
        select(TimerSegment).where(TimerSegment.user_id == uid, TimerSegment.ended_at.isnot(None))
    )
    segments = list(seg_res.scalars().all())

    daily_focus: List[DailyFocus] = []
    for i in range(6, -1, -1):
        d0 = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        d1 = d0 + timedelta(days=1)
        secs = sum(
            s.duration_seconds
            for s in segments
            if s.ended_at and d0 <= s.ended_at.replace(tzinfo=timezone.utc) < d1
        )
        label = d0.strftime("%a")
        daily_focus.append(DailyFocus(date=label, minutes=max(0, secs // 60)))

    this_start = now - timedelta(days=7)
    prev_start = now - timedelta(days=14)
    prev_end = now - timedelta(days=7)

    def avg_len(segs):
        if not segs:
            return 0.0
        return sum(s.duration_seconds for s in segs) / 60.0 / len(segs)

    this_segs = [s for s in segments if s.ended_at and s.ended_at >= this_start]
    prev_segs = [s for s in segments if s.ended_at and prev_start <= s.ended_at < prev_end]
    avg_this = avg_len(this_segs)
    avg_prev = avg_len(prev_segs)

    if avg_prev < 1 and avg_this < 1:
        trend = "on_track"
    elif avg_this >= avg_prev * 1.05:
        trend = "better"
    elif avg_this <= avg_prev * 0.85 and avg_prev > 1:
        trend = "worse"
    else:
        trend = "on_track"

    timer_minutes_total = sum(s.duration_seconds for s in segments) // 60
    total_minutes = max(timer_minutes_total, total_seconds // 60)

    streak = await current_streak(db, uid)

    if trend == "worse":
        rec = "Your average focus block length dipped vs last week. Try 25-minute sessions with short breaks."
    elif timer_minutes_total < 60:
        rec = "Aim for at least 60 minutes of timer-tracked study this week to build a steady habit."
    elif streak < 3:
        rec = "Complete a daily goal or a short study block today to grow your streak."
    else:
        rec = "Strong consistency. Add one stretch goal on your learning path this week."

    return AnalyticsSummary(
        total_minutes_studied=int(total_minutes),
        modules_completed=max(0, t_count // 3),
        topics_completed=t_count,
        daily_focus=daily_focus,
        avg_session_minutes_last_week=round(avg_prev, 2),
        avg_session_minutes_this_week=round(avg_this, 2),
        week_trend=trend,
        current_streak=streak,
        recommendation=rec,
    )


@router.get("/{user_id}", response_model=AnalyticsSummary)
async def get_user_analytics_legacy(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Legacy: analytics for a specific user id (no auth). Prefer GET /analytics/me."""
    from app.models.user import User as U
    from fastapi import HTTPException

    r = await db.execute(select(U).where(U.id == user_id))
    u = r.scalars().first()
    if not u:
        raise HTTPException(404, "User not found")
    return await get_my_analytics(db, u)
