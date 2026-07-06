"""Knowledge Base tests. Chunking/embedding are pure-python; the pipeline and
search run against qdrant-client's in-memory engine (no server, offline)."""
import math
from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Role
from apps.knowledge_base import qdrant_store
from apps.knowledge_base.chunking import chunk_text
from apps.knowledge_base.embeddings import EMBEDDING_DIM, MockEmbedder, mock_embed
from apps.knowledge_base.models import Chunk, Document
from apps.organizations.models import Membership, Organization

User = get_user_model()


def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


class ChunkingTests(APITestCase):
    def test_empty_text_yields_no_chunks(self):
        self.assertEqual(chunk_text("   "), [])

    def test_short_text_is_single_chunk(self):
        self.assertEqual(chunk_text("Hello world."), ["Hello world."])

    def test_long_text_splits_into_overlapping_chunks(self):
        text = ("This is a sentence. " * 400).strip()  # ~8000 chars
        chunks = chunk_text(text)
        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(len(c) <= 2800 for c in chunks))


class EmbeddingTests(APITestCase):
    def test_dimension_and_determinism(self):
        v1 = mock_embed("robotics automation company")
        v2 = mock_embed("robotics automation company")
        self.assertEqual(len(v1), EMBEDDING_DIM)   # 1536, matches OpenAI
        self.assertEqual(v1, v2)                    # deterministic

    def test_lexical_similarity_signal(self):
        query = mock_embed("industrial robotics automation")
        related = mock_embed("we build industrial robotics and automation systems")
        unrelated = mock_embed("fresh bread and pastries baked daily")
        self.assertGreater(cosine(query, related), cosine(query, unrelated))

    def test_default_embedder_is_mock_without_keys(self):
        self.assertIsInstance(__import__(
            "apps.knowledge_base.embeddings", fromlist=["get_embedder"]
        ).get_embedder(), MockEmbedder)


class KBTestBase(APITestCase):
    def setUp(self):
        qdrant_store.reset_client()  # fresh in-memory Qdrant per test
        self.user = User.objects.create_user(
            email="kb@acme.io", password="Str0ngPass!23"
        )
        self.org = Organization.objects.create(name="Acme", slug="acme-kb")
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


class PipelineTaskTests(KBTestBase):
    def test_text_document_is_chunked_embedded_and_stored(self):
        from apps.knowledge_base.tasks import process_document_task

        doc = Document.objects.create(
            organization=self.org,
            source_type=Document.SourceType.TEXT,
            title="About",
            raw_text="Acme builds industrial robots. " * 50,
        )
        process_document_task(doc.id)
        doc.refresh_from_db()

        self.assertEqual(doc.status, Document.Status.DONE)
        self.assertGreater(doc.num_chunks, 0)
        chunks = Chunk.objects.filter(document=doc)
        self.assertEqual(chunks.count(), doc.num_chunks)
        self.assertTrue(all(c.embedding_vector_id for c in chunks))
        self.assertTrue(all(c.language == "en" for c in chunks))

    def test_empty_text_fails_gracefully(self):
        from apps.knowledge_base.tasks import process_document_task

        doc = Document.objects.create(
            organization=self.org,
            source_type=Document.SourceType.TEXT,
            raw_text="   ",
        )
        process_document_task(doc.id)
        doc.refresh_from_db()
        self.assertEqual(doc.status, Document.Status.FAILED)
        self.assertTrue(doc.error)


class KBEndpointTests(KBTestBase):
    def _upload(self, title, text):
        return self.client.post(
            f"/api/organizations/{self.org.id}/documents/",
            {"source_type": "text", "title": title, "raw_text": text},
            format="json",
        )

    def test_upload_status_and_semantic_search(self):
        self.auth(self.user)
        robots = self._upload(
            "Robots", "We build industrial robots and robotics automation systems."
        )
        self.assertEqual(robots.status_code, status.HTTP_201_CREATED)
        self.assertEqual(robots.data["status"], Document.Status.DONE)
        self._upload("Bakery", "We bake fresh bread, croissants and pastries daily.")

        # status endpoint
        st = self.client.get(
            f"/api/organizations/{self.org.id}/documents/{robots.data['id']}/status/"
        )
        self.assertEqual(st.data["status"], Document.Status.DONE)
        self.assertGreater(st.data["num_chunks"], 0)

        # semantic search should surface the robotics doc first
        res = self.client.post(
            f"/api/organizations/{self.org.id}/documents/search/",
            {"query": "robotics automation", "top_k": 3},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["results"])
        self.assertEqual(res.data["results"][0]["document_id"], robots.data["id"])

    def test_outsider_cannot_access_kb(self):
        outsider = User.objects.create_user(
            email="out@evil.io", password="Str0ngPass!23"
        )
        self.auth(outsider)
        self.assertEqual(
            self._upload("x", "hello").status_code, status.HTTP_403_FORBIDDEN
        )
        self.assertEqual(
            self.client.post(
                f"/api/organizations/{self.org.id}/documents/search/",
                {"query": "robots"}, format="json",
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
