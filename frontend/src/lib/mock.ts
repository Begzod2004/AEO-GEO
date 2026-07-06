/**
 * In-memory mock backend, attached as an axios adapter only when
 * VITE_USE_MOCKS === "true". It exists purely so the UI can be developed and
 * visually reviewed without the (parallel-built) Django backend. The real code
 * path in `api.ts` is unchanged — it always calls axios; this just answers.
 *
 * The scan mock honors ADR-001 #1: a deterministic hash-derived distribution
 * with mentioned true/false and positive/neutral/negative sentiment.
 */
import type { AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig, AxiosInstance } from "axios";
import type {
  DashboardResponse,
  KbDocument,
  Prompt,
  ScanResult,
  ScoreSnapshot,
} from "@/types/api";

const LATENCY = 420;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/* ------------------------------ Seed state --------------------------- */
const db = {
  user: { id: 1, email: "acedev@northwind.io", full_name: "Ada Devlin" },
  orgs: [
    { id: 1, name: "Northwind Labs", slug: "northwind-labs", industry: "SaaS", plan: "growth" },
  ],
  domains: [{ id: 1, url: "https://northwind.io", is_primary: true }],
  documents: [
    { id: 1, title: "Product overview", source_type: "text", status: "done", num_chunks: 12, created_at: iso(-6) },
    { id: 2, title: "northwind.io/pricing", source_type: "website", status: "done", num_chunks: 7, source_url: "https://northwind.io/pricing", created_at: iso(-3) },
    { id: 3, title: "Security whitepaper.pdf", source_type: "pdf", status: "processing", num_chunks: 0, created_at: iso(0) },
  ] as KbDocument[],
  prompts: [
    { id: 1, text: "What is Northwind Labs?", category: "brand" },
    { id: 2, text: "Best analytics platforms for SaaS", category: "comparison" },
    { id: 3, text: "How does Northwind pricing work?", category: "faq" },
    { id: 4, text: "Northwind Labs alternatives", category: "comparison" },
    { id: 5, text: "Analytics tools near me", category: "local" },
    { id: 6, text: "Northwind dashboard features", category: "product" },
    { id: 7, text: "Is Northwind good for enterprise?", category: "brand" },
    { id: 8, text: "Northwind vs the competition", category: "comparison" },
  ] as Prompt[],
  scanResults: [] as ScanResult[],
  snapshots: [] as ScoreSnapshot[],
  crawlResults: [
    {
      id: 1,
      status: "done",
      domain: 1,
      created_at: iso(-2),
      meta: {
        title: "Northwind Labs — Analytics for modern teams",
        meta_description: "Track, measure and act on product signals.",
        canonical: "https://northwind.io/",
        has_robots: true,
        has_sitemap: true,
        links_total: 84,
        broken_links: ["https://northwind.io/legacy"],
        performance_score: 78,
      },
    },
  ],
  schema: [
    { id: 1, schema_type: "organization", json_ld: { "@context": "https://schema.org", "@type": "Organization", name: "Northwind Labs" }, status: "done", is_valid: true, applied_to_url: "https://northwind.io", created_at: iso(-4) },
    { id: 2, schema_type: "faq", json_ld: { "@context": "https://schema.org", "@type": "FAQPage" }, status: "done", is_valid: false, validation_errors: ["mainEntity is empty"], created_at: iso(-4) },
  ],
  seq: 100,
};

function iso(dayOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString();
}
function dateOnly(dayOffset: number): string {
  return iso(dayOffset).slice(0, 10);
}

/* Build a realistic starting trend so visual dev shows a populated dashboard. */
function seedTrend() {
  const base = [
    { v: 41, g: 36, a: 20, s: 62, t: 48, c: 12 },
    { v: 48, g: 42, a: 40, s: 66, t: 52, c: 20 },
    { v: 55, g: 49, a: 50, s: 70, t: 57, c: 28 },
    { v: 61, g: 54, a: 50, s: 72, t: 60, c: 34 },
    { v: 66, g: 58, a: 50, s: 72, t: 61, c: 40 },
  ];
  db.snapshots = base.map((b, i) => ({
    date: dateOnly(-(base.length - 1 - i) * 3),
    ai_visibility_score: b.v,
    geo_score: b.g,
    aeo_score: b.a,
    seo_score: b.s,
    trust_score: b.t,
    citation_score: b.c,
  }));
}
seedTrend();

/* --------------------------- Scan simulation ------------------------- */
function runScan() {
  const providers = ["openai", "anthropic", "gemini"] as const;
  const results: ScanResult[] = [];
  let mentioned = 0;
  let withCitation = 0;
  let pos = 0;
  let neu = 0;
  for (const p of db.prompts) {
    for (const provider of providers) {
      const h = hash(p.text + provider);
      const isMentioned = h < 0.66;
      const s = hash(provider + p.text);
      const sentiment = s < 0.5 ? "positive" : s < 0.8 ? "neutral" : "negative";
      const hasCite = hash(p.text + provider + "cite") < 0.45;
      if (isMentioned) mentioned++;
      if (hasCite) withCitation++;
      if (sentiment === "positive") pos++;
      else if (sentiment === "neutral") neu++;
      results.push({
        id: db.seq++,
        prompt: { id: p.id, text: p.text },
        provider,
        is_mentioned: isMentioned,
        sentiment,
        citation_sources: hasCite ? ["https://northwind.io"] : [],
        response_text: isMentioned
          ? `Yes — ${p.text} commonly surfaces Northwind Labs among the options.`
          : `For "${p.text}", the answer lists other vendors and does not mention Northwind.`,
        scanned_at: iso(0),
      });
    }
  }
  const total = results.length;
  const visibility = Math.round((100 * mentioned) / total);
  const citation = Math.round((100 * withCitation) / total);
  const trust = Math.round((100 * (pos + 0.5 * neu)) / total);
  const validSchema = db.schema.filter(
    (x) => ["faq", "organization"].includes(x.schema_type) && x.is_valid,
  ).length;
  const aeo = Math.round((100 * validSchema) / 2);
  const crawl = db.crawlResults[0]?.meta;
  const seo = crawl
    ? Math.round(
        ((crawl.performance_score ?? 0) +
          (crawl.has_robots ? 100 : 0) +
          (crawl.has_sitemap ? 100 : 0) +
          Math.max(0, 100 - 25 * (crawl.broken_links?.length ?? 0))) /
          4,
      )
    : 0;
  const geo = Math.round(0.5 * visibility + 0.25 * aeo + 0.25 * seo);

  db.scanResults = results;
  db.snapshots.push({
    date: dateOnly(0),
    ai_visibility_score: visibility,
    geo_score: geo,
    aeo_score: aeo,
    seo_score: seo,
    trust_score: trust,
    citation_score: citation,
  });
  if (db.snapshots.length > 30) db.snapshots = db.snapshots.slice(-30);
}

/* ------------------------------ Routing ------------------------------ */
type Reply = { status?: number; data?: unknown };
type Handler = (m: RegExpMatchArray, body: Record<string, unknown>, cfg: InternalAxiosRequestConfig) => Reply;

const routes: { method: string; re: RegExp; handler: Handler }[] = [];
const on = (method: string, re: RegExp, handler: Handler) => routes.push({ method, re, handler });

on("post", /\/auth\/register\/$/, (_m, b) => ({ status: 201, data: { id: 1, email: b.email, full_name: b.full_name ?? null } }));
on("post", /\/auth\/login\/$/, () => ({ data: { access: "mock.access.token", refresh: "mock.refresh.token", user: db.user } }));
on("post", /\/auth\/refresh\/$/, () => ({ data: { access: "mock.access.token" } }));
on("post", /\/auth\/logout\/$/, () => ({ status: 205, data: {} }));
on("get", /\/auth\/me\/$/, () => ({ data: db.user }));

on("get", /\/organizations\/$/, () => ({ data: db.orgs }));
on("post", /\/organizations\/$/, (_m, b) => {
  const org = { id: db.seq++, name: String(b.name), slug: String(b.name).toLowerCase().replace(/\s+/g, "-"), industry: (b.industry as string) ?? null, plan: "free" };
  db.orgs.push(org);
  return { status: 201, data: org };
});
on("get", /\/organizations\/[^/]+\/members\/$/, () => ({ data: [{ id: 1, role: "org_owner", user: db.user }] }));
on("post", /\/organizations\/[^/]+\/invite\/$/, (_m, b) => ({ status: 201, data: { email: b.email, role: b.role } }));
on("get", /\/organizations\/[^/]+\/domains\/$/, () => ({ data: db.domains }));
on("post", /\/organizations\/[^/]+\/domains\/$/, (_m, b) => {
  const d = { id: db.seq++, url: String(b.url), is_primary: Boolean(b.is_primary) };
  db.domains.push(d);
  return { status: 201, data: d };
});
on("get", /\/organizations\/[^/]+\/dashboard\/$/, () => {
  const latest = db.snapshots.length ? db.snapshots[db.snapshots.length - 1] : null;
  const res: DashboardResponse = {
    latest,
    trend: db.snapshots.slice(-30),
    summary: { prompts: db.prompts.length, scan_results: db.scanResults.length, documents: db.documents.length },
  };
  return { data: res };
});

on("post", /\/organizations\/[^/]+\/crawl\/$/, () => ({ status: 202, data: db.crawlResults[0] }));
on("get", /\/organizations\/[^/]+\/crawl-results\/$/, () => ({ data: db.crawlResults }));

on("get", /\/organizations\/[^/]+\/documents\/$/, () => ({ data: db.documents }));
on("post", /\/organizations\/[^/]+\/documents\/search\/$/, (_m, b) => ({
  data: {
    query: String(b.query ?? ""),
    results: db.documents.slice(0, 3).map((d, i) => ({ score: 0.9 - i * 0.15, document_id: d.id, text: `…relevant passage from “${d.title}” matching “${b.query}”…` })),
  },
}));
on("get", /\/organizations\/[^/]+\/documents\/([^/]+)\/status\/$/, (m) => {
  const id = Number(m[1]);
  const doc = db.documents.find((d) => Number(d.id) === id);
  if (doc && doc.status !== "done" && doc.status !== "failed") {
    doc.status = doc.status === "pending" ? "processing" : "done";
    if (doc.status === "done") doc.num_chunks = 8;
  }
  return { data: { id, status: doc?.status ?? "done", num_chunks: doc?.num_chunks ?? 8, error: null } };
});
on("post", /\/organizations\/[^/]+\/documents\/$/, (_m, b, cfg) => {
  let title = "Untitled";
  let source_type: KbDocument["source_type"] = "text";
  let source_url: string | undefined;
  if (typeof FormData !== "undefined" && cfg.data instanceof FormData) {
    title = String(cfg.data.get("title") ?? "Uploaded file");
    source_type = (String(cfg.data.get("source_type") ?? "txt") as KbDocument["source_type"]);
  } else {
    title = String(b.title ?? (b.source_url as string) ?? "Untitled");
    source_type = (b.source_type as KbDocument["source_type"]) ?? "text";
    source_url = b.source_url as string | undefined;
  }
  const doc: KbDocument = { id: db.seq++, title, source_type, status: "pending", num_chunks: 0, source_url, created_at: iso(0) };
  db.documents.unshift(doc);
  return { status: 202, data: doc };
});

on("get", /\/organizations\/[^/]+\/schema-markup\/$/, () => ({ data: db.schema }));
on("post", /\/organizations\/[^/]+\/schema-markup\/generate\/$/, () => ({ status: 202, data: { detail: "queued" } }));

on("get", /\/organizations\/[^/]+\/prompts\/$/, () => ({ data: db.prompts }));
on("post", /\/organizations\/[^/]+\/prompts\/$/, (_m, b) => {
  const p = { id: db.seq++, text: String(b.text), category: (b.category as Prompt["category"]) ?? "brand" } as Prompt;
  db.prompts.push(p);
  return { status: 201, data: p };
});
on("post", /\/organizations\/[^/]+\/prompts\/generate\/$/, () => ({ status: 201, data: db.prompts }));

on("post", /\/organizations\/[^/]+\/scan\/$/, () => {
  runScan();
  return { status: 202, data: { detail: "scan dispatched" } };
});
on("get", /\/organizations\/[^/]+\/scan-results\/$/, () => ({ data: db.scanResults }));

export function installMockAdapter(instance: AxiosInstance) {
  instance.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const method = (config.method ?? "get").toLowerCase();
    const url = (config.url ?? "").split("?")[0];
    let body: Record<string, unknown> = {};
    if (typeof config.data === "string") {
      try {
        body = JSON.parse(config.data);
      } catch {
        body = {};
      }
    } else if (config.data && !(typeof FormData !== "undefined" && config.data instanceof FormData)) {
      body = config.data as Record<string, unknown>;
    }

    const route = routes.find((r) => r.method === method && r.re.test(url));
    await new Promise((res) => setTimeout(res, LATENCY));

    if (!route) {
      return {
        data: { detail: `mock: no handler for ${method.toUpperCase()} ${url}` },
        status: 404,
        statusText: "Not Found",
        headers: {},
        config,
      } as AxiosResponse;
    }
    const m = url.match(route.re) as RegExpMatchArray;
    const reply = route.handler(m, body, config);
    return {
      data: reply.data ?? {},
      status: reply.status ?? 200,
      statusText: "OK",
      headers: {} as AxiosHeaders,
      config,
    } as AxiosResponse;
  };
}
