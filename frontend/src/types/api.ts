/**
 * TypeScript models for the AEO.GEO API contract (docs/api-contract.md).
 * Kept deliberately close to the wire shapes so the API layer stays type-safe.
 */

/* ----------------------------- Auth ----------------------------- */
export interface User {
  id: number | string;
  email: string;
  full_name?: string | null;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RefreshResponse {
  access: string;
}

/* ------------------------- Organizations ------------------------ */
export type OrgRole =
  | "org_owner"
  | "org_admin"
  | "marketing_manager"
  | "aeo_specialist"
  | "content_manager"
  | "writer"
  | "developer"
  | "billing_manager"
  | "viewer";

export interface Organization {
  id: number | string;
  name: string;
  slug?: string;
  industry?: string | null;
  primary_language?: string | null;
  plan?: string | null;
}

export interface Membership {
  id: number | string;
  role: OrgRole;
  user: User;
}

export interface Domain {
  id: number | string;
  url: string;
  is_primary: boolean;
}

/* --------------------------- Website ---------------------------- */
export interface CrawlMeta {
  title?: string | null;
  meta_description?: string | null;
  canonical?: string | null;
  has_robots?: boolean;
  has_sitemap?: boolean;
  links_total?: number;
  broken_links?: string[];
  performance_score?: number;
}

export interface CrawlResult {
  id: number | string;
  status?: string;
  domain?: number | string | null;
  meta?: CrawlMeta;
  created_at?: string;
}

/* ------------------------ Knowledge Base ------------------------ */
export type DocumentSourceType = "text" | "website" | "pdf" | "docx" | "txt";
export type DocumentStatus = "pending" | "processing" | "done" | "failed";

export interface KbDocument {
  id: number | string;
  title: string;
  source_type: DocumentSourceType;
  status: DocumentStatus;
  num_chunks: number;
  source_url?: string | null;
  error?: string | null;
  created_at?: string;
}

export interface DocumentStatusResponse {
  id: number | string;
  status: DocumentStatus;
  num_chunks: number;
  error?: string | null;
}

export interface KbSearchResult {
  score: number;
  document_id: number | string;
  text: string;
}

export interface KbSearchResponse {
  query: string;
  results: KbSearchResult[];
}

/* ----------------------- AI Optimization ------------------------ */
export type SchemaType = "faq" | "organization" | "product" | "breadcrumb" | string;
export type SchemaStatus = "pending" | "processing" | "done" | "failed" | string;

export interface SchemaMarkup {
  id: number | string;
  schema_type: SchemaType;
  json_ld: unknown;
  status: SchemaStatus;
  is_valid: boolean;
  validation_errors?: string[] | null;
  applied_to_url?: string | null;
  created_at?: string;
}

/* ------------------------- AI Monitoring ------------------------ */
export type PromptCategory = "brand" | "product" | "comparison" | "local" | "faq";

export interface Prompt {
  id: number | string;
  text: string;
  category: PromptCategory;
}

export type Provider = "openai" | "anthropic" | "gemini";
export type Sentiment = "positive" | "neutral" | "negative";

export interface ScanResult {
  id: number | string;
  prompt: number | string | { id: number | string; text?: string };
  provider: Provider;
  is_mentioned: boolean;
  sentiment: Sentiment;
  citation_sources: string[];
  response_text: string;
  scanned_at: string;
}

/* --------------------------- Dashboard -------------------------- */
export interface ScoreSet {
  ai_visibility_score: number;
  geo_score: number;
  aeo_score: number;
  seo_score: number;
  trust_score: number;
  citation_score: number;
}

export interface ScoreSnapshot extends ScoreSet {
  date: string;
}

export interface DashboardSummary {
  prompts: number;
  scan_results: number;
  documents: number;
}

export interface DashboardResponse {
  latest: ScoreSnapshot | null;
  trend: ScoreSnapshot[];
  summary: DashboardSummary;
}

/** The six metric keys, in canonical spectrum order. */
export type MetricKey = keyof ScoreSet;
