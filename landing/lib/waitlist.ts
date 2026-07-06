/** Waitlist persistence — isolated so the backend can be swapped for a POST to
 *  the AEO.GEO Django API later without touching the route handler. */
import { appendFile, mkdir } from "node:fs/promises";

const LEADS_FILE = ".waitlist/leads.jsonl";

export async function saveLead(email: string, when: string): Promise<void> {
  // TODO(prod): replace this stub with a POST to the AEO.GEO backend.
  const line = JSON.stringify({ email, at: when }) + "\n";
  try {
    await mkdir(".waitlist", { recursive: true });
    await appendFile(LEADS_FILE, line, "utf8");
  } catch {
    console.log("[waitlist]", email);
  }
}
