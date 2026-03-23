import { cookies } from "next/headers";
import en from "../../messages/en.json";
import ja from "../../messages/ja.json";
import zh from "../../messages/zh.json";
import ko from "../../messages/ko.json";
import de from "../../messages/de.json";
import fr from "../../messages/fr.json";
import es from "../../messages/es.json";
import pt from "../../messages/pt.json";

export type Locale = "en" | "ja" | "zh" | "ko" | "de" | "fr" | "es" | "pt";
export const defaultLocale: Locale = "en";
export const locales: Locale[] = ["en", "ja", "zh", "ko", "de", "fr", "es", "pt"];

const messages = { en, ja, zh, ko, de, fr, es, pt } as const;

export function getLocale(): Locale {
  try {
    const cookieStore = cookies();
    const locale = cookieStore.get("locale")?.value as Locale;
    if (locale && locales.includes(locale)) return locale;
  } catch { /* ignore during build */ }
  return defaultLocale;
}

type Messages = typeof en;

// Simple dot-path access helper
type DotPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends object
    ? DotPaths<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`;
}[keyof T & string];

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}

export function getTranslations(locale: Locale = defaultLocale) {
  const msgs = messages[locale] as unknown as Record<string, unknown>;
  return function t(key: DotPaths<Messages>): string {
    return getNestedValue(msgs, key);
  };
}
