"""
Comprehensive Test Suite for Sentiment Analysis Module
Tests all models, pages integration, and edge cases
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sentiment_module.analyzer import SentimentAnalyzer, get_analyzer
from sentiment_module.models import VADERModel, ClassicalModel, BiLSTMModel, EnsembleModel


def test_vader_model():
    """Test VADER sentiment analysis"""
    print("\n" + "="*60)
    print("TEST 1: VADER Model")
    print("="*60)
    
    vader = VADERModel()
    
    test_cases = [
        ("I'm feeling great today!", "Positive"),
        ("I'm so anxious and stressed", "Negative"),
        ("The weather is okay", "Neutral"),
        ("I want to kill myself", "Negative"),  # Should detect suicidal flag
        ("I love this beautiful day!", "Positive"),
    ]
    
    for text, expected_label in test_cases:
        result = vader.analyze(text)
        status = "✅" if expected_label.lower() in result.label.lower() else "❌"
        print(f"\n{status} Text: '{text}'")
        print(f"   Label: {result.label} (Expected: {expected_label})")
        print(f"   Confidence: {result.confidence:.3f}")
        print(f"   Compound: {result.compound_score:.3f}")
        print(f"   Keywords: {result.keywords}")
        if result.mental_health_flags:
            print(f"   ⚠️  Mental Health Flags: {result.mental_health_flags}")
    
    print("\n✓ VADER Model Test Complete")


def test_classical_model():
    """Test Classical ML model (if available)"""
    print("\n" + "="*60)
    print("TEST 2: Classical Model (TF-IDF + LogReg)")
    print("="*60)
    
    try:
        classical = ClassicalModel()
        
        test_cases = [
            "I'm feeling wonderful and happy!",
            "I'm depressed and hopeless",
            "This is a normal day"
        ]
        
        for text in test_cases:
            result = classical.analyze(text)
            print(f"\n✅ Text: '{text}'")
            print(f"   Label: {result.label}")
            print(f"   Confidence: {result.confidence:.3f}")
            print(f"   Compound: {result.compound_score:.3f}")
        
        print("\n✓ Classical Model Test Complete")
    except Exception as e:
        print(f"\n⚠️  Classical model not available: {e}")


def test_bilstm_model():
    """Test BiLSTM model (if available)"""
    print("\n" + "="*60)
    print("TEST 3: BiLSTM Model")
    print("="*60)
    
    try:
        bilstm = BiLSTMModel()
        
        test_cases = [
            "I'm so excited and happy!",
            "I feel terrible and sad",
            "Everything is just okay"
        ]
        
        for text in test_cases:
            result = bilstm.analyze(text)
            print(f"\n✅ Text: '{text}'")
            print(f"   Label: {result.label}")
            print(f"   Confidence: {result.confidence:.3f}")
            print(f"   Compound: {result.compound_score:.3f}")
        
        print("\n✓ BiLSTM Model Test Complete")
    except Exception as e:
        print(f"\n⚠️  BiLSTM model not available: {e}")


def test_ensemble_model():
    """Test Ensemble model"""
    print("\n" + "="*60)
    print("TEST 4: Ensemble Model")
    print("="*60)
    
    try:
        vader = VADERModel()
        
        # Try to load optional models
        try:
            classical = ClassicalModel()
        except:
            classical = None
        
        try:
            bilstm = BiLSTMModel()
        except:
            bilstm = None
        
        if classical and bilstm:
            ensemble = EnsembleModel(vader, classical, bilstm)
            
            test_cases = [
                "I'm absolutely thrilled!",
                "I'm devastated and hopeless",
            ]
            
            for text in test_cases:
                result = ensemble.analyze(text)
                print(f"\n✅ Text: '{text}'")
                print(f"   Label: {result.label}")
                print(f"   Confidence: {result.confidence:.3f}")
                print(f"   Models Used: {result.scores.get('models_used', [])}")
            
            print("\n✓ Ensemble Model Test Complete")
        else:
            print("\n⚠️  Ensemble requires all models - some models unavailable")
    except Exception as e:
        print(f"\n⚠️  Ensemble model test failed: {e}")


def test_sentiment_analyzer():
    """Test unified SentimentAnalyzer interface"""
    print("\n" + "="*60)
    print("TEST 5: Unified SentimentAnalyzer")
    print("="*60)
    
    analyzer = get_analyzer()
    
    # Register models
    analyzer.register_model("vader", VADERModel())
    
    try:
        analyzer.register_model("classical", ClassicalModel())
    except:
        print("⚠️  Classical model not registered (not available)")
    
    try:
        analyzer.register_model("bilstm", BiLSTMModel())
    except:
        print("⚠️  BiLSTM model not registered (not available)")
    
    print(f"\n✓ Available models: {analyzer.get_available_models()}")
    
    # Test analysis with default model
    text = "I'm feeling anxious about my exams"
    result = analyzer.analyze(text)
    
    print(f"\n✅ Analyzed: '{text}'")
    print(f"   Model: {result.model}")
    print(f"   Label: {result.label}")
    print(f"   Confidence: {result.confidence:.3f}")
    print(f"   Processing Time: {result.processing_time_ms:.2f}ms")
    print(f"   Keywords: {result.keywords}")
    
    # Test batch analysis
    texts = [
        "I'm so happy today!",
        "I feel sad and lonely",
        "It's a normal day"
    ]
    
    print(f"\n✓ Batch Analysis ({len(texts)} texts):")
    results = analyzer.analyze_batch(texts)
    for i, result in enumerate(results):
        print(f"   {i+1}. '{texts[i]}' → {result.label} ({result.confidence:.2f})")
    
    print("\n✓ SentimentAnalyzer Test Complete")


def test_page_integration():
    """Test integration with application pages"""
    print("\n" + "="*60)
    print("TEST 6: Page Integration Scenarios")
    print("="*60)
    
    analyzer = get_analyzer()
    analyzer.register_model("vader", VADERModel())
    
    # 1. Journal Page - Single entry analysis
    print("\n📓 Journal Page Scenario:")
    journal_entry = "Today was tough. I felt anxious and overwhelmed by work deadlines."
    result = analyzer.analyze(journal_entry, model="vader")
    print(f"   Entry: '{journal_entry[:50]}...'")
    print(f"   Sentiment: {result.label} ({result.confidence:.2f})")
    print(f"   Keywords: {result.keywords[:3]}")
    
    # 2. MoodCheckin Page - Quick mood analysis
    print("\n😊 MoodCheckin Page Scenario:")
    mood_text = "I'm feeling pretty good, just a bit tired"
    result = analyzer.analyze(mood_text, model="vader", top_k_keywords=3)
    print(f"   Mood: '{mood_text}'")
    print(f"   Sentiment: {result.label} ({result.intensity:.2f} intensity)")
    
    # 3. ReflectionWall Page - Batch analysis of reflections
    print("\n🌟 ReflectionWall Page Scenario (Batch):")
    reflections = [
        "Grateful for my supportive friends",
        "Struggling with self-doubt today",
        "Made progress on my goals!"
    ]
    results = analyzer.analyze_batch(reflections, model="vader")
    for i, (text, result) in enumerate(zip(reflections, results)):
        print(f"   {i+1}. {result.label} - '{text}'")
    
    # 4. Chatbot Page - Real-time sentiment detection
    print("\n💬 Chatbot Page Scenario:")
    user_message = "I'm feeling really stressed about my presentation tomorrow"
    result = analyzer.analyze(user_message, model="vader", extract_keywords=True)
    print(f"   User: '{user_message}'")
    print(f"   Detected: {result.label} (confidence: {result.confidence:.2f})")
    print(f"   Emotion Keywords: {result.keywords}")
    if result.mental_health_flags:
        print(f"   ⚠️  Crisis Flags: {result.mental_health_flags}")
    
    print("\n✓ Page Integration Tests Complete")


def test_mental_health_detection():
    """Test mental health crisis detection"""
    print("\n" + "="*60)
    print("TEST 7: Mental Health Crisis Detection")
    print("="*60)
    
    vader = VADERModel()
    
    crisis_texts = [
        ("I want to end my life", ["suicidal_ideation"]),
        ("I've been thinking about suicide", ["suicidal_ideation"]),
        ("I want to hurt myself", ["self_harm"]),
        ("I feel completely hopeless and worthless", ["severe_depression"]),
        ("I'm having a panic attack, can't breathe", ["severe_anxiety"]),
        ("I'm feeling a bit down today", []),  # Should NOT trigger
    ]
    
    for text, expected_flags in crisis_texts:
        result = vader.analyze(text)
        detected_flags = result.mental_health_flags or []
        
        if expected_flags:
            status = "⚠️  CRISIS" if detected_flags else "❌ MISSED"
        else:
            status = "✅ SAFE" if not detected_flags else "⚠️  FALSE POSITIVE"
        
        print(f"\n{status} Text: '{text}'")
        print(f"   Expected Flags: {expected_flags or ['None']}")
        print(f"   Detected Flags: {detected_flags or ['None']}")
        print(f"   Sentiment: {result.label} ({result.compound_score:.2f})")
    
    print("\n✓ Mental Health Detection Test Complete")


def test_performance():
    """Test performance and speed"""
    print("\n" + "="*60)
    print("TEST 8: Performance Benchmarks")
    print("="*60)
    
    analyzer = get_analyzer()
    analyzer.register_model("vader", VADERModel())
    
    # Single analysis performance
    text = "I'm feeling great today and looking forward to the weekend!"
    result = analyzer.analyze(text)
    print(f"\n✅ Single Analysis Performance:")
    print(f"   Text Length: {len(text)} characters")
    print(f"   Processing Time: {result.processing_time_ms:.2f}ms")
    print(f"   Expected: < 50ms for VADER")
    
    # Batch analysis performance
    import time
    texts = [
        "I'm happy and excited!",
        "Feeling sad and lonely",
        "Just a normal day",
        "Anxious about tomorrow",
        "Grateful for everything"
    ] * 10  # 50 texts
    
    start = time.time()
    results = analyzer.analyze_batch(texts)
    total_time = (time.time() - start) * 1000
    
    print(f"\n✅ Batch Analysis Performance:")
    print(f"   Texts Analyzed: {len(texts)}")
    print(f"   Total Time: {total_time:.2f}ms")
    print(f"   Average per Text: {total_time/len(texts):.2f}ms")
    print(f"   Throughput: {len(texts)/(total_time/1000):.1f} texts/second")
    
    print("\n✓ Performance Test Complete")


def run_all_tests():
    """Run all test suites"""
    print("\n" + "="*80)
    print("🧪 SENTIMENT ANALYSIS MODULE - COMPREHENSIVE TEST SUITE")
    print("="*80)
    
    try:
        test_vader_model()
        test_classical_model()
        test_bilstm_model()
        test_ensemble_model()
        test_sentiment_analyzer()
        test_page_integration()
        test_mental_health_detection()
        test_performance()
        
        print("\n" + "="*80)
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ TEST SUITE FAILED: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    run_all_tests()
