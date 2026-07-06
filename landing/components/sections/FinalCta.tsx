import { EmailCapture } from "@/components/site/EmailCapture";
import { Reveal } from "@/components/site/Reveal";
import type { Dict } from "@/lib/i18n";

export function FinalCta({ t, email }: { t: Dict["finalCta"]; email: Dict["email"] }) {
  return (
    <section id="early-access" className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 90% at 50% 100%, rgba(99,102,241,0.22), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-6 py-32 text-center">
        <Reveal>
          <h2 className="text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-ink">
            {t.h2pre} <span className="text-gradient">{t.h2accent}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-muted">{t.sub}</p>
          <div className="mt-9 flex justify-center">
            <EmailCapture t={email} className="w-full max-w-md" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
