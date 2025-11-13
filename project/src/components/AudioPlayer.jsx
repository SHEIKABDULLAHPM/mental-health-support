import React, { useState } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { Play, Pause, Volume2, VolumeX, Minimize2 } from 'lucide-react';

const AudioPlayer = () => {
  const {
    isPlaying,
    currentTrack,
    volume,
    isLoading,
    pauseTrack,
    resumeTrack,
    setVolume,
  } = useAudio();

  const [isMinimized, setIsMinimized] = useState(true);

  if (!currentTrack) return null;

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isMinimized ? 'w-[56px] h-[56px]' : 'w-80'
      }`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isMinimized ? (
          <button
            onClick={() => setIsMinimized(false)}
            className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
            title={`${currentTrack.title} • ${currentTrack.category}`}
          >
            <span className="text-2xl">{currentTrack.image || '🎵'}</span>
          </button>
        ) : (
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-lg">
                  {currentTrack.image || '🎵'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                    {currentTrack.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {currentTrack.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePlayPause}
                disabled={isLoading}
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>

              <div className="flex items-center space-x-2">
                {volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                )}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;