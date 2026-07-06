import { EmailCapture } from "@/components/site/EmailCapture";
import type { Dict } from "@/lib/i18n";
import { GraphVisual } from "./GraphVisual";
import { TypingTerminal } from "./TypingTerminal";

export function Hero({ t, email }: { t: Dict["hero"]; email: Dict["email"] }) {
  return (
    <section className="mx-auto grid min-h-[92vh] max-w-6xl items-center gap-12 px-6 pt-28 pb-20 lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left: the thesis (server-rendered text for AEO) */}
      <div>
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="mt-5 font-sans text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-[1.03] tracking-[-0.03em] text-ink">
          {t.h1pre} <span className="text-gradient">{t.h1accent}</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          {t.sub}
        </p>

        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <EmailCapture t={email} />
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors hover:text-cyan"
          >
            {t.seeHow}
            <span aria-hidden>↓</span>
          </a>
        </div>

        <div className="mt-8 max-w-md">
          <TypingTerminal lines={t.terminal} />
        </div>
      </div>

      {/* Right: signature — interactive knowledge graph (3D on desktop) */}
      <div className="relative mx-auto aspect-square w-full max-w-[520px]">
        <GraphVisual brandLabel={t.brandLabel} ariaLabel={t.graphAria} />
      </div>
    </section>
  );
}
