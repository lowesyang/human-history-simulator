import { useWorldStore } from "@/store/useWorldStore";
import type { LocalizedText } from "@/lib/types";
import zhStrings from "@/locales/zh.json";
import enStrings from "@/locales/en.json";

type Locale = "zh" | "en";

const strings: Record<Locale, Record<string, string>> = {
  zh: zhStrings,
  en: enStrings,
};

export function t(key: string, locale?: Locale): string {
  const currentLocale = locale ?? useWorldStore.getState().locale;
  return strings[currentLocale]?.[key] ?? key;
}

export function localized(text: LocalizedText | undefined, locale?: Locale): string {
  if (!text) return "";
  const currentLocale = locale ?? useWorldStore.getState().locale;
  return text[currentLocale] ?? text.en ?? text.zh ?? "";
}

export function useLocale() {
  const locale = useWorldStore((s) => s.locale);
  const setLocale = useWorldStore((s) => s.setLocale);

  const tFn = (key: string) => {
    return strings[locale]?.[key] ?? key;
  };

  const localizedFn = (text: LocalizedText | undefined) => {
    if (!text) return "";
    return text[locale] ?? text.en ?? text.zh ?? "";
  };

  const tWithFallback = (prefix: string, value: string | LocalizedText) => {
    if (typeof value === "object" && value !== null) {
      return value[locale] ?? value.en ?? value.zh ?? "";
    }
    const key = `${prefix}.${value}`;
    const translated = strings[locale]?.[key];
    if (translated) return translated;
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return { locale, setLocale, t: tFn, localized: localizedFn, tWithFallback };
}
