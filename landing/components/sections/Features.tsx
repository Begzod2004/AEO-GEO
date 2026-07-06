import { Reveal } from "@/components/site/Reveal";

const FEATURES: { title: string; body: string; glyph: string }[] = [
  {
    glyph: "⌖",
    title: "Crawl & Import",
    body: "Connect your site and upload documents — pages, PDFs, product data become one knowledge source.",
  },
  {
    glyph: "◈",
    title: "Knowledge Base",
    body: "Your content is cleaned, chunked and embedded into a structured, queryable knowledge graph.",
  },
  {
    glyph: "{ }",
    title: "Schema Generation",
    body: "FAQ, Organization and product schema.org markup generated from your real content — never invented.",
  },
  {
    glyph: "◉",
    title: "AI Monitoring",
    body: "Real questions run against ChatGPT, Gemini, Claude and more — tracking mentions, sentiment and citations.",
  },
  {
    glyph: "▥",
    title: "Visibility Scores",
    body: "Six transparent 0-100 scores show exactly how AI sees your brand — and why.",
  },
  {
    glyph: "↗",
    title: "AI Recommendations",
    body: "Prioritized fixes that raise your scores: missing answers, weak structure, uncited claims.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <p className="eyebrow text-center">The toolkit</p>
        <h2 className="mt-4 text-center text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Everything your brand needs to be{" "}
          <span className="text-gradient">machine-understood</span>
        </h2>
      </Reveal>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={Math.min(i * 0.06, 0.3)}>
            <article className="group h-full rounded-3xl border border-line bg-surface/40 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo/40 hover:shadow-[0_20px_60px_-24px_rgba(99,102,241,0.5)]">
              <span
                aria-hidden
                className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-base/60 font-mono text-base text-cyan"
              >
                {f.glyph}
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-ink">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
