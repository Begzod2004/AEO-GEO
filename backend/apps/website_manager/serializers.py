from rest_framework import serializers

from apps.website_manager.models import CrawlResult


class CrawlResultSerializer(serializers.ModelSerializer):
    domain_url = serializers.CharField(source="domain.url", read_only=True)

    class Meta:
        model = CrawlResult
        fields = (
            "id", "domain", "domain_url", "status",
            "crawled_at", "meta", "error", "created_at",
        )
        read_only_fields = fields
