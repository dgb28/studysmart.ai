"""Smoke tests — keep CI pytest target non-empty."""

import os

import pytest


def test_settings_loads():
    from app.core.config import settings

    assert settings.APP_NAME
    assert settings.JWT_ALGORITHM == "HS256"


@pytest.mark.skipif(
    os.environ.get("GITHUB_ACTIONS") != "true",
    reason="Postgres required (runs in GitHub Actions CI)",
)
@pytest.mark.asyncio
async def test_database_connects():
    from sqlalchemy import text
    from app.db.session import engine

    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
