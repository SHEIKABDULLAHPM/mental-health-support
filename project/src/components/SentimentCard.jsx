/**
 * SentimentCard Component
 * Displays comprehensive sentiment analysis results with visual indicators
 */
import PropTypes from 'prop-types';
import { 
  Smile, 
  Frown, 
  Meh,
  Clock,
  Tag
} from 'lucide-react';

const SentimentCard = ({ 
  sentiment, 
  showKeywords = true, 
  showMetadata = false,
  compact = false,
  className = ''
}) => {
  if (!sentiment) {
    return null;
  }

  // Destructure sentiment data
  const {
    label = 'Unknown',
    confidence = 0,
    intensity = 0,
    keywords = [],
    processing_time_ms = 0,
    model = 'unknown',
    timestamp
  } = sentiment;

  // Sentiment color mapping
  const getSentimentColor = () => {
    const lowerLabel = label.toLowerCase();
    
    if (lowerLabel.includes('positive') || lowerLabel.includes('joy') || lowerLabel.includes('optimism')) {
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-300 dark:border-green-700',
        text: 'text-green-700 dark:text-green-300',
        icon: 'text-green-600 dark:text-green-400',
        badge: 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200'
      };
    } else if (lowerLabel.includes('negative') || lowerLabel.includes('sad') || lowerLabel.includes('anger')) {
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-300 dark:border-red-700',
        text: 'text-red-700 dark:text-red-300',
        icon: 'text-red-600 dark:text-red-400',
        badge: 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200'
      };
    } else if (lowerLabel.includes('anxiety') || lowerLabel.includes('stress')) {
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-300 dark:border-orange-700',
        text: 'text-orange-700 dark:text-orange-300',
        icon: 'text-orange-600 dark:text-orange-400',
        badge: 'bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-200'
      };
    } else {
      return {
        bg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-300 dark:border-gray-600',
        text: 'text-gray-700 dark:text-gray-300',
        icon: 'text-gray-600 dark:text-gray-400',
        badge: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
      };
    }
  };

  const colors = getSentimentColor();

  // Get appropriate icon
  const getSentimentIcon = () => {
    const lowerLabel = label.toLowerCase();
    
    if (lowerLabel.includes('positive') || lowerLabel.includes('joy')) {
      return <Smile className={`w-6 h-6 ${colors.icon}`} />;
    } else if (lowerLabel.includes('negative') || lowerLabel.includes('sad')) {
      return <Frown className={`w-6 h-6 ${colors.icon}`} />;
    } else {
      return <Meh className={`w-6 h-6 ${colors.icon}`} />;
    }
  };

  // Confidence percentage
  const confidencePercent = Math.round(confidence * 100);

  // Compact version for inline display
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${colors.border} ${colors.bg} ${className}`}>
        {getSentimentIcon()}
        <span className={`font-medium text-sm ${colors.text}`}>
          {label}
        </span>
        <span className={`text-xs ${colors.text} opacity-75`}>
          {confidencePercent}%
        </span>
      </div>
    );
  }

  // Full card version
  return (
    <div className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getSentimentIcon()}
          <div>
            <h3 className={`font-semibold text-lg ${colors.text}`}>
              {label}
            </h3>
            {showMetadata && (
              <p className={`text-xs ${colors.text} opacity-75 mt-0.5`}>
                Model: {model.toUpperCase()}
              </p>
            )}
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full ${colors.badge}`}>
          <span className="font-bold text-sm">{confidencePercent}%</span>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-medium ${colors.text}`}>Confidence</span>
          <span className={`text-xs ${colors.text} opacity-75`}>
            {intensity.toFixed(2)} intensity
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${colors.badge.split(' ')[0]}`}
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>

      {/* Keywords */}
      {showKeywords && keywords && keywords.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Tag className={`w-4 h-4 ${colors.icon}`} />
            <span className={`text-xs font-medium ${colors.text}`}>Key Indicators</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.slice(0, 5).map((keyword, idx) => (
              <span
                key={idx}
                className={`px-2 py-1 text-xs rounded-md ${colors.badge} border ${colors.border}`}
              >
                {keyword}
              </span>
            ))}
            {keywords.length > 5 && (
              <span className={`px-2 py-1 text-xs rounded-md ${colors.text} opacity-75`}>
                +{keywords.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Metadata Footer */}
      {showMetadata && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${colors.text} opacity-60`} />
            <span className={`text-xs ${colors.text} opacity-75`}>
              {processing_time_ms.toFixed(1)}ms
            </span>
          </div>
          {timestamp && (
            <span className={`text-xs ${colors.text} opacity-75`}>
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

SentimentCard.propTypes = {
  sentiment: PropTypes.shape({
    label: PropTypes.string.isRequired,
    confidence: PropTypes.number.isRequired,
    intensity: PropTypes.number,
    keywords: PropTypes.arrayOf(PropTypes.string),
    processing_time_ms: PropTypes.number,
    model: PropTypes.string,
    timestamp: PropTypes.string
  }),
  showKeywords: PropTypes.bool,
  showMetadata: PropTypes.bool,
  compact: PropTypes.bool,
  className: PropTypes.string
};

export default SentimentCard;
