from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from typing import List, Optional

from app.models.chat import ChatSession, ChatMessage, MessageRoleEnum
from app.models.image import Image
from app.schemas.chat import ChatSessionCreate, ChatMessageCreate
from app.services.image_service import get_image_or_404
from app.services.project_service import get_project


def create_chat_session(db: Session, user_id: int, project_id: int, language: str = "en") -> ChatSession:
    get_project(db, user_id, project_id)  # Validate ownership
    session = ChatSession(user_id=user_id, project_id=project_id, language=language)
    try:
        db.add(session)
        db.commit()
        db.refresh(session)
        return session
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to create chat session")


def get_chat_sessions(db: Session, user_id: int, project_id: int) -> List[ChatSession]:
    return db.query(ChatSession).filter(
        ChatSession.user_id == user_id,
        ChatSession.project_id == project_id
    ).order_by(ChatSession.created_at.desc()).all()


def get_chat_session(db: Session, user_id: int, session_id: int) -> ChatSession:
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session


def add_message(db: Session, session_id: int, role: str, message: str, language: str = "en") -> ChatMessage:
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    msg = ChatMessage(
        session_id=session_id,
        role=MessageRoleEnum(role),
        message=message,
        language=language,
    )
    try:
        db.add(msg)
        db.commit()
        db.refresh(msg)
        return msg
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to save chat message")


def get_messages(db: Session, session_id: int, limit: int = 50) -> List[ChatMessage]:
    return db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).limit(limit).all()


def get_recent_context(db: Session, session_id: int, max_messages: int = 10) -> List[ChatMessage]:
    return db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.desc()).limit(max_messages).all()[::-1]


def delete_session(db: Session, user_id: int, session_id: int) -> bool:
    session = get_chat_session(db, user_id, session_id)
    db.delete(session)
    db.commit()
    return True