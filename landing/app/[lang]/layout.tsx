import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Aurora } from "@/components/site/Aurora";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { getDict, LOCALES, OG_LOCALE, type Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Only /en, /ru and /uz exist — anything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = lang as Locale;
  const d = getDict(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: d.meta.title, template: "%s · AEO.GEO" },
    description: d.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        ru: "/ru",
        uz: "/uz",
        "x-default": "/en",
      },
    },
    icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
    openGraph: {
      type: "website",
      url: `/${locale}`,
      siteName: "AEO.GEO",
      locale: OG_LOCALE[locale],
      title: d.meta.title,
      description: d.meta.description,
    },
    twitter: {
      card: "summary_large_image",
      title: d.meta.title,
      description: d.meta.description,
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#050816",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const locale = lang as Locale;
  const d = getDict(locale);

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen">
        {/* With JS disabled, reveal animations never run — force content visible. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        <Aurora />
        <SmoothScroll>
          <Navbar t={d.nav} locale={locale} />
          <main>{children}</main>
          <Footer t={d.footer} locale={locale} />
        </SmoothScroll>
      </body>
    </html>
  );
}
