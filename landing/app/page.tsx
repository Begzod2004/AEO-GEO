export default function Home() {
  return (
    <section className="mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-center px-6 pt-28 pb-20">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left: the thesis */}
        <div>
          <p className="eyebrow">AI answer engine optimization</p>
          <h1 className="mt-5 font-sans text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-[1.03] tracking-[-0.03em] text-ink">
            Your Brand Deserves To Be{" "}
            <span className="text-gradient">Understood By AI.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Optimize your business for ChatGPT, Gemini, Claude, Perplexity and
            the next generation of AI search — so the answer engines describe you
            accurately and recommend you often.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-line bg-surface/60 p-1.5 pl-4">
              <span className="text-sm text-muted">you@company.com</span>
              <button className="ml-auto rounded-full bg-linear-to-r from-indigo to-cyan px-5 py-2 text-sm font-semibold text-base">
                Get Early Access
              </button>
            </div>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Right: placeholder for the Stage-2 interactive knowledge graph */}
        <div className="relative aspect-square w-full rounded-3xl border border-line bg-surface/40">
          <div
            className="absolute inset-0 rounded-3xl opacity-60"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 45%, rgba(99,102,241,0.18), transparent 70%)",
            }}
          />
          <div className="absolute inset-0 grid place-items-center">
            <span className="rounded-full border border-line bg-base/60 px-4 py-2 font-mono text-xs text-muted">
              Your Brand ↔ AI engines
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
