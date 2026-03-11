import type { Region, LocalizedText, HistoricalEvent } from "./types";
import type { RegionTransition } from "./transition";
import { fmtNum, fmtKg } from "./format-number";

export interface RegionChangelog {
  regionId: string;
  regionName: LocalizedText;
  isDirect: boolean;
  description: LocalizedText;
  changes: ChangeEntry[];
  impactScore: number;
}

export type ChangeSentiment = "positive" | "negative" | "neutral";

export interface ChangeEntry {
  category: string;
  label: LocalizedText;
  detail: LocalizedText;
  sentiment: ChangeSentiment;
  /** Internal field path (e.g. "economy.gdpEstimate") used for impact scoring. Not serialized to UI. */
  fieldPath?: string;
}

export interface EpochChangelog {
  targetYear: number;
  startYear?: number;
  endYear?: number;
  era: LocalizedText;
  summary: LocalizedText;
  events: { title: LocalizedText; category: string }[];
  regions: RegionChangelog[];
  impactTiers: { critical: number; high: number; medium: number };
  timestamp: string;
}

const FIELD_CATEGORY_MAP: Record<string, string> = {
  status: "status",
  name: "status",
  territoryScale: "status",
  civilization: "political",
  government: "political",
  culture: "culture",
  economy: "economy",
  finances: "economy",
  military: "military",
  demographics: "demographics",
  diplomacy: "diplomacy",
  technology: "technology",
  assessment: "assessment",
  description: "assessment",
};

const FIELD_LABEL_MAP: Record<string, LocalizedText> = {
  status: { zh: "国家状态", en: "Status" },
  name: { zh: "名称", en: "Name" },
  territoryScale: { zh: "领土规模", en: "Territory Scale" },
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
  "government.departments": { zh: "政府部门", en: "Departments" },
  "government.totalOfficials": { zh: "官员总数", en: "Total Officials" },
  "government.localAdmin": { zh: "地方行政", en: "Local Administration" },
  "government.legalSystem": { zh: "法律体系", en: "Legal System" },
  "government.taxationSystem": { zh: "税收制度", en: "Taxation System" },
  "government.keyOfficials": { zh: "重要官员", en: "Key Officials" },
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
  "demographics.urbanizationRate": { zh: "城市化率", en: "Urbanization Rate" },
  "demographics.populationDescription": { zh: "人口描述", en: "Population Description" },
  "demographics.ethnicGroups": { zh: "民族构成", en: "Ethnic Groups" },
  "demographics.socialClasses": { zh: "社会阶层", en: "Social Classes" },
  "demographics.literacyRate": { zh: "识字率", en: "Literacy Rate" },
  "demographics.lifeExpectancy": { zh: "预期寿命", en: "Life Expectancy" },
  "diplomacy.allies": { zh: "盟友", en: "Allies" },
  "diplomacy.enemies": { zh: "敌对", en: "Enemies" },
  "diplomacy.vassals": { zh: "附庸", en: "Vassals" },
  "diplomacy.tributeRelations": { zh: "朝贡关系", en: "Tribute Relations" },
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

export function generateChangelog(
  transitions: RegionTransition[],
  regions: Region[],
  events: HistoricalEvent[],
  targetYear: number,
  era: LocalizedText,
  summary: LocalizedText,
  directIds: Set<string>,
  startYear?: number,
  endYear?: number,
): EpochChangelog {
  const regionChanges: RegionChangelog[] = [];

  const regionLookup = new Map<string, Region>();
  for (const r of regions) {
    regionLookup.set(r.id, r);
  }

  for (const transition of transitions) {
    const region = regionLookup.get(transition.regionId);
    if (!region) continue;

    const changes = transitionToChangeEntries(transition);
    const isDirect = directIds.has(transition.regionId);
    const score = computeImpactScore(changes, region, isDirect);
    regionChanges.push({
      regionId: transition.regionId,
      regionName: region.name,
      isDirect,
      description: transition.description,
      changes,
      impactScore: score,
    });
  }

  regionChanges.sort((a, b) => b.impactScore - a.impactScore);

  const tiers = computeImpactTiers(regionChanges);

  return {
    targetYear,
    startYear,
    endYear,
    era,
    summary,
    events: events.map((e) => ({ title: e.title, category: e.category })),
    regions: regionChanges,
    impactTiers: tiers,
    timestamp: new Date().toISOString(),
  };
}

function transitionToChangeEntries(transition: RegionTransition): ChangeEntry[] {
  const entries: ChangeEntry[] = [];

  for (const [path, value] of Object.entries(transition.changes)) {
    const topLevel = path.split(".")[0];
    const category = FIELD_CATEGORY_MAP[topLevel] || "other";
    const label = FIELD_LABEL_MAP[path] || fallbackLabel(path);

    entries.push({
      category,
      label,
      detail: formatChangeValue(value),
      sentiment: inferSentiment(value),
      fieldPath: path,
    });
  }

  return entries;
}

function fallbackLabel(path: string): LocalizedText {
  const parts = path.split(".");
  const field = parts[parts.length - 1];
  const readable = field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
  return { zh: readable, en: readable };
}

function inferSentiment(value: unknown): ChangeSentiment {
  if (value === null) return "negative";

  if (typeof value === "number") {
    if (value > 0) return "positive";
    if (value < 0) return "negative";
    return "neutral";
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.amount === "number") {
      if (obj.amount > 0) return "positive";
      if (obj.amount < 0) return "negative";
    }
  }

  return "neutral";
}

const ENUM_DISPLAY: Record<string, LocalizedText> = {
  // RegionStatus
  thriving: { zh: "繁荣", en: "Thriving" },
  rising: { zh: "崛起", en: "Rising" },
  stable: { zh: "稳定", en: "Stable" },
  declining: { zh: "衰落", en: "Declining" },
  conflict: { zh: "冲突", en: "Conflict" },
  collapsed: { zh: "崩溃", en: "Collapsed" },
  // TerritoryScale
  xs: { zh: "微型", en: "Tiny" },
  sm: { zh: "小型", en: "Small" },
  md: { zh: "中型", en: "Medium" },
  lg: { zh: "大型", en: "Large" },
  xl: { zh: "超大", en: "Very Large" },
  // CivilizationType
  empire: { zh: "帝国", en: "Empire" },
  kingdom: { zh: "王国", en: "Kingdom" },
  city_state: { zh: "城邦", en: "City-State" },
  tribal: { zh: "部落", en: "Tribal" },
  nomadic: { zh: "游牧", en: "Nomadic" },
  trade_network: { zh: "贸易网络", en: "Trade Network" },
  theocracy: { zh: "神权政体", en: "Theocracy" },
  republic: { zh: "共和国", en: "Republic" },
  // GovernmentForm
  absolute_monarchy: { zh: "君主专制", en: "Absolute Monarchy" },
  feudal_monarchy: { zh: "封建君主制", en: "Feudal Monarchy" },
  constitutional_monarchy: { zh: "君主立宪制", en: "Constitutional Monarchy" },
  theocratic_monarchy: { zh: "神权君主制", en: "Theocratic Monarchy" },
  oligarchy: { zh: "寡头制", en: "Oligarchy" },
  aristocratic_republic: { zh: "贵族共和制", en: "Aristocratic Republic" },
  democracy: { zh: "民主制", en: "Democracy" },
  tribal_council: { zh: "部落议事会", en: "Tribal Council" },
  military_dictatorship: { zh: "军事独裁", en: "Military Dictatorship" },
  colonial_administration: { zh: "殖民行政", en: "Colonial Administration" },
  communist_state: { zh: "共产主义国家", en: "Communist State" },
  federal_republic: { zh: "联邦共和制", en: "Federal Republic" },
  confederation: { zh: "邦联制", en: "Confederation" },
  other: { zh: "其他", en: "Other" },
};

function formatChangeValue(value: unknown): LocalizedText {
  if (value === null) {
    return { zh: "已清除", en: "Cleared" };
  }

  if (isLocalizedText(value)) {
    return value as LocalizedText;
  }

  if (typeof value === "number") {
    const sign = value > 0 ? "+" : "";
    return {
      zh: `${sign}${fmtNum(value, "zh")}`,
      en: `${sign}${fmtNum(value, "en")}`,
    };
  }

  if (typeof value === "string") {
    const raw = value.startsWith("=") ? value.slice(1) : value;
    const enumDisplay = ENUM_DISPLAY[raw];
    if (enumDisplay) return enumDisplay;
    return { zh: raw, en: raw };
  }

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.amount === "number") {
      const sign = obj.amount > 0 ? "+" : "";
      const unitZh = isLocalizedText(obj.unit) ? ` ${(obj.unit as Record<string, string>).zh}` : "";
      const unitEn = isLocalizedText(obj.unit) ? ` ${(obj.unit as Record<string, string>).en}` : "";
      const zhParts: string[] = [`${sign}${fmtNum(obj.amount, "zh")}${unitZh}`];
      const enParts: string[] = [`${sign}${fmtNum(obj.amount, "en")}${unitEn}`];
      if (typeof obj.goldKg === "number" && obj.goldKg !== 0) {
        const gs = obj.goldKg > 0 ? "+" : "";
        zhParts.push(`${gs}${fmtKg(obj.goldKg, "zh")}黄金`);
        enParts.push(`${gs}${fmtKg(obj.goldKg, "en")} gold`);
      }
      if (typeof obj.silverKg === "number" && obj.silverKg !== 0) {
        const ss = obj.silverKg > 0 ? "+" : "";
        zhParts.push(`${ss}${fmtKg(obj.silverKg, "zh")}白银`);
        enParts.push(`${ss}${fmtKg(obj.silverKg, "en")} silver`);
      }
      return { zh: zhParts.join(", "), en: enParts.join(", ") };
    }
    return { zh: JSON.stringify(value), en: JSON.stringify(value) };
  }

  return { zh: String(value), en: String(value) };
}

function isLocalizedText(v: unknown): boolean {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return typeof obj.zh === "string" && typeof obj.en === "string";
}

/* ---------- Impact Score Computation ---------- */

/**
 * Per-change weight by category. These are additive base values, intentionally
 * kept small so the final score stays in a reasonable range.
 */
const CATEGORY_WEIGHT: Record<string, number> = {
  status: 6,
  political: 3,
  military: 4,
  economy: 3,
  technology: 3,
  diplomacy: 3,
  demographics: 2,
  culture: 1,
  assessment: 0.5,
};

/**
 * Fields where a change carries outsized strategic significance.
 * Bonus is additive (+3), not multiplicative, to avoid score explosion.
 */
const HIGH_IMPACT_FIELDS = new Set([
  "status",
  "civilization.ruler",
  "civilization.dynasty",
  "civilization.governmentForm",
  "civilization.type",
  "military.level",
  "economy.level",
  "technology.level",
]);

function computeChangeWeight(entry: ChangeEntry): number {
  const base = CATEGORY_WEIGHT[entry.category] ?? 1;
  const fieldBonus = entry.fieldPath && HIGH_IMPACT_FIELDS.has(entry.fieldPath) ? 3 : 0;
  const sentimentBonus = entry.sentiment === "negative" ? 1 : 0;
  return base + fieldBonus + sentimentBonus;
}

/**
 * Civilization importance tier (1-5). Only the very top nations reach 4-5;
 * most medium countries stay at 2-3, and small states at 1.
 */
function computeCivImportance(region: Region): number {
  let score = 0;

  const pop = region.demographics?.population ?? 0;
  if (pop >= 500_000_000) score += 3;
  else if (pop >= 100_000_000) score += 2;
  else if (pop >= 30_000_000) score += 1;

  const gdp = region.economy?.gdpEstimate?.amount ?? 0;
  const goldKg = region.economy?.gdpEstimate?.goldKg ?? 0;
  if (gdp > 0) {
    if (gdp >= 10_000_000_000_000) score += 3;
    else if (gdp >= 3_000_000_000_000) score += 2;
    else if (gdp >= 500_000_000_000) score += 1;
  } else if (goldKg > 0) {
    if (goldKg >= 500_000) score += 3;
    else if (goldKg >= 100_000) score += 2;
    else if (goldKg >= 10_000) score += 1;
  }

  const milLevel = region.military?.level ?? 0;
  if (milLevel >= 9) score += 2;
  else if (milLevel >= 7) score += 1;

  return Math.min(score, 5);
}

function computeImpactScore(
  changes: ChangeEntry[],
  region: Region,
  isDirect: boolean,
): number {
  if (changes.length === 0) return 0;

  const changeScore = changes.reduce((sum, c) => sum + computeChangeWeight(c), 0);
  const civTier = computeCivImportance(region);
  const civMultiplier = 1 + civTier * 0.3;
  const directMultiplier = isDirect ? 1.4 : 1.0;

  return changeScore * civMultiplier * directMultiplier;
}

/**
 * Compute dynamic tier thresholds from the actual score distribution.
 * Top ~5% → Critical, next ~15% → High, next ~30% → Medium, rest → Low.
 */
export function computeImpactTiers(regions: { impactScore: number }[]): {
  critical: number;
  high: number;
  medium: number;
} {
  if (regions.length === 0) return { critical: Infinity, high: Infinity, medium: Infinity };

  const scores = regions.map((r) => r.impactScore).sort((a, b) => b - a);
  const len = scores.length;

  const criticalIdx = Math.max(0, Math.ceil(len * 0.05) - 1);
  const highIdx = Math.max(criticalIdx + 1, Math.ceil(len * 0.20) - 1);
  const mediumIdx = Math.max(highIdx + 1, Math.ceil(len * 0.50) - 1);

  return {
    critical: scores[criticalIdx],
    high: scores[Math.min(highIdx, len - 1)],
    medium: scores[Math.min(mediumIdx, len - 1)],
  };
}
