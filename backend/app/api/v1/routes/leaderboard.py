"""Leaderboard: composite score from study time, streak, goals, quizzes."""
from datetime import datetime, timedelta, timezone
import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.timer_segment import TimerSegment
from app.models.daily_goal import DailyGoal
from app.models.quiz_attempt import QuizAttempt
from app.services.streak import current_streak

router = APIRouter()

WEEK = timedelta(days=7)


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: uuid.UUID
    display_name: str
    score: float
    study_minutes_7d: int
    streak: int
    goals_done_7d: int
    quiz_passes_7d: int


class MyRankResponse(BaseModel):
    rank: int
    total_users: int
    score: float
    study_minutes_7d: int
    streak: int


def _score(study_min: int, streak: int, goals_done: int, goals_total: int, quiz_pass: int) -> float:
    g_rate = goals_done / goals_total if goals_total else 0.0
    return (
        100
        * (
            0.35 * min(study_min / 420, 1.0)
            + 0.25 * min(streak / 30, 1.0)
            + 0.20 * g_rate
            + 0.20 * min(quiz_pass / 15, 1.0)
        )
    )


async def _user_metrics(db: AsyncSession, user_id: uuid.UUID, since: datetime):
    study = await db.execute(
        select(func.coalesce(func.sum(TimerSegment.duration_seconds), 0)).where(
            TimerSegment.user_id == user_id,
            TimerSegment.ended_at.isnot(None),
            TimerSegment.ended_at >= since,
        )
    )
    study_sec = int(study.scalar() or 0)
    goals = await db.execute(
        select(DailyGoal).where(
            DailyGoal.user_id == user_id,
            DailyGoal.target_date >= since.date(),
            DailyGoal.completed.is_(True),
        )
    )
    goals_done = len(goals.scalars().all())
    goals_tot = await db.execute(
        select(func.count(DailyGoal.id)).where(
            DailyGoal.user_id == user_id,
            DailyGoal.target_date >= since.date(),
        )
    )
    goals_total = int(goals_tot.scalar() or 0)
    q = await db.execute(
        select(func.count(QuizAttempt.id)).where(
            QuizAttempt.user_id == user_id,
            QuizAttempt.passed.is_(True),
            QuizAttempt.created_at >= since,
        )
    )
    quiz_pass = int(q.scalar() or 0)
    streak = await current_streak(db, user_id)
    return study_sec // 60, streak, goals_done, goals_total, quiz_pass


@router.get("/board", response_model=list[LeaderboardEntry])
async def leaderboard(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    since = datetime.now(timezone.utc) - WEEK
    users_res = await db.execute(select(User).where(User.is_active.is_(True)))
    users = users_res.scalars().all()
    rows: list[tuple[User, float, int, int, int, int]] = []
    for u in users:
        sm, st, gd, gt, qp = await _user_metrics(db, u.id, since)
        sc = _score(sm, st, gd, gt, qp)
        rows.append((u, sc, sm, st, gd, qp))
    rows.sort(key=lambda x: -x[1])
    out: list[LeaderboardEntry] = []
    for i, (u, sc, sm, st, gd, qp) in enumerate(rows, start=1):
        out.append(
            LeaderboardEntry(
                rank=i,
                user_id=u.id,
                display_name=u.full_name or u.email.split("@")[0],
                score=round(sc, 2),
                study_minutes_7d=sm,
                streak=st,
                goals_done_7d=gd,
                quiz_passes_7d=qp,
            )
        )
    return out


@router.get("/me", response_model=MyRankResponse)
async def my_rank(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    since = datetime.now(timezone.utc) - WEEK
    users_res = await db.execute(select(User).where(User.is_active.is_(True)))
    users = users_res.scalars().all()
    scored: list[tuple[uuid.UUID, float]] = []
    for u in users:
        sm, st, gd, gt, qp = await _user_metrics(db, u.id, since)
        scored.append((u.id, _score(sm, st, gd, gt, qp)))
    scored.sort(key=lambda x: -x[1])
    rank = next((i + 1 for i, (uid, _) in enumerate(scored) if uid == user.id), len(scored))
    sm, st, gd, gt, qp = await _user_metrics(db, user.id, since)
    my_sc = _score(sm, st, gd, gt, qp)
    return MyRankResponse(
        rank=rank,
        total_users=len(scored),
        score=round(my_sc, 2),
        study_minutes_7d=sm,
        streak=st,
    )
