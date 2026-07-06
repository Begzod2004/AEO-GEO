import { Reveal } from "@/components/site/Reveal";
import type { Dict } from "@/lib/i18n";

/** Problem → solution narrative. A real sequence, so numbered steps carry
 *  information here. Pure HTML/SVG — no 3D. */
export function ScrollStory({ t }: { t: Dict["story"] }) {
  return (
    <section id="how-it-works" className="mx-auto max-w-3xl px-6 py-28">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {t.h2pre}{" "}
              <span className="underline decoration-cyan/60 decoration-2 underline-offset-8">
                {t.h2accent}
              </span>
              {t.h2post && ` ${t.h2post}`}
            </h2>
          </div>
          <p className="max-w-55 pb-1 text-sm leading-relaxed text-muted">
            {t.side}
          </p>
        </div>
      </Reveal>

      <ol className="relative mt-16 space-y-14">
        {/* flow line */}
        <div
          aria-hidden
          className="absolute top-2 bottom-2 left-[15px] w-px bg-linear-to-b from-indigo/60 via-cyan/40 to-cyan/70"
        />
        {t.steps.map((step, i) => (
          <li key={step.title} className="relative pl-14">
            <Reveal delay={Math.min(i * 0.07, 0.28)}>
              <span
                aria-hidden
                className={`absolute top-0.5 left-0 grid h-8 w-8 place-items-center rounded-full border font-mono text-xs ${
                  step.tone === "problem"
                    ? "border-line bg-surface text-muted"
                    : "border-cyan/40 bg-cyan/10 text-cyan"
                }`}
              >
                {i + 1}
              </span>
              <h3 className="text-xl font-semibold tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="mt-2 max-w-lg leading-relaxed text-muted">
                {step.body}
              </p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
