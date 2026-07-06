from django.urls import path
from rest_framework_nested.routers import DefaultRouter, NestedDefaultRouter

from apps.ai_monitoring.views import (
    PromptViewSet,
    ScanResultViewSet,
    ScanTriggerView,
)
from apps.organizations.views import OrganizationViewSet

# A parent router is required so the nested router can derive {organization_pk};
# only the nested routes are exported (the organization routes live in
# apps.organizations.urls).
_parent = DefaultRouter()
_parent.register(r"organizations", OrganizationViewSet, basename="organization")

nested = NestedDefaultRouter(_parent, r"organizations", lookup="organization")
nested.register(r"prompts", PromptViewSet, basename="organization-prompts")
nested.register(
    r"scan-results", ScanResultViewSet, basename="organization-scan-results"
)

urlpatterns = nested.urls + [
    path(
        "organizations/<int:organization_pk>/scan/",
        ScanTriggerView.as_view(),
        name="organization-scan",
    ),
]
