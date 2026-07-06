"""Celery application for AEO.GEO.

Discovers ``tasks.py`` in every installed app and reads all ``CELERY_*``
settings from Django settings. Periodic jobs (Celery Beat) are registered in
their owning app during later stages.
"""
import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("aeo_geo")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# ---------------------------------------------------------------------------
# Periodic jobs (Celery Beat)
# ---------------------------------------------------------------------------
app.conf.beat_schedule = {
    # Nightly (03:00 UTC) Dashboard refresh: recompute every organization's
    # ScoreSnapshot so the trend line advances even on days with no manual scan.
    # The task fans out one sub-task per org (see apps.dashboard.tasks).
    "nightly-score-refresh": {
        "task": "apps.dashboard.tasks.nightly_score_refresh",
        "schedule": crontab(hour=3, minute=0),
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Trivial task used to confirm the worker is wired up."""
    print(f"Request: {self.request!r}")
