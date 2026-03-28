"""Study session model."""
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class StudySession(BaseModel):
    __tablename__ = "study_sessions"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, default=0, nullable=False)
    
    topics_completed = Column(JSONB, default=list, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships are optional for simple queries but good for ORM
    user = relationship("User")
    module = relationship("Module")
