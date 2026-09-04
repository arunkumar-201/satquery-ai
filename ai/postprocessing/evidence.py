from typing import Dict, Any, List, Optional
import json
from pathlib import Path
import numpy as np

try:
    from PIL import Image as PILImage, ImageDraw
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


def draw_bounding_boxes(image_path: str, boxes: List[Dict], output_path: str) -> str:
    """Draw bounding boxes on an image and save the result."""
    if not PIL_AVAILABLE:
        return image_path  # Return original if no drawing capability

    img = PILImage.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(img)

    for box in boxes:
        bbox = box.get("bbox", [])
        if len(bbox) == 4:
            x1, y1, x2, y2 = bbox
            # Draw rectangle
            draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
            # Draw label
            label = box.get("class_name", "object")
            conf = box.get("confidence", 0)
            draw.text((x1, max(0, y1 - 15)), f"{label} {conf:.2f}", fill="red")

    img.save(output_path)
    return output_path


def draw_polygons(image_path: str, polygons: List[Dict], output_path: str) -> str:
    """Draw polygons on an image and save the result."""
    if not PIL_AVAILABLE:
        return image_path

    img = PILImage.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(img, "RGBA")

    for poly in polygons:
        coords = poly.get("coordinates", [])
        if len(coords) >= 6:  # At least 3 points (x,y pairs)
            points = [(coords[i], coords[i + 1]) for i in range(0, len(coords), 2)]
            draw.polygon(points, outline="blue", fill=(0, 0, 255, 50), width=2)

    img.save(output_path)
    return output_path


def draw_change_map(base_image_path: str, change_data: Dict, output_path: str) -> str:
    """Draw a change map overlay on the base image."""
    if not PIL_AVAILABLE:
        return base_image_path

    base = PILImage.open(base_image_path).convert("RGB")

    # If we have a change map array
    change_map = change_data.get("change_map")
    if change_map is not None:
        if isinstance(change_map, str) and Path(change_map).exists():
            cm_img = PILImage.open(change_map).convert("RGBA")
            cm_img = cm_img.resize(base.size, PILImage.LANCZOS)
            base.paste(cm_img, (0, 0), cm_img)
        elif isinstance(change_map, np.ndarray):
            # Convert numpy array to overlay
            # Ensure change_map is in the right format for PIL
            if change_map.dtype != np.uint8:
                # Normalize to 0-255 if float
                if change_map.max() <= 1.0:
                    change_map = (change_map * 255).astype(np.uint8)
                else:
                    change_map = change_map.astype(np.uint8)

            # Handle different shapes
            if change_map.ndim == 2:
                # Grayscale - convert to RGB
                change_map = np.stack([change_map] * 3, axis=-1)
            elif change_map.ndim == 3 and change_map.shape[2] == 1:
                change_map = np.repeat(change_map, 3, axis=2)

            # Resize using PIL for consistent handling
            cm_img = PILImage.fromarray(change_map, mode="RGB")
            cm_img = cm_img.resize(base.size, PILImage.LANCZOS)
            cm_img = cm_img.convert("RGBA")

            # Create alpha channel based on red channel intensity (change intensity)
            alpha = np.array(cm_img)[:, :, 0]
            alpha = (alpha > 0).astype(np.uint8) * 180  # Semi-transparent
            cm_img.putalpha(PILImage.fromarray(alpha, mode="L"))

            base.paste(cm_img, (0, 0), cm_img)

    # Draw changed region boxes
    regions = change_data.get("changed_regions", [])
    if regions:
        draw = ImageDraw.Draw(base)
        for region in regions:
            bbox = region.get("bbox", [])
            if len(bbox) == 4:
                x1, y1, x2, y2 = bbox
                draw.rectangle([x1, y1, x2, y2], outline="orange", width=2)
                draw.text((x1, y1 - 15), "Changed", fill="orange")

    base.save(output_path)
    return output_path


def create_evidence_package(
    analysis_type: str,
    answer: str,
    confidence: Optional[float],
    evidence: Dict[str, Any],
    metadata: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a standardized evidence package for the frontend."""
    return {
        "analysis_type": analysis_type,
        "answer": answer,
        "confidence": confidence,
        "evidence": {
            "boxes": evidence.get("boxes", []),
            "polygons": evidence.get("polygons", []),
            "coordinates": evidence.get("coordinates", []),
            "image_url": evidence.get("image_url"),
            "change_map_url": evidence.get("change_map_url"),
            "highlighted_image_url": evidence.get("highlighted_image_url"),
        },
        "metadata": {
            "model": metadata.get("model"),
            "provider": metadata.get("provider"),
            "is_fallback": metadata.get("is_fallback", False),
            "processing_time_ms": metadata.get("processing_time_ms"),
        },
    }


def format_detections_for_display(detections: List[Dict]) -> List[Dict]:
    """Format detections for the frontend display."""
    formatted = []
    for det in detections:
        formatted.append({
            "class_name": det.get("class_name", "object"),
            "confidence": det.get("confidence", 0.0),
            "bbox": det.get("bbox", []),
            "area": det.get("area"),
        })
    return formatted


def format_change_results_for_display(change_data: Dict) -> Dict:
    """Format change detection results for the frontend."""
    return {
        "changed_regions": change_data.get("changed_regions", []),
        "change_map_url": change_data.get("change_map_url"),
        "before_image_url": change_data.get("before_image_url"),
        "after_image_url": change_data.get("after_image_url"),
        "statistics": {
            "mean_difference": change_data.get("mean_difference"),
            "max_difference": change_data.get("max_difference"),
            "changed_pixel_ratio": change_data.get("changed_pixel_ratio"),
        },
        "note": change_data.get("note", "Change detection analysis"),
    }