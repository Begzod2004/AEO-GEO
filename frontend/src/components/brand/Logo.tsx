import { cn } from "@/lib/cn";
import { METRICS } from "@/lib/metrics";

/** The AEO.GEO mark: six spectrum bars — the "signal spectrum" in miniature. */
export function LogoMark({ className }: { className?: string }) {
  const heights = [10, 16, 22, 18, 24, 14];
  return (
    <svg viewBox="0 0 30 26" className={cn("h-6 w-7", className)} aria-hidden>
      {METRICS.map((m, i) => (
        <rect
          key={m.key}
          x={i * 5 + 0.5}
          y={26 - heights[i]}
          width={3.4}
          height={heights[i]}
          rx={1.6}
          fill={m.color}
        />
      ))}
    </svg>
  );
}

export function Logo({ className, collapsed }: { className?: string; collapsed?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {!collapsed && (
        <span className="font-display text-[1.05rem] font-bold tracking-tight text-text">
          AEO<span className="text-brand">.</span>GEO
        </span>
      )}
    </span>
  );
}
