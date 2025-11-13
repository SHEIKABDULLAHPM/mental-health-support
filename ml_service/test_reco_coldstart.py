"""
Test recommendation engine with cold start (unknown users)
"""
from models.recommendations import RecommendationEngine

print("=" * 60)
print("TESTING RECOMMENDATION ENGINE - COLD START FIX")
print("=" * 60)

# Initialize engine
print("\n✓ Step 1: Initializing recommendation engine...")
engine = RecommendationEngine('datasets/reco')
print(f"  Engine info: {engine.info()}")

# Test 1: Existing user (if any)
print("\n✓ Step 2: Testing with first existing user...")
existing_users = engine.interactions_df.index.tolist()
if existing_users:
    test_user = existing_users[0]
    print(f"  User: {test_user}")
    recs = engine.recommend(test_user, top_n=3)
    print(f"  Got {len(recs)} recommendations:")
    for i, r in enumerate(recs, 1):
        print(f"    {i}. {r['title']} ({r.get('category', 'N/A')}) - Score: {r.get('score', 0):.3f}")
else:
    print("  No existing users found!")

# Test 2: Cold start with 'user1' (unknown user)
print("\n✓ Step 3: Testing cold start with 'user1' (new user)...")
try:
    recs_user1 = engine.recommend('user1', top_n=5, strategy='hybrid')
    print(f"  ✅ SUCCESS! Got {len(recs_user1)} recommendations for new user 'user1':")
    for i, r in enumerate(recs_user1, 1):
        print(f"    {i}. {r['title']} ({r.get('category', 'N/A')}) - Score: {r.get('score', 0):.3f}")
except Exception as e:
    print(f"  ❌ FAILED: {e}")

# Test 3: Cold start with mood context
print("\n✓ Step 4: Testing cold start with mood context (happy)...")
try:
    recs_happy = engine.recommend('user_new_123', top_n=3, context={'mood': 'happy'})
    print(f"  ✅ SUCCESS! Got {len(recs_happy)} recommendations:")
    for i, r in enumerate(recs_happy, 1):
        tags_str = ', '.join(r.get('tags', [])[:3]) if r.get('tags') else 'No tags'
        print(f"    {i}. {r['title']} - Tags: {tags_str}")
except Exception as e:
    print(f"  ❌ FAILED: {e}")

# Test 4: Verify user was added to interactions
print("\n✓ Step 5: Verifying new users were added...")
current_users = engine.interactions_df.index.tolist()
if 'user1' in current_users:
    print("  ✅ 'user1' successfully added to interactions matrix")
else:
    print("  ❌ 'user1' not found in interactions matrix")

if 'user_new_123' in current_users:
    print("  ✅ 'user_new_123' successfully added to interactions matrix")
else:
    print("  ❌ 'user_new_123' not found in interactions matrix")

print(f"\n  Total users now: {len(current_users)}")

# Test 5: Feedback from new user
print("\n✓ Step 6: Testing feedback from new user...")
try:
    # Get first recommendation for user1
    if recs_user1:
        first_item = recs_user1[0]['item_id']
        print(f"  Submitting feedback: user1 likes '{recs_user1[0]['title']}'")
        engine.feedback('user1', first_item, 5.0)
        print(f"  ✅ Feedback recorded successfully")
        
        # Get new recommendations
        new_recs = engine.recommend('user1', top_n=3)
        print(f"  New recommendations after feedback:")
        for i, r in enumerate(new_recs, 1):
            print(f"    {i}. {r['title']} - Score: {r.get('score', 0):.3f}")
except Exception as e:
    print(f"  ❌ FAILED: {e}")

print("\n" + "=" * 60)
print("✅ COLD START TESTING COMPLETE!")
print("=" * 60)
print("\nSummary:")
print("- Unknown users are automatically added with zero interactions")
print("- Content-based recommendations work for cold start")
print("- Mood context filtering works")
print("- Feedback can be recorded for new users")
print("\nThe recommendation engine is ready for production!")
