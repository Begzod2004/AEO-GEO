"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Scroll-entrance wrapper (fade + small rise), staggered by `delay`.
 *
 *  no-JS note: framer-motion bakes `opacity:0` into the SSR HTML, so layout.tsx
 *  ships a <noscript> override forcing [data-reveal] visible — the page stays
 *  fully readable with JavaScript disabled. Under prefers-reduced-motion the
 *  element renders static (no hidden state at all).
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div data-reveal className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, delay, ease: [0.21, 0.65, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
