"""AI + adaptive daily goal suggestions tied to learning paths."""
from __future__ import annotations

import json
import re
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.daily_goal import DailyGoal
from app.models.module import Module
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.topic_progress import TopicProgress
from app.models.user import User
from app.models.user_goal_profile import UserGoalProfile
from app.services.ai_client import chat_json

PROMPT_PATH = Path(__file__).resolve().parents[2] / "prompts" / "daily_goals_suggestions.txt"
TARGET_ACTIVE = 5


def _load_prompt_guide() -> str:
    if PROMPT_PATH.is_file():
        return PROMPT_PATH.read_text(encoding="utf-8")
    return "Generate actionable daily study tasks as JSON: {\"tasks\": [\"...\"]}"


async def get_or_create_profile(db: AsyncSession, user_id: uuid.UUID) -> UserGoalProfile:
    r = await db.execute(select(UserGoalProfile).where(UserGoalProfile.user_id == user_id))
    p = r.scalars().first()
    if p:
        return p
    p = UserGoalProfile(user_id=user_id, activity_events=[], adaptation={})
    db.add(p)
    await db.flush()
    return p


async def user_has_learning_paths(db: AsyncSession, user_id: uuid.UUID) -> bool:
    r = await db.execute(select(Subject.id).where(Subject.user_id == user_id).limit(1))
    return r.scalars().first() is not None


async def build_study_context(db: AsyncSession, user: User) -> str:
    res = await db.execute(
        select(Subject)
        .options(selectinload(Subject.modules).selectinload(Module.topics))
        .where(Subject.user_id == user.id)
        .order_by(Subject.name)
    )
    subjects = res.scalars().all()
    lines: list[str] = []
    for s in subjects:
        lines.append(f"Subject: {s.name}")
        if s.description:
            lines.append(f"  Description: {s.description[:400]}")
        for m in sorted(s.modules, key=lambda x: x.order):
            desc = (m.description or "")[:280]
            lines.append(f"  Module: {m.title} — {desc}")
            for t in sorted(m.topics, key=lambda x: x.order):
                lines.append(f"    Topic: {t.title}")

    pr = await db.execute(select(TopicProgress.topic_id).where(TopicProgress.user_id == user.id))
    done = [str(x) for x in pr.scalars().all()]
    if done:
        lines.append(f"Completed topic ids: {', '.join(done[:40])}{'…' if len(done) > 40 else ''}")

    return "\n".join(lines) if lines else "(no learning paths yet)"


def _fallback_tasks(count: int, context: str, blocked: set[str]) -> list[str]:
    """Cheap suggestions when OpenAI is unavailable."""
    topics = re.findall(r"Topic:\s*(.+)", context)
    modules = re.findall(r"Module:\s*([^—]+)", context)
    pool: list[str] = []
    for t in topics[:12]:
        t = t.strip()
        if len(t) < 2:
            continue
        pool.append(f"Spend 20 minutes reviewing: {t[:80]}")
        pool.append(f"Write 3 bullet takeaways on {t[:60]}")
    for m in modules[:8]:
        m = m.strip()
        if len(m) < 2:
            continue
        pool.append(f"Skim module notes for “{m[:70]}” and list one open question")
    if not pool:
        pool = [
            "Review yesterday’s toughest concept for 15 minutes",
            "Do one short practice problem without looking at notes",
            "Summarize what you learned in 5 sentences",
            "Teach the main idea out loud in 2 minutes",
            "Plan tomorrow’s study focus in 3 bullets",
        ]
    out: list[str] = []
    for p in pool:
        pl = p.lower()
        if pl in blocked:
            continue
        blocked.add(pl)
        out.append(p[:512])
        if len(out) >= count:
            break
    return out[:count]


async def _ai_tasks(
    count: int,
    context: str,
    profile: UserGoalProfile,
    blocked: set[str],
) -> list[str]:
    guide = _load_prompt_guide()
    system = (
        guide
        + "\n\nYou MUST respond with valid JSON only: {\"tasks\": [\"task1\", ...]}."
        + f" The tasks array must have exactly {count} strings (or fewer only if impossible)."
    )
    payload = {
        "count": count,
        "study_context": context[:12000],
        "already_today_titles": list(blocked),
        "recent_activity": (profile.activity_events or [])[-20:],
        "adaptation": profile.adaptation or {},
    }
    try:
        out = chat_json(system, json.dumps(payload, default=str))
        raw = out.get("tasks") or []
        tasks = [str(t).strip() for t in raw if str(t).strip()]
        uniq: list[str] = []
        seen: set[str] = set()
        for t in tasks:
            tl = t.lower()
            if tl in blocked or tl in seen:
                continue
            seen.add(tl)
            uniq.append(t[:512])
            if len(uniq) >= count:
                break
        if len(uniq) < count:
            more = _fallback_tasks(count - len(uniq), context, blocked | {x.lower() for x in uniq})
            uniq.extend(more)
        return uniq[:count]
    except Exception:
        return _fallback_tasks(count, context, blocked)


async def sync_today_suggestions(db: AsyncSession, user: User) -> dict[str, Any]:
    """Ensure today has up to TARGET_ACTIVE incomplete goals by adding AI suggestions."""
    today = datetime.now(timezone.utc).date()
    if not await user_has_learning_paths(db, user.id):
        return {"created": 0, "reason": "no_learning_paths"}

    res = await db.execute(
        select(DailyGoal).where(DailyGoal.user_id == user.id, DailyGoal.target_date == today)
    )
    today_goals = list(res.scalars().all())
    incomplete = [g for g in today_goals if not g.completed]
    slots = max(0, TARGET_ACTIVE - len(incomplete))
    if slots == 0:
        return {"created": 0, "reason": "at_capacity", "incomplete": len(incomplete)}

    blocked = {g.title.strip().lower() for g in today_goals}
    profile = await get_or_create_profile(db, user.id)
    context = await build_study_context(db, user)
    titles = await _ai_tasks(slots, context, profile, blocked)

    created = 0
    for title in titles:
        tl = title.strip().lower()
        if not tl or tl in blocked:
            continue
        g = DailyGoal(
            user_id=user.id,
            title=title[:512],
            target_date=today,
            completed=False,
            is_suggested=True,
            user_edited=False,
            source_meta={"kind": "ai_suggested"},
        )
        db.add(g)
        blocked.add(tl)
        created += 1
    await db.flush()
    return {"created": created, "reason": "ok", "slots_requested": slots}


def record_completion_adaptation(profile: UserGoalProfile, on_day: date) -> None:
    ad = dict(profile.adaptation or {})
    key = on_day.isoformat()
    dc = dict(ad.get("daily_completions") or {})
    dc[key] = int(dc.get(key, 0)) + 1
    # keep last 21 days
    keys = sorted(dc.keys())[-21:]
    ad["daily_completions"] = {k: dc[k] for k in keys}
    profile.adaptation = ad


async def record_module_activity(
    db: AsyncSession,
    user_id: uuid.UUID,
    module_id: uuid.UUID,
    topic_id: uuid.UUID | None,
    event: str,
) -> None:
    profile = await get_or_create_profile(db, user_id)
    ev = profile.activity_events or []
    ev.append(
        {
            "module_id": str(module_id),
            "topic_id": str(topic_id) if topic_id else None,
            "event": event,
            "at": datetime.now(timezone.utc).isoformat(),
        }
    )
    profile.activity_events = ev[-120:]
    ad = dict(profile.adaptation or {})
    mw = dict(ad.get("module_weights") or {})
    mid = str(module_id)
    mw[mid] = min(3.0, float(mw.get(mid, 1.0)) + 0.12)
    ad["module_weights"] = mw
    profile.adaptation = ad
