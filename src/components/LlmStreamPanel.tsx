"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import type { PipelineGroupInfo, PipelinePhase } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import { fmtNum, fmtKg } from "@/lib/format-number";

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

type ViewMode = "pipeline" | "stream";

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
    return `${sign}${fmtNum(value, locale)}`;
  }
  if (typeof value === "string") {
    if (value.startsWith("=")) return value.slice(1);
    return value;
  }
  if (typeof value === "object" && value !== null) {
    const rec = value as Record<string, unknown>;
    if ("amount" in rec || "goldKg" in rec) {
      const parts: string[] = [];
      const unitText = rec.unit ? extractLocalized(rec.unit, locale) : null;
      if (typeof rec.amount === "number") {
        const sign = rec.amount > 0 ? "+" : "";
        parts.push(unitText
          ? `${sign}${fmtNum(rec.amount, locale)} ${unitText}`
          : `${sign}${fmtNum(rec.amount, locale)}`
        );
      }
      if (typeof rec.goldKg === "number" && rec.goldKg !== 0) {
        const sign = rec.goldKg > 0 ? "+" : "";
        const label = locale === "zh" ? "黄金" : " gold";
        parts.push(`${sign}${fmtKg(rec.goldKg, locale)}${label}`);
      }
      if (typeof rec.silverKg === "number" && rec.silverKg !== 0) {
        const sign = rec.silverKg > 0 ? "+" : "";
        const label = locale === "zh" ? "白银" : " silver";
        parts.push(`${sign}${fmtKg(rec.silverKg, locale)}${label}`);
      }
      return parts.join(", ") || JSON.stringify(value);
    }
    const localized = extractLocalized(value, locale);
    if (localized) return localized;
    if (Array.isArray(value)) {
      const items = value.map((item) => {
        if (typeof item === "string") return item;
        const loc = extractLocalized(item, locale);
        return loc || JSON.stringify(item);
      });
      return items.join(", ");
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
    const opens = (patched.match(/[{[]/g) || []).length;
    const closes = (patched.match(/[}\]]/g) || []).length;
    const diff = opens - closes;
    if (diff > 0) {
      patched = patched.replace(/,\s*"[^"]*"?\s*:?\s*[^,}\]]*$/, "");
      for (let i = 0; i < diff; i++) {
        const lastOpen = Math.max(patched.lastIndexOf("{"), patched.lastIndexOf("["));
        patched += lastOpen >= 0 && patched[lastOpen] === "[" ? "]" : "}";
      }
    }
    try {
      json = JSON.parse(patched);
    } catch {
      // still can't parse
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
          for (const [field, val] of Object.entries(tr.changes as Record<string, unknown>)) {
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

  const textFragments: string[] = [];
  const langKey = `"${locale}"\\s*:\\s*"([^"]*)"`;
  const re = new RegExp(langKey, "g");
  let m: RegExpExecArray | null;

  const CURRENCY_NOISE = new Set([
    "欧元", "美元", "英镑", "日元", "卢布", "卢比", "人民币", "法郎", "比索",
    "先令", "第纳尔", "里亚尔", "兰特", "克瓦查", "塞迪", "奈拉", "铢",
    "加元", "澳元", "新台币", "韩元", "里拉", "福林", "兹罗提", "克朗",
    "EUR", "USD", "GBP", "JPY", "RUB", "INR", "CNY", "CHF", "CAD", "AUD",
    "百万美元", "百万欧元", "百万英镑", "亿美元", "亿欧元", "亿英镑",
    "万两白银", "万两黄金", "million USD", "million EUR", "million GBP",
    "billion USD", "billion EUR", "10k taels silver", "10k taels gold",
  ]);

  const STATUS_VALUES = new Set([
    "thriving", "rising", "stable", "declining", "conflict", "collapsed",
  ]);

  const seen = new Set<string>();
  while ((m = re.exec(content)) !== null) {
    const frag = m[1].trim();
    if (!frag) continue;
    if (CURRENCY_NOISE.has(frag)) continue;
    if (STATUS_VALUES.has(frag)) continue;
    if (frag.length <= 2) continue;
    if (seen.has(frag)) continue;
    seen.add(frag);
    textFragments.push(frag);
  }
  if (textFragments.length > 0) {
    result.raw = textFragments.join("\n");
  }
  return result;
}

// ─── Phase labels & icons ───

const PHASE_CONFIG: Record<PipelinePhase, { icon: string; label: Record<Locale, string> }> = {
  idle: { icon: "○", label: { zh: "就绪", en: "Idle" } },
  loading_events: { icon: "📋", label: { zh: "加载事件", en: "Loading Events" } },
  clustering: { icon: "🔗", label: { zh: "关系分组", en: "Region Clustering" } },
  civ_agent: { icon: "🧠", label: { zh: "文明智能体", en: "Civ Agent" } },
  simulating: { icon: "⚡", label: { zh: "推演中", en: "Simulating" } },
  saving: { icon: "💾", label: { zh: "保存", en: "Saving" } },
  done: { icon: "✓", label: { zh: "完成", en: "Done" } },
};

const PIPELINE_PHASES: PipelinePhase[] = [
  "loading_events", "clustering", "simulating", "saving", "done",
];

const PIPELINE_PHASES_SPECULATIVE: PipelinePhase[] = [
  "loading_events", "clustering", "civ_agent", "simulating", "saving", "done",
];

function phaseIndex(phase: PipelinePhase, isSpeculative: boolean): number {
  const list = isSpeculative ? PIPELINE_PHASES_SPECULATIVE : PIPELINE_PHASES;
  return list.indexOf(phase);
}

// ─── Elapsed time formatter ───

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remainSec = sec % 60;
  return `${min}m${remainSec}s`;
}

// ─── Main Component ───

export default function LlmStreamPanel() {
  const isLoading = useWorldStore((s) => s.isLoading);
  const llmStreams = useWorldStore((s) => s.llmStreams);
  const completedLlmRegions = useWorldStore((s) => s.completedLlmRegions);
  const epochInfo = useWorldStore((s) => s.llmEpochInfo);
  const pipeline = useWorldStore((s) => s.pipeline);
  const { locale } = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("pipeline");
  const [elapsedMs, setElapsedMs] = useState(0);

  const regionIds = Object.keys(llmStreams);
  const activeRegions = regionIds.filter((id) => llmStreams[id].length > 0);

  useEffect(() => {
    if (activeRegions.length === 0) {
      setSelectedId(null);
    } else if (selectedId === null || !activeRegions.includes(selectedId)) {
      setSelectedId(activeRegions[0]);
    }
  }, [activeRegions, selectedId]);

  useEffect(() => {
    if (!isLoading || !pipeline.startedAt) return;
    const tick = () => setElapsedMs(Date.now() - pipeline.startedAt);
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [isLoading, pipeline.startedAt]);

  const scrollRafRef = useRef(0);
  useEffect(() => {
    if (autoScroll && scrollRef.current && viewMode === "stream") {
      if (scrollRafRef.current) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = 0;
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [llmStreams, selectedId, autoScroll, viewMode]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }, []);

  if (!isLoading) return null;

  const currentContent = selectedId ? llmStreams[selectedId] ?? "" : "";
  const phases = pipeline.isSpeculative ? PIPELINE_PHASES_SPECULATIVE : PIPELINE_PHASES;
  const currentPhaseIdx = phaseIndex(pipeline.phase, pipeline.isSpeculative);
  const overallProgress = pipeline.totalGroups > 0
    ? Math.round((pipeline.completedGroups / pipeline.totalGroups) * 100)
    : 0;

  return (
    <div
      className="absolute bottom-14 left-3 z-40 flex flex-col"
      style={{ width: "680px", maxHeight: collapsed ? "auto" : "460px" }}
    >
      {/* ─── Header ─── */}
      <div
        className="glass-panel flex items-center justify-between px-3 py-1.5 cursor-pointer border border-border-subtle rounded-t-lg select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <span className="text-accent-gold text-xs">⚡</span>
          <span className="text-xs font-semibold text-text-primary">
            {locale === "zh" ? "AI 推演可视化" : "AI Simulation Pipeline"}
          </span>
          {epochInfo && (
            <span className="text-xs text-accent-amber font-medium">
              {epochInfo.totalEpochs > 1 && `[${epochInfo.epoch}/${epochInfo.totalEpochs}] `}
              {epochInfo.targetYear < 0
                ? locale === "zh"
                  ? `公元前 ${Math.abs(epochInfo.targetYear)} 年`
                  : `${Math.abs(epochInfo.targetYear)} BCE`
                : locale === "zh"
                  ? `公元 ${epochInfo.targetYear} 年`
                  : `${epochInfo.targetYear} CE`}
            </span>
          )}
          {pipeline.startedAt > 0 && (
            <span className="text-xs text-text-muted font-mono">
              {formatElapsed(elapsedMs)}
            </span>
          )}
          {pipeline.totalGroups > 0 && (
            <span className="text-xs text-text-muted">
              {pipeline.completedGroups}/{pipeline.totalGroups} {locale === "zh" ? "战区" : "theaters"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div
            className="flex rounded overflow-hidden border border-border-subtle"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewMode("pipeline")}
              className={`px-2 py-0.5 text-xs transition-colors cursor-pointer ${viewMode === "pipeline"
                ? "bg-accent-gold/20 text-accent-gold" : "text-text-muted hover:text-text-secondary"}`}
            >
              {locale === "zh" ? "流程" : "Pipeline"}
            </button>
            <button
              onClick={() => setViewMode("stream")}
              className={`px-2 py-0.5 text-xs transition-colors cursor-pointer ${viewMode === "stream"
                ? "bg-accent-gold/20 text-accent-gold" : "text-text-muted hover:text-text-secondary"}`}
            >
              {locale === "zh" ? "数据流" : "Stream"}
            </button>
          </div>
          <span className="text-text-muted text-xs">
            {collapsed ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* ─── Body ─── */}
      {!collapsed && (
        <div className="glass-panel border border-t-0 border-border-subtle rounded-b-lg overflow-hidden flex flex-col" style={{ height: "400px" }}>
          {/* Phase progress bar */}
          <PhaseProgressBar
            phases={phases}
            currentPhase={pipeline.phase}
            currentPhaseIdx={currentPhaseIdx}
            locale={locale}
          />

          {viewMode === "pipeline" ? (
            <PipelineView
              pipeline={pipeline}
              locale={locale}
              overallProgress={overallProgress}
              llmStreams={llmStreams}
              completedLlmRegions={completedLlmRegions}
              onSelectRegion={(id) => { setSelectedId(id); setViewMode("stream"); }}
            />
          ) : (
            <StreamView
              activeRegions={activeRegions}
              completedLlmRegions={completedLlmRegions}
              selectedId={selectedId}
              setSelectedId={(id) => { setSelectedId(id); setAutoScroll(true); }}
              currentContent={currentContent}
              locale={locale}
              scrollRef={scrollRef}
              handleScroll={handleScroll}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Phase Progress Bar ───

function PhaseProgressBar({
  phases,
  currentPhase,
  currentPhaseIdx,
  locale,
}: {
  phases: PipelinePhase[];
  currentPhase: PipelinePhase;
  currentPhaseIdx: number;
  locale: Locale;
}) {
  return (
    <div className="flex items-center px-3 py-2 border-b border-border-subtle gap-1 shrink-0">
      {phases.map((phase, i) => {
        const conf = PHASE_CONFIG[phase];
        const isActive = i === currentPhaseIdx;
        const isDone = i < currentPhaseIdx;
        const isFuture = i > currentPhaseIdx;

        return (
          <div key={phase} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className="h-px flex-shrink-0 transition-all duration-500"
                style={{
                  width: "16px",
                  background: isDone
                    ? "var(--color-accent-gold)"
                    : isActive
                      ? "linear-gradient(90deg, var(--color-accent-gold), rgba(201,168,76,0.3))"
                      : "rgba(201,168,76,0.15)",
                }}
              />
            )}
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs whitespace-nowrap transition-all duration-300 ${isActive
                ? "bg-accent-gold/15 text-accent-gold border border-accent-gold/30"
                : isDone
                  ? "text-emerald-400/80"
                  : isFuture
                    ? "text-text-muted/50"
                    : "text-text-muted"
                }`}
            >
              <span className={isActive ? "pipeline-phase-pulse" : ""} style={{ fontSize: "12px" }}>
                {isDone ? "✓" : conf.icon}
              </span>
              <span className="hidden sm:inline" style={{ fontSize: "12px" }}>
                {conf.label[locale]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Pipeline View ───

function PipelineView({
  pipeline,
  locale,
  overallProgress: _overallProgress,
  llmStreams,
  completedLlmRegions,
  onSelectRegion,
}: {
  pipeline: import("@/store/useWorldStore").PipelineState;
  locale: Locale;
  overallProgress: number;
  llmStreams: Record<string, string>;
  completedLlmRegions: Set<string>;
  onSelectRegion: (id: string) => void;
}) {
  const groups = pipeline.groups;

  const isGroupEffectivelyDone = (g: PipelineGroupInfo) =>
    g.status === "done" || g.status === "error" ||
    (g.status === "running" && g.regionIds.length > 0 &&
      g.regionIds.every((id) => completedLlmRegions.has(id)));

  const runningGroups = groups.filter((g) => g.status === "running" && !isGroupEffectivelyDone(g));
  const doneGroups = groups.filter((g) => isGroupEffectivelyDone(g));
  const pendingGroups = groups.filter((g) => g.status === "pending");

  const completedRegionCount = doneGroups.reduce((sum, g) => sum + g.regionIds.length, 0);
  const totalRegionCount = pipeline.totalRegions || 1;

  const runningStreamProgress = runningGroups.reduce((sum, g) => {
    const streamLen = g.regionIds.reduce(
      (s, id) => s + (llmStreams[id]?.length ?? 0), 0
    );
    const expected = g.regionIds.length * 2500;
    return sum + g.regionIds.length * Math.min(0.95, streamLen / expected);
  }, 0);

  const allGroupsDone = doneGroups.length === groups.length && groups.length > 0;
  const effectiveProgress = Math.min(
    Math.round(((completedRegionCount + runningStreamProgress) / totalRegionCount) * 100),
    allGroupsDone ? 100 : 99
  );
  const overallProgress = Math.max(
    _overallProgress,
    effectiveProgress,
    runningGroups.length > 0 ? 3 : 0
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Overall progress */}
      {pipeline.totalGroups > 0 && (
        <div className="px-3 pt-2.5 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-text-secondary">
              {locale === "zh" ? "推演进度" : "Simulation Progress"}
            </span>
            <span className="text-xs font-mono text-accent-gold">
              {overallProgress}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${overallProgress}%`,
                background: "linear-gradient(90deg, var(--color-accent-copper), var(--color-accent-gold))",
              }}
            />
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
            <span>{pipeline.totalRegions} {locale === "zh" ? "个文明" : "civilizations"}</span>
            <span>·</span>
            <span>{pipeline.totalGroups} {locale === "zh" ? "个战区" : "theaters"}</span>
            {pipeline.maxParallel > 1 && (
              <>
                <span>·</span>
                <span>{locale === "zh" ? `${pipeline.maxParallel} 路并行` : `${pipeline.maxParallel}x parallel`}</span>
              </>
            )}
            {pipeline.isSpeculative && (
              <>
                <span>·</span>
                <span className="text-accent-amber">{locale === "zh" ? "推演模式" : "Speculative"}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Running groups */}
      {runningGroups.length > 0 && (
        <div className="px-3 pb-2">
          <div className="text-xs font-semibold text-accent-gold mb-1.5 flex items-center gap-1.5">
            <span className="pipeline-phase-pulse">●</span>
            {locale === "zh" ? "推演进行中" : "Simulating"} ({runningGroups.length})
          </div>
          <div className="space-y-1.5">
            {runningGroups.map((group) => (
              <GroupCard
                key={group.groupIndex}
                group={group}
                locale={locale}
                llmStreams={llmStreams}
                completedLlmRegions={completedLlmRegions}
                onSelectRegion={onSelectRegion}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending groups */}
      {pendingGroups.length > 0 && (
        <div className="px-3 pb-2">
          <div className="text-xs font-semibold text-text-muted mb-1.5">
            {locale === "zh" ? "待命战区" : "Pending"} ({pendingGroups.length})
          </div>
          <div className="space-y-1">
            {pendingGroups.map((group) => (
              <GroupCardCompact key={group.groupIndex} group={group} locale={locale} />
            ))}
          </div>
        </div>
      )}

      {/* Done groups */}
      {doneGroups.length > 0 && (
        <div className="px-3 pb-2">
          <div className="text-xs font-semibold text-emerald-400/80 mb-1.5">
            {locale === "zh" ? "推演完成" : "Completed"} ({doneGroups.length})
          </div>
          <div className="space-y-1">
            {doneGroups.map((group) => (
              <GroupCardCompact
                key={group.groupIndex}
                group={group}
                locale={locale}
                effectivelyDone={group.status !== "done" && group.status !== "error"}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {groups.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-xs text-text-muted gap-2">
          <span className="pipeline-phase-pulse text-accent-gold text-lg">⚡</span>
          <span>
            {pipeline.phase === "loading_events"
              ? locale === "zh" ? "正在加载历史事件..." : "Loading historical events..."
              : locale === "zh" ? "等待推演指令..." : "Awaiting simulation orders..."}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Group Card (running) ───

function getGroupLabel(group: PipelineGroupInfo, locale: Locale): string {
  const idx = group.groupIndex + 1;
  if (group.isDirect && !group.isOrphan) {
    return locale === "zh"
      ? `🎯 第${idx}战区 · 核心影响`
      : `🎯 Theater ${idx} · Core Impact`;
  }
  if (group.isOrphan) {
    return locale === "zh"
      ? `🌐 第${idx}战区 · 外围联动`
      : `🌐 Theater ${idx} · Periphery`;
  }
  return locale === "zh"
    ? `⚔ 第${idx}战区 · 连锁反应`
    : `⚔ Theater ${idx} · Chain Reaction`;
}

const THEATER_COLORS = {
  direct: { border: "rgba(201,168,76,0.3)", bg: "rgba(201,168,76,0.06)", accent: "var(--color-accent-gold)", bar: "linear-gradient(90deg, var(--color-accent-copper), var(--color-accent-gold))" },
  chain: { border: "rgba(100,149,237,0.3)", bg: "rgba(100,149,237,0.05)", accent: "#6495ed", bar: "linear-gradient(90deg, #4a6fa5, #6495ed)" },
  orphan: { border: "rgba(160,140,110,0.35)", bg: "rgba(160,140,110,0.08)", accent: "#b8a88a", bar: "linear-gradient(90deg, #8a7d6a, #b8a88a)" },
} as const;

function getTheaterStyle(group: PipelineGroupInfo): typeof THEATER_COLORS[keyof typeof THEATER_COLORS] {
  if (group.isDirect && !group.isOrphan) return THEATER_COLORS.direct;
  if (group.isOrphan) return THEATER_COLORS.orphan;
  return THEATER_COLORS.chain;
}

function GroupCard({
  group,
  locale,
  llmStreams,
  completedLlmRegions,
  onSelectRegion,
}: {
  group: PipelineGroupInfo;
  locale: Locale;
  llmStreams: Record<string, string>;
  completedLlmRegions: Set<string>;
  onSelectRegion: (id: string) => void;
}) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (group.status !== "running" || !group.startedAt) return;
    const tick = () => setElapsedMs(Date.now() - group.startedAt!);
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [group.status, group.startedAt]);

  const regionsDone = group.regionIds.filter((id) => completedLlmRegions.has(id)).length;
  const regionsTotal = group.regionIds.length;

  const isGroupRunning = group.status === "running";
  const allDone = regionsDone === regionsTotal && regionsTotal > 0;

  const streamLen = group.regionIds.reduce(
    (sum, id) => sum + (llmStreams[id]?.length ?? 0), 0
  );
  const expectedTokens = regionsTotal * 2500;
  const streamProgress = isGroupRunning && !allDone
    ? Math.min(95, Math.round((streamLen / expectedTokens) * 100))
    : allDone ? 100 : 0;
  const groupProgress = allDone ? 100 : streamProgress;

  const colors = getTheaterStyle(group);

  const progressLabel = allDone
    ? `${regionsTotal}/${regionsTotal}`
    : isGroupRunning
      ? `${streamProgress}%`
      : `0/${regionsTotal}`;

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: colors.border, background: colors.bg }}>
      <div className="px-2.5 py-1.5 flex items-center gap-2">
        <div className="pipeline-spinner shrink-0" />
        <span className="text-xs font-medium" style={{ color: colors.accent }}>
          {getGroupLabel(group, locale)}
        </span>
        <span className="flex-1" />
        <span className="text-xs text-text-muted font-mono">{formatElapsed(elapsedMs)}</span>
        <span className="text-xs font-mono" style={{ color: colors.accent }}>{progressLabel}</span>
      </div>
      {/* Mini progress bar */}
      <div className="h-0.5 bg-bg-tertiary">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${groupProgress}%`, background: colors.bar }}
        />
      </div>
      {/* Region items */}
      <div className="px-2.5 py-1.5 flex flex-wrap gap-1">
        {group.regionIds.map((regionId) => {
          const name = getRegionName(regionId, locale);
          const isDone = completedLlmRegions.has(regionId);
          const isActive = !isDone && isGroupRunning;

          return (
            <button
              key={regionId}
              onClick={() => onSelectRegion(regionId)}
              className="text-xs px-1.5 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1"
              style={{
                borderColor: isDone
                  ? "rgba(74,173,107,0.3)"
                  : isActive
                    ? colors.border
                    : "rgba(201,168,76,0.1)",
                background: isDone
                  ? "rgba(74,173,107,0.08)"
                  : isActive
                    ? colors.bg
                    : "transparent",
                color: isDone ? "#4ead6b" : isActive ? colors.accent : "var(--color-text-muted)",
              }}
            >
              <span className={isDone ? "" : isActive ? "pipeline-phase-pulse" : ""} style={{ fontSize: "8px" }}>
                {isDone ? "✓" : isActive ? "●" : "○"}
              </span>
              <span className="truncate max-w-[80px]">{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Group Card Compact (pending/done) ───

function GroupCardCompact({
  group,
  locale,
  effectivelyDone,
}: {
  group: PipelineGroupInfo;
  locale: Locale;
  effectivelyDone?: boolean;
}) {
  const names = group.regionIds.map((id) => getRegionName(id, locale));
  const isDone = group.status === "done" || group.status === "error" || !!effectivelyDone;
  const isError = group.status === "error";
  const elapsed = group.startedAt
    ? (group.doneAt ?? (isDone ? Date.now() : 0)) - group.startedAt
    : 0;
  const label = getGroupLabel(group, locale);

  return (
    <div
      className="flex items-center gap-2 px-2 py-1 rounded border text-xs"
      style={{
        borderColor: isDone
          ? "rgba(74,173,107,0.15)"
          : isError
            ? "rgba(196,90,90,0.2)"
            : "rgba(201,168,76,0.08)",
        background: isDone
          ? "rgba(74,173,107,0.03)"
          : isError
            ? "rgba(196,90,90,0.05)"
            : "transparent",
      }}
    >
      <span style={{ color: isDone ? "#4ead6b" : isError ? "#c45a5a" : "var(--color-text-muted)" }}>
        {isDone ? "✓" : isError ? "✗" : "○"}
      </span>
      <span className="text-text-muted shrink-0">{label}</span>
      <span className="text-text-secondary truncate flex-1">
        {names.slice(0, 3).join(", ")}{names.length > 3 ? ` +${names.length - 3}` : ""}
      </span>
      {elapsed > 0 && (
        <span className="text-text-muted font-mono shrink-0">{formatElapsed(elapsed)}</span>
      )}
    </div>
  );
}

// ─── Stream View (classic token streaming) ───

function StreamView({
  activeRegions,
  completedLlmRegions,
  selectedId,
  setSelectedId,
  currentContent,
  locale,
  scrollRef,
  handleScroll,
}: {
  activeRegions: string[];
  completedLlmRegions: Set<string>;
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  currentContent: string;
  locale: Locale;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  handleScroll: () => void;
}) {
  return (
    <div className="flex-1 overflow-hidden flex">
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
                onClick={() => setSelectedId(regionId)}
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
  );
}

// ─── Region Stream ───

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
            <div key={i} className="mt-2">
              {parsed.regions.length > 1 && (
                <div className="text-accent-amber font-medium mb-1 pb-0.5 border-b border-border-subtle/50">
                  {trName}
                </div>
              )}
              {tr.description && (
                <p className="text-text-secondary mb-1.5 leading-relaxed whitespace-pre-wrap">{tr.description}</p>
              )}
              {tr.changes.length > 0 && (
                <div className="space-y-0.5 pl-2 border-l border-border-subtle/40">
                  {tr.changes.map((c, j) => (
                    <div key={j} className="flex gap-2 items-baseline">
                      <span className="text-text-muted whitespace-nowrap shrink-0 min-w-[4.5em]">{c.field}</span>
                      <span className="text-text-primary break-words leading-relaxed">
                        {c.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {parsed.raw && !parsed.summary && parsed.regions.length === 0 && (
          <div className="space-y-1">
            {parsed.raw.split("\n").map((line, idx) => (
              <p key={idx} className="text-text-secondary break-words leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
