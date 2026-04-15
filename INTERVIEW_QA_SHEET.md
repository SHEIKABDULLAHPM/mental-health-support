# Interview Q&A Sheet (Senior Round)

## How to Use

- Keep each answer between 30 and 90 seconds.
- Start with architecture intent, then implementation evidence, then trade-off.
- End with one improvement idea to show ownership mindset.

## Q1. What problem does your system solve?
Best answer:
This platform addresses mental wellness support with a practical loop: emotional capture, personalized guidance, and progress tracking. Users can log mood and journals, receive recommendations, and interact with a therapeutic chatbot. Technically, I separated frontend UX, backend orchestration, ML analytics, and LLM generation to make the system safer, maintainable, and scalable.

## Q2. Why did you split Backend, ML, and LLM into separate services?
Best answer:
I separated concerns intentionally. Backend enforces auth, contracts, and persistence. ML handles deterministic analytics like sentiment and mood trends. LLM handles probabilistic generation and streaming. This improves deployability, allows independent scaling, and avoids coupling model runtime changes to core API releases.

## Q3. Explain your chat pipeline end-to-end.
Best answer:
The frontend sends a chat message to backend. Backend resolves conversation context, then calls the LLM stream endpoint. Tokens are forwarded to the client in NDJSON. On completion, backend stores message plus analysis artifacts and emits a realtime socket event. If streaming fails, backend falls back to a non-stream path, preserving UX continuity.

## Q4. How do you ensure chat reliability when LLM is unstable?
Best answer:
I implemented stream fallback logic in chat orchestration. If upstream stream fails, backend retries through a standard non-stream path and returns a normalized final payload. This keeps user-facing behavior stable even when stream transport is disrupted.

## Q5. What sentiment models are used and why multiple models?
Best answer:
I use a model portfolio: VADER for very low-latency lexical analysis, classical TF-IDF plus logistic regression for robust baseline classification, BiLSTM for contextual sequence understanding, and an ensemble layer for weighted fusion. Multiple models reduce bias from any single approach and improve robustness across short chat and long journal text.

## Q6. Explain the ensemble math briefly.
Best answer:
Each model votes for a label with a weight. Final label is the class with maximum weighted vote, and final confidence is weighted sum of model confidences. Weights are normalized over currently available models. This allows graceful degradation if one model is unavailable.

## Q7. How is mood trend computed?
Best answer:
Mood entries are stored as timestamped scores. The service computes rolling means across short and long windows, derives a delta from baseline to recent behavior, and labels trend as improving, stable, or declining. It also provides a baseline short-term forecast from recent average to support visualization.

## Q8. How does recommendation logic work?
Best answer:
A hybrid recommender is loaded from local datasets and can blend strategy with alpha weighting. If the model or datasets are unavailable, the API returns safe fallback recommendations so user flow is uninterrupted. Feedback events are recorded for future tuning.

## Q9. What is stored in MongoDB and why?
Best answer:
I store users and sessions for identity and token lifecycle, conversations for dialogue history, analysis artifacts for explainability and audits, journal entries for reflective history, emotion records for multimodal trends, and recommendation feedback for personalization loops. This schema supports both product features and future analytics.

## Q10. How do you secure the platform?
Best answer:
Backend is the security boundary. I use JWT with session validation, route protection, controlled CORS, and centralized error handling. Sensitive actions require authenticated context, and session revocation is supported so token abuse can be constrained.

## Q11. Why not call ML/LLM directly from frontend?
Best answer:
Direct calls would leak implementation details and weaken security/control. Backend mediation gives me policy enforcement, consistent contracts, observability, fallback behavior, and controlled rollout of model changes without breaking clients.

## Q12. What are your most important trade-offs?
Best answer:
Service separation increases deployment complexity but gives strong maintainability and scaling control. Fallback design may return less rich responses during outages, but it preserves user trust and continuity, which is critical in wellness use-cases.

## Q13. What are known limitations today?
Best answer:
Two known items: recommendation GET path has a runtime issue in ml_service/app/recommendations.py, and voice emotion endpoint is currently not enabled in ml_service/app.py. Core flows such as auth, chat, mood, and journal are working, and the issues are isolated.

## Q14. If you had two more weeks, what would you improve first?
Best answer:
First, fix recommendation GET runtime issue and enable complete voice path. Second, add stronger boundary validation and rate limiting for security hardening. Third, implement deeper observability with request correlation across backend, ML, and LLM to reduce mean-time-to-diagnose.

## Q15. How would you scale this to 10x traffic?
Best answer:
I would independently scale stateless backend and LLM workers, keep ML model artifacts warmed, add queue-based buffering for expensive operations, tune Mongo indexes for high-cardinality queries, and introduce caching for stable recommendation catalog segments. I would also monitor p95 latency and fallback rates as first-class SLO signals.

## Q16. How do you handle safety in a mental health chatbot?
Best answer:
Safety is layered: constrained therapeutic system prompts, risk keyword extraction, backend-controlled orchestration, and persistence of analysis metadata for auditing and iterative safety tuning. The design avoids direct model exposure from frontend and enables central policy control.

## Q17. How do you defend your architecture to a senior panel?
Best answer:
I would say this architecture intentionally isolates deterministic analytics from probabilistic generation, keeps backend as contract and security boundary, and implements graceful degradation paths. It is designed for trust-sensitive user experiences where continuity, auditability, and controllable evolution matter more than raw model novelty.

## Q18. What metrics prove the system is healthy?
Best answer:
I track endpoint latency, chat stream completion rate, fallback activation rate, auth failure categories, and upstream ML/LLM availability. For product quality, I track recommendation interaction signals and mood trend engagement over time.

## Q19. What was your hardest engineering challenge?
Best answer:
The hardest part was making AI-driven features production-safe despite dependency volatility. I solved this with normalization layers, fallback pathways, and persistence of both interaction and inference artifacts so failures are diagnosable and user experience remains stable.

## Q20. Give a concise technical closing statement.
Best answer:
This project is a modular AI-enabled wellness platform where backend orchestration, ML analytics, and LLM generation are decoupled but coordinated. The system is built for reliability and safety, with practical fallback mechanisms, auditable persistence, and clear paths for scale and iterative model improvement.

## Rapid Fire One-Liners

- Why React + Vite: fast SPA iteration and route-level splitting.
- Why MongoDB: flexible schema for evolving wellness and inference artifacts.
- Why Flask for ML/LLM adapters: lightweight service wrappers around model workflows.
- Why Socket.IO: realtime UX for conversational updates.
- Why fallbacks: maintain trust under AI dependency failures.

## Interview Delivery Template

Use this 4-part template for most answers:

1. design intent
2. implementation detail in this project
3. trade-off acknowledged
4. next improvement

Example:
I chose service separation for maintainability, implemented backend orchestration with ML and LLM adapters, accepted extra deployment complexity, and next I would add circuit breakers and stronger observability correlation.
