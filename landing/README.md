# AEO.GEO — Marketing landing

Standalone Next.js (App Router) marketing site for AEO.GEO. Separate from the
product dashboard (`../frontend`, Vite SPA) because the landing must be
server-rendered: **this product sells AI-readability, so its own site is the
demo** — full HTML without JS, semantic structure, JSON-LD, sitemap.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start   # production
```

No environment variables required. The waitlist form writes to
`.waitlist/leads.jsonl` (git-ignored) via `lib/waitlist.ts` — swap `saveLead()`
for a POST to the Django backend when it's ready.

## Stack

Next.js + TypeScript + Tailwind v4 (tokens in `app/globals.css` `@theme`),
Framer Motion (scroll/entrance), React Three Fiber + drei (hero 3D knowledge
graph only), Lenis (smooth scroll). No GSAP/Spline/Lottie by design.

## AEO/SEO guarantees (dog-fooding)

- `/` is statically generated; all copy readable with JavaScript disabled
  (`<noscript>` override for reveal animations; native `<details>` FAQ).
- JSON-LD: Organization, FAQPage (built from `lib/faq.ts` — the same data the
  visible FAQ renders), SoftwareApplication.
- Full meta: canonical, OpenGraph (+ code-generated `opengraph-image`), Twitter.
- `sitemap.xml` + `robots.txt` via App Router conventions.
- `prefers-reduced-motion`: 3D scene and all animations replaced with static
  content; Lenis disabled. Mobile gets a light SVG graph instead of three.js.

Update `lib/site.ts` (SITE_URL) when the real domain is decided.

## Deploy notes

Any Node host or Vercel. `npm run build` produces the static page + the
`/api/waitlist` route (needs a Node runtime, not pure static export).
