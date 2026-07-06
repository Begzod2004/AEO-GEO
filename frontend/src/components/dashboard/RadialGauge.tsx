import type { ReactNode } from "react";

/**
 * A 270° radial gauge. The arc is drawn in the metric's spectrum hue; the value
 * is passed already-animated (from useCountUp) so the sweep and the number move
 * together.
 */
export function RadialGauge({
  value,
  color,
  size = 132,
  stroke = 10,
  children,
}: {
  value: number;
  color: string;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const c = size / 2;
  const r = c - stroke;
  const circumference = 2 * Math.PI * r;
  const sweep = 0.75; // 270°
  const arc = sweep * circumference;
  const clamped = Math.max(0, Math.min(100, value));
  const valueLen = (clamped / 100) * arc;
  const gradId = `gauge-${color.replace("#", "")}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.65" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        {/* track */}
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-surface-2"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circumference}`}
          transform={`rotate(135 ${c} ${c})`}
        />
        {/* value */}
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${valueLen} ${circumference}`}
          transform={`rotate(135 ${c} ${c})`}
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
