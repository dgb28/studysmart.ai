"""Topic progress model."""
from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class TopicProgress(BaseModel):
    __tablename__ = "topic_progress"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    
    completed_at = Column(DateTime(timezone=True), nullable=False)
    time_spent_seconds = Column(Integer, default=0, nullable=False)

    user = relationship("User")
    topic = relationship("Topic")
