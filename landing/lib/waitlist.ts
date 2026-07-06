/** Waitlist persistence — isolated behind one function.
 *
 *  With AEO_BACKEND_URL set (e.g. http://localhost:8000), leads POST to the
 *  AEO.GEO Django API (`/api/waitlist/`, idempotent). Without it (pure static
 *  demo), they append to a local JSONL file so the form still works. */
import { appendFile, mkdir } from "node:fs/promises";

const LEADS_FILE = ".waitlist/leads.jsonl";

// Read at request time via a computed key: Turbopack statically inlines
// `process.env.X` literals at build time (undefined if unset during build),
// which would silently disable the backend path on servers that DO set it.
const ENV_KEY = ["AEO", "BACKEND", "URL"].join("_");
const backendUrl = () => process.env[ENV_KEY]?.replace(/\/$/, "");

export async function saveLead(email: string, when: string): Promise<void> {
  const BACKEND = backendUrl();
  if (BACKEND) {
    const res = await fetch(`${BACKEND}/api/waitlist/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "landing" }),
    });
    if (!res.ok) throw new Error(`waitlist backend responded ${res.status}`);
    return;
  }

  // Fallback: local stub storage.
  const line = JSON.stringify({ email, at: when }) + "\n";
  try {
    await mkdir(".waitlist", { recursive: true });
    await appendFile(LEADS_FILE, line, "utf8");
  } catch {
    console.log("[waitlist]", email);
  }
}
