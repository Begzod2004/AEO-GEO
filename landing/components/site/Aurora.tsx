/** One cheap, global ambient background — slow-drifting indigo/cyan light,
 *  a subtle grid, and a vignette. Purely decorative (aria-hidden), sits behind
 *  everything, and pauses under prefers-reduced-motion (handled in globals.css). */
export function Aurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-base"
    >
      <div
        className="absolute -top-[30%] left-1/2 h-[80vh] w-[80vw] -translate-x-1/2 rounded-full opacity-40 blur-[130px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(99,102,241,0.55), transparent)",
          animation: "aurora-drift 24s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[20%] -right-[10%] h-[60vh] w-[55vw] rounded-full opacity-30 blur-[130px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(34,211,238,0.45), transparent)",
          animation: "aurora-drift 30s ease-in-out infinite reverse",
        }}
      />
      {/* faint grid */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(120% 80% at 50% 0%, black 30%, transparent 75%)",
        }}
      />
      {/* vignette so content stays legible over the glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 90% at 50% -10%, transparent 45%, rgba(5,8,22,0.7) 100%)",
        }}
      />
    </div>
  );
}
