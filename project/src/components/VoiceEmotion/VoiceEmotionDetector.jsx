import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Upload, Loader, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import { voiceEmotionAPI } from '../../services/api';

const VoiceEmotionDetector = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [serviceStatus, setServiceStatus] = useState('checking');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Check ML service health on component mount
  useEffect(() => {
    checkServiceHealth();
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const checkServiceHealth = async () => {
    try {
      const healthStatus = await voiceEmotionAPI.checkHealth();
      
      if (healthStatus.available) {
        setServiceStatus('online');
      } else {
        setServiceStatus('offline');
        if (healthStatus.status === 'healthy' && !healthStatus.available) {
          setError('Voice emotion detection is disabled. Please enable ENABLE_EMOTION in backend .env file.');
        }
      }
    } catch (err) {
      console.error('ML service health check failed:', err);
      setServiceStatus('offline');
      setError('Cannot connect to ML service. Please ensure backend is running.');
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      setResult(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use webm format for better browser compatibility
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Automatically process the recording
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please grant permission and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const data = await voiceEmotionAPI.detectEmotion(blob);
      setResult(data);
    } catch (err) {
      console.error('Error processing audio:', err);
      setError(err.message || 'Failed to detect emotion. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    setResult(null);
    setAudioBlob(file);
    
    await processAudio(file);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEmotionEmoji = (emotion) => {
    const emojiMap = {
      'neutral': '😐',
      'happy': '😊',
      'sad': '😢',
      'angry': '😠',
      'fearful': '😰',
      'surprised': '😲',
      'disgusted': '🤢'
    };
    return emojiMap[emotion] || '🎭';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Voice Emotion Detector 🎤
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Record your voice or upload an audio file to detect your emotional state
        </p>
        
        {/* Service Status */}
        <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700">
          <div className={`w-2 h-2 rounded-full ${
            serviceStatus === 'online' ? 'bg-green-500 animate-pulse' : 
            serviceStatus === 'offline' ? 'bg-red-500' : 
            'bg-yellow-500 animate-pulse'
          }`}></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            ML Service: {serviceStatus === 'online' ? 'Connected' : serviceStatus === 'offline' ? 'Offline' : 'Checking...'}
          </span>
        </div>
      </div>

      {/* Recording Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center space-y-6">
          {/* Recording Button */}
          <div className="relative inline-block">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || serviceStatus === 'offline'}
              className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105'
              } ${(isProcessing || serviceStatus === 'offline') ? 'opacity-50 cursor-not-allowed' : 'shadow-2xl'}`}
            >
              {isRecording ? (
                <MicOff className="w-12 h-12 text-white" />
              ) : (
                <Mic className="w-12 h-12 text-white" />
              )}
              
              {/* Recording indicator ring */}
              {isRecording && (
                <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping"></div>
              )}
            </button>
          </div>

          {/* Status Text */}
          <div className="space-y-2">
            {isRecording && (
              <div className="text-2xl font-bold text-red-500">
                Recording... {formatTime(recordingTime)}
              </div>
            )}
            {isProcessing && (
              <div className="flex items-center justify-center space-x-3 text-blue-600 dark:text-blue-400">
                <Loader className="w-5 h-5 animate-spin" />
                <span className="text-lg font-medium">Analyzing emotion...</span>
              </div>
            )}
            {!isRecording && !isProcessing && !result && (
              <p className="text-gray-600 dark:text-gray-400">
                Click the microphone to start recording
                {audioBlob && <span className="sr-only">Audio ready</span>}
              </p>
            )}
          </div>

          {/* File Upload Option */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <Upload className="w-5 h-5" />
              <span>Upload Audio File</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={isProcessing || isRecording || serviceStatus === 'offline'}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-800 dark:text-red-200 font-medium">Error</p>
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Primary Emotion Card */}
          <div 
            className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-xl border-2"
            style={{ borderColor: result.color }}
          >
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">
                {getEmotionEmoji(result.primary_emotion)}
              </div>
              
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white capitalize">
                {result.primary_emotion}
              </h3>
              
              <div className="flex items-center justify-center space-x-2">
                <Activity className="w-5 h-5" style={{ color: result.color }} />
                <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  {(result.confidence * 100).toFixed(1)}% Confidence
                </span>
              </div>
              
              {/* Confidence Bar */}
              <div className="w-full max-w-md mx-auto">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${result.confidence * 100}%`,
                      backgroundColor: result.color
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Insight */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {result.insight}
                </p>
              </div>
            </div>
          </div>

          {/* Emotion Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              Detailed Analysis
            </h4>
            
            <div className="space-y-4">
              {result.top_emotions.map((emotion, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getEmotionEmoji(emotion.emotion)}</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {emotion.emotion}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {(emotion.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${emotion.probability * 100}%`,
                        backgroundColor: emotion.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Analyzed at {new Date(result.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!result && !isProcessing && !isRecording && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            💡 Tips for Best Results:
          </h4>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• Speak naturally for 3-10 seconds</li>
            <li>• Ensure you&apos;re in a quiet environment</li>
            <li>• Hold your device at a comfortable distance</li>
            <li>• Express yourself genuinely for accurate detection</li>
            <li>• Supported formats: WebM, WAV, MP3</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default VoiceEmotionDetector;
