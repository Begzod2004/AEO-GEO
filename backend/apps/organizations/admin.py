from django.contrib import admin

from apps.organizations.models import Domain, Membership, Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "plan", "industry", "created_at")
    search_fields = ("name", "slug")
    list_filter = ("plan",)


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "organization", "role", "created_at")
    search_fields = ("user__email", "organization__name")
    list_filter = ("role",)


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ("id", "url", "organization", "is_primary")
    search_fields = ("url", "organization__name")
