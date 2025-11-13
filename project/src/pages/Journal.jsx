import { useEffect, useMemo, useState } from 'react';
import { Calendar, TrendingUp, Save, CreditCard as Edit3, Sparkles, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import Reveal from '../components/Reveal';
import api from '../services/api';
import { useUser } from '../contexts/UserContext';
import MoodTrendChart from '../components/MoodTrendChart';
import SentimentCard from '../components/SentimentCard';
import { sentimentAPI } from '../services/api';

const Journal = () => {
  const [currentEntry, setCurrentEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sentiment, setSentiment] = useState(null);
  const [sentimentError, setSentimentError] = useState(null);
  const [loadingSent, setLoadingSent] = useState(false);
  const [trendData, setTrendData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const { user } = useUser();
  const userId = useMemo(() => (user?.id ? `user${user.id}` : 'user1'), [user]);

  const moods = [
    { value: 'grateful', emoji: '🙏', label: 'Grateful' },
    { value: 'excited', emoji: '🎉', label: 'Excited' },
    { value: 'peaceful', emoji: '😌', label: 'Peaceful' },
    { value: 'thoughtful', emoji: '🤔', label: 'Thoughtful' },
    { value: 'hopeful', emoji: '🌟', label: 'Hopeful' },
  ];

  const recentEntries = [
    {
      date: '2024-01-15',
      mood: '😌',
      preview: 'Today was a peaceful day. I spent time in the garden and felt really connected to nature...',
      wordCount: 234
    },
    {
      date: '2024-01-14',
      mood: '🎉',
      preview: 'Exciting news at work today! I got the promotion I\'ve been working toward...',
      wordCount: 189
    },
    {
      date: '2024-01-13',
      mood: '🙏',
      preview: 'Grateful for the small moments today. Had coffee with Mom and it reminded me...',
      wordCount: 156
    }
  ];

  const aiSuggestions = [
    "What made you smile today?",
    "Describe a moment when you felt proud of yourself",
    "What are you most grateful for right now?",
    "How did you overcome a challenge today?",
    "What would you tell your past self from a year ago?"
  ];

  const handleSave = () => {
    if (currentEntry.trim() && selectedMood) {
      // API call would go here
      console.log('Saving entry:', { entry: currentEntry, mood: selectedMood });
      setCurrentEntry('');
      setSelectedMood('');
      setSentiment(null);
    }
  };

  useEffect(() => {
    if (!showAnalytics) return;
    let mounted = true;
    (async () => {
      try {
        setTrendLoading(true);
        const t = await api.mood.trends({ userId, window: 7, shortWindow: 3 });
        const fc = await api.mood.forecast({ userId, daysAhead: 7 });
        if (!mounted) return;
        setTrendData(t);
        setForecast(fc);
      } catch (e) {
        if (!mounted) return;
        setTrendData(null);
        setForecast([]);
      } finally {
        if (mounted) setTrendLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [showAnalytics, userId]);

  const analyzeSentiment = async () => {
    const text = currentEntry.trim();
    if (!text) return;
    
    setSentimentError(null); // Clear previous errors
    
    try {
      setLoadingSent(true);
      
      // Use BiLSTM for deep contextual analysis of journal entries
      let sentiment;
      try {
        sentiment = await sentimentAPI.analyzeText(
          text,
          'bilstm',
          { 
            extractKeywords: true,
            timeout: 15000 
          }
        );
      } catch (bilstmError) {
        console.warn('BiLSTM sentiment analysis failed, trying fallback...', bilstmError);
        
        // Fallback to Classical model if BiLSTM fails
        try {
          sentiment = await sentimentAPI.analyzeText(
            text,
            'classical',
            { 
              extractKeywords: true,
              timeout: 10000 
            }
          );
        } catch (classicalError) {
          // Final fallback to VADER
          console.warn('Classical model failed, using VADER...', classicalError);
          sentiment = await sentimentAPI.analyzeText(
            text,
            'vader',
            { 
              extractKeywords: true,
              timeout: 5000 
            }
          );
        }
      }
      
      setSentiment(sentiment);
      
      // Auto-suggest mood based on sentiment if none selected
      if (!selectedMood && sentiment.label) {
        const moodMapping = {
          'Positive': 'hopeful',
          'Joy': 'excited',
          'Gratitude': 'grateful',
          'Contentment': 'peaceful',
          'Anxiety': 'thoughtful',
          'Sadness': 'thoughtful',
          'Stress': 'thoughtful',
          'Depression': 'thoughtful',
          'Negative': 'thoughtful'
        };
        
        const suggestedMood = moodMapping[sentiment.label] || 'thoughtful';
        setSelectedMood(suggestedMood);
      }
      
    } catch (error) {
      console.error('All sentiment analysis attempts failed', error);
      setSentimentError(error.message || 'Unable to analyze sentiment. Please check your connection.');
      setSentiment(null);
    } finally {
      setLoadingSent(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Journal 📖
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Express your thoughts and track your emotional journey
          </p>
        </div>
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Journal Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Edit3 className="mr-2 w-5 h-5" />
                  Today&apos;s Entry
                </h3>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date().toLocaleDateString()}
                </div>
              </div>

              {/* Mood Selection */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">How are you feeling while writing?</p>
                <div className="flex flex-wrap gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setSelectedMood(mood.value)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm transition-all duration-300 ${
                        selectedMood === mood.value
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-500'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <span>{mood.emoji}</span>
                      <span>{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6">
              <textarea
                value={currentEntry}
                onChange={(e) => setCurrentEntry(e.target.value)}
                placeholder="What's on your mind today? Share your thoughts, feelings, experiences, or anything you'd like to reflect on..."
                className="w-full h-64 p-4 border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none text-lg leading-relaxed"
              />
              
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {currentEntry.length} characters • {currentEntry.split(' ').filter(word => word).length} words
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={analyzeSentiment}
                    disabled={!currentEntry.trim() || loadingSent}
                    className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                      currentEntry.trim() && !loadingSent
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loadingSent ? 'Analyzing…' : 'Analyze Sentiment'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!currentEntry.trim() || !selectedMood}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      currentEntry.trim() && selectedMood
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-105'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Entry</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment Result Panel */}
          {sentiment && !sentiment.error && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Emotional Insights
              </h3>
              
              <SentimentCard 
                sentiment={sentiment}
                showKeywords={true}
                showMetadata={true}
                className="w-full"
              />
              
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Tip:</strong> Your emotional state is being tracked over time. 
                  {sentiment.label === 'Positive' || sentiment.label === 'Joy' 
                    ? ' Keep nurturing these positive feelings!' 
                    : ' Remember, it\'s okay to have difficult emotions. Consider reaching out if you need support.'}
                </p>
              </div>
            </div>
          )}
          
          {/* Sentiment Analysis Error */}
          {sentimentError && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-red-200 dark:border-red-700 p-6 animate-fade-in">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
                    Sentiment Analysis Failed
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                    {sentimentError}
                  </p>
                  <button
                    onClick={analyzeSentiment}
                    disabled={loadingSent}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingSent ? 'animate-spin' : ''}`} />
                    <span>Retry Analysis</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recent Entries */}
          <Reveal animation="fade-in" delay={120} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Recent Entries
            </h3>
            <div className="space-y-4">
              {recentEntries.map((entry, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{entry.mood}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {entry.wordCount} words
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {entry.preview}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Writing Prompts */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white animate-fade-in">
            <div className="flex items-center mb-4">
              <Sparkles className="w-5 h-5 mr-2" />
              <h3 className="font-semibold">AI Writing Prompts</h3>
            </div>
            <div className="space-y-3">
              {aiSuggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentEntry(suggestion + '\n\n')}
                  className="w-full text-left p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Writing Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">This Month</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Entries</span>
                <span className="font-bold text-gray-900 dark:text-white">15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Words Written</span>
                <span className="font-bold text-gray-900 dark:text-white">3,247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Streak</span>
                <span className="font-bold text-gray-900 dark:text-white">7 days 🔥</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Most Common Mood</span>
                <span className="font-bold text-gray-900 dark:text-white">😌 Peaceful</span>
              </div>
            </div>
          </div>

          {/* Mood Insights */}
          <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl p-6 text-white animate-fade-in" style={{animationDelay: '160ms'}}>
            <h3 className="font-semibold mb-3">Weekly Insight</h3>
            <p className="text-sm text-green-100 leading-relaxed">
              Your journal entries show increased gratitude and mindfulness this week. You&apos;re making great progress on your emotional awareness journey!
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Journal Analytics 📊
                </h3>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 h-64">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Mood Trends</h4>
                  {trendLoading && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
                  )}
                  {!trendLoading && trendData && (
                    <MoodTrendChart
                      series={trendData.series}
                      rollMean={trendData.roll_mean}
                      rollMeanShort={trendData.roll_mean_short}
                      anomalies={trendData.anomalies || []}
                      forecast={forecast}
                      height={200}
                    />
                  )}
                  {!trendLoading && !trendData && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No data yet. Try a few check-ins.</div>
                  )}
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">Writing Frequency</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;