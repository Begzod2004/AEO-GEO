"""Root URL configuration.

App routers are mounted under ``/api/`` as each app is built in its stage.
For now only the health check is exposed.
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.common.urls")),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.organizations.urls")),
]
