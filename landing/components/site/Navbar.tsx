"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Dict, Locale } from "@/lib/i18n";
import { LOCALES } from "@/lib/i18n";

export function Navbar({ t, locale }: { t: Dict["nav"]; locale: Locale }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-line bg-base/70 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          href={`/${locale}`}
          className="font-mono text-sm font-semibold tracking-tight text-ink"
        >
          AEO<span className="text-gradient">.GEO</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {t.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* language switcher — real per-locale URLs, crawlable */}
          <div
            className="flex items-center gap-0.5 rounded-full border border-line bg-surface/60 p-0.5 font-mono text-[11px]"
            aria-label="Language"
          >
            {LOCALES.map((code) => (
              <Link
                key={code}
                href={`/${code}`}
                aria-current={code === locale ? "page" : undefined}
                className={`rounded-full px-2 py-1 uppercase transition-colors ${
                  code === locale
                    ? "bg-indigo/25 text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                {code}
              </Link>
            ))}
          </div>

          <a
            href="#early-access"
            className="hidden rounded-full bg-linear-to-r from-indigo to-cyan px-4 py-2 text-sm font-semibold text-base shadow-[0_8px_30px_-8px_rgba(99,102,241,0.6)] transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan sm:block"
          >
            {t.cta}
          </a>
        </div>
      </nav>
    </header>
  );
}
