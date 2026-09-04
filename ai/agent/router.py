import re
from typing import Dict, Any, List, Optional


# Deterministic keyword-based router for fallback when no LLM is available.
# This MUST NOT pretend to be an LLM result - it's explicitly a fallback.
INTENT_KEYWORDS = {
    "OBJECT_DETECTION": [
        "how many", "count", "detect", "number of", "list the", "identify all",
        "find all", "locate all", "enumerate",
    ],
    "REGION_GROUNDING": [
        "where is", "where are", "show me the", "locate", "find the", "position of",
        "show the", "highlight the", "mark the",
    ],
    "CHANGE_DETECTION": [
        "what changed", "difference between", "changes between", "compare the images",
        "before and after", "change detection", "what is different",
    ],
    "MULTITEMPORAL_ANALYSIS": [
        "how did", "over time", "temporal", "time series", "evolution",
        "historical", "timeline", "progression",
    ],
    "CROSS_MODAL_ANALYSIS": [
        "compare optical", "compare sar", "optical and sar", "sar and optical",
        "cross modal", "multimodal", "optical vs sar",
    ],
    "LAND_COVER_ANALYSIS": [
        "land cover", "land use", "classification", "terrain type",
        "vegetation", "urban extent", "water bodies",
    ],
    "IMAGE_CAPTIONING": [
        "describe", "caption", "what does this show", "summarize the image",
        "brief description", "overview",
    ],
    "VISUAL_QA": [
        "what is", "is there", "does this", "can you see", "tell me about",
        "explain", "why", "how",
    ],
    "IMAGE_ANALYSIS": [
        "analyze", "analysis", "inspect", "examine", "study", "evaluate",
    ],
}

# Default to GENERAL if nothing matches
DEFAULT_INTENT = "GENERAL"


def classify_query(query: str) -> Dict[str, Any]:
    """Deterministic query classification based on keyword matching.
    Returns a dict with intent, confidence, reason, and required_images."""
    q = query.lower().strip()

    # Score each intent
    scores = {}
    for intent, keywords in INTENT_KEYWORDS.items():
        score = 0
        matched = []
        for kw in keywords:
            if kw in q:
                score += 1
                matched.append(kw)
        if score > 0:
            scores[intent] = {"score": score, "matched": matched}

    if not scores:
        return {
            "intent": DEFAULT_INTENT,
            "confidence": 0.3,
            "reason": "No specific intent keywords matched; defaulting to general analysis.",
            "required_images": 1,
        }

    # Pick highest score, break ties by intent order above
    best_intent = max(scores.keys(), key=lambda i: scores[i]["score"])
    best = scores[best_intent]
    confidence = min(0.5 + (best["score"] * 0.1), 0.85)  # 0.6-0.85

    # Determine required images
    required = 2 if best_intent in {"CHANGE_DETECTION", "MULTITEMPORAL_ANALYSIS", "CROSS_MODAL_ANALYSIS"} else 1

    return {
        "intent": best_intent,
        "confidence": round(confidence, 2),
        "reason": f"Matched keywords: {', '.join(best['matched'])}",
        "required_images": required,
    }


def validate_image_count(images: List[int], required: int) -> None:
    if len(images) < required:
        raise ValueError(f"This query requires at least {required} image(s). Upload {required - len(images)} more.")