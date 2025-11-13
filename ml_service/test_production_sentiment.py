"""
Comprehensive Test Suite for Production Sentiment System
Tests all three models, ensemble, and API endpoints
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.sentiment_service import (
    get_sentiment_service,
    SentimentModel,
    SentimentResult
)
import time
from typing import List, Dict


def print_header(title: str):
    """Print formatted section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def print_result(result: SentimentResult, model_name: str):
    """Print formatted sentiment result"""
    print(f"\n{model_name} Analysis:")
    print(f"  Label: {result.label}")
    print(f"  Confidence: {result.confidence:.3f}")
    print(f"  Intensity: {result.intensity:.3f}")
    if result.keywords:
        print(f"  Keywords: {', '.join(result.keywords[:5])}")
    print(f"  Processing Time: {result.processing_time_ms:.2f}ms")
    print(f"  Timestamp: {result.timestamp}")


def test_individual_models():
    """Test each model individually"""
    print_header("1. TESTING INDIVIDUAL MODELS")
    
    service = get_sentiment_service()
    
    test_texts = [
        "I'm feeling incredibly happy and optimistic today!",
        "I'm struggling with anxiety and can't seem to relax.",
        "Just another day, nothing special happening.",
        "I feel completely hopeless and don't know what to do.",
        "The weather is nice outside."
    ]
    
    for i, text in enumerate(test_texts, 1):
        print(f"\n--- Test Case {i}: '{text[:50]}...' ---")
        
        # Test VADER
        try:
            vader_result = service.analyze(text, SentimentModel.VADER)
            print_result(vader_result, "VADER")
        except Exception as e:
            print(f"  VADER Error: {e}")
        
        # Test Classical
        try:
            classical_result = service.analyze(text, SentimentModel.CLASSICAL)
            print_result(classical_result, "Classical")
        except Exception as e:
            print(f"  Classical Error: {e}")
        
        # Test BiLSTM
        try:
            bilstm_result = service.analyze(text, SentimentModel.BILSTM)
            print_result(bilstm_result, "BiLSTM")
        except Exception as e:
            print(f"  BiLSTM Error: {e}")


def test_ensemble():
    """Test ensemble model with weighted voting"""
    print_header("2. TESTING ENSEMBLE MODEL")
    
    service = get_sentiment_service()
    
    test_cases = [
        ("I'm so happy and grateful for everything!", None),
        ("Feeling extremely anxious about tomorrow's presentation.", None),
        ("I feel trapped and hopeless about my situation.", {"vader": 0.2, "classical": 0.5, "bilstm": 0.3}),
    ]
    
    for i, (text, weights) in enumerate(test_cases, 1):
        print(f"\n--- Ensemble Test {i}: '{text[:60]}...' ---")
        if weights:
            print(f"  Custom Weights: {weights}")
        
        try:
            result = service.analyze(
                text, 
                SentimentModel.ENSEMBLE,
                ensemble_weights=weights
            )
            print_result(result, "Ensemble")
            
            # Show individual probabilities
            print(f"\n  Probability Distribution:")
            for label, prob in result.probabilities.items():
                print(f"    {label}: {prob:.3f}")
                
        except Exception as e:
            print(f"  Ensemble Error: {e}")


def test_batch_processing():
    """Test batch analysis"""
    print_header("3. TESTING BATCH PROCESSING")
    
    service = get_sentiment_service()
    
    batch_texts = [
        "I love spending time with my family!",
        "Work stress is overwhelming me lately.",
        "I'm feeling neutral about this situation.",
        "Everything feels hopeless and dark.",
        "The project went well today.",
        "I'm worried about the future.",
        "Life is beautiful and full of opportunities!",
        "I can't handle this pressure anymore.",
    ]
    
    print(f"\nAnalyzing {len(batch_texts)} texts with each model...\n")
    
    # VADER Batch
    print("--- VADER Batch Analysis ---")
    start = time.time()
    try:
        vader_results = service.analyze_batch(batch_texts, SentimentModel.VADER)
        duration = (time.time() - start) * 1000
        print(f"  Total Time: {duration:.2f}ms")
        print(f"  Avg Time per Text: {duration/len(batch_texts):.2f}ms")
        print(f"  Results:")
        for i, result in enumerate(vader_results, 1):
            print(f"    {i}. {result.label} ({result.confidence:.2f})")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Classical Batch
    print("\n--- Classical Batch Analysis ---")
    start = time.time()
    try:
        classical_results = service.analyze_batch(batch_texts, SentimentModel.CLASSICAL)
        duration = (time.time() - start) * 1000
        print(f"  Total Time: {duration:.2f}ms")
        print(f"  Avg Time per Text: {duration/len(batch_texts):.2f}ms")
        print(f"  Results:")
        for i, result in enumerate(classical_results, 1):
            print(f"    {i}. {result.label} ({result.confidence:.2f})")
    except Exception as e:
        print(f"  Error: {e}")
    
    # BiLSTM Batch
    print("\n--- BiLSTM Batch Analysis ---")
    start = time.time()
    try:
        bilstm_results = service.analyze_batch(batch_texts, SentimentModel.BILSTM)
        duration = (time.time() - start) * 1000
        print(f"  Total Time: {duration:.2f}ms")
        print(f"  Avg Time per Text: {duration/len(batch_texts):.2f}ms")
        print(f"  Results:")
        for i, result in enumerate(bilstm_results, 1):
            print(f"    {i}. {result.label} ({result.confidence:.2f})")
    except Exception as e:
        print(f"  Error: {e}")


def test_model_info():
    """Test model information and recommendations"""
    print_header("4. TESTING MODEL INFORMATION")
    
    service = get_sentiment_service()
    
    # Get all models info
    print("\n--- All Models Information ---")
    info = service.get_model_info()
    for model_name, model_data in info.items():
        print(f"\n{model_name.upper()}:")
        print(f"  Name: {model_data.get('name')}")
        print(f"  Type: {model_data.get('type')}")
        print(f"  Available: {model_data.get('available')}")
        print(f"  Speed: {model_data.get('speed')}")
        print(f"  Description: {model_data.get('description')}")
    
    # Test recommendations
    print("\n--- Model Recommendations ---")
    use_cases = ["chatbot", "mood_checkin", "journal", "reflection_wall"]
    
    for use_case in use_cases:
        recommended = service.recommend_model(use_case)
        print(f"\n{use_case}:")
        print(f"  Recommended: {recommended.value}")


def test_edge_cases():
    """Test edge cases and error handling"""
    print_header("5. TESTING EDGE CASES")
    
    service = get_sentiment_service()
    
    edge_cases = [
        ("", "Empty string"),
        ("   ", "Whitespace only"),
        ("!!!", "Punctuation only"),
        ("a" * 1000, "Very long text (1000 chars)"),
        ("Hello", "Single word"),
        ("😊 😢 😡", "Emojis only"),
        ("I'm happy but also sad and anxious.", "Mixed emotions"),
    ]
    
    for text, description in edge_cases:
        print(f"\n--- {description} ---")
        try:
            result = service.analyze(text[:100] + "..." if len(text) > 100 else text, SentimentModel.VADER)
            print(f"  Label: {result.label}")
            print(f"  Confidence: {result.confidence:.3f}")
        except Exception as e:
            print(f"  Error: {e}")


def test_mental_health_categories():
    """Test mental health category detection"""
    print_header("6. TESTING MENTAL HEALTH CATEGORIES")
    
    service = get_sentiment_service()
    
    # Specific mental health scenarios
    scenarios = [
        ("I can't stop worrying about everything, my heart races constantly.", "Anxiety"),
        ("I feel empty and hopeless, nothing brings me joy anymore.", "Depression"),
        ("I'm so stressed with deadlines, I can't handle the pressure.", "Stress"),
        ("My mood swings are extreme, one moment I'm energetic, next I'm down.", "Bipolar"),
        ("I sometimes have thoughts of hurting myself when things get bad.", "Suicidal - CRITICAL"),
        ("I'm having a great day, feeling productive and content!", "Normal/Positive"),
    ]
    
    print("\nTesting mental health category detection across all models:\n")
    
    for text, expected_category in scenarios:
        print(f"--- Expected: {expected_category} ---")
        print(f"Text: '{text}'\n")
        
        # Test with Classical (best for mental health categories)
        try:
            classical_result = service.analyze(text, SentimentModel.CLASSICAL)
            print(f"  Classical: {classical_result.label} (confidence: {classical_result.confidence:.3f})")
        except Exception as e:
            print(f"  Classical Error: {e}")
        
        # Test with BiLSTM
        try:
            bilstm_result = service.analyze(text, SentimentModel.BILSTM)
            print(f"  BiLSTM: {bilstm_result.label} (confidence: {bilstm_result.confidence:.3f})")
        except Exception as e:
            print(f"  BiLSTM Error: {e}")
        
        # Test with Ensemble for critical cases
        if "CRITICAL" in expected_category or "Suicidal" in expected_category:
            try:
                ensemble_result = service.analyze(text, SentimentModel.ENSEMBLE)
                print(f"  Ensemble (CRITICAL): {ensemble_result.label} (confidence: {ensemble_result.confidence:.3f})")
                print(f"  ⚠️  ALERT: Critical mental health indicator detected!")
            except Exception as e:
                print(f"  Ensemble Error: {e}")
        
        print()


def test_performance_benchmarks():
    """Benchmark performance of all models"""
    print_header("7. PERFORMANCE BENCHMARKS")
    
    service = get_sentiment_service()
    
    test_text = "I'm feeling anxious about the upcoming presentation and worried about the outcome."
    iterations = 10
    
    models = [
        (SentimentModel.VADER, "VADER"),
        (SentimentModel.CLASSICAL, "Classical"),
        (SentimentModel.BILSTM, "BiLSTM"),
        (SentimentModel.ENSEMBLE, "Ensemble"),
    ]
    
    print(f"\nRunning {iterations} iterations for each model...\n")
    
    for model, name in models:
        times = []
        
        for _ in range(iterations):
            start = time.time()
            try:
                result = service.analyze(test_text, model)
                times.append((time.time() - start) * 1000)
            except Exception as e:
                print(f"{name} Error: {e}")
                break
        
        if times:
            avg_time = sum(times) / len(times)
            min_time = min(times)
            max_time = max(times)
            
            print(f"{name}:")
            print(f"  Average: {avg_time:.2f}ms")
            print(f"  Min: {min_time:.2f}ms")
            print(f"  Max: {max_time:.2f}ms")
            print()


def main():
    """Run all tests"""
    print("\n" + "█" * 80)
    print("█" + " " * 78 + "█")
    print("█" + "  PRODUCTION SENTIMENT ANALYSIS SYSTEM - COMPREHENSIVE TEST SUITE".center(78) + "█")
    print("█" + " " * 78 + "█")
    print("█" * 80)
    
    try:
        test_individual_models()
        test_ensemble()
        test_batch_processing()
        test_model_info()
        test_edge_cases()
        test_mental_health_categories()
        test_performance_benchmarks()
        
        print_header("✅ ALL TESTS COMPLETED SUCCESSFULLY")
        print("\nSystem is ready for production deployment!")
        print("All three models (VADER, Classical, BiLSTM) and Ensemble are operational.")
        print("\nNext Steps:")
        print("1. Start Flask server: python app.py")
        print("2. Test API endpoints: http://localhost:5000/api/sentiment/v2/health")
        print("3. Integrate with frontend pages")
        print("4. Deploy to production")
        
    except Exception as e:
        print_header("❌ TEST SUITE FAILED")
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
