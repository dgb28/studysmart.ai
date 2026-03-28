"""
Agent Memory — Conversation history and context management.
Uses Redis for distributed state so multiple agents share memory.
"""
import json
from datetime import datetime
import redis.asyncio as aioredis
import os


class AgentMemory:
    """Shared agent memory backed by Redis."""

    def __init__(self, session_id: str, redis_url: str = None):
        self.session_id = session_id
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._client: aioredis.Redis | None = None

    async def _get_client(self) -> aioredis.Redis:
        if self._client is None:
            self._client = aioredis.from_url(self.redis_url)
        return self._client

    async def add_message(self, role: str, content: str) -> None:
        """Append a message to the conversation history."""
        client = await self._get_client()
        message = {"role": role, "content": content, "ts": datetime.utcnow().isoformat()}
        await client.rpush(f"agent:memory:{self.session_id}", json.dumps(message))
        # Keep last 100 messages
        await client.ltrim(f"agent:memory:{self.session_id}", -100, -1)

    async def get_history(self) -> list[dict]:
        """Retrieve full conversation history."""
        client = await self._get_client()
        raw = await client.lrange(f"agent:memory:{self.session_id}", 0, -1)
        return [json.loads(m) for m in raw]

    async def clear(self) -> None:
        """Clear conversation history."""
        client = await self._get_client()
        await client.delete(f"agent:memory:{self.session_id}")

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
