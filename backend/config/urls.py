"""Root URL configuration.

App routers are mounted under ``/api/`` as each app is built in its stage.
For now only the health check is exposed.
"""
from django.contrib import admin
from django.urls import include, path

from apps.ai_optimization.public import public_llms_txt, public_profile

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.common.urls")),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.organizations.urls")),
    path("api/", include("apps.website_manager.urls")),
    path("api/", include("apps.knowledge_base.urls")),
    path("api/", include("apps.ai_optimization.urls")),
    path("api/", include("apps.ai_monitoring.urls")),
    path("api/", include("apps.dashboard.urls")),
    # Public, AI-crawlable delivery surface (opt-in per organization)
    path("p/<slug:slug>/", public_profile, name="public-profile"),
    path("p/<slug:slug>/llms.txt", public_llms_txt, name="public-llms-txt"),
]
