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

from apps.ai_monitoring.models import Prompt, ScanResult
from apps.common import mode
from apps.common.models import AuditLog, Lead
from apps.dashboard.models import ScoreSnapshot
from apps.knowledge_base.models import Document
from apps.organizations.models import Organization

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
            "date_joined", "organizations",
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
