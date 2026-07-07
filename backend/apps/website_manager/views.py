"""Website Manager endpoints: trigger a crawl, read crawl results — org-scoped."""
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.audit import record
from apps.organizations.models import Domain
from apps.organizations.permissions import IsOrgMember
from apps.website_manager.models import CrawlResult
from apps.website_manager.serializers import CrawlResultSerializer
from apps.website_manager.tasks import crawl_domain_task


class CrawlTriggerView(APIView):
    """POST /api/organizations/{organization_pk}/crawl/

    Body: optional ``{"domain_id": <id>}``. Defaults to the org's primary
    domain (or the first one). Creates a pending CrawlResult and dispatches a
    Celery task; returns the row so the client can poll its status.
    """

    permission_classes = [IsAuthenticated, IsOrgMember]

    def post(self, request, organization_pk=None):
        domains = Domain.objects.filter(organization_id=organization_pk)
        domain_id = request.data.get("domain_id")
        if domain_id is not None:
            domain = domains.filter(id=domain_id).first()
        else:
            domain = domains.filter(is_primary=True).first() or domains.first()

        if domain is None:
            return Response(
                {"detail": "No matching domain for this organization."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        crawl = CrawlResult.objects.create(domain=domain)
        record("crawl.trigger", user=request.user,
               organization=domain.organization, domain=domain.url)
        crawl_domain_task.delay(crawl.id)
        crawl.refresh_from_db()  # eager mode (tests) already populated it
        return Response(
            CrawlResultSerializer(crawl).data, status=status.HTTP_202_ACCEPTED
        )


class CrawlResultViewSet(viewsets.ReadOnlyModelViewSet):
    """Nested under /api/organizations/{organization_pk}/crawl-results/."""

    serializer_class = CrawlResultSerializer
    permission_classes = [IsAuthenticated, IsOrgMember]

    def get_queryset(self):
        return CrawlResult.objects.filter(
            domain__organization_id=self.kwargs["organization_pk"]
        ).select_related("domain")
