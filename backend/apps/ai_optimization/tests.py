"""AI Optimization tests: pure schema builders + grounded generation from KB."""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Role
from apps.ai_optimization import generators, schema_builders
from apps.ai_optimization.models import SchemaMarkup
from apps.knowledge_base import qdrant_store
from apps.knowledge_base.models import Document
from apps.knowledge_base.tasks import process_document_task
from apps.organizations.models import Domain, Membership, Organization

User = get_user_model()

KB_TEXT = (
    "Acme builds industrial robots and offers robotics products and services. "
    "What makes Acme different is its AI-driven approach to automation. "
    "Customers get started by contacting the Acme team. "
    "Acme is best suited for factories that want automation."
)


class SchemaBuilderTests(APITestCase):
    def test_faq_schema_shape(self):
        schema = schema_builders.build_faq_schema(
            [{"question": "Q?", "answer": "A."}]
        )
        self.assertEqual(schema["@type"], "FAQPage")
        self.assertEqual(schema["mainEntity"][0]["acceptedAnswer"]["text"], "A.")

    def test_organization_schema_omits_empty_fields(self):
        schema = schema_builders.build_organization_schema(
            {"name": "Acme", "url": "", "description": None}
        )
        self.assertEqual(schema["name"], "Acme")
        self.assertNotIn("url", schema)
        self.assertNotIn("description", schema)

    def test_validation_catches_problems(self):
        self.assertIn(
            "Missing @context or @type", schema_builders.validate_schema({})
        )
        self.assertTrue(
            schema_builders.validate_schema(
                {"@context": "x", "@type": "FAQPage", "mainEntity": []}
            )
        )
        self.assertEqual(
            schema_builders.validate_schema(
                schema_builders.build_faq_schema([{"question": "Q", "answer": "A"}])
            ),
            [],
        )


class GenerationBase(APITestCase):
    def setUp(self):
        qdrant_store.reset_client()
        self.user = User.objects.create_user(
            email="ai@acme.io", password="Str0ngPass!23"
        )
        self.org = Organization.objects.create(
            name="Acme", slug="acme-ai", industry="Industrial robotics"
        )
        Membership.objects.create(
            user=self.user, organization=self.org, role=Role.ORG_OWNER
        )
        Domain.objects.create(
            organization=self.org, url="https://acme.io", is_primary=True
        )

    def seed_kb(self, org=None):
        org = org or self.org
        doc = Document.objects.create(
            organization=org,
            source_type=Document.SourceType.TEXT,
            title="About",
            raw_text=KB_TEXT,
        )
        process_document_task(doc.id)
        return doc

    def auth(self, user):
        resp = self.client.post(
            "/api/auth/login/",
            {"email": user.email, "password": "Str0ngPass!23"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")


class GroundedFaqTests(GenerationBase):
    def test_faq_pairs_are_grounded_in_kb(self):
        self.seed_kb()
        pairs = generators.generate_faq_pairs(self.org)
        self.assertGreaterEqual(len(pairs), 1)
        self.assertTrue(all(p["answer"] for p in pairs))
        # answers come from KB content, not invented
        self.assertTrue(any("Acme" in p["answer"] for p in pairs))

    def test_no_kb_yields_no_pairs(self):
        pairs = generators.generate_faq_pairs(self.org)  # KB empty
        self.assertEqual(pairs, [])


class SchemaEndpointTests(GenerationBase):
    def test_generate_all_creates_valid_schema(self):
        self.seed_kb()
        self.auth(self.user)
        resp = self.client.post(
            f"/api/organizations/{self.org.id}/schema-markup/generate/",
            {"schema_type": "all"}, format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_202_ACCEPTED)
        by_type = {m["schema_type"]: m for m in resp.data}

        faq = by_type["faq"]
        self.assertEqual(faq["status"], SchemaMarkup.Status.DONE)
        self.assertTrue(faq["is_valid"])
        self.assertEqual(faq["json_ld"]["@type"], "FAQPage")
        self.assertTrue(faq["json_ld"]["mainEntity"])

        org = by_type["organization"]
        self.assertTrue(org["is_valid"])
        self.assertEqual(org["json_ld"]["name"], "Acme")
        self.assertEqual(org["json_ld"]["url"], "https://acme.io")

        listed = self.client.get(
            f"/api/organizations/{self.org.id}/schema-markup/"
        )
        self.assertEqual(len(listed.data["results"]), 2)

    def test_faq_without_kb_is_marked_failed(self):
        self.auth(self.user)  # no KB seeded
        resp = self.client.post(
            f"/api/organizations/{self.org.id}/schema-markup/generate/",
            {"schema_type": "faq"}, format="json",
        )
        faq = resp.data[0]
        self.assertEqual(faq["status"], SchemaMarkup.Status.FAILED)
        self.assertFalse(faq["is_valid"])
        self.assertTrue(faq["validation_errors"])

    def test_outsider_cannot_generate_or_list(self):
        outsider = User.objects.create_user(
            email="out@evil.io", password="Str0ngPass!23"
        )
        self.auth(outsider)
        self.assertEqual(
            self.client.post(
                f"/api/organizations/{self.org.id}/schema-markup/generate/",
                {"schema_type": "all"}, format="json",
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.get(
                f"/api/organizations/{self.org.id}/schema-markup/"
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )


class AiDeliveryTests(GenerationBase):
    """llms.txt + the public AI-crawlable profile (the 'reach the AI' half)."""

    def _generate_schema(self):
        self.auth(self.user)
        self.client.post(
            f"/api/organizations/{self.org.id}/schema-markup/generate/",
            {"schema_type": "all"}, format="json",
        )

    def test_llms_txt_is_grounded_and_member_only(self):
        self.seed_kb()
        self._generate_schema()
        resp = self.client.get(
            f"/api/organizations/{self.org.id}/schema-markup/llms-txt/"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        content = resp.data["content"]
        self.assertIn("# Acme", content)                 # org name
        self.assertIn("https://acme.io", content)        # real domain
        self.assertIn("## FAQ", content)                 # from generated schema
        self.assertIn("What does Acme do?", content)

        outsider = User.objects.create_user(
            email="out2@evil.io", password="Str0ngPass!23"
        )
        self.auth(outsider)
        self.assertEqual(
            self.client.get(
                f"/api/organizations/{self.org.id}/schema-markup/llms-txt/"
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_public_profile_requires_opt_in(self):
        self.seed_kb()
        self._generate_schema()
        # not published -> 404 for both public URLs
        self.assertEqual(self.client.get(f"/p/{self.org.slug}/").status_code, 404)
        self.assertEqual(
            self.client.get(f"/p/{self.org.slug}/llms.txt").status_code, 404
        )

        # publish via the normal org update (owner)
        self.auth(self.user)
        upd = self.client.patch(
            f"/api/organizations/{self.org.id}/",
            {"public_profile": True}, format="json",
        )
        self.assertEqual(upd.status_code, status.HTTP_200_OK)

        # public page now serves HTML with embedded JSON-LD (no auth needed)
        self.client.credentials()
        page = self.client.get(f"/p/{self.org.slug}/")
        self.assertEqual(page.status_code, 200)
        html = page.content.decode()
        self.assertIn("application/ld+json", html)
        self.assertIn("FAQPage", html)
        self.assertIn("Acme", html)
        self.assertIn("llms.txt", html)

        txt = self.client.get(f"/p/{self.org.slug}/llms.txt")
        self.assertEqual(txt.status_code, 200)
        self.assertIn("# Acme", txt.content.decode())
        self.assertEqual(txt["Content-Type"], "text/plain; charset=utf-8")
