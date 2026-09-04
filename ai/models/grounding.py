from ai.models.base import GroundingModel
import numpy as np


class DemoGroundingModel(GroundingModel):
    """Demo grounding model."""

    name = "demo_grounding"

    def predict(self, image: np.ndarray, query: str, **kwargs) -> dict:
        return {
            "regions": [],
            "note": "Region grounding model is not configured. Set up a real AI provider with grounding capability."
        }