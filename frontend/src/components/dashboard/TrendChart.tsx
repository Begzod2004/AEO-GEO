import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { useTheme } from "@/context/ThemeContext";
import { METRICS, METRIC_BY_KEY } from "@/lib/metrics";
import { formatDayMonth, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { MetricKey, ScoreSnapshot } from "@/types/api";

/** Read the resolved token colors so the chart matches the active theme. */
function useChartColors() {
  const { theme } = useTheme();
  return useMemo(() => {
    const cs = getComputedStyle(document.documentElement);
    const v = (name: string) => cs.getPropertyValue(name).trim();
    return {
      muted: `rgb(${v("--muted")})`,
      grid: `rgb(${v("--line")} / 0.14)`,
      surface: `rgb(${v("--bg-elevated")})`,
      text: `rgb(${v("--text")})`,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-control border bg-bg-elevated/95 p-3 text-xs shadow-pop backdrop-blur">
      <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-wide text-muted">
        {formatDate(String(label))}
      </p>
      <ul className="space-y-1">
        {payload
          .slice()
          .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
          .map((entry) => {
            const meta = METRIC_BY_KEY[entry.dataKey as MetricKey];
            if (!meta) return null;
            return (
              <li key={String(entry.dataKey)} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                  {meta.label}
                </span>
                <span className="font-mono font-medium tabular-nums text-text">{entry.value}</span>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

export function TrendChart({ trend }: { trend: ScoreSnapshot[] }) {
  const colors = useChartColors();
  const [hidden, setHidden] = useState<Set<MetricKey>>(new Set());

  const toggle = (key: MetricKey) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div>
      {/* Toggleable legend */}
      <div className="mb-4 flex flex-wrap gap-2">
        {METRICS.map((m) => {
          const off = hidden.has(m.key);
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => toggle(m.key)}
              aria-pressed={!off}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-medium transition-opacity",
                off ? "opacity-40 hover:opacity-70" : "opacity-100",
              )}
              style={{ borderColor: `${m.color}55` }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: off ? "transparent" : m.color, boxShadow: off ? `inset 0 0 0 1.5px ${m.color}` : "none" }}
              />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="h-[19rem] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              {METRICS.map((m) => (
                <linearGradient key={m.key} id={`line-${m.key}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={m.color} stopOpacity={0.7} />
                  <stop offset="100%" stopColor={m.color} stopOpacity={1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatDayMonth(String(v))}
              tick={{ fill: colors.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: colors.grid }}
              minTickGap={24}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: colors.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: colors.grid, strokeWidth: 1 }} />
            {METRICS.map((m) => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                name={m.label}
                stroke={`url(#line-${m.key})`}
                strokeWidth={2}
                hide={hidden.has(m.key)}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: m.color }}
                isAnimationActive
                animationDuration={700}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
