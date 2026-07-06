"""Thin Qdrant wrapper: one collection per organization for tenant isolation.

In tests we use qdrant-client's in-process ``:memory:`` mode (a real Qdrant
engine, no server) via a cached singleton, so upload-then-search works offline
within a test process. ``reset_client()`` clears it between tests.
"""
from __future__ import annotations

from django.conf import settings
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from apps.knowledge_base.embeddings import EMBEDDING_DIM

_client: QdrantClient | None = None


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        if getattr(settings, "TESTING", False):
            _client = QdrantClient(location=":memory:")
        else:
            _client = QdrantClient(url=settings.QDRANT_URL)
    return _client


def reset_client() -> None:
    """Test helper — drop the cached in-memory client so each test is clean."""
    global _client
    _client = None


def collection_name(organization_id: int) -> str:
    return f"org_{organization_id}"


def ensure_collection(organization_id: int) -> str:
    client = get_client()
    name = collection_name(organization_id)
    if not client.collection_exists(name):
        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
        )
    return name


def upsert_points(organization_id: int, points: list[PointStruct]) -> None:
    if not points:
        return
    client = get_client()
    client.upsert(collection_name=collection_name(organization_id), points=points)


def search(organization_id: int, vector: list[float], top_k: int = 5) -> list[dict]:
    client = get_client()
    name = collection_name(organization_id)
    if not client.collection_exists(name):
        return []
    result = client.query_points(
        collection_name=name, query=vector, limit=top_k, with_payload=True
    )
    return [
        {"score": p.score, "payload": p.payload, "id": str(p.id)}
        for p in result.points
    ]
