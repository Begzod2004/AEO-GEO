import { CountUp } from "@/components/site/CountUp";
import { Reveal } from "@/components/site/Reveal";
import type { Dict } from "@/lib/i18n";

/** Factual product-coverage numbers only — no invented usage stats (we have no
 *  customers to count yet, and honesty is the brand). */
export function FactsRow({ t }: { t: Dict["facts"] }) {
  return (
    <section aria-label="Product coverage" className="border-y border-line bg-surface/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 md:grid-cols-4">
        {t.items.map((f, i) => (
          <Reveal key={f.label} delay={Math.min(i * 0.06, 0.24)}>
            <div className="text-center">
              <p className="font-mono text-4xl font-bold tabular-nums text-ink">
                <CountUp value={f.value} suffix={f.suffix} />
              </p>
              <p className="mt-2 text-sm text-muted">{f.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
