import { Reveal } from "@/components/site/Reveal";
import type { Dict } from "@/lib/i18n";

export function Pricing({ t }: { t: Dict["pricing"] }) {
  return (
    <section id="pricing" className="relative mx-auto max-w-6xl px-6 py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-2/3 opacity-50"
        style={{
          background:
            "radial-gradient(55% 60% at 50% 50%, rgba(99,102,241,0.12), transparent 70%)",
        }}
      />
      <Reveal>
        <p className="eyebrow text-center">{t.eyebrow}</p>
        <h2 className="mt-4 text-center text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {t.h2pre} <span className="text-gradient">{t.h2accent}</span>
          {t.h2post && ` ${t.h2post}`}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted">{t.sub}</p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {t.plans.map((plan, i) => (
          <Reveal key={plan.name} delay={Math.min(i * 0.06, 0.24)}>
            <article
              className={`relative h-full rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                plan.featured
                  ? "border-indigo/60 bg-surface/60 shadow-[0_24px_80px_-32px_rgba(99,102,241,0.65)]"
                  : "border-line bg-surface/40 hover:border-indigo/40 hover:shadow-[0_20px_60px_-24px_rgba(99,102,241,0.45)]"
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-6 rounded-full bg-linear-to-r from-indigo to-cyan px-3 py-1 font-mono text-[10px] font-bold tracking-wider text-base uppercase">
                  {t.popular}
                </span>
              )}
              <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
              <p className="mt-3">
                <span className="font-mono text-4xl font-bold tabular-nums text-ink">
                  {plan.price}
                </span>
                <span className="text-sm text-muted">{plan.cadence}</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-muted">
                    <span aria-hidden className="text-cyan">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#early-access"
                className={`mt-6 block rounded-full py-2.5 text-center text-sm font-semibold transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${
                  plan.featured
                    ? "bg-linear-to-r from-indigo to-cyan text-base"
                    : "border border-line text-ink hover:bg-surface"
                }`}
              >
                {t.cta}
              </a>
            </article>
          </Reveal>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted">{t.note}</p>
    </section>
  );
}
