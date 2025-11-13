import { useState, useEffect } from 'react';
import { Trophy, Target, Calendar, Star, Check, Lock } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { recoAPI } from '../services/api';

const Challenges = () => {
  const { streak, addBadge, addPoints } = useUser();
  const [suggestion, setSuggestion] = useState(null);

  const weeklyGoals = [
    { 
      id: 'gratitude', 
      title: 'Gratitude Practice', 
      description: 'Write down 3 things you\'re grateful for each day',
      progress: 5,
      target: 7,
      points: 50,
      icon: '🙏',
      color: 'from-green-400 to-emerald-500'
    },
    { 
      id: 'mindfulness', 
      title: '5-Minute Mindfulness', 
      description: 'Complete 5 minutes of mindful breathing daily',
      progress: 3,
      target: 7,
      points: 75,
      icon: '🧘‍♀️',
      color: 'from-blue-400 to-cyan-500'
    },
    { 
      id: 'movement', 
      title: 'Gentle Movement', 
      description: 'Take a mindful walk or stretch for 15 minutes',
      progress: 4,
      target: 5,
      points: 60,
      icon: '🚶‍♀️',
      color: 'from-purple-400 to-pink-500'
    },
    { 
      id: 'positivity', 
      title: 'Positive Affirmations', 
      description: 'Practice positive self-talk and affirmations',
      progress: 2,
      target: 7,
      points: 40,
      icon: '💫',
      color: 'from-yellow-400 to-orange-500'
    }
  ];

  const achievements = [
    {
      id: 'first_week',
      title: 'First Week Warrior',
      description: 'Completed your first 7-day streak',
      earned: true,
      icon: '🏆',
      rarity: 'Bronze'
    },
    {
      id: 'mood_master',
      title: 'Mood Master',
      description: 'Completed 30 mood check-ins',
      earned: true,
      icon: '😊',
      rarity: 'Silver'
    },
    {
      id: 'journal_enthusiast',
      title: 'Journal Enthusiast',
      description: 'Written 25 journal entries',
      earned: false,
      icon: '📖',
      rarity: 'Gold'
    },
    {
      id: 'mindful_month',
      title: 'Mindful Month',
      description: 'Maintained a 30-day streak',
      earned: false,
      icon: '🧘‍♂️',
      rarity: 'Platinum'
    },
    {
      id: 'community_helper',
      title: 'Community Helper',
      description: 'Shared 10 positive reflections',
      earned: true,
      icon: '🤝',
      rarity: 'Bronze'
    },
    {
      id: 'future_self',
      title: 'Future Self Believer',
      description: 'Written 5 letters to future self',
      earned: false,
      icon: '💌',
      rarity: 'Silver'
    }
  ];

  const monthlyMilestones = [
    {
      title: 'Consistency Champion',
      description: 'Complete all daily activities for 30 days',
      progress: 15,
      target: 30,
      reward: '500 points + Platinum badge',
      locked: false
    },
    {
      title: 'Wellness Explorer',
      description: 'Try all available activities at least once',
      progress: 8,
      target: 11,
      reward: '300 points + Explorer badge',
      locked: false
    },
    {
      title: 'Reflection Master',
      description: 'Share 50 positive reflections',
      progress: 12,
      target: 50,
      reward: '400 points + Master badge',
      locked: streak < 14
    }
  ];

  const completeGoal = (goalId) => {
    const goal = weeklyGoals.find(g => g.id === goalId);
    if (goal && goal.progress < goal.target) {
      goal.progress += 1;
      addPoints(10);
      
      if (goal.progress === goal.target) {
        addPoints(goal.points - 10);
        addBadge({
          name: goal.title + ' Champion',
          icon: goal.icon,
          earned: new Date().toISOString()
        });
      }
    }
  };

  useEffect(() => {
    const uid =  'user1';
    recoAPI
      .recommend({ userId: uid, topN: 5, strategy: 'hybrid' })
      .then((items) => {
        const b = items.find(i => i.item_id === 'breathing_exercise' || i.category === 'Breathing');
        if (b) setSuggestion(b); else setSuggestion(null);
      })
      .catch(() => setSuggestion(null));
  }, []);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Bronze': return 'from-amber-400 to-orange-500';
      case 'Silver': return 'from-gray-300 to-gray-500';
      case 'Gold': return 'from-yellow-400 to-yellow-600';
      case 'Platinum': return 'from-purple-400 to-indigo-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Wellness Challenges 🎯
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Build healthy habits and earn rewards on your journey to better mental health
        </p>
      </div>

      {/* Current Streak */}
      <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
              🔥
            </div>
            <div>
              <h3 className="text-2xl font-bold">{streak} Day Streak!</h3>
              <p className="text-orange-100">Keep the momentum going strong</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-orange-200 text-sm">Next milestone</p>
            <p className="text-xl font-bold">{Math.ceil((streak + 1) / 7) * 7} days</p>
          </div>
        </div>
      </div>

      {suggestion && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-800 dark:text-gray-200">AI suggests a challenge: <span className="font-semibold">{suggestion.title}</span></div>
            <div className="text-xs text-gray-500">Score: {suggestion.score.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Goals */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Target className="mr-2 w-5 h-5" />
                Weekly Goals
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                4 days remaining
              </div>
            </div>

            <div className="space-y-4">
              {weeklyGoals.map((goal) => (
                <div key={goal.id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${goal.color} flex items-center justify-center text-xl`}>
                        {goal.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {goal.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {goal.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {goal.progress}/{goal.target}
                      </div>
                      <div className="text-xs text-gray-400">
                        {goal.points} pts
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`bg-gradient-to-r ${goal.color} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${(goal.progress / goal.target) * 100}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => completeGoal(goal.id)}
                      disabled={goal.progress >= goal.target}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        goal.progress >= goal.target
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50'
                      }`}
                    >
                      {goal.progress >= goal.target ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Complete</span>
                        </>
                      ) : (
                        <>
                          <span>Mark Done</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Milestones */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Calendar className="mr-2 w-5 h-5" />
              Monthly Milestones
            </h3>

            <div className="space-y-4">
              {monthlyMilestones.map((milestone, index) => (
                <div key={index} className={`border rounded-xl p-4 ${
                  milestone.locked 
                    ? 'border-gray-300 dark:border-gray-600 opacity-50' 
                    : 'border-gray-200 dark:border-gray-600'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {milestone.locked ? (
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                          <Lock className="w-5 h-5 text-gray-500" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white">
                          <Trophy className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {milestone.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {milestone.progress}/{milestone.target}
                      </div>
                      <div className="text-xs text-gray-400">
                        {milestone.reward}
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(milestone.progress / milestone.target) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Trophy className="mr-2 w-5 h-5" />
              Achievements
            </h3>

            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  achievement.earned
                    ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-600 opacity-60'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                      achievement.earned
                        ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)}`
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      {achievement.earned ? achievement.icon : '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {achievement.title}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          achievement.rarity === 'Bronze' ? 'bg-amber-100 text-amber-700' :
                          achievement.rarity === 'Silver' ? 'bg-gray-100 text-gray-700' :
                          achievement.rarity === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {achievement.rarity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {achievement.description}
                      </p>
                    </div>
                    {achievement.earned && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
            <h3 className="font-semibold mb-4 flex items-center">
              <Star className="mr-2 w-5 h-5" />
              Your Progress
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Challenges Completed</span>
                <span className="font-bold">23</span>
              </div>
              <div className="flex justify-between">
                <span>Badges Earned</span>
                <span className="font-bold">8</span>
              </div>
              <div className="flex justify-between">
                <span>Current Streak</span>
                <span className="font-bold">{streak} days 🔥</span>
              </div>
              <div className="flex justify-between">
                <span>Total Points</span>
                <span className="font-bold">1,247</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Challenges;