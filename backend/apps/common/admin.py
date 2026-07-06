from django.contrib import admin

from apps.common.models import Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "source", "created_at")
    search_fields = ("email",)
    list_filter = ("source",)
