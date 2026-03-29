"""
Reset a user's login password by email (development / recovery).

Use when the account exists (signup says "email already used") but login fails,
e.g. after DB changes or a lost password.

Usage (from host, with Compose running):
  docker compose exec backend python scripts/reset_user_password.py "you@example.com" "NewStrongPassword123"

Or locally (from backend/, with .env / DATABASE_URL set):
  python scripts/reset_user_password.py "you@example.com" "NewStrongPassword123"
"""
import argparse
import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base  # noqa: F401
import app.models  # noqa: F401
from app.models.user import User


async def main(email: str, new_password: str) -> None:
    if len(new_password) < 8:
        print("Password should be at least 8 characters.")
        sys.exit(1)

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(func.lower(User.email) == email.lower()))
        user = result.scalars().first()
        if not user:
            print(f"No user found with email: {email}")
            sys.exit(1)
        user.hashed_password = hash_password(new_password)
        await db.commit()
        print(f"Password updated for {email} (id={user.id}). You can log in now.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reset app login password for an email.")
    parser.add_argument("email", help="Account email (exactly as stored)")
    parser.add_argument("password", help="New password")
    args = parser.parse_args()
    asyncio.run(main(args.email.strip(), args.password))
