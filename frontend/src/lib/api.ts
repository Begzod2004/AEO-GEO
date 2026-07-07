import { http } from "./http";
import type {
  CrawlResult,
  DashboardResponse,
  Domain,
  DocumentStatusResponse,
  KbDocument,
  KbSearchResponse,
  LoginResponse,
  Membership,
  Organization,
  Prompt,
  PromptCategory,
  ScanResult,
  SchemaMarkup,
  SchemaType,
  User,
} from "@/types/api";

/** DRF list endpoints may be raw arrays or paginated `{results}`. Normalize. */
function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: T[] }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

const oid = (id: string | number) => encodeURIComponent(String(id));

/* ------------------------------- Auth ------------------------------- */
export const authApi = {
  async register(body: { email: string; password: string; full_name?: string }) {
    const { data } = await http.post<User>("/auth/register/", body);
    return data;
  },
  async login(body: { email: string; password: string }) {
    const { data } = await http.post<LoginResponse>("/auth/login/", body);
    return data;
  },
  async forgotPassword(email: string) {
    const { data } = await http.post<{ detail: string }>("/auth/forgot-password/", {
      email,
    });
    return data;
  },
  async resetPassword(body: { uid: string; token: string; password: string }) {
    const { data } = await http.post<{ detail: string }>("/auth/reset-password/", body);
    return data;
  },
  async acceptInvite(body: { token: string; password: string }) {
    const { data } = await http.post<{ email: string; detail: string }>(
      "/auth/accept-invite/",
      body,
    );
    return data;
  },
  async refresh(refresh: string) {
    const { data } = await http.post<{ access: string }>("/auth/refresh/", { refresh });
    return data;
  },
  async logout(refresh: string) {
    await http.post("/auth/logout/", { refresh });
  },
  async me() {
    const { data } = await http.get<User>("/auth/me/");
    return data;
  },
};

/* -------------------------- Organizations --------------------------- */
export const orgApi = {
  async list() {
    const { data } = await http.get("/organizations/");
    return asList<Organization>(data);
  },
  async create(body: { name: string; industry?: string; primary_language?: string }) {
    const { data } = await http.post<Organization>("/organizations/", body);
    return data;
  },
  async members(orgId: string | number) {
    const { data } = await http.get(`/organizations/${oid(orgId)}/members/`);
    return asList<Membership>(data);
  },
  async invite(orgId: string | number, body: { email: string; role: string }) {
    const { data } = await http.post(`/organizations/${oid(orgId)}/invite/`, body);
    return data;
  },
  async domains(orgId: string | number) {
    const { data } = await http.get(`/organizations/${oid(orgId)}/domains/`);
    return asList<Domain>(data);
  },
  async addDomain(orgId: string | number, body: { url: string; is_primary?: boolean }) {
    const { data } = await http.post<Domain>(`/organizations/${oid(orgId)}/domains/`, body);
    return data;
  },
  async dashboard(orgId: string | number) {
    const { data } = await http.get<DashboardResponse>(`/organizations/${oid(orgId)}/dashboard/`);
    return data;
  },
};

/* ----------------------------- Website ------------------------------ */
export const websiteApi = {
  async crawl(orgId: string | number, body: { domain_id?: string | number } = {}) {
    const { data } = await http.post<CrawlResult>(`/organizations/${oid(orgId)}/crawl/`, body);
    return data;
  },
  async results(orgId: string | number) {
    const { data } = await http.get(`/organizations/${oid(orgId)}/crawl-results/`);
    return asList<CrawlResult>(data);
  },
};

/* -------------------------- Knowledge Base -------------------------- */
export const kbApi = {
  async list(orgId: string | number) {
    const { data } = await http.get(`/organizations/${oid(orgId)}/documents/`);
    return asList<KbDocument>(data);
  },
  async createText(orgId: string | number, body: { title: string; raw_text: string }) {
    const { data } = await http.post<KbDocument>(`/organizations/${oid(orgId)}/documents/`, {
      source_type: "text",
      ...body,
    });
    return data;
  },
  async createWebsite(orgId: string | number, body: { title: string; source_url: string }) {
    const { data } = await http.post<KbDocument>(`/organizations/${oid(orgId)}/documents/`, {
      source_type: "website",
      ...body,
    });
    return data;
  },
  async createFile(orgId: string | number, title: string, file: File) {
    const form = new FormData();
    form.append("title", title);
    form.append("file", file);
    const ext = file.name.split(".").pop()?.toLowerCase();
    const sourceType = ext === "pdf" ? "pdf" : ext === "docx" ? "docx" : "txt";
    form.append("source_type", sourceType);
    const { data } = await http.post<KbDocument>(`/organizations/${oid(orgId)}/documents/`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  async status(orgId: string | number, docId: string | number) {
    const { data } = await http.get<DocumentStatusResponse>(
      `/organizations/${oid(orgId)}/documents/${oid(docId)}/status/`,
    );
    return data;
  },
  async search(orgId: string | number, body: { query: string; top_k?: number }) {
    const { data } = await http.post<KbSearchResponse>(
      `/organizations/${oid(orgId)}/documents/search/`,
      body,
    );
    return data;
  },
};

/* ------------------------ AI Optimization --------------------------- */
export const schemaApi = {
  async list(orgId: string | number) {
    const { data } = await http.get(`/organizations/${oid(orgId)}/schema-markup/`);
    return asList<SchemaMarkup>(data);
  },
  async generate(
    orgId: string | number,
    body: { schema_type: SchemaType | "all"; applied_to_url?: string },
  ) {
    const { data } = await http.post(
      `/organizations/${oid(orgId)}/schema-markup/generate/`,
      body,
    );
    return data;
  },
};

/* ------------------------- AI Monitoring ---------------------------- */
export const promptApi = {
  async list(orgId: string | number) {
    const { data } = await http.get(`/organizations/${oid(orgId)}/prompts/`);
    return asList<Prompt>(data);
  },
  async create(orgId: string | number, body: { text: string; category: PromptCategory }) {
    const { data } = await http.post<Prompt>(`/organizations/${oid(orgId)}/prompts/`, body);
    return data;
  },
  async generate(orgId: string | number) {
    const { data } = await http.post(`/organizations/${oid(orgId)}/prompts/generate/`, {});
    return asList<Prompt>(data);
  },
};

export const scanApi = {
  async run(orgId: string | number) {
    const { data } = await http.post(`/organizations/${oid(orgId)}/scan/`, {});
    return data;
  },
  async results(orgId: string | number) {
    const { data } = await http.get(`/organizations/${oid(orgId)}/scan-results/`);
    return asList<ScanResult>(data);
  },
};
