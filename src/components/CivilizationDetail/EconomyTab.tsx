"use client";

import type { Region } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import MonetaryDisplay from "./MonetaryDisplay";
import StatBar from "./StatBar";

export default function EconomyTab({ region }: { region: Region }) {
  const { t, localized } = useLocale();
  const econ = region.economy;

  return (
    <div className="space-y-4 text-xs">
      <StatBar label={t("info.economy")} value={econ.level} color="#D4A017" />

      <div className="grid grid-cols-2 gap-3">
        <LabeledValue label={t("economy.gdp")}>
          <MonetaryDisplay value={econ.gdpEstimate} />
        </LabeledValue>
        <LabeledValue label={t("economy.gdpPerCapita")}>
          <MonetaryDisplay value={econ.gdpPerCapita} />
        </LabeledValue>
      </div>

      <LabeledValue label={t("economy.description")}>
        <p className="text-text-secondary">{localized(econ.gdpDescription)}</p>
      </LabeledValue>

      <LabeledValue label={t("economy.system")}>
        <p className="text-text-secondary">{localized(econ.economicSystem)}</p>
      </LabeledValue>

      <LabeledValue label={t("economy.industries")}>
        <p className="text-text-secondary">{localized(econ.mainIndustries)}</p>
      </LabeledValue>

      <LabeledValue label={t("economy.trade")}>
        <p className="text-text-secondary">{localized(econ.tradeGoods)}</p>
      </LabeledValue>

      <div className="grid grid-cols-2 gap-3">
        <LabeledValue label={t("economy.avgIncome")}>
          <MonetaryDisplay value={econ.averageIncome} />
        </LabeledValue>
        <LabeledValue label={t("economy.tradeVolume")}>
          <MonetaryDisplay value={econ.foreignTradeVolume} />
        </LabeledValue>
      </div>

      {econ.tradeRoutes && (
        <LabeledValue label={t("economy.tradeRoutes")}>
          <p className="text-text-secondary">{localized(econ.tradeRoutes)}</p>
        </LabeledValue>
      )}

      <div className="rounded p-2 bg-bg-tertiary border border-border-subtle">
        <h4 className="font-semibold mb-1 text-accent-copper">
          {t("economy.currency")}
        </h4>
        <div className="text-text-secondary">
          <div>{localized(econ.currency.name)} ({t(`currencyType.${econ.currency.type}`)})</div>
          <div className="text-xs text-text-muted">
            {t("economy.currencyUnit")}: {localized(econ.currency.unitName)}
          </div>
          {econ.currency.metalBasis && (
            <div className="text-xs text-text-muted">
              {t("economy.currencyBasis")}: {t(`metalBasis.${econ.currency.metalBasis}`)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LabeledValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-semibold mb-0.5 text-accent-copper">
        {label}
      </div>
      {children}
    </div>
  );
}
