"""Subject model."""
from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Subject(BaseModel):
    __tablename__ = "subjects"

    name = Column(String(255), nullable=False, index=True)
    icon = Column(String(255), nullable=True)
    color = Column(String(50), nullable=True)
    description = Column(String, nullable=True)

    modules = relationship("Module", back_populates="subject", cascade="all, delete-orphan")
