from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

reco_bp = Blueprint("reco", __name__, url_prefix="/api/reco")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "datasets", "reco")
TEMP_DIR = os.path.join(BASE_DIR, "temp")
FEEDBACK_PATH = os.path.join(TEMP_DIR, "reco_feedback.jsonl")

_ENGINE_BUNDLE = None
_LAST_EVAL_TS = 0
_LAST_EVAL_RESULT = None


def _safe_default_items():
    return [
        {"item_id": "mindful-breathing", "title": "2-Minute Mindful Breathing", "category": "exercise", "tags": ["anxiety", "calm"]},
        {"item_id": "sleep-reset", "title": "Sleep Reset Checklist", "category": "routine", "tags": ["sleep", "stress"]},
        {"item_id": "gratitude-journal", "title": "Gratitude Journal Prompt", "category": "journal", "tags": ["positive", "reflection"]},
    ]


def _build_engine_bundle():
    global _ENGINE_BUNDLE
    if _ENGINE_BUNDLE is not None:
        return _ENGINE_BUNDLE

    if not os.path.isdir(DATA_DIR):
        _ENGINE_BUNDLE = {"available": False, "reason": "dataset directory missing"}
        return _ENGINE_BUNDLE

    try:
        from recommendation_engine.utils.preprocessing import load_reco_datasets
        from recommendation_engine.models.hybrid import HybridRecommender

        items_df, interactions_df = load_reco_datasets(DATA_DIR)
        model = HybridRecommender(alpha=0.5)
        model.load_data(items_df, interactions_df)
        model.train()

        _ENGINE_BUNDLE = {
            "available": True,
            "model": model,
            "items_df": items_df,
            "interactions_df": interactions_df,
        }
    except Exception as exc:
        _ENGINE_BUNDLE = {"available": False, "reason": str(exc)}

    return _ENGINE_BUNDLE


def _map_item(item):
    return {
        "id": item.get("item_id") or item.get("id"),
        "title": item.get("title", "Untitled"),
        "type": item.get("category", "Item"),
        "tags": item.get("tags", []) if isinstance(item.get("tags", []), list) else [],
        "score": float(item.get("score", 0.5) or 0.5),
    }


def _recommend_fallback(top_n: int):
    items = _safe_default_items()[:top_n]
    return [{**_map_item(item), "score": round(0.7 - (idx * 0.1), 3)} for idx, item in enumerate(items)]


@reco_bp.route("/health", methods=["GET"])
def reco_health():
    bundle = _build_engine_bundle()
    if not bundle.get("available"):
        return jsonify({
            "status": "success",
            "engine": {
                "available": False,
                "reason": bundle.get("reason", "fallback mode"),
                "fallback": True,
            },
        }), 200

    model = bundle["model"]
    return jsonify({
        "status": "success",
        "engine": {
            "available": True,
            "fallback": False,
            "alpha": getattr(model, "alpha", None),
            "items": int(len(bundle["items_df"])),
            "users": int(len(bundle["interactions_df"])),
        },
    }), 200


@reco_bp.route("/model-info", methods=["GET"])
def model_info():
    return reco_health()


@reco_bp.route("/recommend", methods=["POST"])
def recommend_post():
    data = request.get_json(silent=True) or {}
    user_id = str(data.get("user_id") or "").strip()
    if not user_id:
        return jsonify({"status": "error", "error": "user_id is required"}), 400

    top_n = max(1, min(int(data.get("top_n", 5)), 30))
    strategy = str(data.get("strategy") or "hybrid").lower()
    alpha = float(data.get("alpha", 0.5))
    context = data.get("context") or {}

    bundle = _build_engine_bundle()
    if not bundle.get("available"):
        return jsonify({
            "status": "success",
            "data": {
                "user_id": user_id,
                "items": _recommend_fallback(top_n),
                "strategy": "fallback",
                "fallback": True,
                "reason": bundle.get("reason", "engine unavailable"),
            },
        }), 200

    try:
        model = bundle["model"]
        model.alpha = max(0.0, min(1.0, alpha))
        items = model.recommend(user_id, top_n=top_n, strategy=strategy, alpha=alpha, context=context)
        mapped = [_map_item(item) for item in items]
        return jsonify({"status": "success", "data": {"user_id": user_id, "items": mapped, "strategy": strategy}}), 200
    except Exception as exc:
        return jsonify({
            "status": "success",
            "data": {
                "user_id": user_id,
                "items": _recommend_fallback(top_n),
                "strategy": "fallback",
                "fallback": True,
                "reason": str(exc),
            },
        }), 200


@reco_bp.route("/recommendations", methods=["GET"])
def recommend_get():
    user_id = str(request.args.get("user_id") or "").strip()
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    top_n = max(1, min(int(request.args.get("top_n", 5)), 30))
    strategy = str(request.args.get("strategy") or "hybrid").lower()
    alpha = float(request.args.get("alpha", 0.5))
    mood = request.args.get("mood")

    payload = {
        "user_id": user_id,
        "top_n": top_n,
        "strategy": strategy,
        "alpha": alpha,
        "context": {"mood": mood} if mood else {},
    }

    with reco_bp.test_request_context(json=payload):
        result = recommend_post()

    if isinstance(result, tuple):
        response, status = result
    else:
        response, status = result, result.status_code

    if status >= 400:
        return response, status

    body = response.get_json(silent=True) or {}
    items = (body.get("data") or {}).get("items", [])
    simplified = {
        "user_id": user_id,
        "recommendations": [
            {
                "id": item.get("id"),
                "title": item.get("title"),
                "type": item.get("type"),
                "tags": item.get("tags", []),
                "score": item.get("score", 0.5),
            }
            for item in items
        ],
        "fallback": bool((body.get("data") or {}).get("fallback")),
    }
    return jsonify(simplified), 200


@reco_bp.route("/recommend", methods=["GET"])
def recommend_get_alias():
    return recommend_get()


@reco_bp.route("/feedback", methods=["POST"])
def feedback():
    data = request.get_json(silent=True) or {}
    user_id = str(data.get("user_id") or "").strip()
    item_id = str(data.get("item_id") or "").strip()
    if not user_id or not item_id:
        return jsonify({"status": "error", "error": "user_id and item_id are required"}), 400

    rating = float(data.get("rating", 1))
    action = data.get("action", "like")

    os.makedirs(TEMP_DIR, exist_ok=True)
    with open(FEEDBACK_PATH, "a", encoding="utf-8") as handle:
      handle.write(json.dumps({
          "ts": datetime.now(timezone.utc).isoformat(),
          "user_id": user_id,
          "item_id": item_id,
          "rating": rating,
          "action": action,
          "context": data.get("context") or {},
      }, ensure_ascii=True) + "\n")

    return jsonify({"status": "success", "message": "feedback recorded"}), 200


@reco_bp.route("/metrics", methods=["GET"])
def metrics():
    global _LAST_EVAL_TS, _LAST_EVAL_RESULT

    now = time.time()
    if _LAST_EVAL_RESULT is not None and (now - _LAST_EVAL_TS) < 60:
        return jsonify({"status": "success", "data": _LAST_EVAL_RESULT}), 200

    bundle = _build_engine_bundle()
    if not bundle.get("available"):
        _LAST_EVAL_RESULT = {
            "k": int(request.args.get("k", 5)),
            "strategy": str(request.args.get("strategy") or "hybrid"),
            "fallback": True,
            "coverage": 0.0,
            "ndcg": 0.0,
            "reason": bundle.get("reason", "engine unavailable"),
        }
        _LAST_EVAL_TS = now
        return jsonify({"status": "success", "data": _LAST_EVAL_RESULT}), 200

    try:
        from recommendation_engine.utils.evaluation import evaluate_holdout_at_k

        k = int(request.args.get("k", 5))
        strategy = str(request.args.get("strategy") or "hybrid")
        evaluated = evaluate_holdout_at_k(bundle["model"], bundle["interactions_df"], k=k, strategy=strategy)
        _LAST_EVAL_RESULT = {"k": k, "strategy": strategy, **evaluated, "fallback": False}
        _LAST_EVAL_TS = now
        return jsonify({"status": "success", "data": _LAST_EVAL_RESULT}), 200
    except Exception as exc:
        _LAST_EVAL_RESULT = {
            "k": int(request.args.get("k", 5)),
            "strategy": str(request.args.get("strategy") or "hybrid"),
            "fallback": True,
            "coverage": 0.0,
            "ndcg": 0.0,
            "reason": str(exc),
        }
        _LAST_EVAL_TS = now
        return jsonify({"status": "success", "data": _LAST_EVAL_RESULT}), 200
