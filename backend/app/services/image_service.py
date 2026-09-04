from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from pathlib import Path
from sqlalchemy.orm import Session

from app.config import settings
from app.models.image import Image, ModalityEnum
from app.schemas.image import ImageMetadata
from app.services.storage_service import storage_service
from app.utils.files import validate_image_file, safe_filename

try:
    from PIL import Image as PILImage
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


def get_images_for_user(db: Session, user_id: int, project_id: int = None):
    """Return images belonging to a user's project."""
    from app.models.project import Project
    query = (
        db.query(Image)
        .join(Project, Project.id == Image.project_id)
        .filter(Project.user_id == user_id)
    )
    if project_id is not None:
        query = query.filter(Image.project_id == project_id)
    return query.all()


def get_image_or_404(db: Session, user_id: int, image_id: int) -> Image:
    from app.models.project import Project
    image = (
        db.query(Image)
        .join(Project, Project.id == Image.project_id)
        .filter(Image.id == image_id, Project.user_id == user_id)
        .first()
    )
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image


def read_basic_metadata(path: Path) -> dict:
    """Read basic metadata from an image file without requiring geospatial deps."""
    meta = {}
    if PIL_AVAILABLE and path.exists():
        try:
            with PILImage.open(path) as img:
                meta["width"] = img.width
                meta["height"] = img.height
                if img.format:
                    meta["format"] = img.format
        except Exception:
            pass

    # Try to read GeoTIFF metadata with rasterio if available
    try:
        import rasterio
        with rasterio.open(path) as src:
            if src.crs:
                meta["crs"] = str(src.crs)
            bounds = src.bounds
            if bounds:
                meta["bounds"] = {
                    "left": bounds.left,
                    "bottom": bounds.bottom,
                    "right": bounds.right,
                    "top": bounds.top,
                }
    except Exception:
        pass

    return meta


def process_upload(db: Session, user, project, file, metadata: ImageMetadata) -> Image:
    # Validate file
    validate_image_file(file.filename or "", file.content_type or "", settings.max_upload_size_bytes)

    # Check size
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > settings.max_upload_size_bytes:
        raise HTTPException(status_code=400, detail="File size exceeds the maximum allowed limit")
    if size <= 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    original_filename = Path(file.filename or "image.png").name
    safe_name = safe_filename(original_filename)
    try:
        url = storage_service.save(file.file, "uploads", safe_name)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Image storage is unavailable") from exc

    # Read metadata
    abs_path = storage_service.absolute_path(url)
    if PIL_AVAILABLE:
        try:
            with PILImage.open(abs_path) as uploaded_image:
                uploaded_image.verify()
        except (OSError, SyntaxError):
            if abs_path and abs_path.exists():
                abs_path.unlink()
            raise HTTPException(status_code=400, detail="Uploaded file is not a valid image")
    basic_meta = {}
    geo_meta = {}
    if abs_path:
        basic_meta = read_basic_metadata(abs_path)

    # Determine modality & geographic coords from metadata / geotiff
    modality = metadata.modality if metadata.modality else ModalityEnum.OTHER
    lat = metadata.latitude
    lon = metadata.longitude

    # If GeoTIFF bounds with a CRS, derive a representative coordinate when none provided
    if lat is None and lon is None and "bounds" in basic_meta and basic_meta.get("crs"):
        b = basic_meta["bounds"]
        try:
            from rasterio.warp import transform as rasterio_transform
            from rasterio.crs import CRS
            left, bottom, right, top = b["left"], b["bottom"], b["right"], b["top"]
            src_crs = CRS.from_string(basic_meta["crs"])
            if src_crs.is_geographic:
                lon = (left + right) / 2.0
                lat = (bottom + top) / 2.0
            else:
                xs = [left, right]
                ys = [bottom, top]
                lons, lats = rasterio_transform(src_crs, CRS.from_epsg(4326), xs, ys)
                lon = sum(lons) / len(lons)
                lat = sum(lats) / len(lats)
        except Exception:
            pass

    image = Image(
        project_id=project.id,
        filename=original_filename,
        file_url=url,
        modality=modality,
        sensor=metadata.sensor,
        acquisition_date=metadata.acquisition_date,
        latitude=lat,
        longitude=lon,
        resolution=metadata.resolution,
        bounding_box=metadata.bounding_box,
    )
    try:
        db.add(image)
        db.commit()
        db.refresh(image)
        return image
    except SQLAlchemyError:
        db.rollback()
        if abs_path and abs_path.exists():
            abs_path.unlink()
        raise HTTPException(status_code=500, detail="Unable to save image metadata")