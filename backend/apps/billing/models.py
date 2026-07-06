"""Billing: subscription record only (MVP).

No payment logic / webhooks yet — just the structure so the org's plan/provider/
period can be tracked and a real provider (Stripe/Payme/Click) wired in later.
"""
from django.db import models

from apps.common.models import TimeStampedModel
from apps.organizations.models import Organization


class Subscription(TimeStampedModel):
    class Provider(models.TextChoices):
        STRIPE = "stripe", "Stripe"
        PAYME = "payme", "Payme"
        CLICK = "click", "Click"

    class Status(models.TextChoices):
        TRIALING = "trialing", "Trialing"
        ACTIVE = "active", "Active"
        PAST_DUE = "past_due", "Past due"
        CANCELED = "canceled", "Canceled"

    organization = models.OneToOneField(
        Organization, on_delete=models.CASCADE, related_name="subscription"
    )
    plan = models.CharField(
        max_length=20,
        choices=Organization.Plan.choices,
        default=Organization.Plan.STARTER,
    )
    provider = models.CharField(max_length=20, choices=Provider.choices, blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.TRIALING
    )
    current_period_end = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.organization} — {self.plan} ({self.status})"
