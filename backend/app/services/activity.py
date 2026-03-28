"""Mark calendar days with user activity (streaks)."""
from datetime import date, datetime, timezone
import uuid

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.daily_activity import DailyActivity


async def record_activity_day(db: AsyncSession, user_id: uuid.UUID, d: date | None = None) -> None:
    d = d or datetime.now(timezone.utc).date()
    stmt = (
        insert(DailyActivity)
        .values(user_id=user_id, activity_date=d)
        .on_conflict_do_nothing(index_elements=["user_id", "activity_date"])
    )
    await db.execute(stmt)
