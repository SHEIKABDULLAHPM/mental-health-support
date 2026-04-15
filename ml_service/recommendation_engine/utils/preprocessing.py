from __future__ import annotations
from typing import Tuple
import pandas as pd


def load_reco_datasets(base_dir: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load and standardize items.csv and interactions.csv from base_dir.

    Returns: items_df, interactions_df
    - items_df columns: item_id, title, category, tags (list[str])
    - interactions_df index: user_id, columns: item_id
    """
    items = pd.read_csv(f"{base_dir}/items.csv")
    if "tags" in items.columns:
        items["tags"] = items["tags"].fillna("").apply(lambda s: [t.strip() for t in str(s).split(',') if t.strip()])
    else:
        items["tags"] = [[] for _ in range(len(items))]
    if "category" not in items.columns:
        items["category"] = "Item"

    interactions = pd.read_csv(f"{base_dir}/interactions.csv", index_col=0)
    # ensure items order/coverage
    if "item_id" in items.columns:
        interactions = interactions.reindex(columns=items["item_id"].tolist(), fill_value=0)
    else:
        raise ValueError("items.csv must include item_id column")
    return items, interactions
