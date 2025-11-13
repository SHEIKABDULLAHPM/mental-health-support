"""
Flask Routes for LLM-powered Mental Health Chatbot
RESTful API endpoints for chatbot interactions
"""

from flask import Blueprint, request, jsonify, current_app
import logging
from datetime import datetime
from .chatbot_service import ChatbotService
import uuid
import os

logger = logging.getLogger(__name__)

# Create blueprint for LLM routes
llm_bp = Blueprint('llm', __name__, url_prefix='/api/llm')

# Global chatbot service instance
chatbot_service = None

def init_chatbot_service():
    """Initialize the chatbot service"""
    global chatbot_service
    try:
        # Get model configuration from environment
        model_type = os.getenv('LLM_MODEL_TYPE', 'auto')
        model_name = os.getenv('LLM_MODEL_NAME', None)
        
        logger.info(f"Initializing chatbot service with model_type: {model_type}, model_name: {model_name}")
        chatbot_service = ChatbotService(model_type=model_type, model_name=model_name)
        logger.info("Chatbot service initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize chatbot service: {str(e)}")
        # Initialize with fallback
        chatbot_service = ChatbotService(model_type='fallback')

def get_chatbot_service():
    """Get the chatbot service instance"""
    global chatbot_service
    if chatbot_service is None:
        init_chatbot_service()
    return chatbot_service

@llm_bp.route('/health', methods=['GET'])
def llm_health():
    """Check LLM service health"""
    try:
        service = get_chatbot_service()
        status = service.get_service_status()
        
        return jsonify({
            'status': 'success',
            'data': status
        }), 200
        
    except Exception as e:
        logger.error(f"LLM health check failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e),
            'service': 'LLM Mental Health Chatbot'
        }), 500

@llm_bp.route('/chat/start', methods=['POST'])
def start_conversation():
    """Start a new conversation"""
    try:
        data = request.get_json() or {}
        conversation_type = data.get('type', 'greeting')
        
        service = get_chatbot_service()
        result = service.start_conversation(conversation_type)
        
        logger.info(f"Started conversation: {result['conversation_id'][:8]} (type: {conversation_type})")
        
        return jsonify({
            'status': 'success',
            'data': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error starting conversation: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@llm_bp.route('/chat/send', methods=['POST'])
def send_message():
    """Send a message and get response"""
    try:
        data = request.get_json()
        
        # Validate request
        if not data or 'message' not in data:
            return jsonify({
                'status': 'error',
                'error': 'Message is required'
            }), 400
        
        message = data.get('message', '').strip()
        conversation_id = data.get('conversation_id')
        
        if not message:
            return jsonify({
                'status': 'error',
                'error': 'Message cannot be empty'
            }), 400
        
        # Generate conversation ID if not provided
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
        
        # Get optional parameters
        max_length = min(max(int(data.get('max_length', 256)), 50), 512)
        temperature = max(0.1, min(float(data.get('temperature', 0.7)), 1.0))
        
        # Send message through chatbot service
        service = get_chatbot_service()
        result = service.send_message(
            conversation_id=conversation_id,
            message=message,
            max_length=max_length,
            temperature=temperature
        )
        
        if 'error' in result:
            return jsonify({
                'status': 'error',
                'error': result['error'],
                'conversation_id': conversation_id
            }), 400
        
        logger.info(f"Processed message for conversation: {conversation_id[:8]} (length: {len(message)})")
        
        return jsonify({
            'status': 'success',
            'data': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': 'Failed to process message',
            'details': str(e)
        }), 500

@llm_bp.route('/chat/conversation/<conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    """Get conversation history"""
    try:
        service = get_chatbot_service()
        conversation = service.get_conversation(conversation_id)
        
        if not conversation:
            return jsonify({
                'status': 'error',
                'error': 'Conversation not found'
            }), 404
        
        history = service.get_conversation_history(conversation_id)
        
        return jsonify({
            'status': 'success',
            'data': {
                'conversation_id': conversation_id,
                'conversation': conversation,
                'history': history
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting conversation {conversation_id}: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@llm_bp.route('/chat/conversation/<conversation_id>', methods=['DELETE'])
def clear_conversation(conversation_id):
    """Clear conversation history"""
    try:
        service = get_chatbot_service()
        success = service.clear_conversation(conversation_id)
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'Conversation cleared successfully',
                'conversation_id': conversation_id
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'error': 'Conversation not found'
            }), 404
            
    except Exception as e:
        logger.error(f"Error clearing conversation {conversation_id}: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@llm_bp.route('/chat/conversations', methods=['GET'])
def list_conversations():
    """List all active conversations"""
    try:
        service = get_chatbot_service()
        conversations = service.list_conversations()
        
        return jsonify({
            'status': 'success',
            'data': conversations
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing conversations: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@llm_bp.route('/chat/assessment/<conversation_id>', methods=['GET'])
def mental_health_assessment(conversation_id):
    """Perform mental health assessment for conversation"""
    try:
        service = get_chatbot_service()
        assessment = service.perform_mental_health_assessment(conversation_id)
        
        if 'error' in assessment:
            return jsonify({
                'status': 'error',
                'error': assessment['error']
            }), 404
        
        return jsonify({
            'status': 'success',
            'data': assessment
        }), 200
        
    except Exception as e:
        logger.error(f"Error performing assessment for conversation {conversation_id}: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@llm_bp.route('/chat/stream', methods=['POST'])
def stream_chat():
    """Streaming chat endpoint (for future implementation)"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({
                'status': 'error',
                'error': 'Message is required'
            }), 400
        
        # For now, use regular chat but mark as streaming
        message = data.get('message', '').strip()
        conversation_id = data.get('conversation_id') or str(uuid.uuid4())
        
        service = get_chatbot_service()
        result = service.send_message(
            conversation_id=conversation_id,
            message=message,
            max_length=data.get('max_length', 256),
            temperature=data.get('temperature', 0.7)
        )
        
        if 'error' in result:
            return jsonify({
                'status': 'error',
                'error': result['error']
            }), 400
        
        # Mark as streaming response
        result['streaming'] = True
        
        return jsonify({
            'status': 'success',
            'data': result,
            'stream': True
        }), 200
        
    except Exception as e:
        logger.error(f"Error in streaming chat: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@llm_bp.route('/admin/cleanup', methods=['POST'])
def cleanup_conversations():
    """Clean up old conversations"""
    try:
        data = request.get_json() or {}
        max_age_hours = data.get('max_age_hours', 24)
        
        service = get_chatbot_service()
        cleaned_count = service.cleanup_old_conversations(max_age_hours)
        
        return jsonify({
            'status': 'success',
            'data': {
                'cleaned_conversations': cleaned_count,
                'max_age_hours': max_age_hours,
                'timestamp': datetime.utcnow().isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@llm_bp.route('/model/info', methods=['GET'])
def model_info():
    """Get model information"""
    try:
        service = get_chatbot_service()
        status = service.get_service_status()
        
        return jsonify({
            'status': 'success',
            'data': {
                'model_status': status['model_status'],
                'capabilities': [
                    'Mental Health Support',
                    'Crisis Detection',
                    'Conversation Memory',
                    'Context Awareness',
                    'Safety Filtering',
                    'Multi-turn Dialogue'
                ],
                'endpoints': [
                    '/api/llm/health',
                    '/api/llm/chat/start',
                    '/api/llm/chat/send',
                    '/api/llm/chat/conversation/<id>',
                    '/api/llm/chat/conversations',
                    '/api/llm/chat/assessment/<id>',
                    '/api/llm/chat/stream'
                ]
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# Error handlers for the blueprint
@llm_bp.errorhandler(404)
def llm_not_found(error):
    return jsonify({
        'status': 'error',
        'error': 'LLM endpoint not found'
    }), 404

@llm_bp.errorhandler(500)
def llm_internal_error(error):
    return jsonify({
        'status': 'error',
        'error': 'LLM service internal error'
    }), 500

# Middleware to initialize service
@llm_bp.before_request
def before_request():
    """Ensure chatbot service is initialized before each request"""
    global chatbot_service
    if chatbot_service is None:
        init_chatbot_service()

# Initialize service when module is imported
init_chatbot_service()