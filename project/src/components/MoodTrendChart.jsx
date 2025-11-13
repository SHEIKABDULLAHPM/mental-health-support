import PropTypes from 'prop-types';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 💫 Emotion-Adaptive Mood Trend Chart
const MoodTrendChart = ({
  series = [],
  emotion = 'neutral', // dynamically detected emotion
  width = '100%',
  height = 200,
  showAxes = true,
  padding = 24,
  smooth = true,
}) => {
  const [hover, setHover] = useState(null);

  // 🎨 Emotion-based color themes
  const emotionColors = {
    happy:   { color: '#facc15', from: '#fde68a', to: '#fefce8' },  // warm yellow
    calm:    { color: '#3b82f6', from: '#93c5fd', to: '#eff6ff' },  // serene blue
    sad:     { color: '#6366f1', from: '#c7d2fe', to: '#eef2ff' },  // indigo
    angry:   { color: '#ef4444', from: '#fca5a5', to: '#fee2e2' },  // red
    stressed:{ color: '#f97316', from: '#fdba74', to: '#fff7ed' },  // orange
    relaxed: { color: '#10b981', from: '#6ee7b7', to: '#ecfdf5' },  // green
    neutral: { color: '#6b7280', from: '#d1d5db', to: '#f9fafb' },  // gray
  };

  const { color, from: gradientFrom, to: gradientTo } = emotionColors[emotion] || emotionColors.neutral;

  const W = 400, H = height;
  const vbPad = padding, vbW = W - vbPad * 2, vbH = H - vbPad * 2;

  const allX = useMemo(() => series.map(d => new Date(d.t).getTime()), [series]);
  const allY = useMemo(() => series.map(d => d.v), [series]);

  const minX = allX.length ? Math.min(...allX) : 0;
  const maxX = allX.length ? Math.max(...allX) : 1;
  const minY = Math.min(0, ...(allY.length ? allY : [0]));
  const maxY = Math.max(1, ...(allY.length ? allY : [1]));

  const xScale = useCallback(
    t => maxX === minX ? vbPad + vbW / 2 : vbPad + ((t - minX) / (maxX - minX)) * vbW,
    [maxX, minX, vbPad, vbW]
  );
  const yScale = useCallback(
    v => vbPad + vbH - ((v - minY) / (maxY - minY)) * vbH,
    [minY, maxY, vbPad, vbH]
  );

  // Smooth path generation
  const pathData = useMemo(() => {
    if (series.length < 2) return '';
    return series.map((d, i) => `${i === 0 ? 'M' : smooth ? 'L' : 'L'}${xScale(new Date(d.t).getTime())},${yScale(d.v)}`).join(' ');
  }, [series, smooth, xScale, yScale]);

  const areaPath = `${pathData} L${xScale(new Date(series[series.length - 1]?.t))},${yScale(minY)} L${xScale(new Date(series[0]?.t))},${yScale(minY)} Z`;

  // Tooltip timeout fade
  useEffect(() => {
    if (hover !== null) {
      const timer = setTimeout(() => setHover(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [hover]);

  return (
    <div style={{
      width,
      height,
      borderRadius: '1rem',
      background: 'linear-gradient(180deg, #ffffff, #f9fafb)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      padding: 12,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.5s ease'
    }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientFrom} stopOpacity="0.8" />
            <stop offset="100%" stopColor={gradientTo} stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Gridlines */}
        {showAxes && [...Array(4)].map((_, i) => (
          <line
            key={i}
            x1={vbPad}
            x2={vbPad + vbW}
            y1={vbPad + (i * vbH / 3)}
            y2={vbPad + (i * vbH / 3)}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ))}

        {/* Gradient area */}
        {series.length > 1 && (
          <motion.path
            d={areaPath}
            fill="url(#moodGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
        )}

        {/* Animated mood line */}
        {series.length > 1 && (
          <motion.path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
        )}

        {/* Mood points */}
        {series.map((d, i) => {
          const x = xScale(new Date(d.t).getTime()), y = yScale(d.v);
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r={hover === i ? 7 : 4}
              fill={hover === i ? color : gradientFrom}
              stroke="#fff"
              strokeWidth={2}
              filter="url(#glow)"
              whileHover={{ scale: 1.3 }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hover !== null && series[hover] && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              left: `${(hover / (series.length - 1)) * 100}%`,
              top: 8,
              transform: 'translate(-50%, 0)',
              background: '#fff',
              color,
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: '6px 12px',
              fontSize: 14,
              fontWeight: 500,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease'
            }}
          >
            <strong>{(series[hover].v * 100).toFixed(1)}%</strong>
            <div style={{ color: '#6b7280', fontSize: 12 }}>
              {new Date(series[hover].t).toLocaleDateString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Emotion Label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ delay: 0.6 }}
        style={{
          position: 'absolute',
          bottom: 10,
          left: 16,
          background: color,
          color: '#fff',
          borderRadius: 12,
          padding: '4px 10px',
          fontSize: 12,
          fontWeight: 500,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textTransform: 'capitalize',
        }}
      >
        {emotion}
      </motion.div>
    </div>
  );
};

MoodTrendChart.propTypes = {
  series: PropTypes.array,
  emotion: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.number,
  showAxes: PropTypes.bool,
  padding: PropTypes.number,
  smooth: PropTypes.bool,
};

export default MoodTrendChart;
