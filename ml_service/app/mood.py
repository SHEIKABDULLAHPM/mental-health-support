from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
from statistics import mean

from flask import Blueprint, jsonify, request

mood_bp = Blueprint("mood", __name__, url_prefix="/api/mood")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
TEMP_DIR = os.path.join(BASE_DIR, "temp")
STORE_PATH = os.path.join(TEMP_DIR, "mood_entries.jsonl")


def _ensure_store():
    os.makedirs(TEMP_DIR, exist_ok=True)
    if not os.path.exists(STORE_PATH):
        with open(STORE_PATH, "w", encoding="utf-8") as handle:
            handle.write("")


def _parse_ts(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    try:
        normalized = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalized)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except Exception:
        return datetime.now(timezone.utc)


def _load_entries(user_id: str):
    _ensure_store()
    rows = []
    with open(STORE_PATH, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except Exception:
                continue
            if row.get("user_id") == user_id:
                row["_dt"] = _parse_ts(row.get("timestamp"))
                rows.append(row)
    rows.sort(key=lambda x: x.get("_dt", datetime.min.replace(tzinfo=timezone.utc)))
    return rows


def _append_entry(entry: dict):
    _ensure_store()
    with open(STORE_PATH, "a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, ensure_ascii=True) + "\n")


def _window_mean(values, size):
    if not values:
        return []
    out = []
    for index in range(len(values)):
        start = max(0, index - size + 1)
        segment = values[start:index + 1]
        out.append(round(mean(segment), 4))
    return out


def _label_from_delta(delta):
    if delta >= 0.1:
        return "improving"
    if delta <= -0.1:
        return "declining"
    return "stable"


@mood_bp.route("/submit", methods=["POST"])
def submit():
    data = request.get_json(silent=True) or {}
    user_id = str(data.get("user_id") or "").strip()
    score = data.get("score")
    if not user_id or score is None:
        return jsonify({"status": "error", "error": "user_id and score are required"}), 400

    try:
        entry = {
            "user_id": user_id,
            "timestamp": data.get("timestamp") or datetime.now(timezone.utc).isoformat(),
            "score": float(score),
            "activity": data.get("activity"),
            "journal": data.get("journal"),
        }
    except Exception:
        return jsonify({"status": "error", "error": "score must be numeric"}), 400

    _append_entry(entry)
    return jsonify({"status": "success", "data": entry}), 200


@mood_bp.route("/entries", methods=["GET"])
def entries():
    user_id = str(request.args.get("user_id") or "").strip()
    limit = int(request.args.get("limit", 100))
    if not user_id:
        return jsonify({"status": "error", "error": "user_id is required"}), 400

    rows = _load_entries(user_id)
    recent = list(reversed(rows[-max(1, min(limit, 500)):]))
    payload = [
        {
            "timestamp": row["_dt"].isoformat(),
            "score": float(row.get("score", 0.0)),
            "score_norm": round((float(row.get("score", 0.0)) + 10.0) / 20.0, 4),
            "activity": row.get("activity"),
            "journal": row.get("journal"),
        }
        for row in recent
    ]
    return jsonify({"status": "success", "data": payload}), 200


@mood_bp.route("/trends", methods=["GET"])
def trends():
    user_id = str(request.args.get("user_id") or "").strip()
    if not user_id:
        return jsonify({"status": "error", "error": "user_id is required"}), 400

    window = max(2, int(request.args.get("window", 7)))
    short_window = max(2, int(request.args.get("short_window", 3)))

    rows = _load_entries(user_id)
    if not rows:
        return jsonify({
            "status": "success",
            "data": {
                "summary": {"label": "stable", "delta": 0.0, "sample_size": 0},
                "series": [],
                "roll_mean": [],
                "roll_mean_short": [],
                "anomalies": [],
            },
        }), 200

    scores = [float(row.get("score", 0.0)) for row in rows]
    series = [{"t": row["_dt"].isoformat(), "v": score} for row, score in zip(rows, scores)]
    roll_mean = _window_mean(scores, window)
    roll_mean_short = _window_mean(scores, short_window)

    first = mean(scores[: min(window, len(scores))])
    last = mean(scores[max(0, len(scores) - window):])
    delta = round(last - first, 4)
    label = _label_from_delta(delta)

    baseline = mean(scores)
    spread = max(0.5, abs(baseline) * 0.35)
    anomalies = [
        {"t": row["_dt"].isoformat(), "v": score, "reason": "deviation"}
        for row, score in zip(rows, scores)
        if abs(score - baseline) > spread
    ]

    return jsonify({
        "status": "success",
        "data": {
            "summary": {"label": label, "delta": delta, "sample_size": len(scores)},
            "series": series,
            "roll_mean": roll_mean,
            "roll_mean_short": roll_mean_short,
            "anomalies": anomalies,
        },
    }), 200


@mood_bp.route("/forecast", methods=["GET"])
def forecast():
    user_id = str(request.args.get("user_id") or "").strip()
    if not user_id:
        return jsonify({"status": "error", "error": "user_id is required"}), 400

    days_ahead = max(1, min(int(request.args.get("days_ahead", 7)), 30))
    rows = _load_entries(user_id)
    if rows:
        recent_scores = [float(row.get("score", 0.0)) for row in rows[-min(14, len(rows)):]]
        baseline = mean(recent_scores)
    else:
        baseline = 0.0

    today = datetime.now(timezone.utc).date()
    out = []
    for offset in range(1, days_ahead + 1):
        day = today + timedelta(days=offset)
        out.append({"t": day.isoformat(), "v": round(float(baseline), 4)})

    return jsonify({"status": "success", "data": out}), 200
