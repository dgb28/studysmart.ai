"""Top-level API v1 router — aggregates all route modules."""
from fastapi import APIRouter
from app.api.v1.routes import (
    auth,
    items,
    users,
    subjects,
    sessions,
    evaluations,
    analytics,
    goals,
    timer,
    leaderboard,
    learning,
    topics_ai,
    webrtc,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(items.router, prefix="/items", tags=["Items"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["Learning"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["Study Sessions"])
api_router.include_router(evaluations.router, prefix="/evaluations", tags=["AI Evaluations"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(goals.router, prefix="/goals", tags=["Goals"])
api_router.include_router(timer.router, prefix="/timer", tags=["Timer"])
api_router.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])
api_router.include_router(learning.router, prefix="/learning", tags=["Learning AI"])
api_router.include_router(topics_ai.router, prefix="/topic", tags=["Topic AI"])
api_router.include_router(webrtc.router, prefix="/rooms/webrtc", tags=["Study Rooms"])

# Add more routers here as you build features:
# from app.api.v1.routes import posts, uploads, etc.
