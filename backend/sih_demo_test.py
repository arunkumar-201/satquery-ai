import io
import uuid
from PIL import Image
import httpx

BASE_URL = "http://127.0.0.1:8000"


def print_step(step, desc):
    print(f"\n{'=' * 60}")
    print(f"STEP {step}: {desc}")
    print(f"{'=' * 60}")


def create_test_image(color=(40, 80, 120), size=(256, 256)):
    """Create a simple test PNG image"""
    img = Image.new("RGB", size, color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def test_sih_demo_workflow():
    with httpx.Client(timeout=30.0) as client:
        # ============================================
        # STEP 1-2: Register + Login
        # ============================================
        print_step(1, "Register user")
        email = f"demo-{uuid.uuid4().hex[:8]}@example.com"
        reg = client.post(f"{BASE_URL}/api/auth/register", json={
            "name": "SIH Demo User",
            "email": email,
            "password": "DemoPass123!",
            "confirm_password": "DemoPass123!",
        })
        assert reg.status_code in (200, 201), f"Register failed: {reg.text}"
        token = reg.json()["access_token"]
        print(f"OK Registered: {email}")

        print_step(2, "Login (already have token from register)")
        headers = {"Authorization": f"Bearer {token}"}
        me = client.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert me.status_code == 200
        print(f"OK Logged in as: {me.json()['email']}")

        # ============================================
        # STEP 3: Create project
        # ============================================
        print_step(3, "Create project 'Urban Growth Analysis - Visakhapatnam'")
        proj = client.post(f"{BASE_URL}/api/projects", headers=headers, json={
            "name": "Urban Growth Analysis - Visakhapatnam",
            "description": "Monitoring urban expansion in Visakhapatnam using satellite imagery"
        })
        assert proj.status_code in (200, 201), f"Create project failed: {proj.text}"
        project_id = proj.json()["id"]
        print(f"OK Created project ID: {project_id}")

        # ============================================
        # STEP 4: Upload first satellite image
        # ============================================
        print_step(4, "Upload first satellite image (OPTICAL)")
        img1 = create_test_image(color=(50, 100, 150), size=(512, 512))
        upload1 = client.post(
            f"{BASE_URL}/api/images/upload",
            headers=headers,
            data={
                "project_id": str(project_id),
                "modality": "OPTICAL",
                "sensor": "Sentinel-2",
                "acquisition_date": "2024-01-15",
                "latitude": "17.6868",
                "longitude": "83.2185",
                "resolution": "10",
            },
            files={"file": ("visakhapatnam_2024_01.tif", img1, "image/tiff")},
        )
        assert upload1.status_code == 200, f"Upload failed: {upload1.text}"
        image1_id = upload1.json()["id"]
        print(f"OK Uploaded image 1 ID: {image1_id}")

        # ============================================
        # STEP 5-7: Ask "What is visible in this image?" (English)
        # ============================================
        print_step(5, "Select language: English")
        print_step(6, "Ask: 'What is visible in this image?'")
        print_step(7, "Show AI analysis")
        query1 = client.post(
            f"{BASE_URL}/api/query",
            headers=headers,
            json={
                "project_id": project_id,
                "image_ids": [image1_id],
                "message": "What is visible in this image?",
                "language": "en",
            },
        )
        assert query1.status_code == 200, f"Query failed: {query1.text}"
        resp1 = query1.json()
        print(f"OK Analysis type: {resp1.get('analysis_type')}")
        print(f"OK Answer: {resp1.get('answer', '')[:150]}...")
        print(f"OK Confidence: {resp1.get('confidence')}")
        print(f"OK Evidence: {resp1.get('evidence')}")
        print(f"OK Is fallback (demo): {resp1.get('metadata', {}).get('is_fallback')}")

        # ============================================
        # STEP 8-9: Ask "Where are the buildings?" - evidence
        # ============================================
        print_step(8, "Ask: 'Where are the buildings?'")
        print_step(9, "Show evidence/bounding boxes")
        query2 = client.post(
            f"{BASE_URL}/api/query",
            headers=headers,
            json={
                "project_id": project_id,
                "image_ids": [image1_id],
                "message": "Where are the buildings?",
                "language": "en",
            },
        )
        assert query2.status_code == 200, f"Query failed: {query2.text}"
        resp2 = query2.json()
        print(f"OK Analysis type: {resp2.get('analysis_type')}")
        print(f"OK Answer: {resp2.get('answer', '')[:150]}...")
        evidence2 = resp2.get('evidence', {})
        print(f"OK Evidence type: {evidence2.get('type')}")
        print(f"OK Evidence data: {json_dumps(evidence2.get('data', []))[:200]}...")

        # ============================================
        # STEP 10-12: Switch to Telugu, ask follow-up
        # ============================================
        print_step(10, "Select language: Telugu")
        print_step(11, "Ask follow-up in Telugu")
        print_step(12, "Show answer in Telugu")
        tl_msg = "ఈ చిత్రంలో ఏమి కనిపిస్తుంది?"
        query3 = client.post(
            f"{BASE_URL}/api/query",
            headers=headers,
            json={
                "project_id": project_id,
                "image_ids": [image1_id],
                "message": tl_msg,
                "language": "te",
            },
        )
        assert query3.status_code == 200, f"Query failed: {query3.text}"
        resp3 = query3.json()
        print(f"OK Analysis type: {resp3.get('analysis_type')}")
        print(f"OK Answer (Telugu): {resp3.get('answer', '')[:150]}...")

        # ============================================
        # STEP 13: Upload second image (for change detection)
        # ============================================
        print_step(13, "Upload second satellite image (same area, different date)")
        img2 = create_test_image(color=(60, 110, 160), size=(512, 512))
        upload2 = client.post(
            f"{BASE_URL}/api/images/upload",
            headers=headers,
            data={
                "project_id": str(project_id),
                "modality": "OPTICAL",
                "sensor": "Sentinel-2",
                "acquisition_date": "2024-06-15",
                "latitude": "17.6868",
                "longitude": "83.2185",
                "resolution": "10",
            },
            files={"file": ("visakhapatnam_2024_06.tif", img2, "image/tiff")},
        )
        assert upload2.status_code == 200, f"Upload failed: {upload2.text}"
        image2_id = upload2.json()["id"]
        print(f"OK Uploaded image 2 ID: {image2_id}")

        # ============================================
        # STEP 14-15: Change detection
        # ============================================
        print_step(14, "Ask: 'What changed between these images?'")
        print_step(15, "Show: Before/After/Change Map/Explanation")
        query4 = client.post(
            f"{BASE_URL}/api/query",
            headers=headers,
            json={
                "project_id": project_id,
                "image_ids": [image1_id, image2_id],
                "message": "What changed between these images?",
                "language": "en",
            },
        )
        assert query4.status_code == 200, f"Query failed: {query4.text}"
        resp4 = query4.json()
        print(f"OK Analysis type: {resp4.get('analysis_type')}")
        print(f"OK Answer: {resp4.get('answer', '')[:200]}...")
        evidence4 = resp4.get('evidence', {})
        print(f"OK Evidence type: {evidence4.get('type')}")
        d4 = evidence4.get('data', {})
        if isinstance(d4, dict):
            print(f"OK Evidence data keys: {list(d4.keys())}")
        else:
            print(f"OK Evidence data: {json_dumps(d4)[:200]}")

        print(f"\n{'=' * 60}")
        print("PASSED ALL 15 STEPS OF SIH DEMO WORKFLOW")
        print(f"{'=' * 60}")
        return True


# small helper to avoid importing json at top
def json_dumps(obj):
    import json
    return json.dumps(obj, default=str)


if __name__ == "__main__":
    try:
        test_sih_demo_workflow()
    except Exception as e:
        print(f"\nFAILED WORKFLOW: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
