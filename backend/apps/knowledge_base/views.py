"""Knowledge Base endpoints: upload a document, poll its status, semantic search.
All org-scoped; each org's vectors live in its own Qdrant collection."""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.knowledge_base import qdrant_store
from apps.knowledge_base.embeddings import get_embedder
from apps.knowledge_base.models import Document
from apps.knowledge_base.serializers import (
    DocumentCreateSerializer,
    DocumentSerializer,
    SearchSerializer,
)
from apps.knowledge_base.tasks import process_document_task
from apps.organizations.permissions import IsOrgMember


class DocumentViewSet(viewsets.ModelViewSet):
    """Nested under /api/organizations/{organization_pk}/documents/."""

    permission_classes = [IsAuthenticated, IsOrgMember]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return Document.objects.filter(
            organization_id=self.kwargs["organization_pk"]
        )

    def get_serializer_class(self):
        return DocumentCreateSerializer if self.action == "create" else DocumentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.save(
            organization_id=self.kwargs["organization_pk"]
        )
        # Ingest off the request cycle; client polls the status endpoint.
        process_document_task.delay(document.id)
        document.refresh_from_db()  # eager mode (tests) already processed it
        return Response(
            DocumentSerializer(document).data, status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["get"], url_path="status")
    def doc_status(self, request, pk=None, organization_pk=None):
        doc = self.get_object()
        return Response(
            {
                "id": doc.id,
                "status": doc.status,
                "num_chunks": doc.num_chunks,
                "error": doc.error,
            }
        )

    @action(detail=False, methods=["post"], url_path="search")
    def search(self, request, organization_pk=None):
        serializer = SearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        query = serializer.validated_data["query"]
        top_k = serializer.validated_data["top_k"]

        vector = get_embedder().embed([query])[0]
        hits = qdrant_store.search(int(organization_pk), vector, top_k=top_k)
        return Response(
            {
                "query": query,
                "results": [
                    {
                        "score": round(h["score"], 4),
                        "document_id": h["payload"].get("document_id"),
                        "text": h["payload"].get("text", ""),
                    }
                    for h in hits
                ],
            }
        )
