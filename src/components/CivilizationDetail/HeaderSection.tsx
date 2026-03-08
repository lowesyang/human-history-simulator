"use client";

import type { Region } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import StatBar from "./StatBar";

const STATUS_COLORS: Record<string, string> = {
  thriving: "#4ade80",
  stable: "#60a5fa",
  declining: "#fbbf24",
  conflict: "#f87171",
  collapsed: "#9ca3af",
};

export default function HeaderSection({ region }: { region: Region }) {
  const { t, localized } = useLocale();

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between pr-6">
        <div className="min-w-0 flex-1">
          <h2 className="font-cinzel text-lg font-bold text-text-primary">
            {localized(region.name)}
          </h2>
          <div className="text-xs text-text-secondary">
            {localized(region.civilization.name)}
          </div>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize shrink-0 ml-2 text-white"
          style={{ background: STATUS_COLORS[region.status] ?? "#888" }}
        >
          {t(`status.${region.status}`)}
        </span>
      </div>

      {/* Key info */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-secondary">
        {region.civilization.ruler && (
          <div>
            <span className="text-text-muted">{t("info.ruler")}:</span>{" "}
            {localized(region.civilization.ruler)}
            {region.civilization.rulerTitle &&
              ` · ${localized(region.civilization.rulerTitle)}`}
          </div>
        )}
        {region.civilization.capital && (
          <div>
            <span className="text-text-muted">{t("info.capital")}:</span>{" "}
            {localized(region.civilization.capital)}
          </div>
        )}
        {region.civilization.dynasty && (
          <div>
            <span className="text-text-muted">{t("info.dynasty")}:</span>{" "}
            {localized(region.civilization.dynasty)}
          </div>
        )}
        <div>
          <span className="text-text-muted">{t("info.government")}:</span>{" "}
          {t(`govtForm.${region.civilization.governmentForm}`)}
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

      {/* Level bars */}
      <div className="space-y-1.5">
        <StatBar label={t("info.economy")} value={region.economy.level} color="#D4A017" />
        <StatBar label={t("info.military")} value={region.military.level} color="#CD5C5C" />
        <StatBar label={t("info.technology")} value={region.technology.level} color="#4682B4" />
      </div>
    </div>
  );
}
