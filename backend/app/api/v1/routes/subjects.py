from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_
from typing import List
import uuid

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.subject import Subject
from app.models.module import Module
from app.models.user_topic_state import UserTopicState
from app.schemas.learning import SubjectList, SubjectRead, ModuleRead, TopicRead

router = APIRouter()


@router.get("/", response_model=List[SubjectList])
async def get_subjects(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Subject)
        .where(or_(Subject.user_id.is_(None), Subject.user_id == user.id))
        .order_by(Subject.name)
    )
    return result.scalars().all()


@router.get("/{subject_id}", response_model=SubjectRead)
async def get_subject_details(
    subject_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Subject)
        .options(
            selectinload(Subject.modules).selectinload(Module.topics)
        )
        .where(
            Subject.id == subject_id,
            or_(Subject.user_id.is_(None), Subject.user_id == user.id),
        )
    )
    subject = result.scalars().first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    subject.modules = sorted(subject.modules, key=lambda x: x.order)
    for module in subject.modules:
        module.topics = sorted(module.topics, key=lambda x: x.order)

    topic_ids = [t.id for m in subject.modules for t in m.topics]
    passed_ids: set = set()
    if topic_ids:
        st_res = await db.execute(
            select(UserTopicState.topic_id).where(
                UserTopicState.user_id == user.id,
                UserTopicState.topic_id.in_(topic_ids),
                UserTopicState.quiz_passed_at.isnot(None),
            )
        )
        passed_ids = set(st_res.scalars().all())

    modules_out: list[ModuleRead] = []
    for m in subject.modules:
        topics_out = [
            TopicRead(
                id=t.id,
                module_id=t.module_id,
                title=t.title,
                content=t.content,
                order=t.order,
                quiz_passed=t.id in passed_ids,
            )
            for t in m.topics
        ]
        modules_out.append(
            ModuleRead(
                id=m.id,
                subject_id=m.subject_id,
                title=m.title,
                description=m.description,
                order=m.order,
                topics=topics_out,
            )
        )

    return SubjectRead(
        id=subject.id,
        name=subject.name,
        icon=subject.icon,
        color=subject.color,
        description=subject.description,
        modules=modules_out,
    )
