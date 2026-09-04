from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List, Union
from enum import Enum


class ModalityEnum(str, Enum):
    OPTICAL = "OPTICAL"
    SAR = "SAR"
    MULTISPECTRAL = "MULTISPECTRAL"
    OTHER = "OTHER"


class ImageUploadResponse(BaseModel):
    id: int
    project_id: int
    filename: str
    file_url: str
    modality: ModalityEnum
    sensor: Optional[str]
    acquisition_date: Optional[datetime]
    latitude: Optional[float]
    longitude: Optional[float]
    resolution: Optional[float]
    bounding_box: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ImageMetadata(BaseModel):
    modality: ModalityEnum = ModalityEnum.OTHER
    sensor: Optional[str] = None
    acquisition_date: Optional[Union[datetime, str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    resolution: Optional[float] = None
    bounding_box: Optional[str] = None

    @field_validator("acquisition_date", mode="before")
    @classmethod
    def parse_acquisition_date(cls, v):
        """Parse acquisition_date from multiple formats: ISO (YYYY-MM-DD), DD-MM-YYYY, DD/MM/YYYY."""
        if v is None or v == "":
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, str):
            # Try ISO format first (YYYY-MM-DD)
            for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d"):
                try:
                    return datetime.strptime(v, fmt)
                except ValueError:
                    continue
            raise ValueError(
                f"Invalid date format: '{v}'. Expected YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY"
            )
        return v