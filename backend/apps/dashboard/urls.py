from django.urls import path

from apps.dashboard.views import DashboardView

urlpatterns = [
    path(
        "organizations/<int:organization_pk>/dashboard/",
        DashboardView.as_view(),
        name="organization-dashboard",
    ),
]
