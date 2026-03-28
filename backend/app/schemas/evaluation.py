from pydantic import BaseModel, Field
from typing import List

class ProofOfLearningRequest(BaseModel):
    topic_title: str
    explanation: str

class ProofOfLearningResponse(BaseModel):
    clarity: int = Field(description="Clarity score from 0 to 100")
    correctness: int = Field(description="Correctness score from 0 to 100")
    gaps: List[str] = Field(description="List of specific knowledge gaps or misconceptions identified")
    recommendations: List[str] = Field(description="List of brief, actionable recommendations to improve understanding")
