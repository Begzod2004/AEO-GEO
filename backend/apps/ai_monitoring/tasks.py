"""Celery tasks for AI Monitoring.

``run_ai_scan`` runs every prompt through every configured provider, persists the
structured signals as ``ScanResult`` rows, then triggers a fresh Dashboard score
snapshot. ``generate_prompts`` seeds a starter Prompt Library from the org's name
and industry. Provider calls go through the gateway, so this stays fully offline
in mock mode.
"""
from __future__ import annotations

from celery import shared_task
from django.utils import timezone

from apps.ai_monitoring.gateway import AIProviderGateway
from apps.ai_monitoring.models import Prompt, ScanResult
from apps.ai_monitoring.parsing import parse_response
from apps.dashboard.tasks import compute_score_snapshot

# Starter prompt templates per category. ``{name}`` / ``{industry}`` are filled
# from the organization — the questions a real user might ask an AI answer engine.
STARTER_PROMPTS: dict[str, list[str]] = {
    Prompt.Category.BRAND: [
        "What do you know about {name}?",
        "Is {name} a reputable company?",
    ],
    Prompt.Category.PRODUCT: [
        "What products or services does {name} offer?",
        "What is the best {industry} solution available?",
    ],
    Prompt.Category.COMPARISON: [
        "How does {name} compare to its competitors?",
        "Who are the top companies in {industry}?",
    ],
    Prompt.Category.LOCAL: [
        "What are the best {industry} providers near me?",
    ],
    Prompt.Category.FAQ: [
        "How do I get started with {name}?",
        "Is {name} worth it?",
    ],
}


@shared_task
def run_ai_scan(organization_id: int):
    """Scan all of an org's prompts × providers, then recompute scores."""
    prompts = Prompt.objects.filter(
        organization_id=organization_id
    ).select_related("organization")

    gateway = AIProviderGateway()
    now = timezone.now()
    created = 0
    for prompt in prompts:
        org_name = prompt.organization.name
        for resp in gateway.query_all(prompt.text):
            if resp.error:
                continue  # exclude errored providers entirely — not a negative signal
            # Mock responses carry structured signals directly; live ones are parsed.
            signals = resp.signals or parse_response(resp.text, org_name)
            ScanResult.objects.create(
                prompt=prompt,
                provider=resp.provider,
                response_text=resp.text,
                is_mentioned=signals["is_mentioned"],
                sentiment=signals["sentiment"],
                citation_sources=signals["citations"],
                scanned_at=now,
            )
            created += 1

    # Roll the new results up into today's Dashboard snapshot.
    compute_score_snapshot.delay(organization_id)
    return created


def generate_prompts(organization) -> list[Prompt]:
    """Create a starter Prompt set from the org name + industry across all five
    categories, then return the org's full prompt list. Existing prompt texts are
    skipped so re-running does not duplicate them.
    """
    industry = organization.industry or "the industry"
    existing = set(
        Prompt.objects.filter(organization=organization).values_list("text", flat=True)
    )

    to_create: list[Prompt] = []
    for category, templates in STARTER_PROMPTS.items():
        for template in templates:
            text = template.format(name=organization.name, industry=industry)
            if text in existing:
                continue
            existing.add(text)
            to_create.append(
                Prompt(organization=organization, text=text, category=category)
            )

    if to_create:
        Prompt.objects.bulk_create(to_create)

    return list(
        Prompt.objects.filter(organization=organization).order_by("category", "id")
    )
