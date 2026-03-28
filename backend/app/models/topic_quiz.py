"""Cached quiz (10 MCQ) generated from topic content."""
from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class TopicQuiz(BaseModel):
    __tablename__ = "topic_quizzes"

    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    # [{ "question": str, "options": [str,...], "correct_index": int, "explanation": str }]
    questions = Column(JSONB, nullable=False)

    topic = relationship("Topic", back_populates="quiz")
