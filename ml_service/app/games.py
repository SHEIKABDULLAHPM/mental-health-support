"""
Games persistence and analytics endpoints
Provides lightweight SQLite-backed storage for calming games: sessions, events,
preferences, scores, and Zen Garden saves.
"""
from __future__ import annotations

import os
import uuid
import base64
import sqlite3
from datetime import datetime
from typing import Any, Dict

from flask import Blueprint, jsonify, request, send_file

games_bp = Blueprint("games", __name__, url_prefix="/api/games")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DB_PATH = os.path.join(DATA_DIR, "games.db")
ZEN_DIR = os.path.join(DATA_DIR, "zen")


def _ensure_dirs():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(ZEN_DIR, exist_ok=True)


def _get_db():
    _ensure_dirs()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    _init_db(conn)
    return conn


def _init_db(conn: sqlite3.Connection):
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            created_at TEXT
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            game TEXT,
            started_at TEXT,
            ended_at TEXT,
            duration INTEGER DEFAULT 0
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            session_id TEXT,
            game TEXT,
            type TEXT,
            payload TEXT,
            ts TEXT
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS scores (
            user_id TEXT,
            game TEXT,
            high_score INTEGER,
            updated_at TEXT,
            PRIMARY KEY (user_id, game)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS preferences (
            user_id TEXT,
            game TEXT,
            data TEXT,
            updated_at TEXT,
            PRIMARY KEY (user_id, game)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS zen_saves (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            image_path TEXT,
            theme TEXT,
            rake_width INTEGER,
            created_at TEXT
        )
        """
    )
    conn.commit()


def _now_iso():
    return datetime.utcnow().isoformat()


@games_bp.route("/session/start", methods=["POST"])
def start_session():
    data = request.get_json() or {}
    user_id = (data.get("userId") or "").strip() or f"anon-{uuid.uuid4()}"
    game = (data.get("game") or "").strip()
    if not game:
        return jsonify({"status": "error", "error": "game is required"}), 400
    sess_id = str(uuid.uuid4())
    with _get_db() as db:
        db.execute("INSERT OR IGNORE INTO users (id, created_at) VALUES (?, ?)", (user_id, _now_iso()))
        db.execute(
            "INSERT INTO sessions (id, user_id, game, started_at) VALUES (?, ?, ?, ?)",
            (sess_id, user_id, game, _now_iso()),
        )
        db.commit()
    return jsonify({"status": "success", "data": {"sessionId": sess_id, "userId": user_id}})


@games_bp.route("/session/stop", methods=["POST"])
def stop_session():
    data = request.get_json() or {}
    sess_id = (data.get("sessionId") or "").strip()
    if not sess_id:
        return jsonify({"status": "error", "error": "sessionId is required"}), 400
    with _get_db() as db:
        cur = db.execute("SELECT started_at FROM sessions WHERE id=?", (sess_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"status": "error", "error": "session not found"}), 404
        started = datetime.fromisoformat(row["started_at"]) if row["started_at"] else datetime.utcnow()
        ended = datetime.utcnow()
        duration = int((ended - started).total_seconds())
        db.execute(
            "UPDATE sessions SET ended_at=?, duration=? WHERE id=?",
            (_now_iso(), duration, sess_id),
        )
        db.commit()
    return jsonify({"status": "success", "data": {"duration": duration}})


@games_bp.route("/event", methods=["POST"])
def log_event():
    data = request.get_json() or {}
    sess_id = (data.get("sessionId") or "").strip()
    game = (data.get("game") or "").strip()
    ev_type = (data.get("type") or "").strip()
    payload = data.get("payload") or {}
    if not all([sess_id, game, ev_type]):
        return jsonify({"status": "error", "error": "sessionId, game, type are required"}), 400
    ev_id = str(uuid.uuid4())
    with _get_db() as db:
        db.execute(
            "INSERT INTO events (id, session_id, game, type, payload, ts) VALUES (?, ?, ?, ?, ?, ?)",
            (ev_id, sess_id, game, ev_type, str(payload), _now_iso()),
        )
        db.commit()
    return jsonify({"status": "success", "data": {"eventId": ev_id}})


@games_bp.route("/bubble/score", methods=["POST"])
def bubble_score():
    data = request.get_json() or {}
    user_id = (data.get("userId") or "").strip() or f"anon-{uuid.uuid4()}"
    score = int(data.get("score") or 0)
    game = "bubble"
    with _get_db() as db:
        cur = db.execute("SELECT high_score FROM scores WHERE user_id=? AND game=?", (user_id, game))
        row = cur.fetchone()
        if not row or (row["high_score"] is None) or score > int(row["high_score"]):
            db.execute(
                "INSERT INTO scores (user_id, game, high_score, updated_at) VALUES (?, ?, ?, ?)"
                " ON CONFLICT(user_id, game) DO UPDATE SET high_score=excluded.high_score, updated_at=excluded.updated_at",
                (user_id, game, score, _now_iso()),
            )
            db.commit()
            return jsonify({"status": "success", "data": {"isHighScore": True, "highScore": score}})
    return jsonify({"status": "success", "data": {"isHighScore": False}})


@games_bp.route("/preferences", methods=["POST"])
def set_preferences():
    data = request.get_json() or {}
    user_id = (data.get("userId") or "").strip() or f"anon-{uuid.uuid4()}"
    game = (data.get("game") or "").strip()
    prefs = data.get("preferences") or {}
    if not game:
        return jsonify({"status": "error", "error": "game is required"}), 400
    with _get_db() as db:
        db.execute(
            "INSERT INTO preferences (user_id, game, data, updated_at) VALUES (?, ?, ?, ?)"
            " ON CONFLICT(user_id, game) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at",
            (user_id, game, str(prefs), _now_iso()),
        )
        db.commit()
    return jsonify({"status": "success"})


@games_bp.route("/state", methods=["GET"])
def get_state():
    user_id = (request.args.get("userId") or "").strip()
    game = (request.args.get("game") or "").strip()
    with _get_db() as db:
        out: Dict[str, Any] = {"userId": user_id, "game": game}
        if game:
            cur = db.execute("SELECT data, updated_at FROM preferences WHERE user_id=? AND game=?", (user_id, game))
            pref = cur.fetchone()
            out["preferences"] = pref["data"] if pref else None
            cur2 = db.execute("SELECT high_score FROM scores WHERE user_id=? AND game=?", (user_id, game))
            score = cur2.fetchone()
            out["highScore"] = int(score["high_score"]) if (score and score["high_score"] is not None) else None
        # recent sessions summary
        cur3 = db.execute("SELECT COUNT(*) as cnt, COALESCE(SUM(duration),0) as secs FROM sessions WHERE user_id=?", (user_id,))
        agg = cur3.fetchone()
        out["sessions"] = {"count": int(agg["cnt"]), "seconds": int(agg["secs"])}
    return jsonify({"status": "success", "data": out})


@games_bp.route("/zen/save", methods=["POST"])
def zen_save():
    data = request.get_json() or {}
    user_id = (data.get("userId") or "").strip() or f"anon-{uuid.uuid4()}"
    image_data = (data.get("imageData") or "").strip()
    theme = (data.get("theme") or "").strip()
    rake_width = int(data.get("rakeWidth") or 8)
    if not image_data.startswith("data:image/png;base64,"):
        return jsonify({"status": "error", "error": "imageData must be a PNG data URL"}), 400
    img_b64 = image_data.split(",", 1)[1]
    img_bytes = base64.b64decode(img_b64)
    _ensure_dirs()
    zid = str(uuid.uuid4())
    path = os.path.join(ZEN_DIR, f"garden_{zid}.png")
    with open(path, "wb") as f:
        f.write(img_bytes)
    with _get_db() as db:
        db.execute(
            "INSERT INTO zen_saves (id, user_id, image_path, theme, rake_width, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (zid, user_id, path, theme, rake_width, _now_iso()),
        )
        db.commit()
    return jsonify({"status": "success", "data": {"id": zid}})


@games_bp.route("/zen/list", methods=["GET"])
def zen_list():
    user_id = (request.args.get("userId") or "").strip()
    with _get_db() as db:
        cur = db.execute(
            "SELECT id, theme, rake_width, created_at FROM zen_saves WHERE user_id=? ORDER BY created_at DESC LIMIT 20",
            (user_id,),
        )
        items = [dict(row) for row in cur.fetchall()]
    return jsonify({"status": "success", "data": items})


@games_bp.route("/zen/image/<zid>", methods=["GET"])
def zen_image(zid: str):
    with _get_db() as db:
        cur = db.execute("SELECT image_path FROM zen_saves WHERE id=?", (zid,))
        row = cur.fetchone()
        if not row:
            return jsonify({"status": "error", "error": "not found"}), 404
        path = row["image_path"]
        if not os.path.exists(path):
            return jsonify({"status": "error", "error": "file missing"}), 404
        return send_file(path, mimetype="image/png")
