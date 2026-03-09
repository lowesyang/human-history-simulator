export interface YearMonth {
  year: number;
  month: number;
}

export interface LocalizedText {
  zh: string;
  en: string;
}

export interface CurrencyInfo {
  name: LocalizedText;
  type: "commodity" | "metal_weight" | "coin" | "paper" | "fiat";
  metalBasis?: "gold" | "silver" | "bronze" | "copper" | "cowrie" | "none";
  unitName: LocalizedText;
  goldEquivalent?: string;
  silverEquivalent?: string;
}

export interface MonetaryValue {
  amount: number;
  unit: LocalizedText;
  goldKg?: number;
  silverKg?: number;
  displayNote?: LocalizedText;
}

export type CivilizationType =
  | "empire"
  | "kingdom"
  | "city_state"
  | "tribal"
  | "nomadic"
  | "trade_network"
  | "theocracy"
  | "republic";

export type GovernmentForm =
  | "absolute_monarchy"
  | "feudal_monarchy"
  | "constitutional_monarchy"
  | "theocratic_monarchy"
  | "oligarchy"
  | "aristocratic_republic"
  | "democracy"
  | "tribal_council"
  | "military_dictatorship"
  | "colonial_administration"
  | "communist_state"
  | "federal_republic"
  | "confederation"
  | "other";

export type RegionStatus =
  | "thriving"
  | "stable"
  | "declining"
  | "conflict"
  | "collapsed";

export type EventCategory =
  | "war"
  | "dynasty"
  | "invention"
  | "trade"
  | "religion"
  | "disaster"
  | "natural_disaster"
  | "exploration"
  | "diplomacy"
  | "migration"
  | "other";

export type BatchMode = "per_event" | "per_month" | "per_year";

export interface Region {
  id: string;
  name: LocalizedText;
  territoryId: string;
  territoryScale: "xs" | "sm" | "md" | "lg" | "xl";

  civilization: {
    name: LocalizedText;
    type: CivilizationType;
    ruler?: LocalizedText;
    rulerTitle?: LocalizedText;
    dynasty?: LocalizedText;
    capital?: LocalizedText;
    governmentForm: GovernmentForm | LocalizedText;
    socialStructure: LocalizedText;
    rulingClass: LocalizedText;
    succession: LocalizedText;
  };

  government: {
    structure: LocalizedText;
    departments: {
      name: LocalizedText;
      function: LocalizedText;
      headCount: number;
    }[];
    totalOfficials: number;
    localAdmin: LocalizedText;
    legalSystem: LocalizedText;
    taxationSystem: LocalizedText;
    keyOfficials?: {
      title: LocalizedText;
      name: LocalizedText;
      role: LocalizedText;
    }[];
  };

  culture: {
    religion: LocalizedText;
    philosophy?: LocalizedText;
    writingSystem?: LocalizedText;
    culturalAchievements: LocalizedText;
    languageFamily: LocalizedText;
  };

  economy: {
    level: number;
    gdpEstimate: MonetaryValue;
    gdpPerCapita: MonetaryValue;
    gdpDescription: LocalizedText;
    mainIndustries: LocalizedText;
    tradeGoods: LocalizedText;
    currency: CurrencyInfo;
    householdWealth: LocalizedText;
    averageIncome: MonetaryValue;
    foreignTradeVolume: MonetaryValue;
    tradeRoutes?: LocalizedText;
    economicSystem: LocalizedText;
  };

  finances: {
    annualRevenue: MonetaryValue;
    annualExpenditure: MonetaryValue;
    surplus: MonetaryValue;
    revenueBreakdown: {
      source: LocalizedText;
      amount: MonetaryValue;
      percentage: number;
    }[];
    expenditureBreakdown: {
      category: LocalizedText;
      amount: MonetaryValue;
      percentage: number;
    }[];
    treasury: MonetaryValue;
    treasuryDescription: LocalizedText;
    debtLevel?: MonetaryValue;
    fiscalPolicy: LocalizedText;
  };

  military: {
    level: number;
    totalTroops: number;
    standingArmy: number;
    reserves: number;
    branches: {
      name: LocalizedText;
      count: number;
      description: LocalizedText;
    }[];
    commandStructure: {
      commanderInChief?: LocalizedText;
      totalGenerals: number;
      keyGenerals?: {
        name: LocalizedText;
        title: LocalizedText;
        command: LocalizedText;
      }[];
    };
    technology: LocalizedText;
    annualMilitarySpending: MonetaryValue;
    militarySpendingPctGdp: number;
    threats?: LocalizedText;
    recentBattles?: LocalizedText;
  };

  demographics: {
    population: number;
    populationDescription: LocalizedText;
    urbanPopulation: number;
    urbanizationRate: number;
    majorCities: {
      name: LocalizedText;
      population: number;
    }[];
    ethnicGroups?: LocalizedText;
    socialClasses: LocalizedText;
    literacyRate?: LocalizedText;
    lifeExpectancy?: LocalizedText;
  };

  diplomacy: {
    allies: LocalizedText;
    enemies: LocalizedText;
    vassals?: LocalizedText;
    tributeRelations?: LocalizedText;
    treaties?: LocalizedText;
    foreignPolicy: LocalizedText;
    recentDiplomaticEvents?: LocalizedText;
  };

  technology: {
    level: number;
    era: LocalizedText;
    keyInnovations: LocalizedText;
    infrastructure?: LocalizedText;
  };

  assessment: {
    strengths: LocalizedText;
    weaknesses: LocalizedText;
    outlook: LocalizedText;
  };

  status: RegionStatus;
  description: LocalizedText;
}

export interface WorldState {
  id: string;
  timestamp: YearMonth;
  era: LocalizedText;
  regions: Region[];
  triggeredByEventId?: string;
  summary?: LocalizedText;
}

export interface HistoricalEvent {
  id: string;
  timestamp: YearMonth;
  title: LocalizedText;
  description: LocalizedText;
  affectedRegions: string[];
  category: EventCategory;
  status: "pending" | "processed";
  isCustom?: boolean;
  processedAt?: string;
}

export interface War {
  id: string;
  name: LocalizedText;
  startYear: number;
  endYear: number | null;
  belligerents: {
    side1: { regionIds: string[]; label: LocalizedText };
    side2: { regionIds: string[]; label: LocalizedText };
  };
  cause: LocalizedText;
  casus_belli: LocalizedText;
  status: "ongoing" | "side1_victory" | "side2_victory" | "stalemate" | "ceasefire";
  victor?: "side1" | "side2" | null;
  summary: LocalizedText;
  advantages: {
    side1: LocalizedText;
    side2: LocalizedText;
  };
  impact: {
    side1: LocalizedText;
    side2: LocalizedText;
  };
  relatedEventIds: string[];
}
