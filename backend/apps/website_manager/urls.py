from django.urls import path
from rest_framework_nested.routers import DefaultRouter, NestedDefaultRouter

from apps.organizations.views import OrganizationViewSet
from apps.website_manager.views import CrawlResultViewSet, CrawlTriggerView

# A parent router is required so the nested router can derive the
# {organization_pk} lookup; only the nested routes are exported here (the
# organization routes themselves live in apps.organizations.urls).
_parent = DefaultRouter()
_parent.register(r"organizations", OrganizationViewSet, basename="organization")

nested = NestedDefaultRouter(_parent, r"organizations", lookup="organization")
nested.register(
    r"crawl-results", CrawlResultViewSet, basename="organization-crawl-results"
)

urlpatterns = nested.urls + [
    path(
        "organizations/<int:organization_pk>/crawl/",
        CrawlTriggerView.as_view(),
        name="organization-crawl",
    ),
]
