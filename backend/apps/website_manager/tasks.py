"""Celery tasks for the Website Manager."""
from celery import shared_task
from django.utils import timezone

from apps.website_manager.crawler import crawl_site
from apps.website_manager.models import CrawlResult


@shared_task
def crawl_domain_task(crawl_result_id: int):
    """Run a crawl for a previously-created (pending) CrawlResult row."""
    try:
        cr = CrawlResult.objects.select_related("domain").get(id=crawl_result_id)
    except CrawlResult.DoesNotExist:
        return None

    cr.status = CrawlResult.Status.RUNNING
    cr.save(update_fields=["status", "updated_at"])

    try:
        result = crawl_site(cr.domain.url)
    except Exception as exc:  # defensive: crawler shouldn't raise, but never wedge
        cr.status = CrawlResult.Status.FAILED
        cr.error = str(exc)
        cr.crawled_at = timezone.now()
        cr.save(update_fields=["status", "error", "crawled_at", "updated_at"])
        return cr.id

    status = result.pop("status", "done")
    if status == "done":
        cr.status = CrawlResult.Status.DONE
        cr.meta = result
    else:
        cr.status = CrawlResult.Status.FAILED
        cr.error = result.get("error", "")
    cr.crawled_at = timezone.now()
    cr.save()
    return cr.id
