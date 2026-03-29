"""Lightweight DDL for dev DBs where Alembic was not run — add columns SQLAlchemy create_all skips."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def ensure_postgres_schema(conn: AsyncConnection) -> None:
    """Add columns/indexes that were introduced after the first deploy (existing tables are not altered by create_all)."""
    await conn.execute(
        text(
            """
            ALTER TABLE subjects
            ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE
            """
        )
    )
    await conn.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_subjects_user_id ON subjects (user_id)
            """
        )
    )
