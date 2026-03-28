import uuid
from pydantic import BaseModel, EmailStr, ConfigDict


class UserSignup(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str | None
    model_config = ConfigDict(from_attributes=True)
