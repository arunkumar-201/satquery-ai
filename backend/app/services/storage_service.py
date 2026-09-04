import shutil
import uuid
import httpx
from pathlib import Path
from typing import BinaryIO, Optional

from app.config import settings
from app.utils.files import ensure_dir


class StorageService:
    """Configurable storage abstraction.
    Supports local development storage and (via subclassing) S3/Supabase.
    """

    def __init__(self, mode: str = None, base_path: str = None):
        self.mode = mode or settings.STORAGE_MODE
        self.base_path = Path(base_path or settings.STORAGE_PATH)

    def _subdir(self, category: str) -> Path:
        path = self.base_path / category
        ensure_dir(path)
        return path

    def save(self, file_obj: BinaryIO, category: str, filename: str) -> str:
        """Save a file and return a URL/path reference."""
        if self.mode == "local":
            subdir = self._subdir(category)
            safe_name = f"{uuid.uuid4().hex}_{Path(filename).name}"
            dest = subdir / safe_name
            with open(dest, "wb") as f:
                shutil.copyfileobj(file_obj, f)
            return f"/{category}/{safe_name}"
        if self.mode == "supabase":
            if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
                raise RuntimeError("Supabase storage requires SUPABASE_URL and SUPABASE_KEY")
            bucket = settings.SUPABASE_BUCKET or "satquery"
            object_path = f"{category}/{uuid.uuid4().hex}_{Path(filename).name}"
            response = httpx.post(
                f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/{bucket}/{object_path}",
                headers={
                    "apikey": settings.SUPABASE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                    "Content-Type": "application/octet-stream",
                },
                content=file_obj.read(),
                timeout=120.0,
            )
            response.raise_for_status()
            return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{bucket}/{object_path}"
        raise NotImplementedError(f"Storage mode '{self.mode}' is not supported")

    def delete(self, url: str) -> None:
        if self.mode == "local":
            path = self.absolute_path(url)
            if path and path.exists():
                path.unlink()
            return
        if self.mode == "supabase":
            if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
                raise RuntimeError("Supabase storage requires SUPABASE_URL and SUPABASE_KEY")
            bucket = settings.SUPABASE_BUCKET or "satquery"
            marker = f"/storage/v1/object/public/{bucket}/"
            if marker not in url:
                return
            object_path = url.split(marker, 1)[1]
            response = httpx.post(
                f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/remove",
                headers={
                    "apikey": settings.SUPABASE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                },
                json={"bucketId": bucket, "prefixes": [object_path]},
                timeout=120.0,
            )
            response.raise_for_status()
            return
        raise NotImplementedError(f"Storage mode '{self.mode}' is not supported")

    def save_bytes(self, data: bytes, category: str, ext: str = ".png") -> str:
        if self.mode == "local":
            subdir = self._subdir(category)
            safe_name = f"{uuid.uuid4().hex}{ext}"
            dest = subdir / safe_name
            with open(dest, "wb") as f:
                f.write(data)
            return f"/{category}/{safe_name}"
        if self.mode == "supabase":
            from io import BytesIO
            return self.save(BytesIO(data), category, f"{uuid.uuid4().hex}{ext}")
        raise NotImplementedError(f"Storage mode '{self.mode}' is not supported")

    def absolute_path(self, url: str) -> Optional[Path]:
        """Given a stored URL like /uploads/xxx.png, return absolute filesystem path."""
        if url.startswith("http"):
            return None
        rel = url.lstrip("/")
        path = self.base_path / rel
        return path if path.exists() else None

    def exists(self, url: str) -> bool:
        return self.absolute_path(url) is not None


storage_service = StorageService()