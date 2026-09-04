from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float, func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class ModalityEnum(str, enum.Enum):
    OPTICAL = "OPTICAL"
    SAR = "SAR"
    MULTISPECTRAL = "MULTISPECTRAL"
    OTHER = "OTHER"


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    modality = Column(Enum(ModalityEnum), default=ModalityEnum.OTHER)
    sensor = Column(String(100))
    acquisition_date = Column(DateTime(timezone=True))
    latitude = Column(Float)
    longitude = Column(Float)
    resolution = Column(Float)
    bounding_box = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="images")