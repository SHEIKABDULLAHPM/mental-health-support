"""
Emotion-Enhanced Response System
Analyzes user sentiment/emotions and generates therapeutic responses with emojis
"""
import logging
from typing import Dict, List, Optional
import random

logger = logging.getLogger(__name__)

# Emotion-to-Emoji mapping
EMOTION_EMOJIS = {
    # Positive emotions
    "joy": ["😊", "😄", "🌟", "✨", "🎉"],
    "happy": ["😊", "😃", "💕", "🌈", "☀️"],
    "excited": ["🎉", "🚀", "⭐", "🌟", "💫"],
    "grateful": ["🙏", "💝", "🌸", "💖", "✨"],
    "peaceful": ["🕊️", "🌸", "🌺", "🌊", "🌙"],
    "confident": ["💪", "🦋", "🌟", "✨", "👑"],
    "love": ["💕", "💖", "❤️", "💝", "🌹"],
    
    # Challenging emotions
    "anxiety": ["🫂", "🌿", "💚", "🌊", "🕊️"],
    "anxious": ["🫂", "🌿", "💚", "🌊", "🕊️"],
    "stressed": ["🌿", "💆", "🧘", "🌊", "💚"],
    "sad": ["🫂", "💙", "🌧️", "🌈", "💚"],
    "depression": ["🫂", "💙", "🌈", "🌟", "💚"],
    "angry": ["🌊", "🍃", "💚", "🌿", "🕊️"],
    "frustrated": ["💆", "🌊", "🌿", "💚", "🫂"],
    "lonely": ["🫂", "💕", "🌟", "💙", "🌈"],
    "overwhelmed": ["🫂", "🌿", "💆", "🌊", "💚"],
    "fear": ["🫂", "💪", "🌟", "💚", "🕊️"],
    
    # Neutral/Mixed
    "confused": ["🤔", "💭", "🌿", "💡", "✨"],
    "tired": ["💆", "🌙", "🌿", "💤", "☕"],
    "hopeful": ["🌈", "🌟", "✨", "🌱", "💫"],
    "neutral": ["🌿", "💚", "🌸", "🌊", "✨"],
}

# Therapeutic response templates with emotion awareness
EMOTION_RESPONSES = {
    "anxiety": {
        "opening": [
            "Hi there, {name} here 🫂 I can sense you're feeling anxious.",
            "Hey friend, it's {name} 💚 Anxiety can feel overwhelming, can't it?",
            "{name} here 🌿 I hear that you're experiencing anxiety.",
        ],
        "validation": [
            "Your feelings are completely valid 💙",
            "It's okay to feel this way - anxiety is a natural response 🌊",
            "You're not alone in this feeling 🫂",
        ],
        "techniques": [
            "Let's try a quick grounding exercise: Name 5 things you can see right now 👀",
            "Take a slow breath with me - in for 4, hold for 4, out for 6 🌬️",
            "What's one thing within your control right now? Let's focus there 🎯",
        ],
        "encouragement": [
            "You've got this, one moment at a time 💪✨",
            "This feeling is temporary - like clouds passing through the sky ☁️",
            "I'm here with you through this 🫂💚",
        ]
    },
    "depression": {
        "opening": [
            "{name} here 💙 I can feel the heaviness in your words.",
            "Hi, it's {name} 🫂 Depression makes everything harder, doesn't it?",
            "Hey there, {name} here 💚 Thank you for sharing this with me.",
        ],
        "validation": [
            "What you're feeling is real and it matters 💙",
            "Depression is not your fault - it's an illness, not a weakness 🫂",
            "You're incredibly brave for reaching out 💪",
        ],
        "techniques": [
            "What's one tiny thing that brought you even a moment of comfort today? 🌸",
            "Can you do one small self-care act right now? Even washing your face counts 💧",
            "Let's break this down: what's one manageable step for today? 🌱",
        ],
        "encouragement": [
            "You matter, even when it doesn't feel like it 💖",
            "Getting through today is enough - you're doing better than you think 🌟",
            "I believe in your strength, even when you can't feel it 💪✨",
        ]
    },
    "stress": {
        "opening": [
            "{name} here 🌿 I can hear the stress in your message.",
            "Hey, it's {name} 💚 Sounds like you're juggling a lot right now.",
            "Hi friend, {name} here 🌊 Stress is your body's alarm system going off.",
        ],
        "validation": [
            "It makes perfect sense that you're feeling stressed 💚",
            "You're dealing with a lot - it's okay to feel overwhelmed 🫂",
            "Stress is exhausting, and you're still showing up 💪",
        ],
        "techniques": [
            "Let's prioritize: What's the ONE most urgent thing? 🎯",
            "Try the 5-5-5 rule: Will this matter in 5 hours? 5 days? 5 years? 🤔",
            "Can you take 2 minutes for a body scan? Notice where tension lives 🧘",
        ],
        "encouragement": [
            "You're stronger than this stress 💪🌟",
            "One task at a time - you've got this 🚀",
            "Progress over perfection, always 🌈✨",
        ]
    },
    "happy": {
        "opening": [
            "{name} here! 😊 I can feel the positive energy!",
            "Hey! It's {name} 🌟 Your happiness is contagious!",
            "Hi there! {name} here 🎉 Love seeing you in good spirits!",
        ],
        "validation": [
            "It's wonderful to hear you're feeling good! 😄",
            "Celebrate this feeling - you deserve happiness 🎉",
            "Your joy is beautiful! ✨",
        ],
        "techniques": [
            "Let's savor this moment - what made this happen? 🌟",
            "Capture this feeling - what does happiness feel like in your body? 💫",
            "Share the joy! Who could you spread this positivity to? 🌈",
        ],
        "encouragement": [
            "Keep this energy going! 🚀✨",
            "You're radiating positivity! 🌟💖",
            "Beautiful to see you thriving! 🌸😊",
        ]
    },
    "neutral": {
        "opening": [
            "Hi, it's {name} here 🌿 How can I support you today?",
            "Hey there! {name} here 💚 I'm listening.",
            "{name} here 🌸 What's on your mind?",
        ],
        "validation": [
            "Thank you for reaching out 💚",
            "I'm here for whatever you need 🫂",
            "Your thoughts and feelings matter ✨",
        ],
        "techniques": [
            "Let's explore this together 🤔",
            "What would be most helpful right now? 💭",
            "Tell me more about what you're experiencing 🌊",
        ],
        "encouragement": [
            "I'm here with you 🫂💚",
            "We'll work through this together 🌟",
            "You're not alone in this 💕",
        ]
    }
}

# Quick coping strategies by emotion
COPING_STRATEGIES = {
    "anxiety": [
        "🌬️ **4-7-8 Breathing**: Breathe in for 4, hold for 7, out for 8",
        "🔢 **5-4-3-2-1 Grounding**: Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste",
        "💭 **Thought Challenge**: Is this thought a fact or a feeling?",
        "🚶 **Movement**: A 5-minute walk can shift your nervous system",
    ],
    "depression": [
        "☀️ **Sunlight**: Even 10 minutes outside can help",
        "💧 **Hydration**: Sometimes low mood is partly dehydration",
        "📝 **Micro-goals**: One tiny achievable task (make bed, brush teeth)",
        "🎵 **Music**: A song that usually lifts you, even slightly",
    ],
    "stress": [
        "📋 **Brain Dump**: Write everything down to clear mental space",
        "⏰ **Time Blocking**: 25 min focus, 5 min break (Pomodoro)",
        "🎯 **Priority Matrix**: Urgent vs Important - focus there",
        "🧘 **Progressive Relaxation**: Tense and release each muscle group",
    ],
    "anger": [
        "🥊 **Physical Release**: Punch a pillow, stomp your feet",
        "🧊 **Ice Cube Technique**: Hold ice to cool your nervous system",
        "📝 **Rage Writing**: Write uncensored, then tear it up",
        "🚶 **Walk It Out**: Vigorous movement to process the energy",
    ],
}


class EmotionEnhancer:
    """Enhance responses with emotion-aware content and emojis"""
    
    def __init__(self, bot_name: str = "Streaky"):
        self.bot_name = bot_name
        
    def detect_primary_emotion(self, sentiment_result: Optional[Dict] = None, user_text: str = "") -> str:
        """Detect primary emotion from sentiment analysis or text"""
        if sentiment_result:
            # From VADER or sentiment analysis
            label = sentiment_result.get("label", "").lower()
            
            # Map sentiment labels to emotions
            if "anxiety" in label or "anxious" in label:
                return "anxiety"
            elif "depress" in label or "sad" in label:
                return "depression"
            elif "stress" in label:
                return "stress"
            elif "happy" in label or "joy" in label or "positive" in label:
                return "happy"
            elif "anger" in label or "angry" in label:
                return "anger"
        
        # Fallback: keyword detection in user text
        text_lower = user_text.lower()
        
        emotion_keywords = {
            "anxiety": ["anxious", "anxiety", "nervous", "worried", "panic", "fear"],
            "depression": ["depressed", "depression", "sad", "hopeless", "empty", "numb"],
            "stress": ["stressed", "stress", "overwhelmed", "pressure", "too much"],
            "happy": ["happy", "joy", "excited", "great", "wonderful", "amazing"],
            "anger": ["angry", "mad", "furious", "frustrated", "annoyed"],
        }
        
        for emotion, keywords in emotion_keywords.items():
            if any(kw in text_lower for kw in keywords):
                return emotion
        
        return "neutral"
    
    def get_emotion_emoji(self, emotion: str, count: int = 1) -> str:
        """Get random emojis for an emotion"""
        emojis = EMOTION_EMOJIS.get(emotion, EMOTION_EMOJIS["neutral"])
        selected = random.sample(emojis, min(count, len(emojis)))
        return " ".join(selected)
    
    def build_therapeutic_response(
        self,
        user_text: str,
        llm_response: str,
        sentiment_result: Optional[Dict] = None,
        include_coping: bool = True,
    ) -> str:
        """Build emotion-aware therapeutic response with emojis"""
        
        # Detect emotion
        emotion = self.detect_primary_emotion(sentiment_result, user_text)
        
        # Get response templates
        templates = EMOTION_RESPONSES.get(emotion, EMOTION_RESPONSES["neutral"])
        
        # Build response parts
        parts = []
        
        # 1. Opening with Streaky name
        opening = random.choice(templates["opening"]).format(name=self.bot_name)
        parts.append(opening)
        
        # 2. Validation
        validation = random.choice(templates["validation"])
        parts.append(validation)
        
        # 3. Core LLM response (enhanced with emojis)
        enhanced_llm = self._add_emojis_to_response(llm_response, emotion)
        parts.append(enhanced_llm)
        
        # 4. Technique/Strategy (if appropriate)
        if emotion in ["anxiety", "depression", "stress"] and random.random() < 0.7:
            technique = random.choice(templates["techniques"])
            parts.append(technique)
        
        # 5. Coping strategy (optional)
        if include_coping and emotion in COPING_STRATEGIES and random.random() < 0.5:
            strategy = random.choice(COPING_STRATEGIES[emotion])
            parts.append(f"\n💡 **Quick Tip**: {strategy}")
        
        # 6. Encouragement
        encouragement = random.choice(templates["encouragement"])
        parts.append(encouragement)
        
        # Combine with proper spacing
        response = "\n\n".join(parts)
        
        return response
    
    def _add_emojis_to_response(self, text: str, emotion: str) -> str:
        """Add contextual emojis to LLM response"""
        if not text:
            return text
        
        # Get emotion-specific emoji
        emoji = self.get_emotion_emoji(emotion, count=1)
        
        # Add emoji at strategic points
        sentences = text.split(". ")
        
        if len(sentences) > 2:
            # Add emoji to middle and end
            sentences[-1] = f"{sentences[-1]} {emoji}"
        elif len(sentences) > 0:
            # Add emoji to end
            sentences[-1] = f"{sentences[-1]} {emoji}"
        
        return ". ".join(sentences)
    
    def create_quick_response(self, emotion: str, user_name: Optional[str] = None) -> str:
        """Generate instant response for common emotions (< 100ms)"""
        templates = EMOTION_RESPONSES.get(emotion, EMOTION_RESPONSES["neutral"])
        
        opening = random.choice(templates["opening"]).format(name=self.bot_name)
        validation = random.choice(templates["validation"])
        technique = random.choice(templates["techniques"])
        encouragement = random.choice(templates["encouragement"])
        
        emoji = self.get_emotion_emoji(emotion, count=2)
        
        response = f"{opening}\n\n{validation}\n\n{technique}\n\n{encouragement} {emoji}"
        
        return response
    
    def get_affirmation(self, emotion: str) -> str:
        """Get emotion-specific affirmation"""
        affirmations = {
            "anxiety": [
                "🌊 I am safe in this moment",
                "🌿 I breathe in calm, I breathe out tension",
                "💚 This feeling will pass, I am okay",
                "🕊️ I trust myself to handle whatever comes",
            ],
            "depression": [
                "💙 I am worthy of love and care",
                "🌟 My feelings are valid, I am enough",
                "🌈 This darkness is temporary, light exists",
                "💪 I am stronger than I realize",
            ],
            "stress": [
                "🌿 I can only do my best, and that's enough",
                "🌊 I release what I cannot control",
                "💚 I prioritize my wellbeing",
                "✨ Progress, not perfection",
            ],
            "happy": [
                "🌟 I deserve this happiness",
                "✨ I embrace this joy fully",
                "🎉 I celebrate my wins, big and small",
                "💖 My happiness matters",
            ],
        }
        
        return random.choice(affirmations.get(emotion, ["💚 I am doing my best"]))


# Global instance
enhancer = EmotionEnhancer(bot_name="Streaky")


def enhance_response(
    user_text: str,
    llm_response: str,
    sentiment_result: Optional[Dict] = None,
    quick_mode: bool = False,
) -> str:
    """
    Main function to enhance responses with emotion intelligence
    
    Args:
        user_text: User's input message
        llm_response: Raw LLM-generated response
        sentiment_result: Sentiment analysis result (VADER/custom)
        quick_mode: Use quick template responses for speed
    
    Returns:
        Enhanced therapeutic response with emojis and emotion awareness
    """
    if quick_mode:
        # Ultra-fast response using templates
        emotion = enhancer.detect_primary_emotion(sentiment_result, user_text)
        return enhancer.create_quick_response(emotion)
    else:
        # Full enhanced response with LLM content
        return enhancer.build_therapeutic_response(
            user_text=user_text,
            llm_response=llm_response,
            sentiment_result=sentiment_result,
            include_coping=True,
        )


def get_streaky_greeting() -> str:
    """Get Streaky's greeting message"""
    greetings = [
        "Hey there! I'm Streaky 🌟 your mental health companion. How are you feeling today?",
        "Hi! It's Streaky here 💚 I'm here to listen and support you. What's on your mind?",
        "Hello friend! Streaky here 🫂 I'm here for you. How can I help today?",
        "Hey! I'm Streaky 🌿 your therapeutic buddy. Tell me, how are you doing?",
    ]
    return random.choice(greetings)
