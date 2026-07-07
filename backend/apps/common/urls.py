from django.urls import path

from apps.common.platform import (
    PlatformAuditView,
    PlatformLeadsView,
    PlatformOrganizationsView,
    PlatformOverviewView,
    PlatformUsersView,
)
from apps.common.views import HealthView, WaitlistView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("waitlist/", WaitlistView.as_view(), name="waitlist"),
    # Super Admin monitoring panel (superuser-only)
    path("platform/overview/", PlatformOverviewView.as_view(), name="platform-overview"),
    path("platform/leads/", PlatformLeadsView.as_view(), name="platform-leads"),
    path("platform/users/", PlatformUsersView.as_view(), name="platform-users"),
    path("platform/organizations/", PlatformOrganizationsView.as_view(), name="platform-organizations"),
    path("platform/audit/", PlatformAuditView.as_view(), name="platform-audit"),
]
