from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter

from apps.organizations.views import DomainViewSet, OrganizationViewSet

router = DefaultRouter()
router.register(r"organizations", OrganizationViewSet, basename="organization")

# /api/organizations/{organization_pk}/domains/
orgs_router = NestedDefaultRouter(router, r"organizations", lookup="organization")
orgs_router.register(r"domains", DomainViewSet, basename="organization-domains")

urlpatterns = router.urls + orgs_router.urls
