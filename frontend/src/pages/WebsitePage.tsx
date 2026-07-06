import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconCheck, IconGlobe, IconRefresh, IconScan, IconX } from "@/components/ui/icons";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/context/ToastContext";
import { useApiData } from "@/hooks/useApiData";
import { orgApi, websiteApi } from "@/lib/api";
import { apiError } from "@/lib/http";
import { formatDate } from "@/lib/format";
import { scoreBand } from "@/lib/metrics";
import { cn } from "@/lib/cn";
import type { CrawlResult, Domain } from "@/types/api";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Flag({ ok, label }: { ok?: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-medium",
        ok ? "border-good/25 bg-good/10 text-good" : "border-line/50 bg-surface-2 text-muted",
      )}
    >
      {ok ? <IconCheck className="h-3 w-3" /> : <IconX className="h-3 w-3" />}
      {label}
    </span>
  );
}

export function WebsitePage() {
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

  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainId, setDomainId] = useState<string>("");
  useEffect(() => {
    orgApi.domains(orgId).then((d) => {
      setDomains(d);
      const primary = d.find((x) => x.is_primary) ?? d[0];
      if (primary) setDomainId(String(primary.id));
    });
  }, [orgId]);

  const { data, loading, error, refetch, setData } = useApiData<CrawlResult[]>(
    () => websiteApi.results(orgId),
    [orgId],
  );
  const [crawling, setCrawling] = useState(false);

  async function runCrawl() {
    setCrawling(true);
    const base = data?.length ?? 0;
    try {
      await websiteApi.crawl(orgId, domainId ? { domain_id: domainId } : {});
      toast.info("Crawl started", "Fetching and analyzing your site…");
      let done = false;
      for (let i = 0; i < 20 && !done; i++) {
        await sleep(3000);
        if (!mounted.current) return;
        const fresh = await websiteApi.results(orgId);
        setData(() => fresh);
        if (fresh.length > base) done = true;
      }
      if (done) toast.success("Crawl complete", "Latest site analysis is ready.");
      else toast.info("Crawl still running", "Results will appear once it finishes.");
    } catch (err) {
      toast.error("Crawl failed", apiError(err));
    } finally {
      if (mounted.current) setCrawling(false);
    }
  }

  const results = data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Website manager"
        title="Website"
        description="Crawl your site for the technical signals that feed your SEO and answer-engine scores."
        actions={
          <div className="flex items-center gap-2">
            {domains.length > 1 && (
              <Select
                aria-label="Domain to crawl"
                value={domainId}
                onChange={(e) => setDomainId(e.target.value)}
                className="h-9 w-48"
              >
                {domains.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.url}
                  </option>
                ))}
              </Select>
            )}
            <Button onClick={runCrawl} loading={crawling} iconLeft={<IconScan className="h-4 w-4" />}>
              {crawling ? "Crawling" : "Run crawl"}
            </Button>
            <Button variant="ghost" size="md" onClick={() => refetch(false)} iconLeft={<IconRefresh className="h-4 w-4" />}>
              Refresh
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        {loading && results.length === 0 ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-card" />)
        ) : error && results.length === 0 ? (
          <Card className="p-8">
            <EmptyState icon={<IconGlobe />} title="Couldn't load crawl results" description={error} action={<Button onClick={() => refetch(false)}>Try again</Button>} />
          </Card>
        ) : results.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={<IconGlobe />}
              title="No crawls yet"
              description="Run your first crawl to analyze meta tags, robots, sitemap, links and performance."
              action={<Button onClick={runCrawl} loading={crawling}>Run crawl</Button>}
            />
          </Card>
        ) : (
          results.map((r) => <CrawlCard key={r.id} result={r} />)
        )}
      </div>
    </div>
  );
}

function CrawlCard({ result }: { result: CrawlResult }) {
  const m = result.meta ?? {};
  const perf = m.performance_score ?? 0;
  const band = scoreBand(perf);
  const broken = m.broken_links ?? [];

  return (
    <Card className="p-5 sm:p-6 animate-fade-up">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <IconGlobe className="h-4 w-4 text-muted" />
            <h3 className="truncate font-display text-base font-semibold text-text">
              {m.title || "Untitled page"}
            </h3>
          </div>
          {m.meta_description && <p className="max-w-2xl text-sm text-muted">{m.meta_description}</p>}
          {m.canonical && (
            <p className="mt-1.5 truncate font-mono text-xs text-faint">{m.canonical}</p>
          )}
          {result.created_at && (
            <p className="mt-2 font-mono text-[0.7rem] text-faint">Crawled {formatDate(result.created_at)}</p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="eyebrow">Performance</p>
          <p
            className="font-display text-3xl font-bold tabular-nums"
            style={{ color: `rgb(var(${band.varName}))` }}
          >
            {perf}
            <span className="ml-0.5 font-mono text-sm text-faint">/100</span>
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
        <Flag ok={m.has_robots} label="robots.txt" />
        <Flag ok={m.has_sitemap} label="sitemap.xml" />
        <Badge tone="neutral">{m.links_total ?? 0} links</Badge>
        {broken.length > 0 ? (
          <Badge tone="poor" dot>
            {broken.length} broken
          </Badge>
        ) : (
          <Badge tone="good" dot>
            No broken links
          </Badge>
        )}
      </div>

      {broken.length > 0 && (
        <ul className="mt-3 space-y-1">
          {broken.slice(0, 5).map((link) => (
            <li key={link} className="truncate font-mono text-xs text-poor/90">
              {link}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
