"""Shared abstract models used across apps.

``TimeStampedModel`` gives every concrete model created_at/updated_at for free
and keeps that boilerplate out of the individual app models.
"""
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Lead(TimeStampedModel):
    """Marketing waitlist signup (from the landing page). Not tenant-scoped."""

    email = models.EmailField(unique=True)
    source = models.CharField(max_length=40, blank=True, default="landing")

    def __str__(self):
        return self.email


class AuditLog(TimeStampedModel):
    """Security-relevant actions, append-only (PRD: audit logging from phase 1).

    Written via ``apps.common.audit.record`` — never directly — so a logging
    failure can never break the business operation it describes.
    """

    user = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=60)
    meta = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.action} by {self.user_id} @ org {self.organization_id}"
