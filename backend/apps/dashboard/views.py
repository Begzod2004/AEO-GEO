"""Dashboard endpoint: the org's latest scores, a trailing trend, and summary counts."""
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_monitoring.models import Prompt, ScanResult
from apps.dashboard.models import ScoreSnapshot
from apps.dashboard.serializers import ScoreSnapshotSerializer
from apps.knowledge_base.models import Document
from apps.organizations.permissions import IsOrgMember

TREND_LIMIT = 30


class DashboardView(APIView):
    """GET /api/organizations/{organization_pk}/dashboard/.

    Returns ``{latest, trend, summary}``:

    * ``latest`` — the most recent ScoreSnapshot, or ``null`` if none exists yet.
    * ``trend``  — up to the last 30 snapshots, ascending by date (for charting).
    * ``summary``— counts of prompts, scan results and documents for the org.
    """

    permission_classes = [IsAuthenticated, IsOrgMember]

    def get(self, request, organization_pk=None):
        snapshots = ScoreSnapshot.objects.filter(organization_id=organization_pk)

        latest = snapshots.order_by("-date").first()
        # Last <=30 snapshots, then reversed to ascending order for the chart.
        trend = list(snapshots.order_by("-date")[:TREND_LIMIT])[::-1]

        return Response(
            {
                "latest": ScoreSnapshotSerializer(latest).data if latest else None,
                "trend": ScoreSnapshotSerializer(trend, many=True).data,
                "summary": {
                    "prompts": Prompt.objects.filter(
                        organization_id=organization_pk
                    ).count(),
                    "scan_results": ScanResult.objects.filter(
                        prompt__organization_id=organization_pk
                    ).count(),
                    "documents": Document.objects.filter(
                        organization_id=organization_pk
                    ).count(),
                },
            }
        )
