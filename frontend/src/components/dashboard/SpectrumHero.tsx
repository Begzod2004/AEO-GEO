import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconScan, IconSparkles } from "@/components/ui/icons";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/cn";
import { METRICS, scoreBand } from "@/lib/metrics";
import { timeAgo, signed } from "@/lib/format";
import type { ScoreSnapshot } from "@/types/api";

export function SpectrumHero({
  orgName,
  latest,
  previous,
  lastScannedAt,
  scanning,
  generating,
  onScan,
  onGenerate,
}: {
  orgName: string;
  latest: ScoreSnapshot;
  previous?: ScoreSnapshot;
  lastScannedAt?: string | null;
  scanning: boolean;
  generating: boolean;
  onScan: () => void;
  onGenerate: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  const visibility = latest.ai_visibility_score;
  const animatedVisibility = useCountUp(visibility);
  const band = scoreBand(visibility);
  const delta = previous ? visibility - previous.ai_visibility_score : null;

  return (
    <section className="relative overflow-hidden rounded-card border bg-surface shadow-card">
      <div className="grid-texture absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgb(var(--brand)/0.22), transparent 70%)" }}
        aria-hidden
      />
      {scanning && (
        <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden" aria-hidden>
          <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-brand to-transparent" />
        </div>
      )}

      <div className="relative grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:p-8">
        {/* Left: the headline signal */}
        <div className="flex flex-col justify-between gap-6">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" />
              Signal spectrum · {orgName}
            </p>
            <div className="mt-4 flex items-end gap-3">
              <span className="font-display text-hero font-bold leading-none tabular-nums text-text">
                {animatedVisibility}
              </span>
              <span className="mb-2 font-mono text-sm text-faint">/100</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">Overall AI Visibility</span>
              <span
                className="inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-medium"
                style={{ color: `rgb(var(${band.varName}))`, background: `rgb(var(${band.varName}) / 0.12)` }}
              >
                {band.label}
              </span>
              {typeof delta === "number" && delta !== 0 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-mono text-xs font-medium tabular-nums",
                    delta > 0 ? "text-good" : "text-poor",
                  )}
                >
                  <svg viewBox="0 0 12 12" className={cn("h-3 w-3", delta < 0 && "rotate-180")} aria-hidden>
                    <path d="M6 2.5 10 8H2z" fill="currentColor" />
                  </svg>
                  {signed(delta)} pts
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-mono text-xs text-faint">
              Last scan {timeAgo(lastScannedAt ?? latest.date)}
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Button onClick={onScan} loading={scanning} iconLeft={<IconScan className="h-4 w-4" />}>
                {scanning ? "Scanning engines" : "Run scan"}
              </Button>
              <Button
                variant="secondary"
                onClick={onGenerate}
                loading={generating}
                iconLeft={<IconSparkles className="h-4 w-4" />}
              >
                Generate prompts
              </Button>
            </div>
          </div>
        </div>

        {/* Right: the spectrum bands (the signature readout) */}
        <div className="flex flex-col justify-end">
          <div className="flex h-44 items-end gap-2 sm:gap-3">
            {METRICS.map((m, i) => {
              const score = latest[m.key];
              const h = mounted ? `${Math.max(4, score)}%` : "0%";
              return (
                <div key={m.key} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="font-mono text-xs font-medium tabular-nums text-text/90">{score}</span>
                  <div className="relative flex w-full flex-1 items-end overflow-hidden rounded-lg bg-surface-2/50">
                    <div
                      className="w-full rounded-lg transition-[height] duration-[900ms] ease-emphasized"
                      style={{
                        height: h,
                        transitionDelay: `${i * 70}ms`,
                        background: `linear-gradient(to top, ${m.color}, ${m.color}bb)`,
                        boxShadow: `0 0 18px -2px ${m.color}66`,
                      }}
                    />
                  </div>
                  <span className="text-center font-mono text-[0.62rem] uppercase tracking-wide text-muted">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
