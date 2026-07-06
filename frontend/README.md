# AEO.GEO — Frontend (Stage 7)

The web app for **AEO.GEO**, a platform that tracks how a brand appears across AI
answer engines (ChatGPT, Claude, Gemini, Perplexity). Vite + React + TypeScript +
Tailwind, talking to the Django backend over `/api`.

## Design direction — "Signal Spectrum"

The product's job is to show whether the engines *see* you. The whole UI treats the
six scores as **bands of a signal spectrum** that an instrument reads off the engines.

- **Palette** — dark-first "observatory ink" (`#080B12`), an **iris-violet** brand
  accent (`#7C6BFF`), and a harmonized six-hue metric spectrum
  (violet → sky → teal → lime → amber → rose). Deliberately *not* default Tailwind
  gray, nor the acid-green-on-black default. Full light theme included.
- **Type** — `Space Grotesk` (display + big numbers), `Inter` (quiet body),
  `JetBrains Mono` (data labels, eyebrows, JSON — the "instrument" voice). All bundled
  via `@fontsource`, so nothing is fetched at runtime.
- **Signature** — a **spectrum readout hero**: the six scores render as live signal
  bands, echoed by radial-gauge stat cards and a six-series trend chart that all share
  the same hues. The logo mark is those six bars in miniature.

Design intelligence came from the repo's `ui-ux-pro-max` search CLI (`--domain
style/color/typography/ux/chart`) — the dark "Financial/Analytics Dashboard" color
directions, the multi-series **line chart** recommendation (distinct color + hover,
AA), and empty-state / active-nav UX guidance — plus the `frontend-design` skill for
committing boldness to one signature element and keeping everything else quiet.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173  (proxies /api -> http://localhost:8000)
```

- **Dev proxy:** `/api` → `http://localhost:8000` (override with `VITE_PROXY_TARGET`).
  The app always calls same-origin `/api/...`, so there are no CORS concerns in dev.
- **Offline visual dev without the backend:** set `VITE_USE_MOCKS=true` (see
  `.env.example`). An in-memory axios adapter answers every endpoint with realistic,
  deterministic data (the scan mock honors ADR-001 #1: mixed mentioned/sentiment).
  The real code path is unchanged — it always calls axios; mocks only swap the adapter.

```bash
npm run build      # tsc -b (typecheck) + vite production build
npm run preview    # serve the production build
```

## Stack & conventions

- **Routing:** React Router. Guards in `src/routes/guards.tsx` — `ProtectedRoute`
  (session), `RequireOrg` (a selected org), `PublicOnlyRoute` (auth pages).
- **Auth:** JWT `access`+`refresh` in `localStorage`. An axios request interceptor adds
  `Authorization: Bearer <access>`; on `401` it calls `POST /api/auth/refresh/` once
  (shared in-flight) and retries, else clears the session and redirects to `/login`.
- **State:** small React contexts — `AuthContext`, `OrgContext` (current-org
  selection), `ThemeContext`, `ToastContext`.
- **Async 202 flows:** document embedding, scan, crawl and schema generation return
  immediately; the UI polls the relevant status/list endpoint (`usePolling`) and shows
  progress until `done`/`failed`.
- **Design system:** tokens are CSS variables (semantic colors as RGB channels) mapped
  into `tailwind.config.js`. Reusable primitives live in `src/components/ui`.

## Structure

```
src/
  main.tsx  App.tsx  index.css        # entry, router, tokens
  types/api.ts                        # TS models for the whole API contract
  lib/        http.ts api.ts tokens.ts mock.ts metrics.ts format.ts cn.ts
  context/    Auth  Org  Theme  Toast
  hooks/      useApiData usePolling useCountUp
  routes/     guards.tsx
  components/
    ui/       Button Card Input Select Badge StatusBadge Progress Skeleton
              Segmented Modal EmptyState Spinner icons
    layout/   AppShell Sidebar Topbar OrgSwitcher UserMenu ThemeToggle
              PageHeader AuthLayout nav
    brand/    Logo
    dashboard/ SpectrumHero StatCard RadialGauge TrendChart SummaryStrip
    documents/ DocumentUpload
  pages/      Login Register Onboarding Dashboard Documents Website Schema
              Settings NotFound
```

## Pages / flows

- **/login, /register** — email + password (+ full name on register); auto-login after
  register; lands on onboarding.
- **/onboarding** — list orgs, create org (name + industry), add domains
  (url, is_primary). Persists the "current organization" selection.
- **Dashboard (/)** — six gauge score cards, the spectrum hero, a six-series recharts
  trend, summary counts; **Run scan** (`POST /scan/`) and **Generate prompts**
  (`POST /prompts/generate/`) with polling + refresh; empty state ("Run your first
  scan") when `latest === null`.
- **/documents** — import pasted text / website URL / file (pdf·docx·txt); processing
  indicator that polls `/documents/{id}/status/`; library list with status + chunk
  counts; semantic search over `/documents/search/`.
- **/website** — trigger a crawl and list crawl results (meta, robots/sitemap flags,
  links, broken links, performance).
- **/schema** — generate FAQ/Organization/all schema and list markups with validity,
  errors and a JSON-LD preview.
- **/settings** — account, organization, domains, members and invite; theme.

## What the backend must satisfy

- Endpoints exactly as in `docs/api-contract.md`, all under `/api`, DRF trailing
  slashes. Stage-6 routes (`prompts`, `scan`, `dashboard`) must be mounted the same way.
- `GET /organizations/{id}/dashboard/` returns `{ latest, trend, summary }` with the six
  integer scores; `latest` is `null` before the first `ScoreSnapshot`.
- Async endpoints return `202` and expose a pollable status/list:
  documents via `/documents/{id}/status/` (`pending|processing|done|failed`);
  scan/crawl/schema surfaced through their list endpoints.
- `POST /auth/refresh/` accepts `{refresh}` and returns `{access}` (401 when revoked).
- List endpoints may be raw arrays or DRF-paginated `{results:[...]}` — the client
  normalizes both.
```
