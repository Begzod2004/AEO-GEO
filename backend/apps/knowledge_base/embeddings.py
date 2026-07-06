"""Embedding service with mock/live modes (see docs/adr/001-mock-mode.md).

* Live: OpenAI ``text-embedding-3-small`` (1536 dims), used when an OpenAI key
  is present and AEO_MODE allows it.
* Mock: a deterministic **feature-hashing** embedder producing 1536-dim L2-
  normalised vectors from the input text. Because it hashes word tokens into the
  vector space (bag-of-words), texts that share words get higher cosine
  similarity — so retrieval returns *meaningful* results even without any API
  key, while the vector shape stays identical to OpenAI's (so switching to live
  needs no re-indexing).
"""
from __future__ import annotations

import hashlib
import math
import re

from apps.common import mode

EMBEDDING_DIM = 1536
_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _hash_token(token: str) -> tuple[int, float]:
    digest = hashlib.md5(token.encode("utf-8")).hexdigest()
    index = int(digest[:8], 16) % EMBEDDING_DIM
    sign = 1.0 if (int(digest[8], 16) & 1) == 0 else -1.0
    return index, sign


def mock_embed(text: str) -> list[float]:
    """Deterministic 1536-dim feature-hash vector for ``text``."""
    vector = [0.0] * EMBEDDING_DIM
    tokens = _TOKEN_RE.findall((text or "").lower())
    if not tokens:
        tokens = [(text or "empty").strip().lower() or "empty"]
    for token in tokens:
        index, sign = _hash_token(token)
        vector[index] += sign
    norm = math.sqrt(sum(v * v for v in vector)) or 1.0
    return [v / norm for v in vector]


class MockEmbedder:
    dim = EMBEDDING_DIM
    name = "mock-hash-1536"

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [mock_embed(t) for t in texts]


class OpenAIEmbedder:
    dim = EMBEDDING_DIM
    name = "openai-text-embedding-3-small"
    model = "text-embedding-3-small"

    def __init__(self):
        from django.conf import settings
        from openai import OpenAI  # imported lazily; only needed in live mode

        self._client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def embed(self, texts: list[str]) -> list[list[float]]:
        resp = self._client.embeddings.create(model=self.model, input=texts)
        return [item.embedding for item in resp.data]


def get_embedder():
    """Return the live embedder when OpenAI is configured, else the mock."""
    if mode.is_live("openai"):
        return OpenAIEmbedder()
    return MockEmbedder()
