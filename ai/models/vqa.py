from ai.models.base import VQAModel
import numpy as np


class DemoVQAModel(VQAModel):
    """Demo VQA model."""

    name = "demo_vqa"

    def predict(self, image: np.ndarray, question: str, **kwargs) -> dict:
        h, w = image.shape[:2]
        answer = (
            f"[DEMO VQA] Your question: \"{question}\". "
            f"This is a {w}x{h} satellite image. "
            "I cannot answer specific visual questions without a configured vision-language model. "
            "Please set AI_PROVIDER=openai_compatible with valid credentials."
        )
        return {"answer": answer, "confidence": None}