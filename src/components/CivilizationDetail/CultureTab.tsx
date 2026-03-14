"use client";

import type { Region } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

export default function CultureTab({ region }: { region: Region }) {
  const { t, localized } = useLocale();
  const culture = region.culture;

  if (!culture) return null;

  return (
    <div className="space-y-4">
      <LabeledValue label={t("culture.religion")}>
        {localized(culture.religion)}
      </LabeledValue>

      {culture.philosophy && (
        <LabeledValue label={t("culture.philosophy")}>
          {localized(culture.philosophy)}
        </LabeledValue>
      )}

      {culture.writingSystem && (
        <LabeledValue label={t("culture.writing")}>
          {localized(culture.writingSystem)}
        </LabeledValue>
      )}

      <LabeledValue label={t("culture.language")}>
        {localized(culture.languageFamily)}
      </LabeledValue>

      <LabeledValue label={t("culture.achievements")}>
        {localized(culture.culturalAchievements)}
      </LabeledValue>
    </div>
  );
}

function LabeledValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold mb-1.5 text-accent-copper text-sm">
        {label}
      </h4>
      <p className="readable-prose">{children}</p>
    </div>
  );
}
