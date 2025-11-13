"""
Visualization Utilities for Mood Trends and Emotion Analysis
"""

import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import io
import base64

from .emotion_mapping import get_emotion_color, UNIFIED_MOODS


def create_emotion_distribution_chart(
    emotion_probs: Dict[str, float],
    title: str = "Emotion Distribution"
) -> str:
    """
    Create a bar chart of emotion probabilities
    
    Returns:
        Base64 encoded image string
    """
    fig, ax = plt.subplots(figsize=(10, 6))
    
    emotions = list(emotion_probs.keys())
    probabilities = list(emotion_probs.values())
    colors = [get_emotion_color(e) for e in emotions]
    
    bars = ax.bar(emotions, probabilities, color=colors, alpha=0.7, edgecolor='black')
    
    ax.set_ylabel('Probability', fontsize=12, fontweight='bold')
    ax.set_xlabel('Emotion', fontsize=12, fontweight='bold')
    ax.set_title(title, fontsize=14, fontweight='bold')
    ax.set_ylim(0, 1.0)
    ax.grid(axis='y', alpha=0.3)
    
    # Add value labels on bars
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.2f}',
                ha='center', va='bottom', fontsize=10)
    
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    
    # Convert to base64
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    plt.close()
    
    return image_base64


def create_mood_trend_chart(
    dates: List[str],
    moods: List[str],
    sentiment_scores: List[float],
    predictions: Optional[List[float]] = None
) -> Dict:
    """
    Create interactive Plotly chart for mood trends over time
    
    Returns:
        Plotly JSON for frontend rendering
    """
    df = pd.DataFrame({
        'date': pd.to_datetime(dates),
        'mood': moods,
        'sentiment': sentiment_scores
    })
    
    # Create figure with secondary y-axis
    fig = make_subplots(
        rows=2, cols=1,
        row_heights=[0.7, 0.3],
        subplot_titles=('Sentiment Trend', 'Mood Distribution'),
        vertical_spacing=0.15
    )
    
    # Sentiment line chart
    fig.add_trace(
        go.Scatter(
            x=df['date'],
            y=df['sentiment'],
            mode='lines+markers',
            name='Sentiment Score',
            line=dict(color='#4169E1', width=3),
            marker=dict(size=8, symbol='circle'),
            fill='tozeroy',
            fillcolor='rgba(65, 105, 225, 0.2)'
        ),
        row=1, col=1
    )
    
    # Add predictions if available
    if predictions:
        pred_dates = [df['date'].iloc[-1] + timedelta(days=i+1) for i in range(len(predictions))]
        fig.add_trace(
            go.Scatter(
                x=pred_dates,
                y=predictions,
                mode='lines+markers',
                name='Predicted',
                line=dict(color='#FF6347', width=2, dash='dash'),
                marker=dict(size=6, symbol='diamond')
            ),
            row=1, col=1
        )
    
    # Add zero line
    fig.add_hline(y=0, line_dash="dash", line_color="gray", row=1, col=1)
    
    # Mood distribution bar chart
    mood_counts = df['mood'].value_counts()
    colors = [get_emotion_color(mood) for mood in mood_counts.index]
    
    fig.add_trace(
        go.Bar(
            x=mood_counts.index,
            y=mood_counts.values,
            marker_color=colors,
            name='Mood Frequency',
            showlegend=False
        ),
        row=2, col=1
    )
    
    # Update layout
    fig.update_xaxes(title_text="Date", row=1, col=1)
    fig.update_yaxes(title_text="Sentiment (-1 to 1)", row=1, col=1, range=[-1, 1])
    fig.update_xaxes(title_text="Mood", row=2, col=1)
    fig.update_yaxes(title_text="Frequency", row=2, col=1)
    
    fig.update_layout(
        height=800,
        title_text="Mood Pattern Analysis",
        title_font_size=20,
        showlegend=True,
        hovermode='x unified',
        template='plotly_white'
    )
    
    return fig.to_json()


def create_emotion_pie_chart(emotion_probs: Dict[str, float]) -> str:
    """
    Create a pie chart showing emotion distribution
    
    Returns:
        Plotly JSON
    """
    labels = list(emotion_probs.keys())
    values = list(emotion_probs.values())
    colors = [get_emotion_color(label) for label in labels]
    
    fig = go.Figure(data=[go.Pie(
        labels=labels,
        values=values,
        marker=dict(colors=colors),
        textinfo='label+percent',
        hovertemplate='<b>%{label}</b><br>Probability: %{value:.2%}<extra></extra>'
    )])
    
    fig.update_layout(
        title="Current Emotion State",
        showlegend=True,
        height=500
    )
    
    return fig.to_json()


def create_weekly_mood_heatmap(mood_data: pd.DataFrame) -> str:
    """
    Create a heatmap showing mood patterns by day of week and time
    
    Args:
        mood_data: DataFrame with columns ['timestamp', 'mood', 'sentiment']
        
    Returns:
        Plotly JSON
    """
    mood_data['timestamp'] = pd.to_datetime(mood_data['timestamp'])
    mood_data['day_of_week'] = mood_data['timestamp'].dt.day_name()
    mood_data['hour'] = mood_data['timestamp'].dt.hour
    
    # Pivot for heatmap
    heatmap_data = mood_data.pivot_table(
        values='sentiment',
        index='day_of_week',
        columns='hour',
        aggfunc='mean'
    )
    
    # Reorder days
    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    heatmap_data = heatmap_data.reindex(day_order)
    
    fig = go.Figure(data=go.Heatmap(
        z=heatmap_data.values,
        x=heatmap_data.columns,
        y=heatmap_data.index,
        colorscale='RdYlGn',
        zmid=0,
        text=heatmap_data.values,
        texttemplate='%{text:.2f}',
        colorbar=dict(title="Sentiment")
    ))
    
    fig.update_layout(
        title="Weekly Mood Patterns",
        xaxis_title="Hour of Day",
        yaxis_title="Day of Week",
        height=500
    )
    
    return fig.to_json()


def create_comparison_chart(
    face_emotions: Dict[str, float],
    text_emotions: Dict[str, float],
    fused_emotions: Dict[str, float]
) -> str:
    """
    Create a comparison chart showing face, text, and fused emotion distributions
    
    Returns:
        Plotly JSON
    """
    moods = UNIFIED_MOODS
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        name='Face Emotion',
        x=moods,
        y=[face_emotions.get(m, 0) for m in moods],
        marker_color='lightblue'
    ))
    
    fig.add_trace(go.Bar(
        name='Text Emotion',
        x=moods,
        y=[text_emotions.get(m, 0) for m in moods],
        marker_color='lightgreen'
    ))
    
    fig.add_trace(go.Bar(
        name='Fused Mood',
        x=moods,
        y=[fused_emotions.get(m, 0) for m in moods],
        marker_color='coral'
    ))
    
    fig.update_layout(
        title="Emotion Modality Comparison",
        xaxis_title="Mood",
        yaxis_title="Probability",
        barmode='group',
        height=500,
        template='plotly_white'
    )
    
    return fig.to_json()


def generate_trend_summary(
    mood_history: List[Dict],
    days: int = 7
) -> Dict:
    """
    Generate statistical summary of mood trends
    
    Args:
        mood_history: List of {timestamp, mood, sentiment} dicts
        days: Number of days to analyze
        
    Returns:
        Summary statistics dictionary
    """
    df = pd.DataFrame(mood_history)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Filter to recent days
    cutoff = datetime.now() - timedelta(days=days)
    df = df[df['timestamp'] >= cutoff]
    
    if len(df) == 0:
        return {"error": "No data available"}
    
    # Calculate statistics
    summary = {
        "average_sentiment": float(df['sentiment'].mean()),
        "sentiment_std": float(df['sentiment'].std()),
        "most_common_mood": df['mood'].mode()[0] if len(df['mood'].mode()) > 0 else "Neutral",
        "mood_variability": float(df['mood'].nunique() / len(UNIFIED_MOODS)),
        "positive_days": int((df['sentiment'] > 0.3).sum()),
        "negative_days": int((df['sentiment'] < -0.3).sum()),
        "neutral_days": int(((df['sentiment'] >= -0.3) & (df['sentiment'] <= 0.3)).sum()),
        "trend": "improving" if df['sentiment'].iloc[-3:].mean() > df['sentiment'].iloc[:3].mean() else "declining",
        "total_entries": len(df)
    }
    
    return summary
