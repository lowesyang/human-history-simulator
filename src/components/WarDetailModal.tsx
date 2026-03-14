"use client";

import React, { useState, useMemo } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import type { War, LocalizedText, WarMetricsSnapshot } from "@/lib/types";
import DualLineChart, { type DualLineDataPoint } from "./charts/DualLineChart";

function formatYear(year: number, locale: "zh" | "en"): string {
  if (locale === "zh") return year < 0 ? `公元前${Math.abs(year)}年` : `公元${year}年`;
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

function CrossedSwordsIcon({ size = 18, color = "#f87171" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="3" x2="12" y2="12" />
      <line x1="12" y1="12" x2="20" y2="20" />
      <line x1="3" y1="7" x2="7" y2="3" />
      <line x1="17" y1="21" x2="21" y2="17" />
      <line x1="18" y1="22" x2="22" y2="18" />
      <line x1="21" y1="3" x2="12" y2="12" />
      <line x1="12" y1="12" x2="4" y2="20" />
      <line x1="17" y1="3" x2="21" y2="7" />
      <line x1="3" y1="17" x2="7" y2="21" />
      <line x1="2" y1="18" x2="6" y2="22" />
    </svg>
  );
}

function SkullIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="8" />
      <circle cx="9" cy="9" r="1.5" fill="#9ca3af" />
      <circle cx="15" cy="9" r="1.5" fill="#9ca3af" />
      <path d="M10 22v-4a2 2 0 014 0v4" />
      <path d="M9 14l1.5 2h3L15 14" />
    </svg>
  );
}

type TabId = "overview" | "battles" | "impact";

export default function WarDetailModal() {
  const selectedWar = useWorldStore((s) => s.selectedWar);
  const setSelectedWar = useWorldStore((s) => s.setSelectedWar);
  const warSnapshots = useWorldStore((s) => s.warSnapshots);
  const { locale, t, localized } = useLocale();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  if (!selectedWar) return null;

  const war = selectedWar;
  const snapshots = warSnapshots[war.id] || [];

  const period = war.endYear
    ? `${formatYear(war.startYear, locale)} — ${formatYear(war.endYear, locale)}`
    : `${formatYear(war.startYear, locale)} — ${t("war.ongoing")}`;

  const hasVictor = war.victor === "side1" || war.victor === "side2";
  const hasBattles = war.keyBattles && war.keyBattles.length > 0;

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: t("war.tab.overview") },
    ...(hasBattles ? [{ id: "battles" as TabId, label: t("war.tab.battles") }] : []),
    { id: "impact", label: t("war.tab.impact") },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => setSelectedWar(null)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative rounded-lg max-w-[560px] w-full mx-4 border border-red-900/40 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ background: "linear-gradient(to bottom, #1e1611, #151210)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-red-900/30 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-900/30 flex items-center justify-center border border-red-900/20">
              <CrossedSwordsIcon size={20} />
            </div>
            <div>
              <h2 className="text-sm font-cinzel font-bold text-red-300">
                {localized(war.name)}
              </h2>
              <div className="text-xs text-text-muted mt-0.5">{period}</div>
            </div>
          </div>
          <button
            onClick={() => setSelectedWar(null)}
            className="text-text-muted hover:text-text-primary transition-colors p-1"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 px-4 py-2 text-xs font-semibold transition-colors relative"
              style={{
                color: activeTab === tab.id ? "#f87171" : "#8a8070",
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "overview" ? (
            <OverviewTab war={war} locale={locale} t={t} localized={localized} hasVictor={hasVictor} />
          ) : activeTab === "battles" ? (
            <BattlesTab war={war} locale={locale} t={t} localized={localized} />
          ) : (
            <ImpactTab war={war} snapshots={snapshots} locale={locale} t={t} localized={localized} />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({
  war,
  locale,
  t,
  localized,
  hasVictor,
}: {
  war: War;
  locale: "zh" | "en";
  t: (key: string) => string;
  localized: (text: LocalizedText | undefined) => string;
  hasVictor: boolean;
}) {
  const victorSide = war.victor;
  const side1Victor = victorSide === "side1";
  const side2Victor = victorSide === "side2";
  const side1Defeated = hasVictor && !side1Victor;
  const side2Defeated = hasVictor && !side2Victor;

  return (
    <div className="px-5 py-4 space-y-4">
      {/* Belligerents VS layout */}
      <div className="relative">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-0 items-stretch">
          <BelligerentCard
            label={war.belligerents.side1.label}
            regionIds={war.belligerents.side1.regionIds}
            localized={localized}
            isVictor={side1Victor}
            isDefeated={side1Defeated}
            t={t}
            align="right"
          />
          <div className="flex flex-col items-center justify-center px-2">
            <div className="w-8 h-8 rounded-full bg-red-900/40 border border-red-800/40 flex items-center justify-center">
              <span className="text-xs font-black text-red-400 tracking-tight">VS</span>
            </div>
          </div>
          <BelligerentCard
            label={war.belligerents.side2.label}
            regionIds={war.belligerents.side2.regionIds}
            localized={localized}
            isVictor={side2Victor}
            isDefeated={side2Defeated}
            t={t}
            align="left"
          />
        </div>
      </div>

      {/* Theater */}
      {war.theater && localized(war.theater) && (
        <Section title={t("war.theater")} icon="\uD83D\uDDFA\uFE0F">
          <p className="text-xs leading-relaxed text-text-primary">{localized(war.theater)}</p>
        </Section>
      )}

      {/* Summary */}
      <Section title={t("war.summary")} icon={<CrossedSwordsIcon size={13} color="#c4b49a" />}>
        <p className="text-xs leading-relaxed text-text-primary">{localized(war.summary)}</p>
      </Section>

      {/* Casualties */}
      {war.casualties && (
        <CasualtiesSection
          casualties={war.casualties}
          side1Label={localized(war.belligerents.side1.label)}
          side2Label={localized(war.belligerents.side2.label)}
          t={t}
          localized={localized}
        />
      )}

      {/* Cause */}
      <Section title={t("war.cause")} icon="\uD83D\uDD0D">
        <p className="text-xs leading-relaxed text-text-primary">{localized(war.cause)}</p>
      </Section>

      {/* Casus Belli */}
      <Section title={t("war.casus_belli")} icon="\uD83D\uDD25">
        <p className="text-xs leading-relaxed text-text-primary">{localized(war.casus_belli)}</p>
      </Section>

      {/* Advantages */}
      <div>
        <div className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1.5">
          <span>\u2696\uFE0F</span>
          <span>{t("war.advantages")}</span>
        </div>
        <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden border border-border-subtle">
          <SidePanel
            label={war.belligerents.side1.label}
            content={war.advantages.side1}
            localized={localized}
            isVictor={side1Victor}
            isDefeated={side1Defeated}
            side="left"
          />
          <SidePanel
            label={war.belligerents.side2.label}
            content={war.advantages.side2}
            localized={localized}
            isVictor={side2Victor}
            isDefeated={side2Defeated}
            side="right"
          />
        </div>
      </div>

      {/* Impact */}
      {war.impact && (localized(war.impact.side1) || localized(war.impact.side2)) && (
        <div>
          <div className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1.5">
            <span>\uD83D\uDCA5</span>
            <span>{t("war.impact")}</span>
          </div>
          <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden border border-border-subtle">
            <SidePanel
              label={war.belligerents.side1.label}
              content={war.impact.side1}
              localized={localized}
              isVictor={side1Victor}
              isDefeated={side1Defeated}
              side="left"
            />
            <SidePanel
              label={war.belligerents.side2.label}
              content={war.impact.side2}
              localized={localized}
              isVictor={side2Victor}
              isDefeated={side2Defeated}
              side="right"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CasualtiesSection({
  casualties,
  side1Label,
  side2Label,
  t,
  localized,
}: {
  casualties: NonNullable<War["casualties"]>;
  side1Label: string;
  side2Label: string;
  t: (key: string) => string;
  localized: (text: LocalizedText | undefined) => string;
}) {
  const s1Total = (casualties.side1.military || 0) + (casualties.side1.civilian || 0);
  const s2Total = (casualties.side2.military || 0) + (casualties.side2.civilian || 0);
  const grandTotal = s1Total + s2Total;
  const s1Pct = grandTotal > 0 ? Math.round((s1Total / grandTotal) * 100) : 50;

  return (
    <div>
      <div className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1.5">
        <span>\uD83D\uDC80</span>
        <span>{t("war.casualties")}</span>
      </div>
      <div className="rounded-lg border border-border-subtle p-3 space-y-3">
        {/* Comparison bar */}
        {grandTotal > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-red-400 font-mono">{fmtCompact(s1Total)}</span>
              <span className="text-text-muted">{t("war.totalCasualties")}</span>
              <span className="text-blue-400 font-mono">{fmtCompact(s2Total)}</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-bg-tertiary">
              <div className="rounded-l-full" style={{ width: `${s1Pct}%`, background: "linear-gradient(90deg, #f87171, #ef4444)" }} />
              <div className="rounded-r-full" style={{ width: `${100 - s1Pct}%`, background: "linear-gradient(90deg, #3b82f6, #60a5fa)" }} />
            </div>
          </div>
        )}

        {/* Side-by-side details */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-semibold text-red-400 mb-1">{side1Label}</div>
            <div className="text-xs text-text-secondary space-y-0.5">
              <div>{t("war.militaryCasualties")}: <span className="font-mono text-text-primary">{fmtCompact(casualties.side1.military || 0)}</span></div>
              <div>{t("war.civilianCasualties")}: <span className="font-mono text-text-primary">{fmtCompact(casualties.side1.civilian || 0)}</span></div>
              {casualties.side1.description && (
                <p className="text-text-muted mt-1">{localized(casualties.side1.description)}</p>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-blue-400 mb-1">{side2Label}</div>
            <div className="text-xs text-text-secondary space-y-0.5">
              <div>{t("war.militaryCasualties")}: <span className="font-mono text-text-primary">{fmtCompact(casualties.side2.military || 0)}</span></div>
              <div>{t("war.civilianCasualties")}: <span className="font-mono text-text-primary">{fmtCompact(casualties.side2.civilian || 0)}</span></div>
              {casualties.side2.description && (
                <p className="text-text-muted mt-1">{localized(casualties.side2.description)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BattlesTab({
  war,
  locale,
  t,
  localized,
}: {
  war: War;
  locale: "zh" | "en";
  t: (key: string) => string;
  localized: (text: LocalizedText | undefined) => string;
}) {
  const battles = war.keyBattles || [];
  const side1Label = localized(war.belligerents.side1.label);
  const side2Label = localized(war.belligerents.side2.label);

  if (battles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <span className="text-xs">{t("war.noBattles")}</span>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 space-y-3">
      {battles.map((battle, i) => (
        <div
          key={i}
          className="rounded-lg border border-red-900/30 overflow-hidden"
          style={{ background: "rgba(127,29,29,0.08)" }}
        >
          {/* Battle header */}
          <div className="px-3 py-2 border-b border-red-900/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CrossedSwordsIcon size={13} color="#f87171" />
              <span className="text-xs font-bold text-red-300">{localized(battle.name)}</span>
            </div>
            <span className="text-xs font-mono text-text-muted">{formatYear(battle.year, locale)}</span>
          </div>

          <div className="px-3 py-2.5 space-y-2">
            {/* Location */}
            {battle.location && (
              <div className="text-xs text-text-secondary">
                <span className="text-text-muted">{t("war.battleLocation")}:</span> {localized(battle.location)}
              </div>
            )}

            {/* Tactical description */}
            <p className="text-xs text-text-primary leading-relaxed">{localized(battle.description)}</p>

            {/* Outcome */}
            <div className="text-xs">
              <span className="font-semibold text-amber-400">{t("military.outcome")}:</span>{" "}
              <span className="text-text-primary">{localized(battle.outcome)}</span>
            </div>

            {/* Per-battle casualties */}
            {battle.casualties && (battle.casualties.side1 > 0 || battle.casualties.side2 > 0) && (
              <div className="flex items-center gap-4 text-xs pt-1 border-t border-border-subtle mt-1">
                <span className="text-text-muted">{t("war.casualties")}:</span>
                <span className="text-red-400">{side1Label}: <span className="font-mono">{fmtCompact(battle.casualties.side1)}</span></span>
                <span className="text-blue-400">{side2Label}: <span className="font-mono">{fmtCompact(battle.casualties.side2)}</span></span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ImpactTab({
  war,
  snapshots,
  locale,
  t,
  localized,
}: {
  war: War;
  snapshots: WarMetricsSnapshot[];
  locale: "zh" | "en";
  t: (key: string) => string;
  localized: (text: LocalizedText | undefined) => string;
}) {
  const side1Label = localized(war.belligerents.side1.label);
  const side2Label = localized(war.belligerents.side2.label);

  const militaryData: DualLineDataPoint[] = useMemo(
    () => snapshots.map((s) => ({ year: s.year, side1Value: s.side1.totalTroops, side2Value: s.side2.totalTroops })),
    [snapshots]
  );

  const gdpData: DualLineDataPoint[] = useMemo(
    () => snapshots.map((s) => ({ year: s.year, side1Value: s.side1.gdpGoldKg, side2Value: s.side2.gdpGoldKg })),
    [snapshots]
  );

  const populationData: DualLineDataPoint[] = useMemo(
    () => snapshots.map((s) => ({ year: s.year, side1Value: s.side1.population, side2Value: s.side2.population })),
    [snapshots]
  );

  const techData: DualLineDataPoint[] = useMemo(
    () => snapshots.map((s) => ({ year: s.year, side1Value: s.side1.techLevel, side2Value: s.side2.techLevel })),
    [snapshots]
  );

  const casualtyData: DualLineDataPoint[] = useMemo(
    () => snapshots
      .filter((s) => (s.side1.casualties ?? 0) > 0 || (s.side2.casualties ?? 0) > 0)
      .map((s) => ({ year: s.year, side1Value: s.side1.casualties ?? 0, side2Value: s.side2.casualties ?? 0 })),
    [snapshots]
  );

  const moraleData: DualLineDataPoint[] = useMemo(
    () => snapshots
      .filter((s) => (s.side1.morale ?? 0) > 0 || (s.side2.morale ?? 0) > 0)
      .map((s) => ({ year: s.year, side1Value: s.side1.morale ?? 5, side2Value: s.side2.morale ?? 5 })),
    [snapshots]
  );

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-30 mb-3">
          <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 5-5" />
        </svg>
        <span className="text-xs">{t("war.noImpactData")}</span>
        <span className="text-xs text-text-muted mt-1">{t("war.noImpactDataHint")}</span>
      </div>
    );
  }

  const formatTroops = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v.toFixed(0);
  };

  const formatGdp = (v: number) => {
    if (Math.abs(v) >= 1_000_000_000_000) return `$${(v / 1_000_000_000_000).toFixed(1)}T`;
    if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
  };

  const formatPop = (v: number) => {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v.toFixed(0);
  };

  return (
    <div className="px-5 py-4 space-y-5">
      {snapshots.length >= 1 && <SummaryBadges snapshots={snapshots} side1Label={side1Label} side2Label={side2Label} t={t} />}

      <DualLineChart
        data={militaryData}
        title={t("war.chart.military")}
        side1Label={side1Label}
        side2Label={side2Label}
        formatValue={formatTroops}
        showWarStart
        warStartYear={war.startYear}
        width={480}
        height={140}
      />

      {casualtyData.length > 0 && (
        <DualLineChart
          data={casualtyData}
          title={t("war.chart.casualties")}
          side1Label={side1Label}
          side2Label={side2Label}
          side1Color="#dc2626"
          side2Color="#7c3aed"
          formatValue={formatTroops}
          showWarStart
          warStartYear={war.startYear}
          width={480}
          height={120}
        />
      )}

      {moraleData.length > 0 && (
        <DualLineChart
          data={moraleData}
          title={t("war.chart.morale")}
          side1Label={side1Label}
          side2Label={side2Label}
          side1Color="#f59e0b"
          side2Color="#06b6d4"
          formatValue={(v) => `${v.toFixed(0)}/10`}
          showWarStart
          warStartYear={war.startYear}
          width={480}
          height={100}
        />
      )}

      <DualLineChart
        data={gdpData}
        title={t("war.chart.economy")}
        side1Label={side1Label}
        side2Label={side2Label}
        side1Color="#f59e0b"
        side2Color="#10b981"
        formatValue={formatGdp}
        showWarStart
        warStartYear={war.startYear}
        width={480}
        height={140}
      />

      <DualLineChart
        data={populationData}
        title={t("war.chart.population")}
        side1Label={side1Label}
        side2Label={side2Label}
        side1Color="#a78bfa"
        side2Color="#67e8f9"
        formatValue={formatPop}
        showWarStart
        warStartYear={war.startYear}
        width={480}
        height={140}
      />

      <DualLineChart
        data={techData}
        title={t("war.chart.technology")}
        side1Label={side1Label}
        side2Label={side2Label}
        side1Color="#f472b6"
        side2Color="#34d399"
        formatValue={(v) => `Lv.${v.toFixed(0)}`}
        showWarStart
        warStartYear={war.startYear}
        width={480}
        height={100}
      />
    </div>
  );
}

function SummaryBadges({
  snapshots,
  side1Label,
  side2Label,
  t,
}: {
  snapshots: WarMetricsSnapshot[];
  side1Label: string;
  side2Label: string;
  t: (key: string) => string;
}) {
  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const hasChange = snapshots.length >= 2;

  const metrics = [
    {
      label: t("war.chart.military"),
      s1Pct: hasChange ? pctDelta(first.side1.totalTroops, last.side1.totalTroops) : null,
      s2Pct: hasChange ? pctDelta(first.side2.totalTroops, last.side2.totalTroops) : null,
      s1Abs: last.side1.totalTroops,
      s2Abs: last.side2.totalTroops,
      fmt: fmtTroops,
    },
    {
      label: t("war.chart.economy"),
      s1Pct: hasChange ? pctDelta(first.side1.gdpGoldKg, last.side1.gdpGoldKg) : null,
      s2Pct: hasChange ? pctDelta(first.side2.gdpGoldKg, last.side2.gdpGoldKg) : null,
      s1Abs: last.side1.gdpGoldKg,
      s2Abs: last.side2.gdpGoldKg,
      fmt: fmtCompact,
    },
    {
      label: t("war.chart.population"),
      s1Pct: hasChange ? pctDelta(first.side1.population, last.side1.population) : null,
      s2Pct: hasChange ? pctDelta(first.side2.population, last.side2.population) : null,
      s1Abs: last.side1.population,
      s2Abs: last.side2.population,
      fmt: fmtCompact,
    },
  ];

  return (
    <div className="rounded-lg border border-border-subtle p-3 space-y-2">
      <div className="text-xs font-semibold text-text-secondary mb-1">{t("war.impactSummary")}</div>
      <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1.5 text-xs">
        <div />
        <div className="font-semibold text-red-400 text-center">{side1Label}</div>
        <div className="font-semibold text-blue-400 text-center">{side2Label}</div>
        {metrics.map((m) => (
          <React.Fragment key={m.label}>
            <div className="text-text-muted">{m.label}</div>
            <MetricCell pct={m.s1Pct} abs={m.s1Abs} fmt={m.fmt} />
            <MetricCell pct={m.s2Pct} abs={m.s2Abs} fmt={m.fmt} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function MetricCell({ pct, abs, fmt }: { pct: number | null; abs: number; fmt: (v: number) => string }) {
  if (pct != null && pct !== 0) {
    const color = pct >= 0 ? "#4ade80" : "#f87171";
    const sign = pct >= 0 ? "+" : "";
    return (
      <div className="text-center font-mono" style={{ color }}>
        {sign}{pct.toFixed(1)}%
      </div>
    );
  }
  return (
    <div className="text-center font-mono text-text-secondary">
      {fmt(abs)}
    </div>
  );
}

function fmtCompact(v: number): string {
  if (v >= 1_000_000_000_000) return `${(v / 1_000_000_000_000).toFixed(1)}T`;
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toFixed(0);
}

function fmtTroops(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toFixed(0);
}

function pctDelta(from: number, to: number): number | null {
  if (from === 0) return null;
  return ((to - from) / Math.abs(from)) * 100;
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      <div className="rounded-md bg-bg-secondary/60 border border-border-subtle p-2.5">
        {children}
      </div>
    </div>
  );
}

function SidePanel({
  label,
  content,
  localized,
  isVictor,
  isDefeated,
  side,
}: {
  label: LocalizedText;
  content: LocalizedText;
  localized: (t: LocalizedText | undefined) => string;
  isVictor: boolean;
  isDefeated: boolean;
  side: "left" | "right";
}) {
  const bgStyle = isVictor
    ? side === "left"
      ? "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.03) 100%)"
      : "linear-gradient(225deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.03) 100%)"
    : isDefeated
      ? "linear-gradient(135deg, rgba(107,114,128,0.1) 0%, rgba(107,114,128,0.02) 100%)"
      : side === "left"
        ? "rgba(239,68,68,0.04)"
        : "rgba(59,130,246,0.04)";

  const nameColor = isVictor ? "#4ade80" : isDefeated ? "#9ca3af" : side === "left" ? "#f87171" : "#60a5fa";
  const textColor = isDefeated ? "#787878" : "#e8dcc8";

  return (
    <div
      className={`p-3 ${side === "left" ? "border-r border-border-subtle" : ""}`}
      style={{ background: bgStyle }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {isVictor && <span className="text-xs leading-none">\uD83D\uDC51</span>}
        {isDefeated && <SkullIcon />}
        <span className="text-xs font-bold" style={{ color: nameColor }}>
          {localized(label)}
        </span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: textColor }}>
        {localized(content)}
      </p>
    </div>
  );
}

function BelligerentCard({
  label,
  regionIds,
  localized,
  isVictor,
  isDefeated,
  t,
  align,
}: {
  label: LocalizedText;
  regionIds: string[];
  localized: (t: LocalizedText | undefined) => string;
  isVictor: boolean;
  isDefeated: boolean;
  t: (key: string) => string;
  align: "left" | "right";
}) {
  const currentState = useWorldStore((s) => s.currentState);
  const regions = currentState?.regions.filter((r) => regionIds.includes(r.id)) ?? [];

  const bgStyle = isVictor
    ? align === "right"
      ? "linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.03) 100%)"
      : "linear-gradient(225deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.03) 100%)"
    : isDefeated
      ? "rgba(107,114,128,0.06)"
      : "rgba(239,68,68,0.04)";

  const borderColor = isVictor ? "rgba(34,197,94,0.35)" : isDefeated ? "rgba(107,114,128,0.2)" : "rgba(201,168,76,0.15)";
  const nameColor = isVictor ? "#4ade80" : isDefeated ? "#6b7280" : "#e8dcc8";

  return (
    <div
      className="rounded-lg p-3 relative flex flex-col items-center text-center"
      style={{ background: bgStyle, border: `1px solid ${borderColor}` }}
    >
      {isVictor && (
        <div className="flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25">
          <span className="text-xs leading-none">\uD83D\uDC51</span>
          <span className="text-xs font-bold text-amber-400">{t("war.victor")}</span>
        </div>
      )}
      {isDefeated && (
        <div className="flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/15">
          <SkullIcon />
          <span className="text-xs font-semibold text-gray-500">{t("war.defeated")}</span>
        </div>
      )}
      <div
        className="text-[13px] font-bold mb-1.5"
        style={{ color: nameColor, opacity: isDefeated ? 0.7 : 1 }}
      >
        {localized(label)}
      </div>
      {regions.map((r) => (
        <div key={r.id} className="flex items-center gap-1 text-xs justify-center" style={{ color: isDefeated ? "#6b7280" : "#c4b49a" }}>
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: isVictor ? "#4ade80" : isDefeated ? "#6b7280" : "#c4b49a" }}
          />
          <span>{localized(r.name)}</span>
        </div>
      ))}
    </div>
  );
}
