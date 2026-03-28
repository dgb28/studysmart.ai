"""User model."""
from sqlalchemy import Column, String, Boolean, Enum
from app.models.base import BaseModel
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"


class User(BaseModel):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.user, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
