"""
Mood Pattern Recognition System
================================
A dual-modality (Face + Text) emotion detection and mood prediction system.

Modules:
- models: Face emotion, text emotion, fusion, and trend prediction models
- utils: Emotion mapping, visualization, and metrics
- api: FastAPI service endpoints
- training: Model training scripts
- datasets: Data preprocessing utilities
"""

__version__ = "1.0.0"
__author__ = "Mental Health App Team"

from .models.face_emotion_model import FaceEmotionDetector
from .models.text_emotion_model import TextEmotionAnalyzer
from .models.mood_fusion_model import MoodFusionModel
from .models.mood_trend_predictor import MoodTrendPredictor

__all__ = [
    "FaceEmotionDetector",
    "TextEmotionAnalyzer",
    "MoodFusionModel",
    "MoodTrendPredictor"
]
