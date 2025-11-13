"""
Quick API test for recommendation endpoints using the trained model.
Start Flask app first: python app.py
Then run this script to verify /api/reco/recommendations
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint."""
    print("Testing /api/reco/health...")
    resp = requests.get(f"{BASE_URL}/api/reco/health")
    print(f"  Status: {resp.status_code}")
    if resp.ok:
        data = resp.json()
        print(f"  Engine info: {data}")
    else:
        print(f"  Error: {resp.text}")
    return resp.ok

def test_recommendations_get(user_id="S001", top_n=5):
    """Test GET /api/reco/recommendations."""
    print(f"\nTesting GET /api/reco/recommendations?user_id={user_id}&top_n={top_n}...")
    resp = requests.get(f"{BASE_URL}/api/reco/recommendations", params={"user_id": user_id, "top_n": top_n})
    print(f"  Status: {resp.status_code}")
    if resp.ok:
        data = resp.json()
        print(f"  User: {data.get('user_id')}")
        print(f"  Recommendations ({len(data.get('recommendations', []))}):")
        for i, rec in enumerate(data.get('recommendations', [])[:5], 1):
            print(f"    {i}. {rec.get('title', 'N/A')} ({rec.get('type', 'N/A')})")
    else:
        print(f"  Error: {resp.text}")
    return resp.ok

def test_recommendations_post(user_id="S002", top_n=5, strategy="hybrid", alpha=0.5):
    """Test POST /api/reco/recommend."""
    print(f"\nTesting POST /api/reco/recommend...")
    payload = {"user_id": user_id, "top_n": top_n, "strategy": strategy, "alpha": alpha}
    resp = requests.post(f"{BASE_URL}/api/reco/recommend", json=payload)
    print(f"  Status: {resp.status_code}")
    if resp.ok:
        data = resp.json()
        items = data.get('data', {}).get('items', [])
        print(f"  User: {data.get('data', {}).get('user_id')}")
        print(f"  Strategy: {data.get('data', {}).get('strategy')}")
        print(f"  Recommendations ({len(items)}):")
        for i, item in enumerate(items[:5], 1):
            print(f"    {i}. {item.get('title', 'N/A')} (score: {item.get('score', 0):.3f})")
    else:
        print(f"  Error: {resp.text}")
    return resp.ok

if __name__ == "__main__":
    print("="*60)
    print("RECOMMENDATION API TESTS")
    print("="*60)
    print("\n⚠️  Make sure Flask is running: python app.py\n")
    
    try:
        test_health()
        test_recommendations_get("S001", 5)
        test_recommendations_get("U1", 5)  # Music user
        test_recommendations_post("S003", 5)
        
        print("\n" + "="*60)
        print("✅ All API tests completed!")
        print("="*60)
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection failed. Is Flask running on port 5000?")
        print("   Start it with: python app.py")
