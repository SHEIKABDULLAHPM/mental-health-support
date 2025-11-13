"""
FastAPI Service for Mood Pattern Recognition
Provides endpoints for face/text emotion detection, fusion, and trend prediction
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
import numpy as np
import json
import os

from ..models.face_emotion_model import FaceEmotionDetector
from ..models.text_emotion_model import TextEmotionAnalyzer
from ..models.mood_fusion_model import MoodFusionModel
from ..models.mood_trend_predictor import MoodTrendPredictor
from ..utils.visualization import (
    create_mood_trend_chart, create_emotion_pie_chart,
    create_comparison_chart, generate_trend_summary
)
from ..utils.emotion_mapping import get_emotion_emoji, calculate_overall_sentiment


# Initialize FastAPI app
app = FastAPI(
    title="Mood Pattern Recognition API",
    description="Dual-modality emotion detection and mood prediction system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models (lazy loading)
face_detector = None
text_analyzer = None
fusion_model = None
trend_predictor = None

# User data storage (in production, use database)
USER_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'user_data')
os.makedirs(USER_DATA_DIR, exist_ok=True)


# ============== Request/Response Models ==============

class EmotionResponse(BaseModel):
    emotions: Dict[str, float]
    dominant_emotion: str
    confidence: float
    mood: Dict[str, float]


class TextEmotionRequest(BaseModel):
    text: str = Field(..., description="Journal entry or text to analyze")
    user_id: Optional[str] = Field(None, description="User identifier")


class FusionRequest(BaseModel):
    text: Optional[str] = None
    user_id: Optional[str] = None
    face_confidence: Optional[float] = None
    text_confidence: Optional[float] = None


class MoodEntry(BaseModel):
    timestamp: str
    mood: str
    mood_dist: Dict[str, float]
    sentiment: float


class TrendRequest(BaseModel):
    user_id: str
    days_ahead: int = Field(7, ge=1, le=30)


class TrendResponse(BaseModel):
    predictions: List[float]
    dates: List[str]
    overall_trend: str
    average_predicted_sentiment: float
    chart_data: Optional[str] = None


# ============== Helper Functions ==============

def get_face_detector():
    global face_detector
    if face_detector is None:
        face_detector = FaceEmotionDetector(use_existing=True)
    return face_detector


def get_text_analyzer():
    global text_analyzer
    if text_analyzer is None:
        text_analyzer = TextEmotionAnalyzer(model_type="bert", use_pretrained=True)
    return text_analyzer


def get_fusion_model():
    global fusion_model
    if fusion_model is None:
        fusion_model = MoodFusionModel(fusion_method="weighted", face_weight=0.5, text_weight=0.5)
    return fusion_model


def get_trend_predictor():
    global trend_predictor
    if trend_predictor is None:
        trend_predictor = MoodTrendPredictor()
    return trend_predictor


def load_user_history(user_id: str) -> List[Dict]:
    """Load user's mood history"""
    user_file = os.path.join(USER_DATA_DIR, f"{user_id}_mood_history.json")
    if os.path.exists(user_file):
        with open(user_file, 'r') as f:
            return json.load(f)
    return []


def save_mood_entry(user_id: str, mood_entry: Dict):
    """Save a mood entry for user"""
    history = load_user_history(user_id)
    history.append(mood_entry)
    
    # Keep last 90 days
    history = history[-90:]
    
    user_file = os.path.join(USER_DATA_DIR, f"{user_id}_mood_history.json")
    with open(user_file, 'w') as f:
        json.dump(history, f, indent=2)


# ============== API Endpoints ==============

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "service": "Mood Pattern Recognition API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "face_analysis": "/analyze/face",
            "text_analysis": "/analyze/text",
            "fusion_analysis": "/analyze/fusion",
            "trend_prediction": "/trend/predict",
            "trend_visualization": "/trend/visualize"
        }
    }


@app.post("/analyze/face", response_model=EmotionResponse)
async def analyze_face(file: UploadFile = File(...)):
    """
    Analyze facial expression from uploaded image
    
    - **file**: Image file containing a face
    
    Returns emotion probabilities and dominant emotion
    """
    try:
        # Read image bytes
        image_bytes = await file.read()
        
        # Get detector
        detector = get_face_detector()
        
        # Predict emotion
        emotion_probs = detector.predict_from_bytes(image_bytes)
        dominant_emotion, confidence = detector.get_dominant_emotion(emotion_probs)
        mood_probs = detector.get_mood_from_emotion(emotion_probs)
        
        return EmotionResponse(
            emotions=emotion_probs,
            dominant_emotion=dominant_emotion,
            confidence=confidence,
            mood=mood_probs
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face analysis failed: {str(e)}")


@app.post("/analyze/text")
async def analyze_text(request: TextEmotionRequest):
    """
    Analyze emotion from text (journal entry)
    
    - **text**: Text content to analyze
    - **user_id**: Optional user identifier
    
    Returns emotion analysis with sentiment score
    """
    try:
        analyzer = get_text_analyzer()
        
        # Analyze text
        result = analyzer.analyze_journal_entry(request.text)
        
        # Save to user history if user_id provided
        if request.user_id:
            mood_entry = {
                "timestamp": datetime.now().isoformat(),
                "mood": result['mood'],
                "mood_dist": result['mood'],
                "sentiment": result['sentiment_score'],
                "text_snippet": request.text[:100]  # Store snippet
            }
            save_mood_entry(request.user_id, mood_entry)
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text analysis failed: {str(e)}")


@app.post("/analyze/fusion")
async def analyze_fusion(
    text: Optional[str] = Body(None),
    user_id: Optional[str] = Body(None),
    file: Optional[UploadFile] = File(None)
):
    """
    Multimodal fusion analysis (face + text)
    
    - **file**: Optional image file
    - **text**: Optional text content
    - **user_id**: Optional user identifier
    
    At least one modality (face or text) must be provided
    """
    try:
        face_emotions = None
        text_emotions = None
        face_conf = None
        text_conf = None
        
        # Analyze face if provided
        if file:
            image_bytes = await file.read()
            detector = get_face_detector()
            face_emotions = detector.predict_from_bytes(image_bytes)
            _, face_conf = detector.get_dominant_emotion(face_emotions)
        
        # Analyze text if provided
        if text:
            analyzer = get_text_analyzer()
            text_result = analyzer.analyze_journal_entry(text)
            text_emotions = text_result['emotions']
            text_conf = text_result['confidence']
        
        if face_emotions is None and text_emotions is None:
            raise HTTPException(status_code=400, detail="At least one modality (face or text) required")
        
        # Fuse emotions
        fusion = get_fusion_model()
        result = fusion.analyze_multimodal(
            face_emotions=face_emotions,
            text_emotions=text_emotions,
            face_confidence=face_conf,
            text_confidence=text_conf
        )
        
        # Save to user history
        if user_id:
            mood_entry = {
                "timestamp": datetime.now().isoformat(),
                "mood": result['mood'],
                "mood_dist": result['mood_distribution'],
                "sentiment": result['sentiment_score']
            }
            save_mood_entry(user_id, mood_entry)
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fusion analysis failed: {str(e)}")


@app.post("/trend/predict", response_model=TrendResponse)
async def predict_trend(request: TrendRequest):
    """
    Predict mood trend for future days
    
    - **user_id**: User identifier
    - **days_ahead**: Number of days to predict (1-30)
    
    Returns predicted sentiment scores and overall trend
    """
    try:
        # Load user history
        history = load_user_history(request.user_id)
        
        if len(history) < 7:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient history. Need at least 7 entries, found {len(history)}"
            )
        
        # Get predictor
        predictor = get_trend_predictor()
        
        # Predict trend
        prediction = predictor.predict_trend(history, days_ahead=request.days_ahead)
        
        # Generate chart
        chart_data = create_mood_trend_chart(
            dates=[h['timestamp'] for h in history[-30:]],
            moods=[h['mood'] for h in history[-30:]],
            sentiment_scores=[h['sentiment'] for h in history[-30:]],
            predictions=prediction['predictions']
        )
        
        return TrendResponse(
            predictions=prediction['predictions'],
            dates=prediction['dates'],
            overall_trend=prediction['overall_trend'],
            average_predicted_sentiment=prediction['average_predicted_sentiment'],
            chart_data=chart_data
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trend prediction failed: {str(e)}")


@app.get("/trend/visualize/{user_id}")
async def visualize_trend(user_id: str, days: int = 30):
    """
    Get visualization data for user's mood trends
    
    - **user_id**: User identifier
    - **days**: Number of days to visualize
    
    Returns chart data and statistics
    """
    try:
        history = load_user_history(user_id)
        
        if len(history) == 0:
            return {
                "message": "No mood history found",
                "summary": None,
                "chart": None
            }
        
        # Get recent history
        recent = history[-days:]
        
        # Generate summary
        summary = generate_trend_summary(recent, days=days)
        
        # Generate chart
        chart = create_mood_trend_chart(
            dates=[h['timestamp'] for h in recent],
            moods=[h['mood'] for h in recent],
            sentiment_scores=[h['sentiment'] for h in recent]
        )
        
        return {
            "summary": summary,
            "chart": chart,
            "total_entries": len(recent)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Visualization failed: {str(e)}")


@app.get("/user/{user_id}/stats")
async def get_user_stats(user_id: str):
    """
    Get comprehensive mood statistics for a user
    
    - **user_id**: User identifier
    
    Returns mood patterns, trends, and insights
    """
    try:
        history = load_user_history(user_id)
        
        if len(history) == 0:
            return {"message": "No data available"}
        
        # Analyze patterns
        predictor = get_trend_predictor()
        patterns = predictor.analyze_patterns(history)
        
        # Recent summary
        summary = generate_trend_summary(history, days=7)
        
        return {
            "total_entries": len(history),
            "date_range": {
                "first": history[0]['timestamp'],
                "last": history[-1]['timestamp']
            },
            "patterns": patterns,
            "recent_summary": summary,
            "current_mood": history[-1]['mood'] if history else None
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats retrieval failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": {
            "face_detector": face_detector is not None,
            "text_analyzer": text_analyzer is not None,
            "fusion_model": fusion_model is not None,
            "trend_predictor": trend_predictor is not None
        }
    }


# Run with: uvicorn mood_pattern_recognition.api.mood_service:app --reload --port 8002
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
