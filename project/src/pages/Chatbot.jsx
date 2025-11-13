import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Send, Bot, User, Heart, Lightbulb, MessageCircle, Mic, MicOff, Volume2, VolumeX, Globe, Loader2, AlertTriangle, Brain } from 'lucide-react';
import { chatbotAPI, sentimentAPI } from '../services/api';
import SentimentCard from '../components/SentimentCard';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [personalityType, setPersonalityType] = useState('balanced');
  const [chatMode, setChatMode] = useState('therapeutic'); // therapeutic | emotional | informational
  
  // MentaLLaMA integration states
  const [conversationId, setConversationId] = useState(null);
  const [mlServiceStatus, setMlServiceStatus] = useState('checking');
  const [chatModel, setChatModel] = useState(null);
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  const [llmServiceAvailable, setLlmServiceAvailable] = useState(false);
  
  // Enhanced conversation context tracking
  const [conversationContext, setConversationContext] = useState(null);
  const [showContextPanel, setShowContextPanel] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const languages = useMemo(() => [
    { code: 'english', name: 'English', flag: '🇺🇸', voice: 'en-US' },
    { code: 'hindi', name: 'हिंदी', flag: '🇮🇳', voice: 'hi-IN' },
    { code: 'tamil', name: 'தமிழ்', flag: '🇮🇳', voice: 'ta-IN' },
    { code: 'telugu', name: 'తెలుగు', flag: '🇮🇳', voice: 'te-IN' },
    { code: 'kannada', name: 'ಕನ್ನಡ', flag: '🇮🇳', voice: 'kn-IN' },
    { code: 'malayalam', name: 'മലയാളം', flag: '🇮🇳', voice: 'ml-IN' },
    { code: 'bengali', name: 'বাংলা', flag: '🇮🇳', voice: 'bn-IN' },
    { code: 'gujarati', name: 'ગુજરાતી', flag: '🇮🇳', voice: 'gu-IN' },
    { code: 'marathi', name: 'मराठी', flag: '🇮🇳', voice: 'mr-IN' },
    { code: 'punjabi', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳', voice: 'pa-IN' },
    { code: 'urdu', name: 'اردو', flag: '🇮🇳', voice: 'ur-IN' },
    { code: 'spanish', name: 'Español', flag: '🇪🇸', voice: 'es-ES' },
    { code: 'french', name: 'Français', flag: '🇫🇷', voice: 'fr-FR' },
    { code: 'german', name: 'Deutsch', flag: '🇩🇪', voice: 'de-DE' },
    { code: 'chinese', name: '中文', flag: '🇨🇳', voice: 'zh-CN' },
    { code: 'japanese', name: '日本語', flag: '🇯🇵', voice: 'ja-JP' },
    { code: 'korean', name: '한국어', flag: '🇰🇷', voice: 'ko-KR' },
    { code: 'arabic', name: 'العربية', flag: '🇸🇦', voice: 'ar-SA' },
    { code: 'russian', name: 'Русский', flag: '🇷🇺', voice: 'ru-RU' },
    { code: 'portuguese', name: 'Português', flag: '🇧🇷', voice: 'pt-BR' },
  ], []);

  const getWelcomeMessage = useCallback(() => {
    const welcomeMessages = {
      english: "Hey there! I'm Streaky 🌟 your mental health companion. I'm here to listen, support, and help you navigate your emotions with empathy and understanding. How are you feeling today?",
      hindi: "नमस्ते! मैं आपका व्यक्तिगत उपचार साथी हूं, आपकी कल्याण यात्रा में 24/7 सहायता के लिए उपलब्ध हूं। मैं यहां सुनने, मार्गदर्शन करने और आपको शांति पाने में मदद करने के लिए हूं। आज आप कैसा महसूस कर रहे हैं?",
      tamil: "வணக்கம்! நான் உங்கள் தனிப்பட்ட குணப்படுத்தும் துணை, உங்கள் நல்வாழ்வு பயணத்தில் 24/7 ஆதரவு வழங்க கிடைக்கிறேன். நான் கேட்க, வழிகாட்ட மற்றும் அமைதி கண்டுபிடிக்க உதவ இங்கே இருக்கிறேன். இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?",
      telugu: "నమస్కారం! నేను మీ వ్యక్తిగత వైద్య సహాయకుడిని, మీ సంక్షేమ ప్రయాణంలో 24/7 మద్దతు అందించడానికి అందుబాటులో ఉన్నాను. నేను వినడానికి, మార్గదర్శనం చేయడానికి మరియు శాంతిని కనుగొనడంలో సహాయం చేయడానికి ఇక్కడ ఉన్నాను. ఈరోజు మీరు ఎలా అనుభవిస్తున్నారు?",
      kannada: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಗುಣಪಡಿಸುವ ಸಹಚರ, ನಿಮ್ಮ ಯೋಗಕ್ಷೇಮ ಪ್ರಯಾಣದಲ್ಲಿ 24/7 ಬೆಂಬಲ ನೀಡಲು ಲಭ್ಯವಿದ್ದೇನೆ. ನಾನು ಕೇಳಲು, ಮಾರ್ಗದರ್ಶನ ನೀಡಲು ಮತ್ತು ಶಾಂತಿ ಕಂಡುಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ. ಇಂದು ನೀವು ಹೇಗೆ ಅನುಭವಿಸುತ್ತಿದ್ದೀರಿ?",
      malayalam: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ വ്യക്തിഗത രോഗശാന്തി കൂട്ടാളിയാണ്, നിങ്ങളുടെ ക്ഷേമ യാത്രയിൽ 24/7 പിന്തുണ നൽകാൻ ലഭ്യമാണ്. കേൾക്കാനും, മാർഗനിർദേശം നൽകാനും, സമാധാനം കണ്ടെത്താൻ സഹായിക്കാനും ഞാൻ ഇവിടെയുണ്ട്. ഇന്ന് നിങ്ങൾക്ക് എങ്ങനെ തോന്നുന്നു?",
      bengali: "নমস্কার! আমি আপনার ব্যক্তিগত নিরাময় সহচর, আপনার কল্যাণ যাত্রায় ২৪/৭ সহায়তা প্রদানের জন্য উপলব্ধ। আমি শুনতে, গাইড করতে এবং শান্তি খুঁজে পেতে সাহায্য করতে এখানে আছি। আজ আপনি কেমন অনুভব করছেন?",
      gujarati: "નમસ્તે! હું તમારો વ્યક્તિગત ઉપચાર સાથી છું, તમારી કલ્યાણ યાત્રામાં 24/7 સહાય પૂરી પાડવા માટે ઉપલબ્ધ છું. હું સાંભળવા, માર્ગદર્શન આપવા અને શાંતિ શોધવામાં મદદ કરવા અહીં છું. આજે તમે કેવું લાગે છે?",
      marathi: "नमस्कार! मी तुमचा वैयक्तिक उपचार सहकारी आहे, तुमच्या कल्याणाच्या प्रवासात 24/7 समर्थन प्रदान करण्यासाठी उपलब्ध आहे. मी ऐकण्यासाठी, मार्गदर्शन करण्यासाठी आणि शांती शोधण्यात मदत करण्यासाठी येथे आहे. आज तुम्हाला कसे वाटते?",
      punjabi: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਨਿੱਜੀ ਇਲਾਜ ਸਾਥੀ ਹਾਂ, ਤੁਹਾਡੇ ਸਿਹਤ ਦੇ ਸਫ਼ਰ ਵਿੱਚ 24/7 ਸਹਾਇਤਾ ਪ੍ਰਦਾਨ ਕਰਨ ਲਈ ਉਪਲਬਧ ਹਾਂ। ਮੈਂ ਸੁਣਨ, ਮਾਰਗਦਰਸ਼ਨ ਕਰਨ ਅਤੇ ਸ਼ਾਂਤੀ ਪਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰਨ ਲਈ ਇੱਥੇ ਹਾਂ। ਅੱਜ ਤੁਸੀਂ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ?",
      urdu: "آداب! میں آپ کا ذاتی شفا یابی کا ساتھی ہوں، آپ کے فلاح و بہبود کے سفر میں 24/7 مدد فراہم کرنے کے لیے دستیاب ہوں۔ میں سننے، رہنمائی کرنے اور سکون تلاش کرنے میں مدد کے لیے یہاں ہوں۔ آج آپ کیسا محسوس کر رہے ہیں؟",
      spanish: "¡Hola! Soy tu compañero personal de sanación, disponible 24/7 para apoyarte en tu viaje de bienestar. Estoy aquí para escuchar, guiar y ayudarte a encontrar paz. ¿Cómo te sientes hoy?",
      french: "Bonjour! Je suis votre compagnon personnel de guérison, disponible 24h/24 et 7j/7 pour vous soutenir dans votre parcours de bien-être. Je suis là pour écouter, guider et vous aider à trouver la paix. Comment vous sentez-vous aujourd'hui?",
      german: "Hallo! Ich bin dein persönlicher Heilungsbegleiter, 24/7 verfügbar, um dich auf deiner Wellness-Reise zu unterstützen. Ich bin hier, um zuzuhören, zu leiten und dir zu helfen, Frieden zu finden. Wie fühlst du dich heute?",
      chinese: "你好！我是你的个人康复伴侣，全天候为你的健康之旅提供支持。我在这里倾听、指导并帮助你找到内心的平静。你今天感觉如何？",
      japanese: "こんにちは！私はあなたの個人的な癒しのパートナーで、あなたの健康な旅を24時間年中無休でサポートします。私は聞いて、導いて、平安を見つけるお手伝いをするためにここにいます。今日はいかがお過ごしですか？",
      korean: "안녕하세요! 저는 당신의 개인적인 치유 동반자로, 당신의 웰니스 여정에서 24시간 연중무휴로 지원하기 위해 여기 있습니다. 저는 듣고, 안내하며, 평화를 찾도록 도와주기 위해 여기 있습니다. 오늘 기분이 어떠신가요?",
      arabic: "مرحباً! أنا رفيقك الشخصي للشفاء، متاح على مدار الساعة طوال أيام الأسبوع لدعمك في رحلة العافية. أنا هنا للاستماع والإرشاد ومساعدتك في العثور على السلام. كيف تشعر اليوم؟",
      russian: "Привет! Я ваш личный спутник исцеления, доступный 24/7 для поддержки в вашем путешествии к благополучию. Я здесь, чтобы слушать, направлять и помогать вам найти покой. Как вы себя чувствуете сегодня?",
      portuguese: "Olá! Eu sou seu companheiro pessoal de cura, disponível 24/7 para apoiá-lo em sua jornada de bem-estar. Estou aqui para ouvir, orientar e ajudá-lo a encontrar paz. Como você se sente hoje?"
    };

    return welcomeMessages[selectedLanguage] || welcomeMessages.english;
  }, [selectedLanguage]);

  // Initialize ML service and check health
  useEffect(() => {
    const checkServices = async () => {
      try {
        setMlServiceStatus('checking');
        
        // Check LLM service first
        const llmHealth = await chatbotAPI.checkLLMHealth();
        if (llmHealth.status === 'success') {
          setMlServiceStatus('connected');
          setLlmServiceAvailable(true);
          
          try {
            const modelInfo = await chatbotAPI.getChatInfo();
            if (modelInfo && modelInfo.model_status) {
              setChatModel(modelInfo.model_status.model_name || 'LLM Assistant');
            } else {
              setChatModel('LLM Assistant');
            }
          } catch (error) {
            console.log('Model info not available, using default name');
            setChatModel('LLM Assistant');
          }
          return;
        }
        
        // Fallback to legacy health check
        const healthData = await chatbotAPI.checkHealth();
        if (healthData.status === 'healthy') {
          setMlServiceStatus('connected');
          setLlmServiceAvailable(false);
          
          try {
            const chatInfo = await chatbotAPI.getChatInfo();
            if (chatInfo && chatInfo.model) {
              setChatModel(chatInfo.model);
            } else {
              setChatModel('MentaLLaMA-7B');
            }
          } catch (error) {
            console.log('Chat info not available, using default model name');
            setChatModel('AI Assistant');
          }
        } else {
          setMlServiceStatus('offline');
          setLlmServiceAvailable(false);
        }
      } catch (error) {
        console.error('Service check failed:', error);
        setMlServiceStatus('offline');
        setLlmServiceAvailable(false);
      }
    };

    checkServices();
    
    // Check every 30 seconds
    const interval = setInterval(checkServices, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Load personality type from localStorage
    const savedPersonality = localStorage.getItem('mindpeace-personality');
    if (savedPersonality) {
      const personality = JSON.parse(savedPersonality);
      setPersonalityType(personality.chatbotPersonality || 'balanced');
    }

    // Initialize conversation ID
  const newConversationId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setConversationId(newConversationId);

    // Initialize with welcome message
    const welcomeMessage = getWelcomeMessage();
    setMessages([{
      id: 1,
      text: welcomeMessage,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      type: 'greeting'
    }]);

    // Try to initialize LLM conversation (delayed to allow service status to be determined)
    const initializeLLMConversation = async () => {
      try {
  const startResponse = await chatbotAPI.startConversation('greeting', chatMode);
        if (startResponse.conversationId) {
          setConversationId(startResponse.conversationId);
          
          // Optionally update welcome message with LLM-generated one
          if (startResponse.message && startResponse.message !== welcomeMessage) {
            setMessages([{
              id: 1,
              text: startResponse.message,
              sender: 'bot',
              timestamp: startResponse.timestamp,
              type: 'greeting',
              isAIGenerated: true
            }]);
          }
        }
      } catch (error) {
        console.log('Could not initialize LLM conversation, using default setup');
      }
    };

    // Delay LLM initialization to allow service status check
    setTimeout(initializeLLMConversation, 2000);

    // Initialize speech recognition
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = languages.find(l => l.code === selectedLanguage)?.voice || 'en-US';

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    } catch (error) {
      console.warn('Speech recognition initialization failed:', error);
      // Speech recognition will not be available, but app will continue to work
    }

    // Initialize speech synthesis
    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [selectedLanguage, languages, getWelcomeMessage, chatMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const personalityResponses = {
    analytical: {
      anxiety: [
        "I understand you're experiencing anxiety. Let's approach this systematically. Can you identify the specific triggers? Breaking down the problem into manageable parts often helps reduce overwhelming feelings.",
        "Anxiety often stems from uncertainty. Let's create a structured plan to address your concerns. What specific aspects are causing you the most worry right now?"
      ],
      motivation: [
        "Motivation comes from clear goals and measurable progress. Let's define what success looks like for you and create actionable steps to get there.",
        "I believe in your ability to achieve your goals. Let's analyze what's worked for you before and build a systematic approach to maintain motivation."
      ],
      default: [
        "Let's examine this situation objectively. What specific outcomes are you hoping to achieve, and what steps can we take to get there?",
        "I'm here to help you think through this logically. What information do you need to make the best decision for your wellbeing?"
      ]
    },
    empathetic: {
      anxiety: [
        "I can hear that you're struggling with anxiety, and I want you to know that your feelings are completely valid. You're not alone in this - many people experience anxiety, and it's okay to feel this way.",
        "Anxiety can feel so overwhelming, but please remember that you're stronger than you know. I'm here to support you through this. What would feel most helpful right now?"
      ],
      motivation: [
        "I believe in you and your ability to overcome challenges. Sometimes we all need a gentle reminder of our own strength. What has motivated you in the past?",
        "You've come so far already, and that takes real courage. Let's focus on the progress you've made and how we can build on that foundation."
      ],
      default: [
        "Thank you for sharing this with me. I can sense that this is important to you, and I'm honored that you trust me with your thoughts and feelings.",
        "Your feelings matter, and so do you. I'm here to listen and support you in whatever way feels most helpful."
      ]
    },
    creative: {
      anxiety: [
        "Anxiety can feel like a storm, but remember that storms pass and often bring beautiful rainbows. Let's explore some creative ways to express and release these feelings.",
        "Sometimes our minds need a different kind of outlet. Have you tried channeling these feelings into something creative? Art, music, or writing can be powerful healing tools."
      ],
      motivation: [
        "Motivation is like a spark - sometimes we need to nurture it with new experiences and creative expression. What inspires your soul?",
        "Let's think outside the box. What unconventional approaches might reignite your passion and drive?"
      ],
      default: [
        "Every challenge is an opportunity for creative problem-solving. What unique perspective can you bring to this situation?",
        "Life is like a canvas, and you're the artist. What colors would you like to add to your story today?"
      ]
    },
    mindful: {
      anxiety: [
        "Anxiety often pulls us into the future or past. Let's return to this present moment together. Take a deep breath and notice what you can feel, hear, and see right now.",
        "In this moment of anxiety, remember that thoughts are like clouds - they come and go. You are the sky, vast and unchanging. What do you notice when you observe your thoughts without judgment?"
      ],
      motivation: [
        "True motivation comes from alignment with your deeper purpose. What brings meaning to your life? Let's explore what your heart is calling you toward.",
        "Sometimes we lose motivation when we're disconnected from our inner wisdom. What does your intuition tell you about your next steps?"
      ],
      default: [
        "In this moment, you have everything you need. Let's pause and connect with your inner wisdom. What is your heart telling you?",
        "Every experience, even difficult ones, offers an opportunity for growth and deeper understanding. What might this situation be teaching you?"
      ]
    },
    balanced: {
      anxiety: [
        "Anxiety is a natural human response, and it's okay to feel this way. Let's explore both practical coping strategies and emotional support to help you find balance.",
        "I hear that you're experiencing anxiety. Let's work together to find a combination of techniques that address both your immediate needs and long-term wellbeing."
      ],
      motivation: [
        "Motivation naturally ebbs and flows. Let's explore what's contributing to this feeling and find a balanced approach to reigniting your drive.",
        "Finding motivation is about balancing self-compassion with gentle action. What small step could you take today that honors both your needs and your goals?"
      ],
      default: [
        "Thank you for sharing this with me. Let's explore this together and find an approach that feels right for you.",
        "I'm here to support you in finding balance and clarity. What feels most important to address right now?"
      ]
    }
  };

  const getBotResponse = async (userMessage) => {
    try {
      // If ML service is available, use LLM service with enhanced context
      if (mlServiceStatus === 'connected') {
        setIsProcessingMessage(true);
        
        // If no conversation ID, try to start a new conversation
        if (!conversationId) {
          try {
            const startResponse = await chatbotAPI.startConversation('greeting');
            setConversationId(startResponse.conversationId);
            console.log('✓ Started new conversation:', startResponse.conversationId);
          } catch (error) {
            console.warn('Failed to start conversation, continuing with message:', error);
          }
        }
        
        // Map personality to temperature and chat mode
        const temperatureMap = {
          creative: 0.9,
          analytical: 0.5,
          empathetic: 0.8,
          mindful: 0.7,
          balanced: 0.7
        };
        
        const modeMap = {
          therapeutic: 'therapeutic',
          emotional: 'emotional',
          informational: 'informational'
        };
        
        const temperature = temperatureMap[personalityType] || 0.7;
        const mode = modeMap[chatMode] || chatMode;
        
        // Enhanced request with full context
        const response = await chatbotAPI.sendMessage(userMessage, conversationId, {
          maxLength: 512,  // Increased for more detailed responses
          temperature: temperature,
          mode: mode,
          personalityType: personalityType,
          language: selectedLanguage
        });
        
        // Update conversation ID if new one was created
        if (response.conversationId && response.conversationId !== conversationId) {
          setConversationId(response.conversationId);
          console.log('✓ Conversation ID updated:', response.conversationId);
        }
        
        setIsProcessingMessage(false);
        
        // Log model info for debugging and quality monitoring
        if (response.model) {
          console.log(`✓ Response from: ${response.model} (mode: ${mode}, temp: ${temperature})`);
        }
        
        // Handle crisis detection
        if (response.metadata?.is_crisis) {
          console.warn('⚠ Crisis detected in conversation');
        }
        
        // Handle context awareness
        if (response.context) {
          console.log('✓ Conversation context:', {
            moodIndicators: response.context.mood_indicators,
            engagementLevel: response.context.engagement_level
          });
          
          // Update conversation context state for UI display
          setConversationContext(response.context);
        }
        
        return response.message;
      }
    } catch (error) {
      console.error('❌ LLM response error:', error);
      setIsProcessingMessage(false);
      
      // Enhanced error handling with user-friendly message
      if (error.message?.includes('timeout')) {
        console.log('⏱ Request timeout - using fallback response');
      } else if (error.message?.includes('fetch')) {
        console.log('🔌 Backend connection failed - using fallback response');
      }
    }

    // Enhanced fallback to personality-based responses
    console.log('→ Using personality-based fallback response');
    const message = userMessage.toLowerCase();
    const responses = personalityResponses[personalityType] || personalityResponses.balanced;
    
    if (message.includes('anxious') || message.includes('anxiety') || message.includes('worried') || message.includes('stress')) {
      return responses.anxiety[Math.floor(Math.random() * responses.anxiety.length)];
    } else if (message.includes('motivat') || message.includes('inspire') || message.includes('encourage')) {
      return responses.motivation[Math.floor(Math.random() * responses.motivation.length)];
    } else {
      return responses.default[Math.floor(Math.random() * responses.default.length)];
    }
  };

  const speakMessage = (text) => {
    if (!voiceEnabled || !synthRef.current) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const selectedLang = languages.find(l => l.code === selectedLanguage);
    
    if (selectedLang) {
      utterance.lang = selectedLang.voice;
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (!recognitionRef.current) return;

    setIsListening(true);
    recognitionRef.current.lang = languages.find(l => l.code === selectedLanguage)?.voice || 'en-US';
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      synthRef.current?.cancel();
      setIsSpeaking(false);
    } else {
      setVoiceEnabled(!voiceEnabled);
    }
  };

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    const msgId = Date.now();
    const userMessage = {
      id: msgId,
      text: messageText,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Start response time tracking
    const startTime = performance.now();

    // ⭐ EMOTION ENHANCEMENT: Get sentiment BEFORE sending to bot
    let userSentiment = null;
    try {
      const sentimentResult = await sentimentAPI.analyzeText(messageText, 'vader', { extractKeywords: true });
      userSentiment = sentimentResult;
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, sentiment: sentimentResult } : m));
      
      // Check for critical mental health indicators
      if (sentimentResult.label && sentimentResult.label.toLowerCase().includes('suicidal')) {
        console.warn('🚨 CRITICAL: Suicidal sentiment detected');
      }
    } catch (err) {
      console.warn('Sentiment analysis failed:', err);
    }

    try {
      // Show typing indicator immediately
      const typingMsg = {
        id: 'typing',
        text: '...',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isTyping: true
      };
      setMessages(prev => [...prev, typingMsg]);

      // ⭐ EMOTION ENHANCEMENT: Configure temperature and mode
      const temperatureMap = {
        creative: 0.9,
        analytical: 0.5,
        empathetic: 0.8,
        mindful: 0.7,
        balanced: 0.7
      };
      
      const modeMap = {
        therapeutic: 'therapeutic',
        emotional: 'emotional',
        informational: 'informational'
      };
      
      const temperature = temperatureMap[personalityType] || 0.7;
      const mode = modeMap[chatMode] || chatMode;
      
      const response = await chatbotAPI.sendMessage(userMessage.text, conversationId, {
        maxLength: 512,
        temperature: temperature,
        mode: mode,
        personalityType: personalityType,
        language: selectedLanguage,
        sentiment: userSentiment  // ⭐ Pass sentiment to backend
      });
      
      // Get bot response text
      const botResponseText = response.message || 'I apologize, but I encountered an issue. How else can I help you?';
      
      // Calculate response time
      const responseTime = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`⚡ Streaky responded in ${responseTime}s`);

      // Remove typing indicator and add actual response
      setMessages(prev => prev.filter(m => m.id !== 'typing'));
      
      const botResponse = {
        id: Date.now() + 1,
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isAIGenerated: mlServiceStatus === 'connected',
        responseTime: `${responseTime}s`,
        emotion: response.emotion  // ⭐ Store detected emotion
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);

      // Speak the response if voice is enabled
      if (voiceEnabled) {
        setTimeout(() => speakMessage(botResponse.text), 300);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== 'typing'));
      
      // Error fallback response
      const errorResponse = {
        id: Date.now() + 1,
        text: selectedLanguage === 'es' ? 'Lo siento, ha ocurrido un error. ¿Podrías intentarlo de nuevo?' :
              selectedLanguage === 'fr' ? 'Désolé, une erreur s\'est produite. Pourriez-vous réessayer ?' :
              'Sorry, something went wrong. Could you please try again?',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      };

      setMessages(prev => [...prev, errorResponse]);
      setIsTyping(false);
    }
  };

  const clearConversation = async () => {
    try {
      // Clear conversation on backend if ML service is connected
      if (mlServiceStatus === 'connected' && conversationId) {
        await chatbotAPI.clearConversation(conversationId);
      }
    } catch (error) {
      console.error('Error clearing conversation on server:', error);
    }
    
    // Clear local state and generate new conversation ID
    setMessages([]);
    setConversationId(`chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentLanguage = languages.find(l => l.code === selectedLanguage) || languages[0];

  

  return (
    <div className="relative max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-t-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
              🤖
            </div>
            <div>
              <h1 className="text-xl font-semibold">Personal Healing Companion</h1>
              <p className="text-purple-100 text-sm">Always here for you</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-gray-900">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Selector */}
            <div className="relative">
              <select
                value={chatMode}
                onChange={(e) => setChatMode(e.target.value)}
                className="bg-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                title="Chat Mode"
              >
                <option value="therapeutic" className="text-gray-900">🧠 Therapeutic</option>
                <option value="emotional" className="text-gray-900">💛 Emotional Support</option>
                <option value="informational" className="text-gray-900">📘 Informational</option>
              </select>
            </div>
            
            {/* Voice Toggle */}
            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-lg transition-colors ${
                voiceEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500/20 hover:bg-red-500/30'
              }`}
              title="Toggle Voice"
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Clear Conversation */}
            <button
              onClick={clearConversation}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              title="Clear Conversation"
              disabled={messages.length === 0}
            >
              <MessageCircle className="w-5 h-5" />
            </button>

            {/* Context Panel Toggle */}
            {conversationContext && (
              <button
                onClick={() => setShowContextPanel(!showContextPanel)}
                className={`p-2 rounded-lg transition-colors ${
                  showContextPanel ? 'bg-white/30' : 'bg-white/20 hover:bg-white/30'
                }`}
                title="Show Conversation Insights"
              >
                <Brain className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                mlServiceStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                mlServiceStatus === 'checking' ? 'bg-yellow-400 animate-pulse' :
                'bg-red-400'
              }`}></div>
              <span className="text-sm text-purple-100">
                {mlServiceStatus === 'connected' ? 
                  `${llmServiceAvailable ? 'LLM' : 'Legacy'} Model: ${chatModel}` :
                 mlServiceStatus === 'checking' ? 'Connecting to AI...' :
                 'Fallback Mode'}
              </span>
              {isProcessingMessage && (
                <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context Insights Panel */}
      {showContextPanel && conversationContext && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 border-b border-indigo-200 dark:border-indigo-800">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-3 flex items-center">
              <Brain className="w-4 h-4 mr-2" />
              Conversation Insights
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Engagement Level */}
              <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Engagement</p>
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 capitalize">
                  {conversationContext.engagement_level || 'New'}
                </p>
              </div>
              
              {/* Mood Indicators */}
              {conversationContext.mood_indicators && conversationContext.mood_indicators.length > 0 && (
                <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Detected Emotions</p>
                  <div className="flex flex-wrap gap-1">
                    {conversationContext.mood_indicators.map((mood, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-1 rounded-full ${
                          mood === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          mood === 'anxiety' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          mood === 'depression' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          mood === 'stress' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {mood}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Conversation Type */}
              <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Mode</p>
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 capitalize">
                  {conversationContext.conversation_type || chatMode}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto p-6 space-y-4">
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl transition-all duration-300 ${
                message.isTyping 
                  ? 'bg-gray-200 dark:bg-gray-700 animate-pulse' 
                  : message.sender === 'user'
                  ? 'bg-blue-500 text-white ml-4 shadow-md hover:shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white mr-4 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.sender === 'bot' && (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                    message.isTyping ? 'bg-gray-400 animate-bounce' : 'bg-purple-500'
                  }`}>
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  {message.isTyping ? (
                    <div className="flex items-center space-x-1 py-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <p className={`text-xs ${
                            message.sender === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                          {message.sender === 'bot' && message.isAIGenerated && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full flex items-center">
                              <Brain className="w-3 h-3 mr-1" />
                              AI
                            </span>
                          )}
                          {message.responseTime && (
                            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                              ⚡ {message.responseTime}
                            </span>
                          )}
                        </div>
                        {message.sender === 'bot' && voiceEnabled && (
                          <button
                            onClick={() => speakMessage(message.text)}
                            className="text-xs text-purple-500 hover:text-purple-600 ml-2"
                          >
                            🔊
                          </button>
                        )}
                      </div>
                      {message.sender === 'user' && message.sentiment && (
                        <div className="mt-2">
                          <SentimentCard 
                            sentiment={message.sentiment}
                            compact={true}
                            showKeywords={false}
                            className="inline-block"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                {message.sender === 'user' && (
                  <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-xs px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-2xl mr-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-gentle"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-gentle" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-gentle" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 rounded-b-2xl p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={`Type your message in ${currentLanguage.name}...`}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isTyping}
          />
          
          {/* Voice Input Button */}
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isTyping}
            className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              inputMessage.trim() && !isTyping
                ? 'bg-purple-500 hover:bg-purple-600 text-white hover:scale-105'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Features Carousel */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-b-2xl p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center mb-3">
          <Heart className="w-4 h-4 text-purple-500 mr-2" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">24/7 AI Support Features</span>
        </div>
        
        <div className="relative overflow-hidden">
          <div className="flex animate-scroll-horizontal space-x-4">
            {/* Duplicate content for seamless loop */}
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex space-x-4 flex-shrink-0">
                <div className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Multilingual Support</span>
                </div>
                
                <div className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                  <Mic className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Voice Interaction</span>
                </div>
                
                <div className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                  <MessageCircle className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Personalized Responses</span>
                </div>
                
                <div className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Professional Guidance</span>
                </div>
                
                <div className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Always Here for You</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;