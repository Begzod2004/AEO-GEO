import { Hero } from "@/components/hero/Hero";
import { AIVisibilityDemo } from "@/components/sections/AIVisibilityDemo";
import { DashboardPreview } from "@/components/sections/DashboardPreview";
import { FactsRow } from "@/components/sections/FactsRow";
import { Faq } from "@/components/sections/Faq";
import { Features } from "@/components/sections/Features";
import { FinalCta } from "@/components/sections/FinalCta";
import { PlatformsRow } from "@/components/sections/PlatformsRow";
import { Pricing } from "@/components/sections/Pricing";
import { ScrollStory } from "@/components/sections/ScrollStory";
import { JsonLd } from "@/components/site/JsonLd";
import type { Dict, Locale } from "@/lib/i18n";

export function LandingPage({ dict, locale }: { dict: Dict; locale: Locale }) {
  return (
    <>
      <JsonLd dict={dict} locale={locale} />
      <Hero t={dict.hero} email={dict.email} />
      <PlatformsRow t={dict.platforms} />
      <ScrollStory t={dict.story} />
      <AIVisibilityDemo t={dict.demo} />
      <Features t={dict.features} />
      <DashboardPreview t={dict.dash} />
      <FactsRow t={dict.facts} />
      <Pricing t={dict.pricing} />
      <Faq t={dict.faq} />
      <FinalCta t={dict.finalCta} email={dict.email} />
    </>
  );
}
