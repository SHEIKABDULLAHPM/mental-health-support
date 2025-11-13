# Recommendation Engine (Modular)

This package provides a modular, hybrid recommendation engine for the Mental Health app. It implements:

- Content-based filtering (TF-IDF or Sentence Transformer embeddings)
- Collaborative filtering (LightFM)
- Hybrid fusion of both methods
- Data loading and preprocessing from local CSVs (no database)
- Evaluation utilities (Precision@K, Recall@K, MAP@K, NDCG)
- Lightweight feedback loop (like/dislike/skip) applied incrementally

Directory structure:

- data/: placeholder for processed artifacts (optional)
- models/: base, content-based, collaborative, and hybrid models
- utils/: preprocessing, evaluation, and feedback helpers
- main.py: example script to train, evaluate, and optionally serve an API

Data location (default): `ml_service/datasets/reco/` with files:
- items.csv
- interactions.csv
- ai_mental_wellbeing_dataset.csv (optional)
- music_sentiment_dataset.csv (optional)

Run quick demo (optional):

- Train and evaluate: `python -m recommendation_engine.main --evaluate`
- Start API (FastAPI): `python -m recommendation_engine.main --api`
