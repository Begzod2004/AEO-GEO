import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "good" | "fair" | "poor" | "info";

const TONE: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-line/50",
  brand: "bg-brand/12 text-brand border-brand/25",
  good: "bg-good/12 text-good border-good/25",
  fair: "bg-fair/12 text-fair border-fair/25",
  poor: "bg-poor/12 text-poor border-poor/25",
  info: "bg-spectrum-geo/12 text-spectrum-geo border-spectrum-geo/25",
};

export function Badge({
  children,
  tone = "neutral",
  dot,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-medium",
        TONE[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
