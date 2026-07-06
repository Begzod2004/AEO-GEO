from rest_framework_nested.routers import DefaultRouter, NestedDefaultRouter

from apps.ai_optimization.views import SchemaMarkupViewSet
from apps.organizations.views import OrganizationViewSet

_parent = DefaultRouter()
_parent.register(r"organizations", OrganizationViewSet, basename="organization")

nested = NestedDefaultRouter(_parent, r"organizations", lookup="organization")
nested.register(
    r"schema-markup", SchemaMarkupViewSet, basename="organization-schema-markup"
)

urlpatterns = nested.urls
