"""AI Monitoring endpoints: manage the Prompt Library, launch scans, read results.

All routes are nested under ``/api/organizations/{organization_pk}/`` and gated by
``[IsAuthenticated, IsOrgMember]``. Every queryset is filtered by the org in the
URL — never ``.all()`` — so tenants stay isolated.
"""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_monitoring.models import Prompt, ScanResult
from apps.ai_monitoring.serializers import PromptSerializer, ScanResultSerializer
from apps.ai_monitoring.tasks import generate_prompts, run_ai_scan
from apps.organizations.models import Organization
from apps.organizations.permissions import IsOrgMember


class PromptViewSet(viewsets.ModelViewSet):
    """Nested under /api/organizations/{organization_pk}/prompts/."""

    serializer_class = PromptSerializer
    permission_classes = [IsAuthenticated, IsOrgMember]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return Prompt.objects.filter(organization_id=self.kwargs["organization_pk"])

    def perform_create(self, serializer):
        serializer.save(organization_id=self.kwargs["organization_pk"])

    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request, organization_pk=None):
        organization = Organization.objects.get(pk=organization_pk)
        prompts = generate_prompts(organization)
        return Response(
            PromptSerializer(prompts, many=True).data,
            status=status.HTTP_201_CREATED,
        )


class ScanResultViewSet(viewsets.ReadOnlyModelViewSet):
    """Nested under /api/organizations/{organization_pk}/scan-results/."""

    serializer_class = ScanResultSerializer
    permission_classes = [IsAuthenticated, IsOrgMember]

    def get_queryset(self):
        return ScanResult.objects.filter(
            prompt__organization_id=self.kwargs["organization_pk"]
        ).select_related("prompt")


class ScanTriggerView(APIView):
    """POST /api/organizations/{organization_pk}/scan/

    Dispatches ``run_ai_scan`` (across all prompts × providers, then scoring) off
    the request cycle and returns ``202``.
    """

    permission_classes = [IsAuthenticated, IsOrgMember]

    def post(self, request, organization_pk=None):
        run_ai_scan.delay(int(organization_pk))
        return Response(
            {"detail": "Scan dispatched."}, status=status.HTTP_202_ACCEPTED
        )
