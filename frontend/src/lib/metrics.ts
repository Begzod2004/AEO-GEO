import type { MetricKey } from "@/types/api";

export interface MetricMeta {
  key: MetricKey;
  /** Short label for cards and legends. */
  label: string;
  /** Long label used in tooltips / a11y. */
  full: string;
  /** One-line explanation of what the score measures. */
  blurb: string;
  /** Fixed spectrum hue (reads on both themes). */
  color: string;
}

/**
 * Canonical order + identity of the six scores. This is the product's
 * "signal spectrum": violet -> sky -> teal -> lime -> amber -> rose.
 * Every surface (hero bands, gauge cards, trend chart) reads from here so the
 * color language stays consistent.
 */
export const METRICS: MetricMeta[] = [
  {
    key: "ai_visibility_score",
    label: "AI Visibility",
    full: "AI Visibility Score",
    blurb: "How often engines mention you across your prompts",
    color: "#8B7CFF",
  },
  {
    key: "geo_score",
    label: "GEO",
    full: "Generative Engine Optimization",
    blurb: "Composite of visibility, answer-readiness and search health",
    color: "#38BDF8",
  },
  {
    key: "aeo_score",
    label: "AEO",
    full: "Answer Engine Optimization",
    blurb: "Valid FAQ & Organization structured data in place",
    color: "#2DD4BF",
  },
  {
    key: "seo_score",
    label: "SEO",
    full: "Search Engine Optimization",
    blurb: "Crawl health: performance, robots, sitemap, links",
    color: "#A3E635",
  },
  {
    key: "trust_score",
    label: "Trust",
    full: "Trust Score",
    blurb: "Sentiment of the answers that mention you",
    color: "#FBBF24",
  },
  {
    key: "citation_score",
    label: "Citation",
    full: "Citation Score",
    blurb: "How often answers cite a source for you",
    color: "#FB7185",
  },
];

export const METRIC_BY_KEY: Record<MetricKey, MetricMeta> = METRICS.reduce(
  (acc, m) => {
    acc[m.key] = m;
    return acc;
  },
  {} as Record<MetricKey, MetricMeta>,
);

export type ScoreBand = "poor" | "fair" | "good";

/** Map a 0–100 score to a qualitative band + display label + token color. */
export function scoreBand(value: number): {
  band: ScoreBand;
  label: string;
  varName: string;
} {
  if (value >= 70) return { band: "good", label: "Strong", varName: "--good" };
  if (value >= 40) return { band: "fair", label: "Fair", varName: "--fair" };
  return { band: "poor", label: "Needs work", varName: "--poor" };
}
