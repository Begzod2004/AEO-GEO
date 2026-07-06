from django.urls import path

from apps.common.views import HealthView, WaitlistView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("waitlist/", WaitlistView.as_view(), name="waitlist"),
]
