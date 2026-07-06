"use client";

import { useId, useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type State = "idle" | "loading" | "done" | "error";

export function EmailCapture({ className = "" }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const inputId = useId();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError("Enter a valid email address.");
      setState("error");
      return;
    }
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Try again.");
      }
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p
        className={`inline-flex items-center gap-2 rounded-full border border-cyan/40 bg-cyan/10 px-5 py-3 text-sm font-medium text-ink ${className}`}
      >
        <span className="text-cyan">✓</span> You&apos;re on the list — we&apos;ll be in touch.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={className}>
      <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-line bg-surface/60 p-1.5 pl-4 focus-within:border-indigo/60">
        <label htmlFor={inputId} className="sr-only">
          Work email
        </label>
        <input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="ml-auto shrink-0 rounded-full bg-linear-to-r from-indigo to-cyan px-5 py-2 text-sm font-semibold text-base transition-transform hover:scale-[1.03] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
        >
          {state === "loading" ? "Joining…" : "Get Early Access"}
        </button>
      </div>
      {state === "error" && (
        <p role="alert" className="mt-2 pl-4 text-sm text-rose-400">
          {error}
        </p>
      )}
    </form>
  );
}
