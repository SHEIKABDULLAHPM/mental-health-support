const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || '/api';
const AUTH_API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || '/auth-api';

const parseApiError = (payload, fallback = 'Request failed') => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload?.error === 'string') return payload.error;
  if (typeof payload?.error?.message === 'string') return payload.error.message;
  if (typeof payload?.detail === 'string') return payload.detail;
  if (typeof payload?.message === 'string') return payload.message;
  return fallback;
};

const normalizeToken = (payload = {}) => {
  return (
    payload.access_token ||
    payload.accessToken ||
    payload?.data?.access_token ||
    payload?.data?.accessToken ||
    payload?.token ||
    null
  );
};

const storeAuthToken = (token) => {
  if (!token) return;
  try {
    localStorage.setItem('mindpeace-token', token);
  } catch {
    // Ignore storage write errors in private mode.
  }
};

const getAuthHeaders = (extraHeaders = {}) => {
  try {
    const directToken = localStorage.getItem('mindpeace-token');
    if (directToken) return { Authorization: `Bearer ${directToken}`, ...extraHeaders };

    const savedUser = localStorage.getItem('mindpeace-user');
    if (!savedUser) return { ...extraHeaders };
    const user = JSON.parse(savedUser);
    const token = user?.token || user?.access_token || user?.accessToken || null;
    if (!token) return { ...extraHeaders };
    return { Authorization: `Bearer ${token}`, ...extraHeaders };
  } catch {
    return { ...extraHeaders };
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Kept only for legacy helper methods that are not yet backend-backed.
let mockData = {
  moods: [],
  journalEntries: [],
  challenges: [],
  activities: [],
};

// Authentication API
export const authAPI = {
  login: async (credentials) => {
    const response = await fetch(`${AUTH_API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(parseApiError(error, 'Invalid credentials'));
    }

    const result = await response.json();
    const token = normalizeToken(result);
    storeAuthToken(token);
    return {
      success: true,
      user: {
        ...result.user,
        token
      }
    };
  },

  register: async (userData) => {
    const response = await fetch(`${AUTH_API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: userData.name,
        email: userData.email,
        password: userData.password
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(parseApiError(error, 'Registration failed'));
    }

    const result = await response.json();
    const token = normalizeToken(result);
    storeAuthToken(token);
    return {
      success: true,
      user: {
        ...result.user,
        token
      }
    };
  },

  logout: async () => {
    const response = await fetch(`${AUTH_API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    try {
      localStorage.removeItem('mindpeace-token');
    } catch {
      // ignore
    }
    if (!response.ok) return { success: false };
    return { success: true };
  }
};

export const userAPI = {
  me: async () => {
    const response = await fetch(`${API_BASE_URL}/v1/users/me`, {
      headers: getAuthHeaders(),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error || 'Failed to load user profile');
    }
    return payload.data;
  },

  updateProfile: async ({ full_name, username }) => {
    const response = await fetch(`${API_BASE_URL}/v1/users/me`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ full_name, username }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error || 'Failed to update profile');
    }
    return payload.data;
  },

  updatePreferences: async ({ notifications, theme, language }) => {
    const response = await fetch(`${API_BASE_URL}/v1/users/me/preferences`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ notifications, theme, language }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error || 'Failed to update preferences');
    }
    return payload.data;
  },

  changePassword: async ({ current_password, new_password }) => {
    const response = await fetch(`${API_BASE_URL}/v1/users/me/password`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ current_password, new_password }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error || 'Failed to change password');
    }
    return payload.data;
  },

  deactivateAccount: async (password) => {
    const response = await fetch(`${API_BASE_URL}/v1/users/me`, {
      method: 'DELETE',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ password }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error || 'Failed to deactivate account');
    }
    return payload.data;
  },
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ user_id: userId, score, activity, journal, timestamp })
    });
    const js = await res.json();
    if (js.status !== 'success') throw new Error(js.error || 'Mood submit failed');
    return js.data; // { timestamp, score, activity, journal }
  },
  entries: async ({ userId, limit = 100 }) => {
    const res = await fetch(`${API_BASE_URL}/mood/entries?user_id=${encodeURIComponent(userId)}&limit=${encodeURIComponent(limit)}`, {
      headers: getAuthHeaders(),
    });
    const js = await res.json();
    if (js.status !== 'success') throw new Error(js.error || 'Fetch entries failed');
    return js.data; // [ { timestamp, score, score_norm, activity, journal } ]
  },
  trends: async ({ userId, window = 7, shortWindow = 3 }) => {
    const url = `${API_BASE_URL}/mood/trends?user_id=${encodeURIComponent(userId)}&window=${encodeURIComponent(window)}&short_window=${encodeURIComponent(shortWindow)}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const js = await res.json();
    if (js.status !== 'success') throw new Error(js.error || 'Fetch trends failed');

    // Normalize backend shape to frontend-consumed contract.
    const data = js.data || {};
    const label = data?.summary?.label || data?.overall_trend || 'stable';
    return {
      summary: { label },
      series: Array.isArray(data.series) ? data.series : [],
      roll_mean: Array.isArray(data.roll_mean) ? data.roll_mean : [],
      roll_mean_short: Array.isArray(data.roll_mean_short) ? data.roll_mean_short : [],
      anomalies: Array.isArray(data.anomalies) ? data.anomalies : [],
      ...data,
    };
  },
  forecast: async ({ userId, daysAhead = 7 }) => {
    const url = `${API_BASE_URL}/mood/forecast?user_id=${encodeURIComponent(userId)}&days_ahead=${encodeURIComponent(daysAhead)}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const js = await res.json();
    if (js.status !== 'success') throw new Error(js.error || 'Fetch forecast failed');

    const data = js.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.dates) && Array.isArray(data.predictions)) {
      return data.dates.map((t, i) => ({ t, v: Number(data.predictions[i] ?? 0) }));
    }
    return [];
  }
};

// Journal API
export const journalAPI = {
  getEntries: async (limit = 20) => {
    const response = await fetch(`${API_BASE_URL}/v1/wellness/journal?limit=${encodeURIComponent(limit)}`, {
      headers: getAuthHeaders(),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error || 'Failed to fetch journal entries');
    }
    return payload.data || [];
  },

  addEntry: async ({ mood, content, sentiment = null }) => {
    const response = await fetch(`${API_BASE_URL}/v1/wellness/journal`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ mood, content, sentiment }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error || 'Failed to save journal entry');
    }
    return payload.data;
  },

  updateEntry: async (entryId, updates) => {
    const response = await fetch(`${API_BASE_URL}/v1/wellness/journal/${entryId}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error?.message || payload.error || 'Failed to update journal entry');
    }
    return payload.data;
  },

  deleteEntry: async (entryId) => {
    const response = await fetch(`${API_BASE_URL}/v1/wellness/journal/${entryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error?.message || payload.error || 'Failed to delete journal entry');
    }
    return payload.data;
  }
};

// Challenges API
export const challengesAPI = {
  getChallenges: async () => {
    const response = await fetch(`${API_BASE_URL}/v1/challenges/catalog`, {
      headers: getAuthHeaders(),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error?.message || payload.error || 'Failed to load challenges');
    }
    return payload.data || [];
  },

  joinChallenge: async (challengeId) => {
    const response = await fetch(`${API_BASE_URL}/v1/challenges/me/start`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ challengeId }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error?.message || payload.error || 'Failed to start challenge');
    }
    return payload.data;
  },

  updateProgress: async (progressId, progress) => {
    const response = await fetch(`${API_BASE_URL}/v1/challenges/me/${progressId}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ progress }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error?.message || payload.error || 'Failed to update challenge progress');
    }
    return payload.data;
  },

  getMyProgress: async () => {
    const response = await fetch(`${API_BASE_URL}/v1/challenges/me`, {
      headers: getAuthHeaders(),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error?.message || payload.error || 'Failed to load challenge progress');
    }
    return payload.data || [];
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
  getReflections: async (category = 'all', limit = 50) => {
    const response = await fetch(
      `${API_BASE_URL}/v1/wellness/reflections?category=${encodeURIComponent(category)}&limit=${encodeURIComponent(limit)}`,
      { headers: getAuthHeaders() }
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error || 'Failed to load reflections');
    }
    return payload.data || [];
  },

  addReflection: async ({ text, category = 'all', sentiment = null, anonymous = true }) => {
    const response = await fetch(`${API_BASE_URL}/v1/wellness/reflections`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ text, category, sentiment, anonymous }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error || 'Failed to post reflection');
    }
    return payload.data;
  },

  addReaction: async ({ reflectionId, reaction }) => {
    const response = await fetch(`${API_BASE_URL}/v1/wellness/reflections/${reflectionId}/reactions`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ reaction }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error || 'Failed to add reaction');
    }
    return payload.data;
  },
};

// Future Letters API
export const futureLettersAPI = {
  getLetters: async () => {
    const response = await fetch(`${API_BASE_URL}/v1/wellness/future-letters`, {
      headers: getAuthHeaders(),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error || 'Failed to load future letters');
    }
    return payload.data || [];
  },

  createLetter: async ({ title, content, deliveryDate }) => {
    const response = await fetch(`${API_BASE_URL}/v1/wellness/future-letters`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title, content, deliveryDate }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error || 'Failed to schedule future letter');
    }
    return payload.data;
  }
};

// Recommendations API
export const recommendationsAPI = {
  getCatalog: async ({ type = null, language = null, limit = 100 } = {}) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (type) params.append('type', type);
    if (language) params.append('language', language);

    const response = await fetch(`${API_BASE_URL}/v1/recommendations/catalog?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error?.message || payload.error || 'Failed to load recommendation catalog');
    }
    return payload.data || [];
  },

  getRecommendations: async ({ topN = 10, mood = null } = {}) => {
    const params = new URLSearchParams({ topN: String(topN) });
    if (mood) params.append('mood', mood);

    const response = await fetch(`${API_BASE_URL}/v1/recommendations/me?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error?.message || payload.error || 'Failed to load personalized recommendations');
    }
    return payload.data?.recommendations || [];
  }
};

export const positivityAPI = {
  listContent: async ({ type = null, language = null, limit = 50 } = {}) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (type) params.append('type', type);
    if (language) params.append('language', language);

    const response = await fetch(`${API_BASE_URL}/v1/positivity/content?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error?.message || payload.error || 'Failed to load positivity content');
    }
    return payload.data || [];
  },

  trackInteraction: async ({ contentId, action, context = {} }) => {
    const response = await fetch(`${API_BASE_URL}/v1/positivity/interactions`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ contentId, action, context }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'success') {
      throw new Error(payload.error?.message || payload.error || 'Failed to track positivity interaction');
    }
    return payload.data;
  },
};

// Recommendation Engine API (backend-powered)
export const recoAPI = {
  // Get recommendations using new GET endpoint
  recommend: async (input = {}) => {
    const topN = input.topN ?? 5;
    const context = input.context || {};
    try {
      const params = new URLSearchParams({
        topN: topN.toString(),
      });

      if (context.mood) {
        params.append('mood', context.mood);
      }

      const res = await fetch(`${API_BASE_URL}/v1/recommendations/me?${params}`, {
        headers: getAuthHeaders(),
      });
      const js = await res.json();

      if (res.ok && js.status === 'success') {
        return (js.data?.recommendations || []).map(item => ({
          item_id: item.id,
          title: item.title,
          category: item.itemType || 'Unknown',
          tags: item.tags || [],
          type: item.itemType,
          score: item.score || 0.5,
          metadata: item.metadata || {},
        }));
      }
      
      throw new Error(js.error || 'Recommendation failed');
    } catch (error) {
      console.error('Recommendation API error:', error);
      throw error;
    }
  },
  
  // Submit user feedback
  feedback: async (input = {}) => {
    const { itemId, rating, context = {} } = input;
    const res = await fetch(`${API_BASE_URL}/v1/recommendations/feedback`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ itemId, rating, action: 'clicked', context })
    });
    const js = await res.json();
    if (js.status !== 'success') throw new Error(js.error?.message || js.error || 'Feedback failed');
    return true;
  },
  
  // Get model metrics
  metrics: async (k = 5, strategy = 'hybrid') => {
    try {
      const res = await fetch(`${API_BASE_URL}/reco/metrics?k=${encodeURIComponent(k)}&strategy=${encodeURIComponent(strategy)}`, {
        headers: getAuthHeaders(),
      });
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
      const res = await fetch(`${API_BASE_URL}/reco/health`, { headers: getAuthHeaders() });
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
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
    
    const res = await fetch(url, { headers: getAuthHeaders() });
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
    const res = await fetch(`${API_BASE_URL}/sentiment/metrics`, { headers: getAuthHeaders() });
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
      const response = await fetch(`${API_BASE_URL}/v1/chat/health`, {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('LLM health check failed:', error);
      return { status: 'error', error: error.message };
    }
  },

  // Start a new conversation
  startConversation: async (type = 'greeting', mode = null) => {
    try {
      const starterByType = {
        greeting: 'Hello, I would like to start a supportive conversation.',
        anxiety: 'I feel anxious and need support.',
        stress: 'I am stressed and need guidance.',
        depression: 'I am feeling low and need help organizing my thoughts.',
      };
      const starterMessage = starterByType[type] || starterByType.greeting;

      const response = await fetch(`${API_BASE_URL}/v1/chat/send`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: starterMessage, mode: mode || 'therapeutic' })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(parseApiError(errBody, `HTTP error! status: ${response.status}`));
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return {
          conversationId: result.data.conversation_id,
          message: result.data.assistant_message,
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

      const response = await fetch(`${API_BASE_URL}/v1/chat/send`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const errMsg = errBody?.error || errBody?.details || `HTTP error! status: ${response.status}`;
        throw new Error(errMsg);
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

  // Stream message tokens from backend chat gateway (NDJSON)
  sendMessageStream: async (message, conversationId = null, options = {}, handlers = {}) => {
    const payload = {
      message: message.trim(),
      conversation_id: conversationId,
      max_length: options.maxLength || 256,
      temperature: options.temperature || 0.7,
      mode: options.mode || null,
      sentiment: options.sentiment || null
    };

    const response = await fetch(`${API_BASE_URL}/v1/chat/stream`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok || !response.body) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Stream unavailable (HTTP ${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalData = null;

    let keepReading = true;
    while (keepReading) {
      // eslint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read();
      if (done) {
        keepReading = false;
        continue;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        if (!rawLine || !rawLine.trim()) continue;
        let event = null;
        try {
          event = JSON.parse(rawLine);
        } catch {
          continue;
        }

        if (event.type === 'meta') {
          if (handlers.onMeta) handlers.onMeta(event);
          continue;
        }

        if (event.type === 'token') {
          if (handlers.onToken) handlers.onToken(event.token || '', event);
          continue;
        }

        if (event.type === 'error') {
          throw new Error(event.error || 'Streaming failed');
        }

        if (event.type === 'done') {
          finalData = event;
          if (handlers.onDone) handlers.onDone(event);
        }
      }
    }

    if (!finalData) {
      throw new Error('Stream ended without completion payload');
    }

    return {
      id: Date.now(),
      message: finalData.assistant_message || finalData.response || '',
      sender: 'bot',
      timestamp: finalData.timestamp || new Date().toISOString(),
      conversationId: finalData.conversation_id || conversationId,
      model: finalData.model_info?.model || 'Streaky',
      metadata: finalData.model_info || {},
      emotion: finalData.emotion,
      sentiment: finalData.sentiment,
      risk: finalData.risk,
      streamed: Boolean(finalData.streamed),
      fallback: Boolean(finalData.fallback),
    };
  },

  // Send message to MentaLLaMA (fallback method)
  sendMessage: async (message, conversationId = null, options = {}) => {
    try {
      // Try LLM service first
      return await chatbotAPI.sendMessageLLM(message, conversationId, options);
    } catch (llmError) {
      console.warn('LLM service failed, trying legacy MentaLLaMA:', llmError);
      
      // Retry once via the alias route.
      try {
        const payload = {
          message: message.trim(),
          conversation_id: conversationId,
          max_length: options.maxLength || 256,
          temperature: options.temperature || 0.7,
          mode: options.mode || null
        };

        const response = await fetch(`${API_BASE_URL}/v1/chat/message`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          const errMsg = errBody?.error || errBody?.details || `HTTP error! status: ${response.status}`;
          throw new Error(errMsg);
        }

        const result = await response.json();
        
        if (result.status === 'success') {
          const data = result.data || {};
          return {
            id: Date.now(),
            message: data.assistant_message || data.response || 'I am here with you. Could you share a little more?',
            sender: 'bot',
            timestamp: data.timestamp || new Date().toISOString(),
            conversationId: data.conversation_id || conversationId,
            model: data.model || 'Streaky',
            metadata: data.metadata || data.model_info || {}
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
      const response = await fetch(`${API_BASE_URL}/v1/health`);
      if (!response.ok) return null;
      const result = await response.json();
      return {
        service: 'backend-chat-gateway',
        status: result?.ok ? 'healthy' : 'degraded',
        ts: result?.ts,
      };
    } catch (error) {
      console.error('Chat info error:', error);
      return null;
    }
  },

  // Get conversation history
  getConversation: async (conversationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/chat/conversations/${conversationId}`, {
        headers: getAuthHeaders()
      });
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
      const response = await fetch(`${API_BASE_URL}/v1/chat/conversations`, {
        headers: getAuthHeaders()
      });
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
      const response = await fetch(`${API_BASE_URL}/v1/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/v1/chat/conversations/${conversationId}/assessment`, {
        headers: getAuthHeaders()
      });
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

      const response = await fetch(`${API_BASE_URL}/v1/emotion/voice`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        const raw = result.data?.raw?.data || result.data?.raw || {};
        return {
          primary_emotion: result.data?.primaryEmotion || raw.primary_emotion || raw.emotion || 'neutral',
          confidence: result.data?.confidence ?? raw.confidence ?? 0,
          top_emotions: raw.top_emotions || [],
          insight: raw.insight || 'Emotion detected from voice sample.',
          color: raw.color || '#3b82f6',
          timestamp: result.data?.createdAt || new Date().toISOString(),
        };
      } else {
        throw new Error(parseApiError(result, 'Failed to detect emotion'));
      }
    } catch (error) {
      console.error('Voice emotion detection error:', error);
      throw error;
    }
  },

  // Check if emotion detection service is available
  checkHealth: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/chat/health`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        return { available: false, status: 'offline' };
      }

      const result = await response.json();
      const emotionAvailable = Boolean(result?.data?.ml?.available);
      
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
      const response = await fetch(`${API_BASE_URL}/emotions`, {
        headers: getAuthHeaders()
      });
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
const MOOD_SERVICE_URL = API_BASE_URL;

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

      const response = await fetch(`${MOOD_SERVICE_URL}/mood-pattern/analyze/face`, {
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

      const response = await fetch(`${MOOD_SERVICE_URL}/mood-pattern/analyze/text`, {
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

      const response = await fetch(`${MOOD_SERVICE_URL}/mood-pattern/analyze/fusion`, {
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
      const params = new URLSearchParams({
        user_id: userId,
        days_ahead: String(options.daysAhead || 7),
      });

      const response = await fetch(`${MOOD_SERVICE_URL}/mood/forecast?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Mood trend prediction failed');
      }

      const result = await response.json();
      return result.data || [];
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
        window: (options.days || 30).toString(),
        short_window: '3'
      });

      const response = await fetch(`${MOOD_SERVICE_URL}/mood/trends?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Mood visualization failed');
      }

      const result = await response.json();
      return result.data || {};
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
      const response = await fetch(`${MOOD_SERVICE_URL}/mood/trends?user_id=${encodeURIComponent(userId)}&window=30&short_window=7`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get user stats');
      }

      const result = await response.json();
      return result.data || {};
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
        score: moodData.sentimentScore ?? moodData.score ?? 0,
        activity: moodData.source || 'manual',
        journal: moodData.metadata?.text || null
      };

      const response = await fetch(`${MOOD_SERVICE_URL}/mood/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to store mood entry');
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
  user: userAPI,
  mood: moodAPI,
  journal: journalAPI,
  challenges: challengesAPI,
  activities: activitiesAPI,
  reflections: reflectionsAPI,
  futureLetters: futureLettersAPI,
  recommendations: recommendationsAPI,
  positivity: positivityAPI,
  games: gamesAPI,
  chatbot: chatbotAPI,
  sentiment: sentimentAPI,
  reco: recoAPI,
  voiceEmotion: voiceEmotionAPI,
  moodPattern: moodPatternAPI
};