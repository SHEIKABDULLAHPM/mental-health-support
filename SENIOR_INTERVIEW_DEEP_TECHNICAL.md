# Senior Interview Deep Technical Guide

## 1. System Intent and Non-Functional Goals

This platform is designed as a mental wellness application that balances:

- low-latency interaction for user trust
- safety-aware AI behavior
- auditable persistence for emotional history and progress tracking
- modular evolution of ML and LLM components

Primary non-functional priorities:

- reliability: graceful fallbacks when upstream ML/LLM fails
- safety: risk-signal extraction and moderated system prompts
- maintainability: separation of concerns by service boundary
- extensibility: independent upgrade paths for sentiment, recommendations, and LLM models

## 2. Layered Architecture

### 2.1 Frontend Layer

Frontend is a React + Vite SPA with route-level lazy loading and context-based state boundaries.

Core files:

- app shell and route guards: project/src/App.jsx
- auth/session state: project/src/contexts/UserContext.jsx
- theme state: project/src/contexts/ThemeContext.jsx
- audio playback state: project/src/contexts/AudioContext.jsx
- HTTP client abstractions: project/src/services/api.js

Why this design:

- fast startup and chunked loading by route
- clean separation of transient UI state and backend source-of-truth
- centralized API contract handling in one layer

### 2.2 Backend Layer

Backend is Node.js + Express, acting as orchestration and policy boundary.

Core file:

- route composition and middleware chain: backend/src/app.js

Responsibilities:

- JWT and session-backed access enforcement
- business APIs for wellness domains
- conversation and analysis persistence in MongoDB
- compatibility proxying of legacy ML endpoints
- realtime push via Socket.IO

### 2.3 ML Layer

ML service is a Flask analytics stack, not a monolithic model.

Core files:

- ML app setup and route registry: ml_service/app.py
- mood processing and trends: ml_service/app/mood.py
- recommendation APIs: ml_service/app/recommendations.py
- advanced sentiment API: ml_service/app/sentiment_advanced.py
- multi-model sentiment engine: ml_service/services/sentiment_service.py

### 2.4 LLM Layer

LLM service is a Flask adapter over Ollama for generation and streaming.

Core file:

- LLM request/stream bridge: llm_service/main.py

Responsibilities:

- mode-specific system prompt shaping
- response generation and NDJSON token streaming
- lightweight risk keyword scoring

## 3. End-to-End Request Mechanics

## 3.1 Authentication Path

1. Frontend sends login/register request.
2. Backend validates credentials and returns access token.
3. Session is tracked server-side for token lifecycle control.
4. Frontend stores token and enables protected routes.

Security implication:

- token possession alone is not sufficient if session is revoked.

## 3.2 Chat Path with Stream and Fallback

Primary flow:

1. Chat message submitted from frontend.
2. Backend resolves or creates conversation context.
3. Backend opens stream to LLM service.
4. LLM emits NDJSON tokens; backend forwards to client.
5. Backend persists final assistant output + analysis artifact.
6. Socket.IO event is emitted for synchronized UX.

Fallback flow:

- if stream path fails, backend uses non-stream chat path and still returns deterministic final payload.

Key implementation location:

- backend/src/controllers/chatController.js

Engineering value:

- protects UX continuity under partial LLM outages.

## 3.3 Mood and Journal Intelligence Path

1. User submits mood score and journal content.
2. Backend stores journal entry and forwards analysis where needed.
3. ML mood service appends score to event store.
4. Trend endpoints compute rolling metrics and forecast baseline.

Location:

- journal model: backend/src/models/JournalEntry.js
- mood logic: ml_service/app/mood.py

## 3.4 Recommendation Path

1. Frontend requests recommendations with context such as mood.
2. Backend passes request to recommendation APIs.
3. ML recommender returns hybrid-scored items or safe fallback items.
4. User feedback actions are logged for tuning loops.

Location:

- recommendation route logic: ml_service/app/recommendations.py

## 4. Data Model Deep Dive

Core backend entities:

- user identity and preferences: backend/src/models/User.js
- session lifecycle and revocation: backend/src/models/Session.js
- conversational history: backend/src/models/Conversation.js
- model inference artifacts: backend/src/models/AnalysisResult.js
- multimodal emotion records: backend/src/models/EmotionAnalysis.js
- recommendation ecosystem: backend/src/models/RecommendationCatalog.js, backend/src/models/RecommendationFeedback.js

Modeling rationale:

- separate operational chat history from analytical artifacts to preserve query flexibility
- keep recommendation feedback append-only to support future offline learning
- maintain modality-specific emotion records for longitudinal analysis

## 5. ML Technical Details

## 5.1 Sentiment Stack

Available models:

- VADER: lexical/rule-based, low latency
- Classical: TF-IDF + Logistic Regression
- BiLSTM: contextual sequence model
- Ensemble: weighted fusion over available predictors

Ensemble decision:

$$
\hat{y}=\arg\max_c \sum_{m \in M} w_m \cdot \mathbf{1}(y_m=c)
$$

Final confidence:

$$
\text{confidence}_{final}=\sum_{m \in M} w_m \cdot \text{confidence}_m
$$

Where weights are normalized over active models.

Why this is useful:

- improves robustness across short chat text and long-form journal text
- degrades gracefully if one heavy model is unavailable

## 5.2 Mood Trend Computation

Mood entries are timestamped and processed into:

- raw time series
- short-window rolling mean
- long-window rolling mean
- trend label from baseline-to-recent delta
- simple baseline forecast

Normalization:

$$
\text{score\_norm}=\frac{\text{score}+10}{20}
$$

## 5.3 Recommendation Engine Behavior

Recommendation service:

- trains/loads hybrid recommender from local datasets
- supports strategy and alpha blending
- provides fallback catalog when model/data unavailable
- stores user feedback as jsonl events for iterative improvement

Operationally important:

- fallback path keeps user flow alive even during model issues

## 6. LLM Engineering Details

LLM service patterns:

- system-prompt specialization by mode
- bounded conversation history window
- temperature and token controls
- non-stream and stream endpoints

Risk control:

- lexical keyword risk classification for quick triage signaling

Why separate service is a strong decision:

- independent scaling and model swap lifecycle
- reduced coupling with backend release cadence
- easier observability isolation for generation workloads

## 7. Reliability, Resilience, and Failure Modes

Current resilience mechanisms:

- stream-to-nonstream fallback for chat
- recommendation fallback item set
- proxy error normalization for upstream failures

Failure modes to discuss in interview:

- ML endpoint returns degraded/unavailable
- LLM stream interruption mid-response
- stale token with revoked server session
- partial write scenarios if analysis save fails after chat generation

Hardening opportunities:

- idempotency keys for critical write endpoints
- circuit breaker around ML/LLM dependencies
- retry policy with bounded exponential backoff
- outbox/event queue for realtime notifications

## 8. Security Posture

Implemented controls:

- JWT-based auth and session checks
- CORS allowlist strategy
- middleware-based request context and error shaping

Recommended senior-level improvements:

- rate limits per identity and IP on auth and chat routes
- stricter payload schema validation at boundaries
- secret rotation policy and short token TTL with refresh mechanism
- audit log partitioning and tamper-evident storage for critical events

## 9. Performance and Scale Considerations

Hot paths:

- chat stream fanout
- recommendation generation under concurrent load
- sentiment analysis for burst traffic

Optimization levers:

- cache immutable recommendation catalog slices
- preload or warm ML model artifacts at startup
- use connection pooling and index review for MongoDB query plans
- horizontal split of backend and LLM workers by workload profile

## 10. Observability and Operational Maturity

What to measure:

- p50/p95 latency by endpoint
- chat stream completion rate
- fallback activation rate
- model availability and timeout frequencies
- auth failures by category

What to log with correlation:

- request id propagation frontend to backend to ML/LLM
- structured logs for model choice, fallback reason, and upstream status

## 11. Known Issues and Current State

Known practical items:

- recommendation GET path has runtime issue in ml_service/app/recommendations.py
- voice emotion endpoint currently not enabled in ml_service/app.py

Strong interview framing:

- core product loop is functional
- known issues are isolated and diagnosable
- architecture already includes fallback concepts to reduce user impact

## 12. Senior-Round Closing Summary

This system demonstrates service-oriented AI integration with explicit orchestration boundaries, multi-model analytics, resilient chat execution paths, and persistent user-centric wellness workflows. The strongest engineering choices are decoupled intelligence services, persistence of both interaction and inference artifacts, and graceful degradation paths that maintain user trust under dependency instability.
