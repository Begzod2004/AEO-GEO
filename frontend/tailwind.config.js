/** @type {import('tailwindcss').Config} */

// Semantic tokens resolve to CSS variables (space-separated RGB channels) so a
// single set of utilities works in both light and dark themes. The `spectrum`
// hues are fixed brand data colors that read on either theme.
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: withVar("--bg"),
        "bg-elevated": withVar("--bg-elevated"),
        surface: withVar("--surface"),
        "surface-2": withVar("--surface-2"),
        line: withVar("--line"),
        "line-strong": withVar("--line-strong"),
        text: withVar("--text"),
        muted: withVar("--muted"),
        faint: withVar("--faint"),
        brand: {
          DEFAULT: withVar("--brand"),
          hover: withVar("--brand-hover"),
          soft: withVar("--brand-soft"),
          fg: withVar("--brand-fg"),
        },
        good: withVar("--good"),
        fair: withVar("--fair"),
        poor: withVar("--poor"),
        // Fixed six-band metric spectrum (visibility -> citation)
        spectrum: {
          visibility: "#8B7CFF",
          geo: "#38BDF8",
          aeo: "#2DD4BF",
          seo: "#A3E635",
          trust: "#FBBF24",
          citation: "#FB7185",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        eyebrow: ["0.72rem", { lineHeight: "1rem", letterSpacing: "0.16em" }],
        "stat-sm": ["1.75rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        stat: ["2.75rem", { lineHeight: "1", letterSpacing: "-0.03em" }],
        hero: ["3.5rem", { lineHeight: "0.98", letterSpacing: "-0.035em" }],
      },
      borderRadius: {
        card: "1rem",
        control: "0.625rem",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 0 0 rgb(255 255 255 / 0.03) inset, 0 12px 30px -18px rgb(0 0 0 / 0.55)",
        pop: "0 18px 50px -22px rgb(0 0 0 / 0.65)",
        "glow-brand": "0 0 0 1px rgb(var(--brand) / 0.35), 0 12px 40px -12px rgb(var(--brand) / 0.45)",
      },
      transitionTimingFunction: {
        emphasized: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "pulse-ring": {
          "0%": { opacity: "0.7", transform: "scale(0.9)" },
          "70%, 100%": { opacity: "0", transform: "scale(1.6)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "fade-in": "fade-in 0.4s ease both",
        shimmer: "shimmer 1.6s infinite",
        "spin-slow": "spin-slow 0.9s linear infinite",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};
