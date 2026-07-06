# ADR 001 — Provider-agnostic "mock/live" mode for all external AI dependencies

- **Status:** Accepted
- **Date:** 2026-07-06
- **Deciders:** Ace (product owner), Claude (implementation)

## Context

AEO.GEO depends on external, paid AI services: LLM providers (OpenAI, Anthropic,
Google Gemini, …) for the monitoring scans, and an embeddings provider for the
Knowledge Base vector store (Qdrant).

Two hard constraints shape the design:

1. **Definition of Done requires `docker compose up` to run the *entire* chain**
   (register → upload → process → scan → score → dashboard) as a single command.
2. At MVP build time **no AI API keys are available**, and we do not want tests
   or local demos to depend on paid, rate-limited, non-deterministic third-party
   APIs.

If real providers were the only path, the platform could not be built,
demonstrated, or tested until keys and budget existed — and every test run would
be slow, flaky, and cost money.

## Decision

Every external AI dependency is accessed through an adapter that can run in one
of two modes, selected centrally by `apps.common.mode`:

- **live** — call the real provider SDK/HTTP API.
- **mock** — return a *deterministic but realistic* response computed locally.

Mode is resolved from the `AEO_MODE` setting:

| `AEO_MODE` | Behaviour                                                        |
|------------|------------------------------------------------------------------|
| `auto` (default) | Use a provider live **iff** its API key is configured; otherwise mock. |
| `mock`     | Always mock, ignore keys (used in CI / tests).                   |
| `live`     | Always attempt the real API (missing key surfaces as an error).  |

Adapters never read keys or decide the mode themselves — they call
`mode.is_live("openai")` etc. This keeps the switch in exactly one place.

### Mock quality requirements (non-negotiable)

The mocks must exercise the *real* downstream logic (scoring, dashboards, vector
schema), so they are held to these rules:

1. **Realistic distribution, not a constant.** The mock AI provider derives its
   answer from a hash of the prompt text and must produce, across a prompt set,
   a realistic spread of outcomes:
   - `is_mentioned`: both `true` and `false`.
   - `sentiment`: `positive`, `neutral`, **and** `negative`.
   - `citation_sources`: sometimes empty, sometimes populated.

   This guarantees the dashboard/score logic is fully tested without any real
   AI responses. A mock that always returns `mentioned + positive` is a bug.

2. **Schema-compatible embeddings.** The mock embedding produces a **1536-dim**
   vector (identical to OpenAI `text-embedding-3-small`), deterministically
   derived from a hash of the input text. This guarantees the Qdrant collection
   schema created in mock mode stays valid when we later switch to a real
   embedding provider — no re-indexing surprise.

## Consequences

**Positive**
- The full product is buildable, demoable, and testable today, key-free.
- Tests are deterministic, fast, free, and offline (`AEO_MODE=mock` in CI).
- Switching a provider to live is a one-line config change (add its key); no
  code changes, and the Qdrant schema already matches.
- The mode boundary documents exactly where real money/latency enters the system.

**Negative / risks**
- Mock realism can drift from real provider behaviour; mocks must be revisited
  when providers are first wired live.
- A forgotten `AEO_MODE=live` without keys fails loudly — intentional, but must
  be understood by operators.

## Related

- `apps/common/mode.py` — the single source of truth for mode resolution.
- Stage 4 (Knowledge Base) implements the embedding adapter.
- Stage 6 (AI Monitoring) implements the AI gateway + mock provider.
