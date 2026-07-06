/** Lightweight static knowledge-graph — used on mobile and under
 *  prefers-reduced-motion, and as the SSR/no-JS fallback for the 3D scene.
 *  Same concept (brand at the center, AI engines around it), zero JS. */
const ENGINES = ["ChatGPT", "Gemini", "Claude", "Perplexity", "Copilot"];
const CX = 200;
const CY = 200;
const R = 138;

const nodes = ENGINES.map((label, i) => {
  const a = (-90 + i * (360 / ENGINES.length)) * (Math.PI / 180);
  return { label, x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
});

export function StaticGraph({
  brandLabel = "Your Brand",
  ariaLabel = "AEO.GEO connects your brand to AI answer engines: ChatGPT, Gemini, Claude, Perplexity and Copilot.",
}: {
  brandLabel?: string;
  ariaLabel?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      className="h-full w-full"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <radialGradient id="brand" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </radialGradient>
      </defs>

      {nodes.map((n) => (
        <line
          key={`e-${n.label}`}
          x1={CX}
          y1={CY}
          x2={n.x}
          y2={n.y}
          stroke="url(#edge)"
          strokeWidth={1.25}
          strokeOpacity={0.4}
        />
      ))}

      {nodes.map((n) => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r={5} fill="#22d3ee" />
          <text
            x={n.x}
            y={n.y - 12}
            textAnchor="middle"
            className="fill-[#94a3b8] font-mono"
            fontSize={12}
          >
            {n.label}
          </text>
        </g>
      ))}

      <circle cx={CX} cy={CY} r={40} fill="url(#brand)" opacity={0.25} />
      <circle cx={CX} cy={CY} r={26} fill="url(#brand)" />
      <text
        x={CX}
        y={CY + 4}
        textAnchor="middle"
        className="fill-white font-sans"
        fontSize={11}
        fontWeight={600}
      >
        {brandLabel}
      </text>
    </svg>
  );
}
