"""Vector store for RAG using TF-IDF embeddings + FAISS index for similarity search."""

from __future__ import annotations

import json
import logging
import os
import pickle
from typing import List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)

VECTOR_DIR = os.path.join(os.path.dirname(__file__), "vector_store")
EMBEDDINGS_PATH = os.path.join(VECTOR_DIR, "embeddings.npy")
INDEX_PATH = os.path.join(VECTOR_DIR, "faiss_index.pkl")
DOCS_PATH = os.path.join(VECTOR_DIR, "documents.json")
META_PATH = os.path.join(VECTOR_DIR, "metadata.json")
VECTORIZER_PATH = os.path.join(VECTOR_DIR, "vectorizer.pkl")

_vectorizer = None
_index = None
_documents: List[str] = []
_metadata: List[dict] = []
_embeddings: Optional[np.ndarray] = None


def _get_vectorizer():
    global _vectorizer
    if _vectorizer is not None:
        return _vectorizer
    try:
        with open(VECTORIZER_PATH, "rb") as f:
            _vectorizer = pickle.load(f)
            logger.info("Vectorizer loaded from disk")
    except Exception:
        from sklearn.feature_extraction.text import TfidfVectorizer
        _vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
            max_features=5000,
            sublinear_tf=True,
        )
    return _vectorizer


def build_index(texts: List[str], meta_list: List[dict]) -> np.ndarray:
    """Build TF-IDF + FAISS index from texts. Returns embeddings array."""
    global _documents, _metadata, _embeddings, _index, _vectorizer

    os.makedirs(VECTOR_DIR, exist_ok=True)

    logger.info("Generating TF-IDF embeddings for %d documents...", len(texts))
    vectorizer = _get_vectorizer()
    sparse_embeddings = vectorizer.fit_transform(texts)
    _vectorizer = vectorizer

    with open(VECTORIZER_PATH, "wb") as f:
        pickle.dump(vectorizer, f)

    embeddings = sparse_embeddings.toarray().astype(np.float32)

    _documents = list(texts)
    _metadata = list(meta_list)
    _embeddings = embeddings

    _build_faiss_index(embeddings)
    _save_to_disk(embeddings)

    logger.info("Vector index built: %d documents, dim=%d", len(texts), embeddings.shape[1])
    return embeddings


def _build_faiss_index(embeddings: np.ndarray):
    global _index
    try:
        import faiss
        dim = embeddings.shape[1]
        _index = faiss.IndexFlatIP(dim)
        faiss.normalize_L2(embeddings)
        _index.add(embeddings)
        logger.info("FAISS index: %d vectors, dim=%d", _index.ntotal, dim)
    except Exception as e:
        logger.warning("FAISS build failed (using brute force): %s", e)
        _index = None


def _save_to_disk(embeddings: np.ndarray):
    try:
        np.save(EMBEDDINGS_PATH, embeddings)
        with open(DOCS_PATH, "w", encoding="utf-8") as f:
            json.dump(_documents, f, ensure_ascii=False)
        with open(META_PATH, "w", encoding="utf-8") as f:
            json.dump(_metadata, f, ensure_ascii=False)
        if _index is not None:
            with open(INDEX_PATH, "wb") as f:
                pickle.dump(_index, f)
    except Exception as e:
        logger.warning("Failed to save vector store: %s", e)


def load_index():
    """Load vector index from disk."""
    global _documents, _metadata, _embeddings, _index, _vectorizer

    if not all(os.path.exists(p) for p in [EMBEDDINGS_PATH, DOCS_PATH, META_PATH]):
        logger.warning("Vector store files not found")
        return False

    try:
        _embeddings = np.load(EMBEDDINGS_PATH)
        with open(DOCS_PATH, "r", encoding="utf-8") as f:
            _documents = json.load(f)
        with open(META_PATH, "r", encoding="utf-8") as f:
            _metadata = json.load(f)

        _vectorizer = _get_vectorizer()

        if os.path.exists(INDEX_PATH):
            with open(INDEX_PATH, "rb") as f:
                _index = pickle.load(f)
        else:
            _build_faiss_index(_embeddings)

        logger.info("Vector store loaded: %d docs, dim=%d",
                     len(_documents), _embeddings.shape[1] if _embeddings is not None else 0)
        return True
    except Exception as e:
        logger.warning("Failed to load vector store: %s", e)
        return False


def search(query: str, top_k: int = 5, min_score: float = 0.1) -> List[Tuple[str, dict, float]]:
    """Search for similar documents. Returns [(text, metadata, score), ...]."""
    if _embeddings is None or len(_documents) == 0:
        logger.warning("Vector store not initialized")
        return []

    vectorizer = _get_vectorizer()
    q_sparse = vectorizer.transform([query])
    q_vec = q_sparse.toarray().astype(np.float32)

    if _index is not None:
        import faiss
        faiss.normalize_L2(q_vec)
        scores, indices = _index.search(q_vec, min(top_k * 3, _index.ntotal))
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0 and idx < len(_documents) and float(score) >= min_score:
                results.append((_documents[idx], _metadata[idx], float(score)))
        results.sort(key=lambda x: x[2], reverse=True)
        return results[:top_k]
    else:
        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity(q_vec, _embeddings)[0]
        top_indices = similarities.argsort()[::-1][:top_k * 3]
        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            if score >= min_score:
                results.append((_documents[idx], _metadata[idx], score))
        return results[:top_k]


def get_stats() -> dict:
    dim = _embeddings.shape[1] if _embeddings is not None else 0
    categories = {}
    for m in _metadata:
        cat = m.get("category", "unknown")
        categories[cat] = categories.get(cat, 0) + 1
    return {
        "initialized": _embeddings is not None,
        "document_count": len(_documents),
        "dimension": dim,
        "categories": categories,
        "embedder": "tf-idf",
    }