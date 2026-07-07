from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.common.models import Lead

User = get_user_model()


class WaitlistTests(APITestCase):
    def test_signup_creates_lead(self):
        resp = self.client.post("/api/waitlist/", {"email": "a@ex.com"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Lead.objects.filter(email="a@ex.com").exists())

    def test_duplicate_is_ok_not_error(self):
        Lead.objects.create(email="b@ex.com")
        resp = self.client.post("/api/waitlist/", {"email": "B@ex.com"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(Lead.objects.count(), 1)

    def test_invalid_email_rejected(self):
        resp = self.client.post("/api/waitlist/", {"email": "nope"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class PlatformAdminApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="root@aeo.geo", password="Str0ngPass!23"
        )
        self.normal = User.objects.create_user(
            email="user@aeo.geo", password="Str0ngPass!23"
        )
        Lead.objects.create(email="lead1@x.io")
        Lead.objects.create(email="lead2@x.io", source="referral")

    def login(self, email):
        resp = self.client.post(
            "/api/auth/login/",
            {"email": email, "password": "Str0ngPass!23"}, format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")

    def test_normal_user_gets_403(self):
        self.login("user@aeo.geo")
        for ep in ("overview", "leads", "users", "organizations", "audit"):
            resp = self.client.get(f"/api/platform/{ep}/")
            self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN, ep)

    def test_overview_shape(self):
        self.login("root@aeo.geo")
        resp = self.client.get("/api/platform/overview/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["totals"]["leads"], 2)
        self.assertEqual(resp.data["totals"]["users"], 2)
        self.assertEqual(len(resp.data["timeseries"]), 14)
        self.assertIn("mode", resp.data)
        # today's row counts the fixtures created in setUp
        today = resp.data["timeseries"][-1]
        self.assertEqual(today["signups"], 2)
        self.assertEqual(today["leads"], 2)

    def test_leads_list(self):
        self.login("root@aeo.geo")
        resp = self.client.get("/api/platform/leads/")
        emails = [r["email"] for r in resp.data["results"]]
        self.assertIn("lead1@x.io", emails)
        self.assertIn("lead2@x.io", emails)

    def test_login_response_includes_superuser_flag(self):
        resp = self.client.post(
            "/api/auth/login/",
            {"email": "root@aeo.geo", "password": "Str0ngPass!23"}, format="json",
        )
        self.assertTrue(resp.data["user"]["is_superuser"])
