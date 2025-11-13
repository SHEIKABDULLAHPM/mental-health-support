# LLaMA-3.2-1B-Instruct Integration for Mental Health Chatbot

This project integrates a fine-tuned LLaMA-3.2-1B-Instruct model using Ollama into the mental health chatbot system. The integration provides dynamic, context-aware AI interactions for mental health support.

## 🎯 Features

- **Multiple LLM Backends**: Supports Ollama, local HuggingFace models, and fallback responses
- **Mental Health Focus**: Specialized prompts and safety mechanisms for mental health conversations
- **Crisis Detection**: Automatic detection and appropriate response to crisis situations
- **Conversation Management**: Persistent conversation history and context awareness
- **Real-time Responses**: Streaming support for responsive user experience
- **Fallback System**: Graceful degradation when LLM services are unavailable

## 🏗️ Architecture

```
ml_service/
├── llm_model/
│   ├── __init__.py              # Package initialization
│   ├── llama_model.py           # LLM model interfaces (Ollama, Local, Fallback)
│   ├── chatbot_service.py       # Conversation management and logic
│   └── routes.py                # Flask API endpoints for LLM services
├── models/                      # Legacy model implementations
├── app.py                       # Main Flask application with LLM integration
├── requirements.txt             # Updated dependencies
└── .env                         # Environment configuration
```

## 🔧 Setup and Installation

### 1. Install Ollama

**Windows:**
```powershell
# Download and install Ollama
Invoke-WebRequest -Uri "https://ollama.com/download/windows" -OutFile "ollama-windows.exe"
./ollama-windows.exe

# Or use the downloaded installer
./ollama-windows-amd64.exe
```

**Linux/macOS:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Pull the LLaMA Model

```bash
# Pull the LLaMA-3.2-1B-Instruct model
ollama pull llama3.2:1b

# Alternative: Pull the specific GGUF version
ollama pull hf.co/bartowski/Llama-3.2-1B-Instruct-GGUF:Q4_0
```

### 3. Install Python Dependencies

```bash
cd ml_service
pip install -r requirements.txt
```

### 4. Configure Environment

Update the `.env` file:

```env
# LLM Service Configuration
LLM_MODEL_TYPE=auto          # Options: auto, ollama, local, fallback
LLM_MODEL_NAME=llama3.2:1b   # Model name for Ollama

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
HOST=0.0.0.0
```

### 5. Start Services

**Terminal 1 - Start Ollama (if not running as service):**
```bash
ollama serve
```

**Terminal 2 - Start ML Service:**
```bash
cd ml_service
python app.py
```

**Terminal 3 - Start Frontend:**
```bash
cd project
npm install
npm run dev
```

## 🔌 API Endpoints

The LLM service provides the following REST API endpoints:

### Health and Status
- `GET /api/llm/health` - Check LLM service health
- `GET /api/llm/model/info` - Get model information and capabilities

### Conversation Management
- `POST /api/llm/chat/start` - Start a new conversation
- `POST /api/llm/chat/send` - Send message and get response
- `GET /api/llm/chat/conversation/<id>` - Get conversation history
- `DELETE /api/llm/chat/conversation/<id>` - Clear conversation
- `GET /api/llm/chat/conversations` - List all conversations

### Mental Health Features
- `GET /api/llm/chat/assessment/<id>` - Get mental health assessment
- `POST /api/llm/chat/stream` - Streaming chat responses

## 💻 Usage Examples

### Starting a Conversation

```javascript
// Start a new conversation
const response = await fetch('/api/llm/chat/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'greeting' })
});

const data = await response.json();
console.log(data.data.conversation_id);
```

### Sending a Message

```javascript
// Send a message to the LLM
const response = await fetch('/api/llm/chat/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "I'm feeling anxious about my upcoming presentation",
    conversation_id: conversationId,
    temperature: 0.7,
    max_length: 256
  })
});

const data = await response.json();
console.log(data.data.assistant_message);
```

## 🛡️ Safety Features

### Crisis Detection
The system automatically detects crisis-related keywords and provides appropriate responses:

```python
crisis_keywords = [
    "suicide", "kill myself", "end it all", "want to die", 
    "harm myself", "hopeless", "worthless", "give up"
]
```

### Crisis Response
When crisis indicators are detected, the system provides:
- Immediate support resources
- Crisis hotline numbers
- Emergency contact information
- Professional help recommendations

### Content Filtering
- Mental health-focused conversation templates
- Context-aware response generation
- Inappropriate content detection and filtering

## 🔄 Fallback System

The system implements a robust fallback hierarchy:

1. **Primary**: Ollama LLaMA-3.2-1B model
2. **Secondary**: Local HuggingFace models
3. **Tertiary**: Pre-defined mental health responses
4. **Final**: Basic support messages

## 📊 Mental Health Assessment

The system provides basic mental health assessments:

```javascript
// Get assessment for a conversation
const assessment = await fetch(`/api/llm/chat/assessment/${conversationId}`);
const data = await assessment.json();

console.log(data.data.mood_analysis);
console.log(data.data.risk_assessment);
console.log(data.data.recommendations);
```

## 🔧 Configuration Options

### Model Types

- **auto**: Automatically selects the best available model
- **ollama**: Uses Ollama backend (recommended)
- **local**: Uses local HuggingFace models
- **fallback**: Uses pre-defined responses only

### Model Parameters

- **temperature**: Controls response creativity (0.1-1.0)
- **max_length**: Maximum response length (50-512 tokens)
- **top_p**: Nucleus sampling parameter
- **repetition_penalty**: Prevents repetitive responses

## 🐛 Troubleshooting

### Common Issues

1. **Ollama not found**
   ```bash
   # Check if Ollama is installed
   ollama --version
   
   # Check if service is running
   curl http://localhost:11434/api/tags
   ```

2. **Model not available**
   ```bash
   # List available models
   ollama list
   
   # Pull required model
   ollama pull llama3.2:1b
   ```

3. **Service connection failed**
   ```bash
   # Check ML service status
   curl http://localhost:5000/api/llm/health
   
   # Check logs
   python app.py
   ```

### Performance Optimization

1. **GPU Acceleration**: Ensure CUDA is available for faster inference
2. **Model Quantization**: Use 4-bit quantization for lower memory usage
3. **Conversation Trimming**: Limit conversation history to prevent memory issues

## 📈 Monitoring and Logging

The system provides comprehensive logging:

- Request/response tracking
- Model performance metrics
- Error logging and debugging
- Crisis intervention logging

## 🚀 Production Deployment

### Environment Setup

```bash
# Set production environment
export FLASK_ENV=production
export FLASK_DEBUG=False
export LLM_MODEL_TYPE=ollama
```

### Docker Deployment

```dockerfile
# Example Dockerfile for ML service
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["python", "app.py"]
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🤝 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## 🔮 Future Enhancements

- [ ] Fine-tuning with mental health datasets
- [ ] Multi-language support
- [ ] Voice interaction capabilities
- [ ] Advanced emotion detection
- [ ] Therapy session transcription
- [ ] Integration with professional mental health platforms