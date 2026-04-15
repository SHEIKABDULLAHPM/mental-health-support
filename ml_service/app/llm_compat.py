"""
Compatibility blueprint exposing legacy /api/llm endpoints by proxying to the new /api/chat routes.
"""
from flask import Blueprint, current_app, jsonify

llm_bp = Blueprint("llm", __name__, url_prefix="/api/llm")


@llm_bp.route("/health", methods=["GET"])
def health():
    with current_app.test_request_context("/api/chat/health", method="GET"):
        return current_app.full_dispatch_request()


@llm_bp.route("/chat/start", methods=["POST"])
def start():
    from flask import request
    payload = request.get_json() or {}
    with current_app.test_request_context("/api/chat/start", method="POST", json=payload):
        return current_app.full_dispatch_request()


@llm_bp.route("/chat/send", methods=["POST"])
def send():
    # Forward the original JSON; the request context in Flask doesn't auto-carry JSON, so
    # we rely on the application layer to re-validate.
    from flask import request
    payload = request.get_json() or {}
    with current_app.test_request_context("/api/chat/send", method="POST", json=payload):
        return current_app.full_dispatch_request()


@llm_bp.route("/chat/conversation/<conversation_id>", methods=["GET"])
def get_conversation(conversation_id: str):
    with current_app.test_request_context(f"/api/chat/conversation/{conversation_id}", method="GET"):
        return current_app.full_dispatch_request()


@llm_bp.route("/chat/conversations", methods=["GET"])
def list_conversations():
    with current_app.test_request_context("/api/chat/conversations", method="GET"):
        return current_app.full_dispatch_request()


@llm_bp.route("/chat/conversation/<conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id: str):
    with current_app.test_request_context(f"/api/chat/conversation/{conversation_id}", method="DELETE"):
        return current_app.full_dispatch_request()


@llm_bp.route("/chat/assessment/<conversation_id>", methods=["GET"])
def assessment(conversation_id: str):
    # Not implemented in upgraded stack; return a polite placeholder
    return jsonify({"status": "success", "data": {"conversation_id": conversation_id, "note": "Assessment not available"}})
