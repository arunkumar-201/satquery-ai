from ai.models.base import CrossModalModel
import numpy as np


class DemoCrossModalModel(CrossModalModel):
    """Demo cross-modal model."""

    name = "demo_cross_modal"

    def predict(self, optical: np.ndarray, sar: np.ndarray, query: str, **kwargs) -> dict:
        return {
            "answer": (
                f"[DEMO CROSS-MODAL] Query: \"{query}\". "
                f"Optical image shape: {optical.shape}, SAR image shape: {sar.shape}. "
                "Cross-modal fusion requires a configured model that can jointly reason "
                "over optical and SAR imagery. This is a demo placeholder."
            ),
            "confidence": None,
        }