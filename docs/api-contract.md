# AEO.GEO API Contract (MVP)

Base URL (dev): `http://localhost:8000`. All `/api/organizations/{id}/...` routes
require `Authorization: Bearer <access>` and org membership. JSON unless noted.

## Auth  (`apps.accounts`, built)
| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register/` | `{email, password, full_name?}` | `201 {id,email,full_name}` |
| POST | `/api/auth/login/` | `{email, password}` | `200 {access, refresh, user:{id,email,full_name}}` |
| POST | `/api/auth/refresh/` | `{refresh}` | `200 {access}` (401 if revoked) |
| POST | `/api/auth/logout/` | `{refresh}` | `205` (revokes refresh in Redis) |
| GET | `/api/auth/me/` | — | `200 {id,email,full_name}` |

## Organizations / Members / Domains  (`apps.organizations`, built)
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/organizations/` | — | only orgs the caller belongs to |
| POST | `/api/organizations/` | `{name, industry?, primary_language?}` | creator becomes `org_owner`; returns `{id,name,slug,plan,...}` |
| GET | `/api/organizations/{id}/members/` | — | list memberships |
| POST | `/api/organizations/{id}/invite/` | `{email, role}` | management roles only |
| GET/POST | `/api/organizations/{id}/domains/` | `{url, is_primary?}` | |

Roles: `org_owner, org_admin, marketing_manager, aeo_specialist, content_manager, writer, developer, billing_manager, viewer`.

## Website Manager  (`apps.website_manager`, built)
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/organizations/{id}/crawl/` | `{domain_id?}` | `202` CrawlResult (async) |
| GET | `/api/organizations/{id}/crawl-results/` | — | `meta`: title, meta_description, canonical, has_robots, has_sitemap, links_total, broken_links[], performance_score |

## Knowledge Base  (`apps.knowledge_base`, built)
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/organizations/{id}/documents/` | multipart or `{source_type, title, raw_text|source_url|file}` | `201`; async embed. source_type: text/website/pdf/docx/txt |
| GET | `/api/organizations/{id}/documents/` | — | list |
| GET | `/api/organizations/{id}/documents/{doc_id}/status/` | — | `{id,status,num_chunks,error}` (status: pending/processing/done/failed) |
| POST | `/api/organizations/{id}/documents/search/` | `{query, top_k?}` | `{query, results:[{score,document_id,text}]}` |

## AI Optimization  (`apps.ai_optimization`, built)
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/organizations/{id}/schema-markup/` | — | list SchemaMarkup |
| POST | `/api/organizations/{id}/schema-markup/generate/` | `{schema_type: "all"\|"faq"\|"organization", applied_to_url?}` | `202`; async; markups have `{schema_type,json_ld,status,is_valid,validation_errors}` |

---

## AI Monitoring + Dashboard  (`apps.ai_monitoring`, `apps.dashboard`) — STAGE 6, TO BUILD

### Prompt Library
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/organizations/{id}/prompts/` | — | list `{id,text,category}` |
| POST | `/api/organizations/{id}/prompts/` | `{text, category}` | manual create |
| POST | `/api/organizations/{id}/prompts/generate/` | `{}` | auto-generate a starter set from org name/industry across categories; `201` list |

`Prompt.category`: `brand \| product \| comparison \| local \| faq`.

### Scan
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/organizations/{id}/scan/` | `{}` | `202`; dispatches `run_ai_scan` (Celery) across all prompts × providers; then computes scores |
| GET | `/api/organizations/{id}/scan-results/` | — | list `{id, prompt, provider, is_mentioned, sentiment, citation_sources, response_text, scanned_at}` |

`ScanResult`: prompt FK, provider (openai/anthropic/gemini), response_text, is_mentioned(bool), sentiment(positive/neutral/negative), citation_sources(JSON list), scanned_at.

### Dashboard
| Method | Path | Response |
|---|---|---|
| GET | `/api/organizations/{id}/dashboard/` | see shape below |

```json
{
  "latest": {
    "date": "2026-07-06",
    "ai_visibility_score": 66,
    "geo_score": 58,
    "aeo_score": 50,
    "seo_score": 72,
    "trust_score": 61,
    "citation_score": 40
  },
  "trend": [
    { "date": "2026-06-30", "ai_visibility_score": 40, "geo_score": 35, "aeo_score": 20, "seo_score": 60, "trust_score": 50, "citation_score": 10 },
    { "date": "2026-07-06", "ai_visibility_score": 66, "geo_score": 58, "aeo_score": 50, "seo_score": 72, "trust_score": 61, "citation_score": 40 }
  ],
  "summary": { "prompts": 8, "scan_results": 24, "documents": 3 }
}
```
- `latest` is `null` when no ScoreSnapshot exists yet.
- `trend` = last ≤30 snapshots, ascending by date. Each entry has all 6 scores.
- All scores are integers 0–100.

### Score formulas (rolling 7-day window of ScanResult; keep transparent)
- `ai_visibility_score = round(100 * mentioned / total_non_errored)`
- `citation_score      = round(100 * with_citation / total_non_errored)`
- `trust_score         = round(100 * (positive + 0.5*neutral) / total_non_errored)`
- `aeo_score           = round(100 * valid_schema_types / 2)`  (of {faq, organization} present & is_valid)
- `seo_score`          = from latest CrawlResult: mean of [performance_score, has_robots?100:0, has_sitemap?100:0, max(0,100-25*len(broken_links))]; 0 if no crawl
- `geo_score           = round(0.5*ai_visibility + 0.25*aeo + 0.25*seo)`
- If `total_non_errored == 0`, visibility/citation/trust = 0.

### Mock provider (ADR 001 condition #1 — MUST honor)
When no AI key is set, the gateway's mock client derives a **deterministic, realistic
distribution** from `hash(prompt.text + provider)`:
- `is_mentioned`: both true and false across a prompt set (~60–70% true)
- `sentiment`: positive / neutral / **and** negative all appear
- `citation_sources`: sometimes `[]`, sometimes populated
A mock that always returns "mentioned + positive" is a bug.
