"""Per-user progress on a topic: content done + quiz gate."""
from sqlalchemy import Column, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy import UniqueConstraint
from app.models.base import BaseModel


class UserTopicState(BaseModel):
    __tablename__ = "user_topic_states"
    __table_args__ = (UniqueConstraint("user_id", "topic_id", name="uq_user_topic_state"),)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    content_viewed = Column(Boolean, default=False, nullable=False)
    quiz_passed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="topic_states")
    topic = relationship("Topic", back_populates="user_states")
