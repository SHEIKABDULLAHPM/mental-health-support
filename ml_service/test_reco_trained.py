"""Quick test: train and sample recommendations on merged dataset."""
import os, sys
base = r"e:\mini project\MENTAL_HEALTH (3)\MENTAL_HEALTH\ml_service"
sys.path.insert(0, base)

from recommendation_engine.utils.preprocessing import load_reco_datasets
from recommendation_engine.models.hybrid import HybridRecommender
import json

DATA_DIR = os.path.join(base, 'datasets', 'reco')
items_df, interactions_df = load_reco_datasets(DATA_DIR)

print("="*60)
print("TRAINING HYBRID RECOMMENDATION ENGINE")
print("="*60)
print(f"Dataset: {interactions_df.shape[0]} users × {interactions_df.shape[1]} items")
print(f"Non-zero interactions: {(interactions_df.values > 0).sum()}")

model = HybridRecommender(alpha=0.5)
model.load_data(items_df, interactions_df)
print("\nTraining content-based and collaborative models...")
model.train()
print("✅ Training complete!")

# Test recommendations for several users
print("\n" + "="*60)
print("SAMPLE RECOMMENDATIONS")
print("="*60)

test_users = list(interactions_df.index)[:5]
for uid in test_users:
    recs = model.recommend(uid, top_n=5)
    print(f"\n📌 User: {uid}")
    for i, r in enumerate(recs[:5], 1):
        title_short = r['title'][:45] + '...' if len(r['title']) > 45 else r['title']
        print(f"  {i}. [{r['type']}] {title_short} (score: {r['score']:.3f})")

print("\n" + "="*60)
print("✅ Recommendation engine ready!")
print("="*60)
