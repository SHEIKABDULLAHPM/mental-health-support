import { useState, useEffect } from 'react';
import { Heart, Shuffle, Copy, BookOpen, Sparkles } from 'lucide-react';
import Reveal from '../components/Reveal';
import { recoAPI } from '../services/api';
import { useUser } from '../contexts/UserContext';

const PositivityDrops = () => {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user } = useUser();
  const [suggestQuote, setSuggestQuote] = useState(null);

  const positivityDrops = [
    {
      id: 1,
      text: "Every small step you take toward healing is a victory worth celebrating. Your courage to keep going, even on the hardest days, is your greatest strength.",
      author: "Healing Hearts",
      category: "Encouragement",
      icon: "💝",
      bgGradient: "from-pink-400 via-rose-500 to-red-500"
    },
    {
      id: 2,
      text: "You are not broken, you are breaking through. Every challenge you face is reshaping you into a stronger, wiser, more compassionate version of yourself.",
      author: "Growth & Resilience",
      category: "Growth",
      icon: "🌱",
      bgGradient: "from-green-400 via-emerald-500 to-teal-500"
    },
    {
      id: 3,
      text: "Your mental health matters. It's okay to not be okay sometimes. What matters is that you're here, you're trying, and you're worthy of love and support.",
      author: "Self-Compassion",
      category: "Self-Love",
      icon: "🤗",
      bgGradient: "from-blue-400 via-cyan-500 to-teal-500"
    },
    {
      id: 4,
      text: "In the garden of your mind, you have the power to plant seeds of positivity. Water them with self-kindness and watch beautiful thoughts bloom.",
      author: "Mindful Living",
      category: "Mindfulness",
      icon: "🌸",
      bgGradient: "from-purple-400 via-pink-500 to-rose-500"
    },
    {
      id: 5,
      text: "Progress isn't always visible from the outside. The internal work you do - the thoughts you choose, the boundaries you set, the self-love you practice - that's where real transformation happens.",
      author: "Inner Strength",
      category: "Growth",
      icon: "✨",
      bgGradient: "from-amber-400 via-yellow-500 to-orange-500"
    },
    {
      id: 6,
      text: "Mindfulness isn't about perfection - it's about presence. Even one conscious breath can shift your entire day toward peace and clarity.",
      author: "Mindful Moments",
      category: "Mindfulness",
      icon: "🧘‍♀️",
      bgGradient: "from-indigo-400 via-purple-500 to-pink-500"
    },
    {
      id: 7,
      text: "Your story is still being written. Today's chapter doesn't define the whole book. Keep writing, keep hoping, keep believing in better days.",
      author: "Hope & Healing",
      category: "Hope",
      icon: "📖",
      bgGradient: "from-yellow-400 via-orange-500 to-red-500"
    }
  ];

  const quickAffirmations = [
    "I am worthy of love and happiness",
    "I choose peace over worry today",
    "My challenges are helping me grow",
    "I am grateful for this moment",
    "I trust in my journey",
    "I am stronger than I realize",
    "I deserve compassion and kindness",
    "I am making progress every day"
  ];

  const categories = [
    { value: 'all', label: 'All', icon: '🌈' },
    { value: 'Encouragement', label: 'Encouragement', icon: '💪' },
    { value: 'Growth', label: 'Growth', icon: '🌱' },
    { value: 'Self-Love', label: 'Self-Love', icon: '💖' },
    { value: 'Mindfulness', label: 'Mindfulness', icon: '🧘' },
    { value: 'Hope', label: 'Hope', icon: '🌟' }
  ];

  const filteredDrops = selectedCategory === 'all' 
    ? positivityDrops 
    : positivityDrops.filter(drop => drop.category === selectedCategory);

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * filteredDrops.length);
    setCurrentQuote(randomIndex);
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (filteredDrops.length > 1) {
        setCurrentQuote(prev => (prev + 1) % filteredDrops.length);
      }
    }, 10000); // Auto-change every 10 seconds

    return () => clearInterval(interval);
  }, [filteredDrops.length]);

  // Fetch recommendations and show a subtle suggestion if Positive Quote is recommended
  useEffect(() => {
    const uid = user?.id ? `user${user.id}` : 'user1';
    recoAPI
      .recommend({ userId: uid, topN: 5, strategy: 'hybrid' })
      .then((items) => {
        const q = items.find(i => i.item_id === 'positive_quote');
        if (q) setSuggestQuote(q); else setSuggestQuote(null);
      })
      .catch(() => setSuggestQuote(null));
  }, [user]);

  const currentDrop = filteredDrops[currentQuote] || filteredDrops[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <Reveal animation="fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Positivity Drops ✨
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Daily doses of inspiration, encouragement, and gentle reminders of your worth
          </p>
        </div>
      </Reveal>

      {/* Category Filter */}
      <Reveal animation="slide-up" delay={100}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
          {suggestQuote && (
            <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-purple-900 dark:text-purple-100">AI suggests more Positive Quotes today</span>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-300">Score: {suggestQuote.score.toFixed(2)}</span>
              </div>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  selectedCategory === category.value
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>{category.icon}</span>
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Main Quote Display */}
      {currentDrop && (
        <Reveal animation="slide-up" delay={200}>
          <div className={`relative rounded-3xl p-8 text-white shadow-2xl bg-gradient-to-br ${currentDrop.bgGradient} overflow-hidden`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white"></div>
              <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full bg-white"></div>
              <div className="absolute top-1/2 right-20 w-12 h-12 rounded-full bg-white"></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                  {currentDrop.icon}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleFavorite(currentDrop.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      favorites.includes(currentDrop.id)
                        ? 'bg-red-500 text-white scale-110'
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    <Heart className="w-5 h-5" fill={favorites.includes(currentDrop.id) ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => copyToClipboard(currentDrop.text)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={getRandomQuote}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300"
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <blockquote className="text-xl md:text-2xl font-medium leading-relaxed mb-6">
                &ldquo;{currentDrop.text}&rdquo;
              </blockquote>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold opacity-90">— {currentDrop.author}</p>
                  <p className="text-sm opacity-75">{currentDrop.category}</p>
                </div>
                <span className="text-sm opacity-75">
                  {currentQuote + 1} of {filteredDrops.length}
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* Quick Affirmations */}
      <Reveal animation="slide-up" delay={300}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Sparkles className="mr-2 w-5 h-5" />
            Quick Affirmations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickAffirmations.map((affirmation, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30"
              >
                <p className="text-gray-800 dark:text-gray-200 font-medium">
                  {affirmation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Navigation Dots */}
      <div className="flex justify-center space-x-2">
        {filteredDrops.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuote(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentQuote
                ? 'bg-purple-500 scale-125'
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
          />
        ))}
      </div>

      {/* Reading List */}
      <Reveal animation="slide-up" delay={400}>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BookOpen className="mr-2 w-5 h-5" />
            Recommended Reading
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "The Power of Now", author: "Eckhart Tolle" },
              { title: "Self-Compassion", author: "Kristin Neff" },
              { title: "The Gifts of Imperfection", author: "Brené Brown" }
            ].map((book, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <h4 className="font-semibold text-gray-900 dark:text-white">{book.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">by {book.author}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
};

export default PositivityDrops;