"""
Test script to verify recommendation engine indexing fix
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.recommendations import RecommendationEngine

def test_recommendation_engine():
    """Test recommendation engine with the indexing fix"""
    
    print("="*60)
    print("🧪 Testing Recommendation Engine Fix")
    print("="*60)
    
    data_dir = os.path.join(os.path.dirname(__file__), 'datasets', 'reco')
    
    try:
        # Initialize engine
        print("\n1. Initializing RecommendationEngine...")
        engine = RecommendationEngine(data_dir)
        print("   ✅ Engine initialized successfully")
        
        # Get model info
        info = engine.info()
        print(f"\n2. Model Info:")
        print(f"   - Users: {info['users']}")
        print(f"   - Items: {info['items']}")
        print(f"   - Interactions: {info['interactions']}")
        print(f"   - Feature Dimension: {info['feature_dim']}")
        
        # Test recommendation for different users
        test_users = ['user1', 'user2', 'user3']
        strategies = ['hybrid', 'cf', 'cb']
        
        print(f"\n3. Testing Recommendations:")
        for user_id in test_users[:1]:  # Test first user
            if user_id in engine.interactions_df.index:
                for strategy in strategies:
                    try:
                        print(f"\n   Testing {user_id} with strategy '{strategy}':")
                        
                        # Test basic recommendation
                        recs = engine.recommend(
                            user_id=user_id,
                            top_n=3,
                            strategy=strategy,
                            alpha=0.5,
                            context={'mood': 'happy'}
                        )
                        
                        print(f"   ✅ Strategy '{strategy}' - {len(recs)} recommendations:")
                        for i, rec in enumerate(recs, 1):
                            print(f"      {i}. {rec.get('title', rec.get('item_id', 'Unknown'))} (score: {rec['score']:.4f})")
                        
                    except Exception as e:
                        print(f"   ❌ Strategy '{strategy}' failed: {str(e)}")
                        import traceback
                        traceback.print_exc()
                        return False
            else:
                print(f"   ⚠️  User '{user_id}' not found in interactions")
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED - Recommendation engine working!")
        print("="*60)
        return True
        
    except FileNotFoundError as e:
        print(f"   ❌ Dataset not found: {str(e)}")
        print(f"   📁 Looking in: {data_dir}")
        print(f"   💡 Make sure items.csv and interactions.csv exist")
        return False
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_recommendation_engine()
    sys.exit(0 if success else 1)
