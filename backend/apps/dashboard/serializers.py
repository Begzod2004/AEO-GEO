from rest_framework import serializers

from apps.dashboard.models import ScoreSnapshot


class ScoreSnapshotSerializer(serializers.ModelSerializer):
    """The exact shape used for both ``latest`` and each ``trend`` entry:
    a date plus the six 0–100 scores (no id / timestamps)."""

    class Meta:
        model = ScoreSnapshot
        fields = (
            "date", "ai_visibility_score", "geo_score", "aeo_score",
            "seo_score", "trust_score", "citation_score",
        )
        read_only_fields = fields
