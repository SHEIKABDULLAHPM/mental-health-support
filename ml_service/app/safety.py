"""
Safety and moderation layer: crisis detection, toxicity/PII heuristics, and output filtering.

This module is designed to be extended with a robust classifier (e.g., OpenAI moderation or
local HF classifiers). For now it combines conservative keyword matching with simple heuristics.
"""
from __future__ import annotations

import re
from typing import Dict


CRISIS_KEYWORDS = [
    r"\bsuicide\b",
    r"kill myself",
    r"end my life",
    r"self[- ]?harm",
    r"hurt myself",
    r"\bend it all\b",
    r"can't go on",
]

PII_PATTERNS = [
    re.compile(r"\b\d{3}[- ]?\d{2}[- ]?\d{4}\b"),  # SSN-like
    re.compile(r"\b\+?\d{1,3}[-. (]?\d{2,4}[-. )]?\d{3}[-.]?\d{4}\b"),  # phone-like
    re.compile(r"[\w.%-]+@[\w.-]+\.[A-Za-z]{2,}"),  # email
]

TOXIC_KEYWORDS = [
    r"\bhate\b",
    r"\bworthless\b",
    r"\bidiot\b",
]


def check_crisis(text: str) -> bool:
    t = text.lower()
    return any(re.search(p, t) for p in CRISIS_KEYWORDS)


def check_toxicity(text: str) -> bool:
    t = text.lower()
    return any(re.search(p, t) for p in TOXIC_KEYWORDS)


def redact_pii(text: str) -> str:
    redacted = text
    for pattern in PII_PATTERNS:
        redacted = pattern.sub("[REDACTED]", redacted)
    return redacted


def crisis_response() -> str:
    return (
        "I'm really glad you shared this with me. Your safety matters. "
        "If you're in immediate danger, call your local emergency number. "
        "You can also reach out right now: • International: findahelpline.com • US: 988 (Suicide & Crisis Lifeline) • UK & ROI: Samaritans 116 123. "
        "I'm here with you—would you like to try grounding strategies while you reach out?"
    )


def filter_output(text: str) -> Dict[str, str | bool]:
    """Filter model outputs; redact PII and flag if toxic."""
    toxic = check_toxicity(text)
    redacted = redact_pii(text)
    return {"text": redacted, "toxic": toxic}
