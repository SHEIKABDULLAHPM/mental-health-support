import { createContext, useContext, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
// Adjust the import path as necessary
const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  // Nature sounds using actual audio files from the audio folder
  const tracks = [
    {
      id: 1,
      title: "Ocean Waves",
      description: "Gentle ocean waves for deep relaxation",
      category: "Ocean",
      duration: "10:00",
      url: "/audio/ocean.mpeg",
      image: "🌊"
    },
    {
      id: 2,
      title: "Peaceful Rain",
      description: "Soothing rainfall sounds for stress relief",
      category: "Rain", 
      duration: "15:00",
      url: "/audio/rain.mpeg",
      image: "🌧️"
    },
    {
      id: 3,
      title: "Flowing Water",
      description: "Gentle water stream for meditation",
      category: "Water",
      duration: "12:00", 
      url: "/audio/water.mpeg",
      image: "💧"
    },
    {
      id: 4,
      title: "Nature Symphony",
      description: "Harmonious natural sounds for mindfulness",
      category: "Nature",
      duration: "20:00",
      url: "/audio/nature.mpeg",
      image: "🌿"
    },
    {
      id: 5,
      title: "Ocean Depths",
      description: "Deep ocean sounds for profound relaxation",
      category: "Ocean",
      duration: "12:00",
      url: "/audio/ocean.mpeg",
      image: "🌊"
    },
    {
      id: 6,
      title: "Forest Rain",
      description: "Rain falling gently in the forest",
      category: "Rain",
      duration: "18:00",
      url: "/audio/rain.mpeg",
      image: "🌲"
    },
    {
      id: 7,
      title: "Mountain Stream",
      description: "Crystal clear mountain water flowing",
      category: "Water",
      duration: "14:00",
      url: "/audio/water.mpeg",
      image: "🏔️"
    },
    {
      id: 8,
      title: "Wilderness Sounds",
      description: "Pure nature ambiance for deep meditation",
      category: "Nature",
      duration: "25:00",
      url: "/audio/nature.mpeg",
      image: "🦋"
    }
  ];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime || 0);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      console.warn('Audio failed to load');
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playTrack = (track) => {
    setCurrentTrack(track);
    setIsLoading(true);

    if (!audioRef.current) return;

    // Build a list of candidate URLs to try (preserve provided URL first)
    const buildCandidates = (url) => {
      const candidates = [];
      // normalize leading slash
      const base = url.replace(/^\//, '');
      candidates.push('/' + base);

      // try swapping extensions between .wav and .mpeg (if present)
      const extMatch = base.match(/(.*)\.(wav|mp3|mpeg)$/i);
      if (extMatch) {
        const name = extMatch[1];
        candidates.push('/' + name + '.wav');
        candidates.push('/' + name + '.mpeg');
        candidates.push('/' + name + '.mp3');
      } else {
        // no extension present: try common ones
        candidates.push('/' + base + '.wav');
        candidates.push('/' + base + '.mpeg');
        candidates.push('/' + base + '.mp3');
      }

      // Also try lowercase/uppercase variants (file systems sometimes case-sensitive)
      const lower = '/' + base.toLowerCase();
      if (!candidates.includes(lower)) candidates.push(lower);
      const upper = '/' + base.toUpperCase();
      if (!candidates.includes(upper)) candidates.push(upper);

      // dedupe while preserving order
      return Array.from(new Set(candidates));
    };

    const candidates = buildCandidates(track.url || 'audio/' + track.title);
    let attempt = 0;

    const tryPlay = (src) => {
      audioRef.current.src = src;
      audioRef.current.load();

      const p = audioRef.current.play();
      if (p !== undefined) {
        p.then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        }).catch((err) => {
          console.warn('Play failed for', src, err);
          // try next candidate
          attempt += 1;
          if (attempt < candidates.length) {
            tryPlay(candidates[attempt]);
          } else {
            setIsLoading(false);
            console.error('All audio play attempts failed for', track.title);
          }
        });
      }
    };

    // attach short error handler to attempt next candidate on error
    const onError = () => {
      attempt += 1;
      if (attempt < candidates.length) {
        tryPlay(candidates[attempt]);
      } else {
        setIsLoading(false);
        console.error('Audio failed to load for all candidates:', candidates);
      }
    };

    // temporarily attach one-time error listener for loading issues
    const audio = audioRef.current;
    audio.addEventListener('error', onError, { once: true });

    // start first candidate
    tryPlay(candidates[attempt]);
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeTrack = () => {
    if (audioRef.current && currentTrack) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error('Error resuming audio:', error);
          });
      }
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <AudioContext.Provider value={{
      // State
      isPlaying,
      currentTrack,
      volume,
      currentTime,
      duration,
      isLoading,
      tracks,
      
      // Controls
      playTrack,
      pauseTrack,
      resumeTrack,
      setVolume,
      
      // Utilities
      formatTime
    }}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </AudioContext.Provider>
  );
};

AudioProvider.propTypes = {
  children: PropTypes.node.isRequired,
};