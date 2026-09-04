from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from app.config import settings
from app.database import init_db
from app.api import auth, projects, images, chat, analysis, export
from app.services.storage_service import storage_service
from app.core.logging_config import setup_logging, RequestLoggingMiddleware


def ensure_storage_directories():
    base = Path(settings.STORAGE_PATH)
    for sub in ["uploads", "processed", "evidence", "reports"]:
        (base / sub).mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()  # Configure structured logging
    init_db()

    # Ensure storage directories exist
    ensure_storage_directories()

    yield
    # Shutdown


app = FastAPI(
    title=settings.APP_NAME,
    description="Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis",
    version="1.0.0",
    lifespan=lifespan,
)

# Request logging middleware (must be added before CORS to log all requests)
app.add_middleware(RequestLoggingMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
ensure_storage_directories()
storage_base = Path(settings.STORAGE_PATH)
app.mount("/uploads", StaticFiles(directory=storage_base / "uploads"), name="uploads")
app.mount("/processed", StaticFiles(directory=storage_base / "processed"), name="processed")
app.mount("/evidence", StaticFiles(directory=storage_base / "evidence"), name="evidence")
app.mount("/reports", StaticFiles(directory=storage_base / "reports"), name="reports")

# Health endpoint
@app.get("/health")
def health_check():
    return {"status": "ok"}

# AI status endpoint
@app.get("/api/ai/status")
def ai_status():
    from app.services.ai_provider import provider_status
    return provider_status()

# Include routers
app.include_router(auth.router)
app.include_router(auth.users_router)
app.include_router(projects.router)
app.include_router(images.router)
app.include_router(chat.router)
app.include_router(chat.compat_router)
app.include_router(analysis.router)
app.include_router(export.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.BACKEND_HOST, port=settings.BACKEND_PORT)