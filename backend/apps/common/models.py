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
