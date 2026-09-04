from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import io
import json
from typing import Optional

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.analysis_service import get_analysis_result
from app.services.project_service import get_project


router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/project/{project_id}/json")
def export_project_json(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_project(db, current_user.id, project_id)

    from app.services.image_service import get_images_for_user
    from app.services.chat_service import get_chat_sessions, get_messages
    from app.services.analysis_service import get_analysis_results

    images = get_images_for_user(db, current_user.id, project_id)
    sessions = get_chat_sessions(db, current_user.id, project_id)
    analyses = get_analysis_results(db, current_user.id, project_id)

    data = {
        "project_id": project_id,
        "images": [
            {
                "id": img.id,
                "filename": img.filename,
                "file_url": img.file_url,
                "modality": img.modality.value,
                "sensor": img.sensor,
                "acquisition_date": img.acquisition_date.isoformat() if img.acquisition_date else None,
                "latitude": img.latitude,
                "longitude": img.longitude,
                "resolution": img.resolution,
            }
            for img in images
        ],
        "chat_sessions": [
            {
                "id": s.id,
                "language": s.language,
                "created_at": s.created_at.isoformat(),
                "messages": [
                    {
                        "role": m.role.value,
                        "message": m.message,
                        "language": m.language,
                        "created_at": m.created_at.isoformat(),
                    }
                    for m in get_messages(db, s.id)
                ],
            }
            for s in sessions
        ],
        "analyses": [
            {
                "id": a.id,
                "analysis_type": a.analysis_type,
                "answer": a.answer,
                "confidence": a.confidence,
                "metadata": a.analysis_metadata,
                "created_at": a.created_at.isoformat(),
            }
            for a in analyses
        ],
    }

    json_str = json.dumps(data, indent=2)
    return StreamingResponse(
        io.BytesIO(json_str.encode()),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=satquery_project_{project_id}.json"},
    )


@router.get("/analysis/{analysis_id}/json")
def export_analysis_json(analysis_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    analysis = get_analysis_result(db, current_user.id, analysis_id)

    import ast
    try:
        meta = ast.literal_eval(analysis.metadata) if analysis.metadata else {}
    except Exception:
        meta = {}

    data = {
        "analysis_id": analysis.id,
        "project_id": analysis.project_id,
        "analysis_type": analysis.analysis_type,
        "answer": analysis.answer,
        "confidence": analysis.confidence,
        "evidence": meta.get("evidence", {}),
        "metadata": {k: v for k, v in meta.items() if k != "evidence"},
        "created_at": analysis.created_at.isoformat(),
    }

    json_str = json.dumps(data, indent=2)
    return StreamingResponse(
        io.BytesIO(json_str.encode()),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=satquery_analysis_{analysis_id}.json"},
    )


@router.get("/analysis/{analysis_id}/geojson")
def export_analysis_geojson(analysis_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    analysis = get_analysis_result(db, current_user.id, analysis_id)

    import ast
    try:
        meta = ast.literal_eval(analysis.metadata) if analysis.metadata else {}
    except Exception:
        meta = {}

    evidence = meta.get("evidence", {})

    # Build GeoJSON FeatureCollection from evidence
    features = []

    # Bounding boxes
    for box in evidence.get("boxes", []):
        if all(k in box for k in ("x1", "y1", "x2", "y2")):
            # Convert pixel coordinates to polygon (assuming image coordinates)
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [box["x1"], box["y1"]],
                        [box["x2"], box["y1"]],
                        [box["x2"], box["y2"]],
                        [box["x1"], box["y2"]],
                        [box["x1"], box["y1"]],
                    ]]
                },
                "properties": {
                    "type": "bounding_box",
                    "class_name": box.get("class_name", "object"),
                    "confidence": box.get("confidence"),
                    "label": box.get("label"),
                },
            })

    # Polygons
    for poly in evidence.get("polygons", []):
        coords = poly.get("coordinates")
        if coords:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coords] if isinstance(coords[0], (int, float)) else coords,
                },
                "properties": {
                    "type": "polygon",
                    "class_name": poly.get("class_name", "region"),
                    "confidence": poly.get("confidence"),
                    "label": poly.get("label"),
                },
            })

    # Change regions (from change detection)
    for change in evidence.get("change_regions", []):
        coords = change.get("coordinates")
        if coords:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coords] if isinstance(coords[0], (int, float)) else coords,
                },
                "properties": {
                    "type": "change_region",
                    "change_type": change.get("change_type", "unknown"),
                    "confidence": change.get("confidence"),
                    "area_pixels": change.get("area_pixels"),
                },
            })

    # If analysis has image with geo coordinates, we could add a point feature
    # For now, include analysis metadata as a feature with null geometry
    features.append({
        "type": "Feature",
        "geometry": None,
        "properties": {
            "type": "analysis_metadata",
            "analysis_id": analysis.id,
            "analysis_type": analysis.analysis_type,
            "answer": analysis.answer,
            "confidence": analysis.confidence,
            "created_at": analysis.created_at.isoformat(),
            "image_url": evidence.get("image_url"),
            "change_map_url": evidence.get("change_map_url"),
        },
    })

    geojson = {
        "type": "FeatureCollection",
        "features": features,
    }

    json_str = json.dumps(geojson, indent=2)
    return StreamingResponse(
        io.BytesIO(json_str.encode()),
        media_type="application/geo+json",
        headers={"Content-Disposition": f"attachment; filename=satquery_analysis_{analysis_id}.geojson"},
    )