"""One row per calendar day the user had meaningful activity (streak)."""
from sqlalchemy import Column, ForeignKey, Date, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class DailyActivity(BaseModel):
    __tablename__ = "daily_activities"
    __table_args__ = (UniqueConstraint("user_id", "activity_date", name="uq_user_activity_date"),)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_date = Column(Date, nullable=False, index=True)

    user = relationship("User", back_populates="daily_activities")
