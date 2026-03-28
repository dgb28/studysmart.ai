"""
Import all models here to ensure Alembic and SQLAlchemy can discover them
from app.db.base import Base mechanism.
"""
from app.models.base import BaseModel
from app.models.user import User
from app.models.subject import Subject
from app.models.module import Module
from app.models.topic import Topic
from app.models.study_session import StudySession
from app.models.topic_progress import TopicProgress
from app.models.daily_goal import DailyGoal
from app.models.timer_segment import TimerSegment
from app.models.daily_activity import DailyActivity
from app.models.topic_quiz import TopicQuiz
from app.models.quiz_attempt import QuizAttempt
from app.models.user_topic_state import UserTopicState

__all__ = [
    "BaseModel",
    "User",
    "Subject",
    "Module",
    "Topic",
    "StudySession",
    "TopicProgress",
    "DailyGoal",
    "TimerSegment",
    "DailyActivity",
    "TopicQuiz",
    "QuizAttempt",
    "UserTopicState",
]
