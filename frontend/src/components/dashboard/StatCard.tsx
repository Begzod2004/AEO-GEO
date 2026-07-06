import { Card } from "@/components/ui/Card";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/cn";
import { scoreBand, type MetricMeta } from "@/lib/metrics";
import { signed } from "@/lib/format";
import { RadialGauge } from "./RadialGauge";

export function StatCard({
  metric,
  value,
  delta,
  index = 0,
}: {
  metric: MetricMeta;
  value: number;
  /** Change vs the previous snapshot (points). */
  delta?: number | null;
  index?: number;
}) {
  const animated = useCountUp(value);
  const band = scoreBand(value);
  const hasDelta = typeof delta === "number" && delta !== 0;
  const up = (delta ?? 0) > 0;

  return (
    <Card
      className="group flex flex-col items-center gap-3 p-5 animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex w-full items-center justify-between">
        <span className="eyebrow">{metric.label}</span>
        <span
          className="inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[0.68rem] font-medium"
          style={{ color: `rgb(var(${band.varName}))`, background: `rgb(var(${band.varName}) / 0.12)` }}
        >
          {band.label}
        </span>
      </div>

      <RadialGauge value={animated} color={metric.color}>
        <div className="flex flex-col items-center">
          <span className="font-display text-stat-sm font-semibold tabular-nums text-text">
            {animated}
          </span>
          <span className="-mt-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-faint">
            / 100
          </span>
        </div>
      </RadialGauge>

      <div className="flex w-full items-center justify-between gap-2 text-xs">
        <p className="line-clamp-2 flex-1 text-muted">{metric.blurb}</p>
        {hasDelta && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 font-mono font-medium tabular-nums",
              up ? "text-good" : "text-poor",
            )}
            title={`${signed(delta ?? 0)} vs previous scan`}
          >
            <svg viewBox="0 0 12 12" className={cn("h-3 w-3", !up && "rotate-180")} aria-hidden>
              <path d="M6 2.5 10 8H2z" fill="currentColor" />
            </svg>
            {Math.abs(delta ?? 0)}
          </span>
        )}
      </div>
    </Card>
  );
}
