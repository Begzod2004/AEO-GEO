import Link from "next/link";

import type { Dict, Locale } from "@/lib/i18n";

export function Footer({ t, locale }: { t: Dict["footer"]; locale: Locale }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Link
            href={`/${locale}`}
            className="font-mono text-sm font-semibold text-ink"
          >
            AEO<span className="text-gradient">.GEO</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted">{t.tagline}</p>
        </div>

        {t.columns.map((col) => (
          <div key={col.title}>
            <h3 className="eyebrow">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted sm:flex-row">
          <p>{t.copyright}</p>
          <p className="font-mono text-xs">{t.built}</p>
        </div>
      </div>
    </footer>
  );
}
