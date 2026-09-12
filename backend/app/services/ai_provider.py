import os
import json
import httpx
import asyncio
import random
from typing import List, Dict, Optional, Any
from abc import ABC, abstractmethod

from app.config import settings


class AIProvider(ABC):
    """Abstract interface for AI providers that can reason about images and text."""

    name: str = "base"

    @abstractmethod
    async def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        ...

    @abstractmethod
    async def analyze_image(self, image_paths: List[str], prompt: str, **kwargs) -> str:
        ...

    @abstractmethod
    async def classify_query(self, query: str) -> Dict[str, Any]:
        ...


class OpenAICompatibleProvider(AIProvider):
    name = "openai_compatible"

    def __init__(self, base_url: str, api_key: str, model: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model

    async def _post(self, payload: Dict[str, Any], timeout: float = 120.0) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        max_retries = 3
        base_delay = 1.0

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )

                    if response.status_code == 429:
                        if attempt < max_retries - 1:
                            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                            print(f"Rate limited (429), retrying in {delay:.2f}s (attempt {attempt + 1}/{max_retries})")
                            await asyncio.sleep(delay)
                            continue
                        response.raise_for_status()
                    elif 500 <= response.status_code < 600:
                        if attempt < max_retries - 1:
                            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                            print(f"Server error ({response.status_code}), retrying in {delay:.2f}s (attempt {attempt + 1}/{max_retries})")
                            await asyncio.sleep(delay)
                            continue
                        response.raise_for_status()

                    response.raise_for_status()
                    return response.json()

            except httpx.HTTPStatusError as e:
                if attempt < max_retries - 1 and e.response.status_code in (429, 500, 502, 503, 504):
                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    print(f"HTTP error ({e.response.status_code}), retrying in {delay:.2f}s (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(delay)
                    continue
                raise
            except (httpx.RequestError, asyncio.TimeoutError) as e:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    print(f"Request error ({type(e).__name__}), retrying in {delay:.2f}s (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(delay)
                    continue
                raise RuntimeError(f"Failed after {max_retries} attempts: {e}") from e

    async def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": kwargs.get("temperature", 0.3),
        }
        if kwargs.get("response_format") == "json":
            payload["response_format"] = {"type": "json_object"}
        data = await self._post(payload)
        return data["choices"][0]["message"]["content"]

    async def analyze_image(self, image_paths: List[str], prompt: str, **kwargs) -> str:
        # Convert local file paths to data URIs
        import base64
        image_contents = []
        for p in image_paths:
            if p.startswith("http"):
                image_contents.append({"type": "image_url", "image_url": {"url": p}})
            else:
                from pathlib import Path
                path = Path(p)
                if not path.exists():
                    continue
                mime = "image/png"
                if path.suffix.lower() in (".jpg", ".jpeg"):
                    mime = "image/jpeg"
                elif path.suffix.lower() in (".tif", ".tiff"):
                    mime = "image/tiff"
                b64 = base64.b64encode(path.read_bytes()).decode()
                image_contents.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime};base64,{b64}"},
                })

        messages = [{
            "role": "user",
            "content": [{"type": "text", "text": prompt}] + image_contents,
        }]
        payload = {"model": self.model, "messages": messages, "temperature": kwargs.get("temperature", 0.3)}
        if kwargs.get("response_format") == "json":
            payload["response_format"] = {"type": "json_object"}
        data = await self._post(payload)
        return data["choices"][0]["message"]["content"]

    async def classify_query(self, query: str) -> Dict[str, Any]:
        system = (
            "You are a query router for a satellite-image analysis assistant. "
            "Classify the user query into exactly one of these intents: "
            "IMAGE_ANALYSIS, IMAGE_CAPTIONING, VISUAL_QA, OBJECT_DETECTION, "
            "REGION_GROUNDING, CHANGE_DETECTION, MULTITEMPORAL_ANALYSIS, "
            "CROSS_MODAL_ANALYSIS, LAND_COVER_ANALYSIS, GENERAL. "
            "Return JSON: {\"intent\": \"...\", \"confidence\": 0.0-1.0, "
            "\"reason\": \"...\", \"required_images\": 1 or 2}."
        )
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": query},
        ]
        try:
            result = await self.chat(messages, response_format="json")
            return json.loads(result)
        except Exception:
            return None


class GeminiProvider(AIProvider):
    name = "gemini"

    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key
        self.model = model or "gemini-3.5-flash-lite"

    async def _generate(self, parts: List[Dict[str, Any]]) -> str:
        if not self.api_key:
            raise RuntimeError("Gemini provider requires AI_API_KEY")
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent"
        )

        # Retry logic with exponential backoff for rate limits
        max_retries = 3
        base_delay = 1.0  # seconds

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(
                        url,
                        headers={"x-goog-api-key": self.api_key},
                        json={"contents": [{"role": "user", "parts": parts}]},
                    )

                    # Check for rate limit (429) or server errors (5xx)
                    if response.status_code == 429:
                        if attempt < max_retries - 1:
                            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                            print(f"Rate limited (429), retrying in {delay:.2f}s (attempt {attempt + 1}/{max_retries})")
                            await asyncio.sleep(delay)
                            continue
                        response.raise_for_status()
                    elif 500 <= response.status_code < 600:
                        if attempt < max_retries - 1:
                            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                            print(f"Server error ({response.status_code}), retrying in {delay:.2f}s (attempt {attempt + 1}/{max_retries})")
                            await asyncio.sleep(delay)
                            continue
                        response.raise_for_status()

                    if response.status_code in (401, 403):
                        error_detail = ""
                        try:
                            error_detail = response.json().get("error", {}).get("message", "")
                        except Exception:
                            pass
                        raise RuntimeError(
                            f"Gemini API authentication error ({response.status_code}): {error_detail or response.text}"
                        )

                    response.raise_for_status()
                    data = response.json()

                    try:
                        return data["candidates"][0]["content"]["parts"][0]["text"]
                    except (KeyError, IndexError, TypeError) as exc:
                        raise RuntimeError("Gemini returned no usable response") from exc

            except httpx.HTTPStatusError as e:
                error_detail = ""
                try:
                    error_detail = e.response.json().get("error", {}).get("message", "")
                except Exception:
                    pass
                if attempt < max_retries - 1 and e.response.status_code in (429, 500, 502, 503, 504):
                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    print(f"HTTP error ({e.response.status_code}), retrying in {delay:.2f}s (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(delay)
                    continue
                raise RuntimeError(
                    f"Gemini API error ({e.response.status_code}): {error_detail or str(e)}"
                ) from e
            except (httpx.RequestError, asyncio.TimeoutError) as e:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    print(f"Request error ({type(e).__name__}), retrying in {delay:.2f}s (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(delay)
                    continue
                raise RuntimeError(f"Failed after {max_retries} attempts: {e}") from e

    async def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        prompt = "\n".join(f"{message['role']}: {message['content']}" for message in messages)
        return await self._generate([{"text": prompt}])

    async def analyze_image(self, image_paths: List[str], prompt: str, **kwargs) -> str:
        import base64
        parts: List[Dict[str, Any]] = [{"text": prompt}]
        for image_path in image_paths:
            if image_path.startswith("http"):
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.get(image_path)
                    response.raise_for_status()
                data = response.content
                mime = response.headers.get("content-type", "image/jpeg").split(";", 1)[0]
            else:
                path = __import__("pathlib").Path(image_path)
                if not path.exists():
                    raise FileNotFoundError(f"Image file not found: {path.name}")
                data = path.read_bytes()
                mime = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
            parts.append({"inline_data": {"mime_type": mime, "data": base64.b64encode(data).decode()}})
        return await self._generate(parts)

    async def classify_query(self, query: str) -> Dict[str, Any]:
        return None


class DemoProvider(AIProvider):
    """Deterministic fallback provider used when no AI credentials are configured.
    It produces clearly-labeled demo output from real image statistics where possible."""

    name = "demo"

    async def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        # For demo mode, return a deterministic, clearly-labeled response.
        last_user = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user = m.get("content", "")
                if isinstance(last_user, list):
                    last_user = " ".join(
                        item.get("text", "") for item in last_user if isinstance(item, dict) and item.get("type") == "text"
                    )
                break
        return (
            f"[DEMO RESPONSE] I received your message: \"{last_user[:200]}\". "
            "This is running in Demo Mode without an external AI provider. "
            "Configure AI_PROVIDER=openai_compatible with AI_BASE_URL, AI_API_KEY, and AI_MODEL "
            "to enable real AI analysis."
        )

    async def analyze_image(self, image_paths: List[str], prompt: str, **kwargs) -> str:
        return (
            "[DEMO ANALYSIS] Demo mode is active. Image-based analysis requires a configured "
            "AI provider. The application computed basic visual statistics locally; see the "
            "evidence panel for real image-derived metrics."
        )

    async def classify_query(self, query: str) -> Dict[str, Any]:
        # Delegated to the deterministic fallback router in ai/agent/router.py
        return None


_provider_instance = None


def get_provider() -> AIProvider:
    """Return the configured AI provider. Defaults to demo mode."""
    global _provider_instance
    if _provider_instance is not None:
        return _provider_instance

    provider = settings.AI_PROVIDER.lower()
    if provider == "gemini":
        _provider_instance = GeminiProvider(settings.AI_API_KEY, settings.AI_MODEL)
    elif provider == "openai_compatible" and settings.AI_BASE_URL and settings.AI_API_KEY:
        _provider_instance = OpenAICompatibleProvider(
            base_url=settings.AI_BASE_URL,
            api_key=settings.AI_API_KEY,
            model=settings.AI_MODEL or "gpt-4o",
        )
    else:
        _provider_instance = DemoProvider()

    return _provider_instance


def reset_provider():
    global _provider_instance
    _provider_instance = None


def provider_status() -> Dict[str, Any]:
    provider = get_provider()
    return {
        "provider": provider.name,
        "configured": isinstance(provider, (OpenAICompatibleProvider, GeminiProvider)) and bool(
            getattr(provider, "api_key", None) or getattr(provider, "base_url", None)
        ),
        "model": getattr(provider, "model", None),
    }
