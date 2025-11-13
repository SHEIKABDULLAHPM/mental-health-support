"""
Analytics and recommendations endpoints:
- /api/sentiment: VADER baseline for journaling sentiment
- /api/recommendations: content-based recommendations with sentence-transformers
"""
from __future__ import annotations

import os
import logging
from typing import List, Dict

from flask import Blueprint, jsonify, request

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api")
logger = logging.getLogger(__name__)

# --- Sentiment (VADER) ---
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    _vader = SentimentIntensityAnalyzer()
except Exception:
    _vader = None


@analytics_bp.route("/sentiment", methods=["POST"])
def sentiment_api():
    if _vader is None:
        return jsonify({"status": "error", "error": "VADER not available"}), 500
    data = request.get_json() or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"status": "error", "error": "text is required"}), 400
    scores = _vader.polarity_scores(text)
    # label mapping
    comp = scores.get("compound", 0)
    if comp >= 0.05:
        label = "positive"
    elif comp <= -0.05:
        label = "negative"
    else:
        label = "neutral"
    return jsonify({"status": "success", "data": {"scores": scores, "label": label}})


# --- Recommendations (embeddings) ---
_catalog: List[Dict] = [
    {"id": 1, "type": "meditation", "title": "Morning Mindfulness", "description": "Start your day with a 10-minute meditation", "category": "mindfulness"},
    {"id": 2, "type": "exercise", "title": "Gentle Yoga Flow", "description": "Relaxing yoga routine for stress relief", "category": "movement"},
    {"id": 3, "type": "breathing", "title": "4-7-8 Breathing Technique", "description": "Powerful breathing exercise for anxiety", "category": "breathing"},
    {"id": 4, "type": "journaling", "title": "Gratitude Journal", "description": "Write down 3 things you're grateful for", "category": "gratitude"},
]

_embedder = None
_catalog_emb = None


def _ensure_embedder():
    global _embedder, _catalog_emb
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        model_name = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
        _embedder = SentenceTransformer(model_name)
    if _catalog_emb is None:
        texts = [f"{it['title']}. {it['description']}" for it in _catalog]
        _catalog_emb = _embedder.encode(texts, normalize_embeddings=True)


@analytics_bp.route("/recommendations", methods=["POST"])
def recommendations_api():
    data = request.get_json() or {}
    query = (data.get("query") or "help me relax").strip()
    k = int(data.get("k", 3))
    _ensure_embedder()
    q_emb = _embedder.encode([query], normalize_embeddings=True)[0]
    # cosine sim
    import numpy as np
    sims = np.dot(_catalog_emb, q_emb)
    idx = np.argsort(-sims)[:k]
    items = []
    for i in idx:
        it = dict(_catalog[i])
        it["score"] = float(sims[i])
        items.append(it)
    return jsonify({"status": "success", "data": {"items": items}})
