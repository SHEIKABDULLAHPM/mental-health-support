# 🧠 Mood Pattern Recognition System

A production-ready, dual-modality (Face + Text) emotion detection and mood prediction system for mental health applications.

## 📋 Overview

This system provides comprehensive mood pattern analysis by combining:
- **Face Emotion Recognition**: CNN-based facial expression analysis
- **Text Emotion Analysis**: BERT/RoBERTa-based sentiment detection from journal entries
- **Multimodal Fusion**: Intelligent combination of face and text emotions
- **Trend Prediction**: LSTM-based time-series forecasting of mood patterns

## 🏗️ Architecture

```
mood_pattern_recognition/
├── api/                    # FastAPI service endpoints
│   └── mood_service.py
├── datasets/              # Data processing utilities
│   ├── fer2013/          # Facial emotion dataset
│   ├── goemotions/       # Text emotion dataset
│   └── preprocess.py
├── models/               # ML models
│   ├── face_emotion_model.py      # CNN for face emotion
│   ├── text_emotion_model.py      # BERT for text emotion
│   ├── mood_fusion_model.py       # Multimodal fusion
│   └── mood_trend_predictor.py    # LSTM trend prediction
├── training/             # Training scripts
│   ├── train_face_model.py
│   └── train_text_model.py
├── utils/                # Utilities
│   ├── emotion_mapping.py         # Emotion taxonomies
│   ├── visualization.py           # Chart generation
│   └── metrics.py                 # Evaluation metrics
├── saved_models/         # Trained model checkpoints
└── user_data/           # User mood history (JSON)
```

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
pip install torch torchvision tensorflow transformers
pip install fastapi uvicorn opencv-python pillow
pip install pandas numpy matplotlib plotly seaborn scikit-learn

# Or install all at once
pip install -r requirements.txt
```

### Download Datasets (Optional - for training)

```bash
# Download and prepare datasets
python -m mood_pattern_recognition.datasets.preprocess --download-goemotions

# Or create sample data for testing
python -m mood_pattern_recognition.datasets.preprocess --create-samples
```

### Start API Service

```bash
# Start the mood pattern recognition service
uvicorn mood_pattern_recognition.api.mood_service:app --reload --port 8002
```

Visit `http://localhost:8002/docs` for interactive API documentation.

## 📡 API Endpoints

### 1. Face Emotion Analysis
```http
POST /analyze/face
Content-Type: multipart/form-data

{
  "file": <image_file>
}
```

**Response:**
```json
{
  "emotions": {
    "happy": 0.75,
    "sad": 0.10,
    "neutral": 0.15
  },
  "dominant_emotion": "happy",
  "confidence": 0.75,
  "mood": {
    "Happy": 0.75,
    "Sad": 0.10,
    "Neutral": 0.15
  }
}
```

### 2. Text Emotion Analysis
```http
POST /analyze/text
Content-Type: application/json

{
  "text": "I'm feeling great today! Everything is going well.",
  "user_id": "user123"
}
```

**Response:**
```json
{
  "text": "I'm feeling great today!...",
  "emotions": {
    "joy": 0.85,
    "neutral": 0.10,
    "sadness": 0.05
  },
  "dominant_emotion": "joy",
  "confidence": 0.85,
  "mood": {
    "Happy": 0.85,
    "Neutral": 0.10,
    "Sad": 0.05
  },
  "sentiment_score": 0.78,
  "word_count": 10
}
```

### 3. Multimodal Fusion
```http
POST /analyze/fusion
Content-Type: multipart/form-data

{
  "file": <image_file>,
  "text": "Feeling overwhelmed today",
  "user_id": "user123"
}
```

**Response:**
```json
{
  "mood": "Anxious",
  "confidence": 0.67,
  "mood_distribution": {
    "Anxious": 0.67,
    "Sad": 0.20,
    "Neutral": 0.13
  },
  "sentiment_score": -0.45,
  "trend": "Negative",
  "emoji": "😰",
  "modalities_used": ["face", "text"],
  "suggestion_ready": true
}
```

### 4. Trend Prediction
```http
POST /trend/predict
Content-Type: application/json

{
  "user_id": "user123",
  "days_ahead": 7
}
```

**Response:**
```json
{
  "predictions": [0.2, 0.3, 0.35, 0.4, 0.45, 0.5, 0.52],
  "dates": ["2025-10-27", "2025-10-28", ...],
  "overall_trend": "Improving",
  "average_predicted_sentiment": 0.39,
  "chart_data": "<plotly_json>"
}
```

### 5. Trend Visualization
```http
GET /trend/visualize/{user_id}?days=30
```

Returns interactive Plotly charts and mood statistics.

## 🎯 Usage Examples

### Python Client

```python
import requests
from pathlib import Path

API_BASE = "http://localhost:8002"

# Analyze face emotion
def analyze_face(image_path: str):
    with open(image_path, 'rb') as f:
        response = requests.post(
            f"{API_BASE}/analyze/face",
            files={"file": f}
        )
    return response.json()

# Analyze text emotion
def analyze_text(text: str, user_id: str):
    response = requests.post(
        f"{API_BASE}/analyze/text",
        json={"text": text, "user_id": user_id}
    )
    return response.json()

# Multimodal analysis
def analyze_multimodal(image_path: str, text: str, user_id: str):
    with open(image_path, 'rb') as f:
        response = requests.post(
            f"{API_BASE}/analyze/fusion",
            files={"file": f},
            data={"text": text, "user_id": user_id}
        )
    return response.json()

# Predict mood trend
def predict_trend(user_id: str, days: int = 7):
    response = requests.post(
        f"{API_BASE}/trend/predict",
        json={"user_id": user_id, "days_ahead": days}
    )
    return response.json()

# Example usage
result = analyze_text("I'm feeling amazing today!", "user123")
print(f"Mood: {result['mood']}")
print(f"Sentiment: {result['sentiment_score']}")
```

### JavaScript/React Client

```javascript
// Add to project/src/services/api.js

const MOOD_API_BASE = 'http://localhost:8002';

export const analyzeFaceEmotion = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  const response = await fetch(`${MOOD_API_BASE}/analyze/face`, {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};

export const analyzeTextEmotion = async (text, userId) => {
  const response = await fetch(`${MOOD_API_BASE}/analyze/text`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ text, user_id: userId })
  });
  
  return response.json();
};

export const analyzeFusion = async (imageFile, text, userId) => {
  const formData = new FormData();
  if (imageFile) formData.append('file', imageFile);
  if (text) formData.append('text', text);
  if (userId) formData.append('user_id', userId);
  
  const response = await fetch(`${MOOD_API_BASE}/analyze/fusion`, {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};

export const predictMoodTrend = async (userId, daysAhead = 7) => {
  const response = await fetch(`${MOOD_API_BASE}/trend/predict`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ user_id: userId, days_ahead: daysAhead })
  });
  
  return response.json();
};

export const getMoodVisualization = async (userId, days = 30) => {
  const response = await fetch(
    `${MOOD_API_BASE}/trend/visualize/${userId}?days=${days}`
  );
  
  return response.json();
};
```

## 🎓 Training Models

### Train Face Emotion Model

```bash
# Download FER2013 dataset first (requires Kaggle API)
python -m mood_pattern_recognition.datasets.preprocess --download-fer2013

# Train model
python -m mood_pattern_recognition.training.train_face_model \
  --data-dir ./mood_pattern_recognition/datasets/fer2013 \
  --output-dir ./mood_pattern_recognition/saved_models/face \
  --epochs 50 \
  --batch-size 64
```

### Train Text Emotion Model

```bash
# Download GoEmotions dataset
python -m mood_pattern_recognition.datasets.preprocess --download-goemotions

# Train model
python -m mood_pattern_recognition.training.train_text_model \
  --data-dir ./mood_pattern_recognition/datasets/goemotions \
  --output-dir ./mood_pattern_recognition/saved_models/text \
  --model-name distilbert-base-uncased \
  --epochs 3 \
  --batch-size 16
```

## 📊 Model Performance

### Face Emotion Recognition
- **Dataset**: FER2013 (35,887 images)
- **Architecture**: Custom CNN (4.2M parameters)
- **Accuracy**: ~65-70% (7 emotions)
- **Inference Time**: ~50ms per image

### Text Emotion Analysis
- **Dataset**: GoEmotions (58k texts)
- **Architecture**: DistilBERT
- **F1-Score**: ~0.72 (macro)
- **Inference Time**: ~100ms per text

### Trend Prediction
- **Algorithm**: LSTM (2 layers, 128 hidden)
- **MAE**: ~0.15 (sentiment scale -1 to 1)
- **Prediction Horizon**: 7-30 days

## 🔧 Configuration

### Fusion Weights

Adjust multimodal fusion in `mood_fusion_model.py`:

```python
fusion_model = MoodFusionModel(
    fusion_method="weighted",  # or "adaptive", "neural"
    face_weight=0.5,  # Adjust based on confidence in face detection
    text_weight=0.5   # Adjust based on text quality
)
```

### Emotion Mapping

Customize emotion categories in `utils/emotion_mapping.py`:

```python
UNIFIED_MOODS = [
    "Happy", "Calm", "Sad", "Anxious",
    "Angry", "Surprised", "Neutral"
]
```

## 🎨 Frontend Integration

### MoodCheckin Page

```jsx
// project/src/pages/MoodCheckin.jsx
import { analyzeFusion } from '../services/api';

const handleMoodCheckin = async (imageFile, journalText) => {
  const result = await analyzeFusion(imageFile, journalText, userId);
  
  setMood(result.mood);
  setSentiment(result.sentiment_score);
  setEmoji(result.emoji);
};
```

### Home Dashboard

```jsx
// project/src/pages/Home.jsx
import { getMoodVisualization } from '../services/api';

useEffect(() => {
  const loadTrends = async () => {
    const data = await getMoodVisualization(userId, 30);
    setChartData(JSON.parse(data.chart));
    setStats(data.summary);
  };
  loadTrends();
}, [userId]);
```

### Journal Page

```jsx
// project/src/pages/Journal.jsx
import { analyzeTextEmotion } from '../services/api';

const handleJournalSave = async (entry) => {
  const analysis = await analyzeTextEmotion(entry, userId);
  
  // Save with emotion metadata
  await saveJournal({
    text: entry,
    mood: analysis.mood,
    sentiment: analysis.sentiment_score,
    timestamp: new Date()
  });
};
```

## 📈 Evaluation Metrics

```python
from mood_pattern_recognition.utils.metrics import (
    calculate_classification_metrics,
    calculate_regression_metrics,
    calculate_trend_accuracy
)

# Classification metrics
metrics = calculate_classification_metrics(y_true, y_pred, labels)
print(f"Accuracy: {metrics['accuracy']:.3f}")
print(f"F1-Score: {metrics['f1_macro']:.3f}")

# Trend prediction metrics
trend_metrics = calculate_trend_accuracy(actual_trend, predicted_trend)
print(f"Direction Accuracy: {trend_metrics['direction_accuracy']:.3f}")
```

## 🛡️ Production Considerations

1. **Model Caching**: Models are lazy-loaded and cached in memory
2. **User Data**: Stored as JSON files (use database in production)
3. **Rate Limiting**: Add rate limiting for API endpoints
4. **Authentication**: Implement user authentication
5. **CORS**: Configure CORS appropriately for your domain
6. **Error Handling**: Comprehensive error handling included
7. **Logging**: Add logging for monitoring and debugging

## 🔍 Troubleshooting

### Model Loading Issues

If models fail to load:
```python
# Use existing emotion detection models
detector = FaceEmotionDetector(use_existing=True)

# Or specify model path
detector = FaceEmotionDetector(
    model_path="./models/emotiondetection/fer2013_model.keras"
)
```

### Memory Issues

For large-scale deployment:
- Use model quantization
- Implement batch processing
- Use GPU acceleration (CUDA)

### Dataset Download Issues

If automatic download fails:
- Manually download datasets
- Use sample data for testing: `--create-samples`

## 📚 References

- **FER2013**: [Kaggle Dataset](https://www.kaggle.com/datasets/msambare/fer2013)
- **GoEmotions**: [Google Research](https://github.com/google-research/google-research/tree/master/goemotions)
- **Transformers**: [Hugging Face](https://huggingface.co/docs/transformers)
- **FastAPI**: [Documentation](https://fastapi.tiangolo.com/)

## 📝 License

MIT License - See LICENSE file for details

## 👥 Contributors

Mental Health App Development Team

---

**Last Updated**: October 26, 2025  
**Version**: 1.0.0
