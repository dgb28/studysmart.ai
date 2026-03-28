"""Users routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

router = APIRouter()


@router.get("/")
async def list_users(db: AsyncSession = Depends(get_db)):
    """List all users. TODO: implement."""
    return {"message": "list users — implement me"}


@router.get("/{user_id}")
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific user. TODO: implement."""
    return {"user_id": user_id, "message": "get user — implement me"}
