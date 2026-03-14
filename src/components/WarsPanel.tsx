"use client";

import { useMemo } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import type { War, LocalizedText, WarMetricsSnapshot } from "@/lib/types";

function formatYear(year: number, locale: "zh" | "en"): string {
  if (locale === "zh") return year < 0 ? `公元前${Math.abs(year)}年` : `公元${year}年`;
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  ongoing: { color: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
  ceasefire: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)" },
  stalemate: { color: "#9ca3af", bg: "rgba(156,163,175,0.12)", border: "rgba(156,163,175,0.3)" },
  side1_victory: { color: "#4ade80", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
  side2_victory: { color: "#4ade80", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
};

export default function WarsPanel() {
  const showWarsPanel = useWorldStore((s) => s.showWarsPanel);
  const setShowWarsPanel = useWorldStore((s) => s.setShowWarsPanel);
  const activeWars = useWorldStore((s) => s.activeWars);
  const viewingTime = useWorldStore((s) => s.viewingTime);
  const { locale, t, localized } = useLocale();

  return (
    <div
      className={`absolute top-0 bottom-0 left-0 z-40 w-[400px] glass-panel flex flex-col overflow-hidden border-r border-border-subtle transition-transform duration-300 ease-out ${showWarsPanel ? "translate-x-0" : "-translate-x-full"
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">⚔</span>
          <span className="text-xs font-semibold text-text-primary">
            {t("wars.panelTitle")}
          </span>
          {activeWars.length > 0 && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-900/20 text-red-400 border border-red-900/30">
              {activeWars.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowWarsPanel(false)}
          className="icon-btn tooltip-wrap border border-border-subtle text-text-muted"
          style={{ width: 24, height: 24 }}
          data-tooltip={t("tooltip.close")}
        >
          ✕
        </button>
      </div>

      {/* War list */}
      <div className="flex-1 overflow-y-auto">
        {activeWars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 mb-3">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
            <span className="text-xs">{t("wars.noActiveWars")}</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {activeWars.map((war) => (
              <WarCard
                key={war.id}
                war={war}
                currentYear={viewingTime.year}
                locale={locale}
                t={t}
                localized={localized}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WarCard({
  war,
  currentYear,
  locale,
  t,
  localized,
}: {
  war: War;
  currentYear: number;
  locale: "zh" | "en";
  t: (key: string) => string;
  localized: (text: LocalizedText | undefined) => string;
}) {
  const setSelectedWar = useWorldStore((s) => s.setSelectedWar);
  const currentState = useWorldStore((s) => s.currentState);
  const warSnapshots = useWorldStore((s) => s.warSnapshots);
  const statusCfg = STATUS_CONFIG[war.status] ?? STATUS_CONFIG.ongoing;

  const snapshots: WarMetricsSnapshot[] = warSnapshots[war.id] || [];

  const duration = (war.endYear ?? currentYear) - war.startYear;
  const period = war.endYear
    ? `${formatYear(war.startYear, locale)} — ${formatYear(war.endYear, locale)}`
    : `${formatYear(war.startYear, locale)} — ${t("war.ongoing")}`;

  const side1Regions = currentState?.regions.filter((r) =>
    war.belligerents.side1.regionIds.includes(r.id)
  ) ?? [];
  const side2Regions = currentState?.regions.filter((r) =>
    war.belligerents.side2.regionIds.includes(r.id)
  ) ?? [];

  const totalRegions = war.belligerents.side1.regionIds.length + war.belligerents.side2.regionIds.length;

  const hasVictor = war.victor === "side1" || war.victor === "side2";

  return (
    <div
      className="border-b border-border-subtle px-3 py-3 cursor-pointer hover:bg-bg-tertiary/50 transition-colors"
      onClick={() => setSelectedWar(war)}
    >
      {/* Name + Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold text-red-300 truncate">
            {localized(war.name)}
          </h3>
          <div className="text-xs text-text-muted mt-0.5">{period}</div>
        </div>
        <span
          className="text-xs px-1.5 py-0.5 rounded shrink-0 font-semibold"
          style={{
            color: statusCfg.color,
            background: statusCfg.bg,
            border: `1px solid ${statusCfg.border}`,
          }}
        >
          {t(`war.${war.status}`)}
        </span>
      </div>

      {/* Belligerents */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            {hasVictor && war.victor === "side1" && <span className="text-xs leading-none">👑</span>}
            <span className="text-xs font-semibold text-red-400 truncate">
              {localized(war.belligerents.side1.label)}
            </span>
          </div>
          <div className="flex flex-wrap gap-0.5">
            {side1Regions.map((r) => (
              <span
                key={r.id}
                className="text-xs px-1 py-0.5 rounded bg-red-900/10 text-text-secondary truncate max-w-[100px]"
              >
                {localized(r.name)}
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 w-6 h-6 rounded-full bg-red-900/30 border border-red-800/30 flex items-center justify-center">
          <span className="text-xs font-black text-red-400 leading-none">VS</span>
        </div>

        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-1 mb-0.5 justify-end">
            <span className="text-xs font-semibold text-blue-400 truncate">
              {localized(war.belligerents.side2.label)}
            </span>
            {hasVictor && war.victor === "side2" && <span className="text-xs leading-none">👑</span>}
          </div>
          <div className="flex flex-wrap gap-0.5 justify-end">
            {side2Regions.map((r) => (
              <span
                key={r.id}
                className="text-xs px-1 py-0.5 rounded bg-blue-900/10 text-text-secondary truncate max-w-[100px]"
              >
                {localized(r.name)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Military strength comparison */}
      {snapshots.length >= 1 && (() => {
        const last = snapshots[snapshots.length - 1];
        const s1 = last.side1.totalTroops;
        const s2 = last.side2.totalTroops;
        const total = s1 + s2;
        if (total === 0) return null;
        const s1Pct = Math.round((s1 / total) * 100);
        const s2Pct = 100 - s1Pct;
        const fmtTroops = (v: number) => {
          if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
          if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
          return `${v}`;
        };
        const side1Label = localized(war.belligerents.side1.label);
        const side2Label = localized(war.belligerents.side2.label);
        const dominantLabel = s1Pct > 60 ? side1Label : s2Pct > 60 ? side2Label : null;
        return (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-red-400 font-mono">{fmtTroops(s1)}</span>
              <span className="text-text-muted" style={{ fontSize: 12 }}>⚔ {locale === "zh" ? "兵力" : "Troops"}</span>
              <span className="text-blue-400 font-mono">{fmtTroops(s2)}</span>
            </div>
            <div className="flex h-1.5 rounded-full overflow-hidden bg-bg-tertiary">
              <div className="rounded-l-full" style={{ width: `${s1Pct}%`, background: "linear-gradient(90deg, #f87171, #ef4444)" }} />
              <div className="rounded-r-full" style={{ width: `${s2Pct}%`, background: "linear-gradient(90deg, #3b82f6, #60a5fa)" }} />
            </div>
            {dominantLabel && (
              <div className="flex justify-center mt-1">
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    color: s1Pct > 60 ? "#f87171" : "#60a5fa",
                    background: s1Pct > 60 ? "rgba(248,113,113,0.1)" : "rgba(96,165,250,0.1)",
                  }}
                >
                  {dominantLabel} {locale === "zh" ? "占优" : "dominant"}
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Summary */}
      {war.summary && (
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-2">
          {localized(war.summary)}
        </p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span>{t("wars.duration")}: {duration > 0 ? `${duration} ${locale === "zh" ? "年" : duration === 1 ? "year" : "years"}` : locale === "zh" ? "<1年" : "<1 year"}</span>
        <span className="text-border-subtle">|</span>
        <span>{t("wars.regionsInvolved")}: {totalRegions}</span>
      </div>
    </div>
  );
}
