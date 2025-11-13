import { useState, useEffect } from 'react';
import Reveal from '../components/Reveal';
import { MessageSquare, Heart, Smile, Star, Send, Plus, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import SentimentCard from '../components/SentimentCard';
import { sentimentAPI } from '../services/api';

const ReflectionWall = () => {
  const [newReflection, setNewReflection] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPostForm, setShowPostForm] = useState(false);
  const [sentiment, setSentiment] = useState(null);
  const [sentimentError, setSentimentError] = useState(null);
  const [loadingSent, setLoadingSent] = useState(false);
  const [reflectionSentiments, setReflectionSentiments] = useState({});
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [batchError, setBatchError] = useState(null);

  const categories = [
    { value: 'all', label: 'All Reflections', icon: '💭' },
    { value: 'gratitude', label: 'Gratitude', icon: '🙏' },
    { value: 'growth', label: 'Personal Growth', icon: '🌱' },
    { value: 'inspiration', label: 'Inspiration', icon: '✨' },
    { value: 'support', label: 'Support', icon: '🤝' },
  ];

  const reflections = [
    {
      id: 1,
      text: "Today I realized that small acts of kindness create ripples of joy. A stranger's smile at the coffee shop completely changed my morning energy. Sometimes the simplest gestures have the most profound impact on our day.",
      category: 'inspiration',
      reactions: { heart: 24, smile: 18, star: 12 },
      timeAgo: '2 hours ago',
      anonymous: true
    },
    {
      id: 2,
      text: "I've been practicing gratitude for a week now, and I'm amazed at how it's shifting my perspective. Even on tough days, finding three things to appreciate helps me feel more grounded and hopeful.",
      category: 'gratitude',
      reactions: { heart: 31, smile: 22, star: 19 },
      timeAgo: '4 hours ago',
      anonymous: true
    },
    {
      id: 3,
      text: "To anyone struggling with perfectionism: I'm learning that 'good enough' is actually good enough. Progress over perfection has become my new mantra, and it's freeing me from so much unnecessary stress.",
      category: 'growth',
      reactions: { heart: 45, smile: 28, star: 33 },
      timeAgo: '6 hours ago',
      anonymous: true
    },
    {
      id: 4,
      text: "The meditation sessions have been a game-changer for my anxiety. Five minutes of breathing exercises in the morning sets such a peaceful tone for the entire day. Self-care isn't selfish!",
      category: 'support',
      reactions: { heart: 38, smile: 25, star: 27 },
      timeAgo: '8 hours ago',
      anonymous: true
    },
    {
      id: 5,
      text: "I used to think being vulnerable meant being weak. Now I understand it's actually the strongest thing we can do. Sharing our struggles connects us and reminds us we're not alone in this journey.",
      category: 'growth',
      reactions: { heart: 52, smile: 31, star: 29 },
      timeAgo: '12 hours ago',
      anonymous: true
    },
    {
      id: 6,
      text: "Grateful for rainy days that give us permission to slow down. Sometimes nature knows exactly what we need - a gentle reminder to pause, reflect, and just be present with ourselves.",
      category: 'gratitude',
      reactions: { heart: 29, smile: 21, star: 16 },
      timeAgo: '1 day ago',
      anonymous: true
    }
  ];

  const filteredReflections = selectedCategory === 'all' 
    ? reflections 
    : reflections.filter(r => r.category === selectedCategory);

  // Batch analyze all reflections for sentiment on mount
  useEffect(() => {
    const analyzeBatch = async () => {
      setBatchError(null); // Clear previous errors
      
      try {
        setBatchAnalyzing(true);
        const texts = reflections.map(r => r.text);
        
        // Use Classical model for efficient batch processing
        const sentiments = await sentimentAPI.analyzeBatch(texts, 'classical', {
          timeout: 30000 // 30 second timeout for batch
        });
        
        // Map sentiments to reflection IDs
        const sentimentMap = {};
        reflections.forEach((reflection, index) => {
          if (sentiments[index]) {
            sentimentMap[reflection.id] = sentiments[index];
          }
        });
        
        setReflectionSentiments(sentimentMap);
      } catch (error) {
        console.error('Batch sentiment analysis failed:', error);
        setBatchError(error.message || 'Failed to analyze reflections. Please check your connection.');
        
        // Continue without sentiment analysis - don't block the UI
        setReflectionSentiments({});
      } finally {
        setBatchAnalyzing(false);
      }
    };
    
    if (reflections && reflections.length > 0) {
      analyzeBatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handlePostReflection = () => {
    if (newReflection.trim()) {
      // API call would go here
      console.log('Posting reflection:', newReflection);
      setNewReflection('');
      setShowPostForm(false);
      setSentiment(null);
    }
  };

  const analyzeReflection = async () => {
    const text = newReflection.trim();
    if (!text) return;
    
    setSentimentError(null); // Clear previous errors
    
    try {
      setLoadingSent(true);
      
      // Use Classical model for consistency with batch analysis
      let sentiment;
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
        console.warn('Classical sentiment analysis failed, trying BiLSTM...', classicalError);
        
        // Fallback to BiLSTM if Classical fails
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
          // Final fallback to VADER
          console.warn('BiLSTM failed, using VADER...', bilstmError);
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
      
    } catch (error) {
      console.error('All sentiment analysis attempts failed', error);
      setSentimentError(error.message || 'Unable to analyze sentiment. Please check your connection.');
      setSentiment(null);
    } finally {
      setLoadingSent(false);
    }
  };

  const handleReaction = (reflectionId, reactionType) => {
    // API call would go here
    console.log('Reacting to reflection:', reflectionId, reactionType);
  };

  const getReactionIcon = (type) => {
    switch (type) {
      case 'heart': return <Heart className="w-4 h-4" />;
      case 'smile': return <Smile className="w-4 h-4" />;
      case 'star': return <Star className="w-4 h-4" />;
      default: return null;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'gratitude': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'growth': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'inspiration': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      case 'support': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Reflection Wall 💭
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Share your thoughts and connect with our supportive community
        </p>
        {batchAnalyzing && (
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 animate-pulse">
            Analyzing sentiments...
          </p>
        )}
      </div>

      {/* Sentiment Statistics Dashboard */}
      {Object.keys(reflectionSentiments).length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white animate-fade-in">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Community Sentiment Overview
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const sentiments = Object.values(reflectionSentiments);
              const positive = sentiments.filter(s => s.label === 'Positive' || s.label === 'Joy' || s.label === 'Gratitude').length;
              const neutral = sentiments.filter(s => s.label === 'Neutral' || s.label === 'Contentment').length;
              const concerned = sentiments.filter(s => s.label === 'Anxiety' || s.label === 'Stress').length;
              const total = sentiments.length;
              
              return (
                <>
                  <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-3xl font-bold">{positive}</div>
                    <div className="text-sm text-purple-100">Positive</div>
                    <div className="text-xs text-purple-200 mt-1">{total > 0 ? Math.round((positive/total)*100) : 0}%</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-3xl font-bold">{neutral}</div>
                    <div className="text-sm text-purple-100">Peaceful</div>
                    <div className="text-xs text-purple-200 mt-1">{total > 0 ? Math.round((neutral/total)*100) : 0}%</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-3xl font-bold">{concerned}</div>
                    <div className="text-sm text-purple-100">Supportive</div>
                    <div className="text-xs text-purple-200 mt-1">{total > 0 ? Math.round((concerned/total)*100) : 0}%</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-3xl font-bold">{total}</div>
                    <div className="text-sm text-purple-100">Total</div>
                    <div className="text-xs text-purple-200 mt-1">Analyzed</div>
                  </div>
                </>
              );
            })()}
          </div>
          
          <p className="text-sm text-purple-100 mt-4">
            💡 Our community is sharing {Object.keys(reflectionSentiments).length} reflections with AI-powered sentiment insights
          </p>
        </div>
      )}

      {/* Category Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 animate-slide-up">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Post New Reflection */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white animate-fade-in">
        {!showPostForm ? (
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h3 className="text-xl font-semibold mb-2">Share Your Reflection</h3>
            <p className="text-purple-100 mb-4">
              Your anonymous thoughts can inspire and support others on their wellness journey
            </p>
            <button
              onClick={() => setShowPostForm(true)}
              className="flex items-center space-x-2 bg-white text-purple-600 px-6 py-3 rounded-xl font-medium hover:bg-purple-50 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Write a Reflection</span>
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-xl font-semibold mb-4">Share Your Thoughts</h3>
            <textarea
              value={newReflection}
              onChange={(e) => setNewReflection(e.target.value)}
              placeholder="What insights, gratitude, or support would you like to share with the community? Your post will be anonymous."
              className="w-full h-32 p-4 rounded-xl bg-white/20 text-white placeholder-purple-200 resize-none focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-purple-200">
                {newReflection.length}/500 characters • Anonymous
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={analyzeReflection}
                  disabled={!newReflection.trim() || loadingSent}
                  className={`px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors ${!newReflection.trim() || loadingSent ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loadingSent ? 'Analyzing…' : 'Analyze Sentiment'}
                </button>
                <button
                  onClick={() => {
                    setShowPostForm(false);
                    setNewReflection('');
                  }}
                  className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePostReflection}
                  disabled={!newReflection.trim()}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                    newReflection.trim()
                      ? 'bg-white text-purple-600 hover:bg-purple-50'
                      : 'bg-white/20 text-purple-200 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
            
            {/* Sentiment Analysis for New Reflection */}
            {sentiment && !sentimentError && (
              <div className="mt-4">
                <SentimentCard 
                  sentiment={sentiment}
                  compact={true}
                  showKeywords={true}
                  className="bg-white/10 backdrop-blur-sm"
                />
              </div>
            )}
            
            {/* Individual Reflection Analysis Error */}
            {sentimentError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-600 dark:text-red-300 mb-2">{sentimentError}</p>
                    <button
                      onClick={analyzeReflection}
                      disabled={loadingSent}
                      className="flex items-center space-x-1 text-xs font-medium text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingSent ? 'animate-spin' : ''}`} />
                      <span>Retry</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Batch Analysis Error Banner */}
      {batchError && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                Sentiment Analysis Unavailable
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                {batchError}. Reflections will be shown without sentiment analysis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reflections Feed */}
      <div className="space-y-6">
        {filteredReflections.map((reflection, idx) => (
          <Reveal key={reflection.id} animation="fade-in" delay={idx * 60} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                  A
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Anonymous</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{reflection.timeAgo}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(reflection.category)}`}>
                {categories.find(c => c.value === reflection.category)?.icon} {categories.find(c => c.value === reflection.category)?.label}
              </span>
            </div>

            <p className="text-gray-800 dark:text-gray-200 leading-relaxed mb-4">
              {reflection.text}
            </p>

            {/* Sentiment Badge for Reflection */}
            {reflectionSentiments[reflection.id] && (
              <div className="mb-4">
                <SentimentCard 
                  sentiment={reflectionSentiments[reflection.id]}
                  compact={true}
                  showKeywords={false}
                  className="max-w-fit"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-4">
                {Object.entries(reflection.reactions).map(([type, count]) => (
                  <button
                    key={type}
                    onClick={() => handleReaction(reflection.id, type)}
                    className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    {getReactionIcon(type)}
                    <span className="text-sm">{count}</span>
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {Object.values(reflection.reactions).reduce((a, b) => a + b, 0)} reactions
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Community Guidelines */}
      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Community Guidelines
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <li>• Share authentic thoughts and experiences that might help others</li>
          <li>• Be supportive and kind - we&apos;re all on this wellness journey together</li>
          <li>• Keep reflections positive and constructive</li>
          <li>• All posts are anonymous to create a safe space for sharing</li>
          <li>• Report any content that feels inappropriate or harmful</li>
        </ul>
      </div>
    </div>
  );
};

export default ReflectionWall;