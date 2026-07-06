from rest_framework import serializers

from apps.ai_monitoring.models import Prompt, ScanResult


class PromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prompt
        fields = ("id", "text", "category", "created_at")
        read_only_fields = ("id", "created_at")


class ScanResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanResult
        fields = (
            "id", "prompt", "provider", "is_mentioned", "sentiment",
            "citation_sources", "response_text", "scanned_at",
        )
        read_only_fields = fields
