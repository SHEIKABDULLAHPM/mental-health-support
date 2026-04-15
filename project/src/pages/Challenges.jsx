import { useMemo, useState, useEffect } from 'react';
import { Target, Star, Check, RefreshCw } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { challengesAPI, recoAPI } from '../services/api';

const Challenges = () => {
  const { streak, addPoints } = useUser();
  const [suggestion, setSuggestion] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [progressRows, setProgressRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const progressByChallengeId = useMemo(() => {
    const map = new Map();
    progressRows.forEach((p) => {
      const id = p.challengeId?._id || p.challengeId;
      if (id) map.set(String(id), p);
    });
    return map;
  }, [progressRows]);

  const completedCount = progressRows.filter((p) => p.state === 'completed').length;

  const loadChallenges = async () => {
    try {
      setLoading(true);
      setError(null);
      const [catalogRows, myRows] = await Promise.all([
        challengesAPI.getChallenges(),
        challengesAPI.getMyProgress(),
      ]);
      setCatalog(catalogRows);
      setProgressRows(myRows);
    } catch (err) {
      setError(err.message || 'Failed to load challenges');
      setCatalog([]);
      setProgressRows([]);
    } finally {
      setLoading(false);
    }
  };

  const startChallenge = async (challengeId) => {
    try {
      await challengesAPI.joinChallenge(challengeId);
      await loadChallenges();
    } catch (err) {
      setError(err.message || 'Failed to start challenge');
    }
  };

  const markDone = async (challengeId) => {
    const row = progressByChallengeId.get(String(challengeId));
    if (!row) return;

    const next = Number(row.progress || 0) + 1;
    try {
      await challengesAPI.updateProgress(row._id, next);
      addPoints(10);
      await loadChallenges();
    } catch (err) {
      setError(err.message || 'Failed to update challenge progress');
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

    loadChallenges();
  }, []);

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

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Target className="mr-2 w-5 h-5" />
            Challenge Catalog
          </h3>
          <button
            onClick={loadChallenges}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="space-y-4">
          {catalog.map((item) => {
            const progress = progressByChallengeId.get(String(item._id));
            const current = Number(progress?.progress || 0);
            const target = Number(progress?.target || item.target || 1);
            const done = progress?.state === 'completed';
            const started = Boolean(progress);
            const pct = Math.min(100, Math.round((current / Math.max(target, 1)) * 100));

            return (
              <div key={item._id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-600">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500 dark:text-gray-300">
                    <div>{current}/{target}</div>
                    <div>{item.points} pts</div>
                  </div>
                </div>

                <div className="mb-3 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600" style={{ width: `${pct}%` }} />
                </div>

                <div className="flex items-center gap-3">
                  {!started ? (
                    <button
                      onClick={() => startChallenge(item._id)}
                      className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      Start Challenge
                    </button>
                  ) : (
                    <button
                      onClick={() => markDone(item._id)}
                      disabled={done}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                        done
                          ? 'cursor-not-allowed bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      {done ? 'Completed' : 'Mark Done'}
                    </button>
                  )}

                  <span className="text-xs text-gray-500 dark:text-gray-400">Difficulty: {item.difficulty}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <h3 className="font-semibold mb-4 flex items-center">
          <Star className="mr-2 w-5 h-5" />
          Your Progress
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Challenges Available</span>
            <span className="font-bold">{catalog.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Challenges Completed</span>
            <span className="font-bold">{completedCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Current Streak</span>
            <span className="font-bold">{streak} days 🔥</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Challenges;