from __future__ import annotations
import argparse
import os
from typing import Dict

from .utils.preprocessing import load_reco_datasets
from .utils.evaluation import evaluate_holdout_at_k
from .utils.feedback import FeedbackManager
from .models.hybrid import HybridRecommender


DEFAULT_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'datasets', 'reco')


def build_model(data_dir: str, alpha: float = 0.5) -> Dict:
    items_df, interactions_df = load_reco_datasets(data_dir)
    model = HybridRecommender(alpha=alpha)
    model.load_data(items_df, interactions_df)
    model.train()
    return {"model": model, "items_df": items_df, "interactions_df": interactions_df}


def create_app(bundle: Dict):
    # Lazy import FastAPI only when serving API
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="Recommendation API", version="1.0")
    fb = FeedbackManager(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'temp'))

    @app.get("/recommend")
    def recommend(user_id: str, top_n: int = 5, alpha: float = 0.5):
        try:
            bundle["model"].alpha = float(max(0.0, min(1.0, alpha)))
            recs = bundle["model"].recommend(user_id, top_n=top_n)
            # Shape response as specified
            return JSONResponse({
                "user_id": str(user_id),
                "recommendations": [
                    {"id": r.get("id"), "title": r.get("title"), "type": r.get("type"), "score": r.get("score", 0.0)}
                    for r in recs
                ]
            })
        except Exception as e:
            return JSONResponse({"error": str(e)}, status_code=400)

    @app.post("/feedback")
    def feedback(user_id: str, item_id: str, action: str = 'like'):
        try:
            fb.record(bundle["interactions_df"], user_id, item_id, action)  # updates interactions
            bundle["model"].load_data(bundle["items_df"], bundle["interactions_df"])  # reload updated data
            bundle["model"].train()  # simple retrain (small data)
            return JSONResponse({"status": "success"})
        except Exception as e:
            return JSONResponse({"status": "error", "error": str(e)}, status_code=400)

    return app


def main():
    parser = argparse.ArgumentParser(description="Hybrid Recommendation Engine")
    parser.add_argument("--data-dir", default=DEFAULT_DATA_DIR)
    parser.add_argument("--alpha", type=float, default=0.5)
    parser.add_argument("--evaluate", action="store_true")
    parser.add_argument("--api", action="store_true")
    parser.add_argument("--port", type=int, default=8001)
    args = parser.parse_args()

    bundle = build_model(args.data_dir, alpha=args.alpha)

    if args.evaluate:
        metrics = evaluate_holdout_at_k(bundle["model"], bundle["interactions_df"], k=5)
        print("Evaluation:", metrics)

    if args.api:
        # Lazy import uvicorn only when serving API
        import uvicorn
        app = create_app(bundle)
        uvicorn.run(app, host="0.0.0.0", port=args.port)


if __name__ == "__main__":
    main()
