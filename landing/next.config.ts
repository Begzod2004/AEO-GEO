import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Locales live at /en, /ru, /uz — the bare root goes to English.
      { source: "/", destination: "/en", permanent: true },
    ];
  },
};

export default nextConfig;
