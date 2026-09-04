from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum


class AnalysisTypeEnum(str, Enum):
    IMAGE_ANALYSIS = "IMAGE_ANALYSIS"
    IMAGE_CAPTIONING = "IMAGE_CAPTIONING"
    VISUAL_QA = "VISUAL_QA"
    OBJECT_DETECTION = "OBJECT_DETECTION"
    REGION_GROUNDING = "REGION_GROUNDING"
    CHANGE_DETECTION = "CHANGE_DETECTION"
    MULTITEMPORAL_ANALYSIS = "MULTITEMPORAL_ANALYSIS"
    CROSS_MODAL_ANALYSIS = "CROSS_MODAL_ANALYSIS"
    LAND_COVER_ANALYSIS = "LAND_COVER_ANALYSIS"
    GENERAL = "GENERAL"


class Evidence(BaseModel):
    boxes: List[Dict[str, Any]] = []
    polygons: List[Dict[str, Any]] = []
    coordinates: List[Dict[str, Any]] = []
    image_url: Optional[str] = None
    change_map_url: Optional[str] = None
    highlighted_image_url: Optional[str] = None


class AnalysisMetadata(BaseModel):
    model: Optional[str] = None
    provider: Optional[str] = None
    is_fallback: bool = False
    processing_time_ms: Optional[int] = None


class AnalysisResultResponse(BaseModel):
    analysis_id: int
    analysis_type: str
    answer: str
    confidence: Optional[float]
    evidence: Evidence
    metadata: AnalysisMetadata
    created_at: datetime

    class Config:
        from_attributes = True


class AnalysisCreate(BaseModel):
    project_id: int
    query_id: int
    analysis_type: str
    answer: str
    confidence: Optional[float]
    result_url: Optional[str]
    metadata: Optional[str] = None