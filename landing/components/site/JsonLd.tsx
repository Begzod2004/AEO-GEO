/** schema.org JSON-LD — the product's own medicine on its own site, per locale.
 *  FAQPage is built from the SAME dictionary the visible FAQ renders, so markup
 *  and visible content can never drift apart. */
import type { Dict, Locale } from "@/lib/i18n";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function JsonLd({ dict, locale }: { dict: Dict; locale: Locale }) {
  const pageUrl = `${SITE_URL}/${locale}`;

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: dict.meta.description,
    logo: `${SITE_URL}/favicon.svg`,
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    url: pageUrl,
    mainEntity: dict.faq.items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const softwareApplication = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: locale,
    description: dict.meta.description,
    url: pageUrl,
    offers: {
      "@type": "Offer",
      price: "29",
      priceCurrency: "USD",
      description: "Early access pricing, from $29/month.",
    },
  };

  return (
    <>
      {[organization, faqPage, softwareApplication].map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
