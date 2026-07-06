"""Pure schema.org / JSON-LD builders + a validator. No I/O, no fabrication —
callers pass only facts sourced from the Knowledge Base or the org record."""
from __future__ import annotations


def build_faq_schema(qa_pairs: list[dict]) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": qa["question"],
                "acceptedAnswer": {"@type": "Answer", "text": qa["answer"]},
            }
            for qa in qa_pairs
        ],
    }


def build_organization_schema(profile: dict) -> dict:
    schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": profile.get("name"),
    }
    # Include optional fields only when real values exist.
    for key in ("url", "logo", "description"):
        if profile.get(key):
            schema[key] = profile[key]
    if profile.get("sameAs"):
        schema["sameAs"] = profile["sameAs"]
    return schema


def build_product_schema(product: dict) -> dict:
    schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product["name"],
    }
    if product.get("description"):
        schema["description"] = product["description"]
    if product.get("price"):
        schema["offers"] = {
            "@type": "Offer",
            "price": product["price"],
            "priceCurrency": product.get("currency", "USD"),
            "availability": "https://schema.org/InStock",
        }
    return schema


def build_breadcrumb_schema(path: list[dict]) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": i + 1,
                "name": item["name"],
                "item": item["url"],
            }
            for i, item in enumerate(path)
        ],
    }


def validate_schema(schema: dict) -> list[str]:
    """Return a list of validation errors ([] means valid)."""
    errors: list[str] = []
    if "@context" not in schema or "@type" not in schema:
        errors.append("Missing @context or @type")

    schema_type = schema.get("@type")
    if schema_type == "FAQPage" and not schema.get("mainEntity"):
        errors.append("FAQPage must have at least one Question")
    if schema_type == "Organization" and not schema.get("name"):
        errors.append("Organization must have a name")
    if schema_type == "Product" and not schema.get("name"):
        errors.append("Product must have a name")
    if schema_type == "Product":
        offers = schema.get("offers")
        if offers and "priceCurrency" not in offers:
            errors.append("Offer must include priceCurrency")
    return errors
