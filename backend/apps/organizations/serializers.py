from django.contrib.auth import get_user_model
from django.utils.text import slugify
from rest_framework import serializers

from apps.accounts.models import Role
from apps.accounts.serializers import UserSerializer
from apps.organizations.models import Domain, Membership, Organization

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    # Slug is derived server-side to avoid collisions / client tampering.
    slug = serializers.SlugField(read_only=True)

    class Meta:
        model = Organization
        fields = (
            "id", "name", "slug", "plan", "industry",
            "primary_language", "created_at",
        )
        read_only_fields = ("id", "slug", "created_at")

    def create(self, validated_data):
        base = slugify(validated_data["name"]) or "org"
        slug, i = base, 1
        while Organization.objects.filter(slug=slug).exists():
            i += 1
            slug = f"{base}-{i}"
        validated_data["slug"] = slug
        return super().create(validated_data)


class MembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Membership
        fields = ("id", "user", "role", "created_at")


class InviteSerializer(serializers.Serializer):
    """Invite (or add) a member by email with a role. If the email has no
    account yet, a passwordless placeholder user is created so they can be
    added now and set a password later."""

    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=Role.choices)

    def validate_role(self, value):
        if value == Role.SUPER_ADMIN:
            raise serializers.ValidationError(
                "super_admin cannot be assigned per-organization."
            )
        return value


class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = ("id", "url", "is_primary", "created_at")
        read_only_fields = ("id", "created_at")
