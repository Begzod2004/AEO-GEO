import { useEffect, useRef, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconCheck, IconSchema, IconSparkles, IconX } from "@/components/ui/icons";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/context/ToastContext";
import { useApiData } from "@/hooks/useApiData";
import { PublishCard } from "@/components/schema/PublishCard";
import { schemaApi } from "@/lib/api";
import { apiError } from "@/lib/http";
import { formatDate } from "@/lib/format";
import type { SchemaMarkup } from "@/types/api";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function SchemaPage() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg!.id;
  const toast = useToast();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const { data, loading, error, refetch, setData } = useApiData<SchemaMarkup[]>(
    () => schemaApi.list(orgId),
    [orgId],
  );

  const [schemaType, setSchemaType] = useState<"all" | "faq" | "organization">("all");
  const [url, setUrl] = useState("");
  const [generating, setGenerating] = useState(false);

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    setGenerating(true);
    const base = data?.length ?? 0;
    try {
      await schemaApi.generate(orgId, {
        schema_type: schemaType,
        applied_to_url: url.trim() || undefined,
      });
      toast.info("Generating schema", "Building JSON-LD from your knowledge base…");
      let done = false;
      for (let i = 0; i < 15 && !done; i++) {
        await sleep(2500);
        if (!mounted.current) return;
        const fresh = await schemaApi.list(orgId);
        setData(() => fresh);
        if (fresh.length > base) done = true;
      }
      if (done) toast.success("Schema ready", "Your structured data was generated.");
      else toast.info("Still generating", "New markup will appear once it's ready.");
    } catch (err) {
      toast.error("Couldn't generate schema", apiError(err));
    } finally {
      if (mounted.current) setGenerating(false);
    }
  }

  const items = data ?? [];

  const latestValid = (data ?? []).find((m) => m.is_valid && m.json_ld);
  const jsonLdSnippet = latestValid
    ? `<script type="application/ld+json">\n${JSON.stringify(latestValid.json_ld, null, 2)}\n</script>`
    : null;

  return (
    <div>
      <PageHeader
        eyebrow="AI optimization"
        title="Schema"
        description="Generate schema.org structured data so engines can read your pages with confidence. Valid FAQ and Organization markup lifts your AEO score."
      />

      <div className="mb-6">
        <PublishCard orgId={orgId} jsonLdSnippet={jsonLdSnippet} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Card className="h-fit p-5 sm:p-6">
          <CardHeader eyebrow="Generate" title="New structured data" />
          <form onSubmit={onGenerate} className="mt-4 space-y-4">
            <Select
              label="Schema type"
              value={schemaType}
              onChange={(e) => setSchemaType(e.target.value as typeof schemaType)}
            >
              <option value="all">All (FAQ + Organization)</option>
              <option value="faq">FAQ</option>
              <option value="organization">Organization</option>
            </Select>
            <Input
              label="Applied to URL"
              type="url"
              placeholder="https://yourbrand.com/faq"
              hint="Optional — where this markup will live."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button type="submit" loading={generating} iconLeft={<IconSparkles className="h-4 w-4" />}>
              Generate schema
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          {loading && items.length === 0 ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-card" />)
          ) : error && items.length === 0 ? (
            <Card className="p-8">
              <EmptyState icon={<IconSchema />} title="Couldn't load schema" description={error} action={<Button onClick={() => refetch(false)}>Try again</Button>} />
            </Card>
          ) : items.length === 0 ? (
            <Card className="p-8">
              <EmptyState
                icon={<IconSchema />}
                title="No schema yet"
                description="Generate FAQ or Organization markup to make your pages machine-readable."
              />
            </Card>
          ) : (
            items.map((item) => <SchemaCard key={item.id} item={item} />)
          )}
        </div>
      </div>
    </div>
  );
}

function SchemaCard({ item }: { item: SchemaMarkup }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const json = JSON.stringify(item.json_ld ?? {}, null, 2);

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      toast.success("Copied", "JSON-LD copied to clipboard.");
    } catch {
      toast.error("Copy failed", "Your browser blocked clipboard access.");
    }
  }

  return (
    <Card className="p-5 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-brand/12 text-brand">
            <IconSchema className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold capitalize text-text">
              {item.schema_type} schema
            </p>
            {item.applied_to_url && (
              <p className="truncate font-mono text-[0.7rem] text-faint">{item.applied_to_url}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.is_valid ? (
            <Badge tone="good">
              <IconCheck className="h-3 w-3" /> Valid
            </Badge>
          ) : (
            <Badge tone="poor">
              <IconX className="h-3 w-3" /> Invalid
            </Badge>
          )}
          <StatusBadge status={item.status} />
        </div>
      </div>

      {!item.is_valid && item.validation_errors && item.validation_errors.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-control border border-poor/25 bg-poor/5 p-3">
          {item.validation_errors.map((err, i) => (
            <li key={i} className="text-xs text-poor">
              {err}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "View"} JSON-LD
        </Button>
        <Button variant="ghost" size="sm" onClick={copy}>
          Copy
        </Button>
        {item.created_at && (
          <span className="ml-auto font-mono text-[0.7rem] text-faint">{formatDate(item.created_at)}</span>
        )}
      </div>

      {open && (
        <pre className="mt-2 max-h-72 overflow-auto rounded-control border bg-bg p-3.5 font-mono text-xs leading-relaxed text-muted">
          {json}
        </pre>
      )}
    </Card>
  );
}
