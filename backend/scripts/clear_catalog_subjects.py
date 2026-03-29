"""Remove all global catalog subjects (user_id IS NULL) and cascaded modules/topics/progress."""
import asyncio
import os
import sys

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.config import settings
from app.db.base import Base  # noqa: F401
import app.models  # noqa: F401
from app.models.subject import Subject


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with AsyncSessionLocal() as db:
        res = await db.execute(delete(Subject).where(Subject.user_id.is_(None)))
        await db.commit()
        n = res.rowcount if res.rowcount is not None else 0
        print(f"Deleted {n} catalog subject(s) (global paths with user_id NULL).")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
