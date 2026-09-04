import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parents[1]

# Load .env files explicitly to ensure configured values take precedence over
# potentially-incorrect system environment variables (e.g. AI_MODEL).
def _load_env_file_values():
    """Read AI_* values from .env files, preferring backend/.env, then root .env.
    For AI_* settings, .env file values ALWAYS override system environment variables
    UNLESS we're in test mode (ENVIRONMENT=test).
    """
    # Check if we're in test mode - if so, don't override AI_* env vars
    # Note: ENVIRONMENT must already be set in os.environ before this runs
    is_test = os.environ.get("ENVIRONMENT") == "test"

    env_candidates = [BACKEND_DIR / ".env", ROOT_DIR / ".env", Path(".env")]
    for env_path in env_candidates:
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, _, value = line.partition("=")
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    if key.startswith("AI_"):
                        if not is_test:
                            os.environ[key] = value
                    elif key == "ENVIRONMENT":
                        # Allow ENVIRONMENT to be set from .env if not already in os.environ
                        if key not in os.environ:
                            os.environ[key] = value
                    elif key not in os.environ:
                        # For other settings, only set if not already present
                        os.environ[key] = value


# Load env file values BEFORE creating settings instance
_load_env_file_values()


# Determine env_file setting based on test mode
_is_test = os.environ.get("ENVIRONMENT") == "test"
_env_files = () if _is_test else (
    str(ROOT_DIR / ".env"),
    str(BACKEND_DIR / ".env"),
    ".env",
)


class Settings(BaseSettings):
    APP_NAME: str = "SATQUERY AI"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"

    DATABASE_URL: str = "sqlite:///./satquery.db"

    AI_PROVIDER: str = "demo"
    AI_BASE_URL: Optional[str] = None
    AI_API_KEY: Optional[str] = None
    AI_MODEL: Optional[str] = None

    STORAGE_MODE: str = "local"
    STORAGE_PATH: str = "./storage"

    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_BUCKET: Optional[str] = None

    CORS_ORIGINS: str = "http://localhost:5173"
    MAX_UPLOAD_SIZE_MB: int = 50
    LOG_LEVEL: str = "INFO"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def storage_path_obj(self) -> Path:
        return Path(self.STORAGE_PATH)

    model_config = SettingsConfigDict(
        env_file=_env_files,
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
