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
