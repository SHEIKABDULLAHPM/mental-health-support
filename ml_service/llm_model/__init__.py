"""
LLM Model Package for Mental Health Chatbot
Note: LLaMA-specific backends removed. Exposes provider-agnostic ChatbotService only.
"""

from .chatbot_service import ChatbotService

__all__ = [
    'ChatbotService'
]