# AEO.GEO

**Track and improve how your company appears in AI answer engines** (ChatGPT,
Claude, Gemini, Perplexity, …). People increasingly ask an AI instead of
Googling — AEO.GEO makes sure your business is found, described accurately, and
cited as a trustworthy source in those AI answers.

Multi-tenant SaaS. Django + DRF + Celery + PostgreSQL + Redis + Qdrant backend,
React + TypeScript + Tailwind frontend. **Runs end-to-end with no AI API keys**
thanks to a built-in mock mode (see [`docs/adr/001-mock-mode.md`](docs/adr/001-mock-mode.md)).

---

## Quick start — one command

```bash
cp .env.example .env        # optional; with no keys it runs in mock mode
docker compose up --build
```

That brings up the whole product:

| Service | Port | What it is |
|---|---|---|
| **frontend** | http://localhost:5173 | React app (Vite), proxies `/api` → backend |
| **backend** | http://localhost:8000 | Django + DRF API |
| celery-worker | — | async scans, crawls, embeddings, schema |
| celery-beat | — | nightly score refresh |
| postgres / redis / qdrant | internal | database / cache+broker / vector DB |

Open **http://localhost:5173**, register, create an organization, upload a
document, run a scan, and watch the six scores appear on the Dashboard.

Health check: `curl http://localhost:8000/api/health/` →
`{"status":"ok","mode":"mock", ...}`.

> Infra ports (Postgres/Redis) are intentionally not published to the host to
> avoid clashes. Use `docker compose exec postgres psql -U aeo aeo` to inspect.

## Ready-made accounts (for review)

One command creates a superuser and a **pre-populated demo account** (its org
already has a document, crawl, schema, prompts, a scan and computed scores — so
the dashboard is full on first login):

```bash
docker compose exec backend python manage.py seed_demo
```

| Account | Login | Password | Use |
|---|---|---|---|
| **Superuser** | `admin@aeo.geo` | `AeoAdmin2026!` | Django admin → http://localhost:8000/admin/ |
| **Demo user** | `demo@aeo.geo` | `Signals2026!` | The app → http://localhost:5173 (full dashboard) |

The command is idempotent — safe to re-run. Change these passwords before any
real deployment.

## Mock vs live mode

Everything works with **zero API keys** (mock mode): scans return a deterministic
but realistic distribution, embeddings are 1536-dim (OpenAI-compatible), schema
is generated from your real content. Add a key to `.env` (e.g. `OPENAI_API_KEY=…`
or `ANTHROPIC_API_KEY=…`) and that provider automatically switches to live — no
code change. See the ADR for the full rationale and the mock realism guarantees.

## The core chain (Definition of Done)

```
register → create org → add domain → upload document (chunk+embed → Qdrant)
        → crawl site → generate schema.org JSON-LD
        → generate prompt library → scan across AI providers
        → compute 6 scores → Dashboard
```

Six scores (0–100, transparent formulas in `apps/dashboard/scoring.py`):
**AI Visibility · GEO · AEO · SEO · Trust · Citation**.

## Local development (without Docker)

**Backend** (needs Python 3.12; Postgres/Redis/Qdrant optional — falls back to
SQLite + localhost):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
python manage.py test apps        # 66 tests, fully offline
```

**Frontend** (needs Node 22) — with hot reload:

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173, /api → :8000
npm run build                      # typecheck + production build
```

## Project layout

```
backend/
  config/            settings, urls, celery (+ beat schedule)
  apps/
    common/          mock/live mode switch, health, base models
    accounts/        email User, JWT auth (Redis-revocable refresh), Role enum
    organizations/   Organization, Membership, Domain + IsOrgMember/HasRole
    website_manager/ crawl (title/meta/canonical/robots/sitemap/broken links)
    knowledge_base/  import → chunk → embed(1536) → Qdrant + semantic search
    ai_optimization/ schema.org JSON-LD (FAQ/Organization) grounded in KB
    ai_monitoring/   provider-agnostic gateway, Prompt library, Scan
    dashboard/       ScoreSnapshot, 6-score formulas, dashboard endpoint
    billing/         Subscription models (MVP: structure only)
frontend/            React + TS + Tailwind ("Signal Spectrum" design)
docs/
  adr/               architecture decision records
  api-contract.md    the full API contract
docker-compose.yml   one-command full stack
```

## Multi-tenancy & security

Shared-schema multi-tenancy: every tenant-owned row has an `organization` FK,
isolation is enforced in the ORM/queryset layer, and org identity is resolved
from the URL + membership — never trusted from the request body. Roles are
per-membership (one user can hold different roles in different orgs). No secrets
in code — everything is read from environment variables.

## API

See [`docs/api-contract.md`](docs/api-contract.md) for every endpoint, request/
response shape, the dashboard payload, and the score formulas. All
organization-scoped routes are nested under
`/api/organizations/{id}/…` and require `Authorization: Bearer <access>`.

## Tests

```bash
cd backend && python manage.py test apps     # 66 tests, offline & deterministic
cd frontend && npm run build                 # typecheck + build
```

The suite never touches external services: mock AI providers, in-memory Qdrant,
in-memory Celery broker, LocMem cache.
