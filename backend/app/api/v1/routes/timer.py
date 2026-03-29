"""Global focus timer: start / pause segments."""
from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.timer_segment import TimerSegment
from app.services.activity import record_activity_day

router = APIRouter()


class TimerEvents(BaseModel):
    mouse_movements: int = 0
    keyboard_inputs: int = 0
    tab_changes: int = 0
    window_blurs: int = 0

class TimerActionBody(BaseModel):
    action: str  # "start" | "pause"
    events: TimerEvents | None = None
    topic_id: uuid.UUID | None = None

class TimerStateResponse(BaseModel):
    running: bool
    open_segment_id: uuid.UUID | None = None
    started_at: datetime | None = None


@router.get("/state", response_model=TimerStateResponse)
async def timer_state(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    res = await db.execute(
        select(TimerSegment)
        .where(TimerSegment.user_id == user.id, TimerSegment.ended_at.is_(None))
        .order_by(TimerSegment.started_at.desc())
        .limit(1)
    )
    seg = res.scalars().first()
    if not seg:
        return TimerStateResponse(running=False)
    return TimerStateResponse(running=True, open_segment_id=seg.id, started_at=seg.started_at)


@router.post("/action", response_model=TimerStateResponse)
async def timer_action(
    body: TimerActionBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    res = await db.execute(
        select(TimerSegment)
        .where(TimerSegment.user_id == user.id, TimerSegment.ended_at.is_(None))
        .order_by(TimerSegment.started_at.desc())
        .limit(1)
    )
    open_seg = res.scalars().first()

    if body.action == "start":
        if open_seg:
            return TimerStateResponse(running=True, open_segment_id=open_seg.id, started_at=open_seg.started_at)
        seg = TimerSegment(user_id=user.id, topic_id=body.topic_id, started_at=now, ended_at=None, duration_seconds=0)
        db.add(seg)
        await db.flush()
        return TimerStateResponse(running=True, open_segment_id=seg.id, started_at=seg.started_at)

    if body.action == "pause":
        if not open_seg:
            return TimerStateResponse(running=False)
        open_seg.ended_at = now
        open_seg.duration_seconds = max(0, int((open_seg.ended_at - open_seg.started_at).total_seconds()))
        
        if body.events:
            open_seg.mouse_movements = getattr(open_seg, "mouse_movements", 0) + body.events.mouse_movements
            open_seg.keyboard_inputs = getattr(open_seg, "keyboard_inputs", 0) + body.events.keyboard_inputs
            open_seg.tab_changes = getattr(open_seg, "tab_changes", 0) + body.events.tab_changes
            open_seg.window_blurs = getattr(open_seg, "window_blurs", 0) + body.events.window_blurs

        if open_seg.duration_seconds >= 60:
            await record_activity_day(db, user.id)
        await db.flush()
        return TimerStateResponse(running=False)

    from fastapi import HTTPException

    raise HTTPException(400, "action must be start or pause")
