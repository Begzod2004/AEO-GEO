"""Auth flow tests: register -> login -> me / refresh / logout (Redis revocation)."""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

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
