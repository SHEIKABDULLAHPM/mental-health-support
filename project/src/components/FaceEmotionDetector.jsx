import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CameraOff, Smile, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import PropTypes from 'prop-types';
// import api from '../services/api';

/**
 * Real-time Face Emotion Detection Component
 * Captures webcam frames every 5 seconds and detects emotions using ML model
 */
const FaceEmotionDetector = ({ 
  onEmotionDetected, 
  intervalMs = 5000,
  autoStart = true, // Force autoStart to true
  showPreview = false,  // Hidden camera by default
  compact = false,
  className = ''
}) => {
  const [isActive, setIsActive] = useState(autoStart);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(null);
  // const [cameraPermission, setCameraPermission] = useState('prompt'); // Not used
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  // Emotion emoji mapping
  const emotionEmojis = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    surprised: '😲',
    fearful: '😰',
    disgusted: '🤢',
    neutral: '😐'
  };

  // Start webcam
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      if (videoRef.current) {
  videoRef.current.srcObject = stream;
  streamRef.current = stream;
  // setCameraPermission('granted'); // removed, unused
      }
    } catch (err) {
  console.error('Camera access error:', err);
  // setCameraPermission('denied'); // removed, unused
  setError('Camera access denied. Please enable camera permissions.');
  setIsActive(false);
    }
  }, []);

  // Stop webcam
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Capture frame and analyze emotion
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Draw video frame to canvas
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Ensure video is ready
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Video not ready');
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));

      if (!blob) {
        throw new Error('Failed to capture frame');
      }

      // Create file from blob
      const file = new File([blob], 'webcam-frame.jpg', { type: 'image/jpeg' });

      // Send to new backend API for face emotion detection
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('http://localhost:5000/api/detect-face-emotion', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();

      if (result.status === 'success' && result.dominant_emotion) {
        const emotion = {
          name: result.dominant_emotion.toLowerCase(),
          confidence: result.confidence || 0,
          probabilities: result.emotions || {},
          timestamp: new Date().toISOString(),
          mood: result.mood || result.dominant_emotion
        };

        setCurrentEmotion(emotion);
        setLastAnalysisTime(new Date());
        setEmotionHistory(prev => [...prev.slice(-9), emotion]);
        if (onEmotionDetected) {
          onEmotionDetected(emotion);
        }
      } else {
        throw new Error('No emotion detected in image');
      }

    } catch (err) {
      console.error('Emotion analysis error:', err);
      const errorMsg = err.message || 'Failed to analyze emotion';
      setError(errorMsg.includes('Video not ready')
        ? 'Preparing camera... Please wait.'
        : 'No face detected. Please face the camera with good lighting.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onEmotionDetected]);

  // Toggle camera on/off
  const toggleCamera = useCallback(async () => {
    if (isActive) {
      setIsActive(false);
      stopCamera();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      setIsActive(true);
      await startCamera();
      
      // Start periodic analysis
      intervalRef.current = setInterval(() => {
        captureAndAnalyze();
      }, intervalMs);
      
      // Analyze immediately
      setTimeout(() => captureAndAnalyze(), 1000);
    }
  }, [isActive, startCamera, stopCamera, captureAndAnalyze, intervalMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [stopCamera]);

  // Auto-start if enabled
  useEffect(() => {
    // Always auto-start detection on mount
    if (!isActive) {
      toggleCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compact view (small indicator)
  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <button
          onClick={toggleCamera}
          className={`p-2 rounded-lg transition-all ${
            isActive 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
          title={isActive ? 'Face detection active' : 'Start face detection'}
        >
          {isActive ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
        </button>
        
        {currentEmotion && (
          <div className="flex items-center space-x-1">
            <span className="text-xl">{emotionEmojis[currentEmotion.name] || '😐'}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
              {currentEmotion.name}
            </span>
          </div>
        )}
        
        {isProcessing && <Loader className="w-3 h-3 animate-spin text-blue-500" />}
      </div>
    );
  }

  // Full view
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Smile className="mr-2 w-5 h-5" />
          Real-time Face Emotion Detection
        </h3>
        <button
          onClick={toggleCamera}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
            isActive
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
          }`}
        >
          {isActive ? (
            <>
              <CameraOff className="w-4 h-4" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              <span>Start Detection</span>
            </>
          )}
        </button>
      </div>

      {/* Video Preview (Hidden by default, only shown if showPreview=true) */}
      <div className={showPreview ? 'relative mb-4 rounded-xl overflow-hidden bg-gray-900' : 'hidden'}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {isProcessing && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
            <Loader className="w-3 h-3 animate-spin" />
            <span>Analyzing...</span>
          </div>
        )}
        
        {lastAnalysisTime && !isProcessing && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            ✓ Last: {new Date(lastAnalysisTime).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Hidden video for background processing */}
      {!showPreview && isActive && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="hidden"
          />
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}

      {/* Current Emotion Display */}
      {currentEmotion && (
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">{emotionEmojis[currentEmotion.name] || '😐'}</span>
              <div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {currentEmotion.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {(currentEmotion.confidence * 100).toFixed(1)}% confidence
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(currentEmotion.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          {/* Emotion Probabilities */}
          {currentEmotion.probabilities && Object.keys(currentEmotion.probabilities).length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                All Emotions:
              </div>
              {Object.entries(currentEmotion.probabilities)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([emotion, prob]) => (
                  <div key={emotion} className="flex items-center space-x-2">
                    <span className="text-sm w-20 capitalize text-gray-700 dark:text-gray-300">
                      {emotion}
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                        style={{ width: `${prob * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-12 text-right">
                      {(prob * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                Detection Error
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                {error}
              </p>
              <button
                onClick={toggleCamera}
                className="flex items-center space-x-2 text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emotion History */}
      {emotionHistory.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Recent Detections ({emotionHistory.length}):
          </div>
          <div className="flex flex-wrap gap-2">
            {emotionHistory.slice(-5).reverse().map((emotion, idx) => (
              <div
                key={idx}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center space-x-2"
              >
                <span className="text-xl">{emotionEmojis[emotion.name] || '😐'}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {emotion.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      {!isActive && !error && (
        <div className="text-center py-8">
          <Camera className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {"Click \"Start Detection\" to begin real-time emotion analysis"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Your face will be analyzed every {intervalMs / 1000} seconds
          </p>
        </div>
      )}
    </div>
  );
};

FaceEmotionDetector.propTypes = {
  onEmotionDetected: PropTypes.func,
  intervalMs: PropTypes.number,
  autoStart: PropTypes.bool,
  showPreview: PropTypes.bool,
  compact: PropTypes.bool,
  className: PropTypes.string
};

export default FaceEmotionDetector;
