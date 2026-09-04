from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.project import Project
from app.schemas.project import ProjectCreate


def create_project(db: Session, user_id: int, name: str, description: str = None) -> Project:
    project = Project(user_id=user_id, name=name, description=description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def get_projects(db: Session, user_id: int):
    return db.query(Project).filter(Project.user_id == user_id).order_by(Project.created_at.desc()).all()


def get_project(db: Session, user_id: int, project_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def delete_project(db: Session, user_id: int, project_id: int) -> bool:
    project = get_project(db, user_id, project_id)
    db.delete(project)
    db.commit()
    return True


def get_project_stats(db: Session, user_id: int, project_id: int) -> dict:
    from app.models.image import Image
    from app.models.analysis import AnalysisResult
    project = get_project(db, user_id, project_id)
    image_count = db.query(Image).filter(Image.project_id == project_id).count()
    analysis_count = db.query(AnalysisResult).filter(AnalysisResult.project_id == project_id).count()
    return {
        "project": project,
        "image_count": image_count,
        "analysis_count": analysis_count,
    }