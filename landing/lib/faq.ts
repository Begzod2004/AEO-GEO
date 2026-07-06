/** FAQ content — single source of truth: rendered in the FAQ section AND used
 *  to build the FAQPage JSON-LD, so the two never drift apart. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: "What is AEO/GEO?",
    a: "AEO (Answer Engine Optimization) and GEO (Generative Engine Optimization) are the practice of making your business findable, accurately described and recommendable by AI assistants like ChatGPT, Gemini, Claude and Perplexity — the way SEO does for Google.",
  },
  {
    q: "How is it different from SEO?",
    a: "SEO optimizes pages for search-result rankings. AEO/GEO optimizes your knowledge for AI-generated answers: structured data, machine-readable FAQs and consistent facts that answer engines can quote and cite. Good SEO helps, but AI answers need more structure than a ranking algorithm does.",
  },
  {
    q: "Which AI platforms do you monitor?",
    a: "AEO.GEO is built to monitor major AI answer engines including ChatGPT, Gemini, Claude, Perplexity, Copilot and Google AI Overview, with more being added. Monitoring runs real questions against each platform and analyzes how your brand appears.",
  },
  {
    q: "How do you measure AI visibility?",
    a: "We regularly send realistic customer questions to AI platforms and analyze the answers: whether you are mentioned, the sentiment, and which sources get cited. The results roll up into six transparent 0-100 scores — AI Visibility, GEO, AEO, SEO, Trust and Citation — with formulas you can inspect.",
  },
  {
    q: "Do I need technical skills?",
    a: "No. You connect your website and upload documents; AEO.GEO handles crawling, knowledge structuring, schema generation and monitoring. Generated markup comes with copy-paste snippets, and agency plans can manage it for you.",
  },
  {
    q: "When will it launch?",
    a: "AEO.GEO is in active development with an early-access program. Join the waitlist and we'll invite you as onboarding slots open — early members get founding pricing.",
  },
];
