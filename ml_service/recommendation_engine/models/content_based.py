from __future__ import annotations
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from .base import BaseRecommender


def _cosine_sim(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    a_norm = a / (np.linalg.norm(a, axis=1, keepdims=True) + 1e-12)
    b_norm = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-12)
    return a_norm @ b_norm.T


class ContentBasedRecommender(BaseRecommender):
    """
    Content-based recommender using TF-IDF or SentenceTransformer embeddings.
    Fallback order: sentence-transformers (if available) -> TF-IDF.
    """

    def __init__(self, use_sentence_transformer: bool = True, model_name: str = "all-MiniLM-L6-v2") -> None:
        super().__init__()
        self.use_sentence_transformer = use_sentence_transformer
        self.model_name = model_name
        self._embedder = None
        self._vectorizer = None
        self._item_embeddings: Optional[np.ndarray] = None
        self._id2idx: Dict[str, int] = {}

    def _ensure_embedder(self) -> None:
        if not self.use_sentence_transformer:
            return
        if self._embedder is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._embedder = SentenceTransformer(self.model_name)
            except Exception:
                # Fallback to TF-IDF
                self.use_sentence_transformer = False

    def _ensure_vectorizer(self) -> None:
        if self._vectorizer is None:
            from sklearn.feature_extraction.text import TfidfVectorizer
            self._vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))

    def _textify(self, row: pd.Series) -> str:
        parts = [str(row.get("title", "")), str(row.get("category", ""))]
        tags = row.get("tags", [])
        if isinstance(tags, list):
            parts.append(" ".join(tags))
        elif isinstance(tags, str):
            parts.append(tags)
        if "mood" in row and pd.notna(row["mood"]):
            parts.append(str(row["mood"]))
        return " ".join([p for p in parts if p])

    def train(self) -> None:
        if self.items_df.empty:
            raise ValueError("items_df is empty. Call load_data first.")
        texts = [self._textify(r) for _, r in self.items_df.iterrows()]
        self._id2idx = {iid: i for i, iid in enumerate(self.items_df["item_id"].tolist())}

        # Try sentence-transformers first
        self._ensure_embedder()
        if self.use_sentence_transformer and self._embedder is not None:
            emb = self._embedder.encode(texts, convert_to_numpy=True, show_progress_bar=False)
            self._item_embeddings = emb.astype(np.float32)
        else:
            # TF-IDF fallback
            self._ensure_vectorizer()
            X = self._vectorizer.fit_transform(texts)
            self._item_embeddings = X.astype(np.float32).toarray()

    def _user_profile(self, user_id: str) -> np.ndarray:
        if user_id not in self.interactions_df.index:
            # cold start: average content vector
            return self._item_embeddings.mean(axis=0, keepdims=True)
        user_row = self.interactions_df.loc[user_id].values.astype(float)
        if user_row.sum() <= 0:
            return self._item_embeddings.mean(axis=0, keepdims=True)
        # Weighted average of item embeddings
        weights = user_row / (user_row.sum() + 1e-12)
        profile = weights @ self._item_embeddings
        return profile.reshape(1, -1)

    def recommend(self, user_id: str, top_n: int = 5, context: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        if self._item_embeddings is None:
            raise RuntimeError("Model not trained. Call train().")
        profile = self._user_profile(user_id)
        sims = _cosine_sim(profile, self._item_embeddings).ravel()
        # Exclude already interacted
        if user_id in self.interactions_df.index:
            interacted = (self.interactions_df.loc[user_id] > 0).values
        else:
            interacted = np.zeros_like(sims, dtype=bool)
        sims[interacted] = -np.inf
        order = np.argsort(-sims)
        top_idx = [i for i in order if sims[i] > -np.inf][:top_n]
        items = []
        for idx in top_idx:
            row = self.items_df.iloc[idx].to_dict()
            items.append({
                "id": row.get("item_id"),
                "title": row.get("title"),
                "type": row.get("category", "Item"),
                "score": float(sims[idx]) if sims[idx] > -np.inf else 0.0,
            })
        return items
