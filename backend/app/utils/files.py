import os
import uuid
from pathlib import Path
from fastapi import HTTPException

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff"}
ALLOWED_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/tiff",
    "image/tif",
    "application/octet-stream",  # some browsers send this for tiff
}


def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def validate_image_file(filename: str, content_type: str = None, size_limit: int = None):
    ext = get_file_extension(filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported image format")

    if content_type and content_type not in ALLOWED_CONTENT_TYPES and not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Unsupported image format")


def safe_filename(original: str) -> str:
    """Generate a safe server-side filename, never trusting client input."""
    ext = get_file_extension(original)
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".png"
    unique = uuid.uuid4().hex
    return f"{unique}{ext}"


def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)


def normalize_image_path(url: str) -> str:
    """Convert a stored file_url to a path usable by the server."""
    if url.startswith("http"):
        # Extract the storage-relative path
        parts = url.split("/")
        # /uploads/filename.jpg -> look for storage/uploads
        return None
    return url