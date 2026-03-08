"use client";

import type { Region } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

export default function DiplomacyTab({ region }: { region: Region }) {
  const { t, localized } = useLocale();
  const dip = region.diplomacy;

  return (
    <div className="space-y-4 text-xs">
      <LabeledValue label={t("diplomacy.policy")}>
        {localized(dip.foreignPolicy)}
      </LabeledValue>

      <LabeledValue label={t("diplomacy.allies")}>
        {localized(dip.allies)}
      </LabeledValue>

      <LabeledValue label={t("diplomacy.enemies")}>
        {localized(dip.enemies)}
      </LabeledValue>

      {dip.vassals && (
        <LabeledValue label={t("diplomacy.vassals")}>
          {localized(dip.vassals)}
        </LabeledValue>
      )}

      {dip.tributeRelations && (
        <LabeledValue label={t("diplomacy.tribute")}>
          {localized(dip.tributeRelations)}
        </LabeledValue>
      )}

      {dip.treaties && (
        <LabeledValue label={t("diplomacy.treaties")}>
          {localized(dip.treaties)}
        </LabeledValue>
      )}

      {dip.recentDiplomaticEvents && (
        <LabeledValue label={t("diplomacy.recentEvents")}>
          {localized(dip.recentDiplomaticEvents)}
        </LabeledValue>
      )}
    </div>
  );
}

function LabeledValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold mb-1 text-accent-copper">
        {label}
      </h4>
      <p className="text-text-secondary">{children}</p>
    </div>
  );
}
