import Link from "next/link";

const COLS: { title: string; links: string[] }[] = [
  { title: "Product", links: ["How it works", "Demo", "Pricing", "FAQ"] },
  { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms"] },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Link href="/" className="font-mono text-sm font-semibold text-ink">
            AEO<span className="text-gradient">.GEO</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Make your brand understood by AI answer engines.
          </p>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <h3 className="eyebrow">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted sm:flex-row">
          <p>© 2026 AEO.GEO. All rights reserved.</p>
          <p className="font-mono text-xs">Built to be read by humans and machines.</p>
        </div>
      </div>
    </footer>
  );
}
