from ai.models.base import DetectionModel
import numpy as np


class DemoDetectionModel(DetectionModel):
    """Demo detection model - produces clearly labeled fallback results."""

    name = "demo_detection"

    def predict(self, image: np.ndarray, **kwargs) -> dict:
        # In demo mode, we don't have a real detection model
        # Return clearly labeled message
        return {
            "detections": [],
            "note": "Object detection model is not configured. Set up a real AI provider with detection capability."
        }