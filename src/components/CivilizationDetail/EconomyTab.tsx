"use client";

import type { Region } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { useWorldStore } from "@/store/useWorldStore";
import MonetaryDisplay from "./MonetaryDisplay";
import StatBar from "./StatBar";
import AssetFingerprint from "@/components/charts/AssetFingerprint";

export default function EconomyTab({ region }: { region: Region }) {
  const { t, localized } = useLocale();
  const { setShowEconomicPanel } = useWorldStore();
  const locale = useWorldStore((s) => s.locale);
  const econ = region.economy;

  if (!econ) return null;

  const gk = (v: { goldKg?: number } | undefined) =>
    v?.goldKg ?? 0;
  const gdpGoldKg = gk(econ.gdpEstimate);
  const pop = region.demographics?.population ?? 0;
  const gdpPerCapita = pop > 0 ? gdpGoldKg / pop : 0;
  const tradeGoldKg = gk(region.economy?.foreignTradeVolume);
  const tradeOpenness = (tradeGoldKg > 0 && gdpGoldKg > 0) ? (tradeGoldKg / gdpGoldKg) * 100 : -1;
  const revGoldKg = gk(region.finances?.annualRevenue);
  const expGoldKg = gk(region.finances?.annualExpenditure);
  const fiscalBalance = ((revGoldKg > 0 || expGoldKg > 0) && gdpGoldKg > 0) ? ((revGoldKg - expGoldKg) / gdpGoldKg) * 100 : -999;
  const debtGoldKg = gk(region.finances?.debtLevel);
  const debtToGdp = gdpGoldKg > 0 ? (debtGoldKg / gdpGoldKg) * 100 : 0;

  const fingerprintCurrent = {
    gdpPerCapita,
    tradeOpenness: tradeOpenness === -1 ? -1 : Math.min(tradeOpenness, 300),
    fiscalBalance: fiscalBalance === -999 ? -999 : Math.max(-50, Math.min(50, fiscalBalance)),
    militarySpendingPctGdp: region.military?.militarySpendingPctGdp ?? 0,
    urbanizationRate: region.demographics?.urbanizationRate ?? 0,
    population: pop,
    debtToGdp: Math.min(debtToGdp, 300),
    technologyLevel: region.technology?.level ?? 0,
  };
  const hasFingerprintData =
    fingerprintCurrent.gdpPerCapita > 0 ||
    (fingerprintCurrent.tradeOpenness > 0 && fingerprintCurrent.tradeOpenness !== -1) ||
    fingerprintCurrent.militarySpendingPctGdp > 0 ||
    fingerprintCurrent.urbanizationRate > 0 ||
    fingerprintCurrent.population > 0 ||
    fingerprintCurrent.technologyLevel > 0;

  return (
    <div className="space-y-4">
      <StatBar label={t("info.economy")} value={typeof econ.level === "number" ? econ.level : 0} color="#D4A017" />

      <div className="grid grid-cols-2 gap-3">
        <LabeledValue label={t("economy.gdp")}>
          <MonetaryDisplay value={econ.gdpEstimate} />
        </LabeledValue>
        <LabeledValue label={t("economy.gdpPerCapita")}>
          <MonetaryDisplay value={econ.gdpPerCapita} />
        </LabeledValue>
      </div>

      {hasFingerprintData && (
        <div className="flex justify-center">
          <AssetFingerprint
            current={fingerprintCurrent}
            regionName={localized(region.name)}
            locale={locale}
            width={240}
            height={240}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowEconomicPanel(true)}
        className="text-xs text-accent-copper hover:underline"
      >
        {t("economy.viewFullHistory")}
      </button>

      <LabeledValue label={t("economy.description")}>
        <p className="readable-prose">{localized(econ.gdpDescription)}</p>
      </LabeledValue>

      <LabeledValue label={t("economy.system")}>
        <p className="readable-prose">{localized(econ.economicSystem)}</p>
      </LabeledValue>

      <LabeledValue label={t("economy.industries")}>
        <p className="readable-prose">{localized(econ.mainIndustries)}</p>
      </LabeledValue>

      <LabeledValue label={t("economy.trade")}>
        <p className="readable-prose">{localized(econ.tradeGoods)}</p>
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
          <p className="readable-prose">{localized(econ.tradeRoutes)}</p>
        </LabeledValue>
      )}

      {econ.currency && (
        <div className="rounded p-2 bg-bg-tertiary border border-border-subtle">
          <h4 className="font-semibold mb-1 text-accent-copper">
            {t("economy.currency")}
          </h4>
          <div className="text-text-secondary">
            <div>{localized(econ.currency.name)} ({t(`currencyType.${econ.currency.type}`)})</div>
            {econ.currency.unitName && (
              <div className="text-xs text-text-muted">
                {t("economy.currencyUnit")}: {localized(econ.currency.unitName)}
              </div>
            )}
            {econ.currency.metalBasis && (
              <div className="text-xs text-text-muted">
                {t("economy.currencyBasis")}: {t(`metalBasis.${econ.currency.metalBasis}`)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LabeledValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-semibold mb-1 text-sm text-accent-copper">
        {label}
      </div>
      {children}
    </div>
  );
}
