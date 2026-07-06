import type { MetadataRoute } from "next";

import { LOCALES } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

const LANGUAGE_ALTERNATES = Object.fromEntries(
  LOCALES.map((l) => [l, `${SITE_URL}/${l}`]),
);

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    lastModified: new Date("2026-07-06"),
    changeFrequency: "weekly",
    priority: locale === "en" ? 1 : 0.9,
    alternates: { languages: LANGUAGE_ALTERNATES },
  }));
}
