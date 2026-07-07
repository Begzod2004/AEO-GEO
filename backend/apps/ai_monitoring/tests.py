"""AI Monitoring tests — fully offline in mock mode (no API keys, no network).

Covers the mock distribution guarantee (ADR 001 condition #1), the scan pipeline,
the Prompt Library / scan endpoints, and tenant isolation.
"""
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Role
from apps.ai_monitoring.gateway import AIProviderGateway, MockClient
from apps.ai_monitoring.models import Prompt, ScanResult
from apps.ai_monitoring.parsing import parse_response
from apps.ai_monitoring.tasks import generate_prompts, run_ai_scan
from apps.dashboard.models import ScoreSnapshot
from apps.organizations.models import Membership, Organization

User = get_user_model()


@override_settings(AEO_MODE="mock")
class MockDistributionTests(APITestCase):
    """ADR 001 #1: the mock must produce a realistic spread, not a constant."""

    def test_distribution_is_varied_across_a_prompt_set(self):
        signals = []
        for i in range(30):
            for provider in ("openai", "anthropic", "gemini"):
                resp = MockClient(provider).query(f"Prompt number {i} about widgets")
                self.assertIsNotNone(resp.signals)
                self.assertTrue(resp.text)  # a synthetic answer is always returned
                signals.append(resp.signals)

        mentioned_values = {s["is_mentioned"] for s in signals}
        sentiments = {s["sentiment"] for s in signals}
        has_empty = any(s["citations"] == [] for s in signals)
        has_populated = any(s["citations"] for s in signals)

        self.assertEqual(mentioned_values, {True, False})  # both appear
        self.assertEqual(sentiments, {"positive", "neutral", "negative"})
        self.assertTrue(has_empty and has_populated)

        # ~60–70% mentioned (assert a loose band so it stays deterministic-safe).
        rate = sum(s["is_mentioned"] for s in signals) / len(signals)
        self.assertGreater(rate, 0.45)
        self.assertLess(rate, 0.85)

    def test_mock_is_deterministic(self):
        a = MockClient("openai").query("Same prompt")
        b = MockClient("openai").query("Same prompt")
        self.assertEqual(a.signals, b.signals)
        self.assertEqual(a.text, b.text)

    def test_gateway_selects_mock_without_keys(self):
        gateway = AIProviderGateway()
        responses = gateway.query_all("What is the best CRM?")
        self.assertEqual(len(responses), 3)
        self.assertTrue(all(r.error is None for r in responses))
        self.assertTrue(all(r.signals is not None for r in responses))
        self.assertEqual(
            {r.provider for r in responses}, {"openai", "anthropic", "gemini"}
        )


class ParsingTests(APITestCase):
    def test_mention_substring_check(self):
        parsed = parse_response("Acme is a great option.", "Acme")
        self.assertTrue(parsed["is_mentioned"])
        self.assertEqual(parsed["sentiment"], "neutral")
        self.assertEqual(parsed["citations"], [])

    def test_no_mention_and_safe_on_empty(self):
        self.assertFalse(parse_response("Nothing relevant here.", "Acme")["is_mentioned"])
        self.assertFalse(parse_response("", "Acme")["is_mentioned"])
        self.assertFalse(parse_response("text", "")["is_mentioned"])


@override_settings(AEO_MODE="mock")
class MonitoringBase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="mon@acme.io", password="Str0ngPass!23"
        )
        self.org = Organization.objects.create(
            name="Acme", slug="acme-mon", industry="CRM software"
        )
        Membership.objects.create(
            user=self.user, organization=self.org, role=Role.ORG_OWNER
        )

    def auth(self, user):
        resp = self.client.post(
            "/api/auth/login/",
            {"email": user.email, "password": "Str0ngPass!23"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")


class ScanPipelineTests(MonitoringBase):
    def test_run_ai_scan_creates_results_and_snapshot(self):
        generate_prompts(self.org)
        n_prompts = Prompt.objects.filter(organization=self.org).count()
        self.assertGreater(n_prompts, 0)

        run_ai_scan(self.org.id)

        results = ScanResult.objects.filter(prompt__organization=self.org)
        self.assertEqual(results.count(), n_prompts * 3)  # one row per provider
        # The scan triggers scoring (eager in tests), so a snapshot now exists.
        self.assertTrue(
            ScoreSnapshot.objects.filter(organization=self.org).exists()
        )

    def test_scan_results_are_well_formed(self):
        generate_prompts(self.org)
        run_ai_scan(self.org.id)
        for r in ScanResult.objects.filter(prompt__organization=self.org):
            self.assertIn(r.provider, {"openai", "anthropic", "gemini"})
            self.assertIn(r.sentiment, {"positive", "neutral", "negative"})
            self.assertIsInstance(r.citation_sources, list)
            self.assertIsNotNone(r.scanned_at)


class PromptEndpointTests(MonitoringBase):
    def test_generate_starter_set_covers_all_categories(self):
        self.auth(self.user)
        resp = self.client.post(
            f"/api/organizations/{self.org.id}/prompts/generate/", {}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        categories = {p["category"] for p in resp.data}
        self.assertEqual(
            categories, {"brand", "product", "comparison", "local", "faq"}
        )

    def test_manual_create_and_list(self):
        self.auth(self.user)
        created = self.client.post(
            f"/api/organizations/{self.org.id}/prompts/",
            {"text": "Best CRM for startups?", "category": "product"},
            format="json",
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created.data["text"], "Best CRM for startups?")

        listed = self.client.get(f"/api/organizations/{self.org.id}/prompts/")
        self.assertEqual(listed.status_code, status.HTTP_200_OK)
        self.assertEqual(len(listed.data["results"]), 1)

    def test_scan_endpoint_dispatches_and_results_listable(self):
        generate_prompts(self.org)
        self.auth(self.user)
        resp = self.client.post(
            f"/api/organizations/{self.org.id}/scan/", {}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_202_ACCEPTED)

        listed = self.client.get(f"/api/organizations/{self.org.id}/scan-results/")
        self.assertEqual(listed.status_code, status.HTTP_200_OK)
        self.assertGreater(len(listed.data["results"]), 0)

    def test_outsider_is_forbidden(self):
        outsider = User.objects.create_user(
            email="out@evil.io", password="Str0ngPass!23"
        )
        self.auth(outsider)
        base = f"/api/organizations/{self.org.id}"
        self.assertEqual(
            self.client.get(f"{base}/prompts/").status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.post(f"{base}/prompts/generate/", {}, format="json").status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.post(f"{base}/scan/", {}, format="json").status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.get(f"{base}/scan-results/").status_code,
            status.HTTP_403_FORBIDDEN,
        )
