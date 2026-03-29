"""Cached quiz (10 MCQ) generated from topic content."""
from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class TopicQuiz(BaseModel):
    __tablename__ = "topic_quizzes"

    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    # MCQ: { "type":"mcq", "question", "options":[4], "correct_index", "explanation" }
    # Descriptive: { "type":"descriptive", "question", "ideal_answer", "explanation" }
    # Legacy: no "type", four options = MCQ only
    questions = Column(JSONB, nullable=False)

    topic = relationship("Topic", back_populates="quiz")
