"use client";

import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";

export default function LanguageSwitch() {
  const locale = useWorldStore((s) => s.locale);
  const setLocale = useWorldStore((s) => s.setLocale);
  const { t } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
      className="px-3 py-1 rounded text-xs font-semibold transition-colors border border-border-active text-accent-gold bg-transparent"
      title={t("tooltip.langSwitch")}
    >
      {locale === "zh" ? "EN" : "中文"}
    </button>
  );
}
