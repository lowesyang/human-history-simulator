"use client";

import type { Region } from "@/lib/types";
import { normalizeStatus } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { getRegionFlag } from "@/lib/flags";
import StatBar from "./StatBar";

const STATUS_COLORS: Record<string, string> = {
  thriving: "#22c55e",
  rising: "#10b981",
  stable: "#d97706",
  declining: "#eab308",
  conflict: "#ef4444",
  collapsed: "#8b5cf6",
};

function safeNum(v: unknown): number {
  return typeof v === "number" && !Number.isNaN(v) ? v : 0;
}

export default function HeaderSection({ region }: { region: Region }) {
  const { t, localized, tWithFallback } = useLocale();
  const status = normalizeStatus(region.status);
  const civ = region.civilization;
  const flag = getRegionFlag(region.id);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between pr-6">
        <div className="min-w-0 flex-1 flex items-start gap-2.5">
          <span
            className="shrink-0 flex items-center justify-center rounded-md mt-0.5"
            style={{
              width: 36,
              height: 36,
              fontSize: flag.type === "flag" ? 28 : 22,
              background:
                flag.type === "fallback"
                  ? "rgba(255,255,255,0.06)"
                  : "transparent",
              lineHeight: 1,
            }}
            title={region.id}
          >
            {flag.emoji}
          </span>
          <div className="min-w-0">
            <h2 className="font-cinzel text-lg font-bold text-text-primary">
              {localized(region.name)}
            </h2>
            {civ?.name && (
              <div className="text-xs text-text-secondary">
                {localized(civ.name)}
              </div>
            )}
          </div>
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
            {safeNum(region.demographics?.population).toLocaleString()}
          </div>
          <div>
            <span className="text-text-muted">{t("tech.era")}:</span>{" "}
            {region.technology?.era ? localized(region.technology.era) : "—"}
          </div>
        </div>
      )}

      {!civ && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-secondary">
          <div>
            <span className="text-text-muted">{t("info.population")}:</span>{" "}
            {safeNum(region.demographics?.population).toLocaleString()}
          </div>
          <div>
            <span className="text-text-muted">{t("tech.era")}:</span>{" "}
            {region.technology?.era ? localized(region.technology.era) : "—"}
          </div>
        </div>
      )}

      {/* Level bars */}
      <div className="space-y-1.5">
        <StatBar label={t("info.economy")} value={safeNum(region.economy?.level)} color="#D4A017" />
        <StatBar label={t("info.military")} value={safeNum(region.military?.level)} color="#CD5C5C" />
        <StatBar label={t("info.technology")} value={safeNum(region.technology?.level)} color="#4682B4" />
      </div>
    </div>
  );
}
