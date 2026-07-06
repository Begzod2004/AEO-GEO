"""Organization / membership / domain tests — with the critical multi-tenant
isolation checks: a user must never see or touch another org's data."""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Role
from apps.organizations.models import Membership, Organization

User = get_user_model()


class OrgTestBase(APITestCase):
    def make_user(self, email):
        return User.objects.create_user(email=email, password="Str0ngPass!23")

    def auth(self, user):
        """Return a client authenticated as ``user``."""
        resp = self.client.post(
            "/api/auth/login/",
            {"email": user.email, "password": "Str0ngPass!23"},
            format="json",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}"
        )
        return self.client

    def create_org(self, name="Acme"):
        return self.client.post(
            "/api/organizations/", {"name": name}, format="json"
        )


class OrganizationFlowTests(OrgTestBase):
    def test_create_org_makes_creator_owner(self):
        self.auth(self.make_user("owner@example.com"))
        resp = self.create_org("Acme Inc")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        org = Organization.objects.get(id=resp.data["id"])
        self.assertTrue(resp.data["slug"])  # slug auto-generated
        membership = Membership.objects.get(organization=org)
        self.assertEqual(membership.role, Role.ORG_OWNER)

    def test_list_only_shows_own_orgs(self):
        self.auth(self.make_user("u1@example.com"))
        self.create_org("Org One")
        # second, unrelated user
        self.auth(self.make_user("u2@example.com"))
        self.create_org("Org Two")
        resp = self.client.get("/api/organizations/")
        names = [o["name"] for o in resp.data]
        self.assertEqual(names, ["Org Two"])

    def test_invite_adds_member_and_lists(self):
        self.auth(self.make_user("boss@example.com"))
        org_id = self.create_org().data["id"]
        invite = self.client.post(
            f"/api/organizations/{org_id}/invite/",
            {"email": "writer@example.com", "role": Role.WRITER},
            format="json",
        )
        self.assertEqual(invite.status_code, status.HTTP_201_CREATED)
        self.assertEqual(invite.data["user"]["email"], "writer@example.com")

        members = self.client.get(f"/api/organizations/{org_id}/members/")
        emails = {m["user"]["email"] for m in members.data}
        self.assertEqual(emails, {"boss@example.com", "writer@example.com"})

    def test_domain_create_and_list(self):
        self.auth(self.make_user("dom@example.com"))
        org_id = self.create_org().data["id"]
        created = self.client.post(
            f"/api/organizations/{org_id}/domains/",
            {"url": "https://acme.example", "is_primary": True},
            format="json",
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        listed = self.client.get(f"/api/organizations/{org_id}/domains/")
        self.assertEqual(len(listed.data), 1)
        self.assertEqual(listed.data[0]["url"], "https://acme.example")


class TenantIsolationTests(OrgTestBase):
    """Everything an outsider must be blocked from doing on someone else's org."""

    def setUp(self):
        # User A owns org A.
        self.auth(self.make_user("a@example.com"))
        self.org_a = self.create_org("Org A").data["id"]
        # User B owns a different org and is NOT a member of org A.
        self.user_b = self.make_user("b@example.com")

    def test_outsider_cannot_retrieve_org(self):
        self.auth(self.user_b)
        resp = self.client.get(f"/api/organizations/{self.org_a}/")
        self.assertIn(resp.status_code, (status.HTTP_403_FORBIDDEN,
                                         status.HTTP_404_NOT_FOUND))

    def test_outsider_cannot_list_members(self):
        self.auth(self.user_b)
        resp = self.client.get(f"/api/organizations/{self.org_a}/members/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_outsider_cannot_invite(self):
        self.auth(self.user_b)
        resp = self.client.post(
            f"/api/organizations/{self.org_a}/invite/",
            {"email": "x@example.com", "role": Role.WRITER},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_outsider_cannot_add_domain(self):
        self.auth(self.user_b)
        resp = self.client.post(
            f"/api/organizations/{self.org_a}/domains/",
            {"url": "https://evil.example"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class RoleEnforcementTests(OrgTestBase):
    """A member with a non-management role can read but not administer."""

    def setUp(self):
        self.auth(self.make_user("owner2@example.com"))
        self.org = self.create_org("RBAC Org").data["id"]
        # add a viewer
        self.client.post(
            f"/api/organizations/{self.org}/invite/",
            {"email": "viewer@example.com", "role": Role.VIEWER},
            format="json",
        )
        self.viewer = User.objects.get(email="viewer@example.com")
        self.viewer.set_password("Str0ngPass!23")
        self.viewer.save()

    def test_viewer_can_list_members(self):
        self.auth(self.viewer)
        resp = self.client.get(f"/api/organizations/{self.org}/members/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_viewer_cannot_invite(self):
        self.auth(self.viewer)
        resp = self.client.post(
            f"/api/organizations/{self.org}/invite/",
            {"email": "z@example.com", "role": Role.WRITER},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_viewer_cannot_add_domain(self):
        self.auth(self.viewer)
        resp = self.client.post(
            f"/api/organizations/{self.org}/domains/",
            {"url": "https://x.example"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
