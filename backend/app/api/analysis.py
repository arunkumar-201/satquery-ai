import time
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.analysis import AnalysisResult
from app.schemas.analysis import AnalysisResultResponse, Evidence, AnalysisMetadata
from app.services.analysis_service import get_analysis_results, get_analysis_result, get_analysis_history, run_analysis
from app.schemas.chat import QueryRequest
from app.core.logging_config import log_analysis


router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("", response_model=AnalysisResultResponse)
async def create_analysis(data: QueryRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db), request: Request = None):
    start_time = time.perf_counter()
    success = False
    error = None
    try:
        analysis = await run_analysis(db, current_user.id, data.project_id, data.image_ids, data.message, data.language)
        import ast
        try:
            meta = ast.literal_eval(analysis.analysis_metadata) if analysis.analysis_metadata else {}
        except (ValueError, SyntaxError):
            meta = {}
        success = True
        return AnalysisResultResponse(
            analysis_id=analysis.id,
            analysis_type=analysis.analysis_type,
            answer=analysis.answer,
            confidence=analysis.confidence,
            evidence=Evidence(**meta.get("evidence", {})) if meta.get("evidence") else Evidence(),
            metadata=AnalysisMetadata(**{k: v for k, v in meta.items() if k != "evidence"}),
            created_at=analysis.created_at,
        )
    except Exception as e:
        error = str(e)
        raise
    finally:
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        log_analysis(
            user_id=current_user.id,
            project_id=data.project_id,
            analysis_type="chat_analysis",
            duration_ms=duration_ms,
            success=success,
            error=error,
        )


@router.get("/project/{project_id}", response_model=List[AnalysisResultResponse])
def list_analyses(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    analyses = get_analysis_results(db, current_user.id, project_id)
    result = []
    for a in analyses:
        try:
            import ast
            meta = ast.literal_eval(a.analysis_metadata) if a.analysis_metadata else {}
        except Exception:
            meta = {}
        result.append(AnalysisResultResponse(
            analysis_id=a.id,
            analysis_type=a.analysis_type,
            answer=a.answer,
            confidence=a.confidence,
            evidence=Evidence(**meta.get("evidence", {})) if meta.get("evidence") else Evidence(),
            metadata=AnalysisMetadata(**{k: v for k, v in meta.items() if k != "evidence"}),
            created_at=a.created_at,
        ))
    return result


@router.get("/{analysis_id}", response_model=AnalysisResultResponse)
def get_analysis(analysis_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    analysis = get_analysis_result(db, current_user.id, analysis_id)
    try:
        import ast
        meta = ast.literal_eval(analysis.analysis_metadata) if analysis.analysis_metadata else {}
    except Exception:
        meta = {}
    return AnalysisResultResponse(
        analysis_id=analysis.id,
        analysis_type=analysis.analysis_type,
        answer=analysis.answer,
        confidence=analysis.confidence,
        evidence=Evidence(**meta.get("evidence", {})) if meta.get("evidence") else Evidence(),
        metadata=AnalysisMetadata(**{k: v for k, v in meta.items() if k != "evidence"}),
        created_at=analysis.created_at,
    )


@router.get("/history/user", response_model=List[AnalysisResultResponse])
def user_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    analyses = get_analysis_history(db, current_user.id, limit=50)
    result = []
    for a in analyses:
        try:
            import ast
            meta = ast.literal_eval(a.analysis_metadata) if a.analysis_metadata else {}
        except Exception:
            meta = {}
        result.append(AnalysisResultResponse(
            analysis_id=a.id,
            analysis_type=a.analysis_type,
            answer=a.answer,
            confidence=a.confidence,
            evidence=Evidence(**meta.get("evidence", {})) if meta.get("evidence") else Evidence(),
            metadata=AnalysisMetadata(**{k: v for k, v in meta.items() if k != "evidence"}),
            created_at=a.created_at,
        ))
    return result