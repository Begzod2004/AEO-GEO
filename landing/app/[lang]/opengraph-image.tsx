import { ImageResponse } from "next/og";

import { getDict, type Locale } from "@/lib/i18n";

export const alt = "AEO.GEO - Be understood by AI answer engines";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Code-generated social share image, localized per language. */
export default async function OgImage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const d = getDict(lang as Locale);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#050816",
          color: "#e5e7eb",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#94a3b8" }}>
          AEO.GEO
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-2px",
          }}
        >
          {d.hero.h1pre}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-2px",
            backgroundImage: "linear-gradient(90deg, #6366F1, #22D3EE)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {d.hero.h1accent}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 27,
            color: "#94a3b8",
            maxWidth: 950,
          }}
        >
          {d.meta.description.split(/[.!]/)[0] + "."}
        </div>
      </div>
    ),
    size,
  );
}
