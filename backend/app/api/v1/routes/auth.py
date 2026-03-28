"""Auth routes — login, signup, refresh, logout."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

router = APIRouter()


@router.post("/signup")
async def signup(db: AsyncSession = Depends(get_db)):
    """Register a new user. TODO: implement."""
    return {"message": "signup endpoint — implement me"}


@router.post("/login")
async def login(db: AsyncSession = Depends(get_db)):
    """Login and receive JWT tokens. TODO: implement."""
    return {"message": "login endpoint — implement me"}


@router.post("/refresh")
async def refresh():
    """Refresh access token. TODO: implement."""
    return {"message": "refresh endpoint — implement me"}


@router.get("/me")
async def me():
    """Get current user info. TODO: implement."""
    return {"message": "me endpoint — implement me"}
