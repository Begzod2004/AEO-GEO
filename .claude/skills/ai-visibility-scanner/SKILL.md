---
name: ai-visibility-scanner
description: Use this skill whenever implementing the scanning workflow that runs an organization's Prompt Library against AI providers and turns responses into Score metrics (AI Visibility Score, GEO Score, AEO Score, Trust Score, Citation Score) for the AEO.GEO Dashboard. Trigger for tasks like "run a scan," "compute the dashboard scores," "check if we're mentioned," or "schedule the monitoring job."
---

# AI Visibility Scanner (scan → parse → score)

This skill covers the `ai_monitoring` + `dashboard` apps: taking an organization's `Prompt` set, running them through the `ai-provider-gateway`, parsing the raw text responses into structured signals, and rolling those up into the Score metrics shown on the Dashboard.

Depends on the `ai-provider-gateway` skill for the actual provider calls — read that skill first if not already loaded.

## Celery task: run a scan

```python
@shared_task
def run_ai_scan(organization_id: int):
    prompts = Prompt.objects.filter(organization_id=organization_id)
    gateway = AIProviderGateway()
    for prompt in prompts:
        responses = gateway.query_all(prompt.text)
        for resp in responses:
            if resp.error:
                continue
            parsed = parse_response(resp.text, organization_name=prompt.organization.name)
            ScanResult.objects.create(
                prompt=prompt,
                provider=resp.provider,
                response_text=resp.text,
                is_mentioned=parsed["is_mentioned"],
                sentiment=parsed["sentiment"],
                citation_sources=parsed["citations"],
            )
    compute_score_snapshot.delay(organization_id)
```

Schedule via Celery Beat (`automation` module concept from the PRD) — e.g. daily per organization, more frequently for higher-tier plans.

## Parsing the raw AI response

Don't try to parse mentions with brittle regex alone — combine a cheap deterministic check with an LLM-based check for sentiment/citation extraction, since AI answers phrase brand mentions inconsistently.

```python
def parse_response(text: str, organization_name: str) -> dict:
    is_mentioned = organization_name.lower() in text.lower()

    # For sentiment + citation extraction, use a small/cheap LLM call with a
    # structured-JSON-only prompt (see product_information's structured-output pattern):
    analysis = analyze_with_llm(text, organization_name)
    return {
        "is_mentioned": is_mentioned or analysis["is_mentioned"],
        "sentiment": analysis["sentiment"],   # "positive" | "neutral" | "negative"
        "citations": analysis["citations"],   # list of source names/URLs the AI referenced, if any
    }
```

The `analyze_with_llm` prompt should instruct the model to return **only** JSON, nothing else — parse and validate before saving; fall back to `sentiment="neutral", citations=[]` if parsing fails, never crash the whole scan over one bad parse.

## Computing Score metrics

Keep the MVP scoring formulas simple and transparent (the PRD's risk list flags "AI Score objectivity" as a trust risk — don't hide the math):

```python
@shared_task
def compute_score_snapshot(organization_id: int):
    results = ScanResult.objects.filter(
        prompt__organization_id=organization_id,
        scanned_at__gte=timezone.now() - timedelta(days=7),
    )
    total = results.count()
    if total == 0:
        return

    mentioned = results.filter(is_mentioned=True).count()
    positive = results.filter(sentiment="positive").count()
    with_citation = results.exclude(citation_sources=[]).count()

    ai_visibility_score = round(100 * mentioned / total)
    trust_score = round(100 * positive / total) if total else 0
    citation_score = round(100 * with_citation / total)

    # GEO/AEO/SEO scores combine visibility + structured-data completeness (ai_optimization app)
    # + website technical health (website_manager app) — keep each sub-score's inputs documented
    # in-code so the Dashboard can show "why" a score is what it is, not just the number.

    ScoreSnapshot.objects.create(
        organization_id=organization_id,
        date=timezone.now().date(),
        ai_visibility_score=ai_visibility_score,
        trust_score=trust_score,
        citation_score=citation_score,
        # geo_score, aeo_score, seo_score computed from other apps' data
    )
```

## Common mistakes to avoid

- Computing scores from all-time data instead of a rolling window — stale mentions from months ago shouldn't dilute a recent visibility drop.
- Treating a missing/errored provider response as "not mentioned" — exclude errored `ScanResult` rows from the denominator instead of counting them as negative signal.
- Running all organizations' scans in one giant task — fan out per-organization (or per-prompt) Celery tasks so one slow/failing org doesn't delay everyone else's dashboard refresh.
- Making scoring formulas opaque or magic-number-heavy — since "objective AI scoring" is explicitly called out as a trust risk for this product, prefer simple, explainable ratios over black-box weighting the customer can't understand.
