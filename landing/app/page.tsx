import { Hero } from "@/components/hero/Hero";
import { AIVisibilityDemo } from "@/components/sections/AIVisibilityDemo";
import { PlatformsRow } from "@/components/sections/PlatformsRow";
import { ScrollStory } from "@/components/sections/ScrollStory";

export default function Home() {
  return (
    <>
      <Hero />
      <PlatformsRow />
      <ScrollStory />
      <AIVisibilityDemo />
    </>
  );
}
