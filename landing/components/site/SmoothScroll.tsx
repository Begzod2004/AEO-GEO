"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useState } from "react";

/** Lenis smooth scroll — disabled entirely under prefers-reduced-motion so the
 *  page scrolls natively for people who ask for less motion. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (reduced) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
