---
name: schema-org-generator
description: Use this skill whenever generating structured data for AEO.GEO's AI Optimization module — FAQ schema, Product schema, Organization schema, Breadcrumb, or any JSON-LD/schema.org markup. Trigger for tasks like "generate schema for this page," "add FAQ markup," or "make this AI-readable" even without the words "schema.org" or "JSON-LD" being used explicitly.
---

# Schema.org / JSON-LD Generator

This skill covers the AEO.GEO `ai_optimization` app: turning Knowledge Base content into valid schema.org JSON-LD, which is one of the strongest signals AI answer engines use to extract structured facts about a business.

## Core principle

Generate schema **from real Knowledge Base content**, never invented facts. Pull the source chunks via `search_knowledge_base()` (see `vector-knowledge-base` skill) and only assert what's actually stated in the organization's own data. Hallucinated schema (fake ratings, fake prices, fake FAQ answers) is worse than no schema — AI systems and search engines both penalize mismatched structured data.

## FAQ Schema

```python
def build_faq_schema(qa_pairs: list[dict]) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": qa["question"],
                "acceptedAnswer": {"@type": "Answer", "text": qa["answer"]}
            }
            for qa in qa_pairs
        ]
    }
```

Generating the Q&A pairs themselves: prompt an LLM with retrieved Knowledge Base chunks as context, instruct it to only answer from the provided text, and reject/flag any pair where the model indicates uncertainty.

## Organization Schema

```python
def build_organization_schema(org: Organization, profile: dict) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": org.name,
        "url": profile.get("website_url"),
        "logo": profile.get("logo_url"),
        "description": profile.get("description"),
        "sameAs": profile.get("social_profiles", []),  # LinkedIn, Crunchbase, etc — feeds Citation Manager too
    }
```

## Product Schema

```python
def build_product_schema(product: dict) -> dict:
    schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product["name"],
        "description": product.get("description"),
    }
    if product.get("price"):
        schema["offers"] = {
            "@type": "Offer",
            "price": product["price"],
            "priceCurrency": product.get("currency", "USD"),
            "availability": "https://schema.org/InStock",
        }
    return schema
```

Only include `offers`/`aggregateRating` blocks when real data exists — omit the field entirely rather than filling with placeholder/zero values.

## Breadcrumb Schema

```python
def build_breadcrumb_schema(path: list[dict]) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": item["name"], "item": item["url"]}
            for i, item in enumerate(path)
        ]
    }
```

## Validation before saving

Always validate the generated JSON-LD is syntactically correct and required fields are present before persisting to `SchemaMarkup`:

```python
def validate_schema(schema: dict) -> list[str]:
    errors = []
    if "@context" not in schema or "@type" not in schema:
        errors.append("Missing @context or @type")
    if schema.get("@type") == "FAQPage" and not schema.get("mainEntity"):
        errors.append("FAQPage must have at least one Question")
    return errors
```

For real correctness confidence, also recommend the user run output through Google's Rich Results Test manually — don't claim schema is "Google-validated" without that external check.

## Injecting into pages

Store the JSON-LD as-is in `SchemaMarkup.json_ld` (JSONField). The website integration (WordPress plugin, or a `<script type="application/ld+json">` snippet endpoint) is a separate integration concern — this skill only covers generation, not deployment/injection mechanics.

## Common mistakes to avoid

- Fabricating ratings, prices, or FAQ answers not present in the Knowledge Base — this is the single most damaging mistake for a product whose whole pitch is AI *trust*.
- Emitting multiple conflicting `@type: Organization` blocks on the same page — merge into one.
- Forgetting `priceCurrency` on Offer objects — many validators reject Product schema without it.
- Generating schema in a request/response cycle when it depends on an LLM call — dispatch via Celery like the knowledge base pipeline.
