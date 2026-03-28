"""Topic model."""
from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import BaseModel


class Topic(BaseModel):
    __tablename__ = "topics"

    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)  # Markdown text
    order = Column(Integer, default=0, nullable=False)

    module = relationship("Module", back_populates="topics")
