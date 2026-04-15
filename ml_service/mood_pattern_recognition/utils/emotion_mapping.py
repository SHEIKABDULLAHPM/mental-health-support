"""
Emotion Mapping and Normalization Utilities
Maps various emotion taxonomies to unified mood states
"""

from typing import Dict, List, Tuple
import numpy as np

# Unified mood categories for the system
UNIFIED_MOODS = [
    "Happy",
    "Calm",
    "Sad",
    "Anxious",
    "Angry",
    "Surprised",
    "Neutral"
]

# FER2013/AffectNet emotion labels
FACE_EMOTIONS = {
    0: "angry",
    1: "disgust",
    2: "fear",
    3: "happy",
    4: "sad",
    5: "surprise",
    6: "neutral"
}

# GoEmotions text labels (27 emotions, simplified to top categories)
TEXT_EMOTIONS = [
    "admiration", "amusement", "anger", "annoyance", "approval", 
    "caring", "confusion", "curiosity", "desire", "disappointment",
    "disapproval", "disgust", "embarrassment", "excitement", "fear",
    "gratitude", "grief", "joy", "love", "nervousness",
    "optimism", "pride", "realization", "relief", "remorse",
    "sadness", "surprise", "neutral"
]

# Mapping from detailed emotions to unified moods
EMOTION_TO_MOOD_MAP = {
    # Happy cluster
    "happy": "Happy",
    "joy": "Happy",
    "amusement": "Happy",
    "excitement": "Happy",
    "admiration": "Happy",
    "gratitude": "Happy",
    "love": "Happy",
    "optimism": "Happy",
    "pride": "Happy",
    "relief": "Happy",
    
    # Calm cluster
    "neutral": "Neutral",
    "approval": "Calm",
    "caring": "Calm",
    "realization": "Calm",
    
    # Sad cluster
    "sad": "Sad",
    "sadness": "Sad",
    "disappointment": "Sad",
    "grief": "Sad",
    "remorse": "Sad",
    "embarrassment": "Sad",
    
    # Anxious cluster
    "fear": "Anxious",
    "nervousness": "Anxious",
    "confusion": "Anxious",
    "annoyance": "Anxious",
    
    # Angry cluster
    "angry": "Angry",
    "anger": "Angry",
    "disgust": "Angry",
    "disapproval": "Angry",
    
    # Surprised cluster
    "surprise": "Surprised",
    "curiosity": "Surprised",
    "desire": "Surprised"
}

# Mood intensity weights
MOOD_INTENSITY_WEIGHTS = {
    "Happy": 1.0,
    "Calm": 0.5,
    "Neutral": 0.3,
    "Surprised": 0.6,
    "Anxious": -0.5,
    "Sad": -0.7,
    "Angry": -0.9
}


def map_face_emotion_to_mood(emotion_label: str) -> str:
    """Map face emotion to unified mood"""
    return EMOTION_TO_MOOD_MAP.get(emotion_label.lower(), "Neutral")


def map_text_emotion_to_mood(emotion_label: str) -> str:
    """Map text emotion to unified mood"""
    return EMOTION_TO_MOOD_MAP.get(emotion_label.lower(), "Neutral")


def normalize_emotion_probs(
    face_probs: Dict[str, float],
    text_probs: Dict[str, float]
) -> Tuple[Dict[str, float], Dict[str, float]]:
    """
    Normalize emotion probabilities to unified mood space
    
    Args:
        face_probs: {emotion: probability} from face model
        text_probs: {emotion: probability} from text model
        
    Returns:
        Tuple of (normalized_face_moods, normalized_text_moods)
    """
    face_moods = {}
    text_moods = {}
    
    # Aggregate face emotions to moods
    for emotion, prob in face_probs.items():
        mood = map_face_emotion_to_mood(emotion)
        face_moods[mood] = face_moods.get(mood, 0.0) + prob
    
    # Aggregate text emotions to moods
    for emotion, prob in text_probs.items():
        mood = map_text_emotion_to_mood(emotion)
        text_moods[mood] = text_moods.get(mood, 0.0) + prob
    
    # Normalize to sum = 1.0
    face_total = sum(face_moods.values())
    text_total = sum(text_moods.values())
    
    if face_total > 0:
        face_moods = {k: v/face_total for k, v in face_moods.items()}
    if text_total > 0:
        text_moods = {k: v/text_total for k, v in text_moods.items()}
    
    return face_moods, text_moods


def get_mood_intensity(mood: str) -> float:
    """Get emotional valence intensity for a mood (-1 to 1)"""
    return MOOD_INTENSITY_WEIGHTS.get(mood, 0.0)


def calculate_overall_sentiment(mood_probs: Dict[str, float]) -> float:
    """
    Calculate overall sentiment score from mood probabilities
    
    Returns:
        Float between -1 (very negative) and 1 (very positive)
    """
    sentiment = 0.0
    for mood, prob in mood_probs.items():
        sentiment += get_mood_intensity(mood) * prob
    return np.clip(sentiment, -1.0, 1.0)


def get_emotion_color(mood: str) -> str:
    """Get color code for mood visualization"""
    colors = {
        "Happy": "#FFD700",      # Gold
        "Calm": "#87CEEB",       # Sky Blue
        "Neutral": "#D3D3D3",    # Light Gray
        "Surprised": "#FF69B4",  # Hot Pink
        "Anxious": "#FFA500",    # Orange
        "Sad": "#4169E1",        # Royal Blue
        "Angry": "#DC143C"       # Crimson
    }
    return colors.get(mood, "#808080")


def get_emotion_emoji(mood: str) -> str:
    """Get emoji representation for mood"""
    emojis = {
        "Happy": "😊",
        "Calm": "😌",
        "Neutral": "😐",
        "Surprised": "😮",
        "Anxious": "😰",
        "Sad": "😢",
        "Angry": "😠"
    }
    return emojis.get(mood, "🤔")
