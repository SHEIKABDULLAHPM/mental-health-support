from __future__ import annotations
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from scipy import sparse
from .base import BaseRecommender


class CollaborativeRecommender(BaseRecommender):
    """Collaborative Filtering using LightFM (hybrid-capable).
    Falls back to simple user-item cosine scoring if LightFM is unavailable.
    """

    def __init__(self, no_components: int = 32, epochs: int = 20, learning_rate: float = 0.05) -> None:
        super().__init__()
        self.no_components = no_components
        self.epochs = epochs
        self.learning_rate = learning_rate
        self._lightfm = None
        self._use_lightfm = True
        self._user_map: Dict[str, int] = {}
        self._item_map: Dict[str, int] = {}
        self._user_item_matrix: Optional[sparse.csr_matrix] = None
        self._item_norms: Optional[np.ndarray] = None  # for cosine fallback

    def _ensure_lightfm(self) -> None:
        if self._lightfm is None and self._use_lightfm:
            try:
                from lightfm import LightFM
                self._lightfm = LightFM(no_components=self.no_components, learning_rate=self.learning_rate, loss="warp")
            except Exception:
                self._use_lightfm = False

    def _build_maps(self) -> None:
        self._user_map = {u: i for i, u in enumerate(self.interactions_df.index.tolist())}
        self._item_map = {i: j for j, i in enumerate(self.interactions_df.columns.tolist())}

    def _to_csr(self) -> sparse.csr_matrix:
        mat = sparse.csr_matrix(self.interactions_df.values.astype(float))
        return mat

    def train(self) -> None:
        if self.interactions_df.empty:
            raise ValueError("interactions_df is empty. Call load_data first.")
        self._build_maps()
        ui = self._to_csr()
        self._user_item_matrix = ui

        # Try LightFM
        self._ensure_lightfm()
        if self._use_lightfm and self._lightfm is not None:
            self._lightfm.fit(ui, epochs=self.epochs, num_threads=1)
        else:
            # Precompute item norms for cosine fallback
            item_vecs = ui.T.tocsr()
            norms = np.sqrt(item_vecs.multiply(item_vecs).sum(axis=1)).A1
            norms[norms == 0] = 1e-12
            self._item_norms = norms

    def _recommend_lightfm(self, user_id: str, top_n: int) -> List[Dict[str, Any]]:
        uid = self._user_map.get(user_id)
        if uid is None:
            # cold user: popularity by global interaction counts
            scores = np.asarray(self._user_item_matrix.sum(axis=0)).ravel()
        else:
            import numpy as np
            scores = self._lightfm.predict(uid, np.arange(self._user_item_matrix.shape[1]))
        # Exclude interacted
        if user_id in self.interactions_df.index:
            interacted = (self.interactions_df.loc[user_id] > 0).values
        else:
            interacted = np.zeros_like(scores, dtype=bool)
        scores = scores.astype(float)
        scores[interacted] = -np.inf
        order = np.argsort(-scores)
        top_idx = [i for i in order if scores[i] > -np.inf][:top_n]
        items = []
        for idx in top_idx:
            row = self.items_df.iloc[idx].to_dict()
            items.append({
                "id": row.get("item_id"),
                "title": row.get("title"),
                "type": row.get("category", "Item"),
                "score": float(scores[idx]) if scores[idx] > -np.inf else 0.0,
            })
        return items

    def _recommend_cosine(self, user_id: str, top_n: int) -> List[Dict[str, Any]]:
        # User-based CF with cosine similarity between users
        ui = self._user_item_matrix
        if ui is None:
            raise RuntimeError("Model not trained.")
        # Cold user: use popularity
        if user_id not in self.interactions_df.index:
            scores = np.asarray(ui.sum(axis=0)).ravel().astype(float)
        else:
            uid = self._user_map[user_id]
            mat = ui.toarray().astype(float)  # small/local datasets expected
            # normalize users
            norms = np.linalg.norm(mat, axis=1, keepdims=True)
            norms[norms == 0] = 1e-12
            mat_norm = mat / norms
            sim_row = mat_norm[uid] @ mat_norm.T  # (U,)
            sim_row[uid] = 0.0
            scores = sim_row @ mat  # (I,)
        # Exclude interacted
        if user_id in self.interactions_df.index:
            interacted = (self.interactions_df.loc[user_id] > 0).values
        else:
            interacted = np.zeros_like(scores, dtype=bool)
        scores = scores.astype(float)
        scores[interacted] = -np.inf
        order = np.argsort(-scores)
        top_idx = [i for i in order if scores[i] > -np.inf][:top_n]
        items = []
        for idx in top_idx:
            row = self.items_df.iloc[idx].to_dict()
            items.append({
                "id": row.get("item_id"),
                "title": row.get("title"),
                "type": row.get("category", "Item"),
                "score": float(scores[idx]) if scores[idx] > -np.inf else 0.0,
            })
        return items

    def recommend(self, user_id: str, top_n: int = 5, context: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        if self._user_item_matrix is None:
            raise RuntimeError("Model not trained. Call train().")
        if self._use_lightfm and self._lightfm is not None:
            return self._recommend_lightfm(user_id, top_n)
        return self._recommend_cosine(user_id, top_n)
