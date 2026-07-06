"""AI Optimization: schema.org / JSON-LD generated from Knowledge Base content.

Structured data is one of the strongest signals AI answer engines use to
extract facts about a business — but only when it reflects the org's *real*
content. Every SchemaMarkup here is generated from KB data, then validated.
"""
from django.db import models

from apps.common.models import TimeStampedModel


class SchemaMarkup(TimeStampedModel):
    class SchemaType(models.TextChoices):
        FAQ = "faq", "FAQ Page"
        ORGANIZATION = "organization", "Organization"
        PRODUCT = "product", "Product"
        BREADCRUMB = "breadcrumb", "Breadcrumb"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        DONE = "done", "Done"
        FAILED = "failed", "Failed"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="schema_markups",
    )
    schema_type = models.CharField(max_length=20, choices=SchemaType.choices)
    json_ld = models.JSONField(default=dict, blank=True)
    applied_to_url = models.URLField(blank=True)
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.PENDING
    )
    is_valid = models.BooleanField(default=False)
    validation_errors = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.schema_type} for org {self.organization_id} [{self.status}]"
