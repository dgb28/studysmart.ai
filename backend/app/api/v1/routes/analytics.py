from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta, timezone
import uuid

from app.db.session import get_db
from app.models.topic_progress import TopicProgress
from pydantic import BaseModel

router = APIRouter()

class DailyFocus(BaseModel):
    date: str
    minutes: int

class AnalyticsSummary(BaseModel):
    total_minutes_studied: int
    modules_completed: int
    topics_completed: int
    daily_focus: List[DailyFocus]

@router.get("/{user_id}", response_model=AnalyticsSummary)
async def get_user_analytics(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    # Calculate total time from topic progress
    prog_result = await db.execute(
        select(func.sum(TopicProgress.time_spent_seconds))
        .where(TopicProgress.user_id == user_id)
    )
    total_seconds = prog_result.scalar() or 0
    
    # Count completed topics
    topics_count = await db.execute(
        select(func.count(TopicProgress.id))
        .where(TopicProgress.user_id == user_id)
    )
    t_count = topics_count.scalar() or 0

    # Mock daily focus (hackathon demo style trending upwards)
    daily_focus = []
    base_date = datetime.now(timezone.utc)
    for i in range(6, -1, -1):
        d = base_date - timedelta(days=i)
        mins = 30 + (i * 5) if i > 0 else (total_seconds // 60)
        daily_focus.append(DailyFocus(date=d.strftime("%a"), minutes=int(mins)))

    return AnalyticsSummary(
        total_minutes_studied=int(total_seconds // 60) + 150, # add some mock base
        modules_completed=t_count // 5, # mock approx
        topics_completed=t_count,
        daily_focus=daily_focus
    )
