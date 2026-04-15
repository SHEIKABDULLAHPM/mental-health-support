# Backend Integration Documentation

## 1. System Architecture Overview

This project currently runs as a multi-service system behind frontend Nginx:

- Frontend SPA: React/Vite served by Nginx.
- Node backend API: authentication, users, wellness CRUD, chat orchestration, admin, Socket.IO.
- ML service (Flask): sentiment, mood trends/forecast, recommendations, games, mood-pattern endpoints.
- LLM service (Flask): Ollama bridge for chat generation.
- MongoDB: persistent data for Node backend domain models.
- Local file/SQLite persistence in ML service: mood/recommendation/game-specific storage.

Service wiring is defined in [docker-compose.yml](docker-compose.yml) and request proxy behavior is defined in [project/nginx.conf](project/nginx.conf).

## 2. Runtime Routing and Ownership

### 2.1 Frontend base URLs

From [project/src/services/api.js](project/src/services/api.js):

- API base: `VITE_API_URL` (default `/api`)
- Auth base: `VITE_AUTH_API_URL` (default `/auth-api`)

### 2.2 Nginx routing

From [project/nginx.conf](project/nginx.conf):

- `/api/*` -> `backend:3000/api/*`
- `/auth-api/*` -> `backend:3000/*`
- `/auth/*` -> `backend:3000/auth/*`
- `/socket.io/*` -> `backend:3000/socket.io/*`

### 2.3 Node backend route groups

From [backend/src/app.js](backend/src/app.js):

- `/api/v1/health`
- `/api/v1/auth`
- `/api/v1/chat`
- `/api/v1/admin`
- `/api/v1/users`
- `/api/v1/wellness`
- `/auth` compatibility auth routes
- `/api/*` catch-all proxied to ML service via [backend/src/routes/proxyRoutes.js](backend/src/routes/proxyRoutes.js)

Important behavior:
- Node owns `/api/v1/*`.
- ML owns most non-`/v1` APIs under `/api/*` through backend proxy forwarding.

## 3. Frontend Page to API Mapping

Route definitions are in [project/src/App.jsx](project/src/App.jsx).

### 3.1 Fully integrated pages

1. Home (`/`):
- Uses recommendations + mood trend APIs.
- Frontend calls in [project/src/pages/Home.jsx](project/src/pages/Home.jsx):
  - `recoAPI.recommend()` -> `GET /api/reco/recommendations`
  - `api.mood.trends()` -> `GET /api/mood/trends`
  - `api.mood.forecast()` -> `GET /api/mood/forecast`

2. Mood Check-in (`/mood-checkin`):
- Uses mood submit/trends/forecast + sentiment + face emotion detector.
- Calls in [project/src/pages/MoodCheckin.jsx](project/src/pages/MoodCheckin.jsx):
  - `api.mood.submit()` -> `POST /api/mood/submit`
  - `api.mood.trends()` -> `GET /api/mood/trends`
  - `api.mood.forecast()` -> `GET /api/mood/forecast`
  - `api.sentiment.analyzeText()` -> `POST /api/sentiment/v2/analyze`
- Face detector component in [project/src/components/FaceEmotionDetector.jsx](project/src/components/FaceEmotionDetector.jsx):
  - `POST /api/detect-face-emotion`

3. Journal (`/journal`):
- Uses wellness journal + sentiment + mood analytics.
- Calls in [project/src/pages/Journal.jsx](project/src/pages/Journal.jsx):
  - `journalAPI.getEntries()` -> `GET /api/v1/wellness/journal`
  - `journalAPI.addEntry()` -> `POST /api/v1/wellness/journal`
  - `sentimentAPI.analyzeText()` -> `POST /api/sentiment/v2/analyze`
  - `api.mood.trends()` / `api.mood.forecast()`

4. Reflection Wall (`/reflection-wall`):
- Uses reflection CRUD/reactions + sentiment (single and batch).
- Calls in [project/src/pages/ReflectionWall.jsx](project/src/pages/ReflectionWall.jsx):
  - `reflectionsAPI.getReflections()` -> `GET /api/v1/wellness/reflections`
  - `reflectionsAPI.addReflection()` -> `POST /api/v1/wellness/reflections`
  - `reflectionsAPI.addReaction()` -> `POST /api/v1/wellness/reflections/:id/reactions`
  - `sentimentAPI.analyzeText()` -> `POST /api/sentiment/v2/analyze`
  - `sentimentAPI.analyzeBatch()` -> `POST /api/sentiment/v2/analyze/batch`

5. Future Letters (`/future-letters`):
- Uses wellness future letter endpoints.
- Calls in [project/src/pages/FutureLetters.jsx](project/src/pages/FutureLetters.jsx):
  - `futureLettersAPI.getLetters()` -> `GET /api/v1/wellness/future-letters`
  - `futureLettersAPI.createLetter()` -> `POST /api/v1/wellness/future-letters`

6. Chatbot (`/chat`):
- Uses Node chat gateway + sentiment annotation.
- Calls in [project/src/pages/Chatbot.jsx](project/src/pages/Chatbot.jsx):
  - `chatbotAPI.startConversation()` -> `POST /api/v1/chat/send`
  - `chatbotAPI.sendMessage()` -> `POST /api/v1/chat/send` (fallback to `/api/v1/chat/message` alias)
  - `chatbotAPI.clearConversation()` -> `DELETE /api/v1/chat/conversations/:id`
  - `chatbotAPI.checkHealth()` -> `GET /api/health` (ML health)
  - `chatbotAPI.getChatInfo()` -> `GET /api/v1/health`
  - `sentimentAPI.analyzeText()` -> `POST /api/sentiment/v2/analyze`

7. Voice Emotion (`/voice-emotion`):
- Uses voice emotion APIs through component.
- Calls in [project/src/components/VoiceEmotion/VoiceEmotionDetector.jsx](project/src/components/VoiceEmotion/VoiceEmotionDetector.jsx):
  - `voiceEmotionAPI.checkHealth()` -> `GET /api/health`
  - `voiceEmotionAPI.detectEmotion()` -> `POST /api/detect-emotion`

8. Activities (`/activities`) - games section:
- Uses games persistence APIs in ML service.
- Calls in [project/src/pages/Activities.jsx](project/src/pages/Activities.jsx):
  - `POST /api/games/session/start`
  - `POST /api/games/session/stop`
  - `POST /api/games/event`
  - `POST /api/games/preferences`
  - `GET /api/games/state`
  - `POST /api/games/bubble/score`
  - `POST /api/games/zen/save`

### 3.2 Partially integrated pages (mixed backend + local/static)

1. Recommendations (`/recommendations`):
- Backend: `recoAPI.recommend()` in [project/src/pages/Recommendations.jsx](project/src/pages/Recommendations.jsx).
- Local/static: curated books/music arrays are hardcoded in the page.

2. Challenges (`/challenges`):
- Backend: one recommendation call for suggestion in [project/src/pages/Challenges.jsx](project/src/pages/Challenges.jsx).
- Local/static: challenge progress/achievement logic is client-only.

3. Nature Sounds (`/nature-sounds`):
- Backend: one recommendation call in [project/src/pages/NatureSounds.jsx](project/src/pages/NatureSounds.jsx).
- Local/static: playback data managed in frontend context and local assets.

4. Positivity Drops (`/positivity`):
- Backend: one recommendation call in [project/src/pages/PositivityDrops.jsx](project/src/pages/PositivityDrops.jsx).
- Local/static: quotes/favorites are client-side.

### 3.3 Not backend-linked pages (auth/session excepted)

1. Landing (`/welcome`) in [project/src/pages/Landing.jsx](project/src/pages/Landing.jsx): presentation only.
2. Onboarding (`/onboarding`) in [project/src/pages/Onboarding.jsx](project/src/pages/Onboarding.jsx): local/session-driven.

## 4. Component-level Integration Summary

1. Auth UI:
- [project/src/components/AuthForms.jsx](project/src/components/AuthForms.jsx)
- Uses `authAPI.login/register/logout` endpoints under `/auth-api/auth/*`.

2. User session bootstrap:
- [project/src/contexts/UserContext.jsx](project/src/contexts/UserContext.jsx)
- Uses `api.user.me()` (`GET /api/v1/users/me`) for token/profile validation.

3. Face emotion detection:
- [project/src/components/FaceEmotionDetector.jsx](project/src/components/FaceEmotionDetector.jsx)
- Uses `POST /api/detect-face-emotion`.

4. Voice emotion detection:
- [project/src/components/VoiceEmotion/VoiceEmotionDetector.jsx](project/src/components/VoiceEmotion/VoiceEmotionDetector.jsx)
- Uses `GET /api/health` and `POST /api/detect-emotion`.

5. Backend health hook:
- [project/src/hooks/useBackendStatus.js](project/src/hooks/useBackendStatus.js)
- Polls `GET /api/health` every 30 seconds.

## 5. Backend to Service to Storage Data Flow

## 5.1 Auth and user management flow

1. Frontend calls `/auth-api/auth/login|register|logout`.
2. Nginx maps `/auth-api/*` to Node backend root.
3. Node auth controller in [backend/src/controllers/authController.js](backend/src/controllers/authController.js) validates credentials and issues JWT.
4. Session token is persisted in Mongo `Session` model ([backend/src/models/Session.js](backend/src/models/Session.js)).
5. `requireAuth` middleware validates JWT + live session + active user in [backend/src/middleware/auth.js](backend/src/middleware/auth.js).

Storage:
- Mongo collections: users, sessions.

## 5.2 Wellness CRUD flow

1. Frontend calls `/api/v1/wellness/*` APIs.
2. Node wellness controller in [backend/src/controllers/wellnessController.js](backend/src/controllers/wellnessController.js) executes Mongo CRUD.
3. Socket events are emitted for journal/reflection/future-letter actions.

Storage:
- Mongo collections: journalentries, reflections, futureletters.

## 5.3 Chat flow (frontend -> backend -> llm/ml)

1. Frontend sends `/api/v1/chat/send` via `chatbotAPI`.
2. Node chat controller [backend/src/controllers/chatController.js](backend/src/controllers/chatController.js):
   - appends user message to `Conversation` in Mongo.
   - calls `sendChatToMl()` in [backend/src/services/mlClient.js](backend/src/services/mlClient.js).
3. `sendChatToMl()` tries:
   - primary: LLM service `POST /api/chat`.
   - fallback: ML service `POST /api/chat/send`.
4. Node normalizes response and persists `AnalysisResult` and conversation updates.
5. Node emits socket event `chat:message`.

Storage:
- Mongo collections: conversations, analysisresults, reportlogs.

## 5.4 Mood/sentiment/recommendation flow

1. Frontend calls `/api/mood/*`, `/api/reco/*`, `/api/sentiment/*`.
2. Nginx forwards to Node `/api/*`.
3. Node catch-all proxy forwards to ML service `/api/*`.
4. ML blueprints handle requests:
   - mood: [ml_service/app/mood.py](ml_service/app/mood.py)
   - reco: [ml_service/app/recommendations.py](ml_service/app/recommendations.py)
   - sentiment v1/v2: [ml_service/app/sentiment.py](ml_service/app/sentiment.py), [ml_service/app/sentiment_advanced.py](ml_service/app/sentiment_advanced.py)

Storage:
- Mood/reco datasets and generated artifacts in ML file storage.
- Games in ML SQLite DB [ml_service/app/games.py](ml_service/app/games.py).

## 6. Integration Gaps and Risks

### 6.1 Critical

1. Voice emotion endpoint is not implemented in current ML build.
- ML `POST /api/detect-emotion` returns 501 in [ml_service/app.py](ml_service/app.py).
- Voice emotion UI therefore appears offline/degraded.

2. Face emotion endpoint currently unavailable in current ML build.
- `POST /api/detect-face-emotion` returns 503 in [ml_service/app.py](ml_service/app.py).
- Affects face-driven mood/recommendation UX.

### 6.2 High

1. Chatbot LLM health route mismatch.
- Frontend checks `/api/llm/health` in [project/src/services/api.js](project/src/services/api.js).
- ML/Node route ownership does not expose this exact endpoint reliably.
- Chatbot falls back to generic health behavior.

2. Split persistence model (Mongo + ML local storage/SQLite) creates reporting inconsistency.
- Wellness/chat/auth are in Mongo.
- Mood/reco/games are in ML local data stores.
- Unified analytics and backup strategy are currently fragmented.

### 6.3 Medium

1. Multiple API methods are legacy/local-only and not backend-backed:
- `moodAPI.getMoods/addMood/updateMood`
- `journalAPI.updateEntry/deleteEntry`
- `challengesAPI`, `activitiesAPI`, `recommendationsAPI` legacy stubs
- These remain in [project/src/services/api.js](project/src/services/api.js) and can mislead future development.

2. Several pages mix static mock content with backend data.
- Challenges, Positivity, Nature Sounds, Recommendations are not fully server-driven.

3. Old Nginx exact routes (`/api/chat/send`, `/api/llm/chat/send`) remain while primary integration uses `/api/v1/chat/*`.
- See [project/nginx.conf](project/nginx.conf).

## 7. Missing or Incomplete Integrations (Frontend perspective)

1. No backend persistence for challenge progress and achievement lifecycle.
2. No backend persistence for positivity favorites/quote interaction history.
3. No backend-driven content catalog for curated books/music.
4. No backend API for journal entry update/delete despite API methods existing in client.
5. Mood/health insights shown in some widgets are still hardcoded display values.

## 8. Recommended Integration Roadmap

1. Enforce Node as the only persistence authority:
- Move mood, recommendation, and games writes to Node-managed MongoDB collections.
- Remove all SQLite and file-based persistence from ML paths.

2. Standardize frontend contracts to versioned APIs only:
- Migrate all frontend consumers to `/api/v1/*` routes.
- Deprecate and remove legacy non-versioned frontend integrations.

3. Stabilize emotion and chat contracts:
- Add Node-owned emotion APIs such as `/api/v1/emotion/voice` and `/api/v1/emotion/face` that orchestrate stateless ML inference.
- Add canonical chat health endpoint `/api/v1/chat/health` and align UI health checks.

4. Remove legacy client-only API stubs in [project/src/services/api.js](project/src/services/api.js):
- Replace local-only methods with backend-backed endpoints.
- Eliminate static mock data usage in dynamic features.

5. Complete missing backend modules:
- Challenge progress tracking with user ownership enforcement.
- Positivity interactions and engagement tracking.
- Journal update and delete APIs.
- Dynamic recommendation catalog APIs.

6. Apply strict security and isolation controls:
- Route-level RBAC and per-user ownership checks for all user-scoped resources.
- Shared standardized response and centralized error handling.

For the full target-state architecture, schema design, phased migration, risks, and scaling strategy, see [project/PRODUCTION_BACKEND_REDESIGN_PLAN.md](project/PRODUCTION_BACKEND_REDESIGN_PLAN.md).

## 9. Quick Endpoint Ownership Matrix

Node-owned endpoints:
- `/api/v1/auth/*`, `/api/v1/users/*`, `/api/v1/wellness/*`, `/api/v1/chat/*`, `/api/v1/admin/*`, `/api/v1/health`, `/auth/*`

ML-owned endpoints (through Node `/api/*` proxy):
- `/api/health`, `/api/sentiment/*`, `/api/sentiment/v2/*`, `/api/mood/*`, `/api/reco/*`, `/api/games/*`, `/api/mood-pattern/*`, `/api/detect-emotion`, `/api/detect-face-emotion`

LLM-owned endpoint (called by Node service layer):
- `POST /api/chat` on llm-service

---

Document generated from current implementation state across:
- Frontend services/pages/components
- Node backend routes/controllers/services/models
- ML and LLM service route definitions
- Nginx and Docker composition wiring
