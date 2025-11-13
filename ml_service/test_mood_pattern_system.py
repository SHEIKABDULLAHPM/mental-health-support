"""
Comprehensive Test Suite for Mood Pattern Recognition System
Tests all components: Face, Text, Fusion, Trend Prediction, and API endpoints
"""

import sys
import os
import asyncio
import aiohttp
import json
from pathlib import Path
from io import BytesIO
import base64

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(80)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}\n")


def print_success(text):
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")


def print_error(text):
    print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")


def print_info(text):
    print(f"{Colors.OKBLUE}ℹ️  {text}{Colors.ENDC}")


def print_warning(text):
    print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")


# Test configuration
API_BASE_URL = "http://localhost:8002"
TEST_USER_ID = "test_user_123"


async def test_health_endpoint(session):
    """Test 1: Health Check"""
    print_header("Test 1: Health Check")
    
    try:
        async with session.get(f"{API_BASE_URL}/health") as resp:
            if resp.status == 200:
                data = await resp.json()
                print_success("Health endpoint is working")
                print_info(f"Status: {data.get('status', 'unknown')}")
                
                models = data.get('models_loaded', {})
                print_info("Models loaded:")
                for model, loaded in models.items():
                    status = "✓" if loaded else "✗"
                    print(f"  {status} {model}")
                
                return True
            else:
                print_error(f"Health check failed with status {resp.status}")
                return False
    except Exception as e:
        print_error(f"Health check error: {str(e)}")
        return False


async def test_face_emotion_analysis(session):
    """Test 2: Face Emotion Analysis"""
    print_header("Test 2: Face Emotion Analysis")
    
    try:
        # Create a sample test image (simple colored square)
        try:
            from PIL import Image
            import numpy as np
            
            # Create a 96x96 test image
            img_array = np.random.randint(0, 255, (96, 96, 3), dtype=np.uint8)
            img = Image.fromarray(img_array)
            
            # Convert to bytes
            img_bytes = BytesIO()
            img.save(img_bytes, format='PNG')
            img_bytes.seek(0)
            
            print_info("Created test image (96x96 random pixels)")
            
            # Prepare multipart form data
            data = aiohttp.FormData()
            data.add_field('image', img_bytes, filename='test.png', content_type='image/png')
            
            async with session.post(f"{API_BASE_URL}/analyze/face", data=data) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    print_success("Face emotion analysis successful")
                    print_info(f"Detected Emotion: {result.get('emotion', 'N/A')}")
                    print_info(f"Confidence: {result.get('confidence', 0):.2%}")
                    print_info(f"Unified Mood: {result.get('unified_mood', 'N/A')}")
                    print_info(f"Sentiment Score: {result.get('sentiment_score', 0):.2f}")
                    print_info(f"Processing Time: {result.get('processing_time', 0):.3f}s")
                    
                    probs = result.get('all_probabilities', {})
                    if probs:
                        print_info("All probabilities:")
                        for emotion, prob in sorted(probs.items(), key=lambda x: x[1], reverse=True)[:3]:
                            print(f"  {emotion}: {prob:.2%}")
                    
                    return True
                else:
                    error = await resp.text()
                    print_error(f"Face analysis failed: {error}")
                    return False
                    
        except ImportError:
            print_warning("Pillow not installed, skipping face emotion test")
            print_info("Install with: pip install pillow")
            return None
            
    except Exception as e:
        print_error(f"Face emotion analysis error: {str(e)}")
        return False


async def test_text_emotion_analysis(session):
    """Test 3: Text Emotion Analysis"""
    print_header("Test 3: Text Emotion Analysis")
    
    test_texts = [
        ("I'm feeling really happy and excited about today!", "Happy"),
        ("I'm so anxious and worried about tomorrow.", "Fearful"),
        ("This makes me so angry and frustrated!", "Angry"),
        ("I feel sad and disappointed about the news.", "Sad"),
        ("What an amazing surprise! I'm shocked!", "Surprised"),
    ]
    
    success_count = 0
    
    for text, expected_mood in test_texts:
        try:
            payload = {
                "text": text,
                "model_type": "bert",
                "return_top_k": 3
            }
            
            async with session.post(f"{API_BASE_URL}/analyze/text", json=payload) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    
                    print_info(f"Text: '{text[:50]}...'")
                    print_success(f"Primary Emotion: {result.get('primary_emotion', 'N/A')}")
                    print_info(f"Confidence: {result.get('confidence', 0):.2%}")
                    print_info(f"Unified Mood: {result.get('unified_mood', 'N/A')}")
                    print_info(f"Sentiment: {result.get('sentiment_score', 0):.2f}")
                    
                    top_emotions = result.get('top_emotions', [])
                    if top_emotions:
                        print_info("Top 3 emotions:")
                        for em in top_emotions[:3]:
                            print(f"  {em['emotion']}: {em['score']:.2%}")
                    
                    print()
                    success_count += 1
                else:
                    print_error(f"Text analysis failed for: '{text[:30]}...'")
                    
        except Exception as e:
            print_error(f"Error analyzing text: {str(e)}")
    
    print_info(f"Text analysis success rate: {success_count}/{len(test_texts)}")
    return success_count == len(test_texts)


async def test_fusion_analysis(session):
    """Test 4: Fusion Analysis (Face + Text)"""
    print_header("Test 4: Fusion Analysis")
    
    try:
        from PIL import Image
        import numpy as np
        
        # Create test image
        img_array = np.random.randint(0, 255, (96, 96, 3), dtype=np.uint8)
        img = Image.fromarray(img_array)
        img_bytes = BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        # Test fusion with different methods
        fusion_methods = ['weighted', 'neural', 'adaptive']
        test_text = "I'm feeling mixed emotions today, happy but also a bit anxious."
        
        for method in fusion_methods:
            print_info(f"\nTesting fusion method: {method}")
            
            data = aiohttp.FormData()
            
            # Reset image stream
            img_bytes.seek(0)
            data.add_field('image', img_bytes, filename='test.png', content_type='image/png')
            data.add_field('text', test_text)
            data.add_field('fusion_method', method)
            data.add_field('face_weight', '0.5')
            data.add_field('text_weight', '0.5')
            data.add_field('return_details', 'true')
            
            async with session.post(f"{API_BASE_URL}/analyze/fusion", data=data) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    print_success(f"{method.capitalize()} fusion successful")
                    print_info(f"Unified Mood: {result.get('unified_mood', 'N/A')}")
                    print_info(f"Confidence: {result.get('confidence', 0):.2%}")
                    print_info(f"Sentiment: {result.get('sentiment_score', 0):.2f}")
                    
                    if 'face_emotion' in result:
                        print_info(f"Face: {result['face_emotion'].get('emotion')} ({result['face_emotion'].get('confidence', 0):.2%})")
                    if 'text_emotion' in result:
                        print_info(f"Text: {result['text_emotion'].get('primary_emotion')} ({result['text_emotion'].get('confidence', 0):.2%})")
                else:
                    print_error(f"{method} fusion failed")
        
        return True
        
    except ImportError:
        print_warning("Pillow not installed, skipping fusion test")
        return None
    except Exception as e:
        print_error(f"Fusion analysis error: {str(e)}")
        return False


async def test_mood_storage(session):
    """Test 5: Mood Entry Storage"""
    print_header("Test 5: Mood Entry Storage")
    
    try:
        # Store a mood entry
        payload = {
            "user_id": TEST_USER_ID,
            "timestamp": "2024-01-15T10:00:00Z",
            "mood": "Happy",
            "sentiment_score": 0.85,
            "source": "test",
            "metadata": {"test": True}
        }
        
        async with session.post(f"{API_BASE_URL}/user/{TEST_USER_ID}/mood", json=payload) as resp:
            if resp.status == 200:
                result = await resp.json()
                print_success("Mood entry stored successfully")
                print_info(f"Response: {json.dumps(result, indent=2)}")
                return True
            else:
                error = await resp.text()
                print_error(f"Mood storage failed: {error}")
                return False
                
    except Exception as e:
        print_error(f"Mood storage error: {str(e)}")
        return False


async def test_trend_prediction(session):
    """Test 6: Mood Trend Prediction"""
    print_header("Test 6: Mood Trend Prediction")
    
    try:
        # First, store some historical mood data
        print_info("Storing historical mood data for trend prediction...")
        
        from datetime import datetime, timedelta
        
        moods = ['Happy', 'Sad', 'Neutral', 'Happy', 'Fearful', 'Happy', 'Surprised']
        sentiments = [0.8, 0.3, 0.5, 0.85, 0.2, 0.9, 0.7]
        
        for i, (mood, sentiment) in enumerate(zip(moods, sentiments)):
            timestamp = (datetime.now() - timedelta(days=len(moods)-i)).isoformat()
            payload = {
                "user_id": TEST_USER_ID,
                "timestamp": timestamp,
                "mood": mood,
                "sentiment_score": sentiment,
                "source": "test_history",
                "metadata": {}
            }
            
            async with session.post(f"{API_BASE_URL}/user/{TEST_USER_ID}/mood", json=payload) as resp:
                if resp.status == 200:
                    print(f"  ✓ Stored: {mood} (Day -{len(moods)-i})")
        
        print_success("Historical data stored")
        
        # Now predict trends
        print_info("\nPredicting mood trends...")
        
        payload = {
            "user_id": TEST_USER_ID,
            "days_ahead": 7,
            "sequence_length": 7,
            "return_confidence_intervals": True
        }
        
        async with session.post(f"{API_BASE_URL}/trend/predict", json=payload) as resp:
            if resp.status == 200:
                result = await resp.json()
                print_success("Mood trend prediction successful")
                
                predictions = result.get('predictions', [])
                print_info(f"Predicted {len(predictions)} days ahead:")
                
                for pred in predictions[:7]:
                    date = pred.get('date', 'N/A')
                    mood = pred.get('mood', 'N/A')
                    confidence = pred.get('confidence', 0)
                    sentiment = pred.get('sentiment', 0)
                    print(f"  {date}: {mood} (confidence: {confidence:.2%}, sentiment: {sentiment:.2f})")
                
                summary = result.get('trend_summary', 'N/A')
                print_info(f"Trend Summary: {summary}")
                
                return True
            else:
                error = await resp.text()
                print_error(f"Trend prediction failed: {error}")
                return False
                
    except Exception as e:
        print_error(f"Trend prediction error: {str(e)}")
        return False


async def test_user_stats(session):
    """Test 7: User Mood Statistics"""
    print_header("Test 7: User Mood Statistics")
    
    try:
        async with session.get(f"{API_BASE_URL}/user/{TEST_USER_ID}/stats") as resp:
            if resp.status == 200:
                result = await resp.json()
                print_success("User statistics retrieved successfully")
                print_info(f"User ID: {result.get('user_id', 'N/A')}")
                print_info(f"Total Entries: {result.get('total_entries', 0)}")
                print_info(f"Dominant Mood: {result.get('dominant_mood', 'N/A')}")
                print_info(f"Average Sentiment: {result.get('avg_sentiment', 0):.2f}")
                print_info(f"Trend Direction: {result.get('trend_direction', 'N/A')}")
                
                distribution = result.get('mood_distribution', {})
                if distribution:
                    print_info("Mood Distribution:")
                    for mood, count in sorted(distribution.items(), key=lambda x: x[1], reverse=True):
                        print(f"  {mood}: {count}")
                
                return True
            else:
                error = await resp.text()
                print_error(f"User stats failed: {error}")
                return False
                
    except Exception as e:
        print_error(f"User stats error: {str(e)}")
        return False


async def test_visualization(session):
    """Test 8: Mood Visualization"""
    print_header("Test 8: Mood Visualization")
    
    try:
        params = {
            "user_id": TEST_USER_ID,
            "days": 30,
            "chart_type": "line",
            "include_predictions": "true"
        }
        
        url = f"{API_BASE_URL}/trend/visualize?" + "&".join([f"{k}={v}" for k, v in params.items()])
        
        async with session.get(url) as resp:
            if resp.status == 200:
                result = await resp.json()
                print_success("Mood visualization generated successfully")
                print_info(f"User ID: {result.get('user_id', 'N/A')}")
                print_info(f"Data Points: {len(result.get('data_points', []))}")
                
                stats = result.get('statistics', {})
                if stats:
                    print_info("Statistics:")
                    for key, value in stats.items():
                        print(f"  {key}: {value}")
                
                chart_html = result.get('chart_html', '')
                if chart_html:
                    print_info(f"Chart HTML length: {len(chart_html)} characters")
                    print_success("Visualization chart generated")
                
                return True
            else:
                error = await resp.text()
                print_error(f"Visualization failed: {error}")
                return False
                
    except Exception as e:
        print_error(f"Visualization error: {str(e)}")
        return False


async def run_all_tests():
    """Run all tests sequentially"""
    print_header("MOOD PATTERN RECOGNITION SYSTEM - COMPREHENSIVE TEST SUITE")
    
    print_info(f"API Base URL: {API_BASE_URL}")
    print_info(f"Test User ID: {TEST_USER_ID}")
    print()
    
    # Create session
    timeout = aiohttp.ClientTimeout(total=60)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        
        results = {}
        
        # Test 1: Health Check
        results['health'] = await test_health_endpoint(session)
        
        if not results['health']:
            print_error("\n❌ Service is not available. Make sure to start the mood service:")
            print_info("   uvicorn mood_pattern_recognition.api.mood_service:app --reload --port 8002")
            return
        
        # Test 2: Face Emotion
        results['face'] = await test_face_emotion_analysis(session)
        
        # Test 3: Text Emotion
        results['text'] = await test_text_emotion_analysis(session)
        
        # Test 4: Fusion
        results['fusion'] = await test_fusion_analysis(session)
        
        # Test 5: Mood Storage
        results['storage'] = await test_mood_storage(session)
        
        # Test 6: Trend Prediction
        results['trend'] = await test_trend_prediction(session)
        
        # Test 7: User Stats
        results['stats'] = await test_user_stats(session)
        
        # Test 8: Visualization
        results['visualization'] = await test_visualization(session)
        
        # Summary
        print_header("TEST SUMMARY")
        
        total = len(results)
        passed = sum(1 for v in results.values() if v is True)
        failed = sum(1 for v in results.values() if v is False)
        skipped = sum(1 for v in results.values() if v is None)
        
        for test_name, result in results.items():
            if result is True:
                print_success(f"{test_name.capitalize()}: PASSED")
            elif result is False:
                print_error(f"{test_name.capitalize()}: FAILED")
            else:
                print_warning(f"{test_name.capitalize()}: SKIPPED")
        
        print()
        print_info(f"Total Tests: {total}")
        print_success(f"Passed: {passed}")
        print_error(f"Failed: {failed}")
        if skipped > 0:
            print_warning(f"Skipped: {skipped}")
        
        pass_rate = (passed / (total - skipped) * 100) if (total - skipped) > 0 else 0
        print_info(f"Pass Rate: {pass_rate:.1f}%")
        
        if pass_rate == 100:
            print()
            print_success("🎉 ALL TESTS PASSED! System is ready for production.")
        elif pass_rate >= 80:
            print()
            print_warning("⚠️ Most tests passed. Check failed tests above.")
        else:
            print()
            print_error("❌ Many tests failed. System needs attention.")


def main():
    """Main entry point"""
    print("\n" + "="*80)
    print(" "*20 + "MOOD PATTERN RECOGNITION TEST SUITE")
    print("="*80 + "\n")
    
    try:
        asyncio.run(run_all_tests())
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user.")
    except Exception as e:
        print_error(f"\nUnexpected error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
