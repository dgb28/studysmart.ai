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
from app.schemas.learning import SubjectList, SubjectRead

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
        
    # Sort modules and topics manually if needed, but the DB should ideally handle this.
    subject.modules = sorted(subject.modules, key=lambda x: x.order)
    for module in subject.modules:
        module.topics = sorted(module.topics, key=lambda x: x.order)
        
    return subject
