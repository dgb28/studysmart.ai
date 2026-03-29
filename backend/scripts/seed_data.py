import asyncio
import sys
import os
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base  # noqa: F401
import app.models  # noqa: F401 — register all models on Base.metadata
from app.models.user import User

# Optional dev user for local login (password: testpass123)
MOCK_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")


async def seed_data():
    print("Connecting to DB...")
    engine = create_async_engine(settings.DATABASE_URL, echo=False)

    print("Creating tables if they do not exist...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as db:
        print("Seeding default user for testing (password: testpass123)...")

        existing = await db.execute(select(User).where(User.id == MOCK_USER_ID))
        if not existing.scalars().first():
            user = User(
                id=MOCK_USER_ID,
                email="test@studypulse.com",
                hashed_password=hash_password("testpass123"),
                full_name="Test Student",
                is_active=True,
            )
            db.add(user)
            await db.commit()
            print("Test user created.")
        else:
            print("Test user already exists.")

        print("Done. Learning paths are created via the app (Generate path), not from this script.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_data())
