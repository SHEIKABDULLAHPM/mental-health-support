"""
Sentiment Analysis Models
Implementations for VADER, Classical, BiLSTM, and Ensemble models
"""
from __future__ import annotations

import re
from abc import ABC, abstractmethod
from collections import Counter
from datetime import datetime
from typing import Dict, List, Optional

from .analyzer import SentimentResult, SentimentLabel


# Common stop words for keyword extraction
STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in",
    "into", "is", "it", "no", "not", "of", "on", "or", "such", "that", "the",
    "their", "then", "there", "these", "they", "this", "to", "was", "will",
    "with", "you", "your", "i", "me", "my", "we", "our", "have", "has", "had"
}


class BaseSentimentModel(ABC):
    """Base class for all sentiment models"""
    
    def __init__(self):
        self.description = "Base sentiment model"
        self.version = "1.0.0"
    
    @abstractmethod
    def analyze(
        self,
        text: str,
        extract_keywords: bool = True,
        top_k_keywords: int = 5,
        **kwargs
    ) -> SentimentResult:
        """Analyze text sentiment"""
        pass
    
    def _extract_keywords(self, text: str, top_k: int = 5) -> List[str]:
        """Extract important keywords from text"""
        tokens = [
            t for t in re.split(r"[^a-zA-Z]+", (text or "").lower())
            if t and len(t) >= 3 and t not in STOP_WORDS
        ]
        counts = Counter(tokens)
        return [word for word, _ in counts.most_common(top_k)]
    
    def _detect_mental_health_flags(self, text: str) -> List[str]:
        """Detect mental health crisis indicators"""
        text_lower = text.lower()
        flags = []
        
        # Suicidal ideation keywords
        suicidal_keywords = [
            "suicide", "kill myself", "end my life", "want to die",
            "better off dead", "no reason to live", "end it all"
        ]
        if any(keyword in text_lower for keyword in suicidal_keywords):
            flags.append("suicidal_ideation")
        
        # Self-harm keywords
        self_harm_keywords = ["hurt myself", "self harm", "cut myself", "harm myself"]
        if any(keyword in text_lower for keyword in self_harm_keywords):
            flags.append("self_harm")
        
        # Severe depression keywords
        severe_depression_keywords = [
            "hopeless", "worthless", "no point", "give up",
            "can't go on", "nothing matters"
        ]
        if any(keyword in text_lower for keyword in severe_depression_keywords):
            flags.append("severe_depression")
        
        # Severe anxiety keywords
        severe_anxiety_keywords = [
            "panic attack", "can't breathe", "heart racing",
            "losing control", "going crazy"
        ]
        if any(keyword in text_lower for keyword in severe_anxiety_keywords):
            flags.append("severe_anxiety")
        
        return flags


class VADERModel(BaseSentimentModel):
    """VADER (Valence Aware Dictionary and sEntiment Reasoner) model"""
    
    def __init__(self):
        super().__init__()
        self.description = "VADER - Lexicon-based sentiment analysis optimized for social media"
        self.version = "1.0.0"
        self._analyzer = None
    
    def _get_analyzer(self):
        """Lazy load VADER analyzer"""
        if self._analyzer is None:
            from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
            self._analyzer = SentimentIntensityAnalyzer()
        return self._analyzer
    
    def analyze(
        self,
        text: str,
        extract_keywords: bool = True,
        top_k_keywords: int = 5,
        **kwargs
    ) -> SentimentResult:
        """Analyze text using VADER"""
        analyzer = self._get_analyzer()
        scores = analyzer.polarity_scores(text or "")
        
        compound = float(scores.get("compound", 0.0))
        
        # Determine label from compound score
        if compound >= 0.05:
            label = SentimentLabel.POSITIVE
        elif compound <= -0.05:
            label = SentimentLabel.NEGATIVE
        else:
            label = SentimentLabel.NEUTRAL
        
        # Calculate confidence and intensity
        intensity = abs(compound)
        confidence = min(intensity * 1.5, 1.0)  # Scale to 0-1
        
        # Extract keywords if requested
        keywords = self._extract_keywords(text, top_k_keywords) if extract_keywords else []
        
        # Detect mental health flags
        mental_health_flags = self._detect_mental_health_flags(text)
        
        return SentimentResult(
            text=text[:200],  # Truncate for storage
            label=label.value,
            confidence=confidence,
            intensity=intensity,
            compound_score=compound,
            keywords=keywords,
            model="vader",
            processing_time_ms=0.0,  # Will be set by analyzer
            timestamp=datetime.utcnow().isoformat(),
            scores={
                "positive": float(scores.get("pos", 0.0)),
                "negative": float(scores.get("neg", 0.0)),
                "neutral": float(scores.get("neu", 0.0)),
                "compound": compound
            },
            mental_health_flags=mental_health_flags if mental_health_flags else None
        )


class ClassicalModel(BaseSentimentModel):
    """Classical ML model (TF-IDF + Logistic Regression)"""
    
    def __init__(self):
        super().__init__()
        self.description = "Classical ML - TF-IDF + Logistic Regression"
        self.version = "1.0.0"
        self._model = None
        self._vectorizer = None
        self._loaded = False
    
    def _load_model(self):
        """Lazy load classical model"""
        if self._loaded:
            return
        
        try:
            import joblib
            from pathlib import Path
            
            base_path = Path(__file__).parent.parent / "models" / "sentiment_custom" / "artifacts" / "mental_health"
            model_path = base_path / "model.joblib"
            vectorizer_path = base_path / "vectorizer.joblib"
            
            if model_path.exists() and vectorizer_path.exists():
                self._model = joblib.load(model_path)
                self._vectorizer = joblib.load(vectorizer_path)
                self._loaded = True
            else:
                raise FileNotFoundError(f"Classical model files not found at {base_path}")
        except Exception as e:
            raise RuntimeError(f"Failed to load classical model: {e}")
    
    def analyze(
        self,
        text: str,
        extract_keywords: bool = True,
        top_k_keywords: int = 5,
        **kwargs
    ) -> SentimentResult:
        """Analyze text using classical ML model"""
        self._load_model()
        
        # Transform text
        X = self._vectorizer.transform([text])
        
        # Predict
        prediction = self._model.predict(X)[0]
        probabilities = self._model.predict_proba(X)[0]
        
        # Get label and confidence
        label = prediction
        confidence = float(max(probabilities))
        
        # Calculate compound score (-1 to 1)
        if label == "Positive":
            compound_score = confidence
        elif label == "Negative":
            compound_score = -confidence
        else:
            compound_score = 0.0
        
        intensity = abs(compound_score)
        
        # Extract keywords
        keywords = self._extract_keywords(text, top_k_keywords) if extract_keywords else []
        
        # Mental health flags
        mental_health_flags = self._detect_mental_health_flags(text)
        
        return SentimentResult(
            text=text[:200],
            label=label,
            confidence=confidence,
            intensity=intensity,
            compound_score=compound_score,
            keywords=keywords,
            model="classical",
            processing_time_ms=0.0,
            timestamp=datetime.utcnow().isoformat(),
            scores={
                "probabilities": {
                    label: float(prob) 
                    for label, prob in zip(self._model.classes_, probabilities)
                }
            },
            mental_health_flags=mental_health_flags if mental_health_flags else None
        )


class BiLSTMModel(BaseSentimentModel):
    """BiLSTM (Bidirectional LSTM) deep learning model"""
    
    def __init__(self):
        super().__init__()
        self.description = "BiLSTM - Bidirectional LSTM neural network"
        self.version = "1.0.0"
        self._model = None
        self._tokenizer = None
        self._label_encoder = None
        self._loaded = False
    
    def _load_model(self):
        """Lazy load BiLSTM model"""
        if self._loaded:
            return
        
        try:
            import joblib
            from pathlib import Path
            
            base_path = Path(__file__).parent.parent / "models" / "sentiment_custom" / "artifacts" / "mental_health_lstm"
            
            # Check if Keras model exists
            model_path = base_path / "model.keras"
            if not model_path.exists():
                model_path = base_path / "model.h5"
            
            tokenizer_path = base_path / "tokenizer.joblib"
            label_encoder_path = base_path / "label_encoder.joblib"
            
            if model_path.exists() and tokenizer_path.exists() and label_encoder_path.exists():
                from tensorflow import keras
                self._model = keras.models.load_model(str(model_path))
                self._tokenizer = joblib.load(tokenizer_path)
                self._label_encoder = joblib.load(label_encoder_path)
                self._loaded = True
            else:
                raise FileNotFoundError(f"BiLSTM model files not found at {base_path}")
        except Exception as e:
            raise RuntimeError(f"Failed to load BiLSTM model: {e}")
    
    def analyze(
        self,
        text: str,
        extract_keywords: bool = True,
        top_k_keywords: int = 5,
        **kwargs
    ) -> SentimentResult:
        """Analyze text using BiLSTM model"""
        self._load_model()
        
        from tensorflow.keras.preprocessing.sequence import pad_sequences
        
        # Tokenize and pad
        sequences = self._tokenizer.texts_to_sequences([text])
        max_len = kwargs.get('max_len', 100)
        X = pad_sequences(sequences, maxlen=max_len, padding='post', truncating='post')
        
        # Predict
        predictions = self._model.predict(X, verbose=0)[0]
        predicted_idx = int(predictions.argmax())
        confidence = float(predictions[predicted_idx])
        
        # Get label
        label = self._label_encoder.inverse_transform([predicted_idx])[0]
        
        # Calculate compound score
        if label == "Positive":
            compound_score = confidence
        elif label == "Negative":
            compound_score = -confidence
        else:
            compound_score = 0.0
        
        intensity = abs(compound_score)
        
        # Extract keywords
        keywords = self._extract_keywords(text, top_k_keywords) if extract_keywords else []
        
        # Mental health flags
        mental_health_flags = self._detect_mental_health_flags(text)
        
        return SentimentResult(
            text=text[:200],
            label=label,
            confidence=confidence,
            intensity=intensity,
            compound_score=compound_score,
            keywords=keywords,
            model="bilstm",
            processing_time_ms=0.0,
            timestamp=datetime.utcnow().isoformat(),
            scores={
                "probabilities": {
                    self._label_encoder.inverse_transform([i])[0]: float(predictions[i])
                    for i in range(len(predictions))
                }
            },
            mental_health_flags=mental_health_flags if mental_health_flags else None
        )


class EnsembleModel(BaseSentimentModel):
    """Ensemble model combining VADER, Classical, and BiLSTM"""
    
    def __init__(self, vader_model, classical_model, bilstm_model):
        super().__init__()
        self.description = "Ensemble - Weighted combination of VADER, Classical, and BiLSTM"
        self.version = "1.0.0"
        self.vader = vader_model
        self.classical = classical_model
        self.bilstm = bilstm_model
    
    def analyze(
        self,
        text: str,
        extract_keywords: bool = True,
        top_k_keywords: int = 5,
        weights: Optional[Dict[str, float]] = None,
        **kwargs
    ) -> SentimentResult:
        """Analyze text using ensemble of models"""
        # Default weights
        if weights is None:
            weights = {"vader": 0.4, "classical": 0.3, "bilstm": 0.3}
        
        # Get predictions from all models
        results = []
        available_models = []
        
        try:
            vader_result = self.vader.analyze(text, extract_keywords=False)
            results.append(("vader", vader_result))
            available_models.append("vader")
        except Exception:
            pass
        
        try:
            classical_result = self.classical.analyze(text, extract_keywords=False)
            results.append(("classical", classical_result))
            available_models.append("classical")
        except Exception:
            pass
        
        try:
            bilstm_result = self.bilstm.analyze(text, extract_keywords=False)
            results.append(("bilstm", bilstm_result))
            available_models.append("bilstm")
        except Exception:
            pass
        
        if not results:
            raise RuntimeError("No models available for ensemble prediction")
        
        # Normalize weights for available models
        total_weight = sum(weights.get(model, 0.0) for model in available_models)
        normalized_weights = {
            model: weights.get(model, 0.0) / total_weight
            for model in available_models
        }
        
        # Weighted voting for label
        label_scores = {}
        compound_sum = 0.0
        confidence_sum = 0.0
        
        for model_name, result in results:
            weight = normalized_weights[model_name]
            label_scores[result.label] = label_scores.get(result.label, 0.0) + weight
            compound_sum += result.compound_score * weight
            confidence_sum += result.confidence * weight
        
        # Get final label
        final_label = max(label_scores, key=label_scores.get)
        final_confidence = confidence_sum
        final_compound = compound_sum
        final_intensity = abs(final_compound)
        
        # Extract keywords
        keywords = self.vader._extract_keywords(text, top_k_keywords) if extract_keywords else []
        
        # Mental health flags
        mental_health_flags = self.vader._detect_mental_health_flags(text)
        
        return SentimentResult(
            text=text[:200],
            label=final_label,
            confidence=final_confidence,
            intensity=final_intensity,
            compound_score=final_compound,
            keywords=keywords,
            model="ensemble",
            processing_time_ms=0.0,
            timestamp=datetime.utcnow().isoformat(),
            scores={
                "label_votes": label_scores,
                "models_used": available_models,
                "weights": normalized_weights
            },
            mental_health_flags=mental_health_flags if mental_health_flags else None
        )
