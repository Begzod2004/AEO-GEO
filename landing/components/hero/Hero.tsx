import { EmailCapture } from "@/components/site/EmailCapture";
import { GraphVisual } from "./GraphVisual";
import { TypingTerminal } from "./TypingTerminal";

export function Hero() {
  return (
    <section className="mx-auto grid min-h-[92vh] max-w-6xl items-center gap-12 px-6 pt-28 pb-20 lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left: the thesis (server-rendered text for AEO) */}
      <div>
        <p className="eyebrow">AI answer engine optimization</p>
        <h1 className="mt-5 font-sans text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-[1.03] tracking-[-0.03em] text-ink">
          Your Brand Deserves To Be{" "}
          <span className="text-gradient">Understood By AI.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Optimize your business for ChatGPT, Gemini, Claude, Perplexity and the
          next generation of AI search — so the answer engines describe you
          accurately and recommend you often.
        </p>

        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <EmailCapture />
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors hover:text-cyan"
          >
            See how it works
            <span aria-hidden>↓</span>
          </a>
        </div>

        <div className="mt-8 max-w-md">
          <TypingTerminal />
        </div>
      </div>

      {/* Right: signature — interactive knowledge graph (3D on desktop) */}
      <div className="relative mx-auto aspect-square w-full max-w-[520px]">
        <GraphVisual />
      </div>
    </section>
  );
}
