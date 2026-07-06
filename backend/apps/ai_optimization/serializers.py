from rest_framework import serializers

from apps.ai_optimization.models import SchemaMarkup


class SchemaMarkupSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchemaMarkup
        fields = (
            "id", "schema_type", "json_ld", "applied_to_url",
            "status", "is_valid", "validation_errors", "created_at",
        )
        read_only_fields = fields


class GenerateSchemaSerializer(serializers.Serializer):
    # "all" generates both FAQ and Organization.
    schema_type = serializers.ChoiceField(
        choices=["all", "faq", "organization"], default="all"
    )
    applied_to_url = serializers.URLField(required=False, allow_blank=True)
