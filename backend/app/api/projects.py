from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectWithStats
from app.services.project_service import (
    create_project, get_projects, get_project, delete_project, get_project_stats
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse)
def create_project_endpoint(data: ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = create_project(db, current_user.id, data.name, data.description)
    return ProjectResponse.model_validate(project)


@router.get("", response_model=List[ProjectWithStats])
def list_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    projects = get_projects(db, current_user.id)
    result = []
    for p in projects:
        stats = get_project_stats(db, current_user.id, p.id)
        result.append(ProjectWithStats(
            id=p.id,
            user_id=p.user_id,
            name=p.name,
            description=p.description,
            created_at=p.created_at,
            image_count=stats["image_count"],
            analysis_count=stats["analysis_count"],
        ))
    return result


@router.get("/{project_id}", response_model=ProjectWithStats)
def get_project_endpoint(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stats = get_project_stats(db, current_user.id, project_id)
    p = stats["project"]
    return ProjectWithStats(
        id=p.id,
        user_id=p.user_id,
        name=p.name,
        description=p.description,
        created_at=p.created_at,
        image_count=stats["image_count"],
        analysis_count=stats["analysis_count"],
    )


@router.delete("/{project_id}")
def delete_project_endpoint(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    delete_project(db, current_user.id, project_id)
    return {"detail": "Project deleted"}