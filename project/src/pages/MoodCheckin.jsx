import { useEffect, useMemo, useState } from 'react';
import { Calendar, TrendingUp, MessageSquare, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';
import MoodTrendChart from '../components/MoodTrendChart';
import SentimentCard from '../components/SentimentCard';
import SentimentMeter from '../components/SentimentMeter';
import FaceEmotionDetector from '../components/FaceEmotionDetector';
import DetectedExpression from '../components/DetectedExpression';

const MoodCheckin = () => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedEnergy, setSelectedEnergy] = useState(null);
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sentiment, setSentiment] = useState(null);
  const [sentimentError, setSentimentError] = useState(null);
  const [loadingSent, setLoadingSent] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendData, setTrendData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [detectedExpression, setDetectedExpression] = useState(null);
  const [detectedConfidence, setDetectedConfidence] = useState(null);
  const { user, addPoints } = useUser();

  const userId = useMemo(() => (user?.id ? `user${user.id}` : 'user1'), [user]);

  // Handle emotion detection from webcam
  const handleEmotionDetected = (emotion) => {
    console.log('FaceEmotionDetector callback:', emotion); // Debug log
    setDetectedEmotion(emotion);
    setDetectedExpression(emotion.name);
    setDetectedConfidence(emotion.confidence);

    // Auto-suggest mood based on detected emotion
    const emotionToMood = {
      happy: 'happy',
      amazing: 'amazing',
      sad: 'down',
      angry: 'stressed',
      fearful: 'stressed',
      surprised: 'okay',
      disgusted: 'down',
      neutral: 'okay'
    };
    
    const suggestedMood = emotionToMood[emotion.name.toLowerCase()] || 'okay';
    
    // Auto-select mood if not already selected
    if (!selectedMood) {
      setSelectedMood(suggestedMood);
    }
  };

  const moods = [
    { value: 'amazing', emoji: '🤩', label: 'Amazing', color: 'from-green-400 to-emerald-500' },
    { value: 'happy', emoji: '😊', label: 'Happy', color: 'from-yellow-400 to-orange-400' },
    { value: 'okay', emoji: '😐', label: 'Okay', color: 'from-blue-400 to-cyan-400' },
    { value: 'down', emoji: '😔', label: 'Down', color: 'from-purple-400 to-indigo-400' },
    { value: 'stressed', emoji: '😰', label: 'Stressed', color: 'from-red-400 to-pink-400' },
  ];

  const energyLevels = [
    { value: 'high', label: 'High Energy', icon: '⚡' },
    { value: 'medium', label: 'Moderate', icon: '🔋' },
    { value: 'low', label: 'Low Energy', icon: '🪫' },
  ];

  // Map UI mood to backend score 1..5
  const moodToScore = (m) => {
    switch (m) {
      case 'amazing': return 5;
      case 'happy': return 4;
      case 'okay': return 3;
      case 'down': return 2;
      case 'stressed': return 1;
      default: return 3;
    }
  };

  const refreshTrends = async () => {
    try {
      setTrendLoading(true);
      const t = await api.mood.trends({ userId, window: 7, shortWindow: 3 });
      const fc = await api.mood.forecast({ userId, daysAhead: 7 });
      setTrendData(t);
      setForecast(fc);
    } catch (e) {
      console.error('Load trends failed', e);
      setTrendData(null);
      setForecast([]);
    } finally {
      setTrendLoading(false);
    }
  };

  useEffect(() => {
    refreshTrends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSubmit = async () => {
    if (selectedMood && selectedEnergy) {
      try {
        await api.mood.submit({
          userId,
          score: moodToScore(selectedMood),
          activity: selectedEnergy,
          journal: notes.trim() || null
        });
        addPoints(10);
        setIsSubmitted(true);
        await refreshTrends();
      } catch (e) {
        console.error('Mood submit failed', e);
      } finally {
        setTimeout(() => {
          setIsSubmitted(false);
          setSelectedMood(null);
          setSelectedEnergy(null);
          setNotes('');
          setSentiment(null);
        }, 1200);
      }
    }
  };

  const analyzeNotes = async () => {
    const text = notes.trim();
    if (!text) return;
    
    setSentimentError(null); // Clear previous errors
    
    try {
      setLoadingSent(true);
      
      // Use BiLSTM for deep emotional understanding, fallback to VADER for speed
      let res;
      try {
        res = await api.sentiment.analyzeText(text, 'bilstm', { 
          extractKeywords: true,
          timeout: 15000 // 15 second timeout for BiLSTM
        });
      } catch (bilstmError) {
        console.warn('BiLSTM analysis failed, falling back to VADER:', bilstmError);
        
        // Try VADER as fallback - it's faster and more reliable
        try {
          res = await api.sentiment.analyzeText(text, 'vader', { 
            extractKeywords: true,
            timeout: 5000 
          });
        } catch (vaderError) {
          // If both fail, throw a user-friendly error
          throw new Error('Unable to analyze sentiment. Please check your connection and try again.');
        }
      }
      
      setSentiment(res);
      
      // Auto-suggest mood score based on sentiment intensity
      if (res.intensity !== undefined) {
        const suggestedScore = Math.round((res.intensity + 1) * 2.5); // -1 to +1 → 1 to 5
        const moodMap = ['stressed', 'down', 'okay', 'happy', 'amazing'];
        const suggestedMood = moodMap[Math.max(0, Math.min(4, suggestedScore - 1))];
        
        if (!selectedMood) {
          setSelectedMood(suggestedMood);
        }
      }
      
    } catch (e) {
      console.error('Sentiment analyze failed', e);
      setSentimentError(e.message || 'Failed to analyze sentiment');
      setSentiment(null);
    } finally {
      setLoadingSent(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto animate-pulse">
            ✨
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Thank you for checking in!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            +10 points earned! Your mood has been recorded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Daily Mood Check-in 💙
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Take a moment to reflect on how you&apos;re feeling today
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mood Selection */}
        <div className="lg:col-span-2 space-y-8">
          {/* Real-time Face Emotion Detection (Hidden) */}
          <FaceEmotionDetector
            onEmotionDetected={handleEmotionDetected}
            intervalMs={5000}
            autoStart={true}
            showPreview={true} // Make visible for debugging
            compact={false}
          />
  {/* Show detected expression above mood selection if available */}
  {detectedExpression && (
    <DetectedExpression expression={detectedExpression} confidence={detectedConfidence} />
  )}
  {/* Show error if FaceEmotionDetector fails */}
  {detectedEmotion && detectedEmotion.error && (
    <div className="p-4 bg-red-100 text-red-700 rounded-xl mb-4">
      Error: {detectedEmotion.error}
    </div>
  )}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 animate-slide-up" style={{animationDelay: '60ms'}}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <span className="mr-2">🎭</span>
              How are you feeling right now?
            </h3>
            
            {/* AI Emotion Detection Status */}
            {detectedEmotion && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{
                      detectedEmotion.name === 'happy' ? '😊' : 
                      detectedEmotion.name === 'sad' ? '😢' : 
                      detectedEmotion.name === 'angry' ? '😠' : 
                      detectedEmotion.name === 'surprised' ? '😲' : 
                      detectedEmotion.name === 'fearful' ? '😰' : 
                      detectedEmotion.name === 'disgusted' ? '🤢' : '😐'
                    }</span>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        AI detected: <span className="capitalize">{detectedEmotion.name}</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {(detectedEmotion.confidence * 100).toFixed(0)}% confidence • Hidden camera active
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(detectedEmotion.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 text-center ${
                    selectedMood === mood.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 scale-105'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="text-2xl sm:text-3xl mb-2">{mood.emoji}</div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 block">
                    {mood.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Level */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 animate-fade-in" style={{animationDelay: '120ms'}}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <span className="mr-2">⚡</span>
              What&apos;s your energy level?
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {energyLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setSelectedEnergy(level.value)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 text-center ${
                    selectedEnergy === level.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-2">{level.icon}</div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {level.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 animate-fade-in" style={{animationDelay: '180ms'}}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <MessageSquare className="mr-2 w-5 h-5" />
              Any thoughts to add? (Optional)
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What's on your mind today? Any specific events or feelings you'd like to note..."
              className="w-full h-32 p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={analyzeNotes}
                disabled={!notes.trim() || loadingSent}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  notes.trim() && !loadingSent ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loadingSent ? 'Analyzing…' : 'Analyze Sentiment'}
              </button>
            </div>
            
            {/* Sentiment Analysis Results */}
            {sentiment && !sentiment.error && (
              <div className="mt-4 space-y-3">
                <SentimentCard 
                  sentiment={sentiment}
                  showKeywords={true}
                  showMetadata={true}
                  className="w-full"
                />
                
                <SentimentMeter
                  sentiment={sentiment}
                  variant="horizontal"
                  size="large"
                  showLabel={true}
                />
              </div>
            )}
            
            {/* Sentiment Analysis Error */}
            {sentimentError && (
              <div className="mt-4 p-4 border border-red-200 dark:border-red-800 rounded-xl bg-red-50 dark:bg-red-900/20">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                      Sentiment Analysis Failed
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                      {sentimentError}
                    </p>
                    <button
                      onClick={analyzeNotes}
                      disabled={loadingSent}
                      className="flex items-center space-x-2 text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingSent ? 'animate-spin' : ''}`} />
                      <span>Retry Analysis</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedMood || !selectedEnergy}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
              selectedMood && selectedEnergy
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-105'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Submit Check-in ✨
          </button>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Today's Stats */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Today&apos;s Wellness</h3>
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Check-ins</span>
                  <span className="font-bold">1/3</span>
                </div>
                <div className="flex justify-between">
                  <span>Mood Average</span>
                  <span className="font-bold">😊 Happy</span>
                </div>
                <div className="flex justify-between">
                  <span>Streak</span>
                  <span className="font-bold">7 days 🔥</span>
                </div>
              </div>
            </div>

            {/* Weekly Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Weekly Trend</h3>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="space-y-2">
                {trendLoading && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading trend…</div>
                )}
                {!trendLoading && trendData && (
                  <>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Status: <span className={`font-semibold ${trendData.summary.label === 'improving' ? 'text-green-600 dark:text-green-400' : trendData.summary.label === 'declining' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>{trendData.summary.label}</span>
                    </div>
                    <MoodTrendChart
                      series={trendData.series}
                      rollMean={trendData.roll_mean}
                      rollMeanShort={trendData.roll_mean_short}
                      anomalies={trendData.anomalies || []}
                      forecast={forecast}
                      height={140}
                    />
                  </>
                )}
                {!trendLoading && !trendData && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No data yet. Submit a check-in to get started.</div>
                )}
              </div>
            </div>

            {/* Mood Tip */}
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-4 sm:p-6 text-white">
              <div className="flex items-center mb-3">
                <Sparkles className="w-5 h-5 mr-2" />
                <h3 className="font-semibold">Mood Tip</h3>
              </div>
              <p className="text-sm text-green-100">
                Try the 5-4-3-2-1 grounding technique: Notice 5 things you see, 4 things you hear, 3 things you feel, 2 things you smell, and 1 thing you taste.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Removed duplicate DetectedExpression rendering */}
    </div>
  );
};

export default MoodCheckin;