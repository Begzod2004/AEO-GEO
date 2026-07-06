import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconRefresh, IconScan, IconSparkles, IconWaveform } from "@/components/ui/icons";
import { SpectrumHero } from "@/components/dashboard/SpectrumHero";
import { StatCard } from "@/components/dashboard/StatCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { SummaryStrip } from "@/components/dashboard/SummaryStrip";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/context/ToastContext";
import { useApiData } from "@/hooks/useApiData";
import { orgApi, promptApi, scanApi } from "@/lib/api";
import { apiError } from "@/lib/http";
import { METRICS } from "@/lib/metrics";
import type { DashboardResponse } from "@/types/api";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function DashboardPage() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg!.id;
  const toast = useToast();
  const mounted = useRef(true);

  const { data, loading, error, refetch, setData } = useApiData<DashboardResponse>(
    () => orgApi.dashboard(orgId),
    [orgId],
  );

  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function handleScan() {
    setScanning(true);
    const baseResults = data?.summary.scan_results ?? 0;
    const baseDate = data?.latest?.date ?? null;
    try {
      await scanApi.run(orgId);
      toast.info("Scan started", "Querying engines across your prompt library…");
      let done = false;
      for (let i = 0; i < 30 && !done; i++) {
        await sleep(2000);
        if (!mounted.current) return;
        const fresh = await orgApi.dashboard(orgId);
        setData(() => fresh);
        const gotNew =
          (fresh.summary.scan_results ?? 0) > baseResults ||
          (!!fresh.latest && fresh.latest.date !== baseDate);
        if (gotNew) done = true;
      }
      if (done) toast.success("Scan complete", "Your visibility scores are updated.");
      else toast.info("Still scanning", "Scores will refresh automatically when the run finishes.");
    } catch (err) {
      toast.error("Scan failed", apiError(err));
    } finally {
      if (mounted.current) setScanning(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const prompts = await promptApi.generate(orgId);
      await refetch(true);
      toast.success(
        "Starter prompts generated",
        `${prompts.length} prompts added across brand, product and comparison.`,
      );
    } catch (err) {
      toast.error("Couldn't generate prompts", apiError(err));
    } finally {
      if (mounted.current) setGenerating(false);
    }
  }

  const latest = data?.latest ?? null;
  const trend = data?.trend ?? [];
  const previous = trend.length >= 2 ? trend[trend.length - 2] : undefined;

  return (
    <div>
      <PageHeader
        eyebrow={currentOrg?.name}
        title="Dashboard"
        description="How AI answer engines see your brand — visibility, trust and citations at a glance."
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch(false)}
            iconLeft={<IconRefresh className="h-4 w-4" />}
          >
            Refresh
          </Button>
        }
      />

      {loading && !data ? (
        <DashboardSkeleton />
      ) : error && !data ? (
        <Card className="p-8">
          <EmptyState
            icon={<IconWaveform />}
            title="Couldn't load your dashboard"
            description={error}
            action={<Button onClick={() => refetch(false)}>Try again</Button>}
          />
        </Card>
      ) : !latest ? (
        <EmptyDashboard
          summary={data?.summary}
          scanning={scanning}
          generating={generating}
          onScan={handleScan}
          onGenerate={handleGenerate}
        />
      ) : (
        <div className="space-y-6">
          <SpectrumHero
            orgName={currentOrg?.name ?? "Your brand"}
            latest={latest}
            previous={previous}
            lastScannedAt={latest.date}
            scanning={scanning}
            generating={generating}
            onScan={handleScan}
            onGenerate={handleGenerate}
          />

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {METRICS.map((m, i) => (
              <StatCard
                key={m.key}
                metric={m}
                value={latest[m.key]}
                delta={previous ? latest[m.key] - previous[m.key] : null}
                index={i}
              />
            ))}
          </div>

          <Card className="p-5 sm:p-6">
            <CardHeader
              eyebrow="Last 30 snapshots"
              title="Score trend"
            >
              <p className="mt-1 text-sm text-muted">
                Track each metric over time. Toggle a series to focus.
              </p>
            </CardHeader>
            <div className="mt-5">
              {trend.length >= 2 ? (
                <TrendChart trend={trend} />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-control border border-dashed text-sm text-muted">
                  Run more scans to build a trend — you need at least two snapshots.
                </div>
              )}
            </div>
          </Card>

          {data?.summary && <SummaryStrip summary={data.summary} />}
        </div>
      )}
    </div>
  );
}

function EmptyDashboard({
  summary,
  scanning,
  generating,
  onScan,
  onGenerate,
}: {
  summary?: DashboardResponse["summary"];
  scanning: boolean;
  generating: boolean;
  onScan: () => void;
  onGenerate: () => void;
}) {
  const hasPrompts = (summary?.prompts ?? 0) > 0;
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-card border bg-surface p-8 shadow-card sm:p-12">
        <div className="grid-texture absolute inset-0 opacity-50" aria-hidden />
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgb(var(--brand)/0.2), transparent 70%)" }}
          aria-hidden
        />
        <div className="relative max-w-xl">
          {/* Flatline signal motif — "no signal yet" */}
          <svg viewBox="0 0 200 24" className="mb-6 h-6 w-40 text-faint" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M0 12h70l6-8 6 16 6-8h106" />
          </svg>
          <p className="eyebrow mb-2">No signal yet</p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Run your first scan
          </h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
            {hasPrompts
              ? "Your prompt library is ready. Run a scan to query the AI engines and compute your first set of visibility scores."
              : "Generate a starter set of prompts from your brand and industry, then run a scan to see how the engines answer."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {!hasPrompts && (
              <Button onClick={onGenerate} loading={generating} iconLeft={<IconSparkles className="h-4 w-4" />}>
                Generate starter prompts
              </Button>
            )}
            <Button
              variant={hasPrompts ? "primary" : "secondary"}
              onClick={onScan}
              loading={scanning}
              iconLeft={<IconScan className="h-4 w-4" />}
            >
              Run first scan
            </Button>
          </div>
        </div>
      </section>

      {summary && <SummaryStrip summary={summary} />}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 rounded-card" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-card" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-card" />
    </div>
  );
}
