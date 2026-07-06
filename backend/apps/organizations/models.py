"""Organizations = tenants. Every tenant-owned model in the platform carries an
``organization`` FK; membership + role determine what a user may do inside one.
"""
from django.conf import settings
from django.db import models

from apps.accounts.models import Role
from apps.common.models import TimeStampedModel


class Organization(TimeStampedModel):
    class Plan(models.TextChoices):
        STARTER = "starter", "Starter"
        PRO = "pro", "Pro"
        BUSINESS = "business", "Business"
        ENTERPRISE = "enterprise", "Enterprise"

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    plan = models.CharField(
        max_length=20, choices=Plan.choices, default=Plan.STARTER
    )
    industry = models.CharField(max_length=120, blank=True)
    primary_language = models.CharField(max_length=12, default="en")

    def __str__(self):
        return self.name


class Membership(TimeStampedModel):
    """Links a user to an organization with a role. The source of truth for
    authorization — a user has NO role outside of a membership."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.CharField(max_length=30, choices=Role.choices)

    class Meta:
        unique_together = ("user", "organization")

    def __str__(self):
        return f"{self.user} @ {self.organization} ({self.role})"


class Domain(TimeStampedModel):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="domains",
    )
    url = models.URLField()
    is_primary = models.BooleanField(default=False)

    class Meta:
        unique_together = ("organization", "url")

    def __str__(self):
        return self.url
