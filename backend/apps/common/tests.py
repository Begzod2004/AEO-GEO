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


class PlatformActionTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="boss@aeo.geo", password="Str0ngPass!23"
        )
        self.member = User.objects.create_user(
            email="member@aeo.geo", password="Str0ngPass!23"
        )
        resp = self.client.post(
            "/api/auth/login/",
            {"email": "boss@aeo.geo", "password": "Str0ngPass!23"}, format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")

    def test_health_shape(self):
        resp = self.client.get("/api/platform/health/")
        self.assertEqual(resp.status_code, 200)
        for key in ("database", "redis_cache", "qdrant", "celery_worker", "overall"):
            self.assertIn(key, resp.data)
        self.assertEqual(resp.data["database"], "ok")
        self.assertEqual(resp.data["redis_cache"], "ok")

    def test_issues_lists_failed_document_and_retry_fixes_it(self):
        from apps.knowledge_base.models import Document
        from apps.organizations.models import Organization

        org = Organization.objects.create(name="FixMe", slug="fixme")
        doc = Document.objects.create(
            organization=org, source_type="text", title="Recoverable",
            raw_text="Real content that will now process fine.",
            status=Document.Status.FAILED, error="transient failure",
        )
        issues = self.client.get("/api/platform/issues/")
        self.assertEqual(issues.data["count"], 1)
        self.assertEqual(issues.data["items"][0]["kind"], "document")

        resp = self.client.post(
            "/api/platform/actions/",
            {"action": "retry_document", "id": doc.id}, format="json",
        )
        self.assertEqual(resp.status_code, 200)
        doc.refresh_from_db()
        self.assertEqual(doc.status, Document.Status.DONE)  # eager celery reprocessed
        self.assertEqual(
            self.client.get("/api/platform/issues/").data["count"], 0
        )

    def test_toggle_user_active_with_guards(self):
        resp = self.client.post(
            "/api/platform/actions/",
            {"action": "toggle_user_active", "id": self.member.id}, format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.member.refresh_from_db()
        self.assertFalse(self.member.is_active)

        # blocked user can't log in
        login = self.client.post(
            "/api/auth/login/",
            {"email": "member@aeo.geo", "password": "Str0ngPass!23"}, format="json",
        )
        self.assertEqual(login.status_code, 401)

        # guards: not yourself, not superusers
        self.assertEqual(
            self.client.post(
                "/api/platform/actions/",
                {"action": "toggle_user_active", "id": self.admin.id}, format="json",
            ).status_code,
            400,
        )

    def test_set_org_plan_and_unknown_action(self):
        from apps.organizations.models import Organization

        org = Organization.objects.create(name="PlanCo", slug="planco")
        resp = self.client.post(
            "/api/platform/actions/",
            {"action": "set_org_plan", "id": org.id, "plan": "pro"}, format="json",
        )
        self.assertEqual(resp.status_code, 200)
        org.refresh_from_db()
        self.assertEqual(org.plan, "pro")

        self.assertEqual(
            self.client.post(
                "/api/platform/actions/",
                {"action": "set_org_plan", "id": org.id, "plan": "vip"}, format="json",
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.post(
                "/api/platform/actions/", {"action": "rm_rf"}, format="json"
            ).status_code,
            400,
        )

    def test_actions_forbidden_for_normal_user(self):
        resp = self.client.post(
            "/api/auth/login/",
            {"email": "member@aeo.geo", "password": "Str0ngPass!23"}, format="json",
        )
        # member may be inactive from earlier test ordering — recreate a clean one
        u = User.objects.create_user(email="plain@aeo.geo", password="Str0ngPass!23")
        resp = self.client.post(
            "/api/auth/login/",
            {"email": "plain@aeo.geo", "password": "Str0ngPass!23"}, format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
        for ep in ("health", "issues"):
            self.assertEqual(self.client.get(f"/api/platform/{ep}/").status_code, 403)
        self.assertEqual(
            self.client.post(
                "/api/platform/actions/", {"action": "refresh_all_scores"},
                format="json",
            ).status_code,
            403,
        )
