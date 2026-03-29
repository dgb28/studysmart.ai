"""Focus timer segments (play → pause); used for analytics."""
from sqlalchemy import Column, ForeignKey, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class TimerSegment(BaseModel):
    __tablename__ = "timer_segments"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, default=0, nullable=False)
    mouse_movements = Column(Integer, default=0, nullable=False)
    keyboard_inputs = Column(Integer, default=0, nullable=False)
    tab_changes = Column(Integer, default=0, nullable=False)
    window_blurs = Column(Integer, default=0, nullable=False)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)

    user = relationship("User", back_populates="timer_segments")
    topic = relationship("Topic")
