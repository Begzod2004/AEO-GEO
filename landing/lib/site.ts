/** Canonical site constants - one place for the public URL and copy used by
 *  metadata, JSON-LD, sitemap and robots. */
/** Every consumer (metadata, JSON-LD, sitemap, robots, hreflang) is a server
 *  component, so this is read from the environment — one env var moves the
 *  whole site to a new domain with no rebuild.
 *
 *  The key is computed rather than written literally: Turbopack inlines
 *  `process.env.SITE_URL` at build time, baking in `undefined` and silently
 *  pinning every canonical URL to the fallback. Same trick as lib/waitlist.ts. */
const SITE_URL_KEY = ["SITE", "URL"].join("_");

export const SITE_URL = (
  process.env[SITE_URL_KEY] ?? "http://localhost:3000"
).replace(/\/$/, "");
export const SITE_NAME = "AEO.GEO";
export const SITE_TITLE = "AEO.GEO - Be understood by AI answer engines";
export const SITE_DESCRIPTION =
  "Optimize your business for ChatGPT, Gemini, Claude, Perplexity and the next generation of AI search. Crawl, structure and monitor how AI answers talk about your brand.";
