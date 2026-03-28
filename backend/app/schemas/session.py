import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class StudySessionCreate(BaseModel):
    module_id: uuid.UUID
    user_id: uuid.UUID # Typically extracted from token, but added here for the hackathon simplicity

class StudySessionRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    module_id: uuid.UUID
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: int
    topics_completed: List[str]
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class CompleteTopicRequest(BaseModel):
    topic_id: uuid.UUID
    time_spent_seconds: int
