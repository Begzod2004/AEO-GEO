"""Dashboard tests: each score formula in isolation, the tasks, and the endpoint
shape (latest / trend / summary) — all offline and deterministic."""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Role
from apps.ai_monitoring.models import Prompt, ScanResult
from apps.ai_optimization.models import SchemaMarkup
from apps.dashboard import scoring
from apps.dashboard.models import ScoreSnapshot
from apps.dashboard.tasks import compute_score_snapshot, nightly_score_refresh
from apps.organizations.models import Domain, Membership, Organization
from apps.website_manager.models import CrawlResult

User = get_user_model()


class ScoringFormulaTests(APITestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Acme", slug="acme-score")
        self.prompt = Prompt.objects.create(
            organization=self.org, text="Best CRM?", category=Prompt.Category.PRODUCT
        )

    def _result(self, mentioned, sentiment, citations, provider="openai", age_days=0):
        return ScanResult.objects.create(
            prompt=self.prompt,
            provider=provider,
            response_text="x",
            is_mentioned=mentioned,
            sentiment=sentiment,
            citation_sources=citations,
            scanned_at=timezone.now() - timedelta(days=age_days),
        )

    def test_visibility_citation_trust(self):
        # 4 results: 3 mentioned; 2 positive / 1 neutral / 1 negative; 2 cited.
        self._result(True, "positive", ["a.com"])
        self._result(True, "positive", [])
        self._result(True, "neutral", ["b.com"])
        self._result(False, "negative", [])
        oid = self.org.id
        self.assertEqual(scoring.ai_visibility_score(oid), 75)  # 3/4
        self.assertEqual(scoring.citation_score(oid), 50)       # 2/4
        # trust = (2 + 0.5*1)/4 = 0.625 -> round(62.5) = 62 (banker's rounding)
        self.assertEqual(scoring.trust_score(oid), 62)

    def test_rolling_window_excludes_old_results(self):
        self._result(True, "positive", [], age_days=10)  # outside the 7-day window
        self.assertEqual(scoring.ai_visibility_score(self.org.id), 0)

    def test_empty_window_scores_zero(self):
        oid = self.org.id
        self.assertEqual(scoring.ai_visibility_score(oid), 0)
        self.assertEqual(scoring.citation_score(oid), 0)
        self.assertEqual(scoring.trust_score(oid), 0)

    def test_aeo_score_counts_valid_key_types(self):
        oid = self.org.id
        self.assertEqual(scoring.aeo_score(oid), 0)
        SchemaMarkup.objects.create(
            organization=self.org, schema_type="faq", is_valid=True, status="done"
        )
        self.assertEqual(scoring.aeo_score(oid), 50)  # 1 of 2
        SchemaMarkup.objects.create(
            organization=self.org, schema_type="organization", is_valid=True, status="done"
        )
        self.assertEqual(scoring.aeo_score(oid), 100)  # 2 of 2
        # 'product' is not a key type; it must not raise the score above 100.
        SchemaMarkup.objects.create(
            organization=self.org, schema_type="product", is_valid=True, status="done"
        )
        self.assertEqual(scoring.aeo_score(oid), 100)

    def test_aeo_ignores_invalid_markup(self):
        SchemaMarkup.objects.create(
            organization=self.org, schema_type="faq", is_valid=False, status="failed"
        )
        self.assertEqual(scoring.aeo_score(self.org.id), 0)

    def test_seo_score_from_latest_crawl(self):
        domain = Domain.objects.create(
            organization=self.org, url="https://acme.io", is_primary=True
        )
        self.assertEqual(scoring.seo_score(self.org.id), 0)  # no crawl yet
        CrawlResult.objects.create(
            domain=domain,
            status=CrawlResult.Status.DONE,
            crawled_at=timezone.now(),
            meta={
                "performance_score": 80,
                "has_robots": True,
                "has_sitemap": False,
                "broken_links": ["x", "y"],
            },
        )
        # mean of [80, 100, 0, max(0, 100 - 25*2)=50] = 230/4 = 57.5 -> 58
        self.assertEqual(scoring.seo_score(self.org.id), 58)

    def test_geo_score_combines_subscores(self):
        # 0.5*80 + 0.25*40 + 0.25*60 = 40 + 10 + 15 = 65
        self.assertEqual(scoring.geo_score(80, 40, 60), 65)

    def test_compute_all_scores_keys(self):
        scores = scoring.compute_all_scores(self.org.id)
        self.assertEqual(
            set(scores),
            {
                "ai_visibility_score", "geo_score", "aeo_score",
                "seo_score", "trust_score", "citation_score",
            },
        )


class ScoreSnapshotTaskTests(APITestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Acme", slug="acme-task")

    def test_compute_snapshot_updates_today_in_place(self):
        compute_score_snapshot(self.org.id)
        compute_score_snapshot(self.org.id)  # same day -> update, not duplicate
        self.assertEqual(
            ScoreSnapshot.objects.filter(
                organization=self.org, date=timezone.now().date()
            ).count(),
            1,
        )

    def test_nightly_refresh_fans_out_per_org(self):
        Organization.objects.create(name="Beta", slug="beta-task")
        count = nightly_score_refresh()
        self.assertEqual(count, Organization.objects.count())
        self.assertEqual(
            ScoreSnapshot.objects.filter(date=timezone.now().date()).count(),
            Organization.objects.count(),
        )


@override_settings(AEO_MODE="mock")
class DashboardEndpointTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="dash@acme.io", password="Str0ngPass!23"
        )
        self.org = Organization.objects.create(name="Acme", slug="acme-dash")
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

    def _snapshot(self, day_offset, visibility=50):
        return ScoreSnapshot.objects.create(
            organization=self.org,
            date=timezone.now().date() - timedelta(days=day_offset),
            ai_visibility_score=visibility,
            geo_score=40,
            aeo_score=50,
            seo_score=60,
            trust_score=55,
            citation_score=30,
        )

    def test_null_latest_when_no_snapshot(self):
        self.auth(self.user)
        resp = self.client.get(f"/api/organizations/{self.org.id}/dashboard/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsNone(resp.data["latest"])
        self.assertEqual(resp.data["trend"], [])
        self.assertEqual(
            resp.data["summary"], {"prompts": 0, "scan_results": 0, "documents": 0}
        )

    def test_shape_with_snapshots(self):
        today = timezone.now().date()
        self._snapshot(0, visibility=66)
        self._snapshot(1, visibility=55)
        self._snapshot(2, visibility=40)
        # A prompt so the summary count is non-trivial.
        Prompt.objects.create(
            organization=self.org, text="Best CRM?", category=Prompt.Category.PRODUCT
        )
        self.auth(self.user)
        resp = self.client.get(f"/api/organizations/{self.org.id}/dashboard/")

        latest = resp.data["latest"]
        self.assertEqual(latest["date"], str(today))
        self.assertEqual(latest["ai_visibility_score"], 66)
        self.assertEqual(
            set(latest),
            {
                "date", "ai_visibility_score", "geo_score", "aeo_score",
                "seo_score", "trust_score", "citation_score",
            },
        )
        # Trend ascending by date.
        dates = [entry["date"] for entry in resp.data["trend"]]
        self.assertEqual(dates, sorted(dates))
        self.assertEqual(len(resp.data["trend"]), 3)
        self.assertEqual(resp.data["summary"]["prompts"], 1)

    def test_trend_capped_at_30(self):
        for offset in range(35):
            self._snapshot(offset)
        self.auth(self.user)
        resp = self.client.get(f"/api/organizations/{self.org.id}/dashboard/")
        self.assertEqual(len(resp.data["trend"]), 30)
        # Ascending, ending at the most recent (today).
        self.assertEqual(resp.data["trend"][-1]["date"], str(timezone.now().date()))

    def test_outsider_forbidden(self):
        outsider = User.objects.create_user(
            email="out@evil.io", password="Str0ngPass!23"
        )
        self.auth(outsider)
        resp = self.client.get(f"/api/organizations/{self.org.id}/dashboard/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
