from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Dict, List

from flask import Blueprint, jsonify, request

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

sentiment_bp = Blueprint("sentiment", __name__, url_prefix="/api/sentiment")
logger = logging.getLogger(__name__)

_analyzer: SentimentIntensityAnalyzer | None = None


def _get_analyzer() -> SentimentIntensityAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = SentimentIntensityAnalyzer()
    return _analyzer


_BASIC_STOP = {
    "a","an","and","are","as","at","be","but","by","for","if","in","into","is","it","no","not","of","on","or","such","that","the","their","then","there","these","they","this","to","was","will","with","you","your","i","me","my","we","our"
}


def _extract_keywords(text: str, top_k: int = 5) -> List[str]:
    import re
    from collections import Counter

    tokens = [t for t in re.split(r"[^a-zA-Z]+", (text or "").lower()) if t and len(t) >= 3 and t not in _BASIC_STOP]
    counts = Counter(tokens)
    # Keep top_k unique words
    return [w for w, _ in counts.most_common(top_k)]


def _label_from_compound(compound: float) -> str:
    # VADER thresholds
    if compound >= 0.05:
        return "Positive"
    if compound <= -0.05:
        return "Negative"
    return "Neutral"


def _analyze_text(text: str) -> Dict:
    analyzer = _get_analyzer()
    scores = analyzer.polarity_scores(text or "")
    compound = float(scores.get("compound", 0.0))
    label = _label_from_compound(compound)
    intensity = float(abs(compound))  # 0..1 strength of sentiment
    keywords = _extract_keywords(text)
    return {
        "label": label,
        "intensity": intensity,
        "compound": compound,
        "keywords": keywords,
        "model": "vader",
    }


@sentiment_bp.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()
        top_k = int(data.get("top_k", 5))
        if not text:
            return jsonify({"status": "error", "error": "Text is required"}), 400

        result = _analyze_text(text)
        # Adjust keyword count
        if top_k and isinstance(top_k, int) and top_k > 0:
            result["keywords"] = result.get("keywords", [])[:top_k]

        # Lightweight analytics log (no PII):
        logger.info("sentiment.analyze len=%d label=%s intensity=%.3f", len(text), result["label"], result["intensity"])
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        logger.exception("/api/sentiment/analyze failed")
        return jsonify({"status": "error", "error": str(e)}), 500


@sentiment_bp.route("/analyze-batch", methods=["POST"])
def analyze_batch():
    try:
        data = request.get_json(silent=True) or {}
        texts = data.get("texts") or []
        if not isinstance(texts, list) or not texts:
            return jsonify({"status": "error", "error": "'texts' must be a non-empty list"}), 400

        results = [_analyze_text(str(t)) for t in texts]
        logger.info("sentiment.analyze-batch count=%d", len(texts))
        return jsonify({"status": "success", "data": results}), 200
    except Exception as e:
        logger.exception("/api/sentiment/analyze-batch failed")
        return jsonify({"status": "error", "error": str(e)}), 500


@sentiment_bp.route("/metrics", methods=["GET"])
def metrics():
    """Return evaluation metrics from available trained models (if present)."""
    import json
    from pathlib import Path

    out: Dict[str, dict] = {}
    try:
        base = Path(__file__).resolve().parent.parent / "models" / "sentiment_custom" / "artifacts"
        classical = base / "mental_health" / "meta.json"
        lstm = base / "mental_health_lstm" / "meta.json"
        if classical.exists():
            out["tfidf_logreg"] = json.loads(classical.read_text(encoding="utf-8")).get("metrics", {})
        if lstm.exists():
            out["keras_lstm"] = json.loads(lstm.read_text(encoding="utf-8")).get("metrics", {})
        return jsonify({"status": "success", "data": out}), 200
    except Exception as e:
        logger.exception("/api/sentiment/metrics failed")
        return jsonify({"status": "error", "error": str(e)}), 500
