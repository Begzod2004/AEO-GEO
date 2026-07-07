"""AI Optimization endpoints: list generated schema markup, trigger generation."""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.ai_optimization.models import SchemaMarkup
from apps.ai_optimization.serializers import (
    GenerateSchemaSerializer,
    SchemaMarkupSerializer,
)
from apps.ai_optimization.tasks import generate_schema_task
from apps.common.audit import record
from apps.organizations.permissions import IsOrgMember


class SchemaMarkupViewSet(viewsets.ReadOnlyModelViewSet):
    """Nested under /api/organizations/{organization_pk}/schema-markup/."""

    serializer_class = SchemaMarkupSerializer
    permission_classes = [IsAuthenticated, IsOrgMember]

    def get_queryset(self):
        return SchemaMarkup.objects.filter(
            organization_id=self.kwargs["organization_pk"]
        )

    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request, organization_pk=None):
        serializer = GenerateSchemaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        requested = serializer.validated_data["schema_type"]
        applied_to_url = serializer.validated_data.get("applied_to_url", "")

        types = (
            [SchemaMarkup.SchemaType.FAQ, SchemaMarkup.SchemaType.ORGANIZATION]
            if requested == "all"
            else [requested]
        )

        record("schema.generate", user=request.user,
               organization_id_meta=organization_pk, types=[str(t) for t in types])
        created = []
        for schema_type in types:
            markup = SchemaMarkup.objects.create(
                organization_id=organization_pk,
                schema_type=schema_type,
                applied_to_url=applied_to_url,
            )
            generate_schema_task.delay(markup.id)
            markup.refresh_from_db()  # eager mode (tests) already generated it
            created.append(markup)

        return Response(
            SchemaMarkupSerializer(created, many=True).data,
            status=status.HTTP_202_ACCEPTED,
        )
