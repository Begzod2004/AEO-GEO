"use client";

import { motion, useReducedMotion } from "framer-motion";

import { CountUp } from "@/components/site/CountUp";
import { Reveal } from "@/components/site/Reveal";

/** Code-built mock of the product dashboard — score cards count up in view and
 *  a small SVG trend draws itself. Numbers are illustrative UI, not customer
 *  data (none exists yet). */
const SCORES: { label: string; value: number; color: string }[] = [
  { label: "AI Visibility", value: 81, color: "#818cf8" },
  { label: "GEO", value: 74, color: "#38bdf8" },
  { label: "AEO", value: 88, color: "#2dd4bf" },
  { label: "SEO", value: 69, color: "#a3e635" },
  { label: "Trust", value: 77, color: "#f59e0b" },
  { label: "Citation", value: 62, color: "#fb7185" },
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

export function DashboardPreview() {
  const reduced = useReducedMotion();
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <p className="eyebrow text-center">The dashboard</p>
        <h2 className="mt-4 text-center text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Your AI presence, <span className="text-gradient">measured</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted">
          Six transparent scores updated by real scans — so you always know how
          answer engines see you.
        </p>
      </Reveal>

      <Reveal className="mt-14" delay={0.08}>
        <div className="rounded-3xl border border-line bg-surface/40 p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {SCORES.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-line bg-base/50 p-4"
              >
                <p className="font-mono text-[11px] tracking-wider text-muted uppercase">
                  {s.label}
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
                AI Visibility · last 12 scans
              </p>
              <p className="font-mono text-xs text-cyan">▲ trending up</p>
            </div>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="mt-4 h-28 w-full"
              role="img"
              aria-label="Example trend chart: AI Visibility score rising from 22 to 81 across twelve scans."
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
