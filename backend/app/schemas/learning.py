import uuid
from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class TopicBase(BaseModel):
    title: str
    content: Optional[str] = None
    order: int = 0

class TopicRead(TopicBase):
    id: uuid.UUID
    module_id: uuid.UUID
    quiz_passed: bool = False
    model_config = ConfigDict(from_attributes=True)

class ModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0

class ModuleRead(ModuleBase):
    id: uuid.UUID
    subject_id: uuid.UUID
    topics: List[TopicRead] = []
    model_config = ConfigDict(from_attributes=True)

class SubjectBase(BaseModel):
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None

class SubjectRead(SubjectBase):
    id: uuid.UUID
    modules: List[ModuleRead] = []
    model_config = ConfigDict(from_attributes=True)

class SubjectList(SubjectBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)
