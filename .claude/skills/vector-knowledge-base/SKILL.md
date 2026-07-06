---
name: vector-knowledge-base
description: Use this skill whenever implementing document import, text extraction, chunking, embeddings, or Qdrant vector storage for the AEO.GEO Knowledge Base module. Trigger for tasks involving uploading PDF/DOCX/website content, splitting text into chunks, generating embeddings, or searching/retrieving relevant chunks — even if the user just says "add file upload" or "make search work over our docs."
---

# Vector Knowledge Base (chunking → embedding → Qdrant)

This skill covers the AEO.GEO `knowledge_base` app pipeline: raw document → clean text → chunks → embeddings → Qdrant collection, one collection per organization for isolation.

## Pipeline overview

```
Document uploaded (PDF/DOCX/website/CSV/...)
   → extract_text()          (format-specific extractor)
   → status = "processing"
   → chunk_text()            (~500-800 tokens per chunk, ~100 token overlap)
   → embed_chunks()          (OpenAI text-embedding-3-small, or local via Ollama for cost control)
   → upsert to Qdrant         (collection = f"org_{organization_id}")
   → save Chunk rows with embedding_vector_id pointing to the Qdrant point
   → status = "done"
```

Run this as a Celery task, never synchronously in the request/response cycle — extraction + embedding of a large doc can take tens of seconds.

## Text extraction (dispatch by source_type)

```python
def extract_text(document) -> str:
    if document.source_type == "pdf":
        import pdfplumber
        with pdfplumber.open(document.file.path) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    elif document.source_type == "docx":
        import docx
        d = docx.Document(document.file.path)
        return "\n".join(p.text for p in d.paragraphs)
    elif document.source_type == "website":
        import trafilatura
        downloaded = trafilatura.fetch_url(document.source_url)
        return trafilatura.extract(downloaded) or ""
    # csv/xlsx/json: flatten rows into descriptive sentences, don't dump raw tabular data
    raise ValueError(f"Unsupported source_type: {document.source_type}")
```

`trafilatura` is strongly preferred over raw BeautifulSoup for website extraction — it already strips nav/footer/ads and keeps main content, which matters a lot for AEO/GEO signal quality.

## Chunking

Use a simple recursive/token-aware splitter — don't over-engineer this for MVP:

```python
import tiktoken

def chunk_text(text: str, max_tokens=700, overlap=100) -> list[str]:
    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text)
    chunks = []
    start = 0
    while start < len(tokens):
        end = start + max_tokens
        chunks.append(enc.decode(tokens[start:end]))
        start = end - overlap
    return chunks
```

Split on paragraph/sentence boundaries where possible before falling back to hard token cuts — avoids cutting mid-sentence, which hurts embedding quality.

## Embeddings + Qdrant

```python
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance

client = QdrantClient(url=settings.QDRANT_URL)

def ensure_collection(organization_id: int):
    name = f"org_{organization_id}"
    if not client.collection_exists(name):
        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
        )
    return name

def embed_and_store(document, chunks: list[str]):
    collection = ensure_collection(document.organization_id)
    embeddings = get_embeddings(chunks)  # batch call to embedding provider
    points = []
    for i, (chunk_text, vector) in enumerate(zip(chunks, embeddings)):
        point_id = str(uuid.uuid4())
        points.append(PointStruct(
            id=point_id,
            vector=vector,
            payload={"document_id": document.id, "text": chunk_text[:200]}
        ))
        Chunk.objects.create(
            document=document, content=chunk_text,
            embedding_vector_id=point_id, token_count=len(chunk_text.split())
        )
    client.upsert(collection_name=collection, points=points)
```

## Retrieval (for AI Agent / Content Studio to pull relevant context later)

```python
def search_knowledge_base(organization_id: int, query: str, top_k=5):
    collection = f"org_{organization_id}"
    query_vector = get_embeddings([query])[0]
    hits = client.search(collection_name=collection, query_vector=query_vector, limit=top_k)
    return [h.payload["text"] for h in hits]
```

## Common mistakes to avoid

- One shared Qdrant collection for all organizations without a payload filter — always isolate per-org via collection name (simplest for MVP) or a mandatory `organization_id` payload filter if using a single collection later.
- Doing extraction + embedding synchronously in the upload API view — always dispatch to Celery and let the client poll `/documents/{id}/status/`.
- Dumping raw CSV/XLSX rows as chunk text verbatim — convert rows into short natural-language sentences first, since embeddings and downstream LLM prompts work far better on prose than raw tabular dumps.
- Re-embedding unchanged documents on every sync — hash the source content and skip if unchanged.
