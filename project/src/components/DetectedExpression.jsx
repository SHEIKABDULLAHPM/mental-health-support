import React from 'react';

const expressionColors = {
  happy: '#FFD700',
  sad: '#87CEEB',
  angry: '#FF6347',
  surprised: '#FFB6C1',
  neutral: '#D3D3D3',
  fearful: '#8A2BE2',
  disgusted: '#228B22',
};

export default function DetectedExpression({ expression, confidence }) {
  if (!expression) return null;
  const color = expressionColors[expression] || '#ccc';
  return (
    <div
      style={{
        background: color,
        borderRadius: '1rem',
        padding: '1.5rem',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        margin: '1rem auto',
        maxWidth: '300px',
      }}
    >
      <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
        {expression.charAt(0).toUpperCase() + expression.slice(1)}
      </h2>
      {confidence !== undefined && (
        <p style={{ margin: '0.5rem 0 0', fontSize: '1.2rem', color: '#333' }}>
          Confidence: {(confidence * 100).toFixed(1)}%
        </p>
      )}
    </div>
  );
}
