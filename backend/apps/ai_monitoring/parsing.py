"""Turn a raw AI answer into structured monitoring signals.

Used only on the *live* path (the mock client already returns structured signals
directly). The MVP is deliberately simple and transparent: a substring mention
check, with sentiment/citations defaulting to neutral/[]. An LLM refinement may
be layered on later, but it must never be *required* and must never crash a scan
— any failure falls back to these safe defaults.
"""
from __future__ import annotations

DEFAULT_SENTIMENT = "neutral"


def parse_response(text: str, organization_name: str) -> dict:
    """Return ``{is_mentioned, sentiment, citations}`` for one AI answer."""
    text = text or ""
    name = (organization_name or "").strip()
    is_mentioned = bool(name) and name.lower() in text.lower()
    return {
        "is_mentioned": is_mentioned,
        "sentiment": DEFAULT_SENTIMENT,
        "citations": [],
    }
