from typing import Dict, Any, List
from ai.agent.router import classify_query


def build_analysis_plan(intent: str, image_count: int, image_modalities: List[str] = None) -> Dict[str, Any]:
    """Build an execution plan for the analysis based on the classified intent."""
    modalities = image_modalities or ["OTHER"] * image_count

    # Base plan
    plan = {
        "intent": intent,
        "steps": [],
        "requires_fusion": False,
        "requires_alignment": False,
    }

    if intent in {"IMAGE_ANALYSIS", "IMAGE_CAPTIONING", "VISUAL_QA", "GENERAL"}:
        plan["steps"] = ["analyze_single_image"]
        plan["primary_image_index"] = 0

    elif intent in {"OBJECT_DETECTION", "REGION_GROUNDING", "LAND_COVER_ANALYSIS"}:
        plan["steps"] = ["detect_objects"]
        plan["primary_image_index"] = 0

    elif intent == "CHANGE_DETECTION":
        if image_count >= 2:
            plan["steps"] = ["align_images", "detect_changes", "generate_change_map", "describe_changes"]
            plan["requires_alignment"] = True
            plan["primary_image_index"] = 0
            plan["secondary_image_index"] = 1
        else:
            # Fall back to general analysis
            plan["steps"] = ["analyze_single_image"]
            plan["intent"] = "IMAGE_ANALYSIS"

    elif intent == "MULTITEMPORAL_ANALYSIS":
        if image_count >= 2:
            plan["steps"] = ["analyze_temporal_sequence"]
            plan["requires_fusion"] = True
        else:
            plan["steps"] = ["analyze_single_image"]
            plan["intent"] = "IMAGE_ANALYSIS"

    elif intent == "CROSS_MODAL_ANALYSIS":
        if image_count >= 2:
            plan["steps"] = ["analyze_optical", "analyze_sar", "fuse_results", "cross_modal_reasoning"]
            plan["requires_fusion"] = True
            plan["primary_image_index"] = 0
            plan["secondary_image_index"] = 1
        else:
            plan["steps"] = ["analyze_single_image"]
            plan["intent"] = "IMAGE_ANALYSIS"

    else:
        plan["steps"] = ["analyze_single_image"]
        plan["primary_image_index"] = 0

    return plan


async def execute_plan(
    plan: Dict[str, Any],
    image_paths: List[str],
    user_query: str,
    provider,
    language: str = "en",
) -> Dict[str, Any]:
    """Execute the analysis plan using the AI provider with automatic graceful fallback."""
    steps = plan.get("steps", [])
    intent = plan.get("intent", "GENERAL")

    active_provider = provider
    is_fallback = provider.name == "demo"
    fallback_reason = None

    async def _analyze_safe(paths: List[str], prompt: str) -> str:
        nonlocal active_provider, is_fallback, fallback_reason
        try:
            return await active_provider.analyze_image(paths, prompt)
        except Exception as exc:
            import logging
            logging.getLogger("satquery.ai").warning(
                "AI provider %s failed: %s. Falling back to DemoProvider.",
                getattr(active_provider, "name", "unknown"),
                exc,
            )
            from app.services.ai_provider import DemoProvider
            active_provider = DemoProvider()
            is_fallback = True
            fallback_reason = str(exc)
            demo_resp = await active_provider.analyze_image(paths, prompt)
            return f"[AI Provider Notice: {exc}. Operating in local fallback mode]\n\n{demo_resp}"

    async def _chat_safe(messages: List[Dict[str, str]]) -> str:
        nonlocal active_provider, is_fallback, fallback_reason
        try:
            return await active_provider.chat(messages)
        except Exception as exc:
            import logging
            logging.getLogger("satquery.ai").warning(
                "AI provider %s failed: %s. Falling back to DemoProvider.",
                getattr(active_provider, "name", "unknown"),
                exc,
            )
            from app.services.ai_provider import DemoProvider
            active_provider = DemoProvider()
            is_fallback = True
            fallback_reason = str(exc)
            demo_resp = await active_provider.chat(messages)
            return f"[AI Provider Notice: {exc}. Operating in local fallback mode]\n\n{demo_resp}"

    results = {}
    answer_parts = []
    evidence = {"boxes": [], "polygons": [], "coordinates": [], "image_url": None, "change_map_url": None}

    for step in steps:
        if step == "analyze_single_image":
            idx = plan.get("primary_image_index", 0)
            if idx < len(image_paths):
                prompt = _build_single_image_prompt(user_query, intent, language)
                response = await _analyze_safe([image_paths[idx]], prompt)
                results["analysis"] = response
                answer_parts.append(response)

        elif step == "detect_objects":
            idx = plan.get("primary_image_index", 0)
            if idx < len(image_paths):
                prompt = _build_detection_prompt(user_query, language)
                response = await _analyze_safe([image_paths[idx]], prompt)
                # Try to extract structured detections if provider returned JSON
                try:
                    import json
                    data = json.loads(response)
                    if "detections" in data:
                        for det in data["detections"]:
                            evidence["boxes"].append({
                                "class_name": det.get("class_name", "object"),
                                "confidence": det.get("confidence", 0.5),
                                "bbox": det.get("bbox", []),
                            })
                        # Format as human-readable
                        det_count = len(data["detections"])
                        if det_count > 0:
                            obj_list = ", ".join(
                                f"{d.get('class_name', 'object')} ({d.get('confidence', 0.5)*100:.0f}%)"
                                for d in data["detections"]
                            )
                            answer_parts.append(f"Detected {det_count} objects: {obj_list}.")
                        else:
                            answer_parts.append("No objects detected matching the query.")
                    else:
                        answer_parts.append(response)
                except Exception:
                    # Response is already natural language - use as-is
                    answer_parts.append(response)

        elif step == "align_images":
            # In demo mode, this is a no-op placeholder
            results["alignment"] = "skipped (demo mode)"

        elif step == "detect_changes":
            idx1 = plan.get("primary_image_index", 0)
            idx2 = plan.get("secondary_image_index", 1)
            if idx1 < len(image_paths) and idx2 < len(image_paths):
                prompt = _build_change_detection_prompt(user_query, language)
                response = await _analyze_safe([image_paths[idx1], image_paths[idx2]], prompt)
                results["change_analysis"] = response
                answer_parts.append(response)

        elif step == "generate_change_map":
            # In demo mode, we can't generate real change maps without a model
            results["change_map"] = "generated (demo mode)"

        elif step == "describe_changes":
            # Already covered by change analysis
            pass

        elif step in {"analyze_optical", "analyze_sar"}:
            idx = 0 if step == "analyze_optical" else 1
            if idx < len(image_paths):
                prompt = _build_single_image_prompt(user_query, "IMAGE_ANALYSIS", language)
                response = await _analyze_safe([image_paths[idx]], prompt)
                results[f"{step}_result"] = response

        elif step == "fuse_results":
            # Combine the optical and SAR analyses
            prompt = _build_fusion_prompt(results.get("analyze_optical_result", ""), results.get("analyze_sar_result", ""), user_query, language)
            response = await _chat_safe([{"role": "user", "content": prompt}])
            results["fusion"] = response
            answer_parts.append(response)

        elif step == "cross_modal_reasoning":
            # Already covered by fusion
            pass

        elif step == "analyze_temporal_sequence":
            # Multi-temporal analysis
            prompts = []
            for i, path in enumerate(image_paths):
                prompt = _build_single_image_prompt(user_query, "MULTITEMPORAL_ANALYSIS", language)
                response = await _analyze_safe([path], prompt)
                prompts.append(f"Image {i+1}: {response}")
            final_prompt = f"Based on these temporal analyses:\n{chr(10).join(prompts)}\nAnswer: {user_query}"
            response = await _chat_safe([{"role": "user", "content": final_prompt}])
            results["temporal"] = response
            answer_parts.append(response)

    metadata = {
        "model": getattr(active_provider, "model", None),
        "provider": active_provider.name,
        "is_fallback": is_fallback,
        "fallback_reason": fallback_reason,
    }
    if is_fallback and image_paths:
        from ai.preprocessing.image_preprocessor import preprocess_image
        try:
            image, image_metadata = preprocess_image(image_paths[0])
            metadata["image_stats"] = {
                "shape": list(image.shape),
                "mean": float(image.mean()),
                "std": float(image.std()),
                "format": image_metadata.get("format"),
            }
        except (OSError, ValueError):
            metadata["image_stats"] = None

    return {
        "analysis_type": intent,
        "answer": " ".join(answer_parts) if answer_parts else "Analysis completed.",
        "confidence": None,  # Will be set by calling code if available
        "evidence": evidence,
        "metadata": metadata,
    }


def _build_single_image_prompt(query: str, intent: str, language: str) -> str:
    lang_suffix = f" Respond in {language}." if language != "en" else ""
    base = f"Analyze this satellite image. User query: \"{query}\""
    if intent == "IMAGE_CAPTIONING":
        return f"Provide a detailed caption/description of this satellite image.{lang_suffix}"
    elif intent == "VISUAL_QA":
        return f"{base}. Answer the question directly based on visual evidence.{lang_suffix}"
    elif intent == "GENERAL":
        return f"{base}. Provide a comprehensive analysis.{lang_suffix}"
    return f"{base}.{lang_suffix}"


def _build_detection_prompt(query: str, language: str) -> str:
    lang_suffix = f" Respond in {language}." if language != "en" else ""
    return (
        f"Perform object detection on this satellite image. Query: \"{query}\". "
        "Identify all objects visible in the image and describe each one clearly. "
        "For each detected object, state what it is, where it is located in the image "
        "(e.g. upper-left, center, along the coastline), and your confidence level. "
        "Use natural language with short sentences. Do NOT return raw JSON, code blocks, "
        "or coordinate arrays — describe everything in plain text." + lang_suffix
    )


def _build_change_detection_prompt(query: str, language: str) -> str:
    lang_suffix = f" Respond in {language}." if language != "en" else ""
    return (
        f"Compare these two satellite images (before and after) and detect changes. "
        f"Query: \"{query}\". Describe what changed, where, and the nature of the change. "
        "If you can provide changed region coordinates, include them." + lang_suffix
    )


def _build_fusion_prompt(optical_result: str, sar_result: str, query: str, language: str) -> str:
    lang_suffix = f" Respond in {language}." if language != "en" else ""
    return (
        f"Cross-modal analysis. Optical image analysis: {optical_result}. "
        f"SAR image analysis: {sar_result}. "
        f"User query: \"{query}\". Fuse these analyses and provide a unified answer." + lang_suffix
    )