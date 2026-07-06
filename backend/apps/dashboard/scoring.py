"""Score formulas for the Dashboard — deliberately simple and transparent.

The PRD flags "AI Score objectivity" as a trust risk, so every score here is an
explainable ratio over documented inputs (no black-box weighting). Each function
is pure: it reads the relevant apps' data and returns an int in 0–100.

Formulas (exactly per ``docs/api-contract.md``):

* ``ai_visibility_score = round(100 * mentioned / total)``       — 7-day window
* ``citation_score      = round(100 * with_citation / total)``   — 7-day window
* ``trust_score         = round(100 * (positive + 0.5*neutral) / total)``
* ``aeo_score           = round(100 * valid_schema_types / 2)``  of {faq, organization}
* ``seo_score``         = mean of [performance_score, has_robots?100:0,
                          has_sitemap?100:0, max(0, 100 - 25*len(broken_links))]
                          from the latest completed crawl; 0 if none
* ``geo_score           = round(0.5*visibility + 0.25*aeo + 0.25*seo)``

``total`` is the count of ScanResult rows in the rolling window. Errored provider
responses are never persisted, so the window is already "non-errored"; when it is
empty, visibility/citation/trust are 0.
"""
from __future__ import annotations

from datetime import timedelta

from django.utils import timezone

from apps.ai_monitoring.models import ScanResult
from apps.ai_optimization.models import SchemaMarkup
from apps.website_manager.models import CrawlResult

ROLLING_WINDOW_DAYS = 7
# The two schema types that count toward the AEO score (each worth 50 points).
AEO_SCHEMA_TYPES = ("faq", "organization")


def _recent_results(organization_id: int):
    """ScanResult rows for the org within the rolling window (already non-errored)."""
    since = timezone.now() - timedelta(days=ROLLING_WINDOW_DAYS)
    return ScanResult.objects.filter(
        prompt__organization_id=organization_id,
        scanned_at__gte=since,
    )


def ai_visibility_score(organization_id: int) -> int:
    """Share of recent answers that mention the organization."""
    results = _recent_results(organization_id)
    total = results.count()
    if total == 0:
        return 0
    mentioned = results.filter(is_mentioned=True).count()
    return round(100 * mentioned / total)


def citation_score(organization_id: int) -> int:
    """Share of recent answers that cited at least one source."""
    # Count non-empty citation lists in Python: robust across DB backends
    # (JSONField ``= []`` lookups differ between SQLite and Postgres).
    citations = _recent_results(organization_id).values_list(
        "citation_sources", flat=True
    )
    citations = list(citations)
    total = len(citations)
    if total == 0:
        return 0
    with_citation = sum(1 for c in citations if c)
    return round(100 * with_citation / total)


def trust_score(organization_id: int) -> int:
    """Positive answers count fully, neutral answers half, negative not at all."""
    results = _recent_results(organization_id)
    total = results.count()
    if total == 0:
        return 0
    positive = results.filter(sentiment=ScanResult.Sentiment.POSITIVE).count()
    neutral = results.filter(sentiment=ScanResult.Sentiment.NEUTRAL).count()
    return round(100 * (positive + 0.5 * neutral) / total)


def aeo_score(organization_id: int) -> int:
    """How many of the two key schema types ({faq, organization}) are valid."""
    valid_types = (
        SchemaMarkup.objects.filter(
            organization_id=organization_id,
            schema_type__in=AEO_SCHEMA_TYPES,
            is_valid=True,
        )
        .values_list("schema_type", flat=True)
        .distinct()
    )
    return round(100 * len(set(valid_types)) / len(AEO_SCHEMA_TYPES))


def seo_score(organization_id: int) -> int:
    """Website technical health from the latest completed crawl (0 if no crawl)."""
    crawl = (
        CrawlResult.objects.filter(
            domain__organization_id=organization_id,
            status=CrawlResult.Status.DONE,
        )
        .order_by("-crawled_at", "-created_at")
        .first()
    )
    if crawl is None:
        return 0
    meta = crawl.meta or {}
    performance = meta.get("performance_score", 0) or 0
    robots = 100 if meta.get("has_robots") else 0
    sitemap = 100 if meta.get("has_sitemap") else 0
    broken = len(meta.get("broken_links", []) or [])
    links_health = max(0, 100 - 25 * broken)
    signals = [performance, robots, sitemap, links_health]
    return round(sum(signals) / len(signals))


def geo_score(visibility: int, aeo: int, seo: int) -> int:
    """Composite: half visibility, a quarter each of AEO and SEO."""
    return round(0.5 * visibility + 0.25 * aeo + 0.25 * seo)


def compute_all_scores(organization_id: int) -> dict:
    """All six scores as a dict keyed exactly like the ScoreSnapshot fields."""
    visibility = ai_visibility_score(organization_id)
    aeo = aeo_score(organization_id)
    seo = seo_score(organization_id)
    return {
        "ai_visibility_score": visibility,
        "citation_score": citation_score(organization_id),
        "trust_score": trust_score(organization_id),
        "aeo_score": aeo,
        "seo_score": seo,
        "geo_score": geo_score(visibility, aeo, seo),
    }
