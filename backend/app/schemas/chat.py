from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List
from enum import Enum


class MessageRoleEnum(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatSessionCreate(BaseModel):
    project_id: int
    language: str = "en"


class ChatSessionResponse(BaseModel):
    id: int
    user_id: int
    project_id: int
    language: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    role: MessageRoleEnum
    message: str
    language: str = "en"


class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: MessageRoleEnum
    message: str
    language: str
    created_at: datetime

    class Config:
        from_attributes = True


class QueryRequest(BaseModel):
    project_id: int
    image_ids: List[int] = []
    message: str = Field(..., min_length=1, max_length=10000)
    language: str = "en"

    @field_validator('image_ids')
    @classmethod
    def validate_image_ids(cls, v):
        if not v or len(v) == 0:
            raise ValueError('At least one image ID is required for image analysis')
        for img_id in v:
            if not isinstance(img_id, int) or img_id <= 0:
                raise ValueError(f'Invalid image ID: {img_id}')
        return v


class ChatRequest(BaseModel):
    project_id: int
    message: str = Field(..., min_length=1, max_length=10000)
    language: str = "en"


class ChatResponse(BaseModel):
    message_id: int
    answer: str
    language: str
    metadata: dict = {}


class QueryResponse(BaseModel):
    query_id: int
    analysis_type: str
    answer: str
    confidence: Optional[float]
    evidence: dict
    metadata: dict