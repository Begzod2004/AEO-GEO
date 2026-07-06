from rest_framework_nested.routers import DefaultRouter, NestedDefaultRouter

from apps.knowledge_base.views import DocumentViewSet
from apps.organizations.views import OrganizationViewSet

_parent = DefaultRouter()
_parent.register(r"organizations", OrganizationViewSet, basename="organization")

nested = NestedDefaultRouter(_parent, r"organizations", lookup="organization")
nested.register(r"documents", DocumentViewSet, basename="organization-documents")

urlpatterns = nested.urls
