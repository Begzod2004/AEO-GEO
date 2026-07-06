import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Segment<T extends string> {
  value: T;
  label: ReactNode;
}

/** Accessible segmented control (radio-group semantics). */
export function Segmented<T extends string>({
  segments,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("inline-flex gap-1 rounded-control border bg-surface-2/50 p-1", className)}
    >
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            role="radio"
            aria-checked={active}
            type="button"
            onClick={() => onChange(s.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[0.45rem] px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-bg-elevated text-text shadow-sm"
                : "text-muted hover:text-text",
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
