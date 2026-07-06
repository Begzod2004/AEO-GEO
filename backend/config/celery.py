"""Celery application for AEO.GEO.

Discovers ``tasks.py`` in every installed app and reads all ``CELERY_*``
settings from Django settings. Periodic jobs (Celery Beat) are registered in
their owning app during later stages.
"""
import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("aeo_geo")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Trivial task used to confirm the worker is wired up."""
    print(f"Request: {self.request!r}")
