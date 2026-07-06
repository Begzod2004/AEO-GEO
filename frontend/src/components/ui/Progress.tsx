import { cn } from "@/lib/cn";

/** Determinate or indeterminate progress bar. */
export function Progress({
  value,
  indeterminate,
  className,
  tone = "brand",
}: {
  value?: number;
  indeterminate?: boolean;
  className?: string;
  tone?: "brand" | "good";
}) {
  const fill = tone === "good" ? "bg-good" : "bg-brand";
  return (
    <div
      className={cn("relative h-1.5 w-full overflow-hidden rounded-pill bg-surface-2", className)}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {indeterminate ? (
        <div className={cn("absolute inset-y-0 w-1/3 rounded-pill", fill)}>
          <div className="absolute inset-0 -skew-x-12 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
      ) : (
        <div
          className={cn("h-full rounded-pill transition-[width] duration-500 ease-emphasized", fill)}
          style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }}
        />
      )}
    </div>
  );
}
