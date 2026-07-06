"use client";

import { motion, useReducedMotion } from "framer-motion";

import { CountUp } from "@/components/site/CountUp";
import type { Dict } from "@/lib/i18n";
import { Reveal } from "@/components/site/Reveal";

/** Code-built mock of the product dashboard — score cards count up in view and
 *  a small SVG trend draws itself. Numbers are illustrative UI, not customer
 *  data (none exists yet). */
const SCORES: { value: number; color: string }[] = [
  { value: 81, color: "#818cf8" },
  { value: 74, color: "#38bdf8" },
  { value: 88, color: "#2dd4bf" },
  { value: 69, color: "#a3e635" },
  { value: 77, color: "#f59e0b" },
  { value: 62, color: "#fb7185" },
];

// A gently rising trend, pre-baked (deterministic).
const TREND = [22, 30, 27, 38, 45, 41, 54, 60, 58, 70, 76, 81];
const W = 560;
const H = 120;
const points = TREND.map((v, i) => [
  (i / (TREND.length - 1)) * W,
  H - (v / 100) * H,
]);
const path = points
  .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
  .join(" ");

export function DashboardPreview({ t }: { t: Dict["dash"] }) {
  const reduced = useReducedMotion();
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <p className="eyebrow text-center">{t.eyebrow}</p>
        <h2 className="mt-4 text-center text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {t.h2pre} <span className="text-gradient">{t.h2accent}</span>
          {t.h2post && ` ${t.h2post}`}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted">{t.sub}</p>
      </Reveal>

      <Reveal className="mt-14" delay={0.08}>
        <div className="rounded-3xl border border-line bg-surface/40 p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {SCORES.map((s, i) => (
              <div
                key={t.scoreLabels[i]}
                className="rounded-2xl border border-line bg-base/50 p-4"
              >
                <p className="font-mono text-[11px] tracking-wider text-muted uppercase">
                  {t.scoreLabels[i]}
                </p>
                <p
                  className="mt-2 font-mono text-3xl font-bold tabular-nums"
                  style={{ color: s.color }}
                >
                  <CountUp value={s.value} />
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${s.value}%`, background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-base/50 p-5">
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-[11px] tracking-wider text-muted uppercase">
                {t.trendLabel}
              </p>
              <p className="font-mono text-xs text-cyan">{t.trendUp}</p>
            </div>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="mt-4 h-28 w-full"
              role="img"
              aria-label={t.trendAria}
            >
              <defs>
                <linearGradient id="trend-stroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
                <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(34,211,238,0.25)" />
                  <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                </linearGradient>
              </defs>
              <path d={`${path} L${W},${H} L0,${H} Z`} fill="url(#trend-fill)" />
              <motion.path
                d={path}
                fill="none"
                stroke="url(#trend-stroke)"
                strokeWidth={2.5}
                strokeLinecap="round"
                initial={reduced ? false : { pathLength: 0 }}
                whileInView={reduced ? undefined : { pathLength: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
              {points.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={2.5} fill="#22d3ee" opacity={0.8} />
              ))}
            </svg>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
