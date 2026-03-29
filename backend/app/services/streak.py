"""Compute current learning streak from daily_activities."""
from datetime import timedelta, datetime, timezone
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.daily_activity import DailyActivity


async def current_streak(db: AsyncSession, user_id: uuid.UUID) -> int:
    result = await db.execute(select(DailyActivity.activity_date).where(DailyActivity.user_id == user_id))
    dates_set = {r[0] for r in result.all()}
    if not dates_set:
        return 0
    today = datetime.now(timezone.utc).date()
    cursor = today
    if cursor not in dates_set:
        cursor = today - timedelta(days=1)
    if cursor not in dates_set:
        return 0
    streak = 0
    while cursor in dates_set:
        streak += 1
        cursor -= timedelta(days=1)
    return streak
