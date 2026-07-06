from rest_framework import serializers

from apps.knowledge_base.models import Chunk, Document


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = (
            "id", "source_type", "title", "source_url",
            "status", "num_chunks", "error", "created_at",
        )
        read_only_fields = fields


class DocumentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ("id", "source_type", "title", "source_url", "raw_text", "file")

    def validate(self, attrs):
        st = attrs.get("source_type")
        Source = Document.SourceType
        if st == Source.TEXT and not attrs.get("raw_text"):
            raise serializers.ValidationError({"raw_text": "Required for text source."})
        if st == Source.WEBSITE and not attrs.get("source_url"):
            raise serializers.ValidationError({"source_url": "Required for website."})
        if st in (Source.TXT, Source.PDF, Source.DOCX) and not attrs.get("file"):
            raise serializers.ValidationError({"file": "A file upload is required."})
        return attrs


class ChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chunk
        fields = ("id", "content", "token_count", "language")


class SearchSerializer(serializers.Serializer):
    query = serializers.CharField()
    top_k = serializers.IntegerField(default=5, min_value=1, max_value=20)
