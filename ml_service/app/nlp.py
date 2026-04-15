"""
NLP utilities for language detection and moderation.
- LanguageDetector: detects ISO language code using langdetect
- ModerationService: checks input/output for safety via heuristic and optional transformer model
"""
from __future__ import annotations

import os
import time
from typing import Dict, Optional

try:
    from langdetect import detect
    LANGDETECT_AVAILABLE = True
except Exception:
    LANGDETECT_AVAILABLE = False

try:
    from transformers import AutoTokenizer, AutoModelForSequenceClassification, TextClassificationPipeline
    HF_AVAILABLE = True
except Exception:
    HF_AVAILABLE = False


class LanguageDetector:
    @staticmethod
    def detect_language(text: str) -> Optional[str]:
        if not text:
            return None
        if not LANGDETECT_AVAILABLE:
            return None
        try:
            code = detect(text)
            return code
        except Exception:
            return None


class ModerationService:
    """Moderation with optional transformer classifier and simple rate limiting."""
    def __init__(self) -> None:
        self.model_name = os.getenv("MODERATION_MODEL_NAME", "")
        self.threshold = float(os.getenv("MODERATION_THRESHOLD", "0.7"))
        self.cooldown_seconds = int(os.getenv("CRISIS_COOLDOWN_SECONDS", "120"))
        self.max_flags_per_hour = int(os.getenv("MAX_FLAGS_PER_HOUR", "3"))

        self.pipeline: Optional[TextClassificationPipeline] = None
        if self.model_name and HF_AVAILABLE:
            try:
                tok = AutoTokenizer.from_pretrained(self.model_name)
                mdl = AutoModelForSequenceClassification.from_pretrained(self.model_name)
                self.pipeline = TextClassificationPipeline(model=mdl, tokenizer=tok, top_k=None)
            except Exception:
                self.pipeline = None

        # in-memory counters: {conversation_id: [timestamps]}
        self.flags: Dict[str, list[float]] = {}
        self.cooldowns: Dict[str, float] = {}

    def _prune(self, conversation_id: str) -> None:
        now = time.time()
        one_hour_ago = now - 3600
        if conversation_id in self.flags:
            self.flags[conversation_id] = [t for t in self.flags[conversation_id] if t >= one_hour_ago]
        # prune expired cooldown
        if self.cooldowns.get(conversation_id, 0) < now:
            self.cooldowns.pop(conversation_id, None)

    def add_flag(self, conversation_id: str) -> None:
        now = time.time()
        self.flags.setdefault(conversation_id, []).append(now)
        if len(self.flags[conversation_id]) >= self.max_flags_per_hour:
            self.cooldowns[conversation_id] = now + self.cooldown_seconds

    def is_rate_limited(self, conversation_id: str) -> bool:
        self._prune(conversation_id)
        return time.time() < self.cooldowns.get(conversation_id, 0)

    def classify(self, text: str) -> Dict[str, float]:
        """Return probability of unsafe/toxic if model is available; else empty dict."""
        if not text or not self.pipeline:
            return {}
        try:
            out = self.pipeline(text, truncation=True)
            # normalize to a dict: {label: score}
            scores = {}
            for item in (out if isinstance(out, list) else [out]):
                if isinstance(item, list):
                    for d in item:
                        scores[d.get("label", "")] = float(d.get("score", 0))
                elif isinstance(item, dict):
                    scores[item.get("label", "")] = float(item.get("score", 0))
            return scores
        except Exception:
            return {}

    def is_unsafe(self, text: str) -> bool:
        scores = self.classify(text)
        if not scores:
            return False
        # Heuristic: if any class suggests toxicity/unsafe above threshold
        toxic_labels = {"toxic", "insult", "threat", "obscene", "identity_attack", "severe_toxic"}
        return any(scores.get(lbl, 0) >= self.threshold for lbl in toxic_labels)
