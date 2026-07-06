import { Hero } from "@/components/hero/Hero";
import { JsonLd } from "@/components/site/JsonLd";
import { AIVisibilityDemo } from "@/components/sections/AIVisibilityDemo";
import { DashboardPreview } from "@/components/sections/DashboardPreview";
import { FactsRow } from "@/components/sections/FactsRow";
import { Faq } from "@/components/sections/Faq";
import { Features } from "@/components/sections/Features";
import { FinalCta } from "@/components/sections/FinalCta";
import { PlatformsRow } from "@/components/sections/PlatformsRow";
import { Pricing } from "@/components/sections/Pricing";
import { ScrollStory } from "@/components/sections/ScrollStory";

export default function Home() {
  return (
    <>
      <JsonLd />
      <Hero />
      <PlatformsRow />
      <ScrollStory />
      <AIVisibilityDemo />
      <Features />
      <DashboardPreview />
      <FactsRow />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}
