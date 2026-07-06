"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const LINKS: [string, string][] = [
  ["How it works", "#how-it-works"],
  ["Demo", "#demo"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
];

export function Navbar() {
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
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-mono text-sm font-semibold tracking-tight text-ink"
        >
          AEO<span className="text-gradient">.GEO</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {label}
            </a>
          ))}
        </div>

        <a
          href="#early-access"
          className="rounded-full bg-linear-to-r from-indigo to-cyan px-4 py-2 text-sm font-semibold text-base shadow-[0_8px_30px_-8px_rgba(99,102,241,0.6)] transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
        >
          Get Early Access
        </a>
      </nav>
    </header>
  );
}
