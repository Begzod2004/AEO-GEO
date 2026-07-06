"""Ground schema content in real Knowledge Base data via vector retrieval.

FAQ answers are pulled verbatim from the org's own KB chunks — zero fabrication.
Each seed question is embedded and matched against the org's Qdrant collection;
only sufficiently-relevant chunks become answers. (An LLM can later refine the
wording once the Stage-6 AI gateway exists — the grounding stays the same.)
"""
from __future__ import annotations

from apps.knowledge_base import qdrant_store
from apps.knowledge_base.embeddings import get_embedder
from apps.organizations.models import Domain

# Common questions real users ask an AI about a business.
SEED_QUESTIONS = [
    "What does {name} do?",
    "What products or services does {name} offer?",
    "What makes {name} different?",
    "Who is {name} best suited for?",
    "How can customers get started with {name}?",
]

MIN_SCORE = 0.02          # below this, the KB has no relevant answer -> skip
MAX_ANSWER_CHARS = 400


def _trim(text: str) -> str:
    text = " ".join((text or "").split())
    if len(text) <= MAX_ANSWER_CHARS:
        return text
    cut = text[:MAX_ANSWER_CHARS]
    for sep in (". ", "! ", "? "):
        idx = cut.rfind(sep)
        if idx > MAX_ANSWER_CHARS // 2:
            return cut[: idx + 1]
    return cut.rsplit(" ", 1)[0] + "…"


def generate_faq_pairs(organization, max_questions: int = 5) -> list[dict]:
    """Return grounded {question, answer} pairs, or [] if the KB can't answer."""
    embedder = get_embedder()
    pairs: list[dict] = []
    for template in SEED_QUESTIONS[:max_questions]:
        question = template.format(name=organization.name)
        vector = embedder.embed([question])[0]
        hits = qdrant_store.search(organization.id, vector, top_k=1)
        if hits and hits[0]["score"] >= MIN_SCORE:
            answer = _trim(hits[0]["payload"].get("text", ""))
            if answer:
                pairs.append({"question": question, "answer": answer})
    return pairs


def build_org_profile(organization) -> dict:
    """Assemble Organization-schema fields from the org record + KB, no invention."""
    primary = (
        Domain.objects.filter(organization=organization, is_primary=True).first()
        or Domain.objects.filter(organization=organization).first()
    )
    profile: dict = {"name": organization.name}
    if primary:
        profile["url"] = primary.url

    embedder = get_embedder()
    query = f"About {organization.name}. What does the company do?"
    hits = qdrant_store.search(organization.id, embedder.embed([query])[0], top_k=1)
    if hits and hits[0]["score"] >= MIN_SCORE:
        profile["description"] = _trim(hits[0]["payload"].get("text", ""))
    elif organization.industry:
        profile["description"] = organization.industry
    return profile
