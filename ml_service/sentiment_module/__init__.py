"""
Reusable Sentiment Analysis Module
Provides unified interface for sentiment analysis across the application
"""
from .analyzer import SentimentAnalyzer, SentimentResult
from .models import VADERModel, ClassicalModel, BiLSTMModel, EnsembleModel

__all__ = [
    'SentimentAnalyzer',
    'SentimentResult',
    'VADERModel',
    'ClassicalModel',
    'BiLSTMModel',
    'EnsembleModel'
]

__version__ = '1.0.0'
