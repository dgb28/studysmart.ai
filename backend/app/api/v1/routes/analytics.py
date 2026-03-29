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
    minutes: float
    tab_switches: int = 0
    keyboard_inputs: int = 0
    mouse_movements: int = 0
    window_blurs: int = 0


class AnalyticsSummary(BaseModel):
    total_minutes_studied: int
    modules_completed: int
    topics_completed: int
    daily_focus: List[DailyFocus]
    monthly_focus: List[DailyFocus]
    avg_session_minutes_last_week: float
    avg_session_minutes_this_week: float
    week_trend: str  # better | worse | on_track
    current_streak: int
    recommendation: str

    total_mouse_movements: int
    total_keyboard_inputs: int
    total_tab_changes: int
    total_window_blurs: int


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
        
        day_segs = [s for s in segments if s.ended_at and d0 <= s.ended_at.replace(tzinfo=timezone.utc) < d1]
        
        secs = sum(s.duration_seconds for s in day_segs)
        tabs = sum(getattr(s, "tab_changes", 0) for s in day_segs)
        keys = sum(getattr(s, "keyboard_inputs", 0) for s in day_segs)
        mouse = sum(getattr(s, "mouse_movements", 0) for s in day_segs)
        blurs = sum(getattr(s, "window_blurs", 0) for s in day_segs)
        
        label = d0.strftime("%b %d")
        daily_focus.append(DailyFocus(
            date=label, 
            minutes=round(secs / 60.0, 1),
            tab_switches=tabs,
            keyboard_inputs=keys,
            mouse_movements=mouse,
            window_blurs=blurs
        ))

    monthly_focus: List[DailyFocus] = []
    for i in range(29, -1, -1):
        d0 = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        d1 = d0 + timedelta(days=1)
        
        day_segs = [s for s in segments if s.ended_at and d0 <= s.ended_at.replace(tzinfo=timezone.utc) < d1]
        
        secs = sum(s.duration_seconds for s in day_segs)
        tabs = sum(getattr(s, "tab_changes", 0) for s in day_segs)
        keys = sum(getattr(s, "keyboard_inputs", 0) for s in day_segs)
        mouse = sum(getattr(s, "mouse_movements", 0) for s in day_segs)
        blurs = sum(getattr(s, "window_blurs", 0) for s in day_segs)
        
        label = d0.strftime("%b %d")
        monthly_focus.append(DailyFocus(
            date=label, 
            minutes=round(secs / 60.0, 1),
            tab_switches=tabs,
            keyboard_inputs=keys,
            mouse_movements=mouse,
            window_blurs=blurs
        ))

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

    total_mouse = sum(getattr(s, "mouse_movements", 0) for s in segments)
    total_kb = sum(getattr(s, "keyboard_inputs", 0) for s in segments)
    total_tabs = sum(getattr(s, "tab_changes", 0) for s in segments)
    total_blurs = sum(getattr(s, "window_blurs", 0) for s in segments)

    return AnalyticsSummary(
        total_minutes_studied=int(total_minutes),
        modules_completed=max(0, t_count // 3),
        topics_completed=t_count,
        daily_focus=daily_focus,
        monthly_focus=monthly_focus,
        avg_session_minutes_last_week=round(avg_prev, 2),
        avg_session_minutes_this_week=round(avg_this, 2),
        week_trend=trend,
        current_streak=streak,
        recommendation=rec,
        total_mouse_movements=total_mouse,
        total_keyboard_inputs=total_kb,
        total_tab_changes=total_tabs,
        total_window_blurs=total_blurs,
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


@router.get("/calendar/days", response_model=List[str])
async def get_calendar_active_days(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Return a list of dates 'YYYY-MM-DD' that have timer segment activity."""
    uid = user.id
    seg_res = await db.execute(
        select(TimerSegment.started_at).where(TimerSegment.user_id == uid)
    )
    dates = set()
    for (st,) in seg_res:
        if st:
            dates.add(st.astimezone(timezone.utc).strftime("%Y-%m-%d"))
    return sorted(list(dates))


class DailyActivityRow(BaseModel):
    topic_name: str
    module_name: str
    focus_time_seconds: int
    tab_switches: int
    keyboard_inputs: int
    mouse_movements: int
    window_blurs: int


@router.get("/calendar/day", response_model=List[DailyActivityRow])
async def get_calendar_day_details(date: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Get summarized topic activity for a specific 'YYYY-MM-DD'."""
    uid = user.id
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return []
    
    target_end = target_date + timedelta(days=1)
    
    from app.models.topic import Topic
    from app.models.module import Module
    import uuid
    
    res = await db.execute(
        select(TimerSegment, Topic, Module)
        .outerjoin(Topic, TimerSegment.topic_id == Topic.id)
        .outerjoin(Module, Topic.module_id == Module.id)
        .where(
            TimerSegment.user_id == uid,
            TimerSegment.started_at >= target_date,
            TimerSegment.started_at < target_end
        )
    )
    
    groups = {}
    for seg, topic, module in res:
        if not topic: continue
        
        t_id = topic.id
        t_name = topic.title
        m_name = module.title if module else "Unknown Module"
        
        if t_id not in groups:
            groups[t_id] = {
                "topic_name": t_name,
                "module_name": m_name,
                "focus_time_seconds": 0,
                "tab_switches": 0,
                "keyboard_inputs": 0,
                "mouse_movements": 0,
                "window_blurs": 0,
            }
        g = groups[t_id]
        g["focus_time_seconds"] += seg.duration_seconds
        g["tab_switches"] += getattr(seg, "tab_changes", 0)
        g["keyboard_inputs"] += getattr(seg, "keyboard_inputs", 0)
        g["mouse_movements"] += getattr(seg, "mouse_movements", 0)
        g["window_blurs"] += getattr(seg, "window_blurs", 0)
        
    return [DailyActivityRow(**g) for g in groups.values()]
