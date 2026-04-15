"""
Chatbot Service for Mental Health Support
Handles conversation management, context, and integration with a generic chat model.
LLaMA-specific code paths removed; includes a lightweight SafeFallbackModel to preserve API.
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any

class SafeFallbackModel:
    """Lightweight fallback chat model with basic safety and crisis keyword checks."""
    def __init__(self, model_name: str = "safe-fallback"):
        self.model_name = model_name
        self.model_loaded = True

    def initialize(self) -> bool:
        return True

    def is_available(self) -> bool:
        return True

    def _detect_crisis_keywords(self, text: str) -> bool:
        crisis_keywords = [
            "suicide", "kill myself", "end my life", "self-harm", "hurt myself",
            "die", "can't go on", "end it all"
        ]
        t = text.lower()
        return any(k in t for k in crisis_keywords)

    def _crisis_response(self) -> Dict[str, Any]:
        return {
            'response': (
                "I'm really glad you told me. You deserve support. "
                "If you're in immediate danger, please call your local emergency number. "
                "You can also reach out to these resources right now: "
                "• International: findahelpline.com • US: 988 Suicide & Crisis Lifeline • UK & ROI: Samaritans 116 123. "
                "I'm here with you—would you like coping strategies while you reach out?"
            ),
            'model': self.model_name,
            'is_crisis': True,
        }

    def generate_response(self, message: str, conversation_history: Optional[List[Dict]] = None, **kwargs) -> Dict[str, Any]:
        import time
        start = time.time()
        if self._detect_crisis_keywords(message):
            out = self._crisis_response()
        else:
            # Improved fallback: empathetic, actionable, varied
            fallback_responses = [
                "Thank you for opening up. I'm here to listen and support you. Would you like to talk about what's on your mind, or try a calming exercise together?",
                "It's okay to feel this way. Remember, you're not alone. Would you like some tips for managing stress, or just someone to listen?",
                "I'm here for you. If you'd like, I can suggest a simple breathing exercise, or we can talk more about your feelings.",
                "Your feelings are valid. Would you like to share more, or hear some ways others have coped in similar situations?",
                "Let's take a moment together. Would you like to try a short mindfulness activity, or continue talking?",
                "I'm glad you reached out. If you want, I can guide you through a grounding technique, or just be here to listen."
            ]
            import random
            out = {
                'response': random.choice(fallback_responses),
                'model': self.model_name,
                'is_crisis': False,
            }
        out['response_time'] = round(time.time() - start, 3)
        return out

logger = logging.getLogger(__name__)

class ChatbotService:
    """Enhanced chatbot service with conversation management and mental health focus"""
    
    def __init__(self, model_type: str = "auto", model_name: str = None):
        self.model_type = model_type
        self.model_name = model_name
        self.llm_model = None
        self.conversations = {}
        self.session_stats = {
            'total_conversations': 0,
            'total_messages': 0,
            'crisis_interventions': 0,
            'start_time': datetime.utcnow().isoformat()
        }
        
        # Mental health conversation starters and templates
        self.conversation_starters = {
            "greeting": "Hello! I'm here to support you with your mental health and wellbeing. How are you feeling today?",
            "anxiety": "I understand you're feeling anxious. Let's work through this together. Can you tell me more about what's troubling you?",
            "depression": "It sounds like you're going through a difficult time. I'm here to listen and support you. What would you like to talk about?",
            "stress": "Stress can be overwhelming. Let's explore some ways to help you feel more balanced. What's been causing you stress lately?",
            "support": "Remember, seeking help is a sign of strength. I'm here to provide a safe space for you to express yourself.",
            "check_in": "How have you been feeling since we last talked? I'm here to listen and support you."
        }
        
        # Initialize model
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the LLM model"""
        # Use the local safe fallback model now that LLaMA is removed.
        logger.info(f"Initializing chatbot with provider-agnostic SafeFallbackModel")
        self.llm_model = SafeFallbackModel(self.model_name or "safe-fallback")
        self.llm_model.initialize()
    
    def _background_model_init(self):
        """Initialize model in background"""
        # No-op: model is already initialized and lightweight.
        return
    
    def start_conversation(self, conversation_type: str = "greeting") -> Dict:
        """Start a new conversation"""
        conversation_id = str(uuid.uuid4())
        
        starter_message = self.conversation_starters.get(
            conversation_type, 
            self.conversation_starters["greeting"]
        )
        
        self.conversations[conversation_id] = {
            'id': conversation_id,
            'started_at': datetime.utcnow().isoformat(),
            'messages': [],
            'context': {
                'conversation_type': conversation_type,
                'mood_indicators': [],
                'crisis_flags': [],
                'engagement_level': 'new'
            },
            'metadata': {
                'total_messages': 0,
                'last_activity': datetime.utcnow().isoformat()
            }
        }
        
        self.session_stats['total_conversations'] += 1
        
        logger.info(f"Started new conversation: {conversation_id[:8]} (type: {conversation_type})")
        
        return {
            'conversation_id': conversation_id,
            'message': starter_message,
            'type': 'assistant',
            'timestamp': datetime.utcnow().isoformat(),
            'conversation_type': conversation_type
        }
    
    def send_message(self, conversation_id: str, message: str, **kwargs) -> Dict:
        """Send a message and get response"""
        try:
            # Validate input
            if not message or not message.strip():
                return {
                    'error': 'Message cannot be empty',
                    'conversation_id': conversation_id
                }
            
            message = message.strip()
            
            # Create conversation if it doesn't exist
            if conversation_id not in self.conversations:
                logger.info(f"Creating new conversation for ID: {conversation_id[:8]}")
                self.conversations[conversation_id] = {
                    'id': conversation_id,
                    'started_at': datetime.utcnow().isoformat(),
                    'messages': [],
                    'context': {
                        'conversation_type': 'general',
                        'mood_indicators': [],
                        'crisis_flags': [],
                        'engagement_level': 'new'
                    },
                    'metadata': {
                        'total_messages': 0,
                        'last_activity': datetime.utcnow().isoformat()
                    }
                }
            
            conversation = self.conversations[conversation_id]
            
            # Store user message
            user_entry = {
                'content': message,
                'type': 'user',
                'timestamp': datetime.utcnow().isoformat()
            }
            conversation['messages'].append(user_entry)
            
            # Update conversation context
            self._update_conversation_context(conversation_id, message)
            
            # Generate response using LLM
            conversation_history = [
                {'user': msg['content'], 'assistant': ''}
                for msg in conversation['messages']
                if msg['type'] == 'user'
            ]
            
            # Add assistant responses to history
            assistant_messages = [
                msg for msg in conversation['messages']
                if msg['type'] == 'assistant'
            ]
            
            for i, user_msg in enumerate(conversation_history):
                if i < len(assistant_messages):
                    user_msg['assistant'] = assistant_messages[i]['content']
            
            # Generate LLM response
            llm_response = self.llm_model.generate_response(
                message,
                conversation_history=conversation_history[-5:],  # Keep last 5 exchanges
                **kwargs
            )
            
            # Process LLM response
            assistant_content = llm_response.get('response', 'I apologize, but I couldn\'t generate a proper response. How else can I help you?')
            
            # Store assistant response
            assistant_entry = {
                'content': assistant_content,
                'type': 'assistant',
                'timestamp': datetime.utcnow().isoformat(),
                'model_info': {
                    'model': llm_response.get('model', 'Unknown'),
                    'is_crisis': llm_response.get('is_crisis', False),
                    'generation_time': llm_response.get('response_time', 0)
                }
            }
            conversation['messages'].append(assistant_entry)
            
            # Update metadata
            conversation['metadata']['total_messages'] += 2  # User + assistant
            conversation['metadata']['last_activity'] = datetime.utcnow().isoformat()
            
            # Update session stats
            self.session_stats['total_messages'] += 2
            if llm_response.get('is_crisis', False):
                self.session_stats['crisis_interventions'] += 1
                conversation['context']['crisis_flags'].append({
                    'timestamp': datetime.utcnow().isoformat(),
                    'message': message
                })
            
            # Trim conversation if too long
            self._trim_conversation(conversation_id)
            
            logger.info(f"Generated response for conversation: {conversation_id[:8]} (crisis: {llm_response.get('is_crisis', False)})")
            
            return {
                'conversation_id': conversation_id,
                'user_message': message,
                'assistant_message': assistant_content,
                'timestamp': assistant_entry['timestamp'],
                'model_info': assistant_entry['model_info'],
                'conversation_context': conversation['context']
            }
            
        except Exception as e:
            logger.error(f"Error processing message for conversation {conversation_id}: {str(e)}")
            
            # Return error response but keep conversation alive
            error_response = {
                'conversation_id': conversation_id,
                'user_message': message,
                'assistant_message': "I apologize, but I'm experiencing some technical difficulties. Your mental health is important, and I encourage you to reach out to a mental health professional if you need immediate support.",
                'timestamp': datetime.utcnow().isoformat(),
                'error': True,
                'model_info': {
                    'model': 'Error Handler',
                    'is_crisis': False,
                    'generation_time': 0
                }
            }
            
            return error_response
    
    def _update_conversation_context(self, conversation_id: str, message: str):
        """Update conversation context based on message content"""
        conversation = self.conversations[conversation_id]
        context = conversation['context']
        
        message_lower = message.lower()
        
        # Update mood indicators
        mood_keywords = {
            'anxiety': ['anxious', 'worried', 'nervous', 'panic', 'scared'],
            'depression': ['sad', 'depressed', 'hopeless', 'empty', 'worthless'],
            'stress': ['stressed', 'overwhelmed', 'pressure', 'burden', 'exhausted'],
            'anger': ['angry', 'frustrated', 'mad', 'furious', 'irritated'],
            'positive': ['happy', 'good', 'better', 'excited', 'grateful']
        }
        
        for mood, keywords in mood_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                if mood not in context['mood_indicators']:
                    context['mood_indicators'].append(mood)
        
        # Update engagement level
        total_messages = len(conversation['messages'])
        if total_messages > 10:
            context['engagement_level'] = 'highly_active'
        elif total_messages > 5:
            context['engagement_level'] = 'active'
        elif total_messages > 2:
            context['engagement_level'] = 'engaged'
    
    def _trim_conversation(self, conversation_id: str, max_messages: int = 20):
        """Trim conversation to keep it manageable"""
        conversation = self.conversations[conversation_id]
        messages = conversation['messages']
        
        if len(messages) > max_messages:
            # Keep first message (greeting) and last N messages
            trimmed_messages = [messages[0]] + messages[-(max_messages-1):]
            conversation['messages'] = trimmed_messages
            logger.debug(f"Trimmed conversation {conversation_id[:8]} to {len(trimmed_messages)} messages")
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        """Get conversation by ID"""
        return self.conversations.get(conversation_id)
    
    def get_conversation_history(self, conversation_id: str) -> List[Dict]:
        """Get formatted conversation history"""
        conversation = self.conversations.get(conversation_id)
        if not conversation:
            return []
        
        return conversation['messages']
    
    def clear_conversation(self, conversation_id: str) -> bool:
        """Clear conversation history"""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
            logger.info(f"Cleared conversation: {conversation_id[:8]}")
            return True
        return False
    
    def list_conversations(self) -> Dict:
        """List all active conversations"""
        conversations_summary = []
        
        for conv_id, conv in self.conversations.items():
            conversations_summary.append({
                'conversation_id': conv_id,
                'started_at': conv['started_at'],
                'message_count': len(conv['messages']),
                'last_activity': conv['metadata']['last_activity'],
                'mood_indicators': conv['context']['mood_indicators'],
                'engagement_level': conv['context']['engagement_level']
            })
        
        return {
            'conversations': conversations_summary,
            'total_count': len(conversations_summary),
            'session_stats': self.session_stats
        }
    
    def get_service_status(self) -> Dict:
        """Get service status and health information"""
        model_status = {
            'initialized': self.llm_model is not None,
            'model_loaded': False,
            'model_type': self.model_type,
            'model_name': self.model_name
        }
        
        if self.llm_model:
            model_status['model_loaded'] = self.llm_model.model_loaded
            model_status['available'] = self.llm_model.is_available()
        
        return {
            'service': 'Mental Health Chatbot Service',
            'status': 'healthy' if model_status['initialized'] else 'degraded',
            'model_status': model_status,
            'active_conversations': len(self.conversations),
            'session_stats': self.session_stats,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def perform_mental_health_assessment(self, conversation_id: str) -> Dict:
        """Perform basic mental health assessment for conversation"""
        conversation = self.conversations.get(conversation_id)
        if not conversation:
            return {'error': 'Conversation not found'}
        
        context = conversation['context']
        messages = conversation['messages']
        
        # Analyze mood patterns
        mood_distribution = {}
        for mood in context['mood_indicators']:
            mood_distribution[mood] = mood_distribution.get(mood, 0) + 1
        
        # Assess engagement
        engagement_score = min(len(messages) / 10, 1.0)  # Normalize to 0-1
        
        # Check for crisis indicators
        crisis_risk = len(context['crisis_flags']) > 0
        
        # Generate recommendations
        recommendations = []
        
        if 'anxiety' in context['mood_indicators']:
            recommendations.append('Practice deep breathing and grounding exercises')
        
        if 'depression' in context['mood_indicators']:
            recommendations.append('Consider reaching out to friends, family, or a mental health professional')
        
        if 'stress' in context['mood_indicators']:
            recommendations.append('Try breaking tasks into smaller, manageable steps')
        
        if crisis_risk:
            recommendations.append('Consider contacting a crisis hotline or mental health professional immediately')
        
        if not recommendations:
            recommendations.append('Continue engaging in supportive conversations and self-care')
        
        assessment = {
            'conversation_id': conversation_id,
            'assessment_timestamp': datetime.utcnow().isoformat(),
            'mood_analysis': {
                'primary_indicators': context['mood_indicators'],
                'mood_distribution': mood_distribution,
                'engagement_level': context['engagement_level'],
                'engagement_score': engagement_score
            },
            'risk_assessment': {
                'crisis_indicators': crisis_risk,
                'crisis_count': len(context['crisis_flags']),
                'support_level_needed': 'high' if crisis_risk else 'moderate' if mood_distribution else 'low'
            },
            'recommendations': recommendations,
            'conversation_summary': {
                'total_messages': len(messages),
                'conversation_duration': conversation['started_at'],
                'last_activity': conversation['metadata']['last_activity']
            }
        }
        
        return assessment
    
    def cleanup_old_conversations(self, max_age_hours: int = 24):
        """Clean up conversations older than specified hours"""
        from datetime import datetime, timedelta
        
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        conversations_to_remove = []
        
        for conv_id, conv in self.conversations.items():
            last_activity = datetime.fromisoformat(conv['metadata']['last_activity'].replace('Z', '+00:00'))
            if last_activity < cutoff_time:
                conversations_to_remove.append(conv_id)
        
        for conv_id in conversations_to_remove:
            del self.conversations[conv_id]
        
        logger.info(f"Cleaned up {len(conversations_to_remove)} old conversations")
        return len(conversations_to_remove)