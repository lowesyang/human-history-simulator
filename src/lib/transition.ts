import type { Region, LocalizedText } from "./types";

export interface RegionTransition {
  regionId: string;
  description: LocalizedText;
  changes: Record<string, unknown>;
  strategicIntent?: LocalizedText;
}

export interface TransitionResult {
  era: LocalizedText;
  summary: LocalizedText;
  transitions: RegionTransition[];
}

/**
 * Apply a transition's changes to a region, producing a new Region.
 *
 * Change value semantics:
 *  - number: relative delta added to current value
 *  - string starting with "=": absolute set (strip "=" prefix, parse if numeric)
 *  - string / object (LocalizedText): absolute replacement
 *  - null: field cleared
 *  - dot notation keys: nested field access (e.g. "civilization.ruler")
 */
export function applyTransition(
  region: Region,
  transition: RegionTransition
): Region {
  const result = structuredClone(region);

  for (const [path, value] of Object.entries(transition.changes)) {
    setNestedValue(
      result as unknown as Record<string, unknown>,
      path,
      value,
      region as unknown as Record<string, unknown>
    );
  }

  fixRegionConsistency(result);
  return result;
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
  originalRoot: Record<string, unknown>
): void {
  const keys = parsePath(path);
  let target: Record<string, unknown> = obj;
  let origTarget: Record<string, unknown> = originalRoot;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (target[key] == null || typeof target[key] !== "object") {
      target[key] = {};
    }
    target = target[key] as Record<string, unknown>;
    origTarget =
      origTarget[key] != null && typeof origTarget[key] === "object"
        ? (origTarget[key] as Record<string, unknown>)
        : {};
  }

  const finalKey = keys[keys.length - 1];
  const currentValue = origTarget[finalKey];

  if (value === null) {
    target[finalKey] = undefined;
    return;
  }

  if (typeof value === "number" && typeof currentValue === "number") {
    target[finalKey] = currentValue + value;
    return;
  }

  if (typeof value === "string" && value.startsWith("=")) {
    const raw = value.slice(1);
    const num = Number(raw);
    target[finalKey] = isNaN(num) ? raw : num;
    return;
  }

  // Object: could be LocalizedText replacement or nested partial
  if (typeof value === "object" && !Array.isArray(value)) {
    const valObj = value as Record<string, unknown>;
    if (isLocalizedText(valObj)) {
      target[finalKey] = valObj;
      return;
    }
    if (isMonetaryDelta(valObj, currentValue)) {
      applyMonetaryDelta(
        target,
        finalKey,
        valObj,
        currentValue as Record<string, unknown>
      );
      return;
    }
    // Generic object merge
    if (currentValue != null && typeof currentValue === "object" && !Array.isArray(currentValue)) {
      target[finalKey] = { ...(target[finalKey] as object), ...valObj };
    } else {
      target[finalKey] = valObj;
    }
    return;
  }

  // Arrays and other primitives: direct set
  target[finalKey] = value;
}

function parsePath(path: string): string[] {
  return path.split(".");
}

function isLocalizedText(obj: Record<string, unknown>): boolean {
  return typeof obj.zh === "string" && typeof obj.en === "string" && Object.keys(obj).length === 2;
}

function isMonetaryDelta(
  val: Record<string, unknown>,
  current: unknown
): boolean {
  if (current == null || typeof current !== "object") return false;
  const cur = current as Record<string, unknown>;
  return typeof cur.amount === "number" && typeof val.amount === "number";
}

function applyMonetaryDelta(
  target: Record<string, unknown>,
  key: string,
  delta: Record<string, unknown>,
  current: Record<string, unknown>
): void {
  const result = { ...current };
  if (typeof delta.amount === "number" && typeof current.amount === "number") {
    result.amount = (current.amount as number) + (delta.amount as number);
  }
  if (typeof delta.goldKg === "number" && typeof current.goldKg === "number") {
    result.goldKg = (current.goldKg as number) + (delta.goldKg as number);
  }
  if (typeof delta.silverKg === "number" && typeof current.silverKg === "number") {
    result.silverKg = (current.silverKg as number) + (delta.silverKg as number);
  }
  // Overwrite non-numeric fields (unit, displayNote) if provided
  for (const k of Object.keys(delta)) {
    if (typeof delta[k] !== "number") {
      result[k] = delta[k];
    }
  }
  target[key] = result;
}

function fixRegionConsistency(r: Region) {
  if (r.military) {
    const m = r.military;
    if (m.standingArmy != null && m.reserves != null) {
      m.totalTroops = m.standingArmy + m.reserves;
    }
    if (m.branches?.length > 0) {
      const branchSum = m.branches.reduce((s, b) => s + (b.count || 0), 0);
      if (branchSum > 0 && m.totalTroops > 0 && branchSum !== m.totalTroops) {
        const ratio = m.totalTroops / branchSum;
        for (const branch of m.branches) {
          branch.count = Math.round(branch.count * ratio);
        }
      }
    }
  }
  if (r.demographics) {
    const d = r.demographics;
    if (d.population > 0 && d.urbanPopulation > 0) {
      d.urbanizationRate =
        Math.round((d.urbanPopulation / d.population) * 10000) / 100;
    }
  }
}

export type FieldSchemaMode = "full" | "core" | "minimal";

const SCHEMA_SECTIONS: Record<string, string> = {
  identity: `status: RegionStatus (thriving|rising|stable|declining|conflict|collapsed)
description: LocalizedText
name: LocalizedText`,
  civilization: `civilization.name: LocalizedText
civilization.type: CivilizationType (empire|kingdom|city_state|tribal|nomadic|trade_network|theocracy|republic)
civilization.ruler: LocalizedText
civilization.rulerTitle: LocalizedText
civilization.dynasty: LocalizedText
civilization.capital: LocalizedText
civilization.governmentForm: LocalizedText
civilization.socialStructure: LocalizedText
civilization.rulingClass: LocalizedText
civilization.succession: LocalizedText`,
  government: `government.structure: LocalizedText
government.totalOfficials: number
government.localAdmin: LocalizedText
government.legalSystem: LocalizedText
government.taxationSystem: LocalizedText`,
  culture: `culture.religion: LocalizedText
culture.philosophy: LocalizedText
culture.writingSystem: LocalizedText
culture.culturalAchievements: LocalizedText
culture.languageFamily: LocalizedText`,
  economy: `economy.level: number (1-10)
economy.gdpEstimate: MonetaryValue (delta: {amount, goldKg, silverKg})
economy.gdpPerCapita: MonetaryValue
economy.gdpDescription: LocalizedText
economy.mainIndustries: LocalizedText
economy.tradeGoods: LocalizedText
economy.householdWealth: LocalizedText
economy.averageIncome: MonetaryValue
economy.foreignTradeVolume: MonetaryValue
economy.tradeRoutes: LocalizedText
economy.economicSystem: LocalizedText`,
  finances: `finances.annualRevenue: MonetaryValue
finances.annualExpenditure: MonetaryValue
finances.surplus: MonetaryValue
finances.treasury: MonetaryValue
finances.treasuryDescription: LocalizedText
finances.debtLevel: MonetaryValue
finances.fiscalPolicy: LocalizedText`,
  military: `military.level: number (1-10)
military.standingArmy: number (delta)
military.reserves: number (delta)
military.technology: LocalizedText
military.annualMilitarySpending: MonetaryValue
military.militarySpendingPctGdp: number
military.threats: LocalizedText
military.recentBattles: LocalizedText`,
  demographics: `demographics.population: number (delta)
demographics.populationDescription: LocalizedText
demographics.urbanPopulation: number (delta)
demographics.ethnicGroups: LocalizedText
demographics.socialClasses: LocalizedText
demographics.literacyRate: LocalizedText
demographics.lifeExpectancy: LocalizedText`,
  diplomacy: `diplomacy.allies: LocalizedText
diplomacy.enemies: LocalizedText
diplomacy.vassals: LocalizedText
diplomacy.tributeRelations: LocalizedText
diplomacy.treaties: LocalizedText
diplomacy.foreignPolicy: LocalizedText
diplomacy.recentDiplomaticEvents: LocalizedText`,
  technology: `technology.level: number (1-10)
technology.era: LocalizedText
technology.keyInnovations: LocalizedText
technology.infrastructure: LocalizedText`,
  aiSector: `aiSector.level: number (1-10)
aiSector.policy: LocalizedText
aiSector.regulatoryStance: LocalizedText
aiSector.investmentScale: LocalizedText
aiSector.researchFocus: LocalizedText
aiSector.computeInfrastructure: LocalizedText
aiSector.talentPool: LocalizedText
aiSector.globalRanking: LocalizedText
aiSector.outlook: LocalizedText`,
  assessment: `assessment.strengths: LocalizedText
assessment.weaknesses: LocalizedText
assessment.outlook: LocalizedText`,
};

const VALUE_TYPE_DOCS = `Value types:
- LocalizedText = {"zh":"中文","en":"English"}
- MonetaryValue delta = {amount: +/-number, unit: {"zh":"单位","en":"unit"}, goldKg: +/-number, silverKg: +/-number}. "unit" indicates the currency denomination. goldKg/silverKg MUST use historically accurate exchange rates (e.g. ancient: 1 talent ≈ 26kg silver; 1945: 1oz gold = $35; 2000: 1oz gold ≈ $280; 2020: 1oz gold ≈ $1800). NEVER set goldKg/silverKg to 0 when amount is non-zero.
- number = relative delta (e.g. -50000 means subtract). Use "=50000" for absolute set.
- string/LocalizedText = absolute replacement. null = clear field.
- Do NOT set military.totalTroops or demographics.urbanizationRate (auto-calculated).`;

const CORE_SECTIONS = [
  "identity", "civilization", "economy", "military",
  "demographics", "diplomacy", "technology", "assessment",
];

const MINIMAL_SECTIONS = [
  "identity", "civilization", "economy", "demographics", "technology",
];

/**
 * Generate a field schema string scoped to the mode.
 * - "full": all sections (used for direct historian calls)
 * - "core": skip government/finances/culture detail (indirect effects)
 * - "minimal": bare minimum for orphan/independent groups
 */
export function getRegionFieldSchema(mode: FieldSchemaMode = "full", includeAiSector = false): string {
  let sections: string[];
  switch (mode) {
    case "minimal":
      sections = MINIMAL_SECTIONS;
      break;
    case "core":
      sections = CORE_SECTIONS;
      break;
    default:
      sections = Object.keys(SCHEMA_SECTIONS).filter(
        (k) => k !== "aiSector"
      );
      break;
  }

  if (includeAiSector && !sections.includes("aiSector")) {
    sections.push("aiSector");
  }

  const body = sections
    .map((s) => SCHEMA_SECTIONS[s])
    .filter(Boolean)
    .join("\n");

  return `Region field paths (dot notation in "changes"):\n${body}\n\n${VALUE_TYPE_DOCS}`;
}
