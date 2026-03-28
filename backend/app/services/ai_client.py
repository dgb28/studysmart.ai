"""OpenAI JSON helpers for paths, content, quizzes, intent."""
import json
from typing import Any

from openai import OpenAI

from app.core.config import settings


def _client() -> OpenAI:
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not set")
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def chat_json(system: str, user: str, model: str | None = None) -> dict[str, Any]:
    model = model or settings.OPENAI_MODEL
    client = _client()
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
        temperature=0.4,
    )
    text = resp.choices[0].message.content or "{}"
    return json.loads(text)


def chat_text(system: str, user: str, model: str | None = None) -> str:
    model = model or settings.OPENAI_MODEL
    client = _client()
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.5,
    )
    return (resp.choices[0].message.content or "").strip()
