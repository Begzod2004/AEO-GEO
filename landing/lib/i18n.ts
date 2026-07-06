/** Locale routing + dictionary access. Each locale lives at its own URL
 *  (/en, /ru, /uz) and is fully server-rendered — hreflang-correct AEO. */
import { en } from "./dictionaries/en";
import { ru } from "./dictionaries/ru";
import { uz } from "./dictionaries/uz";

export const LOCALES = ["en", "ru", "uz"] as const;
export type Locale = (typeof LOCALES)[number];

export type Dict = typeof en;

const DICTS: Record<Locale, Dict> = { en, ru, uz };

export function getDict(locale: string): Dict {
  return DICTS[(LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : "en"];
}

export const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  ru: "ru_RU",
  uz: "uz_UZ",
};
