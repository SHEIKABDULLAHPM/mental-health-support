import json
import requests

BASE = 'http://localhost:5000/api/mood'


def pr(label, data):
    print(f"\n=== {label} ===")
    print(json.dumps(data, indent=2))


def main():
    # Submit some entries for user1
    examples = [
        {"score": 2, "activity": "work", "journal": "tired"},
        {"score": 3, "activity": "walk", "journal": "felt better"},
        {"score": 4, "activity": "friends", "journal": "good time"},
    ]
    for e in examples:
        r = requests.post(f'{BASE}/submit', json={"user_id": "user1", **e}, timeout=5)
        pr('submit', r.json())

    r = requests.get(f'{BASE}/entries', params={"user_id": "user1"}, timeout=5)
    pr('entries', r.json())

    trends_url = BASE.replace('/mood', '') + '/mood/trends'
    r = requests.get(trends_url, params={"user_id": "user1"}, timeout=5)
    pr('trends', r.json())

    r = requests.get(f'{BASE}/forecast', params={"user_id": "user1", "days_ahead": 5}, timeout=5)
    pr('forecast', r.json())


if __name__ == '__main__':
    main()
