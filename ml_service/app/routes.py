"""
Flask routes for the upgraded Mental Health Chatbot (Qwen-based) with:
- Persistent memory (SQLite)
- Safety & moderation checks
- Streaming token responses
- Multilingual empathetic system prompt
- Emotion-aware responses with Streaky branding
"""
from __future__ import annotations

from flask import Blueprint, Response, jsonify, request
from datetime import datetime
import json
import logging
import os
import uuid
import time

from .qwen_model import QwenModel
from .memory import ConversationMemory
from . import safety
from .nlp import LanguageDetector, ModerationService
from .emotion_enhancer import enhance_response, get_streaky_greeting, enhancer


logger = logging.getLogger(__name__)

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")


# Initialize singletons
_qwen: QwenModel | None = None
_memory: ConversationMemory | None = None
_moderation: ModerationService | None = None


def _get_qwen() -> QwenModel:
    global _qwen
    if _qwen is None:
        adapter_path = os.getenv("PEFT_ADAPTER_PATH")
        _qwen = QwenModel(peft_adapter_path=adapter_path)
    return _qwen


def _get_memory() -> ConversationMemory:
    global _memory
    if _memory is None:
        _memory = ConversationMemory()
    return _memory


def _get_moderation() -> ModerationService:
    global _moderation
    if _moderation is None:
        _moderation = ModerationService()
    return _moderation


SYSTEM_PROMPT = (
    "You are an empathetic, supportive mental health assistant. "
    "Respond with warmth, validation, and practical coping steps. "
    "If signs of crisis appear, gently encourage immediate professional help with resources. "
    "Respect user privacy, avoid making diagnoses, and encourage reaching out to trusted people. "
    "Reply in the user's language when possible."
)

MODE_PROMPTS = {
    # Therapeutic: structured CBT-style guidance, reflective listening, and coping skills
    "therapeutic": "Use a structured, therapeutic tone grounded in evidence-based techniques (CBT/DBT/Mindfulness). Reflect back key feelings, validate, and offer practical coping strategies. Use gentle, step-by-step guidance.",
    # Emotional Support: high-empathy, warmth-first responses
    "emotional": "Prioritize empathy, warmth, and validation. Focus on active listening, supportive language, and emotional containment before offering suggestions.",
    # Informational Assistance: clear, concise, actionable info
    "informational": "Provide clear, concise, and factual information. Offer actionable steps, resources, and summaries. Keep tone supportive but primarily informative.",
}


@chat_bp.route("/health", methods=["GET"])
def health():
    try:
        qwen = _get_qwen()
        return jsonify({
            "status": "success",
            "data": {
                "model": qwen.model_name,
                "peft": bool(qwen.peft_adapter_path),
                "timestamp": datetime.utcnow().isoformat(),
            },
        })
    except Exception as e:
        logger.exception("Health check failed")
        return jsonify({"status": "error", "error": str(e)}), 500


@chat_bp.route("/start", methods=["POST"])
def start():
    data = request.get_json() or {}
    conversation_id = data.get("conversation_id") or str(uuid.uuid4())
    mode = (data.get("mode") or "").strip() or None
    mem = _get_memory()
    mem.create_conversation(conversation_id, mode=mode)
    # Switch adapter if available
    try:
        _get_qwen().switch_adapter(mode)
    except Exception:
        pass
    mem.add_message(conversation_id, "assistant", "Hi, I'm here to support you. How are you feeling today?")
    return jsonify({"status": "success", "data": {"conversation_id": conversation_id, "mode": mode}})


def _build_history(mem: ConversationMemory, conversation_id: str):
    msgs = mem.get_messages(conversation_id, limit=20)
    history = []
    # prepend summary as system hint
    summary = mem.get_summary(conversation_id)
    if summary:
        history.append({"role": "system", "content": f"Summary of prior context: {summary}"})
    # add dialogue turns
    for m in msgs:
        if m["role"] in {"user", "assistant"}:
            history.append({"role": m["role"], "content": m["content"]})
    return history


def _summarize_and_store(mem: ConversationMemory, conversation_id: str) -> None:
    """Lightweight summarization: keep last few turns as a compressed bullet list.
    Replace with model-based summarization if needed.
    """
    msgs = mem.get_messages(conversation_id, limit=8)
    bullets = []
    for m in msgs:
        role = "You" if m["role"] == "user" else "Assistant"
        bullets.append(f"- {role}: {m['content'][:160]}")
    summary = "Recent conversation context:\n" + "\n".join(bullets[-6:])
    mem.update_summary(conversation_id, summary)


@chat_bp.route("/send", methods=["POST"])
def send():
    data = request.get_json() or {}
    user_text = (data.get("message") or "").strip()
    if not user_text:
        return jsonify({"status": "error", "error": "Message is required"}), 400

    conversation_id = data.get("conversation_id") or str(uuid.uuid4())
    max_new_tokens = int(data.get("max_length", 256))
    temperature = float(data.get("temperature", 0.7))
    stream = bool(data.get("stream", False))
    
    # ⭐ EMOTION ENHANCEMENT: Get sentiment from frontend
    sentiment_result = data.get("sentiment")  # Optional: { label: str, score: float }

    mem = _get_memory()
    # Allow mode override per request or fetch from conversation
    mode = (data.get("mode") or "").strip() or None
    mem.create_conversation(conversation_id, mode=mode or _get_memory().get_mode(conversation_id))

    # Rate limit if moderation cooldown is active
    moderation = _get_moderation()
    if moderation.is_rate_limited(conversation_id):
        cooldown_msg = (
            "I’m here for you. Let’s take a short breather before we continue. "
            "If you’re in immediate danger or feel unsafe, please contact local emergency services or a crisis hotline."
        )
        mem.add_message(conversation_id, "assistant", cooldown_msg)
        _summarize_and_store(mem, conversation_id)
        return jsonify({
            "status": "success",
            "data": {
                "conversation_id": conversation_id,
                "assistant_message": cooldown_msg,
                "cooldown": True,
                "timestamp": datetime.utcnow().isoformat(),
            },
        })

    # Safety checks on input
    if safety.check_crisis(user_text):
        mem.add_message(conversation_id, "user", user_text)
        crisis_text = safety.crisis_response()
        filtered = safety.filter_output(crisis_text)
        mem.add_message(conversation_id, "assistant", filtered["text"])
        _summarize_and_store(mem, conversation_id)
        return jsonify({
            "status": "success",
            "data": {
                "conversation_id": conversation_id,
                "assistant_message": filtered["text"],
                "crisis": True,
                "timestamp": datetime.utcnow().isoformat(),
            },
        })

    # Store user message (redact for storage if needed)
    redacted_user = safety.redact_pii(user_text)
    mem.add_message(conversation_id, "user", redacted_user)

    qwen = _get_qwen()
    history = _build_history(mem, conversation_id)
    # Language detection influences system guidance
    lang = LanguageDetector.detect_language(user_text)
    # Determine mode for this turn
    mode_eff = mode or mem.get_mode(conversation_id)
    # Switch adapter based on mode if available
    try:
        qwen.switch_adapter(mode_eff)
    except Exception:
        pass
    sys_prompt = SYSTEM_PROMPT
    if mode_eff:
        key = qwen._normalize_mode(mode_eff)
        sys_prompt += " " + MODE_PROMPTS.get(key, "")
    if lang:
        sys_prompt += f" The user's language is '{lang}'. Respond in that language."
    # Build prompt
    prompt = qwen.build_prompt(sys_prompt, history, redacted_user)

    # Basic moderation check
    if moderation.is_unsafe(user_text):
        moderation.add_flag(conversation_id)
        mod_msg = (
            "I can’t assist with harmful or unsafe content. "
            "If you’re feeling distressed or at risk, please reach out to a trusted person or contact emergency services/crisis hotlines in your area."
        )
        mem.add_message(conversation_id, "assistant", mod_msg)
        _summarize_and_store(mem, conversation_id)
        return jsonify({
            "status": "success",
            "data": {
                "conversation_id": conversation_id,
                "assistant_message": mod_msg,
                "moderation": True,
                "timestamp": datetime.utcnow().isoformat(),
            },
        })

    if not stream:
        # Reduce default tokens for faster response
        if max_new_tokens > 200:
            max_new_tokens = 200  # Limit to 200 tokens for faster responses
        
        start_time = time.time()
        text = qwen.generate(prompt, max_new_tokens=max_new_tokens, temperature=temperature)
        filtered = safety.filter_output(text)
        
        # ⭐ EMOTION ENHANCEMENT: Enhance with emotion intelligence and Streaky branding
        enhanced_text = enhance_response(
            user_text=user_text,
            llm_response=filtered["text"],
            sentiment_result=sentiment_result,
            quick_mode=False,  # Use full LLM response
        )
        
        end_time = time.time()
        response_time = round(end_time - start_time, 2)
        
        mem.add_message(conversation_id, "assistant", enhanced_text)
        
        # Background task for summarization (don't wait)
        import threading
        threading.Thread(target=_summarize_and_store, args=(mem, conversation_id)).start()
        
        # Log emotion enhancement
        emotion = enhancer.detect_primary_emotion(sentiment_result, user_text)
        logger.info(f"⚡ Streaky responded in {response_time}s | Emotion: {emotion} | Tokens: {len(enhanced_text.split())}")
        
        return jsonify({
            "status": "success",
            "data": {
                "conversation_id": conversation_id,
                "assistant_message": enhanced_text,
                "timestamp": datetime.utcnow().isoformat(),
                "tokens": len(enhanced_text.split()),
                "response_time": response_time,
                "emotion": emotion,
            },
        })

    def event_stream():
        try:
            buffer = ""
            for chunk in qwen.stream(prompt, max_new_tokens=max_new_tokens, temperature=temperature):
                buffer += chunk
                payload = json.dumps({"token": chunk})
                yield f"data: {payload}\n\n"
            # finalize: store message
            filtered = safety.filter_output(buffer)
            mem.add_message(conversation_id, "assistant", filtered["text"])
            _summarize_and_store(mem, conversation_id)
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            logger.exception("Streaming failed")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    headers = {"Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive"}
    return Response(event_stream(), headers=headers)


@chat_bp.route("/conversation/<conversation_id>", methods=["GET"])
def get_conversation(conversation_id: str):
    mem = _get_memory()
    msgs = mem.get_messages(conversation_id, limit=100)
    return jsonify({"status": "success", "data": {"conversation_id": conversation_id, "history": msgs}})


@chat_bp.route("/conversation/<conversation_id>", methods=["DELETE"])
def clear_conversation(conversation_id: str):
    mem = _get_memory()
    mem.delete_conversation(conversation_id)
    return jsonify({"status": "success", "message": "Conversation deleted"})


@chat_bp.route("/conversations", methods=["GET"])
def list_conversations():
    mem = _get_memory()
    data = mem.list_conversations()
    return jsonify({"status": "success", "data": data})
