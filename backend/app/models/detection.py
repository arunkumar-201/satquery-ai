from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_results.id"), nullable=False, index=True)
    class_name = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    geometry = Column(Text, nullable=False)  # JSON string for bbox or polygon
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    analysis = relationship("AnalysisResult")


from app.models.analysis import AnalysisResult
AnalysisResult.detections = relationship("Detection", back_populates="analysis", cascade="all, delete-orphan")