from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.chat import ChatSession
from app.schemas.chat import (
    ChatSessionCreate, ChatSessionResponse,
    ChatMessageCreate, ChatMessageResponse,
    QueryRequest, QueryResponse
    , ChatRequest, ChatResponse
)
from app.services.chat_service import (
    create_chat_session, get_chat_sessions, get_chat_session,
    add_message, get_messages, get_recent_context
)
from app.services.analysis_service import run_analysis
from app.services.image_service import get_image_or_404
from app.services.project_service import get_project
from ai.inference.inference_service import inference_service


router = APIRouter(prefix="/api/chat", tags=["chat"])
compat_router = APIRouter(prefix="/api", tags=["query"])


@router.post("/sessions", response_model=ChatSessionResponse)
def create_session(data: ChatSessionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_project(db, current_user.id, data.project_id)
    session = create_chat_session(db, current_user.id, data.project_id, data.language)
    return ChatSessionResponse.model_validate(session)


@router.get("/sessions/{project_id}", response_model=List[ChatSessionResponse])
def list_sessions(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_project(db, current_user.id, project_id)
    sessions = get_chat_sessions(db, current_user.id, project_id)
    return [ChatSessionResponse.model_validate(s) for s in sessions]


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def get_session_messages(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_chat_session(db, current_user.id, session_id)
    messages = get_messages(db, session_id)
    return [ChatMessageResponse.model_validate(m) for m in messages]


@router.get("/session/{session_id}", response_model=ChatSessionResponse)
def get_session(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = get_chat_session(db, current_user.id, session_id)
    return ChatSessionResponse.model_validate(session)


@router.delete("/sessions/{session_id}")
def delete_chat_session(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.chat_service import delete_session
    delete_session(db, current_user.id, session_id)
    return {"detail": "Chat session deleted"}


@router.get("/history")
def history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.created_at.desc()).all()
    return [
        {
            "id": session.id,
            "project_id": session.project_id,
            "language": session.language,
            "created_at": session.created_at,
            "messages": [
                {"role": message.role.value, "message": message.message, "language": message.language, "created_at": message.created_at}
                for message in get_messages(db, session.id)
            ],
        }
        for session in sessions
    ]


@router.post("/query", response_model=QueryResponse)
async def process_query(data: QueryRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Validate project and images
    get_project(db, current_user.id, data.project_id)
    for img_id in data.image_ids:
        image = get_image_or_404(db, current_user.id, img_id)
        if image.project_id != data.project_id:
            raise HTTPException(status_code=400, detail="Image does not belong to this project")

    # Get or create chat session
    sessions = get_chat_sessions(db, current_user.id, data.project_id)
    if sessions:
        session = sessions[0]  # Use most recent session
    else:
        session = create_chat_session(db, current_user.id, data.project_id, data.language)

    # Save user message
    user_msg = add_message(db, session.id, "user", data.message, data.language)

    # Run analysis
    try:
        analysis = await run_analysis(
            db, current_user.id, data.project_id, data.image_ids, data.message, data.language
        )
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=502, detail="AI analysis is unavailable; check the provider configuration") from exc

    # Update analysis with query_id
    analysis.query_id = user_msg.id
    db.commit()

    # Apply translation layer when provider is demo and language is not English
    from app.services.ai_provider import get_provider
    provider_name = get_provider().name
    from app.services.translation_service import translate_answer
    final_answer = translate_answer(analysis.answer, data.language, provider_name)

    # Save assistant message
    assistant_msg = add_message(db, session.id, "assistant", final_answer, data.language)

    import ast
    try:
        result_data = ast.literal_eval(analysis.analysis_metadata) if analysis.analysis_metadata else {}
    except (ValueError, SyntaxError):
        result_data = {}

    return QueryResponse(
        query_id=user_msg.id,
        analysis_type=analysis.analysis_type,
        answer=final_answer,
        confidence=analysis.confidence,
        evidence=result_data.get("evidence", {}),
        metadata={k: v for k, v in result_data.items() if k != "evidence"},
    )


@router.post("/message", response_model=ChatResponse)
async def process_chat_message(data: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_project(db, current_user.id, data.project_id)
    sessions = get_chat_sessions(db, current_user.id, data.project_id)
    session = sessions[0] if sessions else create_chat_session(db, current_user.id, data.project_id, data.language)
    recent_messages = get_recent_context(db, session.id)
    user_message = add_message(db, session.id, "user", data.message, data.language)

    from app.services.ai_provider import get_provider
    provider = get_provider()
    provider_messages = [
        {"role": message.role.value.lower(), "content": message.message}
        for message in recent_messages
    ]
    provider_messages.append({"role": "user", "content": data.message})
    try:
        answer = await provider.chat(provider_messages)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=502, detail="AI chat is unavailable; check the provider configuration")
    assistant_message = add_message(db, session.id, "assistant", answer, data.language)
    return ChatResponse(
        message_id=assistant_message.id,
        answer=answer,
        language=data.language,
        metadata={"provider": provider.name, "is_fallback": provider.name == "demo"},
    )


@router.get("/ai/status")
def ai_status():
    return inference_service.get_status()


@compat_router.post("/query", response_model=QueryResponse)
async def query_alias(data: QueryRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return await process_query(data, current_user, db)


@compat_router.get("/history")
def history_alias(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return history(current_user, db)