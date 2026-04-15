from __future__ import annotations
from typing import Dict, Literal, Optional
import json
import os


class FeedbackManager:
    """Simple feedback logger and updater for interactions matrix.

    Actions: 'like' (+1), 'dislike' (-1), 'skip' (+0.1)
    Persists feedback to a JSONL file for lightweight tracking.
    """

    def __init__(self, log_dir: str) -> None:
        self.log_dir = log_dir
        os.makedirs(self.log_dir, exist_ok=True)
        self.log_path = os.path.join(self.log_dir, "reco_feedback.jsonl")

    def record(self, interactions_df, user_id: str, item_id: str, action: Literal['like','dislike','skip'], weight: Optional[float] = None):
        if weight is None:
            weight = {"like": 1.0, "dislike": -1.0, "skip": 0.1}.get(action, 0.1)
        # Ensure rows/columns
        if user_id not in interactions_df.index:
            import pandas as pd
            interactions_df.loc[user_id] = 0.0
        if item_id not in interactions_df.columns:
            interactions_df[item_id] = 0.0
        # Update value incrementally (clip to [-5, 5])
        new_val = float(interactions_df.at[user_id, item_id]) + float(weight)
        if new_val > 5.0:
            new_val = 5.0
        if new_val < -5.0:
            new_val = -5.0
        interactions_df.at[user_id, item_id] = new_val
        # Persist log
        with open(self.log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps({
                "user_id": user_id,
                "item_id": item_id,
                "action": action,
                "delta": weight
            }) + "\n")
        return interactions_df
