"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import type { Dict } from "@/lib/i18n";

/** Scripted, deterministic "AI answer" demo — honestly labeled as such.
 *  Every answer is pre-written; nothing here calls a live model. */
export function AIVisibilityDemo({ t }: { t: Dict["demo"] }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [chars, setChars] = useState(0);
  const preset = t.presets[active];
  const full = preset.answer.join("");
  const liveRegion = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) {
      setChars(full.length);
      return;
    }
    setChars(0);
    const timer = setInterval(() => {
      setChars((c) => {
        if (c >= full.length) {
          clearInterval(timer);
          return c;
        }
        return c + 2;
      });
    }, 18);
    return () => clearInterval(timer);
  }, [active, full.length, reduced]);

  const done = chars >= full.length;
  const [before, brand] = preset.answer;
  const typedBefore = full.slice(0, Math.min(chars, before.length));
  const typedBrand = full.slice(
    before.length,
    Math.min(chars, before.length + brand.length),
  );
  const typedAfter = full.slice(before.length + brand.length, chars);

  return (
    <section id="demo" className="border-y border-line bg-surface/20">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <div className="text-center">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t.h2pre} <span className="text-gradient">{t.h2accent}</span>
            {t.h2post && ` ${t.h2post}`}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">{t.sub}</p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left: query picker */}
          <div className="rounded-3xl border border-line bg-surface/40 p-6">
            <label className="eyebrow" htmlFor="demo-question">
              {t.questionLabel}
            </label>
            <div
              id="demo-question"
              className="mt-3 rounded-2xl border border-line bg-base/60 px-4 py-3 font-mono text-sm text-ink"
            >
              {preset.question}
            </div>
            <p className="eyebrow mt-6">{t.presetLabel}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {t.presets.map((p, i) => (
                <button
                  key={p.chip}
                  onClick={() => setActive(i)}
                  aria-pressed={i === active}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${
                    i === active
                      ? "border-indigo/60 bg-indigo/15 text-ink"
                      : "border-line bg-surface/60 text-muted hover:text-ink"
                  }`}
                >
                  {p.chip}
                </button>
              ))}
            </div>
          </div>

          {/* Right: scripted AI answer */}
          <div className="relative rounded-3xl border border-line bg-surface/40 p-6">
            <span className="absolute top-4 right-4 rounded-full border border-line bg-base/70 px-3 py-1 font-mono text-[10px] tracking-wider text-muted uppercase">
              {t.tag}
            </span>

            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-linear-to-r from-indigo to-cyan font-mono text-[10px] font-bold text-base">
                AI
              </span>
              <span className="text-sm text-muted">{t.assistant}</span>
            </div>

            <div
              ref={liveRegion}
              aria-live="polite"
              className="mt-4 min-h-40 leading-relaxed text-ink"
            >
              <p>
                {typedBefore}
                {typedBrand && (
                  <mark className="rounded bg-cyan/15 px-1 font-semibold text-cyan">
                    {typedBrand}
                  </mark>
                )}
                {typedAfter}
                {!done && (
                  <span className="ml-0.5 inline-block w-2 animate-pulse text-cyan">
                    ▍
                  </span>
                )}
              </p>
            </div>

            {done && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3.5 py-1.5 text-sm text-cyan">
                {t.badge}
              </p>
            )}

            <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
              {t.disclaimer}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
