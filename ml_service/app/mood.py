from __future__ import annotations

from flask import Blueprint, request, jsonify
from datetime import datetime
import os
import pandas as pd
from models.mood.analysis import (
    load_user_entries,
    append_user_entry,
    preprocess_entries,
    compute_trend,
    detect_anomalies,
    forecast,
)

mood_bp = Blueprint("mood", __name__, url_prefix="/api/mood")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "datasets", "mood")


@mood_bp.route("/submit", methods=["POST"])
def submit():
    data = request.get_json(silent=True) or {}
    user_id = (data.get("user_id") or "").strip() or None
    score = data.get("score")
    if not user_id or score is None:
        return jsonify({"status": "error", "error": "user_id and score are required"}), 400
    try:
        ts = data.get("timestamp") or datetime.utcnow().isoformat()
        rec = append_user_entry(DATA_DIR, user_id, {
            "timestamp": ts,
            "score": float(score),
            "activity": data.get("activity"),
            "journal": data.get("journal"),
        })
        return jsonify({"status": "success", "data": rec}), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@mood_bp.route("/entries", methods=["GET"])
def entries():
    user_id = (request.args.get("user_id") or "").strip()
    limit = int(request.args.get("limit", 100))
    if not user_id:
        return jsonify({"status": "error", "error": "user_id is required"}), 400
    try:
        df = load_user_entries(DATA_DIR, user_id)
        df = preprocess_entries(df)
        # Return most recent first
        df = df.sort_values("timestamp", ascending=False).head(limit)
        items = [
            {"timestamp": r["timestamp"].isoformat(), "score": float(r["score"]), "score_norm": float(r["score_norm"]),
             "activity": r.get("activity"), "journal": r.get("journal")} for _, r in df.iterrows()
        ]
        return jsonify({"status": "success", "data": items}), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@mood_bp.route("/trends", methods=["GET"])
def trends():
    user_id = (request.args.get("user_id") or "").strip()
    if not user_id:
        return jsonify({"status": "error", "error": "user_id is required"}), 400
    try:
        window = int(request.args.get("window", 7))
        short_window = int(request.args.get("short_window", 3))
        df = load_user_entries(DATA_DIR, user_id)
        trends = compute_trend(df, window=window, short_window=short_window)
        anomalies = detect_anomalies(df, window=window)
        return jsonify({"status": "success", "data": {**trends, "anomalies": anomalies}}), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@mood_bp.route("/forecast", methods=["GET"])
def forecast_ep():
    user_id = (request.args.get("user_id") or "").strip()
    if not user_id:
        return jsonify({"status": "error", "error": "user_id is required"}), 400
    try:
        days_ahead = int(request.args.get("days_ahead", 7))
        df = load_user_entries(DATA_DIR, user_id)
        fc = forecast(df, days_ahead=days_ahead)
        return jsonify({"status": "success", "data": fc}), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500
