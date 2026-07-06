"""Common, cross-cutting views. Currently just a health/status endpoint."""
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common import mode


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
