import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { tokenStore } from "./tokens";
import { installMockAdapter } from "./mock";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

/** Fired when the session can no longer be recovered (refresh failed / absent). */
export const AUTH_LOGOUT_EVENT = "aeo:auth-logout";

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

if (USE_MOCKS) {
  installMockAdapter(http);
}

/* ------------------------- Request: attach JWT ------------------------ */
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const access = tokenStore.getAccess();
  if (access) {
    config.headers.set("Authorization", `Bearer ${access}`);
  }
  return config;
});

/* ------------------- Response: refresh once on 401 ------------------- */
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// A single in-flight refresh shared by all concurrent 401s.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;
  try {
    // Bare client to avoid recursive interceptors.
    const res = await axios.post<{ access: string }>(
      `${API_BASE}/auth/refresh/`,
      { refresh },
    );
    const access = res.data.access;
    tokenStore.setAccess(access);
    return access;
  } catch {
    return null;
  }
}

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes("/auth/");

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      if (!refreshing) refreshing = refreshAccessToken();
      const newAccess = await refreshing.finally(() => {
        refreshing = null;
      });

      if (newAccess) {
        original.headers.set("Authorization", `Bearer ${newAccess}`);
        return http(original);
      }
      // Unrecoverable: clear and let the app redirect to login.
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
    }
    return Promise.reject(error);
  },
);

/** Extract a human-friendly message from an axios/DRF error. */
export function apiError(err: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { detail?: string; message?: string; [k: string]: unknown }
      | string
      | undefined;
    if (typeof data === "string") return data || fallback;
    if (data?.detail) return String(data.detail);
    if (data?.message) return String(data.message);
    if (data && typeof data === "object") {
      // DRF field errors: { field: ["msg"] }
      const first = Object.entries(data)[0];
      if (first) {
        const [field, val] = first;
        const msg = Array.isArray(val) ? val[0] : String(val);
        return field === "non_field_errors" ? String(msg) : `${field}: ${msg}`;
      }
    }
    if (err.code === "ERR_NETWORK")
      return "Can't reach the server. Is the backend running?";
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
