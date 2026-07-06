"""Website Manager: technical-SEO crawl results for an organization's domains.

Everything AI answer engines can "read" about a site — title, meta description,
canonical, robots/sitemap presence, broken links — is captured here per crawl.
"""
from django.db import models

from apps.common.models import TimeStampedModel


class CrawlResult(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        DONE = "done", "Done"
        FAILED = "failed", "Failed"

    domain = models.ForeignKey(
        "organizations.Domain",
        on_delete=models.CASCADE,
        related_name="crawl_results",
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    crawled_at = models.DateTimeField(null=True, blank=True)
    # meta holds: title, meta_description, canonical, has_robots, has_sitemap,
    # links_total/internal/external, links_checked, broken_links[], performance_score
    meta = models.JSONField(default=dict, blank=True)
    error = models.TextField(blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Crawl {self.domain.url} [{self.status}]"
