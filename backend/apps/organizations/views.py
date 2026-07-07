"""Organization, member, invite and domain endpoints — all tenant-isolated."""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.invites import make_invite_token
from apps.accounts.models import Role
from apps.common.audit import record
from apps.organizations.models import Domain, Membership, Organization
from apps.organizations.permissions import HasRole, IsOrgMember
from apps.organizations.serializers import (
    DomainSerializer,
    InviteSerializer,
    MembershipSerializer,
    OrganizationSerializer,
)

User = get_user_model()

# Roles allowed to administer an organization.
MANAGEMENT = Role.management_roles()


class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer

    def get_queryset(self):
        # Only organizations the caller is a member of — the core isolation rule.
        return (
            Organization.objects.filter(memberships__user=self.request.user)
            .distinct()
            .order_by("-created_at")
        )

    def get_permissions(self):
        if self.action in ("update", "partial_update", "destroy", "invite"):
            return [IsAuthenticated(), HasRole(*MANAGEMENT)()]
        if self.action in ("retrieve", "members"):
            return [IsAuthenticated(), IsOrgMember()]
        # list, create
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        org = serializer.save()
        # The creator becomes the organization owner.
        Membership.objects.create(
            user=self.request.user, organization=org, role=Role.ORG_OWNER
        )
        record("org.create", user=self.request.user, organization=org)

    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        memberships = (
            Membership.objects.filter(organization_id=pk)
            .select_related("user")
            .order_by("created_at")
        )
        return Response(MembershipSerializer(memberships, many=True).data)

    @action(detail=True, methods=["post"])
    def invite(self, request, pk=None):
        serializer = InviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        role = serializer.validated_data["role"]

        user, created = User.objects.get_or_create(
            email=email, defaults={"is_active": True}
        )
        if created:
            user.set_unusable_password()
            user.save(update_fields=["password"])

        membership, m_created = Membership.objects.get_or_create(
            user=user, organization_id=pk, defaults={"role": role}
        )
        if not m_created and membership.role != role:
            membership.role = role
            membership.save(update_fields=["role"])

        data = MembershipSerializer(membership).data
        # A user who can't log in yet (no usable password) needs an invite link
        # to set one. Existing accounts are simply added.
        org = Organization.objects.filter(id=pk).first()
        if user.has_usable_password():
            data["status"] = "added"
        else:
            token = make_invite_token(user.id)
            data["status"] = "invited"
            data["invite_token"] = token
            data["invite_url"] = f"/accept-invite?token={token}"
            # Email the activation link (console backend in dev; a mail hiccup
            # must not fail the invite — the link is also in the response).
            link = f"{settings.FRONTEND_URL}/accept-invite?token={token}"
            send_mail(
                f"You've been invited to {org.name if org else 'a team'} on AEO.GEO",
                "You've been invited to join a team on AEO.GEO.\n\n"
                f"Activate your account here (valid for 48 hours): {link}",
                None,
                [email],
                fail_silently=True,
            )
        record(
            "org.invite",
            user=request.user,
            organization=org,
            invited=email,
            role=role,
        )

        return Response(
            data,
            status=status.HTTP_201_CREATED if m_created else status.HTTP_200_OK,
        )


class DomainViewSet(viewsets.ModelViewSet):
    """Nested under /organizations/{organization_pk}/domains/."""

    serializer_class = DomainSerializer

    def get_queryset(self):
        return Domain.objects.filter(
            organization_id=self.kwargs["organization_pk"]
        ).order_by("-created_at")

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated(), IsOrgMember()]
        return [IsAuthenticated(), HasRole(*MANAGEMENT)()]

    def perform_create(self, serializer):
        # organization comes from the URL, never the request body.
        serializer.save(organization_id=self.kwargs["organization_pk"])
