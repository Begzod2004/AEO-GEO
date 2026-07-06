import { Reveal } from "@/components/site/Reveal";

/** Problem → solution narrative. A real sequence, so numbered steps carry
 *  information here. Pure HTML/SVG — no 3D. */
const STEPS: { title: string; body: string; tone: "problem" | "solution" }[] = [
  {
    title: "You have a website.",
    body: "Years of pages, products and expertise — written for people and Google.",
    tone: "problem",
  },
  {
    title: "AI doesn't understand it.",
    body: "Answer engines see scattered, unstructured text. So they guess — or skip you.",
    tone: "problem",
  },
  {
    title: "We crawl it.",
    body: "AEO.GEO imports your site and documents: pages, PDFs, product data.",
    tone: "solution",
  },
  {
    title: "We build your Knowledge Graph.",
    body: "Your content becomes clean, structured, machine-readable knowledge.",
    tone: "solution",
  },
  {
    title: "We optimize everything.",
    body: "FAQ, schema.org markup, structure — the language AI engines actually read.",
    tone: "solution",
  },
  {
    title: "AI starts recommending your brand.",
    body: "You're described accurately, cited as a source, and suggested in answers.",
    tone: "solution",
  },
];

export function ScrollStory() {
  return (
    <section id="how-it-works" className="mx-auto max-w-3xl px-6 py-28">
      <Reveal>
        <p className="eyebrow text-center">From invisible to recommended</p>
        <h2 className="mt-4 text-center text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          How your brand becomes <span className="text-gradient">AI-visible</span>
        </h2>
      </Reveal>

      <ol className="relative mt-16 space-y-14">
        {/* flow line */}
        <div
          aria-hidden
          className="absolute top-2 bottom-2 left-[15px] w-px bg-linear-to-b from-indigo/60 via-cyan/40 to-cyan/70"
        />
        {STEPS.map((step, i) => (
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
