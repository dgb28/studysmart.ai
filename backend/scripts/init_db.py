import asyncio
import sys
import os

# Add the parent directory to sys.path to allow absolute imports
sys.path.append(os.getcwd())

from app.db.base import Base
from app.db.session import engine
import app.models  # noqa: Ensure all models are loaded

async def create():
    async with engine.begin() as conn:
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully.")

if __name__ == '__main__':
    asyncio.run(create())
