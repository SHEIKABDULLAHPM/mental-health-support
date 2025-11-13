/**
 * SentimentMeter Component
 * Visual gauge/meter showing sentiment polarity and intensity
 */
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown } from 'lucide-react';

const SentimentMeter = ({ 
  sentiment, 
  showLabel = true, 
  variant = 'horizontal',  // 'horizontal' | 'vertical' | 'circular'
  size = 'medium',  // 'small' | 'medium' | 'large'
  className = ''
}) => {
  if (!sentiment) {
    return null;
  }

  const { label = 'Neutral', intensity = 0, confidence = 0 } = sentiment;

  // Normalize intensity to -1 to +1 scale if needed
  const normalizedIntensity = typeof intensity === 'number' ? intensity : 0;

  // Calculate position (0-100 scale for display)
  // Intensity: -1 (very negative) to +1 (very positive)
  const position = ((normalizedIntensity + 1) / 2) * 100;

  // Color based on sentiment
  const getColor = () => {
    const lowerLabel = label.toLowerCase();
    
    if (lowerLabel.includes('positive') || lowerLabel.includes('joy') || lowerLabel.includes('optimism')) {
      return 'from-green-400 to-green-600';
    } else if (lowerLabel.includes('negative') || lowerLabel.includes('sad') || lowerLabel.includes('anger')) {
      return 'from-red-400 to-red-600';
    } else if (lowerLabel.includes('anxiety') || lowerLabel.includes('stress')) {
      return 'from-orange-400 to-orange-600';
    } else {
      return 'from-gray-400 to-gray-600';
    }
  };

  const gradientColor = getColor();

  // Size variants
  const sizes = {
    small: { height: 'h-2', width: 'w-48', indicator: 'w-3 h-3' },
    medium: { height: 'h-3', width: 'w-64', indicator: 'w-4 h-4' },
    large: { height: 'h-4', width: 'w-80', indicator: 'w-5 h-5' }
  };

  const sizeClasses = sizes[size] || sizes.medium;

  // Horizontal Meter
  if (variant === 'horizontal') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {showLabel && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round(confidence * 100)}% confidence
            </span>
          </div>
        )}
        
        <div className="relative">
          {/* Background gradient bar */}
          <div className={`${sizeClasses.width} ${sizeClasses.height} rounded-full bg-gradient-to-r from-red-200 via-gray-200 to-green-200 dark:from-red-900/30 dark:via-gray-700 dark:to-green-900/30`}>
            {/* Filled portion */}
            <div
              className={`h-full rounded-full bg-gradient-to-r ${gradientColor} transition-all duration-500`}
              style={{ width: `${position}%` }}
            />
          </div>

          {/* Position indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
            style={{ left: `calc(${position}% - 0.5rem)` }}
          >
            <div className={`${sizeClasses.indicator} rounded-full bg-white dark:bg-gray-800 border-2 border-gray-800 dark:border-gray-200 shadow-lg`} />
          </div>

          {/* Labels */}
          <div className="flex justify-between mt-1">
            <span className="text-xs text-red-600 dark:text-red-400">Negative</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Neutral</span>
            <span className="text-xs text-green-600 dark:text-green-400">Positive</span>
          </div>
        </div>
      </div>
    );
  }

  // Vertical Meter
  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
        )}

        <div className="relative h-48 w-12">
          {/* Background gradient bar */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-red-200 via-gray-200 to-green-200 dark:from-red-900/30 dark:via-gray-700 dark:to-green-900/30">
            {/* Filled portion */}
            <div
              className={`absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t ${gradientColor} transition-all duration-500`}
              style={{ height: `${position}%` }}
            />
          </div>

          {/* Position indicator */}
          <div
            className="absolute left-1/2 -translate-x-1/2 transition-all duration-500"
            style={{ bottom: `calc(${position}% - 0.5rem)` }}
          >
            <div className="w-4 h-4 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-800 dark:border-gray-200 shadow-lg" />
          </div>
        </div>

        {/* Labels */}
        <div className="flex flex-col items-center gap-1 text-xs">
          <span className="text-green-600 dark:text-green-400">Positive</span>
          <span className="text-gray-500 dark:text-gray-400">Neutral</span>
          <span className="text-red-600 dark:text-red-400">Negative</span>
        </div>

        {showLabel && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>
    );
  }

  // Circular Gauge
  if (variant === 'circular') {
    // SVG circular gauge
    const radius = size === 'small' ? 40 : size === 'large' ? 80 : 60;
    const strokeWidth = size === 'small' ? 6 : size === 'large' ? 12 : 10;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (position / 100) * circumference;

    // Rotate to start from bottom
    const rotation = -90;

    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div className="relative">
          <svg
            width={radius * 2 + strokeWidth * 2}
            height={radius * 2 + strokeWidth * 2}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-gray-200 dark:text-gray-700"
            />
            
            {/* Progress circle */}
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className="text-red-500" style={{ stopColor: 'currentColor' }} />
                <stop offset="50%" className="text-gray-400" style={{ stopColor: 'currentColor' }} />
                <stop offset="100%" className="text-green-500" style={{ stopColor: 'currentColor' }} />
              </linearGradient>
            </defs>
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {normalizedIntensity > 0 ? (
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : normalizedIntensity < 0 ? (
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-gray-400" />
            )}
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>

        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
        )}
      </div>
    );
  }

  return null;
};

SentimentMeter.propTypes = {
  sentiment: PropTypes.shape({
    label: PropTypes.string,
    intensity: PropTypes.number,
    confidence: PropTypes.number
  }),
  showLabel: PropTypes.bool,
  variant: PropTypes.oneOf(['horizontal', 'vertical', 'circular']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string
};

export default SentimentMeter;
