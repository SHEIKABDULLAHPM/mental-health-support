# Voice Emotion Detection ML Service

Flask-based ML service for detecting emotions from voice recordings using Wav2Vec2.

## Setup

### 1. Install Dependencies

```bash
cd ml_service
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env` file and adjust settings if needed:
- `PORT`: Service port (default: 5000)
- `MODEL_PATH`: Path to Wav2Vec2 model
- `DEVICE`: cpu or cuda

### 3. Run the Service

```bash
python app.py
```

The service will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /api/health
```

### Detect Emotion
```
POST /api/detect-emotion
Content-Type: multipart/form-data
Body: audio file (wav, mp3, webm)
```

Response:
```json
{
  "status": "success",
  "data": {
    "primary_emotion": "happy",
    "confidence": 0.85,
    "emotion_distribution": {
      "neutral": 0.05,
      "happy": 0.85,
      "sad": 0.03,
      ...
    },
    "top_emotions": [...],
    "insight": "Great! You sound positive and uplifted.",
    "color": "#10B981",
    "timestamp": "2025-10-14T10:30:00"
  }
}
```

### Get Supported Emotions
```
GET /api/emotions
```

## Model Details

- **Base Model**: Facebook Wav2Vec2 Base
- **Sample Rate**: 16kHz
- **Max Audio Length**: 30 seconds
- **Supported Emotions**: neutral, happy, sad, angry, fearful, surprised, disgusted

## Architecture

```
ml_service/
├── app.py              # Flask application
├── models/
│   ├── __init__.py
│   └── emotion_detector.py  # Emotion detection logic
├── temp/               # Temporary audio storage
├── requirements.txt
└── .env
```

## Notes

- The emotion classifier layer is initialized with random weights for demo purposes
- In production, train the classifier on emotion-labeled audio datasets (e.g., RAVDESS, TESS)
- Consider fine-tuning the entire Wav2Vec2 model for better accuracy
