from ai.models.base import ImageAnalysisModel
import numpy as np


class DemoImageAnalysisModel(ImageAnalysisModel):
    """Demo image analysis using basic image statistics."""

    name = "demo_image_analysis"

    def predict(self, image: np.ndarray, prompt: str = "", **kwargs) -> dict:
        # Compute basic stats
        h, w = image.shape[:2]
        mean_val = float(np.mean(image))
        std_val = float(np.std(image))
        channel_means = [float(np.mean(image[:, :, c])) for c in range(image.shape[2])]

        # Generate a descriptive answer based on statistics
        brightness = "bright" if mean_val > 0.5 else "dark" if mean_val < 0.3 else "moderately lit"
        contrast = "high contrast" if std_val > 0.25 else "low contrast" if std_val < 0.1 else "moderate contrast"

        # Simple color analysis
        r, g, b = channel_means[:3]
        if r > g and r > b:
            dominant = "reddish"
        elif g > r and g > b:
            dominant = "greenish"
        elif b > r and b > g:
            dominant = "bluish"
        else:
            dominant = "neutral"

        answer = (
            f"[DEMO ANALYSIS] This {w}x{h} satellite image appears {brightness} with {contrast}. "
            f"The overall tone is {dominant}. "
            f"Mean intensity: {mean_val:.3f}, Std deviation: {std_val:.3f}. "
            "This is a demo analysis based on pixel statistics. "
            "Configure a real AI provider for semantic understanding."
        )

        return {
            "answer": answer,
            "confidence": None,
            "metadata": {
                "shape": list(image.shape),
                "mean": mean_val,
                "std": std_val,
                "channel_means": channel_means,
            },
        }