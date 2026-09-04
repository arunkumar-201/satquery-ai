from ai.models.base import ChangeDetectionModel
import numpy as np
from ai.preprocessing.image_preprocessor import compute_baseline_change


class DemoChangeDetectionModel(ChangeDetectionModel):
    """Demo change detection using baseline pixel difference."""

    name = "demo_change_detection"

    def predict(self, before: np.ndarray, after: np.ndarray, **kwargs) -> dict:
        # Use the baseline change detection from preprocessing
        # This requires file paths, so we'll save temp files
        import tempfile
        import os

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f1:
            from PIL import Image as PILImage
            PILImage.fromarray((before * 255).astype(np.uint8)).save(f1.name)
            before_path = f1.name

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f2:
            PILImage.fromarray((after * 255).astype(np.uint8)).save(f2.name)
            after_path = f2.name

        try:
            result = compute_baseline_change(before_path, after_path)
            return {
                "change_mask": result["change_mask"].tolist() if result["change_mask"] is not None else None,
                "changed_regions": result["changed_regions"],
                "explanation": (
                    f"[BASELINE CHANGE DETECTION] Found {len(result['changed_regions'])} changed regions. "
                    f"Mean pixel difference: {result['mean_difference']:.4f}. "
                    f"Changed pixel ratio: {result['changed_pixel_ratio']:.2%}. "
                    f"Note: {result['note']}"
                ),
                "statistics": {
                    "mean_difference": result["mean_difference"],
                    "max_difference": result["max_difference"],
                    "changed_pixel_ratio": result["changed_pixel_ratio"],
                },
            }
        finally:
            os.unlink(before_path)
            os.unlink(after_path)