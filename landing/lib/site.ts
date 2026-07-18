/** Canonical site constants - one place for the public URL and copy used by
 *  metadata, JSON-LD, sitemap and robots. */
/** Every consumer (metadata, JSON-LD, sitemap, robots, hreflang) is a server
 *  component, so this is read at request time — one env var moves the whole
 *  site to a new domain with no rebuild. */
export const SITE_URL = (
  process.env.SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
export const SITE_NAME = "AEO.GEO";
export const SITE_TITLE = "AEO.GEO - Be understood by AI answer engines";
export const SITE_DESCRIPTION =
  "Optimize your business for ChatGPT, Gemini, Claude, Perplexity and the next generation of AI search. Crawl, structure and monitor how AI answers talk about your brand.";
