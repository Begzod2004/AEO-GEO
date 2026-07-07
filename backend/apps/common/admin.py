from django.contrib import admin

from apps.common.models import AuditLog, Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "source", "created_at")
    search_fields = ("email",)
    list_filter = ("source",)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("id", "action", "user", "organization", "created_at")
    list_filter = ("action",)
    search_fields = ("action", "user__email")
    readonly_fields = ("user", "organization", "action", "meta", "created_at")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
