/** Muted text row of monitored platforms — plain text on purpose (no logos, no
 *  partnership implication). Server-rendered. */
const PLATFORMS = [
  "ChatGPT",
  "Gemini",
  "Claude",
  "Perplexity",
  "Copilot",
  "Google AI Overview",
];

export function PlatformsRow() {
  return (
    <section
      aria-label="Supported AI platforms"
      className="border-y border-line bg-surface/30"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-7">
        <span className="eyebrow">Monitors and optimizes for:</span>
        {PLATFORMS.map((p) => (
          <span
            key={p}
            className="font-mono text-sm text-muted/80 transition-colors hover:text-muted"
          >
            {p}
          </span>
        ))}
      </div>
    </section>
  );
}
