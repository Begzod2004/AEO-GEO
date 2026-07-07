"""Auth flow tests: register -> login -> me / refresh / logout (Redis revocation),
plus throttling and the password-reset flow."""
import re

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.common.models import AuditLog

User = get_user_model()


class AuthFlowTests(APITestCase):
    def test_register_creates_hashed_user(self):
        resp = self.client.post(
            reverse("register"),
            {"email": "a@example.com", "full_name": "A", "password": "Str0ngPass!23"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="a@example.com")
        self.assertNotEqual(user.password, "Str0ngPass!23")
        self.assertTrue(user.check_password("Str0ngPass!23"))

    def test_login_returns_tokens_and_user(self):
        User.objects.create_user(email="b@example.com", password="Str0ngPass!23")
        resp = self.client.post(
            reverse("login"),
            {"email": "b@example.com", "password": "Str0ngPass!23"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)
        self.assertEqual(resp.data["user"]["email"], "b@example.com")

    def test_login_wrong_password_rejected(self):
        User.objects.create_user(email="c@example.com", password="Str0ngPass!23")
        resp = self.client.post(
            reverse("login"),
            {"email": "c@example.com", "password": "wrong"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_requires_auth(self):
        self.assertEqual(
            self.client.get(reverse("me")).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def _login(self, email="d@example.com", password="Str0ngPass!23"):
        User.objects.create_user(email=email, password=password)
        return self.client.post(
            reverse("login"), {"email": email, "password": password}, format="json"
        ).data

    def test_me_returns_current_user(self):
        tokens = self._login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        resp = self.client.get(reverse("me"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["email"], "d@example.com")

    def test_refresh_issues_new_access(self):
        tokens = self._login(email="e@example.com")
        resp = self.client.post(
            reverse("refresh"), {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)

    def test_logout_revokes_refresh(self):
        tokens = self._login(email="f@example.com")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        logout = self.client.post(
            reverse("logout"), {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(logout.status_code, status.HTTP_205_RESET_CONTENT)

        # After logout the refresh token must no longer work.
        self.client.credentials()
        again = self.client.post(
            reverse("refresh"), {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(again.status_code, status.HTTP_401_UNAUTHORIZED)


class ThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()  # throttle history is cache-backed

    def tearDown(self):
        cache.clear()

    @override_settings(AUTH_THROTTLE_RATE="2/min")
    def test_login_rate_limited(self):
        for _ in range(2):
            self.client.post(
                reverse("login"),
                {"email": "x@ex.com", "password": "wrong"}, format="json",
            )
        third = self.client.post(
            reverse("login"),
            {"email": "x@ex.com", "password": "wrong"}, format="json",
        )
        self.assertEqual(third.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_disabled_by_default_in_tests(self):
        for _ in range(5):
            resp = self.client.post(
                reverse("login"),
                {"email": "x@ex.com", "password": "wrong"}, format="json",
            )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class PasswordResetFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="reset@ex.com", password="OldPass!2345"
        )

    def _extract_link(self):
        body = mail.outbox[-1].body
        m = re.search(r"uid=(\d+)&token=([\w-]+)", body)
        return m.group(1), m.group(2)

    def test_full_reset_flow(self):
        # request -> email with link
        resp = self.client.post(
            reverse("forgot-password"), {"email": "reset@ex.com"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        uid, token = self._extract_link()

        # reset with the emailed pair
        done = self.client.post(
            reverse("reset-password"),
            {"uid": uid, "token": token, "password": "NewPass!2345"}, format="json",
        )
        self.assertEqual(done.status_code, status.HTTP_200_OK)

        # old password dead, new one works
        self.assertEqual(
            self.client.post(reverse("login"),
                {"email": "reset@ex.com", "password": "OldPass!2345"},
                format="json").status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.assertEqual(
            self.client.post(reverse("login"),
                {"email": "reset@ex.com", "password": "NewPass!2345"},
                format="json").status_code,
            status.HTTP_200_OK,
        )

        # token is one-time: reusing it fails (password changed invalidates it)
        again = self.client.post(
            reverse("reset-password"),
            {"uid": uid, "token": token, "password": "Third!23456"}, format="json",
        )
        self.assertEqual(again.status_code, status.HTTP_400_BAD_REQUEST)

        # audit trail recorded both sides
        actions = set(AuditLog.objects.values_list("action", flat=True))
        self.assertIn("user.password_reset_requested", actions)
        self.assertIn("user.password_reset_completed", actions)

    def test_unknown_email_still_200_and_no_mail(self):
        resp = self.client.post(
            reverse("forgot-password"), {"email": "ghost@ex.com"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)
