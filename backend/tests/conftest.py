"""Shared fixtures for backend smoke tests.

Uses an in-memory SQLite database so tests run without external services.
"""

import os
import sys
import tempfile

# Point storage at a temp dir before importing the app
# MUST set these BEFORE any app imports
_tmp = tempfile.mkdtemp(prefix="satquery-test-")
os.environ["STORAGE_PATH"] = _tmp
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///./test_satquery.db"
os.environ["AI_PROVIDER"] = "demo"
os.environ["AI_API_KEY"] = ""
os.environ["AI_MODEL"] = "demo-model"

# Ensure project root is importable
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def app():
    from app.main import app as fastapi_app
    yield fastapi_app


@pytest.fixture(scope="session")
def client(app):
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def auth_headers(client):
    """Register + login a test user and return bearer headers."""
    test_email = "smoke@example.com"
    payload = {
        "name": "Smoke Test",
        "email": test_email,
        "password": "StrongPass123!",
        "confirm_password": "StrongPass123!",
    }
    res = client.post("/api/auth/register", json=payload)
    if res.status_code == 400:
        # Already registered from a previous run; just log in
        res = client.post(
            "/api/auth/login",
            json={"email": test_email, "password": "StrongPass123!"},
        )
    res.raise_for_status()
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
