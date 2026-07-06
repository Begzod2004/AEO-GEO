from django.contrib import admin

from apps.accounts.models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "full_name", "is_active", "is_staff", "date_joined")
    search_fields = ("email", "full_name")
    list_filter = ("is_active", "is_staff", "is_superuser")
    ordering = ("-date_joined",)
    # Password is a hash — don't expose it as an editable text field.
    exclude = ("password",)
