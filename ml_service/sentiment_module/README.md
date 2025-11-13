# Sentiment Analysis Module

**Reusable, production-ready sentiment analysis for mental health applications**

## 📋 Overview

This module provides a unified interface for sentiment analysis across the entire application. It supports multiple models (VADER, Classical ML, BiLSTM, Ensemble) and includes mental health crisis detection.

## 🎯 Features

- ✅ **Multiple Models**: VADER, Classical (TF-IDF + LogReg), BiLSTM, Ensemble
- ✅ **Mental Health Detection**: Automatic detection of suicidal ideation, self-harm, severe depression/anxiety
- ✅ **Keyword Extraction**: Automatic extraction of important keywords
- ✅ **Batch Processing**: Efficient analysis of multiple texts
- ✅ **Performance Optimized**: < 50ms for VADER, throughput 100+ texts/second
- ✅ **Unified Interface**: Single API for all models
- ✅ **Production Ready**: Error handling, logging, type hints

## 🚀 Quick Start

### Basic Usage

```python
from sentiment_module.analyzer import get_analyzer
from sentiment_module.models import VADERModel

# Initialize analyzer
analyzer = get_analyzer()
analyzer.register_model("vader", VADERModel())

# Analyze text
result = analyzer.analyze("I'm feeling anxious about my exams")

print(f"Label: {result.label}")  # Negative
print(f"Confidence: {result.confidence}")  # 0.75
print(f"Keywords: {result.keywords}")  # ['feeling', 'anxious', 'exams']
```

### Batch Analysis

```python
texts = [
    "I'm so happy today!",
    "Feeling sad and lonely",
    "It's a normal day"
]

results = analyzer.analyze_batch(texts)
for result in results:
    print(f"{result.label}: {result.text}")
```

### Mental Health Crisis Detection

```python
result = analyzer.analyze("I want to end my life")

if result.mental_health_flags:
    print(f"⚠️ Crisis detected: {result.mental_health_flags}")
    # Trigger crisis intervention protocol
```

## 📊 Supported Models

### 1. VADER (Default)
- **Type**: Lexicon-based
- **Speed**: ~10-20ms per text
- **Best for**: Social media, informal text, real-time analysis
- **Accuracy**: Good for general sentiment

```python
from sentiment_module.models import VADERModel

vader = VADERModel()
result = vader.analyze("I love this!")
```

### 2. Classical ML (TF-IDF + Logistic Regression)
- **Type**: Machine Learning
- **Speed**: ~30-50ms per text
- **Best for**: Formal text, clinical notes
- **Accuracy**: High on trained mental health data

```python
from sentiment_module.models import ClassicalModel

classical = ClassicalModel()
result = classical.analyze("Feeling depressed")
```

### 3. BiLSTM (Deep Learning)
- **Type**: Neural Network
- **Speed**: ~100-200ms per text
- **Best for**: Complex emotional states
- **Accuracy**: Highest accuracy

```python
from sentiment_module.models import BiLSTMModel

bilstm = BiLSTMModel()
result = bilstm.analyze("I'm overwhelmed and anxious")
```

### 4. Ensemble (All Models Combined)
- **Type**: Weighted Voting
- **Speed**: Sum of all models
- **Best for**: Critical decisions, highest confidence
- **Accuracy**: Best overall accuracy

```python
from sentiment_module.models import EnsembleModel

ensemble = EnsembleModel(vader, classical, bilstm)
result = ensemble.analyze(
    "Feeling hopeless",
    weights={"vader": 0.4, "classical": 0.3, "bilstm": 0.3}
)
```

## 🔌 Integration with Pages

### Journal Page

```python
# Analyze journal entry
result = analyzer.analyze(journal_text, model="vader")

# Store sentiment with entry
entry = {
    "text": journal_text,
    "sentiment": result.label,
    "confidence": result.confidence,
    "keywords": result.keywords,
    "timestamp": result.timestamp
}
```

### MoodCheckin Page

```python
# Quick mood analysis
result = analyzer.analyze(
    mood_text,
    model="bilstm",  # More accurate for mood detection
    top_k_keywords=3
)

# Display mood indicator
mood_color = {
    "Positive": "green",
    "Neutral": "yellow",
    "Negative": "red"
}[result.label]
```

### ReflectionWall Page

```python
# Batch analyze all reflections
reflections = get_all_reflections()
texts = [r["text"] for r in reflections]

results = analyzer.analyze_batch(texts, model="classical")

# Add sentiment to each reflection
for reflection, result in zip(reflections, results):
    reflection["sentiment"] = result.to_dict()
```

### Chatbot Page

```python
# Real-time sentiment for emotion-aware responses
user_message = "I'm really stressed about work"
result = analyzer.analyze(user_message, model="vader")

# Check for crisis
if result.mental_health_flags:
    # Trigger crisis protocol
    send_crisis_resources()
else:
    # Use sentiment for emotion-enhanced response
    bot_response = generate_response(
        text=user_message,
        emotion=result.label,
        intensity=result.intensity
    )
```

## 📦 Result Object

### SentimentResult

```python
@dataclass
class SentimentResult:
    text: str                          # Input text (truncated to 200 chars)
    label: str                         # "Positive" | "Negative" | "Neutral"
    confidence: float                  # 0.0 to 1.0
    intensity: float                   # 0.0 to 1.0 (strength)
    compound_score: float              # -1.0 to 1.0
    keywords: List[str]                # Top keywords
    model: str                         # Model used
    processing_time_ms: float          # Time taken
    timestamp: str                     # ISO timestamp
    scores: Optional[Dict]             # Raw model scores
    emotions: Optional[Dict]           # Multi-emotion scores
    mental_health_flags: Optional[List]  # Crisis indicators
```

### Convert to Dictionary

```python
result_dict = result.to_dict()
# Returns JSON-serializable dictionary
```

## 🧪 Testing

Run comprehensive test suite:

```bash
cd ml_service
python test_sentiment_module.py
```

### Test Coverage

- ✅ VADER model accuracy
- ✅ Classical model (if available)
- ✅ BiLSTM model (if available)
- ✅ Ensemble model
- ✅ Unified analyzer interface
- ✅ Page integration scenarios
- ✅ Mental health crisis detection
- ✅ Performance benchmarks

## 🎯 Mental Health Crisis Flags

### Detected Conditions

| Flag | Keywords | Action |
|------|----------|--------|
| `suicidal_ideation` | suicide, kill myself, end my life, want to die | **IMMEDIATE** crisis intervention |
| `self_harm` | hurt myself, self harm, cut myself | **URGENT** support resources |
| `severe_depression` | hopeless, worthless, no point, give up | **HIGH** priority mental health support |
| `severe_anxiety` | panic attack, can't breathe, heart racing | **MODERATE** anxiety management |

### Crisis Response Example

```python
result = analyzer.analyze(user_text)

if "suicidal_ideation" in (result.mental_health_flags or []):
    # IMMEDIATE action
    show_crisis_hotline()
    alert_support_team()
    log_crisis_event(user_id, result)

elif result.mental_health_flags:
    # Provide support resources
    show_mental_health_resources()
```

## ⚡ Performance

### Benchmarks

| Model | Single Text | Batch (100 texts) | Throughput |
|-------|-------------|-------------------|------------|
| VADER | 10-20ms | 1-2s | 100+ texts/s |
| Classical | 30-50ms | 3-5s | 30-40 texts/s |
| BiLSTM | 100-200ms | 10-20s | 5-10 texts/s |
| Ensemble | 150-300ms | 15-30s | 3-5 texts/s |

### Optimization Tips

1. **Use VADER for real-time**: Fastest, good accuracy
2. **Batch processing**: Use `analyze_batch()` for multiple texts
3. **Lazy loading**: Models only load when first used
4. **Cache results**: Store sentiment in database for repeated queries

## 📁 File Structure

```
sentiment_module/
├── __init__.py           # Module exports
├── analyzer.py           # Core analyzer & result classes
├── models.py             # All model implementations
└── README.md             # This file

test_sentiment_module.py  # Comprehensive test suite
```

## 🔧 API Integration

### Flask Route Example

```python
from flask import Blueprint, request, jsonify
from sentiment_module.analyzer import get_analyzer

sentiment_bp = Blueprint("sentiment", __name__)
analyzer = get_analyzer()

@sentiment_bp.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    text = data.get("text", "")
    model = data.get("model", "vader")
    
    result = analyzer.analyze(text, model=model)
    
    return jsonify({
        "status": "success",
        "data": result.to_dict()
    })
```

### Frontend Integration

```javascript
// Analyze sentiment
const response = await fetch('/api/sentiment/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: userMessage,
    model: 'vader'
  })
});

const { data } = await response.json();
console.log(`Sentiment: ${data.label} (${data.confidence})`);
```

## 📊 Model Comparison

| Criteria | VADER | Classical | BiLSTM | Ensemble |
|----------|-------|-----------|--------|----------|
| **Speed** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐ |
| **Accuracy** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Mental Health** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| **Dependencies** | Low | Medium | High | High |

## 🛠️ Requirements

### Core (VADER only)
```
vaderSentiment>=3.3.2
```

### Optional (Classical)
```
scikit-learn>=1.0.0
joblib>=1.0.0
```

### Optional (BiLSTM)
```
tensorflow>=2.10.0
keras>=2.10.0
```

## 📝 Usage in Production

### 1. Initialize on Startup

```python
# app.py
from sentiment_module.analyzer import get_analyzer
from sentiment_module.models import VADERModel

def init_sentiment():
    analyzer = get_analyzer()
    analyzer.register_model("vader", VADERModel())
    
    try:
        from sentiment_module.models import ClassicalModel
        analyzer.register_model("classical", ClassicalModel())
    except:
        print("Classical model not available")
    
    return analyzer

app.sentiment_analyzer = init_sentiment()
```

### 2. Use in Routes

```python
@app.route("/api/chat", methods=["POST"])
def chat():
    text = request.json["message"]
    
    # Analyze sentiment
    result = app.sentiment_analyzer.analyze(text)
    
    # Check for crisis
    if result.mental_health_flags:
        return handle_crisis(result)
    
    # Generate response based on sentiment
    response = generate_response(text, result.label)
    return jsonify({"response": response})
```

## 🎓 Best Practices

1. **Always check mental_health_flags** before responding
2. **Use VADER for real-time** chatbot interactions
3. **Use Ensemble for important decisions** (e.g., crisis detection)
4. **Batch analyze** when processing multiple texts
5. **Cache results** in database to avoid re-analysis
6. **Log crisis events** for monitoring and improvement
7. **Test regularly** with the provided test suite

## 📄 License

Part of Mental Health Chatbot project

## 🤝 Contributing

To add a new model:

1. Create class inheriting from `BaseSentimentModel`
2. Implement `analyze()` method
3. Register with analyzer: `analyzer.register_model("mymodel", MyModel())`
4. Add tests to `test_sentiment_module.py`

---

**Made with ❤️ for mental health support**
