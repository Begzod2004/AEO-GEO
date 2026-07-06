"""Website Manager tests — crawler logic runs fully offline via a fake fetcher;
endpoints patch the crawl so no real network is touched."""
from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.organizations.models import Domain, Membership, Organization
from apps.accounts.models import Role
from apps.website_manager.crawler import FetchResponse, crawl_site
from apps.website_manager.models import CrawlResult

User = get_user_model()

HTML = """
<html><head>
  <title>  Acme Robotics  </title>
  <meta name="description" content="We build robots.">
  <link rel="canonical" href="https://acme.example/">
</head><body>
  <a href="/about">About</a>
  <a href="/broken">Broken</a>
  <a href="https://partner.example/x">Partner</a>
  <a href="mailto:hi@acme.example">Mail</a>
  <a href="#top">Anchor</a>
</body></html>
"""


class FakeFetcher:
    """Serves canned GET pages and HEAD statuses; unknown URLs 404."""

    def __init__(self, pages, heads):
        self.pages = pages
        self.heads = heads

    def get(self, url):
        if url in self.pages:
            text, elapsed = self.pages[url]
            return FetchResponse(url, 200, text, elapsed, ok=True)
        return FetchResponse(url, 404, ok=False)

    def head(self, url):
        code = self.heads.get(url, 404)
        return FetchResponse(url, code, ok=code < 400)


class CrawlerUnitTests(APITestCase):
    def test_crawl_site_parses_and_finds_broken_link(self):
        url = "https://acme.example/"
        fetcher = FakeFetcher(
            pages={url: (HTML, 0.3)},
            heads={
                "https://acme.example/robots.txt": 200,
                "https://acme.example/sitemap.xml": 200,
                "https://acme.example/about": 200,
                "https://acme.example/broken": 404,   # the broken one
                "https://partner.example/x": 200,
            },
        )
        result = crawl_site(url, fetcher=fetcher)

        self.assertEqual(result["status"], "done")
        self.assertEqual(result["title"], "Acme Robotics")
        self.assertEqual(result["meta_description"], "We build robots.")
        self.assertEqual(result["canonical"], "https://acme.example/")
        self.assertTrue(result["has_robots"])
        self.assertTrue(result["has_sitemap"])
        # mailto:/anchor excluded; 3 real links (about, broken, partner)
        self.assertEqual(result["links_total"], 3)
        self.assertEqual(result["internal_links"], 2)
        self.assertEqual(result["external_links"], 1)
        broken = result["broken_links"]
        self.assertEqual([b["url"] for b in broken], ["https://acme.example/broken"])
        self.assertEqual(result["performance_score"], 100)  # 0.3s -> fast

    def test_crawl_site_reports_unreachable_main_page(self):
        url = "https://down.example/"
        fetcher = FakeFetcher(pages={}, heads={})  # main GET -> 404
        result = crawl_site(url, fetcher=fetcher)
        self.assertEqual(result["status"], "failed")
        self.assertIn("error", result)


class CrawlEndpointTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="owner@acme.example", password="Str0ngPass!23"
        )
        self.org = Organization.objects.create(name="Acme", slug="acme")
        Membership.objects.create(
            user=self.user, organization=self.org, role=Role.ORG_OWNER
        )
        self.domain = Domain.objects.create(
            organization=self.org, url="https://acme.example", is_primary=True
        )

    def auth(self, user):
        resp = self.client.post(
            "/api/auth/login/",
            {"email": user.email, "password": "Str0ngPass!23"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")

    _FAKE_META = {
        "status": "done", "title": "Acme", "meta_description": "d",
        "canonical": "", "has_robots": True, "has_sitemap": False,
        "links_total": 1, "internal_links": 1, "external_links": 0,
        "links_checked": 1, "broken_links": [], "performance_score": 90,
    }

    @patch("apps.website_manager.tasks.crawl_site")
    def test_trigger_crawl_runs_and_is_listable(self, mock_crawl):
        mock_crawl.return_value = dict(self._FAKE_META)
        self.auth(self.user)

        resp = self.client.post(f"/api/organizations/{self.org.id}/crawl/")
        self.assertEqual(resp.status_code, status.HTTP_202_ACCEPTED)
        # eager Celery ran the (patched) crawl inline -> done
        self.assertEqual(resp.data["status"], CrawlResult.Status.DONE)
        self.assertEqual(resp.data["meta"]["performance_score"], 90)

        listed = self.client.get(f"/api/organizations/{self.org.id}/crawl-results/")
        self.assertEqual(len(listed.data), 1)
        self.assertEqual(listed.data[0]["domain_url"], "https://acme.example")

    def test_trigger_without_domain_returns_400(self):
        empty_org = Organization.objects.create(name="Empty", slug="empty")
        Membership.objects.create(
            user=self.user, organization=empty_org, role=Role.ORG_OWNER
        )
        self.auth(self.user)
        resp = self.client.post(f"/api/organizations/{empty_org.id}/crawl/")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_outsider_cannot_trigger_or_list(self):
        outsider = User.objects.create_user(
            email="out@evil.example", password="Str0ngPass!23"
        )
        self.auth(outsider)
        self.assertEqual(
            self.client.post(f"/api/organizations/{self.org.id}/crawl/").status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.get(
                f"/api/organizations/{self.org.id}/crawl-results/"
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
