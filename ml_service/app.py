"""ML Flask service exposing sentiment, mood analytics and recommendation APIs."""

from __future__ import annotations

import base64
import logging
import os
import time
from datetime import datetime
from typing import Dict, Optional, Tuple

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
import cv2
import numpy as np
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

try:
    from deepface import DeepFace
except Exception:  # pragma: no cover - runtime dependency may be missing
    DeepFace = None

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

SENTIMENT = SentimentIntensityAnalyzer()
FACE_MODEL_BACKEND = os.getenv("FACE_MODEL_BACKEND", "opencv")


class FaceEmotionService:
    """Loads and caches the face emotion model once for the process lifecycle."""

    def __init__(self):
        self._ready = False
        self._reason = "Emotion model not ready"
        self._model = None
        self._load_model()

    @property
    def ready(self) -> bool:
        return self._ready

    @property
    def reason(self) -> str:
        return self._reason

    def _load_model(self) -> None:
        if DeepFace is None:
            self._ready = False
            self._reason = "DeepFace is not installed"
            logger.warning("Face emotion model not ready: %s", self._reason)
            return

        try:
            # Explicit warm-up to avoid per-request cold starts.
            self._model = DeepFace.build_model("Emotion")
            self._ready = True
            self._reason = ""
            logger.info("Face emotion model loaded successfully")
        except Exception as exc:
            self._ready = False
            self._reason = f"Emotion model not ready: {exc}"
            logger.exception("Failed to load face emotion model")

    def analyze(self, image_bgr: np.ndarray) -> Tuple[str, float]:
        if not self._ready:
            raise RuntimeError(self._reason or "Emotion model not ready")

        result = DeepFace.analyze(
            img_path=image_bgr,
            actions=["emotion"],
            enforce_detection=False,
            detector_backend=FACE_MODEL_BACKEND,
            prog_bar=False,
            silent=True,
        )

        if isinstance(result, list):
            result = result[0] if result else {}

        dominant = str(result.get("dominant_emotion") or "neutral").lower()
        emotions = result.get("emotion") or {}
        confidence = float(emotions.get(dominant, 0.0)) / 100.0

        # Clamp to a safe numeric range.
        confidence = max(0.0, min(1.0, confidence))
        return dominant, confidence


FACE_EMOTION = FaceEmotionService()


def _safe_register(module_path: str, symbol: str, name: str) -> bool:
    try:
        module = __import__(module_path, fromlist=[symbol])
        blueprint = getattr(module, symbol)
        app.register_blueprint(blueprint)
        logger.info("registered blueprint: %s", name)
        return True
    except Exception as exc:
        logger.warning("skipping blueprint %s: %s", name, exc)
        return False


registered = {
    "sentiment": _safe_register("app.sentiment", "sentiment_bp", "sentiment"),
    "sentiment_v2": _safe_register("app.sentiment_advanced", "sentiment_advanced_bp", "sentiment_v2"),
    "mood": _safe_register("app.mood", "mood_bp", "mood"),
    "recommendations": _safe_register("app.recommendations", "reco_bp", "recommendations"),
    "analytics": _safe_register("app.analytics", "analytics_bp", "analytics"),
    "games": _safe_register("app.games", "games_bp", "games"),
}


def _decode_image(image_bytes: bytes) -> Optional[np.ndarray]:
    if not image_bytes:
        return None
    array = np.frombuffer(image_bytes, dtype=np.uint8)
    if array.size == 0:
        return None
    return cv2.imdecode(array, cv2.IMREAD_COLOR)


def _read_image_from_request() -> Tuple[Optional[np.ndarray], Optional[str]]:
    if "image" in request.files:
        image = _decode_image(request.files["image"].read())
        if image is None:
            return None, "Invalid image file"
        return image, None

    data = request.get_json(silent=True) or {}
    raw = data.get("image_base64") or data.get("image")
    if not raw:
        return None, "image file or base64 image is required"

    # Support optional data URI format: data:image/jpeg;base64,...
    if isinstance(raw, str) and "," in raw and raw.strip().startswith("data:image"):
        raw = raw.split(",", 1)[1]

    try:
        decoded = base64.b64decode(raw)
    except Exception:
        return None, "Invalid base64 image payload"

    image = _decode_image(decoded)
    if image is None:
        return None, "Invalid image payload"
    return image, None


def _detect_face(image_bgr: np.ndarray) -> Dict:
    if not FACE_EMOTION.ready:
        return {"ok": False, "status": "unavailable", "message": "Emotion model not ready"}

    try:
        emotion, confidence = FACE_EMOTION.analyze(image_bgr)
        return {
            "ok": True,
            "status": "success",
            "emotion": emotion,
            "primary_emotion": emotion,
            "confidence": confidence,
        }
    except Exception as exc:
        logger.exception("Face emotion inference failed")
        return {"ok": False, "status": "error", "message": f"Inference failed: {exc}"}


def _detect_text(text: str) -> Dict:
    scores = SENTIMENT.polarity_scores(text or "")
    compound = float(scores.get("compound", 0.0))
    if compound >= 0.05:
        primary = "positive"
    elif compound <= -0.05:
        primary = "negative"
    else:
        primary = "neutral"

    return {
        "ok": True,
        "primary_emotion": primary,
        "confidence": abs(compound),
        "top_emotions": [
            {"emotion": "positive", "score": float(scores.get("pos", 0.0))},
            {"emotion": "neutral", "score": float(scores.get("neu", 0.0))},
            {"emotion": "negative", "score": float(scores.get("neg", 0.0))},
        ],
        "unified_mood": {
            "positive": float(scores.get("pos", 0.0)),
            "neutral": float(scores.get("neu", 0.0)),
            "negative": float(scores.get("neg", 0.0)),
        },
        "sentiment_score": compound,
    }


def _safe_float(value: Optional[str], default: float) -> float:
    try:
        return float(value) if value is not None else default
    except Exception:
        return default


@app.route("/api/health", methods=["GET"])
def health_check():
    return (
        jsonify(
            {
                "status": "healthy",
                "service": "ml-service",
                "face_model": {
                    "ready": FACE_EMOTION.ready,
                    "reason": FACE_EMOTION.reason if not FACE_EMOTION.ready else None,
                },
                "registered_blueprints": registered,
                "timestamp": datetime.utcnow().isoformat(),
            }
        ),
        200,
    )


@app.route("/api/detect-emotion", methods=["POST"])
def detect_emotion():
    return jsonify({"status": "error", "error": "Voice emotion model is not enabled in this build"}), 501


@app.route("/api/detect-face-emotion", methods=["POST"])
@app.route("/detect-emotion", methods=["POST"])
def detect_face_emotion():
    image_bgr, err = _read_image_from_request()
    if err:
        return jsonify({"status": "error", "message": err}), 400

    result = _detect_face(image_bgr)
    if result.get("status") == "unavailable":
        return jsonify({"status": "unavailable", "message": "Emotion model not ready"}), 503
    if not result.get("ok"):
        return jsonify({"status": "error", "message": result.get("message", "Emotion inference failed")}), 500

    return (
        jsonify(
            {
                "status": "success",
                "emotion": result["emotion"],
                "primary_emotion": result["primary_emotion"],
                "confidence": result["confidence"],
            }
        ),
        200,
    )


@app.route("/api/mood-pattern/analyze/face", methods=["POST"])
def analyze_face_pattern():
    image_bgr, err = _read_image_from_request()
    if err:
        return jsonify({"status": "error", "error": err}), 400

    result = _detect_face(image_bgr)
    if result.get("status") == "unavailable":
        return jsonify({"status": "unavailable", "message": "Emotion model not ready"}), 503
    if not result.get("ok"):
        return jsonify({"status": "error", "error": result.get("message", "Emotion inference failed")}), 500

    payload = {
        "status": "success",
        "primary_emotion": result["primary_emotion"],
        "confidence": result["confidence"],
        "top_emotions": [
            {
                "emotion": result["primary_emotion"],
                "score": result["confidence"],
            }
        ],
    }
    return jsonify(payload), 200


@app.route("/api/mood-pattern/analyze/text", methods=["POST"])
def analyze_text_pattern():
    started = time.time()
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"status": "error", "error": "text is required"}), 400

    result = _detect_text(text)
    payload = {
        "primary_emotion": result["primary_emotion"],
        "confidence": result["confidence"],
        "top_emotions": result["top_emotions"],
        "unified_mood": result["unified_mood"],
        "sentiment_score": result["sentiment_score"],
        "processing_time": round(time.time() - started, 4),
    }
    return jsonify(payload), 200


@app.route("/api/mood-pattern/analyze/fusion", methods=["POST"])
def analyze_fusion_pattern():
    started = time.time()

    face_weight = _safe_float(request.form.get("face_weight"), 0.5)
    text_weight = _safe_float(request.form.get("text_weight"), 0.5)
    total = face_weight + text_weight
    if total <= 0:
        face_weight, text_weight = 0.5, 0.5
    else:
        face_weight, text_weight = face_weight / total, text_weight / total

    text = (request.form.get("text") or "").strip()
    text_result = _detect_text(text) if text else None

    face_result = None
    if "image" in request.files:
        image_bgr = _decode_image(request.files["image"].read())
        if image_bgr is not None:
            face_result = _detect_face(image_bgr)

    if not text_result and not face_result:
        return jsonify({"status": "error", "error": "At least one modality (image/text) is required"}), 400

    text_score = text_result["sentiment_score"] if text_result else 0.0
    face_score = 0.0
    if face_result and face_result.get("ok"):
        primary = face_result.get("primary_emotion", "neutral")
        if primary in ("happy", "surprise"):
            face_score = face_result.get("confidence", 0.0)
        elif primary in ("sad", "angry", "fear", "disgust"):
            face_score = -face_result.get("confidence", 0.0)
    fused = (face_score * face_weight) + (text_score * text_weight)

    if fused >= 0.05:
        mood = "positive"
    elif fused <= -0.05:
        mood = "negative"
    else:
        mood = "neutral"

    return (
        jsonify(
            {
                "unified_mood": mood,
                "confidence": abs(fused),
                "sentiment_score": fused,
                "face_emotion": face_result,
                "text_emotion": text_result,
                "processing_time": round(time.time() - started, 4),
            }
        ),
        200,
    )


@app.errorhandler(404)
def not_found(_error):
    return jsonify({"status": "error", "error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(_error):
    return jsonify({"status": "error", "error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    app.run(host=host, port=port, debug=debug)
