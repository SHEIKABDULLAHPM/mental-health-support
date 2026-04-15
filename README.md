# Mental Health Support System

Production-oriented multi-service platform:
- React frontend in project
- Node.js and Express backend in backend
- Flask ML service in ml_service
- Flask LLM gateway service in llm_service
- MongoDB for persistence
- Ollama for model runtime

## Target Architecture

Flow:
React Frontend -> Node Backend -> Flask ML Service -> Flask LLM Service -> MongoDB

Notes:
- Only ML and LLM Python services are retained.
- Node backend is the single API gateway for frontend traffic.
- Legacy mood microservice and duplicated Python chatbot stacks are removed.

## Service Layout

- project: frontend (Vite)
- backend: API/auth/gateway
- ml_service: sentiment, mood analytics, recommendations, compatibility ML endpoints
- llm_service: /api/chat bridge to Ollama
- docker-compose.yml: orchestration

## Local Development

Prerequisites:
- Python 3.10+
- Node.js 18+
- Docker Desktop (recommended)

Install dependencies:

```powershell
cd project
npm install
cd ..\backend
npm install
cd ..\ml_service
py -3 -m pip install -r requirements.txt
cd ..\llm_service
py -3 -m pip install -r requirements.txt
```

## Docker Deployment

1) Prepare environment:

```bash
cp .env.example .env
```

2) Start the full stack (frontend, backend, ml-service, llm-service, ollama, mongodb):

```bash
docker compose up --build
```

3) Optional first-time Ollama model pull (if not already present in volume):

```bash
docker exec -it mentalhealth-ollama ollama pull llama3.1
```

4) Stop stack:

```bash
docker compose down
```

5) Stop stack and clear persistent volumes:

```bash
docker compose down -v
```

Default exposed ports:
- frontend: 80
- backend: 3000
- ml-service: 5000
- llm-service: 11434
- mongodb: 27017

## API Quick Check

Backend:
- GET /api/v1/health

ML Service:
- GET /api/health
- POST /api/mood-pattern/analyze/text
- POST /api/mood-pattern/analyze/fusion

LLM Service:
- GET /health
- POST /api/chat

## Validation Commands

```powershell
py -3 -m py_compile ml_service\app.py llm_service\main.py
docker compose config
```

Optional container smoke check:

```bash
docker compose ps
```

## Repository Hygiene

Do not commit generated folders:
- ml_service/.venv
- project/node_modules
- project/dist
