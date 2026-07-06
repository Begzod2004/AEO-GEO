from django.contrib import admin

from apps.billing.models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "id", "organization", "plan", "provider", "status", "current_period_end",
    )
    list_filter = ("plan", "provider", "status")
    search_fields = ("organization__name",)
