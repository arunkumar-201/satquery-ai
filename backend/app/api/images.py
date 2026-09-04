from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.image import Image, ModalityEnum
from app.schemas.image import ImageUploadResponse, ImageMetadata
from app.services.image_service import process_upload, get_images_for_user, get_image_or_404
from app.services.storage_service import storage_service
from app.config import settings


router = APIRouter(prefix="/api/images", tags=["images"])


def _parse_optional_float(v: Optional[str]) -> Optional[float]:
    """Parse optional float from form data, treating empty strings as None."""
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (ValueError, TypeError):
        return None


@router.post("/upload", response_model=ImageUploadResponse)
async def upload_image(
    project_id: int = Form(...),
    file: UploadFile = File(...),
    modality: Optional[str] = Form(None),
    sensor: Optional[str] = Form(None),
    acquisition_date: Optional[str] = Form(None),
    latitude: Optional[str] = Form(None),
    longitude: Optional[str] = Form(None),
    resolution: Optional[str] = Form(None),
    bounding_box: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.project_service import get_project
    project = get_project(db, current_user.id, project_id)

    # Parse metadata
    meta = ImageMetadata(
        modality=ModalityEnum(modality) if modality else ModalityEnum.OTHER,
        sensor=sensor if sensor else None,
        acquisition_date=acquisition_date,
        latitude=_parse_optional_float(latitude),
        longitude=_parse_optional_float(longitude),
        resolution=_parse_optional_float(resolution),
        bounding_box=bounding_box if bounding_box else None,
    )

    image = process_upload(db, current_user, project, file, meta)
    return ImageUploadResponse.model_validate(image)


@router.get("/project/{project_id}", response_model=List[ImageUploadResponse])
def list_project_images(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.project_service import get_project
    get_project(db, current_user.id, project_id)
    images = get_images_for_user(db, current_user.id, project_id)
    return [ImageUploadResponse.model_validate(img) for img in images]


@router.get("/{image_id}", response_model=ImageUploadResponse)
def get_image(
    image_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    image = get_image_or_404(db, current_user.id, image_id)
    return ImageUploadResponse.model_validate(image)


@router.delete("/{image_id}")
def delete_image(
    image_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    image = get_image_or_404(db, current_user.id, image_id)
    # Delete the stored object before removing its database record.
    storage_service.delete(image.file_url)
    db.delete(image)
    db.commit()
    return {"detail": "Image deleted"}