"""
Core Sentiment Analyzer
Unified interface for all sentiment analysis models
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Dict, List, Optional, Literal
from enum import Enum


class SentimentLabel(str, Enum):
    """Sentiment classification labels"""
    POSITIVE = "Positive"
    NEGATIVE = "Negative"
    NEUTRAL = "Neutral"
    ANXIETY = "Anxiety"
    DEPRESSION = "Depression"
    STRESS = "Stress"
    SUICIDAL = "Suicidal"


@dataclass
class SentimentResult:
    """Unified sentiment analysis result"""
    text: str
    label: str
    confidence: float  # 0.0 to 1.0
    intensity: float  # 0.0 to 1.0 (strength of sentiment)
    compound_score: float  # -1.0 to 1.0 (VADER compound or normalized score)
    keywords: List[str]
    model: str
    processing_time_ms: float
    timestamp: str
    
    # Optional advanced fields
    scores: Optional[Dict[str, float]] = None  # Raw scores from model
    emotions: Optional[Dict[str, float]] = None  # Multi-emotion detection
    mental_health_flags: Optional[List[str]] = None  # Crisis indicators
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        result = {
            "text": self.text,
            "label": self.label,
            "confidence": round(self.confidence, 4),
            "intensity": round(self.intensity, 4),
            "compound_score": round(self.compound_score, 4),
            "keywords": self.keywords,
            "model": self.model,
            "processing_time_ms": round(self.processing_time_ms, 2),
            "timestamp": self.timestamp
        }
        
        if self.scores:
            result["scores"] = {k: round(v, 4) for k, v in self.scores.items()}
        if self.emotions:
            result["emotions"] = {k: round(v, 4) for k, v in self.emotions.items()}
        if self.mental_health_flags:
            result["mental_health_flags"] = self.mental_health_flags
            
        return result


class SentimentAnalyzer:
    """
    Main sentiment analyzer class
    Supports multiple models and unified interface
    """
    
    def __init__(self):
        self._models = {}
        self._default_model = "vader"
    
    def register_model(self, name: str, model):
        """Register a sentiment model"""
        self._models[name] = model
        
    def set_default_model(self, name: str):
        """Set the default model to use"""
        if name in self._models:
            self._default_model = name
        else:
            raise ValueError(f"Model '{name}' not registered")
    
    def analyze(
        self,
        text: str,
        model: Optional[str] = None,
        extract_keywords: bool = True,
        top_k_keywords: int = 5,
        **kwargs
    ) -> SentimentResult:
        """
        Analyze sentiment of text
        
        Args:
            text: Input text to analyze
            model: Model to use (vader, classical, bilstm, ensemble)
            extract_keywords: Whether to extract keywords
            top_k_keywords: Number of keywords to extract
            **kwargs: Additional model-specific parameters
            
        Returns:
            SentimentResult object
        """
        start_time = time.time()
        
        model_name = model or self._default_model
        
        if model_name not in self._models:
            raise ValueError(f"Model '{model_name}' not available. Available: {list(self._models.keys())}")
        
        # Get the model and analyze
        analyzer_model = self._models[model_name]
        result = analyzer_model.analyze(
            text,
            extract_keywords=extract_keywords,
            top_k_keywords=top_k_keywords,
            **kwargs
        )
        
        # Add processing time
        processing_time_ms = (time.time() - start_time) * 1000
        result.processing_time_ms = processing_time_ms
        
        return result
    
    def analyze_batch(
        self,
        texts: List[str],
        model: Optional[str] = None,
        **kwargs
    ) -> List[SentimentResult]:
        """
        Analyze multiple texts in batch
        
        Args:
            texts: List of texts to analyze
            model: Model to use
            **kwargs: Additional parameters
            
        Returns:
            List of SentimentResult objects
        """
        return [self.analyze(text, model=model, **kwargs) for text in texts]
    
    def get_available_models(self) -> List[str]:
        """Get list of available models"""
        return list(self._models.keys())
    
    def get_model_info(self) -> Dict:
        """Get information about all registered models"""
        info = {}
        for name, model in self._models.items():
            info[name] = {
                "available": True,
                "description": getattr(model, 'description', 'No description'),
                "version": getattr(model, 'version', '1.0.0')
            }
        return info


# Global analyzer instance
_global_analyzer: Optional[SentimentAnalyzer] = None


def get_analyzer() -> SentimentAnalyzer:
    """Get or create global sentiment analyzer instance"""
    global _global_analyzer
    if _global_analyzer is None:
        _global_analyzer = SentimentAnalyzer()
    return _global_analyzer
