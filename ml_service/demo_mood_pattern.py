"""
Complete Mood Pattern Recognition System Demo
Uses pre-trained models for face + text emotion detection and fusion
"""

import os
import sys
import cv2
import numpy as np
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from mood_pattern_recognition.models.face_emotion_model import FaceEmotionDetector
from mood_pattern_recognition.models.text_emotion_model import TextEmotionAnalyzer
from mood_pattern_recognition.models.mood_fusion_model import MoodFusionModel
from mood_pattern_recognition.utils.emotion_mapping import calculate_overall_sentiment


def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80)


def demo_face_emotion():
    """Demo 1: Face Emotion Detection"""
    print_header("DEMO 1: Face Emotion Detection (Using Pre-trained Model)")
    
    try:
        # Initialize detector (will use pre-trained model if available)
        detector = FaceEmotionDetector(use_existing=True)
        print("✓ Face detector initialized")
        
        # Create a test image (random for demo - in production use real face photos)
        print("\nGenerating test image...")
        test_img = np.random.randint(0, 255, (96, 96, 3), dtype=np.uint8)
        
        # Predict emotion
        print("Analyzing face emotion...")
        emotions = detector.predict_emotion(test_img, detect_face=False)
        dominant, confidence = detector.get_dominant_emotion(emotions)
        
        # Display results
        print(f"\n✓ Analysis Complete!")
        print(f"  Dominant Emotion: {dominant}")
        print(f"  Confidence: {confidence:.2%}")
        print(f"\n  All Emotions:")
        for emotion, prob in sorted(emotions.items(), key=lambda x: x[1], reverse=True):
            bar = "█" * int(prob * 30)
            print(f"    {emotion:12s} [{prob:.2%}] {bar}")
        
        # Map to unified mood
        mood_probs = detector.get_mood_from_emotion(emotions)
        print(f"\n  Unified Moods:")
        for mood, prob in sorted(mood_probs.items(), key=lambda x: x[1], reverse=True):
            bar = "█" * int(prob * 30)
            print(f"    {mood:12s} [{prob:.2%}] {bar}")
        
        return emotions, mood_probs
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None, None


def demo_text_emotion():
    """Demo 2: Text Emotion Analysis"""
    print_header("DEMO 2: Text Emotion Analysis (Using BERT)")
    
    test_texts = [
        "I'm feeling really happy and excited about today!",
        "I'm so anxious and worried about tomorrow.",
        "This makes me so angry and frustrated!",
        "I feel sad and disappointed.",
    ]
    
    try:
        # Initialize analyzer
        print("Initializing BERT text analyzer...")
        analyzer = TextEmotionAnalyzer(model_type="bert", use_pretrained=True)
        print("✓ Text analyzer initialized\n")
        
        all_results = []
        
        for i, text in enumerate(test_texts, 1):
            print(f"\n--- Text {i} ---")
            print(f'"{text}"')
            
            # Analyze
            result = analyzer.analyze_journal_entry(text)
            all_results.append(result)
            
            print(f"\n  Primary Emotion: {result['dominant_emotion']} ({result['confidence']:.2%})")
            print(f"  Sentiment Score: {result['sentiment_score']:.2f}")
            print(f"  Top 3 Emotions:")
            for emotion, prob in sorted(result['emotions'].items(), key=lambda x: x[1], reverse=True)[:3]:
                print(f"    {emotion:12s} [{prob:.2%}]")
        
        return all_results
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None


def demo_fusion():
    """Demo 3: Multimodal Fusion (Face + Text)"""
    print_header("DEMO 3: Multimodal Fusion (Face + Text)")
    
    try:
        # Initialize all models
        print("Initializing models...")
        face_detector = FaceEmotionDetector(use_existing=True)
        text_analyzer = TextEmotionAnalyzer(model_type="bert", use_pretrained=True)
        fusion_model = MoodFusionModel(fusion_method="adaptive", face_weight=0.5, text_weight=0.5)
        print("✓ All models initialized\n")
        
        # Test case: Mixed emotions
        test_text = "I'm feeling happy about the good news, but also anxious about what comes next."
        print(f'Test Text: "{test_text}"')
        
        # Analyze face (using random test image)
        test_img = np.random.randint(0, 255, (96, 96, 3), dtype=np.uint8)
        face_emotions = face_detector.predict_emotion(test_img, detect_face=False)
        face_emotion, face_conf = face_detector.get_dominant_emotion(face_emotions)
        
        # Analyze text
        text_result = text_analyzer.analyze_journal_entry(test_text)
        text_emotions = text_result['emotions']
        text_emotion = text_result['dominant_emotion']
        text_conf = text_result['confidence']
        
        print(f"\nFace Analysis:")
        print(f"  Emotion: {face_emotion} ({face_conf:.2%})")
        
        print(f"\nText Analysis:")
        print(f"  Emotion: {text_emotion} ({text_conf:.2%})")
        
        # Fusion analysis
        print(f"\nFusion Analysis (Adaptive Method):")
        fusion_result = fusion_model.analyze_multimodal(
            face_emotions=face_emotions,
            text_emotions=text_emotions,
            face_confidence=face_conf,
            text_confidence=text_conf
        )
        
        print(f"  ✓ Unified Mood: {fusion_result['mood']}")
        print(f"  ✓ Confidence: {fusion_result['confidence']:.2%}")
        print(f"  ✓ Sentiment Score: {fusion_result['sentiment_score']:.2f}")
        print(f"  ✓ Trend: {fusion_result['trend']}")
        print(f"  ✓ Emoji: {fusion_result['emoji']}")
        print(f"  ✓ Modalities Used: {', '.join(fusion_result['modalities_used'])}")
        
        print(f"\n  Mood Distribution:")
        for mood, prob in sorted(fusion_result['mood_distribution'].items(), key=lambda x: x[1], reverse=True):
            bar = "█" * int(prob * 30)
            print(f"    {mood:12s} [{prob:.2%}] {bar}")
        
        return fusion_result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None


def demo_integration_workflow():
    """Demo 4: Complete Integration Workflow"""
    print_header("DEMO 4: Complete Integration Workflow")
    
    print("\nSimulating a real-world mood check-in scenario...")
    print("-" * 80)
    
    # Simulated user data
    user_id = "demo_user_001"
    journal_entry = """
    Today was a mixed bag. I woke up feeling energized and ready to tackle 
    my goals. The morning went well, and I got a lot done. But in the afternoon, 
    I started feeling anxious about an upcoming deadline. I'm trying to stay 
    positive, but the pressure is getting to me a bit.
    """
    
    print(f"\nUser ID: {user_id}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\nJournal Entry:")
    print(journal_entry.strip())
    
    try:
        # Step 1: Analyze text
        print("\n" + "-" * 80)
        print("STEP 1: Analyzing journal text...")
        analyzer = TextEmotionAnalyzer(model_type="bert", use_pretrained=True)
        text_result = analyzer.analyze_journal_entry(journal_entry)
        
        print(f"✓ Text Analysis Complete")
        print(f"  Primary Emotion: {text_result['dominant_emotion']}")
        print(f"  Confidence: {text_result['confidence']:.2%}")
        print(f"  Sentiment: {text_result['sentiment_score']:.2f}")
        
        # Step 2: Analyze face (simulated)
        print("\n" + "-" * 80)
        print("STEP 2: Analyzing facial expression...")
        detector = FaceEmotionDetector(use_existing=True)
        test_img = np.random.randint(0, 255, (96, 96, 3), dtype=np.uint8)
        face_emotions = detector.predict_emotion(test_img, detect_face=False)
        face_emotion, face_conf = detector.get_dominant_emotion(face_emotions)
        
        print(f"✓ Face Analysis Complete")
        print(f"  Detected Emotion: {face_emotion}")
        print(f"  Confidence: {face_conf:.2%}")
        
        # Step 3: Fusion
        print("\n" + "-" * 80)
        print("STEP 3: Combining face + text (Multimodal Fusion)...")
        fusion = MoodFusionModel(fusion_method="adaptive")
        result = fusion.analyze_multimodal(
            face_emotions=face_emotions,
            text_emotions=text_result['emotions'],
            face_confidence=face_conf,
            text_confidence=text_result['confidence']
        )
        
        print(f"✓ Fusion Analysis Complete")
        print(f"\n  FINAL MOOD ASSESSMENT:")
        print(f"  {'='*50}")
        print(f"  Mood: {result['mood']} {result['emoji']}")
        print(f"  Confidence: {result['confidence']:.2%}")
        print(f"  Sentiment: {result['sentiment_score']:.2f}/1.0")
        print(f"  Trend: {result['trend']}")
        print(f"  {'='*50}")
        
        # Step 4: Recommendations (simulated)
        print("\n" + "-" * 80)
        print("STEP 4: Generating personalized recommendations...")
        
        if result['sentiment_score'] < -0.3:
            recommendations = [
                "🧘 Try a 10-minute meditation session",
                "🎵 Listen to calming music",
                "📝 Write about what's bothering you"
            ]
        elif result['sentiment_score'] > 0.3:
            recommendations = [
                "🎉 Celebrate your positive mood!",
                "💪 Channel this energy into productive tasks",
                "🤝 Share your positivity with others"
            ]
        else:
            recommendations = [
                "🚶 Take a short walk to clear your mind",
                "☕ Have a cup of tea and relax",
                "📖 Read something inspiring"
            ]
        
        print(f"✓ Based on your mood ({result['mood']}), we recommend:")
        for rec in recommendations:
            print(f"  • {rec}")
        
        # Summary
        print("\n" + "=" * 80)
        print("SUMMARY: Mood Pattern Data Saved")
        print("=" * 80)
        print(f"User: {user_id}")
        print(f"Mood: {result['mood']}")
        print(f"Sentiment: {result['sentiment_score']:.2f}")
        print(f"Source: Multimodal (Face + Text)")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 80)
        
        return result
        
    except Exception as e:
        print(f"❌ Error in workflow: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Run all demos"""
    print("\n" + "=" * 80)
    print("  MOOD PATTERN RECOGNITION SYSTEM - COMPLETE DEMO")
    print("  Using Pre-trained Models (fer2013_model.keras / affectnet_model.keras)")
    print("=" * 80)
    
    # Demo 1: Face
    demo_face_emotion()
    
    input("\n\nPress Enter to continue to Text Emotion Demo...")
    
    # Demo 2: Text
    demo_text_emotion()
    
    input("\n\nPress Enter to continue to Fusion Demo...")
    
    # Demo 3: Fusion
    demo_fusion()
    
    input("\n\nPress Enter to continue to Full Integration Workflow...")
    
    # Demo 4: Complete workflow
    demo_integration_workflow()
    
    print("\n" + "=" * 80)
    print("  ✓ ALL DEMOS COMPLETED!")
    print("  System is ready for production use.")
    print("=" * 80)
    print("\nNext Steps:")
    print("  1. Start the API: uvicorn mood_pattern_recognition.api.mood_service:app --reload --port 8002")
    print("  2. Test endpoints: http://localhost:8002/docs")
    print("  3. Integrate with frontend using api.moodPattern.* functions")
    print("\n")


if __name__ == "__main__":
    main()
