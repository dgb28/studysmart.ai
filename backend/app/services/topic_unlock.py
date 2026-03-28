"""Linear unlock: complete previous topic's quiz before next."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.topic import Topic
from app.models.module import Module
from app.models.user_topic_state import UserTopicState


async def is_topic_unlocked(db: AsyncSession, user_id: uuid.UUID, topic: Topic) -> bool:
    mod_res = await db.execute(select(Module).where(Module.id == topic.module_id))
    module = mod_res.scalars().first()
    if not module:
        return False
    topics_res = await db.execute(
        select(Topic).where(Topic.module_id == module.id).order_by(Topic.order, Topic.created_at)
    )
    topics = list(topics_res.scalars().all())
    if not topics or topics[0].id == topic.id:
        return True
    idx = next((i for i, t in enumerate(topics) if t.id == topic.id), -1)
    if idx <= 0:
        return True
    prev = topics[idx - 1]
    st_res = await db.execute(
        select(UserTopicState).where(UserTopicState.user_id == user_id, UserTopicState.topic_id == prev.id)
    )
    st = st_res.scalars().first()
    return bool(st and st.quiz_passed_at)
