from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone
import uuid

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.study_session import StudySession
from app.models.topic_progress import TopicProgress
from app.schemas.session import StudySessionCreate, StudySessionRead, CompleteTopicRequest
from app.services.activity import record_activity_day

router = APIRouter()


@router.post("/start", response_model=StudySessionRead)
async def start_session(
    request: StudySessionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Check if an active session exists
    active_result = await db.execute(
        select(StudySession).where(
            StudySession.user_id == user.id,
            StudySession.is_active == True,
        )
    )
    active_session = active_result.scalars().first()
    if active_session:
        # End previous session
        active_session.is_active = False
        active_session.ended_at = datetime.now(timezone.utc)
        active_session.duration_seconds = int((active_session.ended_at - active_session.started_at).total_seconds())

    # Create new session
    session = StudySession(
        user_id=user.id,
        module_id=request.module_id,
        started_at=datetime.now(timezone.utc),
        is_active=True,
        topics_completed=[]
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.post("/{session_id}/complete-topic", response_model=StudySessionRead)
async def complete_topic(
    session_id: uuid.UUID,
    request: CompleteTopicRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(StudySession).where(StudySession.id == session_id))
    session = result.scalars().first()
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session.is_active:
        raise HTTPException(status_code=400, detail="Cannot update finished session")

    # Record progress
    progress = TopicProgress(
        user_id=session.user_id,
        topic_id=request.topic_id,
        completed_at=datetime.now(timezone.utc),
        time_spent_seconds=request.time_spent_seconds
    )
    db.add(progress)

    # Update session JSON array explicitly via mutation
    topics_list = list(session.topics_completed)
    topics_list.append(str(request.topic_id))
    session.topics_completed = topics_list

    # Note: Study Pulse Evaluation should ideally happen before this is committed if it was the last topic.
    
    await record_activity_day(db, session.user_id)
    await db.commit()
    await db.refresh(session)
    return session


@router.post("/{session_id}/end", response_model=StudySessionRead)
async def end_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(StudySession).where(StudySession.id == session_id))
    session = result.scalars().first()
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session.is_active:
        session.is_active = False
        session.ended_at = datetime.now(timezone.utc)
        session.duration_seconds = int((session.ended_at - session.started_at).total_seconds())
        await db.commit()
        await db.refresh(session)
        
    return session
