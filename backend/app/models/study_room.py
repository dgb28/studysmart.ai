from sqlalchemy import Column, String, Integer, JSON
from app.models.base import BaseModel

class StudyRoom(BaseModel):
    __tablename__ = "study_rooms"

    name = Column(String(255), nullable=False, unique=True)
    description = Column(String, nullable=True)
    max_participants = Column(Integer, default=12)
    tags = Column(JSON, default=list)  # ["SQL", "Focus", "No-Music"]
