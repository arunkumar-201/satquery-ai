from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, func
from sqlalchemy.orm import relationship
from app.database import Base


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    query_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=True, index=True)
    analysis_type = Column(String(100), nullable=False)
    answer = Column(Text, nullable=False)
    confidence = Column(Float)
    result_url = Column(String(500))
    analysis_metadata = Column("metadata", Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="analysis_results")
