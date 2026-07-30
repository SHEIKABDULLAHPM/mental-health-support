"""Memory store - manages user profiles, conversation summaries, and long-term memory."""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

MEMORY_DIR = os.path.join(os.path.dirname(__file__), "memory_store")

EMOTION_KEYWORDS = {
    "happy": ["happy", "glad", "joyful", "grateful", "excited", "wonderful", "great"],
    "sad": ["sad", "unhappy", "depressed", "down", "blue", "miserable", "cry"],
    "anxious": ["anxious", "worried", "nervous", "fearful", "panic", "scared", "terrified"],
    "angry": ["angry", "frustrated", "irritated", "annoyed", "furious", "mad"],
    "hopeful": ["hopeful", "optimistic", "positive", "better", "improving"],
    "stressed": ["stressed", "overwhelmed", "burned out", "exhausted", "pressure"],
    "lonely": ["lonely", "alone", "isolated", "abandoned", "disconnected"],
    "hopeless": ["hopeless", "worthless", "helpless", "despair", "giving up"],
}

RISK_KEYWORDS = {
    "high": ["suicide", "kill myself", "end my life", "self-harm", "hurt myself", "want to die"],
    "medium": ["hopeless", "panic", "overwhelmed", "cant go on", "no reason to live"],
}


class MemoryStore:
    """Manages long-term memory for users."""

    def __init__(self):
        os.makedirs(MEMORY_DIR, exist_ok=True)

    def _user_path(self, user_id: str) -> str:
        safe = re.sub(r"[^a-zA-Z0-9_-]", "_", str(user_id))
        return os.path.join(MEMORY_DIR, f"{safe}.json")

    def _load(self, user_id: str) -> dict:
        path = self._user_path(user_id)
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "user_id": user_id,
            "profile": {},
            "conversation_summaries": [],
            "emotional_history": [],
            "topics_discussed": [],
            "coping_strategies": [],
            "last_updated": None,
        }

    def _save(self, user_id: str, data: dict):
        data["last_updated"] = datetime.now(timezone.utc).isoformat()
        path = self._user_path(user_id)
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning("Failed to save memory for %s: %s", user_id, e)

    def get_user_profile(self, user_id: str) -> dict:
        data = self._load(user_id)
        return data.get("profile", {})

    def update_profile(self, user_id: str, updates: dict):
        data = self._load(user_id)
        data["profile"].update(updates)
        self._save(user_id, data)

    def add_conversation_summary(self, user_id: str, summary: str, topics: List[str]):
        data = self._load(user_id)
        entry = {
            "summary": summary,
            "topics": topics,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        data["conversation_summaries"].append(entry)
        data["conversation_summaries"] = data["conversation_summaries"][-20:]

        for topic in topics:
            if topic not in data["topics_discussed"]:
                data["topics_discussed"].append(topic)

        self._save(user_id, data)

    def add_emotional_entry(self, user_id: str, text: str, emotion: str, sentiment: str, risk: str):
        data = self._load(user_id)
        entry = {
            "text_snippet": text[:200],
            "emotion": emotion,
            "sentiment": sentiment,
            "risk": risk,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        data["emotional_history"].append(entry)
        data["emotional_history"] = data["emotional_history"][-50:]
        self._save(user_id, data)

    def add_coping_strategy(self, user_id: str, strategy: str):
        data = self._load(user_id)
        if strategy not in data["coping_strategies"]:
            data["coping_strategies"].append(strategy)
        self._save(user_id, data)

    def get_memory_context(self, user_id: str) -> str:
        """Build a memory summary string for the prompt."""
        data = self._load(user_id)
        parts = []

        profile = data.get("profile", {})
        if profile:
            parts.append("User Profile:")
            for k, v in profile.items():
                parts.append(f"- {k}: {v}")

        emotional = data.get("emotional_history", [])
        if emotional:
            recent = emotional[-5:]
            parts.append("Recent Emotional State:")
            for e in recent:
                parts.append(f"- Emotion: {e.get('emotion','unknown')}, "
                             f"Sentiment: {e.get('sentiment','neutral')}, "
                             f"Context: \"{e.get('text_snippet','')}\"")

        topics = data.get("topics_discussed", [])
        if topics:
            parts.append(f"Topics discussed: {', '.join(topics[-8:])}")

        strategies = data.get("coping_strategies", [])
        if strategies:
            parts.append(f"Coping strategies used: {', '.join(strategies[-5:])}")

        return "\n".join(parts) if parts else ""

    def detect_emotion(self, text: str) -> str:
        """Simple keyword-based emotion detection."""
        text_l = text.lower()
        scores = {}
        for emotion, keywords in EMOTION_KEYWORDS.items():
            scores[emotion] = sum(1 for kw in keywords if kw in text_l)
        if max(scores.values()) == 0:
            return "neutral"
        return max(scores, key=scores.get)

    def detect_risk(self, text: str) -> dict:
        """Detect risk level from text."""
        text_l = text.lower()
        for keyword in RISK_KEYWORDS["high"]:
            if keyword in text_l:
                return {"level": "high", "reason": "Crisis keywords detected"}
        for keyword in RISK_KEYWORDS["medium"]:
            if keyword in text_l:
                return {"level": "medium", "reason": "Distress keywords detected"}
        return {"level": "low", "reason": "No immediate risk detected"}

    def generate_conversation_summary(self, history: List[dict]) -> str:
        """Generate a concise summary of recent conversation."""
        if not history:
            return ""
        recent = history[-6:]
        summary_parts = []
        for turn in recent:
            role = "User" if turn.get("role") == "user" else "Assistant"
            content = turn.get("content", "")[:150]
            if content:
                summary_parts.append(f"{role}: {content}")
        return " | ".join(summary_parts) if summary_parts else ""


memory_store = MemoryStore()


def get_memory_store() -> MemoryStore:
    return memory_store