"""Knowledge Base ingestion pipeline as a Celery task.

extract -> chunk -> embed (mock/live) -> upsert to Qdrant -> save Chunk rows.
Runs off the request cycle; the client polls the document status endpoint.
"""
import uuid

from celery import shared_task
from qdrant_client.models import PointStruct

from apps.knowledge_base import qdrant_store
from apps.knowledge_base.chunking import chunk_text, estimate_tokens
from apps.knowledge_base.embeddings import get_embedder
from apps.knowledge_base.extractor import detect_language, extract_text
from apps.knowledge_base.models import Chunk, Document


@shared_task
def process_document_task(document_id: int):
    try:
        doc = Document.objects.select_related("organization").get(id=document_id)
    except Document.DoesNotExist:
        return None

    doc.status = Document.Status.PROCESSING
    doc.save(update_fields=["status", "updated_at"])

    try:
        text = extract_text(doc)
        if not text.strip():
            raise ValueError("No extractable text found in the document.")

        doc.raw_text = text  # cache the extracted text
        chunks = chunk_text(text)
        language = detect_language(text)

        embedder = get_embedder()
        vectors = embedder.embed(chunks)

        # Fresh ingest: replace any prior chunks for this document.
        doc.chunks.all().delete()
        qdrant_store.ensure_collection(doc.organization_id)

        points, chunk_rows = [], []
        for content, vector in zip(chunks, vectors):
            point_id = str(uuid.uuid4())
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "organization_id": doc.organization_id,
                        "document_id": doc.id,
                        "text": content[:500],
                    },
                )
            )
            chunk_rows.append(
                Chunk(
                    document=doc,
                    content=content,
                    embedding_vector_id=point_id,
                    token_count=estimate_tokens(content),
                    language=language,
                )
            )

        Chunk.objects.bulk_create(chunk_rows)
        qdrant_store.upsert_points(doc.organization_id, points)

        doc.num_chunks = len(chunk_rows)
        doc.status = Document.Status.DONE
        doc.error = ""
        doc.save(update_fields=["raw_text", "num_chunks", "status", "error", "updated_at"])
        return doc.id

    except Exception as exc:
        doc.status = Document.Status.FAILED
        doc.error = str(exc)
        doc.save(update_fields=["status", "error", "updated_at"])
        return doc.id
