"use client";

import { useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { StaticGraph } from "./StaticGraph";

// The 3D scene (three.js) is loaded only when actually needed — off the initial
// bundle so it never blocks LCP.
const KnowledgeGraph3D = dynamic(() => import("./KnowledgeGraph3D"), {
  ssr: false,
  loading: () => <GraphSkeleton />,
});

function GraphSkeleton() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="h-24 w-24 animate-pulse rounded-full bg-indigo/20 blur-xl" />
    </div>
  );
}

export function GraphVisual({
  brandLabel,
  ariaLabel,
}: {
  brandLabel: string;
  ariaLabel: string;
}) {
  const reduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // SSR / unknown / mobile / reduced-motion → the light static SVG graph.
  if (isMobile === null || isMobile || reduced)
    return <StaticGraph brandLabel={brandLabel} ariaLabel={ariaLabel} />;
  return <KnowledgeGraph3D brandLabel={brandLabel} />;
}
