"""Subject model."""
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Subject(BaseModel):
    __tablename__ = "subjects"

    name = Column(String(255), nullable=False, index=True)
    icon = Column(String(255), nullable=True)
    color = Column(String(50), nullable=True)
    description = Column(String, nullable=True)
    # NULL = global catalog (seed); set for user-generated paths (e.g. "learn DBMS")
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)

    user = relationship("User", back_populates="subjects")
    modules = relationship("Module", back_populates="subject", cascade="all, delete-orphan")
