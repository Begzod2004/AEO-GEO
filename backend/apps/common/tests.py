from rest_framework import status
from rest_framework.test import APITestCase

from apps.common.models import Lead


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
