"""
SATQUERY AI — Structured Logging Configuration
Provides structured JSON logging with request context (user_id, project_id, analysis_type, duration, success/failure)
"""

import json
import logging
import sys
import time
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.config import settings


class StructuredFormatter(logging.Formatter):
    """JSON formatter with structured fields for observability."""

    def format(self, record: logging.LogRecord) -> str:
        # Base log structure
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add structured fields if present
        structured_fields = [
            "user_id",
            "project_id",
            "analysis_type",
            "duration_ms",
            "success",
            "request_id",
            "method",
            "path",
            "status_code",
            "error",
        ]

        for field in structured_fields:
            if hasattr(record, field):
                log_data[field] = getattr(record, field)

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data, ensure_ascii=False)


def setup_logging() -> None:
    """Configure structured logging for the application."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Clear existing handlers
    root_logger.handlers.clear()

    # Console handler with structured formatter
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(StructuredFormatter())
    root_logger.addHandler(console_handler)

    # Set specific logger levels
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    # App-specific loggers
    logging.getLogger("satquery").setLevel(log_level)
    logging.getLogger("satquery.auth").setLevel(log_level)
    logging.getLogger("satquery.api").setLevel(log_level)
    logging.getLogger("satquery.analysis").setLevel(log_level)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log HTTP requests with structured context."""

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.logger = logging.getLogger("satquery.api")

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())[:8]
        start_time = time.perf_counter()

        # Add request_id to request state for downstream use
        request.state.request_id = request_id

        # Extract user_id if available (from JWT in future)
        user_id = getattr(request.state, "user_id", None)

        # Extract project_id from path if present
        project_id = self._extract_project_id(request.url.path)

        # Log request start
        self.logger.info(
            "Request started",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "user_id": user_id,
                "project_id": project_id,
            },
        )

        try:
            response = await call_next(request)
            duration_ms = int((time.perf_counter() - start_time) * 1000)

            # Log response
            self.logger.info(
                "Request completed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                    "user_id": user_id,
                    "project_id": project_id,
                    "success": 200 <= response.status_code < 400,
                },
            )

            # Add timing header
            response.headers["X-Process-Time-Ms"] = str(duration_ms)
            response.headers["X-Request-ID"] = request_id

            return response

        except Exception as e:
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            self.logger.error(
                "Request failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "user_id": user_id,
                    "project_id": project_id,
                    "success": False,
                    "error": str(e),
                },
                exc_info=True,
            )
            raise

    def _extract_project_id(self, path: str) -> Optional[int]:
        """Extract project_id from URL path like /api/projects/123/..."""
        parts = path.strip("/").split("/")
        try:
            idx = parts.index("projects")
            if idx + 1 < len(parts) and parts[idx + 1].isdigit():
                return int(parts[idx + 1])
        except ValueError:
            pass
        return None


def log_analysis(
    user_id: Optional[int],
    project_id: Optional[int],
    analysis_type: str,
    duration_ms: int,
    success: bool,
    error: Optional[str] = None,
) -> None:
    """Log analysis execution with structured fields."""
    logger = logging.getLogger("satquery.analysis")
    if success:
        logger.info(
            "Analysis completed",
            extra={
                "user_id": user_id,
                "project_id": project_id,
                "analysis_type": analysis_type,
                "duration_ms": duration_ms,
                "success": True,
            },
        )
    else:
        logger.error(
            "Analysis failed",
            extra={
                "user_id": user_id,
                "project_id": project_id,
                "analysis_type": analysis_type,
                "duration_ms": duration_ms,
                "success": False,
                "error": error,
            },
        )


def log_auth_event(
    event: str,
    user_id: Optional[int] = None,
    email: Optional[str] = None,
    success: bool = True,
    error: Optional[str] = None,
) -> None:
    """Log authentication events."""
    logger = logging.getLogger("satquery.auth")
    if success:
        logger.info(
            f"Auth: {event}",
            extra={"user_id": user_id, "email": email, "success": True},
        )
    else:
        logger.warning(
            f"Auth failed: {event}",
            extra={"user_id": user_id, "email": email, "success": False, "error": error},
        )