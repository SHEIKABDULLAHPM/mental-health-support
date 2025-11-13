import { useState, useEffect } from 'react';
import Reveal from '../components/Reveal';
import FaceEmotionDetector from '../components/FaceEmotionDetector';
import DetectedExpression from '../components/DetectedExpression';
import { Book, Music, Globe, Heart, Star, Play, AlertCircle, RefreshCw } from 'lucide-react';
import { recoAPI } from '../services/api';
import { useUser } from '../contexts/UserContext';

const Recommendations = () => {
  const [selectedMood, setSelectedMood] = useState('happy');
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [activeTab, setActiveTab] = useState('books');
  const { user } = useUser();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [detectedExpression, setDetectedExpression] = useState(null);
  const [detectedConfidence, setDetectedConfidence] = useState(null);

  // Handle emotion detection from webcam
  const handleEmotionDetected = (emotion) => {
    console.log('FaceEmotionDetector callback:', emotion); // Debug log
    setDetectedEmotion(emotion);
    setDetectedExpression(emotion.name);
    setDetectedConfidence(emotion.confidence);
    
    // Map detected emotion to mood
    const emotionToMood = {
      happy: 'happy',
      sad: 'sad',
      angry: 'stressed',
      fearful: 'stressed',
      surprised: 'happy',
      disgusted: 'stressed',
      neutral: 'calm'
    };
    
    const mappedMood = emotionToMood[emotion.name.toLowerCase()] || 'calm';
    
    // Auto-update mood if detected with high confidence
    if (emotion.confidence > 0.6) {
      setSelectedMood(mappedMood);
    }
  };

  const moods = [
    { value: 'happy', emoji: '😊', label: 'Happy', color: 'from-yellow-400 to-orange-400' },
    { value: 'calm', emoji: '😌', label: 'Calm', color: 'from-blue-400 to-cyan-400' },
    { value: 'stressed', emoji: '😰', label: 'Stressed', color: 'from-red-400 to-pink-400' },
    { value: 'motivated', emoji: '💪', label: 'Motivated', color: 'from-green-400 to-emerald-400' },
    { value: 'sad', emoji: '😔', label: 'Sad', color: 'from-purple-400 to-indigo-400' },
  ];

  const languages = [
    { value: 'english', label: 'English', flag: '🇺🇸' },
    { value: 'tamil', label: 'Tamil', flag: '🇮🇳' },
    { value: 'telugu', label: 'Telugu', flag: '🇮🇳' },
    { value: 'kannada', label: 'Kannada', flag: '🇮🇳' },
    { value: 'malayalam', label: 'Malayalam', flag: '🇮🇳' },
    { value: 'hindi', label: 'Hindi', flag: '🇮🇳' },
  ];

  const bookRecommendations = {
    happy: [
      {
        title: "The Happiness Project",
        author: "Gretchen Rubin",
        description: "A year-long journey to discover true happiness through small daily changes.",
        rating: 4.8,
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop"
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        description: "Build good habits and break bad ones with this transformative guide.",
        rating: 4.9,
        cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=200&h=300&fit=crop"
      },
      {
        title: "The Power of Now",
        author: "Eckhart Tolle",
        description: "A spiritual guide to finding peace and presence in the current moment.",
        rating: 4.7,
        cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300&fit=crop"
      }
    ],
    calm: [
      {
        title: "Wherever You Go, There You Are",
        author: "Jon Kabat-Zinn",
        description: "Mindfulness meditation in everyday life for inner peace.",
        rating: 4.6,
        cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=300&fit=crop"
      },
      {
        title: "The Miracle of Mindfulness",
        author: "Thich Nhat Hanh",
        description: "Simple practices for finding peace in a busy world.",
        rating: 4.8,
        cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=300&fit=crop"
      }
    ]
  };

  const musicRecommendations = {
    happy: [
      {
        title: "Uplifting Acoustic",
        artist: "Nature Sounds Collective",
        duration: "45 min",
        tracks: 12,
        cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop"
      },
      {
        title: "Positive Vibes",
        artist: "Wellness Music",
        duration: "38 min",
        tracks: 10,
        cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop"
      }
    ],
    calm: [
      {
        title: "Deep Relaxation",
        artist: "Meditation Masters",
        duration: "60 min",
        tracks: 8,
        cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop"
      },
      {
        title: "Peaceful Piano",
        artist: "Serenity Sounds",
        duration: "52 min",
        tracks: 15,
        cover: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=200&h=200&fit=crop"
      }
    ]
  };

  const getCurrentRecommendations = () => {
    return activeTab === 'books' 
      ? bookRecommendations[selectedMood] || bookRecommendations.happy
      : musicRecommendations[selectedMood] || musicRecommendations.happy;
  };

  useEffect(() => {
    const uid = user?.id ? `user${user.id}` : 'user1';
    setLoading(true);
    setError(null);
    
    recoAPI
      .recommend({ userId: uid, topN: 6, strategy: 'hybrid', context: { mood: selectedMood } })
      .then(data => {
        setRecs(data);
        setError(null);
      })
      .catch(err => {
        console.error('Recommendation API failed:', err);
        setError(err.message || 'Failed to fetch recommendations. Please check your connection.');
        setRecs([]);
      })
      .finally(() => setLoading(false));
  }, [user, selectedMood]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Personalized Recommendations 🎯
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Discover books and music tailored to your current mood and preferences
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 animate-slide-up">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mood Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Heart className="mr-2 w-5 h-5" />
              How are you feeling?
              {detectedEmotion && (
                <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                  (AI: {detectedEmotion.name} {(detectedEmotion.confidence * 100).toFixed(0)}%)
                </span>
              )}
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 text-center ${
                    selectedMood === mood.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 scale-105'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:scale-105'
                  }`}
                >
                  <div className="text-2xl mb-1">{mood.emoji}</div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {mood.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Globe className="mr-2 w-5 h-5" />
              Preferred Language
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {languages.map((language) => (
                <button
                  key={language.value}
                  onClick={() => setSelectedLanguage(language.value)}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 text-center ${
                    selectedLanguage === language.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-lg mb-1">{language.flag}</div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {language.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Face Emotion Detection (Visible for Debugging) */}
      <FaceEmotionDetector
        onEmotionDetected={handleEmotionDetected}
        intervalMs={5000}
        autoStart={true}
        showPreview={true} // Make visible for debugging
        compact={false}
      />

      {/* Show error if FaceEmotionDetector fails */}
      {detectedEmotion && detectedEmotion.error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-xl mb-4">
          Error: {detectedEmotion.error}
        </div>
      )}

      {/* Detected Expression Display */}
      {detectedExpression && (
        <DetectedExpression expression={detectedExpression} confidence={detectedConfidence} />
      )}

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-2 flex space-x-2">
          <button
            onClick={() => setActiveTab('books')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'books'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Book className="w-4 h-4" />
            <span>Books</span>
          </button>
          <button
            onClick={() => setActiveTab('music')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'music'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Music</span>
          </button>
        </div>
      </div>

      {/* AI Recommendations (Backend) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Recommendations</h3>
          {loading && <span className="text-xs text-gray-500 dark:text-gray-400">Loading…</span>}
        </div>
        
        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                  Recommendation Service Unavailable
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                  {error}
                </p>
                <button
                  onClick={() => {
                    const uid = user?.id ? `user${user.id}` : 'user1';
                    setLoading(true);
                    setError(null);
                    recoAPI
                      .recommend({ userId: uid, topN: 6, strategy: 'hybrid', context: { mood: selectedMood } })
                      .then(data => {
                        setRecs(data);
                        setError(null);
                      })
                      .catch(err => {
                        setError(err.message || 'Failed to fetch recommendations');
                        setRecs([]);
                      })
                      .finally(() => setLoading(false));
                  }}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Retry</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {!error && recs.length === 0 && !loading && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No AI recommendations available at the moment. Try the curated content below!
          </p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recs.map((r, idx) => (
            <Reveal key={r.item_id} animation="fade-in" delay={idx * 60} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{r.title}</h4>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{r.category}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{Array.isArray(r.tags) ? r.tags.slice(0, 4).join(', ') : ''}</p>
                <div className="flex items-center justify-between">
                  <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">Open →</button>
                  <span className="text-xs text-gray-500">Score: {r.score.toFixed(2)}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Static Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getCurrentRecommendations().map((item, index) => (
          <Reveal key={index} animation="fade-in" delay={index * 70} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={item.cover}
                alt={item.title}
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {activeTab === 'books' ? `by ${item.author}` : `by ${item.artist}`}
                  </p>
                </div>
                {activeTab === 'books' && (
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">{item.rating}</span>
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                {item.description || `${item.duration} • ${item.tracks} tracks`}
              </p>
              
              <div className="flex space-x-3">
                <button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105">
                  {activeTab === 'books' ? 'Read More' : 'Listen Now'}
                </button>
                {activeTab === 'music' && (
                  <button className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Mood-based Tips */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
        <h3 className="text-xl font-semibold mb-3">
          Perfect for your {moods.find(m => m.value === selectedMood)?.emoji} {moods.find(m => m.value === selectedMood)?.label.toLowerCase()} mood
        </h3>
        <p className="text-purple-100 leading-relaxed">
          {selectedMood === 'happy' && "These uplifting selections will amplify your positive energy and keep your spirits high throughout the day."}
          {selectedMood === 'calm' && "These peaceful choices will help maintain your inner tranquility and deepen your sense of relaxation."}
          {selectedMood === 'stressed' && "These soothing recommendations are designed to help you unwind and find your center again."}
          {selectedMood === 'motivated' && "These inspiring selections will fuel your drive and help you channel your energy productively."}
          {selectedMood === 'sad' && "These gentle, uplifting choices can provide comfort and gradually lift your spirits."}
        </p>
      </div>
    </div>
  );
};

export default Recommendations;