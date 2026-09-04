from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import numpy as np


class BaseModel(ABC):
    """Base class for all analysis models."""

    name: str = "base"

    @abstractmethod
    def predict(self, image: np.ndarray, **kwargs) -> Dict[str, Any]:
        ...


class ImageAnalysisModel(BaseModel):
    """General image analysis / captioning / VQA."""

    name = "image_analysis"

    def predict(self, image: np.ndarray, prompt: str = "", **kwargs) -> Dict[str, Any]:
        # Override in subclasses with actual model
        return {
            "answer": "Image analysis requires a configured model.",
            "confidence": None,
        }


class VQAModel(BaseModel):
    """Visual Question Answering model."""

    name = "vqa"

    def predict(self, image: np.ndarray, question: str, **kwargs) -> Dict[str, Any]:
        return {
            "answer": "VQA requires a configured model.",
            "confidence": None,
        }


class DetectionModel(BaseModel):
    """Object detection model interface."""

    name = "detection"

    def predict(self, image: np.ndarray, **kwargs) -> Dict[str, Any]:
        """Return detections: [{class_name, confidence, bbox: [x1,y1,x2,y2]}]"""
        return {"detections": []}


class GroundingModel(BaseModel):
    """Region grounding / referring expression comprehension model."""

    name = "grounding"

    def predict(self, image: np.ndarray, query: str, **kwargs) -> Dict[str, Any]:
        """Return regions: [{label, confidence, bbox: [x1,y1,x2,y2]}]"""
        return {"regions": []}


class ChangeDetectionModel(BaseModel):
    """Change detection model for before/after images."""

    name = "change_detection"

    def predict(self, before: np.ndarray, after: np.ndarray, **kwargs) -> Dict[str, Any]:
        """Return change map, changed regions, explanation."""
        return {
            "change_mask": None,
            "changed_regions": [],
            "explanation": "Change detection requires a configured model.",
        }


class CrossModalModel(BaseModel):
    """Cross-modal (optical + SAR) analysis model."""

    name = "cross_modal"

    def predict(self, optical: np.ndarray, sar: np.ndarray, query: str, **kwargs) -> Dict[str, Any]:
        return {
            "answer": "Cross-modal analysis requires a configured model.",
            "confidence": None,
        }


# Model registry
_model_registry = {}


def register_model(model: BaseModel):
    _model_registry[model.name] = model


def get_model(name: str) -> Optional[BaseModel]:
    return _model_registry.get(name)


def list_models() -> List[str]:
    return list(_model_registry.keys())