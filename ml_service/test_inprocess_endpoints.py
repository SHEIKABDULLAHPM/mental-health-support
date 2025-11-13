import json
from app import app as flask_app

def pr(label, data):
    print(f"\n=== {label} ===")
    print(json.dumps(data, indent=2))


def main():
    with flask_app.test_client() as client:
        # health
        rv = client.get('/api/health')
        pr('health', rv.get_json())

        # sentiment analyze
        rv = client.post('/api/sentiment/analyze', json={
            'text': 'I am feeling calm and optimistic after meditation.',
            'top_k': 3
        })
        pr('sentiment.analyze', rv.get_json())

        # reco model info
        rv = client.get('/api/reco/model-info')
        pr('reco.model-info', rv.get_json())

        # reco recommend
        rv = client.post('/api/reco/recommend', json={
            'user_id': 'user1', 'top_n': 3, 'strategy': 'hybrid', 'context': {'mood': 'calm'}
        })
        data = rv.get_json()
        pr('reco.recommend', data)

        # feedback if item present
        items = (data.get('data') or {}).get('items') or []
        if items:
            first = items[0]
            rv = client.post('/api/reco/feedback', json={
                'user_id': 'user1', 'item_id': first.get('item_id'), 'rating': 4.0
            })
            pr('reco.feedback', rv.get_json())

        # reco metrics
        rv = client.get('/api/reco/metrics?k=5&strategy=hybrid')
        pr('reco.metrics', rv.get_json())


if __name__ == '__main__':
    main()
