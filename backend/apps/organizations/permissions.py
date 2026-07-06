"""Reusable tenant-isolation permissions.

The organization is always resolved from the URL (``organization_pk`` for
nested routes, or ``pk`` for the organization detail route itself) and checked
against the caller's memberships — never trusted from the request body.
"""
from rest_framework.permissions import BasePermission

from apps.organizations.models import Membership


def _org_id_from_view(view):
    return view.kwargs.get("organization_pk") or view.kwargs.get("pk")


class IsOrgMember(BasePermission):
    """Caller must have any membership in the target organization."""

    def has_permission(self, request, view):
        org_id = _org_id_from_view(view)
        if org_id is None or not request.user.is_authenticated:
            return False
        return Membership.objects.filter(
            user=request.user, organization_id=org_id
        ).exists()


def HasRole(*allowed_roles):
    """Permission factory: caller must hold one of ``allowed_roles`` in the
    target organization.

    Usage::

        permission_classes = [IsAuthenticated, HasRole(Role.ORG_OWNER, Role.ORG_ADMIN)]
    """
    roles = [str(r) for r in allowed_roles]

    class _HasRole(BasePermission):
        def has_permission(self, request, view):
            org_id = _org_id_from_view(view)
            if org_id is None or not request.user.is_authenticated:
                return False
            return Membership.objects.filter(
                user=request.user,
                organization_id=org_id,
                role__in=roles,
            ).exists()

    return _HasRole
