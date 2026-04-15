"""
Comprehensive Sentiment Analysis API Routes
Provides endpoints for VADER, Classical, BiLSTM, and Ensemble models
"""
from __future__ import annotations

import logging
import sys
import os
from flask import Blueprint, jsonify, request
from typing import Optional

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.sentiment_service import (
    get_sentiment_service,
    SentimentModel,
    SentimentResult
)

logger = logging.getLogger(__name__)

sentiment_advanced_bp = Blueprint("sentiment_advanced", __name__, url_prefix="/api/sentiment/v2")


@sentiment_advanced_bp.route("/health", methods=["GET"])
def health():
    """Check sentiment service health and model availability"""
    try:
        service = get_sentiment_service()
        info = service.get_model_info()
        
        return jsonify({
            "status": "success",
            "data": {
                "service": "Sentiment Analysis Service",
                "version": "2.0",
                "models_available": {
                    "vader": info["vader"]["available"],
                    "classical": info["classical"]["available"],
                    "bilstm": info["bilstm"]["available"],
                    "ensemble": info["ensemble"]["available"]
                },
                "models": info
            }
        }), 200
    except Exception as e:
        logger.exception("Health check failed")
        return jsonify({"status": "error", "error": str(e)}), 500


@sentiment_advanced_bp.route("/analyze", methods=["POST"])
def analyze():
    """
    Analyze text sentiment using specified model
    
    Request body:
    {
        "text": "I'm feeling great today!",
        "model": "vader",  // vader | classical | bilstm | ensemble
        "extract_keywords": true,  // Optional, for VADER
        "ensemble_weights": {"vader": 0.4, "classical": 0.3, "bilstm": 0.3}  // Optional, for ensemble
    }
    
    Response:
    {
        "status": "success",
        "data": {
            "text": "I'm feeling great today!",
            "model": "vader",
            "label": "Positive",
            "confidence": 0.85,
            "intensity": 0.85,
            "compound_score": 0.85,
            "keywords": ["feeling", "great", "today"],
            "processing_time_ms": 5.2,
            "timestamp": "2025-10-24T12:00:00Z"
        }
    }
    """
    try:
        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()
        
        if not text:
            return jsonify({"status": "error", "error": "Text is required"}), 400
        
        # Parse model
        model_str = (data.get("model") or "vader").lower()
        try:
            model = SentimentModel(model_str)
        except ValueError:
            return jsonify({
                "status": "error",
                "error": f"Invalid model: {model_str}. Choose from: vader, classical, bilstm, ensemble"
            }), 400
        
        # Parse options
        extract_keywords = bool(data.get("extract_keywords", True))
        ensemble_weights = data.get("ensemble_weights")
        
        # Get service and analyze
        service = get_sentiment_service()
        result = service.analyze(
            text=text,
            model=model,
            extract_keywords=extract_keywords,
            ensemble_weights=ensemble_weights
        )
        
        logger.info(
            "sentiment.analyze model=%s len=%d label=%s confidence=%.3f",
            model.value, len(text), result.label, result.confidence
        )
        
        return jsonify({"status": "success", "data": result.to_dict()}), 200
        
    except RuntimeError as e:
        logger.error(f"Model error: {e}")
        return jsonify({"status": "error", "error": str(e)}), 503
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({"status": "error", "error": str(e)}), 400
    except Exception as e:
        logger.exception("Sentiment analysis failed")
        return jsonify({"status": "error", "error": str(e)}), 500


@sentiment_advanced_bp.route("/analyze/batch", methods=["POST"])
def analyze_batch():
    """
    Analyze multiple texts in batch
    
    Request body:
    {
        "texts": ["Text 1", "Text 2", "Text 3"],
        "model": "vader"
    }
    
    Response:
    {
        "status": "success",
        "data": [
            { ... result 1 ... },
            { ... result 2 ... },
            { ... result 3 ... }
        ]
    }
    """
    try:
        data = request.get_json(silent=True) or {}
        texts = data.get("texts") or []
        
        if not isinstance(texts, list) or not texts:
            return jsonify({"status": "error", "error": "'texts' must be a non-empty list"}), 400
        
        # Parse model
        model_str = (data.get("model") or "vader").lower()
        try:
            model = SentimentModel(model_str)
        except ValueError:
            return jsonify({
                "status": "error",
                "error": f"Invalid model: {model_str}"
            }), 400
        
        # Analyze batch
        service = get_sentiment_service()
        results = service.analyze_batch(texts, model=model)
        
        logger.info("sentiment.analyze_batch model=%s count=%d", model.value, len(texts))
        
        return jsonify({
            "status": "success",
            "data": [r.to_dict() for r in results]
        }), 200
        
    except Exception as e:
        logger.exception("Batch analysis failed")
        return jsonify({"status": "error", "error": str(e)}), 500


@sentiment_advanced_bp.route("/models", methods=["GET"])
def get_models():
    """
    Get information about all available models
    
    Query params:
    - model: Optional, specific model to get info for
    
    Response:
    {
        "status": "success",
        "data": {
            "vader": { ... },
            "classical": { ... },
            "bilstm": { ... },
            "ensemble": { ... }
        }
    }
    """
    try:
        model_param = request.args.get("model")
        model = None
        
        if model_param:
            try:
                model = SentimentModel(model_param.lower())
            except ValueError:
                return jsonify({
                    "status": "error",
                    "error": f"Invalid model: {model_param}"
                }), 400
        
        service = get_sentiment_service()
        info = service.get_model_info(model=model)
        
        return jsonify({"status": "success", "data": info}), 200
        
    except Exception as e:
        logger.exception("Get models failed")
        return jsonify({"status": "error", "error": str(e)}), 500


@sentiment_advanced_bp.route("/recommend", methods=["POST"])
def recommend_model():
    """
    Get recommended model for a specific use case
    
    Request body:
    {
        "use_case": "chatbot"  // chatbot | mood_checkin | journal | reflection_wall
    }
    
    Response:
    {
        "status": "success",
        "data": {
            "use_case": "chatbot",
            "recommended_model": "vader",
            "reason": "Lightweight, real-time sentiment analysis",
            "alternatives": ["classical", "ensemble"]
        }
    }
    """
    try:
        data = request.get_json(silent=True) or {}
        use_case = (data.get("use_case") or "").lower()
        
        if not use_case:
            return jsonify({"status": "error", "error": "use_case is required"}), 400
        
        service = get_sentiment_service()
        recommended = service.recommend_model(use_case)
        
        # Get model info
        info = service.get_model_info(recommended)
        model_info = info[recommended.value]
        
        # Determine alternatives
        all_models = ["vader", "classical", "bilstm", "ensemble"]
        alternatives = [m for m in all_models if m != recommended.value]
        
        return jsonify({
            "status": "success",
            "data": {
                "use_case": use_case,
                "recommended_model": recommended.value,
                "reason": model_info.get("description"),
                "speed": model_info.get("speed"),
                "alternatives": alternatives,
                "model_info": model_info
            }
        }), 200
        
    except Exception as e:
        logger.exception("Recommend model failed")
        return jsonify({"status": "error", "error": str(e)}), 500


@sentiment_advanced_bp.route("/compare", methods=["POST"])
def compare_models():
    """
    Compare predictions from multiple models on the same text
    
    Request body:
    {
        "text": "I'm feeling great!",
        "models": ["vader", "classical", "bilstm"]  // Optional, default: all available
    }
    
    Response:
    {
        "status": "success",
        "data": {
            "text": "I'm feeling great!",
            "predictions": {
                "vader": { ... },
                "classical": { ... },
                "bilstm": { ... }
            },
            "comparison": {
                "agreement": "high",  // high | medium | low
                "consensus_label": "Positive",
                "confidence_range": [0.75, 0.92]
            }
        }
    }
    """
    try:
        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()
        
        if not text:
            return jsonify({"status": "error", "error": "Text is required"}), 400
        
        # Parse models to compare
        models_to_compare = data.get("models") or ["vader", "classical", "bilstm"]
        
        service = get_sentiment_service()
        predictions = {}
        
        for model_str in models_to_compare:
            try:
                model = SentimentModel(model_str.lower())
                result = service.analyze(text, model=model)
                predictions[model_str] = result.to_dict()
            except (ValueError, RuntimeError) as e:
                logger.warning(f"Skipping model {model_str}: {e}")
        
        if not predictions:
            return jsonify({
                "status": "error",
                "error": "No valid models could be used"
            }), 400
        
        # Analyze agreement
        labels = [p["label"] for p in predictions.values()]
        unique_labels = set(labels)
        
        if len(unique_labels) == 1:
            agreement = "high"
        elif len(unique_labels) == len(labels):
            agreement = "low"
        else:
            agreement = "medium"
        
        # Find consensus (most common label)
        from collections import Counter
        label_counts = Counter(labels)
        consensus_label = label_counts.most_common(1)[0][0]
        
        # Confidence range
        confidences = [p["confidence"] for p in predictions.values()]
        confidence_range = [min(confidences), max(confidences)]
        
        return jsonify({
            "status": "success",
            "data": {
                "text": text[:100] + "..." if len(text) > 100 else text,
                "predictions": predictions,
                "comparison": {
                    "agreement": agreement,
                    "consensus_label": consensus_label,
                    "confidence_range": confidence_range,
                    "models_compared": list(predictions.keys())
                }
            }
        }), 200
        
    except Exception as e:
        logger.exception("Compare models failed")
        return jsonify({"status": "error", "error": str(e)}), 500


# Legacy compatibility endpoint (redirects to new VADER endpoint)
@sentiment_advanced_bp.route("/vader", methods=["POST"])
def vader_legacy():
    """Legacy VADER endpoint for backward compatibility"""
    try:
        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()
        
        if not text:
            return jsonify({"status": "error", "error": "Text is required"}), 400
        
        service = get_sentiment_service()
        result = service.analyze(text, model=SentimentModel.VADER)
        
        return jsonify({"status": "success", "data": result.to_dict()}), 200
    except Exception as e:
        logger.exception("VADER analysis failed")
        return jsonify({"status": "error", "error": str(e)}), 500


@sentiment_advanced_bp.route("/classical", methods=["POST"])
def classical_endpoint():
    """Classical ML model endpoint"""
    try:
        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()
        
        if not text:
            return jsonify({"status": "error", "error": "Text is required"}), 400
        
        service = get_sentiment_service()
        result = service.analyze(text, model=SentimentModel.CLASSICAL)
        
        return jsonify({"status": "success", "data": result.to_dict()}), 200
    except RuntimeError as e:
        return jsonify({"status": "error", "error": str(e)}), 503
    except Exception as e:
        logger.exception("Classical analysis failed")
        return jsonify({"status": "error", "error": str(e)}), 500


@sentiment_advanced_bp.route("/bilstm", methods=["POST"])
def bilstm_endpoint():
    """BiLSTM deep learning model endpoint"""
    try:
        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()
        
        if not text:
            return jsonify({"status": "error", "error": "Text is required"}), 400
        
        service = get_sentiment_service()
        result = service.analyze(text, model=SentimentModel.BILSTM)
        
        return jsonify({"status": "success", "data": result.to_dict()}), 200
    except RuntimeError as e:
        return jsonify({"status": "error", "error": str(e)}), 503
    except Exception as e:
        logger.exception("BiLSTM analysis failed")
        return jsonify({"status": "error", "error": str(e)}), 500


@sentiment_advanced_bp.route("/ensemble", methods=["POST"])
def ensemble_endpoint():
    """Ensemble model endpoint"""
    try:
        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()
        
        if not text:
            return jsonify({"status": "error", "error": "Text is required"}), 400
        
        ensemble_weights = data.get("weights")
        
        service = get_sentiment_service()
        result = service.analyze(
            text, 
            model=SentimentModel.ENSEMBLE,
            ensemble_weights=ensemble_weights
        )
        
        return jsonify({"status": "success", "data": result.to_dict()}), 200
    except Exception as e:
        logger.exception("Ensemble analysis failed")
        return jsonify({"status": "error", "error": str(e)}), 500
