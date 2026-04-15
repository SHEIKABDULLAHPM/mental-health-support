"""LLM Flask service bridging Node backend requests to Ollama."""

from __future__ import annotations

import json
import os
from typing import Dict, List

import requests
from flask import Flask, Response, jsonify, request, stream_with_context
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
MODEL_NAME = os.getenv("LLM_MODEL_NAME", "llama3.1")


def _system_prompt(mode: str) -> str:
    base = (
        "You are a supportive mental health assistant. "
        "Be empathetic, practical, and non-judgmental. "
        "Do not provide diagnosis or harmful guidance."
    )
    mode_key = (mode or "therapeutic").lower()
    if "info" in mode_key:
        return base + " Focus on concise informational coping guidance."
    if "emotion" in mode_key:
        return base + " Focus on emotional validation and gentle grounding."
    return base + " Use therapeutic-style supportive conversation."


def _risk_level(text: str) -> str:
    text_l = (text or "").lower()
    high = ["suicide", "kill myself", "end my life", "self-harm", "hurt myself"]
    medium = ["hopeless", "panic", "overwhelmed", "worthless"]
    if any(token in text_l for token in high):
        return "high"
    if any(token in text_l for token in medium):
        return "medium"
    return "low"


def _ollama_chat(messages: List[Dict[str, str]], temperature: float, max_tokens: int) -> str:
    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": max(0.1, min(float(temperature), 1.0)),
            "num_predict": max(64, min(int(max_tokens), 512)),
        },
    }
    response = requests.post(f"{OLLAMA_URL}/api/chat", json=payload, timeout=60)
    response.raise_for_status()
    data = response.json() or {}
    return ((data.get("message") or {}).get("content") or "").strip()


def _ollama_chat_stream(messages: List[Dict[str, str]], temperature: float, max_tokens: int):
    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": True,
        "options": {
            "temperature": max(0.1, min(float(temperature), 1.0)),
            "num_predict": max(64, min(int(max_tokens), 512)),
        },
    }
    with requests.post(f"{OLLAMA_URL}/api/chat", json=payload, timeout=90, stream=True) as response:
        response.raise_for_status()
        for line in response.iter_lines(decode_unicode=True):
            if not line:
                continue
            try:
                chunk = json.loads(line)
            except Exception:
                continue

            token = ((chunk.get("message") or {}).get("content") or "")
            if token:
                yield {"type": "token", "token": token}

            if chunk.get("done"):
                break


@app.route("/health", methods=["GET"])
def health():
    try:
        ready = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5).ok
    except Exception:
        ready = False
    return (
        jsonify(
            {
                "status": "healthy" if ready else "degraded",
                "service": "llm-service",
                "model": MODEL_NAME,
            }
        ),
        200 if ready else 503,
    )


@app.route("/api/chat", methods=["POST"])
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"status": "error", "error": "message is required"}), 400

    mode = data.get("mode", "therapeutic")
    history = data.get("history") or []
    temperature = data.get("temperature", 0.6)
    max_tokens = data.get("max_tokens", data.get("max_length", 256))

    messages = [{"role": "system", "content": _system_prompt(mode)}]
    for turn in history[-10:]:
        role = "assistant" if turn.get("role") == "assistant" else "user"
        content = (turn.get("content") or "").strip()
        if content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message})

    try:
        assistant = _ollama_chat(messages, temperature, max_tokens)
        risk = _risk_level(f"{message} {assistant}")
        return (
            jsonify(
                {
                    "status": "success",
                    "data": {
                        "assistant_message": assistant,
                        "response": assistant,
                        "model": MODEL_NAME,
                        "risk": {"level": risk},
                    },
                }
            ),
            200,
        )
    except Exception as exc:
        return jsonify({"status": "error", "error": f"Ollama request failed: {exc}"}), 503


@app.route("/api/chat/stream", methods=["POST"])
def chat_stream():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"status": "error", "error": "message is required"}), 400

    mode = data.get("mode", "therapeutic")
    history = data.get("history") or []
    temperature = data.get("temperature", 0.6)
    max_tokens = data.get("max_tokens", data.get("max_length", 256))
    conversation_id = data.get("conversation_id")

    messages = [{"role": "system", "content": _system_prompt(mode)}]
    for turn in history[-10:]:
        role = "assistant" if turn.get("role") == "assistant" else "user"
        content = (turn.get("content") or "").strip()
        if content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message})

    @stream_with_context
    def generate():
        full_text = ""
        yield json.dumps({"type": "meta", "conversation_id": conversation_id, "model": MODEL_NAME}) + "\n"
        try:
            for event in _ollama_chat_stream(messages, temperature, max_tokens):
                token = event.get("token") or ""
                if token:
                    full_text += token
                    yield json.dumps({"type": "token", "token": token}) + "\n"

            risk = _risk_level(f"{message} {full_text}")
            yield (
                json.dumps(
                    {
                        "type": "done",
                        "conversation_id": conversation_id,
                        "assistant_message": full_text,
                        "response": full_text,
                        "model": MODEL_NAME,
                        "risk": {"level": risk},
                    }
                )
                + "\n"
            )
        except Exception as exc:
            yield json.dumps({"type": "error", "error": f"Ollama stream failed: {exc}"}) + "\n"

    return Response(
        generate(),
        mimetype="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Connection": "keep-alive",
        },
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=11434, debug=False)
