"""Common, cross-cutting views: health/status and the marketing waitlist."""
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common import mode
from apps.common.models import Lead
from apps.common.throttling import WaitlistRateThrottle


class HealthView(APIView):
    """Liveness + mode probe. Public so orchestrators can poll it.

    Returns the overall mode (``mock``/``live``) and the per-provider
    breakdown so it is obvious at a glance whether real AI keys are wired.
    """

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": "aeo-geo-backend",
                "mode": mode.global_mode(),
                "providers": mode.provider_modes(),
            }
        )


class WaitlistSerializer(serializers.Serializer):
    email = serializers.EmailField()
    source = serializers.CharField(required=False, max_length=40, default="landing")


class WaitlistView(APIView):
    """Public early-access signup (used by the landing page). Idempotent —
    signing up twice with the same email is fine."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [WaitlistRateThrottle]

    def post(self, request):
        serializer = WaitlistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        _, created = Lead.objects.get_or_create(
            email=serializer.validated_data["email"].lower(),
            defaults={"source": serializer.validated_data.get("source", "landing")},
        )
        return Response(
            {"ok": True},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
