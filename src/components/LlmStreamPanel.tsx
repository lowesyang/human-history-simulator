"use client";

import { Fragment, useRef, useEffect, useState, useMemo } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";

type Locale = "zh" | "en";

interface ParsedTransition {
  era?: string;
  summary?: string;
  regions: {
    regionId: string;
    description?: string;
    changes: { field: string; value: string }[];
  }[];
  raw?: string;
}

function getRegionName(regionId: string, locale: Locale): string {
  const state = useWorldStore.getState().currentState;
  if (!state) return regionId;
  const region = state.regions.find((r) => r.id === regionId);
  return region ? region.name[locale] : regionId;
}

function extractLocalized(obj: unknown, locale: Locale): string | null {
  if (!obj || typeof obj !== "object") return null;
  const rec = obj as Record<string, unknown>;
  if (typeof rec[locale] === "string") return rec[locale] as string;
  const fallback = locale === "zh" ? "en" : "zh";
  if (typeof rec[fallback] === "string") return rec[fallback] as string;
  return null;
}

function formatChangeValue(value: unknown, locale: Locale): string {
  if (value === null) return "—";
  if (typeof value === "number") {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toLocaleString()}`;
  }
  if (typeof value === "string") {
    if (value.startsWith("=")) return value.slice(1);
    return value;
  }
  if (typeof value === "object" && value !== null) {
    const localized = extractLocalized(value, locale);
    if (localized) return localized;
    const rec = value as Record<string, unknown>;
    if ("amount" in rec || "goldKg" in rec) {
      const parts: string[] = [];
      if (typeof rec.amount === "number") {
        const sign = rec.amount > 0 ? "+" : "";
        parts.push(`${sign}${rec.amount.toLocaleString()}`);
      }
      if (typeof rec.goldKg === "number") {
        const sign = rec.goldKg > 0 ? "+" : "";
        parts.push(`${sign}${rec.goldKg}kg gold`);
      }
      return parts.join(", ") || JSON.stringify(value);
    }
    return JSON.stringify(value);
  }
  return String(value);
}

const FIELD_LABELS: Record<string, Record<Locale, string>> = {
  status: { zh: "状态", en: "Status" },
  description: { zh: "描述", en: "Description" },

  "civilization.name": { zh: "文明名称", en: "Civ. Name" },
  "civilization.type": { zh: "文明类型", en: "Civ. Type" },
  "civilization.ruler": { zh: "统治者", en: "Ruler" },
  "civilization.rulerTitle": { zh: "统治者头衔", en: "Ruler Title" },
  "civilization.dynasty": { zh: "王朝", en: "Dynasty" },
  "civilization.capital": { zh: "首都", en: "Capital" },
  "civilization.governmentForm": { zh: "政体", en: "Government" },
  "civilization.socialStructure": { zh: "社会结构", en: "Social Structure" },
  "civilization.rulingClass": { zh: "统治阶级", en: "Ruling Class" },
  "civilization.succession": { zh: "继承制度", en: "Succession" },

  "government.structure": { zh: "政府结构", en: "Gov. Structure" },
  "government.totalOfficials": { zh: "官员总数", en: "Total Officials" },
  "government.localAdmin": { zh: "地方行政", en: "Local Admin" },
  "government.legalSystem": { zh: "法律制度", en: "Legal System" },
  "government.taxationSystem": { zh: "税制", en: "Taxation" },

  "culture.religion": { zh: "宗教", en: "Religion" },
  "culture.philosophy": { zh: "哲学", en: "Philosophy" },
  "culture.writingSystem": { zh: "文字系统", en: "Writing System" },
  "culture.culturalAchievements": { zh: "文化成就", en: "Cultural Achievements" },
  "culture.languageFamily": { zh: "语系", en: "Language Family" },

  "economy.level": { zh: "经济水平", en: "Economy Lv." },
  "economy.gdpEstimate": { zh: "GDP 估算", en: "GDP Est." },
  "economy.gdpPerCapita": { zh: "人均 GDP", en: "GDP/Capita" },
  "economy.gdpDescription": { zh: "经济概况", en: "GDP Desc." },
  "economy.mainIndustries": { zh: "主要产业", en: "Industries" },
  "economy.tradeGoods": { zh: "贸易商品", en: "Trade Goods" },
  "economy.householdWealth": { zh: "家庭财富", en: "Household Wealth" },
  "economy.averageIncome": { zh: "平均收入", en: "Avg. Income" },
  "economy.foreignTradeVolume": { zh: "外贸规模", en: "Foreign Trade" },
  "economy.tradeRoutes": { zh: "贸易路线", en: "Trade Routes" },
  "economy.economicSystem": { zh: "经济体制", en: "Economic System" },

  "finances.annualRevenue": { zh: "年收入", en: "Annual Revenue" },
  "finances.annualExpenditure": { zh: "年支出", en: "Annual Expenditure" },
  "finances.surplus": { zh: "盈余", en: "Surplus" },
  "finances.treasury": { zh: "国库", en: "Treasury" },
  "finances.treasuryDescription": { zh: "国库概况", en: "Treasury Desc." },
  "finances.debtLevel": { zh: "债务水平", en: "Debt Level" },
  "finances.fiscalPolicy": { zh: "财政政策", en: "Fiscal Policy" },

  "military.level": { zh: "军事水平", en: "Military Lv." },
  "military.totalTroops": { zh: "总兵力", en: "Total Troops" },
  "military.standingArmy": { zh: "常备军", en: "Standing Army" },
  "military.reserves": { zh: "预备役", en: "Reserves" },
  "military.technology": { zh: "军事技术", en: "Military Tech" },
  "military.annualMilitarySpending": { zh: "军费开支", en: "Military Spending" },
  "military.militarySpendingPctGdp": { zh: "军费占 GDP", en: "Military % GDP" },
  "military.threats": { zh: "威胁", en: "Threats" },
  "military.recentBattles": { zh: "近期战役", en: "Recent Battles" },

  "demographics.population": { zh: "人口", en: "Population" },
  "demographics.populationDescription": { zh: "人口概况", en: "Pop. Desc." },
  "demographics.urbanPopulation": { zh: "城市人口", en: "Urban Pop." },
  "demographics.urbanizationRate": { zh: "城市化率", en: "Urbanization" },
  "demographics.ethnicGroups": { zh: "民族构成", en: "Ethnic Groups" },
  "demographics.socialClasses": { zh: "社会阶层", en: "Social Classes" },
  "demographics.literacyRate": { zh: "识字率", en: "Literacy" },
  "demographics.lifeExpectancy": { zh: "预期寿命", en: "Life Expectancy" },

  "diplomacy.allies": { zh: "盟友", en: "Allies" },
  "diplomacy.enemies": { zh: "敌对", en: "Enemies" },
  "diplomacy.vassals": { zh: "附庸", en: "Vassals" },
  "diplomacy.tributeRelations": { zh: "朝贡关系", en: "Tribute Relations" },
  "diplomacy.treaties": { zh: "条约", en: "Treaties" },
  "diplomacy.foreignPolicy": { zh: "外交政策", en: "Foreign Policy" },
  "diplomacy.recentDiplomaticEvents": { zh: "近期外交", en: "Recent Diplomacy" },

  "technology.level": { zh: "科技水平", en: "Tech Lv." },
  "technology.era": { zh: "技术时代", en: "Tech Era" },
  "technology.keyInnovations": { zh: "关键创新", en: "Key Innovations" },
  "technology.infrastructure": { zh: "基础设施", en: "Infrastructure" },

  "assessment.strengths": { zh: "优势", en: "Strengths" },
  "assessment.weaknesses": { zh: "劣势", en: "Weaknesses" },
  "assessment.outlook": { zh: "前景展望", en: "Outlook" },
};

function camelToReadable(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function getFieldLabel(field: string, locale: Locale): string {
  const label = FIELD_LABELS[field];
  if (label) return label[locale];
  const parts = field.split(".");
  const lastPart = parts[parts.length - 1];
  return camelToReadable(lastPart);
}

function parseStreamContent(content: string, locale: Locale): ParsedTransition {
  const result: ParsedTransition = { regions: [] };

  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(content);
  } catch {
    let patched = content.trim();
    // Try to close open braces/brackets to parse partial JSON
    const opens = (patched.match(/[{[]/g) || []).length;
    const closes = (patched.match(/[}\]]/g) || []).length;
    const diff = opens - closes;
    if (diff > 0) {
      // Heuristic: trim trailing incomplete key/value, then close braces
      patched = patched.replace(/,\s*"[^"]*"?\s*:?\s*[^,}\]]*$/, "");
      for (let i = 0; i < diff; i++) {
        const lastOpen = Math.max(patched.lastIndexOf("{"), patched.lastIndexOf("["));
        patched += lastOpen >= 0 && patched[lastOpen] === "[" ? "]" : "}";
      }
    }
    try {
      json = JSON.parse(patched);
    } catch {
      // still can't parse — try to extract readable fragments via regex
    }
  }

  if (json) {
    const era = extractLocalized(json.era, locale);
    if (era) result.era = era;

    const summary = extractLocalized(json.summary, locale);
    if (summary) result.summary = summary;

    if (Array.isArray(json.transitions)) {
      for (const t of json.transitions) {
        if (!t || typeof t !== "object") continue;
        const tr = t as Record<string, unknown>;
        const desc = extractLocalized(tr.description, locale) ?? undefined;
        const changes: { field: string; value: string }[] = [];
        if (tr.changes && typeof tr.changes === "object") {
          for (const [field, val] of Object.entries(
            tr.changes as Record<string, unknown>
          )) {
            changes.push({
              field: getFieldLabel(field, locale),
              value: formatChangeValue(val, locale),
            });
          }
        }
        result.regions.push({
          regionId: (tr.regionId as string) || "unknown",
          description: desc,
          changes,
        });
      }
    }
    return result;
  }

  // Fallback: extract text fragments from partial stream
  const textFragments: string[] = [];
  const langKey = `"${locale}"\\s*:\\s*"([^"]*)"`;
  const re = new RegExp(langKey, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m[1].trim()) textFragments.push(m[1]);
  }
  if (textFragments.length > 0) {
    result.raw = textFragments.join("\n");
  }
  return result;
}

export default function LlmStreamPanel() {
  const isLoading = useWorldStore((s) => s.isLoading);
  const llmStreams = useWorldStore((s) => s.llmStreams);
  const completedLlmRegions = useWorldStore((s) => s.completedLlmRegions);
  const { locale } = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const regionIds = Object.keys(llmStreams);
  const activeRegions = regionIds.filter((id) => llmStreams[id].length > 0);

  useEffect(() => {
    if (selectedId === null && activeRegions.length > 0) {
      setSelectedId(activeRegions[0]);
    }
  }, [activeRegions, selectedId]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [llmStreams, selectedId, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  };

  if (!isLoading) return null;

  const currentContent = selectedId ? llmStreams[selectedId] ?? "" : "";

  return (
    <div
      className="absolute bottom-14 left-3 z-40 flex flex-col"
      style={{ width: "600px", maxHeight: collapsed ? "auto" : "400px" }}
    >
      <div
        className="glass-panel flex items-center justify-between px-3 py-1.5 cursor-pointer border border-border-subtle rounded-t-lg select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <span className="text-accent-gold text-xs">⚡</span>
          <span className="text-xs font-semibold text-text-primary">
            {locale === "zh" ? "AI 思考过程" : "AI Thinking Process"}
          </span>
          {activeRegions.length > 0 && (
            <span className="text-xs text-text-muted">
              ({activeRegions.length}{" "}
              {locale === "zh"
                ? "个文明"
                : activeRegions.length === 1
                  ? "civilization"
                  : "civilizations"}
              )
            </span>
          )}
        </div>
        <span className="text-text-muted text-xs">
          {collapsed ? "▲" : "▼"}
        </span>
      </div>

      {!collapsed && (
        <div className="glass-panel border border-t-0 border-border-subtle rounded-b-lg overflow-hidden flex" style={{ height: "340px" }}>
          {/* Left: civilization list */}
          <div className="w-[160px] shrink-0 border-r border-border-subtle overflow-y-auto">
            {activeRegions.length === 0 ? (
              <div className="px-3 py-4 text-xs text-text-muted animate-pulse text-center">
                {locale === "zh" ? "等待 AI 响应..." : "Waiting..."}
              </div>
            ) : (
              activeRegions.map((regionId) => {
                const name = getRegionName(regionId, locale);
                const isActive = regionId === selectedId;
                const isDone = completedLlmRegions.has(regionId);
                return (
                  <button
                    key={regionId}
                    onClick={() => { setSelectedId(regionId); setAutoScroll(true); }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${isActive
                      ? "bg-accent-gold/10 text-accent-gold border-l-2 border-accent-gold"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border-l-2 border-transparent"
                      }`}
                  >
                    <span className={isDone ? "text-emerald-400" : "animate-pulse text-accent-gold"}>●</span>
                    <span className="truncate">{name}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: selected civilization detail */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto"
          >
            {selectedId && currentContent.length > 0 ? (
              <RegionStream
                key={selectedId}
                regionId={selectedId}
                content={currentContent}
                locale={locale}
                isDone={completedLlmRegions.has(selectedId)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-text-muted">
                {locale === "zh" ? "选择左侧文明查看思考过程" : "Select a civilization to view"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RegionStream({
  regionId,
  content,
  locale,
  isDone,
}: {
  regionId: string;
  content: string;
  locale: Locale;
  isDone: boolean;
}) {
  const name = getRegionName(regionId, locale);
  const parsed = useMemo(
    () => parseStreamContent(content, locale),
    [content, locale]
  );

  const hasContent =
    parsed.era || parsed.summary || parsed.regions.length > 0 || parsed.raw;

  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-border-subtle">
        <span className="text-xs font-semibold text-accent-amber">{name}</span>
        <span className="flex-1" />
        <span className={isDone ? "text-emerald-400 text-xs" : "animate-pulse text-accent-gold text-xs"}>●</span>
      </div>
      <div className="text-xs leading-relaxed text-text-secondary space-y-1.5">
        {!hasContent && (
          <p className="text-text-muted animate-pulse">
            {locale === "zh" ? "分析中..." : "Analyzing..."}
          </p>
        )}

        {parsed.era && (
          <div className="flex gap-1.5 items-baseline">
            <span className="text-text-muted shrink-0 min-w-[3em]">
              {locale === "zh" ? "时代" : "Era"}
            </span>
            <span className="text-text-primary">{parsed.era}</span>
          </div>
        )}

        {parsed.summary && (
          <div className="flex gap-1.5 items-baseline">
            <span className="text-text-muted shrink-0 min-w-[3em]">
              {locale === "zh" ? "概要" : "Summary"}
            </span>
            <span className="text-text-primary">{parsed.summary}</span>
          </div>
        )}

        {parsed.regions.map((tr, i) => {
          const trName = getRegionName(tr.regionId, locale);
          return (
            <div key={i} className="mt-1">
              {parsed.regions.length > 1 && (
                <div className="text-accent-amber font-medium mb-0.5">
                  {trName}
                </div>
              )}
              {tr.description && (
                <p className="text-text-secondary mb-1 leading-relaxed">{tr.description}</p>
              )}
              {tr.changes.length > 0 && (
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 pl-2">
                  {tr.changes.map((c, j) => (
                    <Fragment key={j}>
                      <span className="text-text-muted whitespace-nowrap">{c.field}</span>
                      <span className="text-text-primary break-words">
                        {c.value}
                      </span>
                    </Fragment>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {parsed.raw && !parsed.summary && parsed.regions.length === 0 && (
          <p className="text-text-secondary whitespace-pre-wrap break-words">
            {parsed.raw}
          </p>
        )}
      </div>
    </div>
  );
}
