"""Multilingual support for SATQUERY AI.

Initial languages: English, Telugu, Hindi.
The architecture allows adding Tamil, Kannada, Malayalam, Bengali, Marathi.

Strategy:
  1. If the configured provider can understand the selected language directly,
     we prefer direct multilingual prompting (handled in the planner/prompts).
  2. Otherwise, use a translation layer. When no external translation API is
     configured, we provide a deterministic character-level fallback for Telugu
     and Hindi so the demo retains multilingual behavior, clearly labeled.
"""

from typing import Optional

SUPPORTED_LANGUAGES = {
    "en": "English",
    "te": "Telugu",
    "hi": "Hindi",
    # Future languages:
    # "ta": "Tamil",
    # "kn": "Kannada",
    # "ml": "Malayalam",
    # "bn": "Bengali",
    # "mr": "Marathi",
}

# Small built-in glossary for deterministic demo translation (Telugu/Hindi).
# This is a clearly-labeled fallback, not a real translator.
_GLOSSARY = {
    "en": {
        "buildings": "భవనాలు",
        "water": "నీరు",
        "change": "మార్పు",
        "image": "చిత్రం",
        "analysis": "విశ్లేషణ",
        "detected": "గుర్తించబడింది",
    },
    "hi": {
        "buildings": "इमारतें",
        "water": "पानी",
        "change": "बदलाव",
        "image": "छवि",
        "analysis": "विश्लेषण",
        "detected": "पता चला",
    },
}


def normalize_lang(language: str) -> str:
    if not language:
        return "en"
    return language.lower()


def is_supported(language: str) -> bool:
    return normalize_lang(language) in SUPPORTED_LANGUAGES


def get_language_name(language: str) -> str:
    lang = normalize_lang(language)
    return SUPPORTED_LANGUAGES.get(lang, "English")


def translate_to_english(text: str, language: str) -> str:
    """Translate user text to English.

    With no external translation engine configured, we return the text as-is and
    rely on the AI provider's native multilingual understanding (the preferred
    path). Deterministic glossary substitution is NOT attempted for user queries
    to avoid mangling them.
    """
    lang = normalize_lang(language)
    if lang == "en":
        return text
    # Preferred: direct multilingual understanding by the provider.
    # No destructive translation applied to user input.
    return text


def demo_translate_answer(answer: str, language: str) -> str:
    """Deterministic demo translation used ONLY when the provider is in demo mode
    and no real translation is available. Clearly labeled as demo translation."""
    lang = normalize_lang(language)
    if lang == "en" or lang not in _GLOSSARY:
        return answer

    translated = answer
    for en_word, translated_word in _GLOSSARY[lang].items():
        translated = translated.replace(en_word, translated_word)

    if translated != answer:
        marker = "తెలుగు" if lang == "te" else "हिंदी"
        translated = f"[{marker} demo-translation] {translated}"
    return translated


def translate_answer(answer: str, language: str, provider_name: str = "demo") -> str:
    """Top-level translation entry used by the query flow."""
    lang = normalize_lang(language)
    if lang == "en":
        return answer

    # If a real provider is configured, it handled multilingual prompting directly.
    if provider_name != "demo":
        # Real providers respond in-language; pass through unless clearly English.
        return answer

    # Demo mode: apply deterministic fallback translation.
    return demo_translate_answer(answer, lang)