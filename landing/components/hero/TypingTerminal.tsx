"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const LINES = [
  "Analyzing website...",
  "Building Knowledge Graph...",
  "Generating FAQ & Schema...",
  "Monitoring AI answers...",
  "Done. Your brand is AI-visible.",
];

export function TypingTerminal() {
  const reduced = useReducedMotion();
  const [line, setLine] = useState(0);
  const [chars, setChars] = useState(0);

  useEffect(() => {
    if (reduced) return; // static: all lines shown, no animation
    const current = LINES[line];
    let timer: ReturnType<typeof setTimeout>;
    if (chars < current.length) {
      timer = setTimeout(() => setChars((c) => c + 1), 34);
    } else if (line < LINES.length - 1) {
      timer = setTimeout(() => {
        setLine((l) => l + 1);
        setChars(0);
      }, 480);
    } else {
      timer = setTimeout(() => {
        setLine(0);
        setChars(0);
      }, 2800);
    }
    return () => clearTimeout(timer);
  }, [line, chars, reduced]);

  const shown = reduced ? LINES : LINES.slice(0, line + 1);

  return (
    <div className="rounded-2xl border border-line bg-surface/50 p-4 font-mono text-sm backdrop-blur-sm">
      <div className="mb-3 flex gap-1.5" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
      </div>
      <div className="space-y-1.5">
        {shown.map((full, i) => {
          const typing = !reduced && i === shown.length - 1;
          const text = typing ? full.slice(0, chars) : full;
          const isDone = full.startsWith("Done");
          return (
            <p key={i} className={isDone ? "text-ink" : "text-muted"}>
              <span className="text-indigo">›</span> {text}
              {typing && (
                <span className="ml-0.5 inline-block w-2 animate-pulse text-cyan">
                  ▍
                </span>
              )}
            </p>
          );
        })}
      </div>
    </div>
  );
}
