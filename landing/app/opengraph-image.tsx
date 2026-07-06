import { ImageResponse } from "next/og";

import { SITE_DESCRIPTION } from "@/lib/site";

export const alt = "AEO.GEO — Be understood by AI answer engines";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Code-generated social share image — no binary asset to maintain. */
export default function OgImage() {
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
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-2px",
          }}
        >
          Your Brand Deserves To Be
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-2px",
            backgroundImage: "linear-gradient(90deg, #6366F1, #22D3EE)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Understood By AI.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 28,
            color: "#94a3b8",
            maxWidth: 900,
          }}
        >
          {SITE_DESCRIPTION.split(".")[0] + "."}
        </div>
      </div>
    ),
    size,
  );
}
