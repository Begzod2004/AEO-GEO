"""Generate + validate schema.org markup as a Celery task (it depends on KB
retrieval / embeddings, so it runs off the request cycle)."""
from celery import shared_task

from apps.ai_optimization import generators, schema_builders
from apps.ai_optimization.models import SchemaMarkup


@shared_task
def generate_schema_task(markup_id: int):
    try:
        markup = SchemaMarkup.objects.select_related("organization").get(id=markup_id)
    except SchemaMarkup.DoesNotExist:
        return None

    org = markup.organization
    try:
        if markup.schema_type == SchemaMarkup.SchemaType.FAQ:
            pairs = generators.generate_faq_pairs(org)
            if not pairs:
                return _fail(
                    markup, "No Knowledge Base content to generate a grounded FAQ."
                )
            schema = schema_builders.build_faq_schema(pairs)

        elif markup.schema_type == SchemaMarkup.SchemaType.ORGANIZATION:
            profile = generators.build_org_profile(org)
            schema = schema_builders.build_organization_schema(profile)

        else:
            return _fail(markup, f"Unsupported schema_type: {markup.schema_type}")

        errors = schema_builders.validate_schema(schema)
        markup.json_ld = schema
        markup.validation_errors = errors
        markup.is_valid = not errors
        markup.status = (
            SchemaMarkup.Status.DONE if not errors else SchemaMarkup.Status.FAILED
        )
        markup.save()
        return markup.id

    except Exception as exc:
        return _fail(markup, str(exc))


def _fail(markup: SchemaMarkup, message: str) -> int:
    markup.status = SchemaMarkup.Status.FAILED
    markup.is_valid = False
    markup.validation_errors = [message]
    markup.save()
    return markup.id
