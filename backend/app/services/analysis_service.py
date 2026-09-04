from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from typing import List, Optional

from app.models.analysis import AnalysisResult
from app.models.image import Image
from app.models.chat import ChatMessage
from app.models.project import Project
from app.schemas.analysis import AnalysisCreate, Evidence, AnalysisMetadata
from app.services.image_service import get_image_or_404
from app.services.project_service import get_project
from app.services.chat_service import get_chat_session, add_message
from ai.inference.inference_service import inference_service
from app.services.storage_service import storage_service
from ai.agent.router import classify_query



async def run_analysis(
    db: Session,
    user_id: int,
    project_id: int,
    image_ids: List[int],
    query: str,
    language: str = "en",
) -> AnalysisResult:
    """Run full analysis pipeline and store results."""
    # Validate image IDs are provided
    if not image_ids or len(image_ids) == 0:
        raise HTTPException(status_code=400, detail="At least one satellite image must be selected")

    # Validate all image IDs are positive integers
    for img_id in image_ids:
        if not isinstance(img_id, int) or img_id <= 0:
            raise HTTPException(status_code=400, detail=f"Invalid image ID: {img_id}")

    routing = classify_query(query)
    required_images = routing.get("required_images", 1)
    if len(image_ids) != required_images:
        if required_images == 2:
            raise HTTPException(status_code=400, detail="This analysis requires exactly two satellite images")
        raise HTTPException(status_code=400, detail="This analysis requires exactly one satellite image")

    # Validate ownership
    get_project(db, user_id, project_id)

    # Validate images belong to user
    images = []
    for img_id in image_ids:
        img = get_image_or_404(db, user_id, img_id)
        if img.project_id != project_id:
            raise HTTPException(status_code=400, detail="Image does not belong to this project")
        images.append(img)

    # Get absolute file paths
    image_paths = []
    for img in images:
        path = storage_service.absolute_path(img.file_url)
        if not path and img.file_url.startswith("http"):
            image_paths.append(img.file_url)
            continue
        if not path:
            raise HTTPException(status_code=400, detail=f"Image file not found: {img.filename}")
        image_paths.append(str(path))

    # Get modalities
    modalities = [img.modality.value for img in images]

    # Run inference
    result = await inference_service.analyze(image_paths, query, language, modalities)

    # Store analysis result
    analysis = AnalysisResult(
        project_id=project_id,
        query_id=None,  # Will be set if we have a chat session
        analysis_type=result["analysis_type"],
        answer=result["answer"],
        confidence=result["confidence"],
        result_url=None,
        analysis_metadata=str(result.get("metadata", {})),
    )
    try:
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to save analysis result")

    return analysis


def get_analysis_results(db: Session, user_id: int, project_id: int) -> List[AnalysisResult]:
    get_project(db, user_id, project_id)
    return db.query(AnalysisResult).filter(
        AnalysisResult.project_id == project_id
    ).order_by(AnalysisResult.created_at.desc()).all()


def get_analysis_result(db: Session, user_id: int, analysis_id: int) -> AnalysisResult:
    from app.models.project import Project
    analysis = db.query(AnalysisResult).join(Project).filter(
        AnalysisResult.id == analysis_id,
        Project.user_id == user_id
    ).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    return analysis


def get_analysis_history(db: Session, user_id: int, project_id: int = None, limit: int = 50) -> List[AnalysisResult]:
    query = db.query(AnalysisResult).join(Project).filter(Project.user_id == user_id)
    if project_id:
        query = query.filter(AnalysisResult.project_id == project_id)
    return query.order_by(AnalysisResult.created_at.desc()).limit(limit).all()