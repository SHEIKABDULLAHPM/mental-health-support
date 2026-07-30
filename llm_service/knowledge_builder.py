"""Knowledge base builder - loads static content + HF datasets into structured knowledge base."""

from __future__ import annotations

import json
import logging
import os
import re
from typing import List, Tuple

import numpy as np

logger = logging.getLogger(__name__)

KNOWLEDGE_DIR = os.path.join(os.path.dirname(__file__), "knowledge_base")
KB_MANIFEST = os.path.join(KNOWLEDGE_DIR, "manifest.json")

CATEGORIES = [
    "anxiety", "depression", "stress", "mindfulness", "sleep",
    "emotions", "relationships", "crisis", "self_care", "faq",
]

CATEGORY_KEYWORDS = {
    "anxiety": ["anxiety", "panic", "fear", "worry", "nervous", "phobia", "ocd", "ptsd", "trauma", "anxious"],
    "depression": ["depression", "depressed", "sad", "hopeless", "melancholy", "dysthymia", "mood"],
    "stress": ["stress", "burnout", "overwhelm", "pressure", "tension", "exhaust"],
    "mindfulness": ["mindfulness", "meditation", "breathing", "present", "awareness", "mindful", "body scan"],
    "sleep": ["sleep", "insomnia", "rest", "fatigue", "bedtime", "nightmare", "circadian"],
    "emotions": ["emotion", "feeling", "anger", "grief", "lonely", "guilt", "shame", "joy", "frustrat"],
    "relationships": ["relationship", "family", "friend", "partner", "boundary", "communication", "social"],
    "crisis": ["suicide", "self-harm", "crisis", "emergency", "hotline", "kill myself", "hurt myself"],
    "self_care": ["self-care", "selfcare", "wellness", "exercise", "hobby", "routine", "habit", "self care"],
    "faq": ["what is", "how to", "treatment", "therapy", "medication", "diagnosis", "difference between"],
}


def _classify(text: str) -> str:
    text_l = text.lower()
    scores = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        scores[cat] = sum(1 for kw in keywords if kw in text_l)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "emotions"


def _clean(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    text = re.sub(r"\[.*?\]|\(.*?\)", "", text)
    return text[:2000]


def _build_doc(text: str, category: str, source: str, doc_type: str) -> dict:
    return {"text": _clean(text), "category": category, "source": source, "type": doc_type}


def load_static_base() -> List[dict]:
    """Load the static knowledge_base.py content with rich category distribution."""
    from knowledge_base import CATEGORIZED_DOCS
    docs = []
    for cat, texts in CATEGORIZED_DOCS.items():
        for text in texts:
            docs.append(_build_doc(text, cat, "clinical_knowledge_base", "psychoeducation"))
    logger.info("Loaded %d static knowledge docs across %d categories", len(docs), len(CATEGORIZED_DOCS))
    return docs


def load_goemotions() -> List[dict]:
    docs = []
    try:
        from datasets import load_dataset
        ds = load_dataset("google/goemotions", split="train")
        counts = {}
        for row in ds:
            text = _clean(row.get("text", ""))
            if len(text) < 10:
                continue
            cat = _classify(text)
            if counts.get(cat, 0) >= 100:
                continue
            counts[cat] = counts.get(cat, 0) + 1
            docs.append(_build_doc(text, cat, "goemotions", "emotion_labeled"))
        logger.info("GoEmotions: %d docs", len(docs))
    except Exception as e:
        logger.warning("GoEmotions failed: %s", e)
    return docs


def load_empathetic_dialogues() -> List[dict]:
    docs = []
    try:
        from datasets import load_dataset
        ds = load_dataset("empathetic_dialogues", split="train")
        counts = {}
        for row in ds:
            text = _clean(row.get("utterance", ""))
            if len(text) < 15:
                continue
            context = _clean(row.get("context", ""))
            if context:
                text = f"{context} {text}"
            cat = _classify(text)
            if counts.get(cat, 0) >= 80:
                continue
            counts[cat] = counts.get(cat, 0) + 1
            docs.append(_build_doc(text, cat, "empathetic_dialogues", "conversation"))
        logger.info("EmpatheticDialogues: %d docs", len(docs))
    except Exception as e:
        logger.warning("EmpatheticDialogues failed: %s", e)
    return docs


def load_daily_dialog() -> List[dict]:
    docs = []
    try:
        from datasets import load_dataset
        ds = load_dataset("daily_dialog", split="train")
        counts = {}
        for row in ds:
            utterances = row.get("dialog", [])
            text = " ".join(_clean(u) for u in utterances if u)
            if len(text) < 20:
                continue
            cat = _classify(text)
            if counts.get(cat, 0) >= 60:
                continue
            counts[cat] = counts.get(cat, 0) + 1
            docs.append(_build_doc(text, cat, "daily_dialog", "dialogue"))
        logger.info("DailyDialog: %d docs", len(docs))
    except Exception as e:
        logger.warning("DailyDialog failed: %s", e)
    return docs


def load_emotion_dataset() -> List[dict]:
    docs = []
    try:
        from datasets import load_dataset
        ds = load_dataset("dair-ai/emotion", split="train")
        label_map = {0: "emotions", 1: "emotions", 2: "emotions", 3: "emotions", 4: "emotions", 5: "emotions"}
        counts = {}
        for row in ds:
            text = _clean(row.get("text", ""))
            if len(text) < 10:
                continue
            cat = _classify(text)
            if counts.get(cat, 0) >= 60:
                continue
            counts[cat] = counts.get(cat, 0) + 1
            docs.append(_build_doc(text, cat, "emotion_dataset", "emotion_labeled"))
        logger.info("EmotionDataset: %d docs", len(docs))
    except Exception as e:
        logger.warning("EmotionDataset failed: %s", e)
    return docs


def load_mental_health_faq() -> List[dict]:
    docs = []
    try:
        from datasets import load_dataset
        ds = load_dataset("Akonor/mental_health_faq", split="train")
        counts = {}
        for row in ds:
            question = _clean(row.get("Question", row.get("question", "")))
            answer = _clean(row.get("Answer", row.get("answer", "")))
            if len(question) < 5 or len(answer) < 10:
                continue
            text = f"Q: {question}\nA: {answer}"
            cat = "faq" if counts.get("faq", 0) < 100 else _classify(text)
            if counts.get(cat, 0) >= 100:
                continue
            counts[cat] = counts.get(cat, 0) + 1
            docs.append(_build_doc(text, cat, "mental_health_faq", "faq"))
        logger.info("MentalHealthFAQ: %d docs", len(docs))
    except Exception as e:
        logger.warning("MentalHealthFAQ failed: %s", e)
    return docs


def load_counseling_transcripts() -> List[dict]:
    docs = []
    try:
        from datasets import load_dataset
        ds = load_dataset("Amod/mental_health_counseling_conversations", split="train")
        counts = {}
        for row in ds:
            text = _clean(row.get("text", row.get("response", row.get("output", ""))))
            if len(text) < 20:
                continue
            cat = _classify(text)
            if counts.get(cat, 0) >= 80:
                continue
            counts[cat] = counts.get(cat, 0) + 1
            docs.append(_build_doc(text, cat, "counseling_conversations", "therapy_exchange"))
        logger.info("CounselingConversations: %d docs", len(docs))
    except Exception as e:
        logger.warning("CounselingConversations failed: %s", e)
    return docs


def _dedup(all_docs: List[dict]) -> List[dict]:
    seen = set()
    unique = []
    for doc in all_docs:
        key = doc["text"][:100]
        if key not in seen:
            seen.add(key)
            unique.append(doc)
    return unique


def build_knowledge_base() -> Tuple[List[str], List[dict]]:
    """Build knowledge base from static content + HF datasets."""
    logger.info("Building knowledge base...")
    os.makedirs(KNOWLEDGE_DIR, exist_ok=True)

    sources = [
        ("Clinical Knowledge Base", load_static_base),
        ("GoEmotions", load_goemotions),
        ("EmpatheticDialogues", load_empathetic_dialogues),
        ("DailyDialog", load_daily_dialog),
        ("EmotionDataset", load_emotion_dataset),
        ("MentalHealthFAQ", load_mental_health_faq),
        ("CounselingConversations", load_counseling_transcripts),
    ]

    all_docs = []
    for name, loader in sources:
        try:
            docs = loader()
            logger.info("%s: %d documents", name, len(docs))
            all_docs.extend(docs)
        except Exception as e:
            logger.warning("%s failed: %s", name, e)

    all_docs = _dedup(all_docs)

    for cat in CATEGORIES:
        os.makedirs(os.path.join(KNOWLEDGE_DIR, cat), exist_ok=True)

    texts = []
    meta_list = []
    for i, doc in enumerate(all_docs):
        cat = doc["category"]
        fpath = os.path.join(KNOWLEDGE_DIR, cat, f"doc_{i}.json")
        with open(fpath, "w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False)
        texts.append(doc["text"])
        meta_list.append({"category": cat, "source": doc["source"], "type": doc["type"], "index": i})

    manifest = {"total_documents": len(texts), "categories": {}, "sources": {}}
    for m in meta_list:
        manifest["categories"][m["category"]] = manifest["categories"].get(m["category"], 0) + 1
        manifest["sources"][m["source"]] = manifest["sources"].get(m["source"], 0) + 1

    with open(KB_MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    logger.info("Knowledge base done: %d docs, manifest: %s", len(texts), json.dumps(manifest))
    return texts, meta_list


def load_knowledge_base() -> Tuple[List[str], List[dict]]:
    texts, meta_list = [], []
    if not os.path.exists(KNOWLEDGE_DIR):
        return texts, meta_list
    for cat in CATEGORIES:
        cat_dir = os.path.join(KNOWLEDGE_DIR, cat)
        if not os.path.isdir(cat_dir):
            continue
        for fname in sorted(os.listdir(cat_dir)):
            if not fname.endswith(".json"):
                continue
            try:
                with open(os.path.join(cat_dir, fname), "r", encoding="utf-8") as f:
                    doc = json.load(f)
                texts.append(doc.get("text", ""))
                meta_list.append({"category": doc.get("category", cat), "source": doc.get("source", "unknown"),
                                  "type": doc.get("type", "unknown"), "index": len(texts) - 1})
            except Exception as e:
                logger.warning("Failed loading %s/%s: %s", cat, fname, e)
    return texts, meta_list


def needs_build() -> bool:
    if not os.path.exists(KB_MANIFEST):
        return True
    try:
        with open(KB_MANIFEST, "r") as f:
            m = json.load(f)
        return m.get("total_documents", 0) < 50
    except Exception:
        return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    build_knowledge_base()