"use client";

import type { Region } from "@/lib/types";
import { normalizeStatus } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import StatBar from "./StatBar";

const STATUS_COLORS: Record<string, string> = {
  thriving: "#22c55e",
  rising: "#10b981",
  stable: "#d97706",
  declining: "#eab308",
  conflict: "#ef4444",
  collapsed: "#8b5cf6",
};

export default function HeaderSection({ region }: { region: Region }) {
  const { t, localized, tWithFallback } = useLocale();
  const status = normalizeStatus(region.status);
  const civ = region.civilization;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between pr-6">
        <div className="min-w-0 flex-1">
          <h2 className="font-cinzel text-lg font-bold text-text-primary">
            {localized(region.name)}
          </h2>
          {civ?.name && (
            <div className="text-xs text-text-secondary">
              {localized(civ.name)}
            </div>
          )}
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize shrink-0 ml-2 text-white"
          style={{ background: STATUS_COLORS[status] ?? "#888" }}
        >
          {t(`status.${status}`)}
        </span>
      </div>

      {civ && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-secondary">
          {civ.ruler && (
            <div>
              <span className="text-text-muted">{t("info.ruler")}:</span>{" "}
              {localized(civ.ruler)}
              {civ.rulerTitle &&
                ` · ${localized(civ.rulerTitle)}`}
            </div>
          )}
          {civ.capital && (
            <div>
              <span className="text-text-muted">{t("info.capital")}:</span>{" "}
              {localized(civ.capital)}
            </div>
          )}
          {civ.dynasty && (
            <div>
              <span className="text-text-muted">{t("info.dynasty")}:</span>{" "}
              {localized(civ.dynasty)}
            </div>
          )}
          <div>
            <span className="text-text-muted">{t("info.government")}:</span>{" "}
            {tWithFallback("govtForm", civ.governmentForm)}
          </div>
          <div>
            <span className="text-text-muted">{t("info.population")}:</span>{" "}
            {region.demographics.population.toLocaleString()}
          </div>
          <div>
            <span className="text-text-muted">{t("tech.era")}:</span>{" "}
            {localized(region.technology.era)}
          </div>
        </div>
      )}

      {!civ && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-secondary">
          <div>
            <span className="text-text-muted">{t("info.population")}:</span>{" "}
            {region.demographics.population.toLocaleString()}
          </div>
          <div>
            <span className="text-text-muted">{t("tech.era")}:</span>{" "}
            {localized(region.technology.era)}
          </div>
        </div>
      )}

      {/* Level bars */}
      <div className="space-y-1.5">
        <StatBar label={t("info.economy")} value={region.economy.level} color="#D4A017" />
        <StatBar label={t("info.military")} value={region.military.level} color="#CD5C5C" />
        <StatBar label={t("info.technology")} value={region.technology.level} color="#4682B4" />
      </div>
    </div>
  );
}
