from __future__ import annotations
from typing import Any, Dict, List, Optional
import numpy as np
from .base import BaseRecommender
from .content_based import ContentBasedRecommender
from .collaborative import CollaborativeRecommender


class HybridRecommender(BaseRecommender):
    """Hybrid recommender combining content-based and collaborative scores.

    final_score = alpha * content_score + beta * collaborative_score
    with alpha in [0,1], beta = 1 - alpha by default.
    """

    def __init__(self, alpha: float = 0.5) -> None:
        super().__init__()
        self.alpha = float(max(0.0, min(1.0, alpha)))
        self.cb = ContentBasedRecommender()
        self.cf = CollaborativeRecommender()

    def load_data(self, items_df, interactions_df) -> None:
        super().load_data(items_df, interactions_df)
        self.cb.load_data(items_df, interactions_df)
        self.cf.load_data(items_df, interactions_df)

    def train(self) -> None:
        self.cb.train()
        self.cf.train()

    def recommend(self, user_id: str, top_n: int = 5, context: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        cb_items = self.cb.recommend(user_id, top_n=max(top_n * 2, 20), context=context)
        cf_items = self.cf.recommend(user_id, top_n=max(top_n * 2, 20), context=context)
        # Merge by id
        scores: Dict[str, Dict[str, float]] = {}
        for r in cb_items:
            scores.setdefault(r["id"], {}).update({"cb": float(r.get("score", 0.0)), "title": r.get("title"), "type": r.get("type")})
        for r in cf_items:
            scores.setdefault(r["id"], {}).update({"cf": float(r.get("score", 0.0)), "title": r.get("title"), "type": r.get("type")})
        alpha = self.alpha
        fused = []
        # min-max normalize within this pool to [0,1]
        cb_vals = np.array([float(v.get("cb", 0.0)) for v in scores.values()], dtype=float)
        cf_vals = np.array([float(v.get("cf", 0.0)) for v in scores.values()], dtype=float)
        def _norm(x: float, arr: np.ndarray) -> float:
            mn, mx = float(arr.min(initial=0.0)), float(arr.max(initial=1.0))
            if mx - mn < 1e-12:
                return 0.0
            return (x - mn) / (mx - mn)
        for iid, s in scores.items():
            cb_s = _norm(float(s.get("cb", 0.0)), cb_vals)
            cf_s = _norm(float(s.get("cf", 0.0)), cf_vals)
            fused.append({
                "id": iid,
                "title": s.get("title"),
                "type": s.get("type", "Item"),
                "score": float(alpha * cb_s + (1.0 - alpha) * cf_s)
            })
        fused.sort(key=lambda x: x["score"], reverse=True)
        return fused[:top_n]
