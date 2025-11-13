import { useState, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Reveal from '../components/Reveal';
import { recoAPI } from '../services/api';
import { useUser } from '../contexts/UserContext';

const NatureSounds = () => {
  const { currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack, tracks, volume, setVolume } = useAudio();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user } = useUser();
  const [suggestAudio, setSuggestAudio] = useState(null);

  const categories = [
    { value: 'all', label: 'All Sounds', icon: '🌍' },
    { value: 'Nature', label: 'Nature', icon: '🌿' },
    { value: 'Water', label: 'Water', icon: '💧' },
    { value: 'Rain', label: 'Rain', icon: '🌧️' },
    { value: 'Ocean', label: 'Ocean', icon: '🌊' },
  ];

  const filteredTracks = selectedCategory === 'all' 
    ? tracks 
    : tracks.filter(track => track.category === selectedCategory);

  const handleTrackSelect = (track) => {
    // If clicking the currently selected track
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        // currently playing -> pause
        pauseTrack();
      } else {
        // currently paused -> resume without reloading
        // resumeTrack is provided by the AudioContext
        // (falls back to calling play on the existing audio element)
        try {
          // prefer resume if available
          if (typeof resumeTrack === 'function') {
            resumeTrack();
          } else {
            playTrack(track);
          }
        } catch (err) {
          // fallback to playTrack if resume fails
          playTrack(track);
        }
      }
    } else {
      // different track -> start playing that track
      playTrack(track);
    }
  };

  // Fetch recommendations and show nature sounds suggestion
  useEffect(() => {
    const uid = user?.id ? `user${user.id}` : 'user1';
    recoAPI
      .recommend({ userId: uid, topN: 5, strategy: 'hybrid' })
      .then((items) => {
        const n = items.find(i => i.item_id === 'nature_sounds');
        if (n) setSuggestAudio(n); else setSuggestAudio(null);
      })
      .catch(() => setSuggestAudio(null));
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <Reveal animation="fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Nature Sounds 🎵
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Immerse yourself in calming sounds from nature to reduce stress and enhance focus
          </p>
        </div>
      </Reveal>

      {/* Category Filter */}
      <Reveal animation="slide-up" delay={100}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          {suggestAudio && (
            <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-100 dark:border-green-800 flex items-center justify-between">
              <div>
                <div className="text-sm text-green-900 dark:text-green-100 font-medium">AI suggests Nature Sounds</div>
                <div className="text-xs text-green-700 dark:text-green-300">Score: {suggestAudio.score.toFixed(2)}</div>
              </div>
              <button
                onClick={() => setSelectedCategory('Nature')}
                className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
              >
                Show Nature →
              </button>
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Choose Your Soundscape
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`p-3 rounded-xl border-2 transition-all duration-300 text-center ${
                  selectedCategory === category.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-1">{category.icon}</div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {category.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Current Player */}
      {currentTrack && (
        <Reveal animation="slide-up" delay={200}>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                  {currentTrack.image}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{currentTrack.title}</h3>
                  <p className="text-blue-100">{currentTrack.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                      {currentTrack.category}
                    </span>
                    <span className="text-sm">{currentTrack.duration}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleTrackSelect(currentTrack)}
                  className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>
              </div>
            </div>

            {/* Volume Control */}
            <div className="mt-4 flex items-center space-x-3">
                <VolumeX className="w-5 h-5" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-white/20 rounded-lg appearance-none slider"
              />
              <Volume2 className="w-5 h-5" />
            </div>
          </div>
        </Reveal>
      )}

      {/* Sound Library */}
      <Reveal animation="slide-up" delay={300}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Sound Library ({filteredTracks.length} sounds)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTracks.map((track) => (
              <div
                key={track.id}
                className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  currentTrack?.id === track.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => handleTrackSelect(track)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-xl">
                    {track.image}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {track.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {track.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {track.duration}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {track.category}
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {currentTrack?.id === track.id && isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Benefits Section */}
      <Reveal animation="slide-up" delay={400}>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Benefits of Nature Sounds
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🧠', title: 'Improved Focus', desc: 'Enhanced concentration and mental clarity' },
              { icon: '😌', title: 'Stress Relief', desc: 'Reduced cortisol and anxiety levels' },
              { icon: '💤', title: 'Better Sleep', desc: 'Improved sleep quality and duration' },
              { icon: '🧘', title: 'Mindfulness', desc: 'Enhanced meditation and mindfulness practice' },
            ].map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-sm">
                  {benefit.icon}
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {benefit.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
};

export default NatureSounds;