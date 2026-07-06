"""Dashboard Celery tasks: (re)compute today's ScoreSnapshot for an org, plus a
nightly fan-out that refreshes every organization independently."""
from __future__ import annotations

from celery import shared_task
from django.utils import timezone

from apps.dashboard import scoring
from apps.dashboard.models import ScoreSnapshot
from apps.organizations.models import Organization


@shared_task
def compute_score_snapshot(organization_id: int):
    """Build or update *today's* ScoreSnapshot for one organization."""
    scores = scoring.compute_all_scores(organization_id)
    snapshot, _ = ScoreSnapshot.objects.update_or_create(
        organization_id=organization_id,
        date=timezone.now().date(),
        defaults=scores,
    )
    return snapshot.id


@shared_task
def nightly_score_refresh():
    """Fan out a per-org snapshot computation so one org never blocks another."""
    org_ids = list(Organization.objects.values_list("id", flat=True))
    for org_id in org_ids:
        compute_score_snapshot.delay(org_id)
    return len(org_ids)
