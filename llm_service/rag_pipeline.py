"""Complete RAG pipeline - retrieval, context building, prompt assembly, and response generation."""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

_initialized = False
_knowledge_texts: List[str] = []
_knowledge_meta: List[dict] = []


def initialize_rag(force_rebuild: bool = False):
    """Initialize the RAG pipeline: build knowledge base, vector index, memory store."""
    global _initialized, _knowledge_texts, _knowledge_meta

    if _initialized and not force_rebuild:
        return

    from knowledge_builder import build_knowledge_base, load_knowledge_base, needs_build
    from vector_store import build_index, load_index

    if needs_build() or force_rebuild:
        logger.info("Building knowledge base from HF datasets...")
        texts, meta = build_knowledge_base()
        if texts:
            build_index(texts, meta)
            _knowledge_texts = texts
            _knowledge_meta = meta
    else:
        logger.info("Loading existing knowledge base...")
        texts, meta = load_knowledge_base()
        if texts:
            loaded = load_index()
            if not loaded:
                logger.info("Building index from existing knowledge base...")
                build_index(texts, meta)
            _knowledge_texts = texts
            _knowledge_meta = meta

    _initialized = True
    stats = get_rag_stats()
    logger.info("RAG pipeline initialized: %s", json.dumps(stats))


def retrieve_context(
    query: str,
    top_k: int = 5,
    category_filter: Optional[str] = None,
) -> Tuple[List[str], List[dict]]:
    """Retrieve relevant context using vector search.

    Returns:
        Tuple of (context_texts, metadata_list_with_scores)
    """
    if not _initialized:
        logger.warning("RAG pipeline not initialized")
        return [], []

    from vector_store import search

    try:
        results = search(query, top_k=top_k * 2, min_score=0.1)

        if category_filter and category_filter in CATEGORY_MAP:
            filtered = [(t, m, s) for t, m, s in results
                        if m.get("category") == category_filter]
            if filtered:
                results = filtered

        texts = [t for t, m, s in results[:top_k]]
        metas = [
            {
                "category": m.get("category", "unknown"),
                "source": m.get("source", "unknown"),
                "type": m.get("type", "unknown"),
                "similarity": round(s, 4),
            }
            for t, m, s in results[:top_k]
        ]

        return texts, metas
    except Exception as exc:
        logger.warning("Vector retrieval failed: %s", exc)
        return [], []


CATEGORY_MAP = {
    "anxiety": "anxiety", "panic": "anxiety", "fear": "anxiety",
    "depression": "depression", "sad": "depression",
    "stress": "stress", "burnout": "stress",
    "mindfulness": "mindfulness", "meditation": "mindfulness",
    "sleep": "sleep", "insomnia": "sleep",
    "emotions": "emotions", "feelings": "emotions",
    "relationship": "relationships", "relationships": "relationships",
    "crisis": "crisis", "suicide": "crisis", "self-harm": "crisis",
    "self_care": "self_care", "self-care": "self_care",
    "faq": "faq",
}


def _detect_category(message: str) -> Optional[str]:
    """Detect the most relevant knowledge category from a message."""
    message_l = message.lower()
    for keyword, category in CATEGORY_MAP.items():
        if keyword in message_l:
            return category
    return None


def build_rag_prompt(
    query: str,
    history: Optional[List[dict]] = None,
    mode: str = "therapeutic",
    memory_context: str = "",
    emotion: Optional[str] = None,
    sentiment: Optional[str] = None,
    user_profile: Optional[dict] = None,
) -> str:
    """Build a comprehensive RAG-augmented prompt.

    Integrates:
    - Conversation history
    - Retrieved knowledge
    - Long-term memory
    - Emotion/sentiment context
    - User profile
    - Mode-specific instructions

    Returns a formatted prompt string with all context.
    """
    texts, metas = retrieve_context(query)

    context_block = ""
    if texts:
        context_parts = []
        for i, (text, meta) in enumerate(zip(texts[:3], metas[:3])):
            source = meta.get("source", "knowledge base")
            category = meta.get("category", "general")
            context_parts.append(
                f"[Source: {source} | Category: {category}]\n{text}"
            )
        context_block = "\n\n".join(context_parts)
        context_block = f"\n\nRelevant Knowledge:\n{context_block}"

    history_block = ""
    if history:
        recent = history[-8:]
        history_lines = []
        for turn in recent:
            role = "User" if turn.get("role") == "user" else "Assistant"
            content = turn.get("content", "")[:300]
            if content:
                history_lines.append(f"{role}: {content}")
        if history_lines:
            history_block = "\n".join(history_lines)
            history_block = f"\nConversation History:\n{history_block}"

    emotion_block = ""
    if emotion and emotion != "neutral":
        emotion_block = f"\nDetected Emotion: {emotion}"
    if sentiment:
        emotion_block += f"\nSentiment: {sentiment}"

    memory_block = ""
    if memory_context:
        memory_block = f"\nLong-term Memory:\n{memory_context}"

    profile_block = ""
    if user_profile:
        profile_items = []
        for k, v in user_profile.items():
            if k != "passwordHash":
                profile_items.append(f"- {k}: {v}")
        if profile_items:
            profile_block = f"\nUser Profile:\n" + "\n".join(profile_items)

    mode_instructions = {
        "therapeutic": (
            "Role: Therapeutic Support. Use CBT, mindfulness, and reflective techniques. "
            "Validate feelings, offer concrete exercises, and maintain non-clinical boundaries."
        ),
        "informational": (
            "Role: Psychoeducation. Provide concise, factual mental health information. "
            "Cite relevant knowledge when possible. Avoid therapeutic suggestions."
        ),
        "emotional": (
            "Role: Emotional Support. Lead with validation, warmth, and empathy. "
            "Focus on active listening and gentle grounding. Keep advice minimal."
        ),
    }
    instruction = mode_instructions.get((mode or "therapeutic").lower(), mode_instructions["therapeutic"])

    prompt = f"""{instruction}

You are Healing Chat, a supportive mental health assistant.
You are NOT a replacement for a licensed clinician.
Do not diagnose, prescribe medication, or encourage harmful behavior.
If the user mentions suicide, self-harm, or immediate danger:
  - Express concern
  - Encourage contacting emergency services or a crisis line
  - Do NOT provide clinical advice

Use the provided knowledge and context to give accurate, personalized responses.
When you use knowledge from the context, naturally incorporate it.
If you lack specific knowledge about a topic, acknowledge limitations honestly.
Keep responses concise (2-4 paragraphs), warm, and focused on the user's needs.{"".join(filter(None, [profile_block, memory_block, emotion_block, history_block, context_block]))}

User's Message: {query}

Respond helpfully, incorporating relevant context naturally. If this is an emergency, prioritize safety resources."""

    return prompt


def get_rag_stats() -> dict:
    """Return statistics about the RAG pipeline."""
    from vector_store import get_stats
    vs_stats = get_stats()

    return {
        "initialized": _initialized,
        "document_count": vs_stats.get("document_count", len(_knowledge_texts)),
        "dimension": vs_stats.get("dimension", 0),
        "embedder": vs_stats.get("embedder", "unknown"),
        "categories": vs_stats.get("categories", {}),
    }