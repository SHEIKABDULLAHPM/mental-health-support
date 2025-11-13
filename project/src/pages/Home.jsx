import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { 
  Heart, 
  BookOpen, 
  Target, 
  Activity, 
  TrendingUp, 
  Calendar,
  Sparkles,
  Brain,
  ArrowRight,
  CheckCircle,
  Clock
} from 'lucide-react';
import Reveal from '../components/Reveal';
import { recoAPI } from '../services/api';
import api from '../services/api';
import MoodTrendChart from '../components/MoodTrendChart';

const Home = () => {
  const navigate = useNavigate();
  const { user, addPoints, isLoading } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isNewUser, setIsNewUser] = useState(false);
  const [recs, setRecs] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [trendData, setTrendData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check if user just completed onboarding
    const hasJustOnboarded = sessionStorage.getItem('mindpeace-just-onboarded');
    if (hasJustOnboarded) {
      console.log('New user detected, showing welcome message');
      setIsNewUser(true);
      sessionStorage.removeItem('mindpeace-just-onboarded');
      
      // Award welcome points for completing onboarding (with delay to ensure context is ready)
      setTimeout(() => {
        if (addPoints) {
          console.log('Awarding 50 welcome points');
          addPoints(50);
        }
      }, 500);
      
      // Auto-remove the welcome message after 10 seconds
      setTimeout(() => setIsNewUser(false), 10000);
    }
  }, [addPoints]);

  // Fetch recommendations for Home
  useEffect(() => {
    const uid = user?.id ? `user${user.id}` : 'user1';
    setRecsLoading(true);
    recoAPI
      .recommend({ userId: uid, topN: 3, strategy: 'hybrid' })
      .then(setRecs)
      .catch(() => setRecs([]))
      .finally(() => setRecsLoading(false));
  }, [user]);

  // Fetch mood trends for Home
  useEffect(() => {
    const uid = user?.id ? `user${user.id}` : 'user1';
    let mounted = true;
    (async () => {
      try {
        setTrendLoading(true);
        const t = await api.mood.trends({ userId: uid, window: 7, shortWindow: 3 });
        const fc = await api.mood.forecast({ userId: uid, daysAhead: 7 });
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
  }, [user]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Show loading state while user context is initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto animate-spin">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Check Your Mood',
      description: 'How are you feeling today?',
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
      path: '/mood-checkin'
    },
    {
      title: 'Write in Journal',
      description: 'Reflect on your thoughts',
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      path: '/journal'
    },
    {
      title: 'Take a Challenge',
      description: 'Build healthy habits',
      icon: Target,
      color: 'from-green-500 to-emerald-500',
      path: '/challenges'
    },
    {
      title: 'Try an Activity',
      description: 'Mindfulness exercises',
      icon: Activity,
      color: 'from-purple-500 to-indigo-500',
      path: '/activities'
    }
  ];

  const recentActivity = [
    { type: 'mood', message: 'Mood check-in completed', time: '2 hours ago', icon: Heart },
    { type: 'journal', message: 'New journal entry added', time: 'Yesterday', icon: BookOpen },
    { type: 'challenge', message: 'Gratitude challenge completed', time: '2 days ago', icon: Target },
    { type: 'activity', message: 'Meditation session finished', time: '3 days ago', icon: Activity }
  ];

  const weeklyInsights = {
    moodAverage: 7.2,
    journalEntries: 5,
    challengesCompleted: 3,
    activitiesFinished: 8,
    streak: 12
  };

  return (
    <div className="space-y-8">
      {/* New User Welcome Banner */}
      {isNewUser && (
        <Reveal animation="slide-down">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            <div className="relative z-10 text-center">
              <h2 className="text-2xl font-bold mb-2">🎉 Welcome to MindPeace!</h2>
              <p className="text-lg opacity-90 mb-4">
                Congratulations on completing your onboarding! Your personalized wellness journey starts now.
              </p>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 inline-block">
                <p className="text-sm">
                  🏆 +50 Welcome Points Earned! | 💡 Tip: Start with a mood check-in or explore activities
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* Welcome Header */}
      <Reveal animation="fade-in">
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-2xl lg:text-4xl font-bold mb-2">
                  {getGreeting()}, {user?.name || 'Friend'}! 🌟
                </h1>
                <p className="text-lg lg:text-xl opacity-90 mb-4 lg:mb-6">
                  {isNewUser 
                    ? "Your personalized mental wellness journey starts here. Let&apos;s explore together!" 
                    : "Welcome back to your wellness journey. Let&apos;s make today meaningful."
                  }
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-sm lg:text-base">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>{currentTime.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>{currentTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white/20 rounded-full flex items-center justify-center text-4xl lg:text-5xl">
                  🧠
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Mood Trend Overview */}
      <Reveal animation="slide-up" delay={150}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Mood Trend</h2>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {trendData ? (
                <span>
                  Status: <span className={`font-semibold ${trendData.summary.label === 'improving' ? 'text-green-600 dark:text-green-400' : trendData.summary.label === 'declining' ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}>{trendData.summary.label}</span>
                </span>
              ) : (
                <span>{trendLoading ? 'Loading…' : 'No data yet'}</span>
              )}
            </div>
          </div>
          {trendData && (
            <MoodTrendChart
              series={trendData.series}
              rollMean={trendData.roll_mean}
              rollMeanShort={trendData.roll_mean_short}
              anomalies={trendData.anomalies || []}
              forecast={forecast}
              height={160}
            />
          )}
          {!trendData && !trendLoading && (
            <div className="text-sm text-gray-500 dark:text-gray-400">Complete a mood check-in to see your trend.</div>
          )}
        </div>
      </Reveal>

      {/* Quick Actions */}
      <Reveal animation="slide-up" delay={100}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className="group p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-left">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 text-left">
                    {action.description}
                  </p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    <span>Get started</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* Weekly Insights */}
      <Reveal animation="slide-up" delay={200}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              Weekly Insights
            </h2>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">{weeklyInsights.moodAverage}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Avg Mood</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">This week</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">{weeklyInsights.journalEntries}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Journal</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Entries</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">{weeklyInsights.challengesCompleted}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Challenges</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">{weeklyInsights.activitiesFinished}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Activities</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Finished</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">{weeklyInsights.streak}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Day Streak</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Keep going!</p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Recent Activity & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Reveal animation="slide-up" delay={300}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Recent Activity
            </h3>
            
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {activity.message}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.time}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* AI Recommendations */}
        <Reveal animation="slide-up" delay={400}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <Brain className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                For You Today
              </h3>
            </div>
            
            <div className="space-y-4">
              {recsLoading && (
                <div className="text-sm text-gray-500 dark:text-gray-400">Loading recommendations…</div>
              )}
              {!recsLoading && recs.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">No recommendations yet. Try some activities to personalize.</div>
              )}
              {!recsLoading && recs.map((r) => (
                <div key={r.item_id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900 dark:text-purple-100">{r.title}</span>
                    </div>
                    <span className="text-xs bg-white/60 dark:bg-white/10 text-purple-700 dark:text-purple-200 px-2 py-0.5 rounded-full">Score: {r.score.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">{r.category}{Array.isArray(r.tags) && r.tags.length ? ` • ${r.tags.slice(0,3).join(', ')}` : ''}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <button
                      onClick={() => navigate(r.type === 'audio' ? '/nature-sounds' : r.type === 'game' ? '/activities' : '/recommendations')}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      Open →
                    </button>
                    <button
                      onClick={() => recoAPI.feedback({ userId: user?.id ? `user${user.id}` : 'user1', itemId: r.item_id, rating: 5 })}
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                      I like this
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default Home;