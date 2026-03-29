from fastapi import APIRouter, Depends, HTTPException
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


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _overlap_seconds_wall(seg_start: datetime, seg_end: datetime, d0: datetime, d1: datetime) -> int:
    """Seconds of [seg_start, seg_end) that fall in [d0, d1) (half-open on the right for seg_end)."""
    a = _as_utc(seg_start)
    b = _as_utc(seg_end)
    left = _as_utc(d0)
    right = _as_utc(d1)
    lo = max(a, left)
    hi = min(b, right)
    if hi <= lo:
        return 0
    return max(0, int((hi - lo).total_seconds()))


def _effective_focus_seconds(seg: TimerSegment, now: datetime) -> int:
    """Ended segments use stored duration; open segments use elapsed time since start (still running)."""
    if seg.ended_at is not None:
        return max(0, int(seg.duration_seconds or 0))
    st = seg.started_at
    if st is None:
        return 0
    if st.tzinfo is None:
        st = st.replace(tzinfo=timezone.utc)
    return max(0, int((now - st).total_seconds()))


class DailyFocus(BaseModel):
    date: str
    minutes: float
    tab_switches: int = 0
    keyboard_inputs: int = 0
    mouse_movements: int = 0
    window_blurs: int = 0


class InteractionWeekAvg(BaseModel):
    """Totals over the last 7 calendar days (for the interaction bar chart)."""

    focus_minutes: float
    tab_switches: float
    keyboard_inputs: float
    window_blurs: float
    mouse_movements: float


class AnalyticsSummary(BaseModel):
    total_minutes_studied: int
    modules_completed: int
    topics_completed: int
    daily_focus: List[DailyFocus]
    avg_session_minutes_last_week: float
    avg_session_minutes_this_week: float
    week_trend: str
    current_streak: int
    recommendation: str
    total_mouse_movements: int
    total_keyboard_inputs: int
    total_tab_changes: int
    total_window_blurs: int
    interaction_week_avg: InteractionWeekAvg


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

    open_res = await db.execute(
        select(TimerSegment)
        .where(TimerSegment.user_id == uid, TimerSegment.ended_at.is_(None))
        .order_by(TimerSegment.started_at.desc())
        .limit(1)
    )
    open_seg = open_res.scalars().first()

    total_mouse = sum(getattr(s, "mouse_movements", 0) or 0 for s in segments)
    total_kb = sum(getattr(s, "keyboard_inputs", 0) or 0 for s in segments)
    total_tabs = sum(getattr(s, "tab_changes", 0) or 0 for s in segments)
    total_blurs = sum(getattr(s, "window_blurs", 0) or 0 for s in segments)

    daily_focus: List[DailyFocus] = []
    daily_minutes: List[float] = []
    daily_tabs: List[float] = []
    daily_keys: List[float] = []
    daily_blurs: List[float] = []
    daily_mouse: List[float] = []

    for i in range(6, -1, -1):
        d0 = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        d1 = d0 + timedelta(days=1)
        day_segs = [
            s
            for s in segments
            if s.ended_at and d0 <= s.ended_at.replace(tzinfo=timezone.utc) < d1
        ]
        secs = sum(s.duration_seconds for s in day_segs)
        if open_seg and open_seg.started_at:
            secs += _overlap_seconds_wall(open_seg.started_at, now, d0, d1)
        tabs = sum(getattr(s, "tab_changes", 0) or 0 for s in day_segs)
        keys = sum(getattr(s, "keyboard_inputs", 0) or 0 for s in day_segs)
        mouse = sum(getattr(s, "mouse_movements", 0) or 0 for s in day_segs)
        blurs = sum(getattr(s, "window_blurs", 0) or 0 for s in day_segs)
        mins = secs / 60.0
        label = d0.strftime("%a")
        daily_focus.append(
            DailyFocus(
                date=label,
                minutes=round(mins, 2),
                tab_switches=tabs,
                keyboard_inputs=keys,
                mouse_movements=mouse,
                window_blurs=blurs,
            )
        )
        daily_minutes.append(mins)
        daily_tabs.append(float(tabs))
        daily_keys.append(float(keys))
        daily_blurs.append(float(blurs))
        daily_mouse.append(float(mouse))

    iw = InteractionWeekAvg(
        focus_minutes=round(sum(daily_minutes), 3),
        tab_switches=round(sum(daily_tabs), 3),
        keyboard_inputs=round(sum(daily_keys), 3),
        window_blurs=round(sum(daily_blurs), 3),
        mouse_movements=round(sum(daily_mouse), 3),
    )

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

    open_secs = _effective_focus_seconds(open_seg, now) if open_seg else 0
    timer_minutes_total = (sum(s.duration_seconds for s in segments) + open_secs) // 60
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
        total_mouse_movements=total_mouse,
        total_keyboard_inputs=total_kb,
        total_tab_changes=total_tabs,
        total_window_blurs=total_blurs,
        interaction_week_avg=iw,
    )


@router.get("/calendar/days", response_model=List[str])
async def get_calendar_active_days(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    uid = user.id
    seg_res = await db.execute(select(TimerSegment.started_at).where(TimerSegment.user_id == uid))
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
    uid = user.id
    now = datetime.now(timezone.utc)
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return []

    target_end = target_date + timedelta(days=1)

    from app.models.topic import Topic
    from app.models.module import Module

    res = await db.execute(
        select(TimerSegment, Topic, Module)
        .outerjoin(Topic, TimerSegment.topic_id == Topic.id)
        .outerjoin(Module, Topic.module_id == Module.id)
        .where(
            TimerSegment.user_id == uid,
            TimerSegment.started_at >= target_date,
            TimerSegment.started_at < target_end,
        )
    )

    groups: dict = {}
    for seg, topic, module in res:
        if not topic:
            continue
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
        g["focus_time_seconds"] += _effective_focus_seconds(seg, now)
        g["tab_switches"] += getattr(seg, "tab_changes", 0) or 0
        g["keyboard_inputs"] += getattr(seg, "keyboard_inputs", 0) or 0
        g["mouse_movements"] += getattr(seg, "mouse_movements", 0) or 0
        g["window_blurs"] += getattr(seg, "window_blurs", 0) or 0

    return [DailyActivityRow(**g) for g in groups.values()]


@router.get("/{user_id}", response_model=AnalyticsSummary)
async def get_user_analytics_legacy(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from app.models.user import User as U

    r = await db.execute(select(U).where(U.id == user_id))
    u = r.scalars().first()
    if not u:
        raise HTTPException(404, "User not found")
    return await get_my_analytics(db, u)
