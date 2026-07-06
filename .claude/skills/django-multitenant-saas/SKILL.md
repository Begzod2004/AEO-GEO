---
name: django-multitenant-saas
description: Use this skill whenever building or modifying authentication, organizations/tenants, roles, permissions (RBAC), or membership logic in the AEO.GEO Django backend. Trigger this for any task involving User model, JWT auth, Organization model, inviting members, role-based access, or multi-tenant data isolation — even if the user just says "add auth" or "add a new role" without mentioning multi-tenancy explicitly.
---

# Django Multi-Tenant SaaS (shared-schema, row-level isolation)

AEO.GEO is a shared-database multi-tenant SaaS: one Postgres database, every tenant-owned row has an `organization` FK, and isolation is enforced in the ORM layer (querysets), not at the database-schema level. Do not introduce per-tenant schemas or databases — that's out of scope for MVP.

## Core models

```python
# apps/accounts/models.py
class User(AbstractUser):
    email = models.EmailField(unique=True)
    # no global "role" field — role is per-organization, via Membership

class Role(models.TextChoices):
    SUPER_ADMIN = "super_admin"
    ORG_OWNER = "org_owner"
    ORG_ADMIN = "org_admin"
    MARKETING_MANAGER = "marketing_manager"
    AEO_SPECIALIST = "aeo_specialist"
    CONTENT_MANAGER = "content_manager"
    WRITER = "writer"
    DEVELOPER = "developer"
    BILLING_MANAGER = "billing_manager"
    VIEWER = "viewer"

# apps/organizations/models.py
class Organization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    plan = models.CharField(choices=[("starter","Starter"),("pro","Pro"),
                                      ("business","Business"),("enterprise","Enterprise")],
                             default="starter", max_length=20)

class Membership(models.Model):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    role = models.CharField(choices=Role.choices, max_length=30)
    class Meta:
        unique_together = ("user", "organization")
```

A single user can belong to multiple organizations with different roles in each — never store role on the `User` model itself.

## Every tenant-owned model must have an `organization` FK

```python
class Document(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="documents")
    ...
```

## Enforcing isolation — never trust the client for organization_id

Always resolve `organization` from the URL + membership check, never from request body alone.

```python
# apps/organizations/permissions.py
from rest_framework.permissions import BasePermission

class IsOrgMember(BasePermission):
    def has_permission(self, request, view):
        org_id = view.kwargs.get("organization_pk")
        return Membership.objects.filter(user=request.user, organization_id=org_id).exists()

class HasRole(BasePermission):
    """Usage: permission_classes = [HasRole(["org_owner", "org_admin"])]"""
    def __init__(self, allowed_roles):
        self.allowed_roles = allowed_roles
    def __call__(self):
        return self
    def has_permission(self, request, view):
        org_id = view.kwargs.get("organization_pk")
        return Membership.objects.filter(
            user=request.user, organization_id=org_id, role__in=self.allowed_roles
        ).exists()
```

In every ViewSet, filter querysets by the resolved organization — never `Model.objects.all()`:

```python
class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOrgMember]

    def get_queryset(self):
        return Document.objects.filter(organization_id=self.kwargs["organization_pk"])

    def perform_create(self, serializer):
        serializer.save(organization_id=self.kwargs["organization_pk"])
```

Use nested routers (`drf-nested-routers`) so URLs look like `/api/organizations/{organization_pk}/documents/`.

## JWT auth with Redis-backed refresh tokens

Use `djangorestframework-simplejwt`. Store refresh token jti in Redis with a TTL so tokens can be revoked (logout, password change):

```python
# on login, after issuing tokens:
redis_client.setex(f"refresh:{user.id}:{token['jti']}", REFRESH_TTL_SECONDS, "valid")

# custom rotation/blacklist check hooks into simplejwt's token_blacklist app,
# or check Redis manually in a custom authentication class if avoiding that app.
```

## Common mistakes to avoid

- Filtering by `request.user` alone instead of by `(user, organization)` — leaks data across a user's other orgs.
- Storing role as a single field on `User` — breaks the "one user, many orgs, different roles" requirement.
- Trusting `organization_id` sent in the POST body instead of the URL-resolved, membership-checked one.
- Forgetting `select_related("organization")` on hot paths — causes N+1 queries once monitoring/dashboard endpoints aggregate across orgs.
