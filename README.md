# AEO.GEO

AI visibility platform — track and improve how companies appear in AI answer
engines (ChatGPT, Claude, Gemini, Perplexity, …).

> **Status:** MVP in progress, built stage by stage. This README is expanded in
> Stage 8. For the architecture rationale see [`docs/adr/`](docs/adr/).

## Quick start (local, Docker)

```bash
cp .env.example .env      # optional — runs in mock mode with no keys
docker compose up --build
```

Then check the backend is alive:

```bash
curl http://localhost:8000/api/health/
# {"status":"ok","service":"aeo-geo-backend","mode":"mock","providers":{...}}
```

Services started: **postgres**, **redis**, **qdrant**, **backend** (Django),
**celery-worker**, **celery-beat**.

## Mock vs live mode

The whole platform runs with **no AI API keys** (mock mode) so it is buildable
and testable offline. Add a key to `.env` (e.g. `OPENAI_API_KEY=...`) to switch
that provider to live. See [`docs/adr/001-mock-mode.md`](docs/adr/001-mock-mode.md).

## Layout

```
backend/          Django + DRF + Celery
  config/         settings, urls, celery
  apps/
    common/       mode switch, health, shared base models
    accounts/         (Stage 2)  user, JWT auth, RBAC
    organizations/    (Stage 2)  organization, membership, domain
    website_manager/  (Stage 3)  crawl, sitemap, technical SEO
    knowledge_base/   (Stage 4)  import, chunking, embedding, Qdrant
    ai_optimization/  (Stage 5)  schema.org / JSON-LD generation
    ai_monitoring/    (Stage 6)  prompt library, AI provider scans
    dashboard/        (Stage 6)  score aggregation
    billing/          (models only in MVP)
docs/adr/         architecture decision records
docker-compose.yml
```

## Tech stack

Django · DRF · PostgreSQL · Redis · Celery · Qdrant · Docker Compose.
Frontend (React + TypeScript + Tailwind) is added in Stage 7.
