"""
Evaluation Metrics for Mood Pattern Recognition Models
"""

import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, mean_squared_error,
    mean_absolute_error, r2_score
)
from typing import Dict, List, Tuple
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64


def calculate_classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    labels: List[str]
) -> Dict:
    """
    Calculate comprehensive classification metrics
    
    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        labels: List of class labels
        
    Returns:
        Dictionary of metrics
    """
    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision_macro": float(precision_score(y_true, y_pred, average='macro', zero_division=0)),
        "recall_macro": float(recall_score(y_true, y_pred, average='macro', zero_division=0)),
        "f1_macro": float(f1_score(y_true, y_pred, average='macro', zero_division=0)),
        "precision_weighted": float(precision_score(y_true, y_pred, average='weighted', zero_division=0)),
        "recall_weighted": float(recall_score(y_true, y_pred, average='weighted', zero_division=0)),
        "f1_weighted": float(f1_score(y_true, y_pred, average='weighted', zero_division=0))
    }
    
    # Per-class metrics
    report = classification_report(y_true, y_pred, target_names=labels, output_dict=True, zero_division=0)
    metrics["per_class"] = {label: report[label] for label in labels if label in report}
    
    return metrics


def calculate_regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray
) -> Dict:
    """
    Calculate regression metrics for time-series prediction
    
    Args:
        y_true: Actual values
        y_pred: Predicted values
        
    Returns:
        Dictionary of metrics
    """
    metrics = {
        "mse": float(mean_squared_error(y_true, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "r2": float(r2_score(y_true, y_pred)),
        "mape": float(np.mean(np.abs((y_true - y_pred) / (y_true + 1e-10))) * 100)
    }
    
    return metrics


def plot_confusion_matrix(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    labels: List[str],
    normalize: bool = True
) -> str:
    """
    Generate confusion matrix heatmap
    
    Returns:
        Base64 encoded image
    """
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    
    if normalize:
        cm = cm.astype('float') / (cm.sum(axis=1)[:, np.newaxis] + 1e-10)
    
    plt.figure(figsize=(10, 8))
    sns.heatmap(
        cm,
        annot=True,
        fmt='.2f' if normalize else 'd',
        cmap='Blues',
        xticklabels=labels,
        yticklabels=labels,
        cbar_kws={'label': 'Proportion' if normalize else 'Count'}
    )
    
    plt.title('Confusion Matrix', fontsize=16, fontweight='bold')
    plt.ylabel('True Label', fontsize=12)
    plt.xlabel('Predicted Label', fontsize=12)
    plt.tight_layout()
    
    # Convert to base64
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    plt.close()
    
    return image_base64


def calculate_inference_latency(
    inference_times: List[float]
) -> Dict:
    """
    Calculate latency statistics
    
    Args:
        inference_times: List of inference times in milliseconds
        
    Returns:
        Latency statistics
    """
    times = np.array(inference_times)
    
    return {
        "mean_ms": float(np.mean(times)),
        "median_ms": float(np.median(times)),
        "std_ms": float(np.std(times)),
        "min_ms": float(np.min(times)),
        "max_ms": float(np.max(times)),
        "p95_ms": float(np.percentile(times, 95)),
        "p99_ms": float(np.percentile(times, 99))
    }


def evaluate_model_performance(
    model,
    X_test,
    y_test,
    task_type: str = "classification"
) -> Dict:
    """
    Comprehensive model evaluation
    
    Args:
        model: Trained model
        X_test: Test features
        y_test: Test labels
        task_type: 'classification' or 'regression'
        
    Returns:
        Complete evaluation report
    """
    import time
    
    # Measure inference time
    inference_times = []
    predictions = []
    
    for x in X_test[:100]:  # Sample for latency measurement
        start = time.time()
        pred = model.predict(x.reshape(1, -1))
        end = time.time()
        inference_times.append((end - start) * 1000)  # Convert to ms
        predictions.append(pred)
    
    # Full predictions
    y_pred = model.predict(X_test)
    
    report = {
        "latency": calculate_inference_latency(inference_times),
        "sample_size": len(y_test)
    }
    
    if task_type == "classification":
        report["metrics"] = calculate_classification_metrics(y_test, y_pred, model.classes_)
    else:
        report["metrics"] = calculate_regression_metrics(y_test, y_pred)
    
    return report


def calculate_mood_consistency_score(mood_history: List[str], window: int = 7) -> float:
    """
    Calculate consistency/stability of mood over time
    
    Args:
        mood_history: List of mood labels chronologically
        window: Window size for consistency calculation
        
    Returns:
        Consistency score (0-1, higher = more stable)
    """
    if len(mood_history) < window:
        return 1.0
    
    # Calculate entropy in sliding windows
    from collections import Counter
    
    entropies = []
    for i in range(len(mood_history) - window + 1):
        window_moods = mood_history[i:i+window]
        counts = Counter(window_moods)
        probs = np.array(list(counts.values())) / window
        entropy = -np.sum(probs * np.log2(probs + 1e-10))
        entropies.append(entropy)
    
    # Lower entropy = more consistent
    max_entropy = np.log2(window)
    avg_entropy = np.mean(entropies)
    consistency = 1.0 - (avg_entropy / max_entropy)
    
    return float(consistency)


def calculate_trend_accuracy(
    actual_trend: List[float],
    predicted_trend: List[float],
    tolerance: float = 0.2
) -> Dict:
    """
    Evaluate accuracy of trend predictions
    
    Args:
        actual_trend: Actual sentiment values
        predicted_trend: Predicted sentiment values
        tolerance: Acceptable error margin
        
    Returns:
        Trend prediction metrics
    """
    actual = np.array(actual_trend)
    predicted = np.array(predicted_trend)
    
    # Direction accuracy (is trend going up/down correctly?)
    actual_direction = np.sign(np.diff(actual))
    pred_direction = np.sign(np.diff(predicted))
    direction_accuracy = np.mean(actual_direction == pred_direction)
    
    # Within tolerance
    within_tolerance = np.mean(np.abs(actual - predicted) <= tolerance)
    
    return {
        "direction_accuracy": float(direction_accuracy),
        "within_tolerance_rate": float(within_tolerance),
        **calculate_regression_metrics(actual, predicted)
    }
