import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconDocs, IconGlobe, IconSearch, IconText, IconUpload } from "@/components/ui/icons";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/context/ToastContext";
import { useApiData } from "@/hooks/useApiData";
import { usePolling } from "@/hooks/usePolling";
import { kbApi } from "@/lib/api";
import { apiError } from "@/lib/http";
import { formatDate } from "@/lib/format";
import type { KbDocument, KbSearchResult } from "@/types/api";

const SOURCE_ICON: Record<string, ReactNode> = {
  text: <IconText className="h-4 w-4" />,
  website: <IconGlobe className="h-4 w-4" />,
  pdf: <IconDocs className="h-4 w-4" />,
  docx: <IconDocs className="h-4 w-4" />,
  txt: <IconDocs className="h-4 w-4" />,
};

export function DocumentsPage() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg!.id;

  const { data, loading, error, refetch } = useApiData<KbDocument[]>(
    () => kbApi.list(orgId),
    [orgId],
  );
  const [docs, setDocs] = useState<KbDocument[]>([]);
  useEffect(() => {
    if (data) setDocs(data);
  }, [data]);

  const inProgress = useMemo(
    () => docs.filter((d) => d.status === "pending" || d.status === "processing"),
    [docs],
  );

  // Poll status for any documents still embedding.
  usePolling(
    async () => {
      const results = await Promise.all(
        inProgress.map((d) =>
          kbApi
            .status(orgId, d.id)
            .then((s) => ({ id: d.id, s }))
            .catch(() => null),
        ),
      );
      return results;
    },
    {
      enabled: inProgress.length > 0,
      interval: 2500,
      onTick: (results) =>
        setDocs((prev) =>
          prev.map((d) => {
            const r = results.find((x) => x && String(x.id) === String(d.id));
            return r ? { ...d, status: r.s.status, num_chunks: r.s.num_chunks, error: r.s.error } : d;
          }),
        ),
      done: (results) =>
        results.length > 0 &&
        results.every((r) => r && (r.s.status === "done" || r.s.status === "failed")),
    },
  );

  return (
    <div>
      <PageHeader
        eyebrow="Knowledge base"
        title="Documents"
        description="Everything the engines should know about you — imported, chunked and searchable."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div className="space-y-6">
          <DocumentUpload
            orgId={orgId}
            onUploaded={(doc) => setDocs((prev) => [doc, ...prev.filter((d) => d.id !== doc.id)])}
          />
          <KbSearch orgId={orgId} docs={docs} />
        </div>

        <Card className="p-5 sm:p-6">
          <CardHeader
            eyebrow={`${docs.length} document${docs.length === 1 ? "" : "s"}`}
            title="Your library"
            action={
              inProgress.length > 0 ? (
                <Badge tone="brand" dot>
                  {inProgress.length} processing
                </Badge>
              ) : null
            }
          />

          <div className="mt-5 space-y-2.5">
            {loading && docs.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[4.5rem]" />)
            ) : error && docs.length === 0 ? (
              <EmptyState
                icon={<IconDocs />}
                title="Couldn't load documents"
                description={error}
                action={<Button onClick={() => refetch(false)}>Try again</Button>}
              />
            ) : docs.length === 0 ? (
              <EmptyState
                icon={<IconUpload />}
                title="No documents yet"
                description="Import pasted text, a website URL or a file to build your knowledge base."
              />
            ) : (
              docs.map((doc) => <DocumentRow key={doc.id} doc={doc} />)
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function DocumentRow({ doc }: { doc: KbDocument }) {
  const processing = doc.status === "pending" || doc.status === "processing";
  return (
    <div className="rounded-control border bg-surface-2/30 p-3.5 animate-fade-in">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-surface-2 text-muted">
          {SOURCE_ICON[doc.source_type] ?? <IconDocs className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="truncate text-sm font-medium text-text">{doc.title}</p>
            <StatusBadge status={doc.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="font-mono uppercase tracking-wide">{doc.source_type}</span>
            {doc.status === "done" && (
              <span className="tabular-nums">{doc.num_chunks} chunks</span>
            )}
            {doc.created_at && <span>{formatDate(doc.created_at)}</span>}
          </div>
          {processing && (
            <div className="mt-2.5">
              <Progress indeterminate />
              <p className="mt-1 font-mono text-[0.7rem] text-faint">
                {doc.status === "pending" ? "Queued for embedding…" : "Extracting & embedding…"}
              </p>
            </div>
          )}
          {doc.status === "failed" && doc.error && (
            <p className="mt-1.5 text-xs text-poor">{doc.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function KbSearch({ orgId, docs }: { orgId: string | number; docs: KbDocument[] }) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KbSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  const titleFor = (id: string | number) =>
    docs.find((d) => String(d.id) === String(id))?.title ?? `Document ${id}`;

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await kbApi.search(orgId, { query: query.trim(), top_k: 5 });
      setResults(res.results);
    } catch (err) {
      toast.error("Search failed", apiError(err));
    } finally {
      setSearching(false);
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader eyebrow="Semantic search" title="Ask your knowledge base">
        <p className="mt-1 text-sm text-muted">Retrieve the most relevant chunks by meaning.</p>
      </CardHeader>
      <form onSubmit={onSearch} className="mt-4 flex gap-2">
        <Input
          placeholder="e.g. How does pricing work?"
          iconLeft={<IconSearch />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" loading={searching}>
          Search
        </Button>
      </form>

      {results && (
        <div className="mt-4 space-y-2">
          {results.length === 0 ? (
            <p className="rounded-control border border-dashed px-3 py-4 text-sm text-muted">
              No matching passages. Try importing more documents.
            </p>
          ) : (
            results.map((r, i) => (
              <div key={i} className="rounded-control border bg-surface-2/30 p-3">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-text">{titleFor(r.document_id)}</span>
                  <span className="shrink-0 font-mono text-[0.7rem] text-brand">
                    {(r.score * 100).toFixed(0)}% match
                  </span>
                </div>
                <p className="line-clamp-3 text-xs leading-relaxed text-muted">{r.text}</p>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}
