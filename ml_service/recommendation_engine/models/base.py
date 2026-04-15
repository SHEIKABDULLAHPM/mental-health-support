from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import pandas as pd


class BaseRecommender(ABC):
    """
    Base interface for all recommenders.

    Contract:
    - load_data(items_df, interactions_df): ingest dataframes with standardized schema.
    - train(): build model artifacts.
    - recommend(user_id, top_n, context): return a list of item dicts with at least id, title, score.

    Expected item schema:
      items_df columns: [item_id, title, category, tags (list[str]|str|NaN), ...]
      interactions_df: index=user_id, columns=item_id, values=implicit/explicit rating (float)
    """

    def __init__(self) -> None:
        self.items_df: pd.DataFrame = pd.DataFrame()
        self.interactions_df: pd.DataFrame = pd.DataFrame()

    def load_data(self, items_df: pd.DataFrame, interactions_df: pd.DataFrame) -> None:
        self.items_df = items_df.copy()
        self.interactions_df = interactions_df.copy()

    @abstractmethod
    def train(self) -> None:
        """Train the model using loaded data."""
        raise NotImplementedError

    @abstractmethod
    def recommend(self, user_id: str, top_n: int = 5, context: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Return top-N recommendations for a given user."""
        raise NotImplementedError
