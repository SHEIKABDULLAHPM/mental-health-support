# Production Backend Redesign Plan

## 1. Target System Architecture

## 1.1 Design Principles

- Frontend is render-only and calls backend APIs for all feature data.
- Node backend is the only persistence authority.
- MongoDB is the single source of truth.
- ML and LLM services are stateless execution services.
- All APIs are versioned under /api/v1.
- All access is authenticated and role-scoped.

## 1.2 Runtime Flow

1. React frontend sends authenticated requests to Node API gateway.
2. Node API validates token, role, tenant scope, and user ownership.
3. Node reads and writes MongoDB only.
4. For inference, Node calls ML or LLM services with request payload and context snapshot.
5. ML or LLM returns inference output only.
6. Node stores inference outputs, analytics events, and derived recommendations in MongoDB.
7. Node returns standardized response envelopes to frontend.

## 1.3 Service Boundaries

- Frontend service:
  - UI only
  - no hardcoded feature data
  - no business persistence logic
- Node service:
  - RBAC
  - orchestration
  - persistence
  - recommendation assembly
  - analytics aggregation
- ML service:
  - sentiment, emotion, recommendation scoring, feature extraction
  - no database writes
  - no file or sqlite persistence
- LLM service:
  - chat generation and summarization
  - no persistence

## 2. API Standardization Plan

## 2.1 Versioning and Namespaces

All routes migrate to /api/v1 only.

- /api/v1/auth
- /api/v1/users
- /api/v1/preferences
- /api/v1/mood
- /api/v1/journal
- /api/v1/reflections
- /api/v1/future-letters
- /api/v1/challenges
- /api/v1/positivity
- /api/v1/recommendations
- /api/v1/chat
- /api/v1/analytics
- /api/v1/admin

Legacy paths to deprecate and remove:
- /api/chat/*
- /api/llm/*
- non-versioned /api/mood, /api/reco, /api/sentiment, /api/games endpoints exposed to frontend

## 2.2 Standard Response Envelope

Successful response:
- success: true
- data: payload object or array
- meta: pagination, timing, version, requestId

Error response:
- success: false
- error: code, message, details, requestId

## 2.3 Chat Health Contract

Canonical endpoint:
- GET /api/v1/chat/health

Health payload fields:
- success
- data.status
- data.llm.available
- data.ml.available
- data.latencyMs
- data.version

## 2.4 RBAC Model

Roles:
- user
- moderator
- admin

Enforcement:
- route-level role guards
- ownership checks on all user resources
- admin-only analytics and moderation operations

## 3. MongoDB Schema Design

## 3.1 Core Identity and Security Collections

1. users
- _id
- email unique
- username unique
- passwordHash
- role
- isActive
- profile
- createdAt, updatedAt

2. sessions
- _id
- userId ref users
- tokenId unique
- userAgent
- ipAddress
- expiresAt
- revokedAt
- createdAt, updatedAt

3. userPreferences
- _id
- userId unique ref users
- interests array
- goals array
- activityPreferences array
- language
- theme
- notificationSettings
- onboardingVersion
- createdAt, updatedAt

Indexes:
- userPreferences userId unique

## 3.2 Wellness Domain Collections

4. moodEntries
- _id
- userId ref users
- score
- moodLabel
- activityContext
- journalText
- source manual or inferred
- sentimentSnapshot
- emotionSnapshot
- createdAt, updatedAt

Indexes:
- userId + createdAt desc

5. journalEntries
- _id
- userId ref users
- moodTag
- content
- sentiment
- emotion
- editedAt
- createdAt, updatedAt

Indexes:
- userId + createdAt desc

6. reflections
- _id
- userId ref users
- text
- category
- sentiment
- reactions object
- anonymous
- createdAt, updatedAt

Indexes:
- category + createdAt desc
- createdAt desc

7. futureLetters
- _id
- userId ref users
- title
- content
- deliveryDate
- status scheduled or delivered
- deliveredAt
- createdAt, updatedAt

Indexes:
- userId + deliveryDate
- status + deliveryDate

## 3.3 Challenges and Positivity Collections

8. challengeCatalog
- _id
- slug unique
- title
- description
- difficulty
- points
- active
- createdAt, updatedAt

9. userChallengeProgress
- _id
- userId ref users
- challengeId ref challengeCatalog
- progress
- target
- state active completed archived
- startedAt
- completedAt
- createdAt, updatedAt

Indexes:
- userId + state
- userId + challengeId unique

10. positivityContent
- _id
- contentType quote affirmation prompt
- text
- author
- tags
- language
- active
- createdAt, updatedAt

11. positivityInteractions
- _id
- userId ref users
- contentId ref positivityContent
- action like favorite share copy view
- context
- createdAt

Indexes:
- userId + createdAt desc
- userId + contentId
- action + createdAt

## 3.4 Recommendation and Analytics Collections

12. recommendationCatalog
- _id
- itemType book music activity challenge breathing positivity
- title
- description
- tags
- language
- metadata
- active
- createdAt, updatedAt

13. recommendationSnapshots
- _id
- userId ref users
- context mood sentiment energy timeOfDay
- candidates array
- rankedItems array with score breakdown
- modelInfo
- createdAt

Indexes:
- userId + createdAt desc

14. recommendationFeedback
- _id
- userId ref users
- itemId ref recommendationCatalog
- rating
- action clicked completed dismissed
- context
- createdAt

Indexes:
- userId + itemId + createdAt

15. conversations
- _id
- userId ref users
- mode
- title
- status
- messages array or separate message collection
- latestAnalysisId
- createdAt, updatedAt

16. conversationAnalyses
- _id
- userId ref users
- conversationId ref conversations
- sentiment
- emotion
- risk
- llmMeta
- createdAt

17. analyticsEvents
- _id
- userId ref users nullable for system
- eventType
- entityType
- entityId
- payload
- requestId
- createdAt

Indexes:
- userId + createdAt desc
- eventType + createdAt
- entityType + entityId

## 4. Recommendation System Design

## 4.1 Input Signals

- user profile preferences from onboarding
- behavioral history from analyticsEvents and recommendationFeedback
- mood trend from moodEntries
- sentiment and emotion history from journal and conversation analyses
- recent engagement recency and completion rates

## 4.2 Hybrid Ranking Pipeline

1. Candidate generation
- content-based candidate set from userPreferences and tags
- collaborative candidate set from similar users by behavior vectors

2. Context weighting
- mood-aware boost or penalty
- time-based and recency weighting
- novelty and diversity constraints

3. Optional ML reranker
- stateless scoring service called by Node
- Node persists final ranked list and score rationale

4. Explainability
- return score components in API response

## 5. Migration Plan (Current to Target)

## Phase 0: Stabilization

- Freeze legacy API expansion.
- Add requestId middleware and centralized error handler.
- Introduce /api/v1/chat/health.

Exit criteria:
- all health checks and errors use standardized envelope.

## Phase 1: Data Authority Shift

- Remove sqlite and file persistence from ML service.
- Move mood, recommendation, and games writes to Node + Mongo collections.
- Convert ML endpoints to pure inference contracts.

Exit criteria:
- no non-Node persistence remains.

## Phase 2: Frontend De-hardcoding

- Replace static datasets in:
  - Recommendations
  - Challenges
  - Positivity Drops
  - Nature Sounds
- Add backend catalog endpoints and pagination.

Exit criteria:
- no static business content arrays in frontend feature pages.

## Phase 3: Feature Completion

- Add journal update and delete APIs.
- Add challenge progress APIs.
- Add positivity interaction APIs.
- Add recommendation catalog CRUD and delivery APIs.

Exit criteria:
- all missing integrations from current audit are implemented.

## Phase 4: Security and Isolation Hardening

- enforce owner filters in every user resource query.
- add role guards and admin route audit logs.
- add automated tests for cross-user access denial.

Exit criteria:
- zero unauthorized cross-user access in integration tests.

## Phase 5: Performance and Scale Readiness

- index tuning and query profiling.
- Redis cache for hot recommendation and catalog reads.
- async event pipeline for analytics aggregation.

Exit criteria:
- p95 API latency and throughput targets met.

## 6. Risk Analysis and Mitigation

1. Risk: Data loss or inconsistency during storage migration
- Mitigation:
  - dual-write period with reconciliation jobs
  - checksums and count-based verification
  - rollback scripts

2. Risk: Breaking frontend during API path consolidation
- Mitigation:
  - compatibility adapter routes with deprecation headers
  - contract tests and staged rollout

3. Risk: ML service latency increases after stateless conversion
- Mitigation:
  - request batching
  - timeout budgets and circuit breakers
  - cached inference for repeated low-variance requests

4. Risk: Recommendation quality drop after pipeline rewrite
- Mitigation:
  - offline evaluation before cutover
  - shadow mode ranking comparison
  - gradual traffic ramp with KPI guardrails

5. Risk: RBAC or isolation regression
- Mitigation:
  - policy unit tests
  - mandatory query filters by userId
  - security regression suite in CI

## 7. Performance and Scalability Roadmap

## 7.1 Data Layer

- Add compound indexes for timeline and per-user reads.
- Add TTL indexes for ephemeral telemetry where applicable.
- Partition large event streams by time windows.

## 7.2 API Layer

- Introduce API gateway rate limits and burst controls.
- Use idempotency keys for write endpoints.
- Add cursor-based pagination for feeds and catalogs.

## 7.3 Compute Layer

- Scale Node horizontally behind load balancer.
- Stateless ML and LLM autoscale by queue depth and latency.
- Introduce worker queue for heavy non-blocking tasks.

## 7.4 Observability

- distributed tracing across frontend, Node, ML, LLM
- structured logs with requestId and userId hash
- SLO dashboards:
  - p95 latency
  - error rate
  - recommendation click-through
  - chat completion success

## 8. Immediate Fix Backlog (Execution Order)

1. Implement /api/v1/chat/health and update frontend consumer.
2. Replace voice and face emotion endpoints with Node-owned orchestrated APIs:
- POST /api/v1/emotion/voice
- POST /api/v1/emotion/face
3. Remove direct frontend dependency on non-versioned ML paths.
4. Add backend endpoints and Mongo persistence for challenges and positivity interactions.
5. Add journal update and delete backend APIs and wire UI.
6. Replace remaining hardcoded UI analytics cards with database-backed metrics endpoints.

## 9. Definition of Done for Production Readiness

- Frontend contains no static business datasets for dynamic features.
- All feature data is fetched from /api/v1 endpoints.
- Node is the only writer to MongoDB.
- ML and LLM services are stateless and persistence-free.
- RBAC and user isolation are enforced and tested.
- Unified analytics and recommendation pipelines run from Mongo-backed data.
- Contract, integration, and load tests pass release thresholds.
