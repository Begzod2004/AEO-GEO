"""Dashboard: a daily snapshot of an organization's six visibility scores.

One ``ScoreSnapshot`` per org per day. The Dashboard reads the *latest* row for
the KPI cards and the trailing window for the trend chart. Every score is a
transparent 0–100 integer computed by ``apps.dashboard.scoring`` from the other
apps' data (monitoring results, schema markup, crawl results).
"""
from django.db import models

from apps.common.models import TimeStampedModel


class ScoreSnapshot(TimeStampedModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="score_snapshots",
    )
    date = models.DateField()
    ai_visibility_score = models.PositiveIntegerField(default=0)
    geo_score = models.PositiveIntegerField(default=0)
    aeo_score = models.PositiveIntegerField(default=0)
    seo_score = models.PositiveIntegerField(default=0)
    trust_score = models.PositiveIntegerField(default=0)
    citation_score = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("-date",)
        # One snapshot per org per day — recomputing updates today's row.
        unique_together = ("organization", "date")

    def __str__(self):
        return f"Scores for org {self.organization_id} on {self.date}"
