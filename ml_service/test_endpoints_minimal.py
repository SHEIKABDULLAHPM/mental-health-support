import json
import time
import requests

BASE = 'http://localhost:5000/api'


def pr(label, data):
    print(f"\n=== {label} ===")
    print(json.dumps(data, indent=2))


def main():
    # Health
    try:
        r = requests.get(f'{BASE}/health', timeout=5)
        pr('health', r.json())
    except Exception as e:
        print('health error:', e)
        return 1

    # Sentiment analyze
    payload = {"text": "I feel a bit anxious today but hopeful after a nice walk.", "top_k": 3}
    r = requests.post(f'{BASE}/sentiment/analyze', json=payload, timeout=5)
    pr('sentiment.analyze', r.json())

    # Sentiment batch
    payload = {"texts": [
        "Today was great! I enjoyed time with friends.",
        "I'm stressed about my exam.",
        "It was okay, nothing special." 
    ]}
    r = requests.post(f'{BASE}/sentiment/analyze-batch', json=payload, timeout=5)
    pr('sentiment.analyze-batch', r.json())

    # Sentiment metrics
    r = requests.get(f'{BASE}/sentiment/metrics', timeout=5)
    pr('sentiment.metrics', r.json())

    # Reco model info
    r = requests.get(f'{BASE}/reco/model-info', timeout=5)
    pr('reco.model-info', r.json())

    # Reco recommend (hybrid)
    payload = {"user_id": "user1", "top_n": 5, "strategy": "hybrid", "context": {"mood": "calm"}}
    r = requests.post(f'{BASE}/reco/recommend', json=payload, timeout=5)
    recs = r.json()
    pr('reco.recommend', recs)

    # Reco feedback on first item if available
    items = (recs.get('data') or {}).get('items') or []
    if items:
        first = items[0]
        payload = {"user_id": "user1", "item_id": first.get('item_id'), "rating": 5.0}
        r = requests.post(f'{BASE}/reco/feedback', json=payload, timeout=5)
        pr('reco.feedback', r.json())

    # Reco metrics
    r = requests.get(f'{BASE}/reco/metrics?k=5&strategy=hybrid', timeout=5)
    pr('reco.metrics', r.json())

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
