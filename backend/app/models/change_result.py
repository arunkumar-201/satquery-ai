from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class ChangeResult(Base):
    __tablename__ = "change_results"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_results.id"), nullable=False, index=True)
    before_image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    after_image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    change_map_url = Column(String(500))
    geometry = Column(Text)  # JSON string for changed regions
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    analysis = relationship("AnalysisResult")
    before_image = relationship("Image", foreign_keys=[before_image_id])
    after_image = relationship("Image", foreign_keys=[after_image_id])


from app.models.analysis import AnalysisResult
AnalysisResult.change_results = relationship("ChangeResult", back_populates="analysis", cascade="all, delete-orphan")