import time
import re
from typing import Dict, Any, List, Optional
import numpy as np

from ai.agent.router import classify_query
from ai.agent.planner import build_analysis_plan, execute_plan
from ai.preprocessing.image_preprocessor import ImagePreprocessor, preprocess_image, compute_baseline_change
from ai.postprocessing.evidence import create_evidence_package
from app.services.ai_provider import get_provider, provider_status


def _clean_answer(text: str) -> str:
    """Remove raw JSON, markdown code blocks, and technical formatting from AI responses.
    Keeps structured data internally for evidence but returns human-readable text."""
    if not text:
        return text

    # Remove markdown code blocks (```json ... ``` or ``` ... ```)
    text = re.sub(r'```(?:json)?\s*\n?.*?\n?```', '', text, flags=re.DOTALL)

    # Remove standalone JSON objects/arrays that might have leaked
    text = re.sub(r'^\s*\{.*\}\s*$', '', text, flags=re.DOTALL | re.MULTILINE)
    text = re.sub(r'^\s*\[.*\]\s*$', '', text, flags=re.DOTALL | re.MULTILINE)

    # Remove lines that are just field names like "class_name:", "confidence:", "bbox:"
    text = re.sub(r'^\s*(?:class_name|confidence|bbox|detections)\s*:\s*.*$', '', text, flags=re.MULTILINE)

    # Clean up multiple consecutive newlines
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Clean up leading/trailing whitespace
    text = text.strip()

    return text


class InferenceService:
    """Orchestrates the full analysis pipeline: routing -> planning -> execution -> evidence."""

    def __init__(self):
        self.preprocessor = ImagePreprocessor()

    async def analyze(
        self,
        image_paths: List[str],
        query: str,
        language: str = "en",
        modalities: List[str] = None,
    ) -> Dict[str, Any]:
        """Run end-to-end analysis on one or more images with a natural language query."""
        start_time = time.time()

        # Step 1: Route the query
        provider = get_provider()
        routing = await self._route_query(query, provider)
        intent = routing["intent"]

        # Step 2: Build plan
        modalities = modalities or ["OTHER"] * len(image_paths)
        plan = build_analysis_plan(intent, len(image_paths), modalities)

        # Step 3: Execute plan via provider
        result = await execute_plan(plan, image_paths, query, provider, language)

        # Step 4: Process evidence (draw boxes, change maps, etc.)
        result = await self._process_evidence(result, image_paths, plan)

        # Clean the answer to remove any raw JSON/markdown that may have leaked
        result["answer"] = _clean_answer(result.get("answer", ""))

        # Add metadata
        processing_time = int((time.time() - start_time) * 1000)
        result["metadata"]["processing_time_ms"] = processing_time
        result["evidence"] = self._format_evidence(result.get("evidence", {}))

        return result

    async def _route_query(self, query: str, provider) -> Dict[str, Any]:
        """Try LLM routing, fall back to deterministic routing."""
        try:
            if hasattr(provider, "classify_query"):
                result = await provider.classify_query(query)
                if result and "intent" in result:
                    return result
        except Exception:
            pass
        # Fallback to deterministic router
        return classify_query(query)

    async def _process_evidence(
        self, result: Dict[str, Any], image_paths: List[str], plan: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Post-process evidence: draw overlays, generate change maps."""
        evidence = result.get("evidence", {})
        intent = plan.get("intent", "GENERAL")

        # Get evidence storage directory
        from app.services.storage_service import storage_service
        from pathlib import Path

        evidence_dir = storage_service.base_path / "evidence"
        evidence_dir.mkdir(parents=True, exist_ok=True)

        # Draw bounding boxes if present
        if evidence.get("boxes") and image_paths:
            from ai.postprocessing.evidence import draw_bounding_boxes

            output_path = evidence_dir / f"boxes_{int(time.time())}.png"
            draw_bounding_boxes(image_paths[0], evidence["boxes"], str(output_path))
            evidence["highlighted_image_url"] = f"/evidence/{output_path.name}"

        # Generate change map if change detection
        if intent == "CHANGE_DETECTION" and len(image_paths) >= 2:
            from ai.postprocessing.evidence import draw_change_map
            from ai.preprocessing.image_preprocessor import compute_baseline_change

            change_result = compute_baseline_change(image_paths[0], image_paths[1])
            output_path = evidence_dir / f"change_{int(time.time())}.png"
            draw_change_map(image_paths[0], change_result, str(output_path))

            evidence["change_map_url"] = f"/evidence/{output_path.name}"
            evidence["coordinates"] = [
                {"bbox": r["bbox"], "centroid": r["centroid"], "area": r["area"]}
                for r in change_result["changed_regions"]
            ]
            # Update answer with real change stats
            result["answer"] = (
                f"Found {len(change_result['changed_regions'])} changed region(s). "
                f"Changed pixel ratio: {change_result['changed_pixel_ratio']:.2%}. "
                f"Mean difference: {change_result['mean_difference']:.4f}. "
                f"[BASELINE CHANGE DETECTION - not a trained satellite foundation model]"
            )

        return result

    def _format_evidence(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure evidence has all required fields."""
        return {
            "boxes": evidence.get("boxes", []),
            "polygons": evidence.get("polygons", []),
            "coordinates": evidence.get("coordinates", []),
            "image_url": evidence.get("image_url"),
            "change_map_url": evidence.get("change_map_url"),
            "highlighted_image_url": evidence.get("highlighted_image_url"),
        }

    def get_status(self) -> Dict[str, Any]:
        return provider_status()


# Singleton
inference_service = InferenceService()