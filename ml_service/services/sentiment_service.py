"""
Unified Sentiment Analysis Service
Integrates VADER, Classical ML, and BiLSTM models
Provides intelligent routing, ensemble predictions, and analytics
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional
import json

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)


class SentimentModel(Enum):
    """Available sentiment analysis models"""
    VADER = "vader"  # Real-time, rule-based
    CLASSICAL = "classical"  # TF-IDF + Logistic Regression
    BILSTM = "bilstm"  # Deep Learning BiLSTM
    ENSEMBLE = "ensemble"  # Combined prediction


@dataclass
class SentimentResult:
    """Standardized sentiment result"""
    text: str
    model: str
    label: str  # Positive/Negative/Neutral or mental health category
    confidence: float  # 0-1
    intensity: float  # 0-1
    compound_score: Optional[float] = None  # VADER compound score
    keywords: Optional[List[str]] = None
    probabilities: Optional[Dict[str, float]] = None  # Class probabilities
    processing_time_ms: Optional[float] = None
    timestamp: Optional[str] = None
    metadata: Optional[Dict] = None

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        result = {
            "text": self.text[:100] + "..." if len(self.text) > 100 else self.text,
            "model": self.model,
            "label": self.label,
            "confidence": round(self.confidence, 4),
            "intensity": round(self.intensity, 4),
        }
        if self.compound_score is not None:
            result["compound_score"] = round(self.compound_score, 4)
        if self.keywords:
            result["keywords"] = self.keywords
        if self.probabilities:
            result["probabilities"] = {k: round(v, 4) for k, v in self.probabilities.items()}
        if self.processing_time_ms:
            result["processing_time_ms"] = round(self.processing_time_ms, 2)
        if self.timestamp:
            result["timestamp"] = self.timestamp
        if self.metadata:
            result["metadata"] = self.metadata
        return result


class VADERAnalyzer:
    """VADER sentiment analyzer - lightweight, real-time"""
    
    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()
        self.name = "VADER"
    
    def analyze(self, text: str, extract_keywords: bool = True) -> SentimentResult:
        """Analyze text sentiment using VADER"""
        import time
        import re
        from collections import Counter
        
        start = time.time()
        
        # Get VADER scores
        scores = self.analyzer.polarity_scores(text or "")
        compound = float(scores.get("compound", 0.0))
        
        # Determine label
        if compound >= 0.05:
            label = "Positive"
        elif compound <= -0.05:
            label = "Negative"
        else:
            label = "Neutral"
        
        # Calculate confidence and intensity
        confidence = min(abs(compound), 1.0)
        intensity = confidence
        
        # Extract keywords
        keywords = []
        if extract_keywords:
            # Simple keyword extraction
            stop_words = {
                "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in", 
                "into", "is", "it", "no", "not", "of", "on", "or", "such", "that", "the", 
                "their", "then", "there", "these", "they", "this", "to", "was", "will", "with"
            }
            tokens = [t for t in re.split(r"[^a-zA-Z]+", (text or "").lower()) 
                     if t and len(t) >= 3 and t not in stop_words]
            counts = Counter(tokens)
            keywords = [w for w, _ in counts.most_common(5)]
        
        elapsed = (time.time() - start) * 1000
        
        return SentimentResult(
            text=text,
            model=self.name,
            label=label,
            confidence=confidence,
            intensity=intensity,
            compound_score=compound,
            keywords=keywords,
            processing_time_ms=elapsed,
            timestamp=datetime.utcnow().isoformat(),
            metadata={
                "pos": scores.get("pos"),
                "neu": scores.get("neu"),
                "neg": scores.get("neg")
            }
        )


class ClassicalAnalyzer:
    """Classical ML analyzer - TF-IDF + Logistic Regression"""
    
    def __init__(self, model_dir: Optional[str] = None):
        self.name = "Classical"
        self.model_dir = model_dir or "models/sentiment_custom/artifacts/mental_health"
        self.model = None
        self.vectorizer = None
        self.meta = None
        self._load_model()
    
    def _load_model(self):
        """Load trained classical model"""
        try:
            import joblib
            
            base = Path(self.model_dir)
            self.model = joblib.load(base / "model.joblib")
            self.vectorizer = joblib.load(base / "vectorizer.joblib")
            
            meta_path = base / "meta.json"
            if meta_path.exists():
                self.meta = json.loads(meta_path.read_text(encoding="utf-8"))
            
            logger.info(f"Classical model loaded from {self.model_dir}")
        except Exception as e:
            logger.warning(f"Failed to load classical model: {e}")
            self.model = None
    
    def analyze(self, text: str) -> SentimentResult:
        """Analyze text using classical ML model"""
        import time
        import numpy as np
        
        if self.model is None:
            raise RuntimeError("Classical model not loaded")
        
        start = time.time()
        
        # Vectorize text
        X = self.vectorizer.transform([text])
        
        # Predict
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        
        # Get label and confidence
        label = str(prediction)
        confidence = float(max(probabilities))
        
        # Calculate intensity (distance from neutral)
        intensity = confidence
        
        # Get class probabilities
        classes = self.model.classes_
        probs_dict = {str(cls): float(prob) for cls, prob in zip(classes, probabilities)}
        
        elapsed = (time.time() - start) * 1000
        
        return SentimentResult(
            text=text,
            model=self.name,
            label=label,
            confidence=confidence,
            intensity=intensity,
            probabilities=probs_dict,
            processing_time_ms=elapsed,
            timestamp=datetime.utcnow().isoformat(),
            metadata={
                "classes": [str(c) for c in classes],
                "accuracy": self.meta.get("metrics", {}).get("test", {}).get("accuracy") if self.meta else None
            }
        )


class BiLSTMAnalyzer:
    """BiLSTM Deep Learning analyzer - context-aware"""
    
    def __init__(self, model_dir: Optional[str] = None):
        self.name = "BiLSTM"
        self.model_dir = model_dir or "models/sentiment_custom/artifacts/mental_health_lstm"
        self.model = None
        self.tokenizer = None
        self.label_encoder = None
        self.meta = None
        self.pad_sequences = None
        self._load_model()
    
    def _load_model(self):
        """Load trained BiLSTM model"""
        try:
            import sys
            from pathlib import Path
            
            # Add models path
            models_path = Path(__file__).resolve().parent.parent / "models" / "sentiment_custom"
            sys.path.insert(0, str(models_path))
            
            from keras_lstm import load_keras_artifacts
            
            artifacts = load_keras_artifacts(self.model_dir)
            self.meta, self.tokenizer, self.label_encoder, self.model, self.pad_sequences = artifacts
            
            logger.info(f"BiLSTM model loaded from {self.model_dir}")
        except Exception as e:
            logger.warning(f"Failed to load BiLSTM model: {e}")
            self.model = None
    
    def analyze(self, text: str) -> SentimentResult:
        """Analyze text using BiLSTM model"""
        import time
        import numpy as np
        
        if self.model is None:
            raise RuntimeError("BiLSTM model not loaded")
        
        start = time.time()
        
        # Preprocess text (same as training)
        from keras_lstm import preprocess_text
        processed = preprocess_text(text or "")
        
        # Tokenize and pad
        seq = self.tokenizer.texts_to_sequences([processed])
        X = self.pad_sequences(seq, maxlen=self.meta["tokenizer"]["max_len"], padding="post")
        
        # Predict
        probs = self.model.predict(X, verbose=0)[0]
        pred_idx = int(np.argmax(probs))
        label = self.label_encoder.inverse_transform([pred_idx])[0]
        confidence = float(probs[pred_idx])
        
        # Calculate intensity
        intensity = confidence
        
        # Get class probabilities
        classes = self.label_encoder.classes_
        probs_dict = {str(cls): float(prob) for cls, prob in zip(classes, probs)}
        
        elapsed = (time.time() - start) * 1000
        
        return SentimentResult(
            text=text,
            model=self.name,
            label=label,
            confidence=confidence,
            intensity=intensity,
            probabilities=probs_dict,
            processing_time_ms=elapsed,
            timestamp=datetime.utcnow().isoformat(),
            metadata={
                "classes": [str(c) for c in classes],
                "accuracy": self.meta.get("metrics", {}).get("accuracy") if self.meta else None,
                "architecture": "BiLSTM",
                "embedding_dim": self.meta.get("config", {}).get("embedding_dim")
            }
        )


class EnsembleAnalyzer:
    """Ensemble analyzer combining all three models"""
    
    def __init__(self):
        self.name = "Ensemble"
        self.vader = VADERAnalyzer()
        try:
            self.classical = ClassicalAnalyzer()
        except Exception as e:
            logger.warning(f"Classical model unavailable: {e}")
            self.classical = None
        try:
            self.bilstm = BiLSTMAnalyzer()
        except Exception as e:
            logger.warning(f"BiLSTM model unavailable: {e}")
            self.bilstm = None
    
    def analyze(self, text: str, weights: Optional[Dict[str, float]] = None) -> SentimentResult:
        """
        Analyze text using ensemble of models
        
        Args:
            text: Input text
            weights: Model weights (vader, classical, bilstm). Default: equal weights
        
        Returns:
            SentimentResult with ensemble prediction
        """
        import time
        
        start = time.time()
        
        # Default weights
        if weights is None:
            weights = {"vader": 0.33, "classical": 0.33, "bilstm": 0.34}
        
        results = []
        
        # Get predictions from each model
        vader_result = self.vader.analyze(text, extract_keywords=True)
        results.append(("vader", vader_result, weights.get("vader", 0)))
        
        if self.classical:
            try:
                classical_result = self.classical.analyze(text)
                results.append(("classical", classical_result, weights.get("classical", 0)))
            except Exception as e:
                logger.warning(f"Classical prediction failed: {e}")
        
        if self.bilstm:
            try:
                bilstm_result = self.bilstm.analyze(text)
                results.append(("bilstm", bilstm_result, weights.get("bilstm", 0)))
            except Exception as e:
                logger.warning(f"BiLSTM prediction failed: {e}")
        
        # Normalize weights
        total_weight = sum(w for _, _, w in results)
        if total_weight == 0:
            total_weight = 1.0
        
        # Weighted voting for label
        label_votes = {}
        confidence_sum = 0
        intensity_sum = 0
        
        for model_name, result, weight in results:
            normalized_weight = weight / total_weight
            
            # Vote for label
            label_votes[result.label] = label_votes.get(result.label, 0) + normalized_weight
            
            # Weighted confidence and intensity
            confidence_sum += result.confidence * normalized_weight
            intensity_sum += result.intensity * normalized_weight
        
        # Determine final label (highest weighted vote)
        final_label = max(label_votes.items(), key=lambda x: x[1])[0]
        final_confidence = confidence_sum
        final_intensity = intensity_sum
        
        elapsed = (time.time() - start) * 1000
        
        # Collect metadata
        metadata = {
            "models_used": [name for name, _, _ in results],
            "weights": {name: w / total_weight for name, _, w in results},
            "individual_predictions": {
                name: {"label": r.label, "confidence": r.confidence}
                for name, r, _ in results
            }
        }
        
        return SentimentResult(
            text=text,
            model=self.name,
            label=final_label,
            confidence=final_confidence,
            intensity=final_intensity,
            keywords=vader_result.keywords,  # Use VADER keywords
            processing_time_ms=elapsed,
            timestamp=datetime.utcnow().isoformat(),
            metadata=metadata
        )


class SentimentService:
    """
    Main Sentiment Analysis Service
    Provides unified interface to all sentiment models
    """
    
    def __init__(self):
        self.vader = VADERAnalyzer()
        try:
            self.classical = ClassicalAnalyzer()
        except Exception as e:
            logger.warning(f"Classical model unavailable: {e}")
            self.classical = None
        try:
            self.bilstm = BiLSTMAnalyzer()
        except Exception as e:
            logger.warning(f"BiLSTM model unavailable: {e}")
            self.bilstm = None
        self.ensemble = EnsembleAnalyzer()
        
        logger.info("SentimentService initialized")
    
    def analyze(
        self, 
        text: str, 
        model: SentimentModel = SentimentModel.VADER,
        extract_keywords: bool = True,
        ensemble_weights: Optional[Dict[str, float]] = None
    ) -> SentimentResult:
        """
        Analyze sentiment using specified model
        
        Args:
            text: Input text
            model: Model to use (VADER/CLASSICAL/BILSTM/ENSEMBLE)
            extract_keywords: Extract keywords (VADER only)
            ensemble_weights: Weights for ensemble (if using ensemble)
        
        Returns:
            SentimentResult
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        if model == SentimentModel.VADER:
            return self.vader.analyze(text, extract_keywords=extract_keywords)
        
        elif model == SentimentModel.CLASSICAL:
            if self.classical is None:
                raise RuntimeError("Classical model not available")
            return self.classical.analyze(text)
        
        elif model == SentimentModel.BILSTM:
            if self.bilstm is None:
                raise RuntimeError("BiLSTM model not available")
            return self.bilstm.analyze(text)
        
        elif model == SentimentModel.ENSEMBLE:
            return self.ensemble.analyze(text, weights=ensemble_weights)
        
        else:
            raise ValueError(f"Unknown model: {model}")
    
    def analyze_batch(
        self, 
        texts: List[str], 
        model: SentimentModel = SentimentModel.VADER
    ) -> List[SentimentResult]:
        """
        Analyze multiple texts
        
        Args:
            texts: List of input texts
            model: Model to use
        
        Returns:
            List of SentimentResult
        """
        return [self.analyze(text, model=model) for text in texts]
    
    def get_model_info(self, model: Optional[SentimentModel] = None) -> Dict:
        """
        Get information about available models
        
        Args:
            model: Specific model to get info for (None = all models)
        
        Returns:
            Dictionary with model information
        """
        info = {}
        
        if model is None or model == SentimentModel.VADER:
            info["vader"] = {
                "name": "VADER",
                "type": "rule-based",
                "description": "Lightweight, real-time sentiment analysis",
                "speed": "< 100ms",
                "best_for": ["chatbot", "mood_checkin", "real-time"],
                "available": True
            }
        
        if model is None or model == SentimentModel.CLASSICAL:
            info["classical"] = {
                "name": "Classical ML",
                "type": "statistical",
                "description": "TF-IDF + Logistic Regression",
                "accuracy": self.classical.meta.get("metrics", {}).get("test", {}).get("accuracy") if self.classical and self.classical.meta else None,
                "speed": "< 50ms",
                "best_for": ["journal", "reflection_wall"],
                "available": self.classical is not None,
                "labels": self.classical.meta.get("labels") if self.classical and self.classical.meta else None
            }
        
        if model is None or model == SentimentModel.BILSTM:
            info["bilstm"] = {
                "name": "BiLSTM Deep Learning",
                "type": "neural_network",
                "description": "Bidirectional LSTM for context-aware analysis",
                "accuracy": self.bilstm.meta.get("metrics", {}).get("accuracy") if self.bilstm and self.bilstm.meta else None,
                "speed": "~1-2s",
                "best_for": ["journal", "reflection_wall", "detailed_analysis"],
                "available": self.bilstm is not None,
                "labels": [str(c) for c in self.bilstm.label_encoder.classes_] if self.bilstm and self.bilstm.label_encoder else None
            }
        
        if model is None or model == SentimentModel.ENSEMBLE:
            info["ensemble"] = {
                "name": "Ensemble",
                "type": "hybrid",
                "description": "Weighted combination of all models",
                "speed": "~1-3s",
                "best_for": ["comprehensive_analysis"],
                "available": True,
                "models_used": [
                    "vader",
                    "classical" if self.classical else None,
                    "bilstm" if self.bilstm else None
                ]
            }
        
        return info
    
    def recommend_model(self, use_case: str) -> SentimentModel:
        """
        Recommend best model for a specific use case
        
        Args:
            use_case: One of [chatbot, mood_checkin, journal, reflection_wall]
        
        Returns:
            Recommended SentimentModel
        """
        recommendations = {
            "chatbot": SentimentModel.VADER,
            "mood_checkin": SentimentModel.VADER,
            "journal": SentimentModel.BILSTM if self.bilstm else SentimentModel.CLASSICAL,
            "reflection_wall": SentimentModel.CLASSICAL if self.classical else SentimentModel.VADER,
            "detailed_analysis": SentimentModel.ENSEMBLE
        }
        
        return recommendations.get(use_case.lower(), SentimentModel.VADER)


# Global service instance
_service: Optional[SentimentService] = None


def get_sentiment_service() -> SentimentService:
    """Get or create global sentiment service instance"""
    global _service
    if _service is None:
        _service = SentimentService()
    return _service
