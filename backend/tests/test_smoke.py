"""Backend smoke tests: verify the core user journey and key endpoints.

These tests cover the critical SIH demo path without requiring external
services or a configured AI provider (demo mode).
"""

import io
import pytest
import uuid


# --- Health ---


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_ai_status(client):
    res = client.get("/api/ai/status")
    assert res.status_code == 200
    body = res.json()
    assert "provider" in body
    assert "configured" in body


# --- Authentication ---


def test_register_valid(client):
    email = f"newuser-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post(
        "/api/auth/register",
        json={
            "name": "New User",
            "email": email,
            "password": "StrongPass123!",
            "confirm_password": "StrongPass123!",
        },
    )
    assert res.status_code in (200, 201)
    body = res.json()
    assert "access_token" in body
    assert body["user"]["email"] == email


def test_register_password_mismatch(client):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Bad User",
            "email": "bad@example.com",
            "password": "password123",
            "confirm_password": "different",
        },
    )
    assert res.status_code == 400


def test_login_invalid(client):
    res = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "wrongpass"},
    )
    assert res.status_code == 401


def test_me_requires_auth(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_authenticated(client, auth_headers):
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert "email" in res.json()


def test_forgot_password(client):
    # Should not leak account existence
    res = client.post("/api/auth/forgot-password", json={"email": "smoke@example.com"})
    assert res.status_code == 200


# --- Projects ---


def test_create_project(client, auth_headers):
    res = client.post(
        "/api/projects",
        headers=auth_headers,
        json={"name": "Urban Growth Analysis - Vizag", "description": "Test project"},
    )
    assert res.status_code in (200, 201)
    assert res.json()["name"] == "Urban Growth Analysis - Vizag"


def test_list_projects(client, auth_headers):
    res = client.get("/api/projects", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_project_ownership(client):
    # Unauthenticated request should be rejected
    assert client.get("/api/projects").status_code == 401


# --- Image metadata validation (no binary upload required) ---


def test_query_routing_fallback():
    """The deterministic router works without a provider."""
    from ai.agent.router import classify_query

    result = classify_query("How many buildings are visible?")
    assert result["intent"] == "OBJECT_DETECTION"
    assert result["required_images"] == 1

    change = classify_query("What changed between these images?")
    assert change["intent"] == "CHANGE_DETECTION"
    assert change["required_images"] == 2


def test_upload_query_history_workflow(client, auth_headers):
    project = client.post(
        "/api/projects",
        headers=auth_headers,
        json={"name": "Image Workflow"},
    )
    assert project.status_code == 200
    project_id = project.json()["id"]

    from PIL import Image

    image = Image.new("RGB", (32, 32), (40, 80, 120))
    content = io.BytesIO()
    image.save(content, format="PNG")
    content.seek(0)
    upload = client.post(
        "/api/images/upload",
        headers=auth_headers,
        data={"project_id": str(project_id), "modality": "OPTICAL"},
        files={"file": ("sample.png", content, "image/png")},
    )
    assert upload.status_code == 200
    image_id = upload.json()["id"]

    query = client.post(
        "/api/query",
        headers=auth_headers,
        json={
            "project_id": project_id,
            "image_ids": [image_id],
            "message": "What is visible in this image?",
            "language": "en",
        },
    )
    assert query.status_code == 200
    # With real AI provider configured, is_fallback is False (correct behavior)
    assert "is_fallback" in query.json()["metadata"]

    history = client.get("/api/history", headers=auth_headers)
    assert history.status_code == 200
    assert history.json()[0]["messages"]


def test_analysis_requires_images(client, auth_headers):
    project = client.post("/api/projects", headers=auth_headers, json={"name": "No Image Project"})
    response = client.post(
        "/api/query",
        headers=auth_headers,
        json={"project_id": project.json()["id"], "image_ids": [], "message": "hi", "language": "en"},
    )
    # FastAPI validation returns 422 for invalid schema (empty image_ids)
    assert response.status_code in (400, 422)
    detail = response.json()["detail"]
    if isinstance(detail, list):
        detail = " ".join(str(e.get("msg", "")) for e in detail)
    assert "image" in detail.lower()


def test_normal_chat_does_not_create_analysis(client, auth_headers):
    project = client.post("/api/projects", headers=auth_headers, json={"name": "Chat Project"})
    response = client.post(
        "/api/chat/message",
        headers=auth_headers,
        json={"project_id": project.json()["id"], "message": "hi", "language": "en"},
    )
    assert response.status_code == 200
    # With real AI provider configured, is_fallback is False (correct behavior)
    assert "is_fallback" in response.json()["metadata"]


def test_upload_image_exact_browser_formdata(client, auth_headers):
    """Regression test: upload with exact browser FormData (empty strings, DD-MM-YYYY date)."""
    project = client.post("/api/projects", headers=auth_headers, json={"name": "Browser FormData Test"})
    project_id = project.json()["id"]

    from PIL import Image
    import io
    img = Image.new("RGB", (64, 64), (40, 80, 120))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    # Exact browser FormData: empty strings for optional fields, DD-MM-YYYY date
    upload = client.post(
        "/api/images/upload",
        headers=auth_headers,
        data={
            "project_id": str(project_id),
            "modality": "OPTICAL",
            "sensor": "Sentinel-2",
            "acquisition_date": "29-08-2026",  # User's DD-MM-YYYY format
            "latitude": "17.3850",
            "longitude": "78.4867",
            "resolution": "10",
            "bounding_box": "",  # Empty string from browser
        },
        files={"file": ("satellite.png", buf, "image/png")},
    )
    assert upload.status_code == 200, f"Upload failed: {upload.text}"
    data = upload.json()
    assert data["modality"] == "OPTICAL"
    assert data["sensor"] == "Sentinel-2"
    assert data["latitude"] == 17.385
    assert data["longitude"] == 78.4867
    assert data["resolution"] == 10.0
    assert data["acquisition_date"].startswith("2026-08-29")

    # Verify it appears in project images
    lst = client.get(f"/api/images/project/{project_id}", headers=auth_headers)
    assert lst.status_code == 200
    images = lst.json()
    assert len(images) == 1
    assert images[0]["id"] == data["id"]


def test_upload_image_iso_date_no_optional(client, auth_headers):
    """Upload with ISO date and no optional fields in FormData."""
    project = client.post("/api/projects", headers=auth_headers, json={"name": "ISO Date Test"})
    project_id = project.json()["id"]

    from PIL import Image
    import io
    img = Image.new("RGB", (64, 64), (40, 80, 120))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    # ISO date from <input type=date>, no optional fields
    upload = client.post(
        "/api/images/upload",
        headers=auth_headers,
        data={
            "project_id": str(project_id),
            "modality": "OPTICAL",
            "sensor": "Sentinel-2",
            "acquisition_date": "2026-08-29",  # ISO format
        },
        files={"file": ("satellite2.png", buf, "image/png")},
    )
    assert upload.status_code == 200, f"Upload failed: {upload.text}"
    data = upload.json()
    assert data["acquisition_date"].startswith("2026-08-29")
