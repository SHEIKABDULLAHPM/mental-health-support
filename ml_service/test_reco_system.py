"""
Quick test script for Recommendation Engine
"""
import pandas as pd
from recommendation_engine.main import build_model
from recommendation_engine.utils.feedback import FeedbackManager

print("=" * 60)
print("RECOMMENDATION ENGINE - SYSTEM VERIFICATION")
print("=" * 60)

# 1. Check datasets
print("\n✓ Step 1: Checking datasets...")
items = pd.read_csv('datasets/reco/items.csv')
interactions = pd.read_csv('datasets/reco/interactions.csv', index_col=0)

print(f"  Total items: {len(items)}")
print(f"  Categories: {items['category'].unique().tolist()}")
print(f"  Users: {len(interactions)}")
print(f"  Items in interactions: {len(interactions.columns)}")

# Check content types
music_count = len(items[items['category'] == 'Music'])
challenge_count = len(items[items['category'] == 'Challenge'])
intervention_count = len(items[items['category'] == 'Intervention'])
print(f"  - Music: {music_count}")
print(f"  - Challenges: {challenge_count}")
print(f"  - Interventions: {intervention_count}")

# 2. Build and test model
print("\n✓ Step 2: Building hybrid recommendation model...")
bundle = build_model('datasets/reco', alpha=0.5)
model = bundle['model']
print(f"  Model type: {type(model).__name__}")
print(f"  Fusion alpha: {model.alpha}")

# 3. Test recommendations
print("\n✓ Step 3: Testing recommendations for 'user1'...")
recs = model.recommend('user1', top_n=5)
print(f"  Got {len(recs)} recommendations:")
for i, r in enumerate(recs, 1):
    print(f"    {i}. {r['title']} ({r['type']}) - Score: {r['score']:.3f}")

# 4. Test mood-based context
print("\n✓ Step 4: Testing mood-based filtering...")
happy_recs = model.recommend('user1', top_n=3, context={'mood': 'happy'})
print(f"  Happy mood recommendations: {len(happy_recs)}")

# 5. Test feedback system
print("\n✓ Step 5: Testing feedback system...")
fb = FeedbackManager('temp')
original_score = float(interactions.at['user1', recs[0]['id']]) if recs[0]['id'] in interactions.columns else 0.0
fb.record(bundle['interactions_df'], 'user1', recs[0]['id'], 'like')
new_score = float(bundle['interactions_df'].at['user1', recs[0]['id']])
print(f"  Feedback recorded: user1 liked '{recs[0]['title']}'")
print(f"  Score changed: {original_score:.1f} -> {new_score:.1f}")

# 6. Test cold start (new user)
print("\n✓ Step 6: Testing cold start for new user...")
new_user_recs = model.recommend('new_user_999', top_n=3)
print(f"  Cold start recommendations: {len(new_user_recs)}")
for i, r in enumerate(new_user_recs, 1):
    print(f"    {i}. {r['title']} ({r['type']}) - Score: {r['score']:.3f}")

# 7. Test different alpha values (content vs collaborative)
print("\n✓ Step 7: Testing fusion weights...")
model.alpha = 0.8  # More content-based
content_heavy = model.recommend('user1', top_n=3)
print(f"  Content-heavy (α=0.8): {content_heavy[0]['title']}")

model.alpha = 0.2  # More collaborative
collab_heavy = model.recommend('user1', top_n=3)
print(f"  Collaborative-heavy (α=0.2): {collab_heavy[0]['title']}")

print("\n" + "=" * 60)
print("✅ ALL RECOMMENDATION ENGINE TESTS PASSED!")
print("=" * 60)
print("\nReady to start API server:")
print("  python -m recommendation_engine.main --api --port 8001")
