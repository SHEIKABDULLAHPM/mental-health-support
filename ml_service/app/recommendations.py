from flask import Blueprint, request, jsonify
import os
import json
import time
from datetime import datetime
from models.recommendations import RecommendationEngine, evaluate_at_k


reco_bp = Blueprint('reco', __name__, url_prefix='/api/reco')


# Initialize engine (singleton for app lifetime)
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'datasets', 'reco')
_ENGINE = None
_LAST_EVAL = None
_LAST_EVAL_RESULT = None


def get_engine():
    global _ENGINE
    if _ENGINE is None:
        _ENGINE = RecommendationEngine(DATA_DIR)
    return _ENGINE


@reco_bp.route('/model-info', methods=['GET'])
def model_info():
    try:
        eng = get_engine()
        return jsonify({'status': 'success', 'data': eng.info()}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


@reco_bp.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({'status': 'error', 'error': 'user_id is required'}), 400
        top_n = int(data.get('top_n', 5))
        strategy = (data.get('strategy') or 'hybrid').lower()
        alpha = float(data.get('alpha', 0.5))
        context = data.get('context') or {}

        eng = get_engine()
        items = eng.recommend(user_id, top_n=top_n, strategy=strategy, alpha=alpha, context=context)
        return jsonify({'status': 'success', 'data': {'user_id': user_id, 'items': items, 'strategy': strategy}}), 200
    except KeyError as e:
        # Should not happen anymore with cold start handling
        return jsonify({'status': 'error', 'error': f'User not found: {str(e)}'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


@reco_bp.route('/recommendations', methods=['GET'])
def recommend_querystring():
    """Optional GET endpoint: /api/reco/recommendations?user_id=...&top_n=5
    Returns a simplified JSON matching the requested schema.
    """
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        top_n = int(request.args.get('top_n', 5))
        alpha = float(request.args.get('alpha', 0.5))
        strategy = (request.args.get('strategy') or 'hybrid').lower()
        
        # Get context from query params (mood, etc.)
        context = {}
        if request.args.get('mood'):
            context['mood'] = request.args.get('mood')
        
        eng = get_engine()
        items = eng.recommend(user_id, top_n=top_n, strategy=strategy, alpha=alpha, context=context)
        
        # Map to requested format
        def _map(item):
            return {
                'id': item.get('item_id'),
                'title': item.get('title'),
                'type': item.get('category', 'Item'),
                'tags': item.get('tags', []),
                'score': item.get('score', 0.0)
            }
        return jsonify({'user_id': str(user_id), 'recommendations': [_map(it) for it in items]}), 200
    except KeyError as e:
        # Should not happen anymore with cold start handling
        return jsonify({'error': f'User not found: {str(e)}'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reco_bp.route('/recommend', methods=['GET'])
def recommend_get_alias():
    """Alias for GET recommendations to mirror /recommendations but allow /recommend too.
    Query params: user_id, top_n, alpha, strategy
    """
    return recommend_querystring()


@reco_bp.route('/health', methods=['GET'])
def reco_health():
    """Simple health endpoint for the recommendation blueprint."""
    try:
        eng = get_engine()
        info = eng.info()
        return jsonify({'status': 'success', 'engine': info}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


@reco_bp.route('/feedback', methods=['POST'])
def feedback():
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        item_id = data.get('item_id')
        rating = float(data.get('rating', 0))
        if not user_id or not item_id:
            return jsonify({'status': 'error', 'error': 'user_id and item_id are required'}), 400
        if rating <= 0:
            return jsonify({'status': 'error', 'error': 'rating must be > 0'}), 400

        eng = get_engine()
        eng.feedback(user_id, item_id, rating)

        # Log feedback
        os.makedirs(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'temp'), exist_ok=True)
        log_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'temp', 'reco_feedback.jsonl')
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps({
                'ts': datetime.utcnow().isoformat(),
                'user_id': user_id,
                'item_id': item_id,
                'rating': rating,
                'context': data.get('context')
            }) + "\n")

        return jsonify({'status': 'success', 'message': 'feedback recorded'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


@reco_bp.route('/metrics', methods=['GET'])
def metrics():
    try:
        global _LAST_EVAL, _LAST_EVAL_RESULT
        k = int(request.args.get('k', 5))
        strategy = (request.args.get('strategy') or 'hybrid').lower()
        # Cache for 60 seconds
        now = time.time()
        if _LAST_EVAL_RESULT is None or _LAST_EVAL is None or (now - _LAST_EVAL) > 60:
            eng = get_engine()
            _LAST_EVAL_RESULT = evaluate_at_k(eng, k=k, strategy=strategy)
            _LAST_EVAL = now
        return jsonify({'status': 'success', 'data': {'k': k, 'strategy': strategy, **_LAST_EVAL_RESULT}}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500
