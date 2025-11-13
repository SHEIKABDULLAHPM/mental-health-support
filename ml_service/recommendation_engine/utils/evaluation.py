from __future__ import annotations
from typing import Dict, List
import numpy as np
import pandas as pd


def precision_recall_at_k(actual: List[str], predicted: List[str], k: int) -> Dict[str, float]:
    k = max(1, int(k))
    pred_k = predicted[:k]
    actual_set = set(actual)
    if not actual_set:
        return {"precision": 0.0, "recall": 0.0, "f1": 0.0}
    hits = len(actual_set.intersection(pred_k))
    prec = hits / k
    rec = hits / len(actual_set)
    f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
    return {"precision": float(prec), "recall": float(rec), "f1": float(f1)}


def average_precision_at_k(actual: List[str], predicted: List[str], k: int) -> float:
    k = max(1, int(k))
    pred_k = predicted[:k]
    score = 0.0
    hits = 0
    actual_set = set(actual)
    for i, p in enumerate(pred_k, start=1):
        if p in actual_set:
            hits += 1
            score += hits / i
    denom = min(k, len(actual_set))
    return float(score / denom) if denom > 0 else 0.0


def evaluate_holdout_at_k(recommender, interactions_df: pd.DataFrame, k: int = 5) -> Dict[str, float]:
    """For each user, hold out one positive item as test. Compute averages of metrics."""
    precisions, recalls, f1s, maps = [], [], [], []
    for user_id, row in interactions_df.iterrows():
        pos_items = list(row[row > 0].index)
        if not pos_items:
            continue
        test_item = pos_items[0]
        # Temporarily mask
        original = interactions_df.at[user_id, test_item]
        interactions_df.at[user_id, test_item] = 0
        try:
            recs = recommender.recommend(user_id, top_n=k)
            pred = [r["id"] for r in recs]
            m = precision_recall_at_k([test_item], pred, k)
            precisions.append(m["precision"])
            recalls.append(m["recall"])
            f1s.append(m["f1"])
            maps.append(average_precision_at_k([test_item], pred, k))
        finally:
            interactions_df.at[user_id, test_item] = original
    def avg(x):
        return float(np.mean(x)) if x else 0.0
    return {
        "precision@k": round(avg(precisions), 6),
        "recall@k": round(avg(recalls), 6),
        "f1@k": round(avg(f1s), 6),
        "map@k": round(avg(maps), 6),
    }
