"""LLM Flask service - Groq API with full RAG, memory, emotion/sentiment integration."""

from __future__ import annotations

import json
import logging
import os
from typing import Dict, List, Optional

from flask import Flask, Response, jsonify, request, stream_with_context
from flask_cors import CORS
from openai import OpenAI

from rag_pipeline import build_rag_prompt, get_rag_stats, initialize_rag, retrieve_context
from memory_store import get_memory_store

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = os.getenv("LLM_MODEL_NAME", "llama-3.3-70b-versatile")
MAX_HISTORY_TURNS = int(os.getenv("MAX_HISTORY_TURNS", "10"))

client = OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1") if GROQ_API_KEY else None
memory = get_memory_store()

try:
    initialize_rag()
    stats = get_rag_stats()
    logger.info("RAG initialized: %s", json.dumps(stats))
except Exception as exc:
    logger.warning("RAG pipeline startup failed: %s", exc)


def _system_prompt(mode: str) -> str:
    base = (
        "You are Healing Chat, a supportive mental health assistant. "
        "You are not a replacement for a licensed clinician. "
        "Do not diagnose, prescribe medication, or encourage harmful behavior. "
        "If a user may be in immediate danger, encourage contacting emergency services "
        "or a crisis line right away."
    )
    mode_key = (mode or "therapeutic").lower()
    if "info" in mode_key:
        return base + " Role: Informational. Give concise, factual psychoeducation and practical steps. Avoid pretending to provide therapy."
    if "emotion" in mode_key:
        return base + " Role: Emotional Support. Lead with validation, warmth, reflection, and grounding. Keep advice gentle and optional."
    return base + " Role: Therapeutic. Use supportive CBT, mindfulness, and reflective-question techniques. Offer small, concrete exercises while staying within non-clinical boundaries."


def _risk_level(text: str) -> str:
    text_l = (text or "").lower()
    high = ["suicide", "kill myself", "end my life", "self-harm", "hurt myself", "want to die"]
    medium = ["hopeless", "panic", "overwhelmed", "worthless", "cant go on"]
    if any(token in text_l for token in high):
        return "high"
    if any(token in text_l for token in medium):
        return "medium"
    return "low"


def _build_messages(
    message: str,
    history: List[dict],
    mode: str,
    user_id: Optional[str] = None,
    sentiment: Optional[str] = None,
    emotion: Optional[str] = None,
) -> tuple[List[Dict], str, dict]:
    """Build messages array with full RAG context, memory, and emotion integration."""

    memory_context = ""
    detected_emotion = emotion or ""
    detected_sentiment = sentiment or ""

    if user_id:
        profile = memory.get_user_profile(user_id)
        memory_context = memory.get_memory_context(user_id)

        if not detected_emotion:
            detected_emotion = memory.detect_emotion(message)
        if not detected_sentiment:
            detected_sentiment = "neutral"

        memory.add_emotional_entry(user_id, message, detected_emotion, detected_sentiment,
                                    _risk_level(message))

    rag_prompt = build_rag_prompt(
        query=message,
        history=history,
        mode=mode,
        memory_context=memory_context,
        emotion=detected_emotion,
        sentiment=detected_sentiment,
        user_profile=memory.get_user_profile(user_id) if user_id else None,
    )

    system_content = f"{_system_prompt(mode)}\n\n{rag_prompt}".strip()

    messages = [{"role": "system", "content": system_content}]

    for turn in list(history or [])[-MAX_HISTORY_TURNS:]:
        role = "assistant" if turn.get("role") == "assistant" else "user"
        content = (turn.get("content") or "").strip()
        if content:
            messages.append({"role": role, "content": content[:2000]})

    messages.append({"role": "user", "content": message})

    rag_meta = {
        "available": get_rag_stats().get("initialized", False),
        "document_count": get_rag_stats().get("document_count", 0),
        "emotion_detected": detected_emotion,
        "sentiment": detected_sentiment,
    }

    return messages, system_content, rag_meta


def _groq_chat(messages: List[dict], temperature: float, max_tokens: int) -> str:
    if not client:
        raise ValueError("GROQ_API_KEY is not configured.")
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        temperature=max(0.1, min(float(temperature), 1.0)),
        max_tokens=max(64, min(int(max_tokens), 2048)),
    )
    return (response.choices[0].message.content or "").strip()


def _groq_chat_stream(messages: List[dict], temperature: float, max_tokens: int):
    if not client:
        raise ValueError("GROQ_API_KEY is not configured.")
    stream = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        temperature=max(0.1, min(float(temperature), 1.0)),
        max_tokens=max(64, min(int(max_tokens), 2048)),
        stream=True,
    )
    for chunk in stream:
        token = chunk.choices[0].delta.content or ""
        if token:
            yield {"type": "token", "token": token}


@app.route("/health", methods=["GET"])
def health():
    groq_ready = client is not None and bool(GROQ_API_KEY)
    status = "healthy" if groq_ready else "degraded"
    return (
        jsonify({
            "status": status,
            "service": "llm-service",
            "provider": "groq",
            "model": MODEL_NAME,
            "rag": get_rag_stats(),
        }),
        200 if groq_ready else 503,
    )


@app.route("/api/chat", methods=["POST"])
@app.route("/api/chat/send", methods=["POST"])
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"status": "error", "error": "message is required"}), 400

    mode = data.get("mode", "therapeutic")
    history = data.get("history") or []
    temperature = data.get("temperature", 0.6)
    max_tokens = data.get("max_tokens", data.get("max_length", 512))
    user_id = data.get("user_id")
    sentiment = data.get("sentiment")
    emotion = data.get("emotion")

    try:
        messages, _, rag_meta = _build_messages(message, history, mode, user_id, sentiment, emotion)
        assistant = _groq_chat(messages, temperature, max_tokens)
        risk = _risk_level(f"{message} {assistant}")

        if user_id:
            detected = memory.detect_emotion(message)
            memory.add_emotional_entry(user_id, message, detected, sentiment or "neutral", risk)

        return jsonify({
            "status": "success",
            "data": {
                "assistant_message": assistant,
                "response": assistant,
                "model": MODEL_NAME,
                "mode": mode,
                "rag": rag_meta,
                "risk": {"level": risk},
                "emotion": rag_meta.get("emotion_detected"),
                "sentiment": rag_meta.get("sentiment"),
            },
        })
    except Exception as exc:
        logger.exception("Groq API request failed")
        return jsonify({"status": "error", "error": f"Groq API request failed: {exc}"}), 503


@app.route("/api/chat/stream", methods=["POST"])
def chat_stream():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"status": "error", "error": "message is required"}), 400

    mode = data.get("mode", "therapeutic")
    history = data.get("history") or []
    temperature = data.get("temperature", 0.6)
    max_tokens = data.get("max_tokens", data.get("max_length", 512))
    conversation_id = data.get("conversation_id")
    user_id = data.get("user_id")
    sentiment = data.get("sentiment")
    emotion = data.get("emotion")

    messages, _, rag_meta = _build_messages(message, history, mode, user_id, sentiment, emotion)

    @stream_with_context
    def generate():
        full_text = ""
        yield json.dumps({
            "type": "meta",
            "conversation_id": conversation_id,
            "model": MODEL_NAME,
            "mode": mode,
            "rag": rag_meta,
        }) + "\n"
        try:
            for event in _groq_chat_stream(messages, temperature, max_tokens):
                token = event.get("token") or ""
                if token:
                    full_text += token
                    yield json.dumps({"type": "token", "token": token}) + "\n"

            risk = _risk_level(f"{message} {full_text}")

            if user_id:
                detected = memory.detect_emotion(message)
                memory.add_emotional_entry(user_id, message, detected, rag_meta.get("sentiment", "neutral"), risk)

            yield json.dumps({
                "type": "done",
                "conversation_id": conversation_id,
                "assistant_message": full_text,
                "response": full_text,
                "model": MODEL_NAME,
                "mode": mode,
                "rag": rag_meta,
                "risk": {"level": risk},
                "emotion": rag_meta.get("emotion_detected"),
                "sentiment": rag_meta.get("sentiment"),
            }) + "\n"
        except Exception as exc:
            logger.exception("Groq stream failed")
            yield json.dumps({"type": "error", "error": f"Groq stream failed: {exc}"}) + "\n"

    return Response(
        generate(),
        mimetype="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Connection": "keep-alive",
        },
    )


@app.route("/api/rag/stats", methods=["GET"])
def rag_stats():
    return jsonify({"status": "active", "data": get_rag_stats()})


@app.route("/api/memory/<user_id>", methods=["GET"])
def get_user_memory(user_id):
    ctx = memory.get_memory_context(user_id)
    return jsonify({"status": "success", "data": {"memory_context": ctx}})


@app.route("/api/memory/<user_id>/profile", methods=["POST"])
def update_user_profile(user_id):
    data = request.get_json(silent=True) or {}
    memory.update_profile(user_id, data)
    return jsonify({"status": "success", "data": {"profile": memory.get_user_profile(user_id)}})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=11434, debug=False)