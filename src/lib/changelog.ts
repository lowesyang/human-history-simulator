import type { Region, LocalizedText, HistoricalEvent } from "./types";
import type { RegionTransition } from "./transition";

export interface RegionChangelog {
  regionId: string;
  regionName: LocalizedText;
  isDirect: boolean;
  description: LocalizedText;
  changes: ChangeEntry[];
}

export type ChangeSentiment = "positive" | "negative" | "neutral";

export interface ChangeEntry {
  category: string;
  label: LocalizedText;
  detail: LocalizedText;
  sentiment: ChangeSentiment;
}

export interface EpochChangelog {
  targetYear: number;
  era: LocalizedText;
  summary: LocalizedText;
  events: { title: LocalizedText; category: string }[];
  regions: RegionChangelog[];
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
  directIds: Set<string>
): EpochChangelog {
  const regionChanges: RegionChangelog[] = [];

  for (const transition of transitions) {
    const region = regions.find((r) => r.id === transition.regionId);
    if (!region) continue;

    const changes = transitionToChangeEntries(transition);
    regionChanges.push({
      regionId: transition.regionId,
      regionName: region.name,
      isDirect: directIds.has(transition.regionId),
      description: transition.description,
      changes,
    });
  }

  regionChanges.sort((a, b) => {
    if (a.isDirect !== b.isDirect) return a.isDirect ? -1 : 1;
    return b.changes.length - a.changes.length;
  });

  return {
    targetYear,
    era,
    summary,
    events: events.map((e) => ({ title: e.title, category: e.category })),
    regions: regionChanges,
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
      zh: `${sign}${fmt(value)}`,
      en: `${sign}${fmt(value)}`,
    };
  }

  if (typeof value === "string") {
    if (value.startsWith("=")) {
      const display = value.slice(1);
      return { zh: display, en: display };
    }
    return { zh: value, en: value };
  }

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.amount === "number") {
      const sign = obj.amount > 0 ? "+" : "";
      const zhParts: string[] = [`${sign}${fmt(obj.amount)}`];
      const enParts: string[] = [`${sign}${fmt(obj.amount)}`];
      if (typeof obj.goldKg === "number") {
        const gs = obj.goldKg > 0 ? "+" : "";
        zhParts.push(`${gs}${fmt(obj.goldKg)}kg 黄金`);
        enParts.push(`${gs}${fmt(obj.goldKg)}kg gold`);
      }
      if (typeof obj.silverKg === "number") {
        const ss = obj.silverKg > 0 ? "+" : "";
        zhParts.push(`${ss}${fmt(obj.silverKg)}kg 白银`);
        enParts.push(`${ss}${fmt(obj.silverKg)}kg silver`);
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

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}
