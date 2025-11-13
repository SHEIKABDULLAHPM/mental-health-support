"""
Voice Emotion Detection ML Service
Flask API for processing audio and detecting emotions using Wav2Vec2
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from app.sentiment import sentiment_bp
from app.recommendations import reco_bp
from app.mood import mood_bp
import logging
import uuid
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
# Allow all origins for development
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register lightweight blueprints first
app.register_blueprint(sentiment_bp)  # Legacy VADER endpoint
app.register_blueprint(reco_bp)
app.register_blueprint(mood_bp)

# Register new advanced sentiment API (v2)
try:
    from app.sentiment_advanced import sentiment_advanced_bp
    app.register_blueprint(sentiment_advanced_bp)
    print("✓ Advanced sentiment API (v2) registered successfully")
    print(f"✓ Blueprint URL prefix: {sentiment_advanced_bp.url_prefix}")
except Exception as e:
    print(f"✗ sentiment_advanced blueprint unavailable: {e}")
    import traceback
    traceback.print_exc()

# Try to register heavy/optional blueprints without breaking startup
try:
    from app.routes import chat_bp
    app.register_blueprint(chat_bp)
    print("✓ Legacy chat blueprint registered successfully")
except Exception as e:
    app.logger.warning(f"chat blueprint unavailable: {e}")

# Register LLM model blueprint (primary chatbot service)
try:
    from llm_model.routes import llm_bp, init_chatbot_service
    app.register_blueprint(llm_bp)
    init_chatbot_service()
    print("✓ LLM chatbot service registered successfully")
    print(f"✓ LLM Blueprint URL prefix: {llm_bp.url_prefix}")
except Exception as e:
    print(f"✗ LLM chatbot service unavailable: {e}")
    # Fallback to compatibility layer
    try:
        from app.llm_compat import llm_bp as llm_compat_bp
        app.register_blueprint(llm_compat_bp)
        print("✓ LLM compatibility layer registered as fallback")
    except Exception as e2:
        app.logger.warning(f"llm_compat blueprint unavailable: {e2}")

try:
    from app.analytics import analytics_bp
    app.register_blueprint(analytics_bp)
except Exception as e:
    app.logger.warning(f"analytics blueprint unavailable: {e}")

try:
    from app.games import games_bp
    app.register_blueprint(games_bp)
except Exception as e:
    app.logger.warning(f"games blueprint unavailable: {e}")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize emotion detector (optional, heavy deps). Enabled by default.
emotion_detector = None
enable_emotion = os.getenv('ENABLE_EMOTION', 'true').lower() in {'1', 'true', 'yes'}

if enable_emotion:
    try:
        from models.emotion_detector import EmotionDetector  # Lazy import to avoid hard dependency at startup
        try:
            logger.info("Initializing emotion detector...")
            emotion_detector = EmotionDetector()
            logger.info("✓ Emotion detector initialized successfully")
            print("✓ Voice emotion detection enabled")
        except Exception as e:
            logger.error(f"Failed to initialize emotion detector: {str(e)}")
            logger.info("Voice emotion detection will be unavailable")
            emotion_detector = None
    except ImportError as e:
        # If heavy ML deps (torch/transformers) are not installed, keep service running without voice emotion
        logger.warning(f"Emotion detector dependencies not available: {str(e)}")
        logger.info("Install with: pip install torch torchaudio transformers")
        emotion_detector = None
else:
    logger.info("Emotion detector disabled (ENABLE_EMOTION=false)")

# Initialize face emotion detector (FER2013/AffectNet)
face_emotion_detector = None
enable_face_emotion = os.getenv('ENABLE_FACE_EMOTION', 'true').lower() in {'1', 'true', 'yes'}
if enable_face_emotion:
    try:
        from mood_pattern_recognition.models.face_emotion_model import FaceEmotionDetector
        logger.info("Initializing face emotion detector (FER2013/AffectNet)...")
        # Default to FER2013, can be changed to 'affectnet' if needed
        face_emotion_detector = FaceEmotionDetector(model_type='fer2013', use_existing=True)
        logger.info("✓ Face emotion detector initialized successfully")
        print("✓ Face emotion detection enabled")
    except Exception as e:
        logger.error(f"Failed to initialize face emotion detector: {str(e)}")
        logger.info("Face emotion detection will be unavailable")
        face_emotion_detector = None
    except ImportError as e:
        logger.warning(f"Face emotion detector dependencies not available: {str(e)}")
        face_emotion_detector = None
else:
    logger.info("Face emotion detector disabled (ENABLE_FACE_EMOTION=false)")

# Legacy chat model removed; use LLM blueprint endpoints.

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Check if the service is running"""
    return jsonify({
        'status': 'healthy',
        'service': 'Mental Health AI Service',
        'emotion_model_loaded': emotion_detector is not None,
        'chat_model_loaded': True,
        'timestamp': datetime.utcnow().isoformat()
    }), 200

# Compatibility: Legacy Chat endpoints proxy to LLM service
@app.route('/api/chat', methods=['POST'])
def chat_compat():
    """Generate support response (compat endpoint). Proxies to LLM service."""
    # Proxy to new chat endpoint for backward compatibility
    try:
        data = request.get_json() or {}
        message = (data.get('message') or '').strip()
        if not message:
            return jsonify({'status': 'error', 'error': 'Message is required'}), 400

        conversation_id = data.get('conversation_id') or str(uuid.uuid4())
        max_length = min(max(int(data.get('max_length', 256)), 50), 512)
        temperature = max(0.1, min(float(data.get('temperature', 0.7)), 1.0))

        # Build request for new blueprint
        from flask import current_app
        with app.test_request_context(
            '/api/chat/send',
            method='POST',
            json={
                'message': message,
                'conversation_id': conversation_id,
                'max_length': max_length,
                'temperature': temperature
            }
        ):
            resp = app.full_dispatch_request()
            js = resp.get_json() or {}
            if js.get('status') != 'success':
                return jsonify({'status': 'error', 'error': js.get('error', 'Chat failed')}), 400
            data_out = js.get('data', {})
            return jsonify({
                'status': 'success',
                'data': {
                    'response': data_out.get('assistant_message'),
                    'model': 'Qwen2-1.5B-Instruct',
                    'timestamp': data_out.get('timestamp'),
                    'conversation_id': data_out.get('conversation_id')
                }
            }), 200
    except Exception as e:
        logger.error(f"Compat chat error: {str(e)}")
        return jsonify({'status': 'error', 'error': 'Chat service unavailable'}), 500

@app.route('/api/chat/stream', methods=['POST'])
def chat_stream_compat():
    """Streaming compat endpoint (non-streaming proxy)."""
    return chat_compat()

@app.route('/api/chat/info', methods=['GET'])
def chat_info_compat():
    # Provide minimal status from upgraded service
    try:
        return jsonify({'status': 'success', 'data': {'service': 'Qwen Chat', 'status': 'healthy'}}), 200
    except Exception as e:
        logger.error(f"Compat chat info error: {str(e)}")
        return jsonify({'status': 'error', 'error': 'Info unavailable'}), 500

@app.route('/api/chat/clear/<conversation_id>', methods=['DELETE'])
def clear_conversation_compat(conversation_id):
    try:
        from flask import current_app
        with app.test_request_context(f'/api/chat/conversation/{conversation_id}', method='DELETE'):
            resp = app.full_dispatch_request()
            js = resp.get_json() or {}
            code = resp.status_code
            if code == 200:
                return jsonify({'status': 'success', 'message': 'Conversation cleared', 'conversation_id': conversation_id}), 200
            return jsonify({'status': 'error', 'error': 'Conversation not found'}), 404
    except Exception as e:
        logger.error(f"Compat clear error: {str(e)}")
        return jsonify({'status': 'error', 'error': 'Clear failed'}), 500

@app.route('/api/chat/conversations', methods=['GET'])
def list_conversations_compat():
    try:
        with app.test_request_context('/api/chat/conversations', method='GET'):
            resp = app.full_dispatch_request()
            return resp
    except Exception as e:
        logger.error(f"Compat list error: {str(e)}")
        return jsonify({'status': 'error', 'error': 'List failed'}), 500

@app.route('/api/chat/conversation/<conversation_id>', methods=['GET'])
def get_conversation_compat(conversation_id):
    try:
        with app.test_request_context(f'/api/chat/conversation/{conversation_id}', method='GET'):
            resp = app.full_dispatch_request()
            return resp
    except Exception as e:
        logger.error(f"Compat get conv error: {str(e)}")
        return jsonify({'status': 'error', 'error': 'Get failed'}), 500

@app.route('/api/chat/assessment', methods=['POST'])
def mental_health_assessment_compat():
    # Not supported in upgraded stack yet; return minimal placeholder
    try:
        data = request.get_json() or {}
        conversation_id = data.get('conversation_id')
        if not conversation_id:
            return jsonify({'status': 'error', 'error': 'Conversation ID is required'}), 400
        return jsonify({'status': 'success', 'data': {'conversation_id': conversation_id, 'note': 'Assessment not available'}}), 200
    except Exception as e:
        logger.error(f"Compat assessment error: {str(e)}")
        return jsonify({'status': 'error', 'error': 'Assessment failed'}), 500

# Emotion detection endpoint
@app.route('/api/detect-emotion', methods=['POST'])
def detect_emotion():
    """
    Detect emotion from audio file
    Expects: multipart/form-data with 'audio' field containing audio file
    Returns: JSON with emotion predictions and confidence scores
    """
    try:
        # Check if emotion detector is available
        if emotion_detector is None:
            return jsonify({
                'error': 'Emotion detector not initialized',
                'status': 'error'
            }), 500

        # Check if audio file is present
        if 'audio' not in request.files:
            return jsonify({
                'error': 'No audio file provided',
                'status': 'error'
            }), 400

        audio_file = request.files['audio']
        
        # Check if file has a name
        if audio_file.filename == '':
            return jsonify({
                'error': 'No audio file selected',
                'status': 'error'
            }), 400

        # Save audio temporarily
        temp_path = os.path.join('temp', audio_file.filename)
        os.makedirs('temp', exist_ok=True)
        audio_file.save(temp_path)

        try:
            # Process audio and detect emotion
            logger.info(f"Processing audio file: {audio_file.filename}")
            result = emotion_detector.predict_emotion(temp_path)
            
            # Clean up temporary file
            os.remove(temp_path)
            
            return jsonify({
                'status': 'success',
                'data': result
            }), 200

        except Exception as e:
            # Clean up temporary file on error
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise e

    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

# Get supported emotions
@app.route('/api/emotions', methods=['GET'])
def get_emotions():
    """Get list of supported emotions"""
    if emotion_detector is None:
        return jsonify({
            'error': 'Emotion detector not initialized',
            'status': 'error'
        }), 500
    
    return jsonify({
        'status': 'success',
        'emotions': emotion_detector.get_emotion_labels()
    }), 200


# Real-time face emotion detection endpoint
@app.route('/api/detect-face-emotion', methods=['POST'])
def detect_face_emotion():
    """
    Detect emotion from image file (face)
    Expects: multipart/form-data with 'image' field containing image file
    Returns: JSON with emotion predictions, dominant emotion, confidence, and mood mapping
    """
    try:
        if face_emotion_detector is None:
            return jsonify({
                'error': 'Face emotion detector not initialized',
                'status': 'error'
            }), 500

        if 'image' not in request.files:
            return jsonify({
                'error': 'No image file provided',
                'status': 'error'
            }), 400

        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({
                'error': 'No image file selected',
                'status': 'error'
            }), 400

        image_bytes = image_file.read()
        result = face_emotion_detector.predict_from_bytes(image_bytes)
        dominant_emotion, confidence = face_emotion_detector.get_dominant_emotion(result)
        mood_probs = face_emotion_detector.get_mood_from_emotion(result)

        return jsonify({
            'status': 'success',
            'emotions': result,
            'dominant_emotion': dominant_emotion,
            'confidence': confidence,
            'mood': mood_probs
        }), 200
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'status': 'error'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'status': 'error'
    }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting Voice Emotion Detection Service on {host}:{port}")
    app.run(host=host, port=port, debug=debug)
