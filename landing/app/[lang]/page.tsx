import { LandingPage } from "@/components/LandingPage";
import { getDict, type Locale } from "@/lib/i18n";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  return <LandingPage dict={getDict(locale)} locale={locale} />;
}
