"""Platform admin API — the Super Admin monitoring panel's data source.

Superuser-only, read-only. Django admin stays the CRUD surface; these endpoints
feed the SPA's /admin dashboard: platform-wide counts, 14-day activity
timeseries, waitlist leads, users, organizations and the audit feed.
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import serializers
from rest_framework.generics import ListAPIView
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.core.cache import cache
from django.db import connections

from apps.ai_monitoring.models import Prompt, ScanResult
from apps.ai_monitoring.tasks import run_ai_scan
from apps.ai_optimization.models import SchemaMarkup
from apps.ai_optimization.tasks import generate_schema_task
from apps.common import mode
from apps.common.audit import record
from apps.common.models import AuditLog, Lead
from apps.dashboard.models import ScoreSnapshot
from apps.dashboard.tasks import nightly_score_refresh
from apps.knowledge_base.models import Document
from apps.knowledge_base.tasks import process_document_task
from apps.organizations.models import Organization
from apps.website_manager.models import CrawlResult
from apps.website_manager.tasks import crawl_domain_task

User = get_user_model()

TIMESERIES_DAYS = 14


class IsSuperUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)


def _daily_counts(queryset, date_field: str) -> dict[str, int]:
    since = timezone.now() - timedelta(days=TIMESERIES_DAYS - 1)
    rows = (
        queryset.filter(**{f"{date_field}__gte": since})
        .annotate(day=TruncDate(date_field))
        .values("day")
        .annotate(n=Count("id"))
    )
    return {row["day"].isoformat(): row["n"] for row in rows}


def _timeseries() -> list[dict]:
    """Per-day signups / leads / scans for the last TIMESERIES_DAYS days."""
    users = _daily_counts(User.objects.all(), "date_joined")
    leads = _daily_counts(Lead.objects.all(), "created_at")
    scans = _daily_counts(ScanResult.objects.all(), "created_at")
    today = timezone.now().date()
    out = []
    for i in range(TIMESERIES_DAYS - 1, -1, -1):
        day = (today - timedelta(days=i)).isoformat()
        out.append(
            {
                "date": day,
                "signups": users.get(day, 0),
                "leads": leads.get(day, 0),
                "scans": scans.get(day, 0),
            }
        )
    return out


class PlatformOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUser]

    def get(self, request):
        week_ago = timezone.now() - timedelta(days=7)
        return Response(
            {
                "totals": {
                    "users": User.objects.count(),
                    "organizations": Organization.objects.count(),
                    "leads": Lead.objects.count(),
                    "documents": Document.objects.count(),
                    "prompts": Prompt.objects.count(),
                    "scan_results": ScanResult.objects.count(),
                    "score_snapshots": ScoreSnapshot.objects.count(),
                },
                "last_7_days": {
                    "new_users": User.objects.filter(date_joined__gte=week_ago).count(),
                    "new_leads": Lead.objects.filter(created_at__gte=week_ago).count(),
                    "scans": ScanResult.objects.filter(created_at__gte=week_ago).count(),
                },
                "mode": mode.global_mode(),
                "providers": mode.provider_modes(),
                "timeseries": _timeseries(),
            }
        )


# ---- lists (paginated by the global DRF page size) ----


class LeadRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ("id", "email", "source", "created_at")


class UserRowSerializer(serializers.ModelSerializer):
    organizations = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "email", "full_name", "is_staff", "is_superuser",
            "is_active", "date_joined", "organizations",
        )

    def get_organizations(self, obj):
        return [m.organization.name for m in obj.memberships.all()]


class OrganizationRowSerializer(serializers.ModelSerializer):
    members = serializers.IntegerField(read_only=True)
    documents_count = serializers.IntegerField(read_only=True)
    scans = serializers.IntegerField(read_only=True)

    class Meta:
        model = Organization
        fields = (
            "id", "name", "slug", "plan", "industry", "created_at",
            "members", "documents_count", "scans",
        )


class AuditRowSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", default=None)
    organization_name = serializers.CharField(source="organization.name", default=None)

    class Meta:
        model = AuditLog
        fields = ("id", "action", "user_email", "organization_name", "meta", "created_at")


class PlatformLeadsView(ListAPIView):
    permission_classes = [IsAuthenticated, IsSuperUser]
    serializer_class = LeadRowSerializer
    queryset = Lead.objects.order_by("-created_at")


class PlatformUsersView(ListAPIView):
    permission_classes = [IsAuthenticated, IsSuperUser]
    serializer_class = UserRowSerializer
    queryset = User.objects.prefetch_related("memberships__organization").order_by(
        "-date_joined"
    )


class PlatformOrganizationsView(ListAPIView):
    permission_classes = [IsAuthenticated, IsSuperUser]
    serializer_class = OrganizationRowSerializer
    queryset = (
        Organization.objects.annotate(
            members=Count("memberships", distinct=True),
            documents_count=Count("documents", distinct=True),
            scans=Count("prompts__scan_results", distinct=True),
        ).order_by("-created_at")
    )


class PlatformAuditView(ListAPIView):
    permission_classes = [IsAuthenticated, IsSuperUser]
    serializer_class = AuditRowSerializer
    queryset = AuditLog.objects.select_related("user", "organization").order_by(
        "-created_at"
    )


# ---- system health + fixable issues + admin actions ----


class PlatformHealthView(APIView):
    """Live service checks so a problem is visible from the panel itself."""

    permission_classes = [IsAuthenticated, IsSuperUser]

    def get(self, request):
        checks: dict[str, str] = {}

        try:
            connections["default"].cursor()
            checks["database"] = "ok"
        except Exception:
            checks["database"] = "down"

        try:
            cache.set("platform-health-ping", "1", 10)
            checks["redis_cache"] = "ok" if cache.get("platform-health-ping") == "1" else "down"
        except Exception:
            checks["redis_cache"] = "down"

        try:
            from apps.knowledge_base.qdrant_store import get_client

            get_client().get_collections()
            checks["qdrant"] = "ok"
        except Exception:
            checks["qdrant"] = "down"

        try:
            from config import celery_app

            checks["celery_worker"] = (
                "ok" if celery_app.control.ping(timeout=1.0) else "down"
            )
        except Exception:
            checks["celery_worker"] = "down"

        checks["overall"] = "ok" if all(
            v == "ok" for k, v in checks.items() if k != "celery_worker"
        ) and checks["celery_worker"] == "ok" else "degraded"
        return Response(checks)


class PlatformIssuesView(APIView):
    """Everything currently in a failed state, with enough context to fix it."""

    permission_classes = [IsAuthenticated, IsSuperUser]

    def get(self, request):
        documents = [
            {
                "id": d.id, "kind": "document", "title": d.title or f"Document {d.id}",
                "organization": d.organization.name, "error": d.error,
                "when": d.updated_at,
            }
            for d in Document.objects.filter(status=Document.Status.FAILED)
            .select_related("organization")[:50]
        ]
        crawls = [
            {
                "id": c.id, "kind": "crawl", "title": c.domain.url,
                "organization": c.domain.organization.name, "error": c.error,
                "when": c.updated_at,
            }
            for c in CrawlResult.objects.filter(status=CrawlResult.Status.FAILED)
            .select_related("domain__organization")[:50]
        ]
        schemas = [
            {
                "id": m.id, "kind": "schema", "title": m.get_schema_type_display(),
                "organization": m.organization.name,
                "error": "; ".join(map(str, m.validation_errors or [])),
                "when": m.updated_at,
            }
            for m in SchemaMarkup.objects.filter(status=SchemaMarkup.Status.FAILED)
            .select_related("organization")[:50]
        ]
        items = documents + crawls + schemas
        return Response({"count": len(items), "items": items})


class PlatformActionView(APIView):
    """Whitelisted admin actions — "fix it from the panel". Every action is
    audit-logged as platform.<action>."""

    permission_classes = [IsAuthenticated, IsSuperUser]

    def post(self, request):
        action = request.data.get("action")
        obj_id = request.data.get("id")
        handler = getattr(self, f"_do_{action}", None) if action else None
        if handler is None:
            return Response(
                {"detail": f"unknown action: {action}"},
                status=400,
            )
        try:
            result = handler(request, obj_id)
        except (Document.DoesNotExist, CrawlResult.DoesNotExist,
                SchemaMarkup.DoesNotExist, Organization.DoesNotExist,
                User.DoesNotExist):
            return Response({"detail": "object not found"}, status=404)
        if isinstance(result, Response):
            return result
        record(f"platform.{action}", user=request.user, target=obj_id)
        return Response({"ok": True, **(result or {})})

    def _do_retry_document(self, request, obj_id):
        doc = Document.objects.get(id=obj_id)
        doc.status = Document.Status.PENDING
        doc.error = ""
        doc.save(update_fields=["status", "error", "updated_at"])
        process_document_task.delay(doc.id)
        return {"detail": "document re-queued"}

    def _do_retry_crawl(self, request, obj_id):
        crawl = CrawlResult.objects.get(id=obj_id)
        crawl_domain_task.delay(crawl.id)
        return {"detail": "crawl re-queued"}

    def _do_retry_schema(self, request, obj_id):
        markup = SchemaMarkup.objects.get(id=obj_id)
        markup.status = SchemaMarkup.Status.PENDING
        markup.validation_errors = []
        markup.save(update_fields=["status", "validation_errors", "updated_at"])
        generate_schema_task.delay(markup.id)
        return {"detail": "schema generation re-queued"}

    def _do_toggle_user_active(self, request, obj_id):
        target = User.objects.get(id=obj_id)
        if target.id == request.user.id:
            return Response({"detail": "you can't block yourself"}, status=400)
        if target.is_superuser:
            return Response({"detail": "superusers can't be blocked here"}, status=400)
        target.is_active = not target.is_active
        target.save(update_fields=["is_active"])
        return {"is_active": target.is_active}

    def _do_set_org_plan(self, request, obj_id):
        plan = request.data.get("plan")
        valid = {c for c, _ in Organization.Plan.choices}
        if plan not in valid:
            return Response({"detail": f"plan must be one of {sorted(valid)}"}, status=400)
        org = Organization.objects.get(id=obj_id)
        org.plan = plan
        org.save(update_fields=["plan"])
        return {"plan": plan}

    def _do_run_org_scan(self, request, obj_id):
        Organization.objects.get(id=obj_id)  # 404 if missing
        run_ai_scan.delay(int(obj_id))
        return {"detail": "scan dispatched"}

    def _do_refresh_all_scores(self, request, obj_id):
        nightly_score_refresh.delay()
        return {"detail": "score refresh dispatched"}
