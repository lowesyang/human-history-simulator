"use client";

import { useRef, useEffect, useState } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import ExplainButton from "@/components/ExplainButton";
import type { EpochChangelog, RegionChangelog, ChangeEntry, ChangeSentiment } from "@/lib/changelog";

const SENTIMENT_COLORS: Record<ChangeSentiment, string> = {
  positive: "#4ead6b",
  negative: "#c95a4a",
  neutral: "",
};

const CATEGORY_ICONS: Record<string, string> = {
  status: "⚑",
  political: "👑",
  demographics: "👥",
  economy: "💰",
  military: "⚔",
  technology: "🔬",
  diplomacy: "🤝",
  culture: "🎭",
  assessment: "📊",
};

const CATEGORY_COLORS: Record<string, string> = {
  war: "#8b3a3a",
  dynasty: "#5b4a8a",
  invention: "#3a6b8b",
  trade: "#2e6b4f",
  religion: "#8a7340",
  disaster: "#8b4513",
  natural_disaster: "#4a7c59",
  exploration: "#2e8b57",
  diplomacy: "#4682b4",
  migration: "#7b6b8a",
  other: "#6b5f4e",
};

function formatYear(year: number, locale: "zh" | "en"): string {
  if (locale === "zh") {
    return year < 0 ? `公元前${Math.abs(year)}年` : `公元${year}年`;
  }
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

export default function EvolutionLogPanel() {
  const showLogPanel = useWorldStore((s) => s.showLogPanel);
  const evolutionLogs = useWorldStore((s) => s.evolutionLogs);
  const setShowLogPanel = useWorldStore((s) => s.setShowLogPanel);
  const { locale, t, localized } = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedEpoch, setExpandedEpoch] = useState<number | null>(null);

  useEffect(() => {
    if (evolutionLogs.length > 0) {
      setExpandedEpoch(evolutionLogs.length - 1);
    }
  }, [evolutionLogs.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [evolutionLogs.length]);

  const toggleEpoch = (idx: number) => {
    setExpandedEpoch((prev) => (prev === idx ? null : idx));
  };

  return (
    <div
      className={`absolute top-0 bottom-0 left-0 z-40 w-[360px] ${locale === "en" ? "sm:w-[420px]" : ""} glass-panel flex flex-col overflow-hidden border-r border-border-subtle transition-transform duration-300 ease-out ${showLogPanel ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-accent-gold text-sm">📜</span>
          <span className="text-xs font-semibold text-text-primary">{t("log.title")}</span>
          {evolutionLogs.length > 0 && (
            <span className="text-xs text-text-muted">({evolutionLogs.length})</span>
          )}
        </div>
        <button
          onClick={() => setShowLogPanel(false)}
          className="icon-btn tooltip-wrap border border-border-subtle text-text-muted"
          style={{ width: 24, height: 24 }}
          data-tooltip={t("tooltip.close")}
        >
          ✕
        </button>
      </div>

      {/* Log entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {evolutionLogs.length === 0 ? (
          <div className="text-center text-xs py-12 text-text-muted">{t("log.empty")}</div>
        ) : (
          <div className="flex flex-col">
            {[...evolutionLogs].reverse().map((log, displayIdx) => {
              const originalIdx = evolutionLogs.length - 1 - displayIdx;
              return (
                <EpochLogEntry
                  key={`${log.targetYear}-${originalIdx}`}
                  log={log}
                  index={originalIdx}
                  expanded={expandedEpoch === originalIdx}
                  onToggle={() => toggleEpoch(originalIdx)}
                  locale={locale}
                  t={t}
                  localized={localized}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EpochLogEntry({
  log,
  index,
  expanded,
  onToggle,
  locale,
  t,
  localized,
}: {
  log: EpochChangelog;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  locale: "zh" | "en";
  t: (key: string) => string;
  localized: (text: { zh: string; en: string } | undefined) => string;
}) {
  const totalChanges = log.regions.reduce((s, r) => s + r.changes.length, 0);

  return (
    <div className="border-b border-border-subtle">
      {/* Epoch header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-tertiary/50 transition-colors"
        onClick={onToggle}
      >
        <span className="text-xs text-text-muted">{expanded ? "▾" : "▸"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-accent-gold">
              {formatYear(log.targetYear, locale)}
            </span>
            <span className="text-xs text-text-muted">
              {localized(log.era)}
            </span>
          </div>
          {log.summary && (
            <div className="text-xs text-text-secondary mt-0.5 truncate">
              {localized(log.summary)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted">
            {log.regions.length} {locale === "zh" ? "文明" : "civ"}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-bg-tertiary text-accent-amber">
            {totalChanges} {t("log.changes")}
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Triggering events */}
          {log.events.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                {t("log.events")}
              </div>
              <div className="flex flex-wrap gap-1">
                {log.events.map((evt, i) => (
                  <span
                    key={i}
                    className="text-xs px-1.5 py-0.5 rounded text-text-primary"
                    style={{ background: CATEGORY_COLORS[evt.category] ?? "#6b5f4e" }}
                  >
                    {localized(evt.title)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Region changes */}
          {log.regions.map((region, idx) => (
            <RegionChangeBlock
              key={`${region.regionId}-${idx}`}
              region={region}
              locale={locale}
              t={t}
              localized={localized}
              epochContext={{
                year: log.targetYear,
                era: localized(log.era),
                eventTitles: log.events.map((e) => localized(e.title)),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RegionChangeBlock({
  region,
  locale,
  t,
  localized,
  epochContext,
}: {
  region: RegionChangelog;
  locale: "zh" | "en";
  t: (key: string) => string;
  localized: (text: { zh: string; en: string } | undefined) => string;
  epochContext: {
    year: number;
    era: string;
    eventTitles: string[];
  };
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded border border-border-subtle overflow-hidden">
      {/* Region header */}
      <div
        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-bg-tertiary/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-xs text-text-muted shrink-0">{expanded ? "▾" : "▸"}</span>
        <span className="text-xs font-semibold text-text-primary truncate min-w-0">
          {localized(region.regionName)}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <span
            className="text-xs px-1 py-0.5 rounded whitespace-nowrap"
            style={{
              background: region.isDirect ? "rgba(201, 168, 76, 0.2)" : "rgba(107, 95, 78, 0.2)",
              color: region.isDirect ? "#c9a84c" : "#8a7d6a",
            }}
          >
            {region.isDirect ? t("log.directlyAffected") : t("log.indirectlyAffected")}
          </span>
          <span className="text-xs text-text-muted whitespace-nowrap">
            {region.changes.length} {t("log.changes")}
          </span>
        </div>
      </div>

      {/* Change entries */}
      {expanded && (
        <div className="border-t border-border-subtle">
          {region.description && (
            <div className="px-2 py-1.5 text-xs text-text-secondary italic border-b border-border-subtle bg-bg-tertiary/30">
              {localized(region.description)}
            </div>
          )}
          {region.changes.length === 0 ? (
            <div className="px-2 py-2 text-xs text-text-muted">{t("log.noChanges")}</div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {region.changes.map((change, i) => (
                <ChangeRow
                  key={i}
                  change={change}
                  localized={localized}
                  locale={locale}
                  regionName={localized(region.regionName)}
                  regionId={region.regionId}
                  regionDescription={localized(region.description)}
                  epochContext={epochContext}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const FIELD_LABEL_FALLBACK: Record<string, { zh: string; en: string }> = {
  status: { zh: "国家状态", en: "Status" },
  "civilization.ruler": { zh: "统治者", en: "Ruler" },
  "civilization.rulerTitle": { zh: "统治者头衔", en: "Ruler Title" },
  "civilization.dynasty": { zh: "朝代", en: "Dynasty" },
  "civilization.capital": { zh: "首都", en: "Capital" },
  "civilization.governmentForm": { zh: "政体", en: "Government Form" },
  "civilization.type": { zh: "文明类型", en: "Civilization Type" },
  "civilization.name": { zh: "文明名称", en: "Civilization Name" },
  "civilization.socialStructure": { zh: "社会结构", en: "Social Structure" },
  "civilization.rulingClass": { zh: "统治阶层", en: "Ruling Class" },
  "civilization.succession": { zh: "继承制度", en: "Succession" },
  "government.structure": { zh: "政府结构", en: "Government Structure" },
  "government.totalOfficials": { zh: "官员总数", en: "Total Officials" },
  "government.localAdmin": { zh: "地方行政", en: "Local Administration" },
  "government.legalSystem": { zh: "法律体系", en: "Legal System" },
  "government.taxationSystem": { zh: "税收制度", en: "Taxation System" },
  "culture.religion": { zh: "宗教", en: "Religion" },
  "culture.philosophy": { zh: "思想", en: "Philosophy" },
  "culture.writingSystem": { zh: "文字系统", en: "Writing System" },
  "culture.culturalAchievements": { zh: "文化成就", en: "Cultural Achievements" },
  "culture.languageFamily": { zh: "语系", en: "Language Family" },
  "economy.level": { zh: "经济水平", en: "Economy Level" },
  "economy.gdpEstimate": { zh: "经济总量", en: "GDP" },
  "economy.gdpPerCapita": { zh: "人均GDP", en: "GDP Per Capita" },
  "economy.gdpDescription": { zh: "经济描述", en: "Economy Description" },
  "economy.mainIndustries": { zh: "主要产业", en: "Main Industries" },
  "economy.tradeGoods": { zh: "贸易商品", en: "Trade Goods" },
  "economy.foreignTradeVolume": { zh: "对外贸易额", en: "Foreign Trade Volume" },
  "economy.tradeRoutes": { zh: "贸易路线", en: "Trade Routes" },
  "economy.economicSystem": { zh: "经济体制", en: "Economic System" },
  "economy.householdWealth": { zh: "家庭财富", en: "Household Wealth" },
  "economy.averageIncome": { zh: "平均收入", en: "Average Income" },
  "economy.currency": { zh: "货币", en: "Currency" },
  "finances.annualRevenue": { zh: "年收入", en: "Annual Revenue" },
  "finances.annualExpenditure": { zh: "年支出", en: "Annual Expenditure" },
  "finances.surplus": { zh: "财政盈余", en: "Surplus" },
  "finances.treasury": { zh: "国库", en: "Treasury" },
  "finances.treasuryDescription": { zh: "国库描述", en: "Treasury Description" },
  "finances.debtLevel": { zh: "债务水平", en: "Debt Level" },
  "finances.fiscalPolicy": { zh: "财政政策", en: "Fiscal Policy" },
  "military.level": { zh: "军事水平", en: "Military Level" },
  "military.standingArmy": { zh: "常备军", en: "Standing Army" },
  "military.reserves": { zh: "后备军", en: "Reserves" },
  "military.totalTroops": { zh: "总兵力", en: "Total Troops" },
  "military.technology": { zh: "军事技术", en: "Military Technology" },
  "military.threats": { zh: "威胁", en: "Threats" },
  "military.recentBattles": { zh: "近期战事", en: "Recent Battles" },
  "military.annualMilitarySpending": { zh: "军费", en: "Military Spending" },
  "military.militarySpendingPctGdp": { zh: "军费占GDP比例", en: "Military Spending % GDP" },
  "demographics.population": { zh: "人口", en: "Population" },
  "demographics.urbanPopulation": { zh: "城市人口", en: "Urban Population" },
  "demographics.populationDescription": { zh: "人口描述", en: "Population Description" },
  "demographics.ethnicGroups": { zh: "民族构成", en: "Ethnic Groups" },
  "demographics.socialClasses": { zh: "社会阶层", en: "Social Classes" },
  "diplomacy.allies": { zh: "盟友", en: "Allies" },
  "diplomacy.enemies": { zh: "敌对", en: "Enemies" },
  "diplomacy.vassals": { zh: "附庸", en: "Vassals" },
  "diplomacy.treaties": { zh: "条约", en: "Treaties" },
  "diplomacy.foreignPolicy": { zh: "外交政策", en: "Foreign Policy" },
  "diplomacy.recentDiplomaticEvents": { zh: "外交事件", en: "Diplomatic Events" },
  "technology.level": { zh: "科技水平", en: "Technology Level" },
  "technology.era": { zh: "技术时代", en: "Technology Era" },
  "technology.keyInnovations": { zh: "关键创新", en: "Key Innovations" },
  "technology.infrastructure": { zh: "基础设施", en: "Infrastructure" },
  "assessment.strengths": { zh: "优势", en: "Strengths" },
  "assessment.weaknesses": { zh: "劣势", en: "Weaknesses" },
  "assessment.outlook": { zh: "前景展望", en: "Outlook" },
  description: { zh: "总体描述", en: "Description" },
};

function resolveLabel(
  label: { zh: string; en: string },
  localized: (text: { zh: string; en: string } | undefined) => string
): string {
  const text = localized(label);
  if (text && !text.includes(".")) return text;
  const fallback = FIELD_LABEL_FALLBACK[text];
  if (fallback) return localized(fallback);
  if (text.includes(".")) {
    const field = text.split(".").pop() || text;
    return field.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
  }
  return text;
}

function ChangeRow({
  change,
  localized,
  locale,
  regionName,
  regionId,
  regionDescription,
  epochContext,
}: {
  change: ChangeEntry;
  localized: (text: { zh: string; en: string } | undefined) => string;
  locale: "zh" | "en";
  regionName: string;
  regionId: string;
  regionDescription: string;
  epochContext: {
    year: number;
    era: string;
    eventTitles: string[];
  };
}) {
  const icon = CATEGORY_ICONS[change.category] || "•";
  const sentimentColor = SENTIMENT_COLORS[change.sentiment];

  return (
    <div className="px-2 py-1.5">
      <div className="flex items-start gap-1.5">
        <span className="text-xs mt-0.5 shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-secondary">
              {resolveLabel(change.label, localized)}
            </span>
            <ExplainButton
              locale={locale}
              regionName={regionName}
              regionId={regionId}
              year={epochContext.year}
              era={epochContext.era}
              eventTitles={epochContext.eventTitles}
              changeLabel={resolveLabel(change.label, localized)}
              changeDetail={localized(change.detail)}
              changeSentiment={change.sentiment}
              regionDescription={regionDescription}
            />
          </div>
          <div
            className={`text-xs leading-relaxed break-words${sentimentColor ? "" : " text-text-primary"}`}
            style={sentimentColor ? { color: sentimentColor } : undefined}
          >
            {localized(change.detail)}
          </div>
        </div>
      </div>
    </div>
  );
}
