"""Adaptive context for AI-suggested daily goals."""
from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class UserGoalProfile(BaseModel):
    """One row per user: module activity + rolling stats for suggestion quality."""

    __tablename__ = "user_goal_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    activity_events = Column(JSONB, nullable=False)
    adaptation = Column(JSONB, nullable=False)

    user = relationship("User", back_populates="goal_profile", uselist=False)
