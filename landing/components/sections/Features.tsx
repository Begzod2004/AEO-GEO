import { Reveal } from "@/components/site/Reveal";

/** Minimal stroke icons drawn for each capability — one visual family
 *  (24px grid, 1.5 stroke, rounded caps), tinted by the tile's cyan. */
const ICONS: Record<string, React.ReactNode> = {
  crawl: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 3.75v16.5M3.75 12h16.5" opacity=".45" />
      <path d="M12 12l5.2-3" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  kb: (
    <>
      <path d="M4 7.5 12 4l8 3.5-8 3.5-8-3.5Z" />
      <path d="M4 12l8 3.5 8-3.5" opacity=".65" />
      <path d="M4 16.5 12 20l8-3.5" opacity=".35" />
    </>
  ),
  schema: (
    <>
      <path d="M8.5 5.5 4 12l4.5 6.5" />
      <path d="M15.5 5.5 20 12l-4.5 6.5" />
      <path d="M13.2 4.5 10.8 19.5" opacity=".5" />
    </>
  ),
  monitor: (
    <>
      <path d="M3.5 12h3.4l2.1-5.5 3.6 11 2.3-5.5h5.6" />
      <circle cx="20.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  scores: (
    <>
      <path d="M4.5 19a8 8 0 1 1 15 0" />
      <path d="M12 19l3.6-5.4" />
      <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  recs: (
    <>
      <path d="M4 17.5 9.5 12l3.5 3.5L20 8" />
      <path d="M15.5 8H20v4.5" />
    </>
  ),
};

const FEATURES: { icon: keyof typeof ICONS; title: string; body: string }[] = [
  {
    icon: "crawl",
    title: "Crawl & Import",
    body: "Connect your site and upload documents — pages, PDFs, product data become one knowledge source.",
  },
  {
    icon: "kb",
    title: "Knowledge Base",
    body: "Your content is cleaned, chunked and embedded into a structured, queryable knowledge graph.",
  },
  {
    icon: "schema",
    title: "Schema Generation",
    body: "FAQ, Organization and product schema.org markup generated from your real content — never invented.",
  },
  {
    icon: "monitor",
    title: "AI Monitoring",
    body: "Real questions run against ChatGPT, Gemini, Claude and more — tracking mentions, sentiment and citations.",
  },
  {
    icon: "scores",
    title: "Visibility Scores",
    body: "Six transparent 0-100 scores show exactly how AI sees your brand — and why.",
  },
  {
    icon: "recs",
    title: "AI Recommendations",
    body: "Prioritized fixes that raise your scores: missing answers, weak structure, uncited claims.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">The toolkit</p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Everything your brand needs to be{" "}
              <span className="text-gradient">machine-understood</span>
            </h2>
          </div>
          <p className="max-w-55 pb-1 text-sm leading-relaxed text-muted">
            One pipeline — from raw website to measured AI visibility.
          </p>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={Math.min(i * 0.06, 0.3)}>
            <article className="group h-full rounded-3xl border border-line bg-surface/40 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo/40 hover:shadow-[0_20px_60px_-24px_rgba(99,102,241,0.5)]">
              <span
                aria-hidden
                className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-base/60 text-cyan transition-colors group-hover:border-cyan/40"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5.5 w-5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {ICONS[f.icon]}
                </svg>
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
