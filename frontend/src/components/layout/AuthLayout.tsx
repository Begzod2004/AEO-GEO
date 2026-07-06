import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { METRICS } from "@/lib/metrics";

const ENGINES = ["ChatGPT", "Claude", "Gemini", "Perplexity"];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand / atmosphere panel */}
      <aside className="relative hidden overflow-hidden border-r bg-bg-elevated lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="grid-texture absolute inset-0 opacity-50" aria-hidden />
        <div
          className="pointer-events-none absolute -left-20 top-1/3 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgb(var(--brand)/0.25), transparent 70%)" }}
          aria-hidden
        />
        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-md">
          <div className="mb-8 flex h-28 items-end gap-2.5">
            {METRICS.map((m, i) => (
              <div key={m.key} className="flex-1">
                <div
                  className="w-full rounded-md animate-fade-up"
                  style={{
                    height: `${[45, 78, 60, 92, 70, 52][i]}%`,
                    minHeight: "1.5rem",
                    background: `linear-gradient(to top, ${m.color}, ${m.color}aa)`,
                    boxShadow: `0 0 24px -4px ${m.color}77`,
                    animationDelay: `${i * 90}ms`,
                  }}
                />
              </div>
            ))}
          </div>
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-text">
            See yourself the way the machines do.
          </h2>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">
            AEO.GEO reads the answer spectrum across the engines your customers ask —
            and turns every mention, citation and sentiment into a score you can move.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {ENGINES.map((e) => (
              <span
                key={e}
                className="rounded-pill border bg-surface/60 px-3 py-1 font-mono text-xs text-muted"
              >
                {e}
              </span>
            ))}
          </div>
        </div>

        <p className="relative font-mono text-xs text-faint">
          Answer & Generative Engine Optimization
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
