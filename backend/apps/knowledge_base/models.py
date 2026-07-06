"""Knowledge Base: raw documents and their embedded chunks.

The heart of the platform — a company's content becomes AI-readable context.
Each org's vectors live in their own Qdrant collection (``org_{id}``) for
isolation; the ``Chunk`` row keeps the Postgres <-> Qdrant link.
"""
from django.db import models

from apps.common.models import TimeStampedModel


class Document(TimeStampedModel):
    class SourceType(models.TextChoices):
        TEXT = "text", "Pasted text"
        WEBSITE = "website", "Website"
        PDF = "pdf", "PDF"
        DOCX = "docx", "DOCX"
        TXT = "txt", "Plain text file"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        DONE = "done", "Done"
        FAILED = "failed", "Failed"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="documents",
    )
    source_type = models.CharField(max_length=20, choices=SourceType.choices)
    title = models.CharField(max_length=255, blank=True)
    source_url = models.URLField(blank=True)          # for website
    file = models.FileField(upload_to="documents/", null=True, blank=True)
    raw_text = models.TextField(blank=True)           # pasted text / extraction cache
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.PENDING
    )
    error = models.TextField(blank=True)
    num_chunks = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return self.title or f"Document {self.pk}"


class Chunk(TimeStampedModel):
    document = models.ForeignKey(
        Document, on_delete=models.CASCADE, related_name="chunks"
    )
    content = models.TextField()
    embedding_vector_id = models.CharField(max_length=64)  # Qdrant point id (uuid)
    token_count = models.PositiveIntegerField(default=0)
    language = models.CharField(max_length=12, blank=True)

    def __str__(self):
        return f"Chunk {self.pk} of doc {self.document_id}"
