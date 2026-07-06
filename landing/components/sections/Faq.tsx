import { Reveal } from "@/components/site/Reveal";
import type { Dict } from "@/lib/i18n";

/** Native <details>/<summary> accordion — accessible and fully functional with
 *  JavaScript disabled. The same FAQ data feeds the FAQPage JSON-LD. */
export function Faq({ t }: { t: Dict["faq"] }) {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-28">
      <Reveal>
        <p className="eyebrow text-center">{t.eyebrow}</p>
        <h2 className="mt-4 text-center text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {t.h2pre} <span className="text-gradient">{t.h2accent}</span>
          {t.h2post && ` ${t.h2post}`}
        </h2>
      </Reveal>

      <div className="mt-12 space-y-3">
        {t.items.map((item, i) => (
          <Reveal key={item.q} delay={Math.min(i * 0.05, 0.25)}>
            <details className="group rounded-2xl border border-line bg-surface/40 open:border-indigo/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-medium text-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden
                  className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="px-5 pb-5 leading-relaxed text-muted">{item.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
