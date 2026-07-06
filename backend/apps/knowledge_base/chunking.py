"""Sentence-aware chunking without a tokenizer download.

The skill suggests tiktoken, but that fetches a vocab over the network on first
use — which breaks offline builds/tests and our mock-first philosophy. We instead
chunk on paragraph/sentence boundaries using a character budget that approximates
the target token window (~4 chars/token), with overlap to preserve context.
"""
from __future__ import annotations

import re

CHARS_PER_TOKEN = 4
MAX_TOKENS = 700
OVERLAP_TOKENS = 100
MAX_CHARS = MAX_TOKENS * CHARS_PER_TOKEN
OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+|\n{2,}")


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // CHARS_PER_TOKEN)


def _split_sentences(text: str) -> list[str]:
    parts = [p.strip() for p in _SENTENCE_SPLIT.split(text) if p and p.strip()]
    return parts or ([text.strip()] if text.strip() else [])


def chunk_text(text: str, max_chars: int = MAX_CHARS,
               overlap_chars: int = OVERLAP_CHARS) -> list[str]:
    """Split ``text`` into overlapping, sentence-aligned chunks."""
    text = (text or "").strip()
    if not text:
        return []

    sentences = _split_sentences(text)
    chunks: list[str] = []
    current = ""

    for sentence in sentences:
        # A single sentence longer than the budget is hard-split by chars.
        if len(sentence) > max_chars:
            if current:
                chunks.append(current.strip())
                current = ""
            for i in range(0, len(sentence), max_chars - overlap_chars):
                chunks.append(sentence[i:i + max_chars].strip())
            continue

        if len(current) + len(sentence) + 1 <= max_chars:
            current = f"{current} {sentence}".strip()
        else:
            chunks.append(current.strip())
            # start next chunk with a tail overlap from the previous one
            tail = current[-overlap_chars:] if overlap_chars else ""
            current = f"{tail} {sentence}".strip()

    if current.strip():
        chunks.append(current.strip())

    return [c for c in chunks if c]
