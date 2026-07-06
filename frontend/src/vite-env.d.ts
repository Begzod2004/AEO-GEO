/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** When "true", the API layer is served by an in-memory mock adapter. */
  readonly VITE_USE_MOCKS?: string;
  /** Optional override of the API base path (default "/api"). */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
