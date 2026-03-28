"""User attempts at a topic quiz."""
from sqlalchemy import Column, ForeignKey, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class QuizAttempt(BaseModel):
    __tablename__ = "quiz_attempts"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_quiz_id = Column(
        UUID(as_uuid=True),
        ForeignKey("topic_quizzes.id", ondelete="CASCADE"),
        nullable=False,
    )
    answers = Column(JSONB, nullable=False)  # list of selected indices
    score_percent = Column(Integer, nullable=False)
    passed = Column(Boolean, nullable=False, default=False)

    user = relationship("User", back_populates="quiz_attempts")
    topic = relationship("Topic", back_populates="quiz_attempts")
