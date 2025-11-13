// Mock API service for the mental health app
// In a real application, these would be actual API calls

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data storage (in real app, this would be a database)
let mockData = {
  users: [
    {
      id: 1,
      name: 'Demo User',
      email: 'demo@mindpeace.com',
      joinDate: new Date().toISOString(),
      preferences: {
        notifications: true,
        theme: 'light',
        language: 'en'
      }
    }
  ],
  moods: [],
  journalEntries: [],
  challenges: [
    {
      id: 1,
      title: '7-Day Gratitude Challenge',
      description: 'Write down 3 things you\'re grateful for each day',
      duration: 7,
      category: 'gratitude',
      difficulty: 'easy',
      points: 100,
      isActive: true
    },
    {
      id: 2,
      title: '14-Day Meditation Journey',
      description: 'Meditate for at least 10 minutes daily',
      duration: 14,
      category: 'mindfulness',
      difficulty: 'medium',
      points: 200,
      isActive: true
    }
  ],
  activities: [
    {
      id: 1,
      title: 'Deep Breathing Exercise',
      description: 'A 5-minute guided breathing exercise',
      category: 'breathing',
      duration: 5,
      difficulty: 'easy'
    },
    {
      id: 2,
      title: 'Progressive Muscle Relaxation',
      description: 'Relax your body from head to toe',
      category: 'relaxation',
      duration: 15,
      difficulty: 'medium'
    }
  ],
  reflections: [],
  futureLetters: []
};

// Authentication API
export const authAPI = {
  login: async (credentials) => {
    await delay(1000);
    
    // Mock authentication
    if (credentials.email && credentials.password) {
      const user = mockData.users[0];
      return {
        success: true,
        user: {
          ...user,
          token: 'mock-jwt-token'
        }
      };
    }
    
    throw new Error('Invalid credentials');
  },

  register: async (userData) => {
    await delay(1000);
    
    const newUser = {
      id: Date.now(),
      ...userData,
      joinDate: new Date().toISOString(),
      preferences: {
        notifications: true,
        theme: 'light',
        language: 'en'
      }
    };
    
    mockData.users.push(newUser);
    
    return {
      success: true,
      user: {
        ...newUser,
        token: 'mock-jwt-token'
      }
    };
  },

  logout: async () => {
    await delay(500);
    return { success: true };
  }
};

// Mood tracking API
export const moodAPI = {
  getMoods: async (userId) => {
    await delay(500);
    return mockData.moods.filter(mood => mood.userId === userId);
  },

  addMood: async (moodData) => {
    await delay(500);
    
    const newMood = {
      id: Date.now(),
      ...moodData,
      timestamp: new Date().toISOString()
    };
    
    mockData.moods.push(newMood);
    return newMood;
  },

  updateMood: async (moodId, updates) => {
    await delay(500);
    
    const index = mockData.moods.findIndex(mood => mood.id === moodId);
    if (index !== -1) {
      mockData.moods[index] = { ...mockData.moods[index], ...updates };
      return mockData.moods[index];
    }
    
    throw new Error('Mood not found');
  },
  // Backend-powered Mood APIs
  submit: async ({ userId, score, activity = null, journal = null, timestamp = null }) => {
    const res = await fetch(`${API_BASE_URL}/mood/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, score, activity, journal, timestamp })
    });
    const js = await res.json();
    if (js.status !== 'success') throw new Error(js.error || 'Mood submit failed');
    return js.data; // { timestamp, score, activity, journal }
  },
  entries: async ({ userId, limit = 100 }) => {
    const res = await fetch(`${API_BASE_URL}/mood/entries?user_id=${encodeURIComponent(userId)}&limit=${encodeURIComponent(limit)}`);
    const js = await res.json();
    if (js.status !== 'success') throw new Error(js.error || 'Fetch entries failed');
    return js.data; // [ { timestamp, score, score_norm, activity, journal } ]
  },
  trends: async ({ userId, window = 7, shortWindow = 3 }) => {
    const url = `${API_BASE_URL}/mood/trends?user_id=${encodeURIComponent(userId)}&window=${encodeURIComponent(window)}&short_window=${encodeURIComponent(shortWindow)}`;
    const res = await fetch(url);
    const js = await res.json();
    if (js.status !== 'success') throw new Error(js.error || 'Fetch trends failed');
    return js.data; // { summary, series, roll_mean, roll_mean_short, dow_pattern, anomalies }
  },
  forecast: async ({ userId, daysAhead = 7 }) => {
    const url = `${API_BASE_URL}/mood/forecast?user_id=${encodeURIComponent(userId)}&days_ahead=${encodeURIComponent(daysAhead)}`;
    const res = await fetch(url);
    const js = await res.json();
    if (js.status !== 'success') throw new Error(js.error || 'Fetch forecast failed');
    return js.data; // [ { t, v } ]
  }
};

// Journal API
export const journalAPI = {
  getEntries: async (userId) => {
    await delay(500);
    return mockData.journalEntries.filter(entry => entry.userId === userId);
  },

  addEntry: async (entryData) => {
    await delay(500);
    
    const newEntry = {
      id: Date.now(),
      ...entryData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockData.journalEntries.push(newEntry);
    return newEntry;
  },

  updateEntry: async (entryId, updates) => {
    await delay(500);
    
    const index = mockData.journalEntries.findIndex(entry => entry.id === entryId);
    if (index !== -1) {
      mockData.journalEntries[index] = {
        ...mockData.journalEntries[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return mockData.journalEntries[index];
    }
    
    throw new Error('Journal entry not found');
  },

  deleteEntry: async (entryId) => {
    await delay(500);
    
    const index = mockData.journalEntries.findIndex(entry => entry.id === entryId);
    if (index !== -1) {
      mockData.journalEntries.splice(index, 1);
      return { success: true };
    }
    
    throw new Error('Journal entry not found');
  }
};

// Challenges API
export const challengesAPI = {
  getChallenges: async () => {
    await delay(500);
    return mockData.challenges;
  },

  joinChallenge: async (challengeId /* userId */) => {
    await delay(500);
    
    const challenge = mockData.challenges.find(c => c.id === challengeId);
    if (challenge) {
      return {
        ...challenge,
        joined: true,
        startDate: new Date().toISOString()
      };
    }
    
    throw new Error('Challenge not found');
  },

  updateProgress: async (challengeId, userId, progress) => {
    await delay(500);
    
    return {
      challengeId,
      userId,
      progress,
      updatedAt: new Date().toISOString()
    };
  }
};

// Activities API
export const activitiesAPI = {
  getActivities: async () => {
    await delay(500);
    return mockData.activities;
  },

  completeActivity: async (activityId, userId) => {
    await delay(500);
    
    return {
      activityId,
      userId,
      completedAt: new Date().toISOString(),
      points: 10
    };
  }
};

// Reflections API
export const reflectionsAPI = {
  getReflections: async (userId) => {
    await delay(500);
    return mockData.reflections.filter(reflection => reflection.userId === userId);
  },

  addReflection: async (reflectionData) => {
    await delay(500);
    
    const newReflection = {
      id: Date.now(),
      ...reflectionData,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: []
    };
    
    mockData.reflections.push(newReflection);
    return newReflection;
  }
};

// Future Letters API
export const futureLettersAPI = {
  getLetters: async (userId) => {
    await delay(500);
    return mockData.futureLetters.filter(letter => letter.userId === userId);
  },

  createLetter: async (letterData) => {
    await delay(500);
    
    const newLetter = {
      id: Date.now(),
      ...letterData,
      createdAt: new Date().toISOString(),
      status: 'scheduled'
    };
    
    mockData.futureLetters.push(newLetter);
    return newLetter;
  }
};

// Recommendations API
export const recommendationsAPI = {
  getRecommendations: async (/* userId, preferences */) => {
    await delay(500);
    
    // Mock recommendations based on user preferences
    const recommendations = [
      {
        id: 1,
        type: 'meditation',
        title: 'Morning Mindfulness',
        description: 'Start your day with a 10-minute meditation',
        category: 'mindfulness',
        duration: 10,
        difficulty: 'easy'
      },
      {
        id: 2,
        type: 'exercise',
        title: 'Gentle Yoga Flow',
        description: 'Relaxing yoga routine for stress relief',
        category: 'movement',
        duration: 20,
        difficulty: 'medium'
      },
      {
        id: 3,
        type: 'breathing',
        title: '4-7-8 Breathing Technique',
        description: 'Powerful breathing exercise for anxiety',
        category: 'breathing',
        duration: 5,
        difficulty: 'easy'
      }
    ];
    
    return recommendations;
  }
};

// Recommendation Engine API (backend-powered)
export const recoAPI = {
  // Get recommendations using new GET endpoint
  recommend: async ({ userId, topN = 5, strategy = 'hybrid', alpha = 0.5, context = {} }) => {
    try {
      // Use GET endpoint with query parameters
      const params = new URLSearchParams({
        user_id: userId,
        top_n: topN.toString(),
        strategy: strategy,
        alpha: alpha.toString()
      });
      
      // Add context parameters (e.g., mood)
      if (context.mood) {
        params.append('mood', context.mood);
      }
      
      const res = await fetch(`${API_BASE_URL}/reco/recommendations?${params}`);
      const js = await res.json();
      
      if (res.ok && js.recommendations) {
        // Transform response to match expected format
        return js.recommendations.map(item => ({
          item_id: item.id,
          title: item.title,
          category: item.type || 'Unknown',
          tags: item.tags || [],
          type: item.type,
          score: item.score || 0.5
        }));
      }
      
      throw new Error(js.error || 'Recommendation failed');
    } catch (error) {
      console.error('Recommendation API error:', error);
      throw error;
    }
  },
  
  // Submit user feedback
  feedback: async ({ userId, itemId, rating, context = {} }) => {
    const res = await fetch(`${API_BASE_URL}/reco/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, item_id: itemId, rating, context })
    });
    const js = await res.json();
    if (js.status !== 'success') throw new Error(js.error || 'Feedback failed');
    return true;
  },
  
  // Get model metrics
  metrics: async (k = 5, strategy = 'hybrid') => {
    try {
      const res = await fetch(`${API_BASE_URL}/reco/metrics?k=${encodeURIComponent(k)}&strategy=${encodeURIComponent(strategy)}`);
      const js = await res.json();
      return js.status === 'success' ? js.data : {};
    } catch (error) {
      console.error('Metrics API error:', error);
      return {};
    }
  },
  
  // Get model info
  info: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reco/health`);
      const js = await res.json();
      return js || {};
    } catch (error) {
      console.error('Info API error:', error);
      return {};
    }
  }
};

// Sentiment API
export const sentimentAPI = {
  /**
   * Analyze text sentiment using specified model
   * @param {string} text - Text to analyze
   * @param {string} model - Model to use: 'vader', 'classical', 'bilstm', 'ensemble'
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Sentiment result
   */
  analyzeText: async (text, model = 'vader', options = {}) => {
  const { extractKeywords = true, ensembleWeights, timeout = 15000 } = options; // removed unused topK
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const res = await fetch(`${API_BASE_URL}/sentiment/v2/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          model, 
          extract_keywords: extractKeywords,
          ensemble_weights: ensembleWeights 
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const js = await res.json();
      if (js.status !== 'success') {
        throw new Error(js.error || 'Sentiment analyze failed');
      }
      
      return js.data; // { label, confidence, intensity, keywords, model, timestamp, ... }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms - Backend may be processing. Try again or use a faster model.`);
      }
      throw new Error(`Sentiment API Error: ${error.message}`);
    }
  },

  /**
   * Analyze batch of texts
   * @param {Array<string>} texts - Texts to analyze
   * @param {string} model - Model to use
   * @returns {Promise<Array>} Array of sentiment results
   */
  analyzeBatch: async (texts, model = 'vader', options = {}) => {
    const { timeout = 30000 } = options;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const res = await fetch(`${API_BASE_URL}/sentiment/v2/analyze/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts, model }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const js = await res.json();
      if (js.status !== 'success') {
        throw new Error(js.error || 'Batch sentiment analyze failed');
      }
      
      return js.data; // array of results
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Batch request timeout after ${timeout}ms - Try analyzing fewer items.`);
      }
      throw new Error(`Batch Sentiment API Error: ${error.message}`);
    }
  },

  /**
   * Get information about available models
   * @param {string} modelName - Optional specific model
   * @returns {Promise<Object>} Model information
   */
  getModels: async (modelName = null) => {
    const url = modelName 
      ? `${API_BASE_URL}/sentiment/v2/models?model=${modelName}`
      : `${API_BASE_URL}/sentiment/v2/models`;
    
    const res = await fetch(url);
    const js = await res.json();
    return js.status === 'success' ? js.data : {};
  },

  /**
   * Get recommended model for use case
   * @param {string} useCase - Use case: 'chatbot', 'mood_checkin', 'journal', 'reflection_wall'
   * @returns {Promise<Object>} Recommendation
   */
  recommendModel: async (useCase) => {
    const res = await fetch(`${API_BASE_URL}/sentiment/v2/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ use_case: useCase })
    });
    const js = await res.json();
    return js.status === 'success' ? js.data : {};
  },

  /**
   * Compare predictions from multiple models
   * @param {string} text - Text to analyze
   * @param {Array<string>} models - Models to compare
   * @returns {Promise<Object>} Comparison results
   */
  compareModels: async (text, models = ['vader', 'classical', 'bilstm']) => {
    const res = await fetch(`${API_BASE_URL}/sentiment/v2/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, models })
    });
    const js = await res.json();
    return js.status === 'success' ? js.data : {};
  },

  /**
   * Legacy VADER-only endpoint (backward compatibility)
   */
  analyzeVader: async (text, topK = 5) => {
    const res = await fetch(`${API_BASE_URL}/sentiment/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, top_k: topK })
    });
    const js = await res.json();
    if (js.status !== 'success') throw new Error(js.error || 'Sentiment analyze failed');
    return js.data;
  },

  /**
   * Get sentiment metrics
   */
  metrics: async () => {
    const res = await fetch(`${API_BASE_URL}/sentiment/metrics`);
    const js = await res.json();
    return js.status === 'success' ? js.data : {};
  }
};

// Games API (Calming Games)
const ensureDeviceId = () => {
  try {
    const key = 'mh_device_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'dev-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'dev-anon';
  }
};

export const gamesAPI = {
  ensureDeviceId,
  startSession: async (userId, game) => {
    const payload = { userId: userId || ensureDeviceId(), game };
    const res = await fetch(`${API_BASE_URL}/games/session/start`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const js = await res.json();
    if (js.status !== 'success') throw new Error(js.error || 'startSession failed');
    return js.data.sessionId;
  },
  stopSession: async (sessionId) => {
    const res = await fetch(`${API_BASE_URL}/games/session/stop`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId })
    });
    const js = await res.json();
    return js.status === 'success' ? js.data : null;
  },
  logEvent: async ({ sessionId, game, type, payload }) => {
    await fetch(`${API_BASE_URL}/games/event`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, game, type, payload })
    });
  },
  setPreferences: async (userId, game, preferences) => {
    await fetch(`${API_BASE_URL}/games/preferences`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: userId || ensureDeviceId(), game, preferences })
    });
  },
  getState: async (userId, game) => {
    const res = await fetch(`${API_BASE_URL}/games/state?userId=${encodeURIComponent(userId || ensureDeviceId())}&game=${encodeURIComponent(game)}`);
    const js = await res.json();
    return js.status === 'success' ? js.data : null;
  },
  bubbleScore: async (userId, score) => {
    const res = await fetch(`${API_BASE_URL}/games/bubble/score`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: userId || ensureDeviceId(), score })
    });
    const js = await res.json();
    return js.status === 'success' ? js.data : null;
  },
  zenSave: async (userId, imageData, theme, rakeWidth) => {
    const res = await fetch(`${API_BASE_URL}/games/zen/save`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: userId || ensureDeviceId(), imageData, theme, rakeWidth })
    });
    const js = await res.json();
    return js.status === 'success' ? js.data : null;
  },
  zenList: async (userId) => {
    const res = await fetch(`${API_BASE_URL}/games/zen/list?userId=${encodeURIComponent(userId || ensureDeviceId())}`);
    const js = await res.json();
    return js.status === 'success' ? js.data : [];
  },
  zenImageUrl: (id) => `${API_BASE_URL}/games/zen/image/${id}`
};

// MentaLLaMA Chat API with LLM Integration
export const chatbotAPI = {
  // Check ML service health
  checkHealth: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', error: error.message };
    }
  },

  // Check LLM service health
  checkLLMHealth: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/llm/health`);
      return await response.json();
    } catch (error) {
      console.error('LLM health check failed:', error);
      return { status: 'error', error: error.message };
    }
  },

  // Start a new conversation
  startConversation: async (type = 'greeting', mode = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/llm/chat/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, mode })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return {
          conversationId: result.data.conversation_id,
          message: result.data.message,
          timestamp: result.data.timestamp
        };
      } else {
        throw new Error(result.error || 'Failed to start conversation');
      }
      
    } catch (error) {
      console.error('Start conversation error:', error);
      // Return fallback
      return {
        conversationId: 'fallback-' + Date.now(),
        message: "Hello! I'm here to support you with your mental health and wellbeing. How are you feeling today?",
        timestamp: new Date().toISOString()
      };
    }
  },

  // Send message to LLM service (preferred method)
  sendMessageLLM: async (message, conversationId = null, options = {}) => {
    try {
      const payload = {
        message: message.trim(),
        conversation_id: conversationId,
        max_length: options.maxLength || 256,
        temperature: options.temperature || 0.7,
        mode: options.mode || null,
        sentiment: options.sentiment || null  // ⭐ EMOTION ENHANCEMENT: Pass sentiment
      };

      const response = await fetch(`${API_BASE_URL}/llm/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return {
          id: Date.now(),
          message: result.data.assistant_message,
          sender: 'bot',
          timestamp: result.data.timestamp,
          conversationId: result.data.conversation_id,
          model: result.data.model_info?.model || 'Streaky',  // ⭐ Streaky branding
          metadata: result.data.model_info,
          context: result.data.conversation_context,
          emotion: result.data.emotion,  // ⭐ Detected emotion
          responseTime: result.data.response_time  // ⭐ Backend timing
        };
      } else {
        throw new Error(result.error || 'Chat request failed');
      }
      
    } catch (error) {
      console.error('LLM Chat API error:', error);
      throw error; // Re-throw to allow fallback handling
    }
  },

  // Send message to MentaLLaMA (fallback method)
  sendMessage: async (message, conversationId = null, options = {}) => {
    try {
      // Try LLM service first
      return await chatbotAPI.sendMessageLLM(message, conversationId, options);
    } catch (llmError) {
      console.warn('LLM service failed, trying legacy MentaLLaMA:', llmError);
      
      // Fallback to legacy MentaLLaMA endpoint
      try {
        const payload = {
          message: message.trim(),
          conversation_id: conversationId,
          max_length: options.maxLength || 256,
          temperature: options.temperature || 0.7,
          mode: options.mode || null
        };

        const response = await fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status === 'success') {
          return {
            id: Date.now(),
            message: result.data.response,
            sender: 'bot',
            timestamp: result.data.timestamp,
            conversationId: result.data.conversation_id,
            model: result.data.model,
            metadata: result.data.metadata
          };
        } else {
          throw new Error(result.error || 'Chat request failed');
        }
        
      } catch (legacyError) {
        console.error('Legacy chat API also failed:', legacyError);
        
        // Final fallback to basic response
        return {
          id: Date.now(),
          message: "I apologize, but I'm having some technical difficulties right now. Please know that I'm here to support you, and your mental health matters. If you're in crisis, please reach out to a mental health professional or crisis hotline.",
          sender: 'bot',
          timestamp: new Date().toISOString(),
          conversationId: conversationId || 'fallback-' + Date.now(),
          error: true,
          fallback: true
        };
      }
    }
  },

  // Get chat model info
  getChatInfo: async () => {
    try {
      // Try LLM service first
      const response = await fetch(`${API_BASE_URL}/llm/model/info`);
      if (response.ok) {
        const result = await response.json();
        return result.status === 'success' ? result.data : null;
      }
      
      // Fallback to legacy endpoint
      const legacyResponse = await fetch(`${API_BASE_URL}/chat/info`);
      if (legacyResponse.ok) {
        const result = await legacyResponse.json();
        return result.status === 'success' ? result.data : null;
      }
      
      return null;
    } catch (error) {
      console.error('Chat info error:', error);
      return null;
    }
  },

  // Get conversation history
  getConversation: async (conversationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/llm/chat/conversation/${conversationId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.status === 'success' ? result.data : null;
    } catch (error) {
      console.error('Get conversation error:', error);
      return null;
    }
  },

  // List all conversations
  listConversations: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/llm/chat/conversations`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.status === 'success' ? result.data : null;
    } catch (error) {
      console.error('List conversations error:', error);
      return null;
    }
  },

  // Clear conversation history
  clearConversation: async (conversationId) => {
    try {
      // Try LLM service first
      const response = await fetch(`${API_BASE_URL}/llm/chat/conversation/${conversationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.status === 'success';
      }
      
      // Fallback to legacy endpoint
      const legacyResponse = await fetch(`${API_BASE_URL}/chat/clear/${conversationId}`, {
        method: 'DELETE'
      });
      
      if (legacyResponse.ok) {
        const result = await legacyResponse.json();
        return result.status === 'success';
      }
      
      return false;
    } catch (error) {
      console.error('Clear conversation error:', error);
      return false;
    }
  },

  // Get mental health assessment
  getAssessment: async (conversationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/llm/chat/assessment/${conversationId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.status === 'success' ? result.data : null;
    } catch (error) {
      console.error('Assessment error:', error);
      return null;
    }
  }
};

// Voice Emotion Detection API
export const voiceEmotionAPI = {
  // Detect emotion from audio file
  detectEmotion: async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch(`${API_BASE_URL}/detect-emotion`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to detect emotion');
      }
    } catch (error) {
      console.error('Voice emotion detection error:', error);
      throw error;
    }
  },

  // Check if emotion detection service is available
  checkHealth: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        return { available: false, status: 'offline' };
      }

      const result = await response.json();
      const emotionAvailable = result.emotion_model_loaded || false;
      
      return {
        available: emotionAvailable,
        status: result.status,
        details: result
      };
    } catch (error) {
      console.error('Voice emotion health check error:', error);
      return { available: false, status: 'error', error: error.message };
    }
  },

  // Get supported emotions list
  getEmotions: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/emotions`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.status === 'success' ? result.emotions : null;
    } catch (error) {
      console.error('Get emotions error:', error);
      return null;
    }
  }
};

// Mood Pattern Recognition API (Dual-Modality Face + Text Emotion Detection)
const MOOD_SERVICE_URL = 'http://localhost:8002';

export const moodPatternAPI = {
  /**
   * Analyze face emotion from image
   * @param {File|Blob} imageFile - Face image file
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Face emotion analysis result
   */
  analyzeFaceEmotion: async (imageFile, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      if (options.returnVisualization) {
        formData.append('return_visualization', 'true');
      }

      const response = await fetch(`${MOOD_SERVICE_URL}/analyze/face`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Face emotion analysis failed');
      }

      const result = await response.json();
      return result;
      // Result: { emotion, confidence, all_probabilities, unified_mood, sentiment_score, processing_time }
    } catch (error) {
      console.error('Face emotion API error:', error);
      throw error;
    }
  },

  /**
   * Analyze text emotion from journal entry or message
   * @param {string} text - Text content to analyze
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Text emotion analysis result
   */
  analyzeTextEmotion: async (text, options = {}) => {
    try {
      const payload = {
        text: text.trim(),
        model_type: options.modelType || 'bert', // 'bert' or 'bilstm'
        return_top_k: options.topK || 3
      };

      const response = await fetch(`${MOOD_SERVICE_URL}/analyze/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Text emotion analysis failed');
      }

      const result = await response.json();
      return result;
      // Result: { primary_emotion, confidence, top_emotions, unified_mood, sentiment_score, processing_time }
    } catch (error) {
      console.error('Text emotion API error:', error);
      throw error;
    }
  },

  /**
   * Analyze fusion of face and text emotions
   * @param {File|Blob} imageFile - Face image (optional)
   * @param {string} text - Text content (optional)
   * @param {Object} options - Fusion options
   * @returns {Promise<Object>} Fused emotion analysis result
   */
  analyzeFusion: async (imageFile = null, text = null, options = {}) => {
    try {
      const formData = new FormData();
      
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      if (text && text.trim()) {
        formData.append('text', text.trim());
      }

      // Fusion parameters
      formData.append('fusion_method', options.fusionMethod || 'weighted'); // 'weighted', 'neural', 'adaptive'
      formData.append('face_weight', (options.faceWeight !== undefined ? options.faceWeight : 0.5).toString());
      formData.append('text_weight', (options.textWeight !== undefined ? options.textWeight : 0.5).toString());
      
      if (options.returnDetails) {
        formData.append('return_details', 'true');
      }

      const response = await fetch(`${MOOD_SERVICE_URL}/analyze/fusion`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Fusion analysis failed');
      }

      const result = await response.json();
      return result;
      // Result: { unified_mood, confidence, sentiment_score, face_emotion?, text_emotion?, fusion_details?, processing_time }
    } catch (error) {
      console.error('Fusion API error:', error);
      throw error;
    }
  },

  /**
   * Predict future mood trends
   * @param {string} userId - User identifier
   * @param {Object} options - Prediction options
   * @returns {Promise<Object>} Mood trend prediction
   */
  predictMoodTrend: async (userId, options = {}) => {
    try {
      const payload = {
        user_id: userId,
        days_ahead: options.daysAhead || 7,
        sequence_length: options.sequenceLength || 7,
        return_confidence_intervals: options.returnConfidence !== false
      };

      const response = await fetch(`${MOOD_SERVICE_URL}/trend/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Mood trend prediction failed');
      }

      const result = await response.json();
      return result;
      // Result: { user_id, predictions: [{ date, mood, confidence, sentiment }], trend_summary, processing_time }
    } catch (error) {
      console.error('Mood trend prediction API error:', error);
      throw error;
    }
  },

  /**
   * Get mood trend visualization data
   * @param {string} userId - User identifier
   * @param {Object} options - Visualization options
   * @returns {Promise<Object>} Visualization data and chart
   */
  getMoodVisualization: async (userId, options = {}) => {
    try {
      const params = new URLSearchParams({
        user_id: userId,
        days: (options.days || 30).toString(),
        chart_type: options.chartType || 'line', // 'line', 'bar', 'heatmap'
        include_predictions: (options.includePredictions !== false).toString()
      });

      const response = await fetch(`${MOOD_SERVICE_URL}/trend/visualize?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Mood visualization failed');
      }

      const result = await response.json();
      return result;
      // Result: { user_id, chart_html, data_points, statistics, processing_time }
    } catch (error) {
      console.error('Mood visualization API error:', error);
      throw error;
    }
  },

  /**
   * Get user mood statistics and insights
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} User mood statistics
   */
  getUserMoodStats: async (userId) => {
    try {
      const response = await fetch(`${MOOD_SERVICE_URL}/user/${userId}/stats`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get user stats');
      }

      const result = await response.json();
      return result;
      // Result: { user_id, total_entries, dominant_mood, avg_sentiment, mood_distribution, trend_direction, last_updated }
    } catch (error) {
      console.error('User mood stats API error:', error);
      throw error;
    }
  },

  /**
   * Store mood entry (for trend tracking)
   * @param {string} userId - User identifier
   * @param {Object} moodData - Mood entry data
   * @returns {Promise<Object>} Stored entry confirmation
   */
  storeMoodEntry: async (userId, moodData) => {
    try {
      const payload = {
        user_id: userId,
        timestamp: moodData.timestamp || new Date().toISOString(),
        mood: moodData.mood,
        sentiment_score: moodData.sentimentScore,
        source: moodData.source || 'manual', // 'face', 'text', 'fusion', 'manual'
        metadata: moodData.metadata || {}
      };

      const response = await fetch(`${MOOD_SERVICE_URL}/user/${userId}/mood`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to store mood entry');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Store mood entry API error:', error);
      throw error;
    }
  },

  /**
   * Check mood service health
   * @returns {Promise<Object>} Service health status
   */
  checkHealth: async () => {
    try {
      const response = await fetch(`${MOOD_SERVICE_URL}/health`);
      if (!response.ok) {
        return { status: 'offline', available: false };
      }

      const result = await response.json();
      return {
        status: 'online',
        available: true,
        ...result
      };
    } catch (error) {
      console.error('Mood service health check failed:', error);
      return {
        status: 'offline',
        available: false,
        error: error.message
      };
    }
  },

  /**
   * Get available emotion categories
   * @returns {Promise<Array>} List of emotion categories
   */
  getEmotionCategories: async () => {
    try {
      const response = await fetch(`${MOOD_SERVICE_URL}/emotions`);
      if (!response.ok) {
        throw new Error('Failed to get emotion categories');
      }

      const result = await response.json();
      return result.emotions || [];
    } catch (error) {
      console.error('Get emotion categories error:', error);
      // Return default categories as fallback
      return ['Happy', 'Sad', 'Angry', 'Fearful', 'Disgusted', 'Surprised', 'Neutral'];
    }
  }
};

// Export default API object
export default {
  auth: authAPI,
  mood: moodAPI,
  journal: journalAPI,
  challenges: challengesAPI,
  activities: activitiesAPI,
  reflections: reflectionsAPI,
  futureLetters: futureLettersAPI,
  recommendations: recommendationsAPI,
  games: gamesAPI,
  chatbot: chatbotAPI,
  sentiment: sentimentAPI,
  reco: recoAPI,
  voiceEmotion: voiceEmotionAPI,
  moodPattern: moodPatternAPI
};