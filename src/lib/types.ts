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
  | "rising"
  | "stable"
  | "declining"
  | "conflict"
  | "collapsed";

const VALID_STATUSES = new Set<string>([
  "thriving", "rising", "stable", "declining", "conflict", "collapsed",
]);

const STATUS_ALIASES: Record<string, RegionStatus> = {
  expanding: "thriving",
  growing: "rising",
  prosperous: "thriving",
  peak: "thriving",
  emerging: "rising",
  fragmented: "declining",
  fragile: "declining",
  unstable: "conflict",
  warring: "conflict",
  conquered: "collapsed",
  fallen: "collapsed",
  destroyed: "collapsed",
};

export function normalizeStatus(raw: string | undefined | null): RegionStatus {
  if (!raw) return "stable";
  const lower = raw.toLowerCase();
  if (VALID_STATUSES.has(lower)) return lower as RegionStatus;
  return STATUS_ALIASES[lower] ?? "stable";
}

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
  | "technology"
  | "finance"
  | "political"
  | "other";

export type BatchMode = "per_event" | "per_month" | "per_year";

export interface SimulationParams {
  contingencyRatio: number;
  categoryWeights: Partial<Record<EventCategory, number>>;
}

export const DEFAULT_SIMULATION_PARAMS: SimulationParams = {
  contingencyRatio: 50,
  categoryWeights: {},
};

export interface Faction {
  id: string;
  name: LocalizedText;
  type: "party" | "rebel" | "warlord" | "separatist" | "religious" | "other";
  leader: LocalizedText;
  leaderTitle?: LocalizedText;
  ideology?: LocalizedText;
  foundedYear?: number;
  headquarters?: LocalizedText;
  controlledArea?: LocalizedText;
  militaryStrength?: {
    troops: number;
    description: LocalizedText;
  };
  population?: number;
  status: "ruling" | "opposition" | "insurgent" | "underground" | "allied" | "rival";
  relationship: LocalizedText;
  description: LocalizedText;
  keyFigures?: {
    name: LocalizedText;
    title: LocalizedText;
    role: LocalizedText;
  }[];
}

export interface AIModel {
  name: LocalizedText;
  developer: LocalizedText;
  releaseYear: number;
  capabilities: LocalizedText;
}

export interface AICompany {
  name: LocalizedText;
  valuation?: LocalizedText;
  keyProducts: LocalizedText;
  founded?: number;
  headquarters?: LocalizedText;
}

export interface AIKeyFigure {
  name: LocalizedText;
  title: LocalizedText;
  affiliation: LocalizedText;
  contribution: LocalizedText;
}

export interface AISector {
  level: number;
  policy: LocalizedText;
  regulatoryStance: LocalizedText;
  investmentScale: LocalizedText;
  keyModels: AIModel[];
  leadingCompanies: AICompany[];
  keyFigures: AIKeyFigure[];
  researchFocus: LocalizedText;
  computeInfrastructure: LocalizedText;
  talentPool: LocalizedText;
  globalRanking?: LocalizedText;
  outlook: LocalizedText;
}

export interface Region {
  id: string;
  name: LocalizedText;
  territoryId: string;
  territoryScale: "xs" | "sm" | "md" | "lg" | "xl";
  geometry?: GeoJSON.Geometry;

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
    giniEstimate?: number;
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
        notableBattles?: LocalizedText;
        reputation?: LocalizedText;
      }[];
    };
    technology: LocalizedText;
    annualMilitarySpending: MonetaryValue;
    militarySpendingPctGdp: number;
    threats?: LocalizedText;
    recentBattles?: LocalizedText;
    doctrine?: LocalizedText;
    training?: {
      level: number;
      description: LocalizedText;
    };
    morale?: {
      level: number;
      description: LocalizedText;
    };
    equipment?: {
      name: LocalizedText;
      category: "melee" | "ranged" | "siege" | "armor" | "naval" | "aerial" | "vehicle" | "artillery" | "missile" | "nuclear" | "cyber" | "other";
      quantity?: number;
      description: LocalizedText;
    }[];
    fortifications?: {
      name: LocalizedText;
      type: LocalizedText;
      description: LocalizedText;
    }[];
    logistics?: {
      supplyCapacity: LocalizedText;
      mobilizationSpeed: LocalizedText;
    };
    notableCampaigns?: {
      name: LocalizedText;
      year: number;
      outcome: LocalizedText;
      description: LocalizedText;
    }[];
  };

  demographics: {
    population: number;
    populationDescription: LocalizedText;
    urbanPopulation: number;
    urbanizationRate: number;
    majorCities: {
      name: LocalizedText;
      population: number;
      tags?: string[];
      description?: LocalizedText;
    }[];
    subdivisions?: {
      name: LocalizedText;
      population: number;
      capital?: LocalizedText;
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
    sectors?: Record<string, LocalizedText>;
    overallAssessment?: LocalizedText;
  };

  aiSector?: AISector;

  assessment: {
    strengths: LocalizedText;
    weaknesses: LocalizedText;
    outlook: LocalizedText;
  };

  status: RegionStatus;
  description: LocalizedText;
  factions?: Faction[];
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
  theater?: LocalizedText;
  casualties?: {
    side1: { military: number; civilian: number; description: LocalizedText };
    side2: { military: number; civilian: number; description: LocalizedText };
  };
  keyBattles?: {
    name: LocalizedText;
    year: number;
    location: LocalizedText;
    outcome: LocalizedText;
    description: LocalizedText;
    casualties: { side1: number; side2: number };
  }[];
}

export interface SideMetrics {
  totalTroops: number;
  standingArmy: number;
  militaryLevel: number;
  gdpGoldKg: number;
  population: number;
  techLevel: number;
  casualties: number;
  morale: number;
}

export interface WarMetricsSnapshot {
  year: number;
  side1: SideMetrics;
  side2: SideMetrics;
}

// ── Economic History & Asset Tracking ──

export interface EconomicSnapshot {
  regionId: string;
  year: number;
  gdpGoldKg: number;
  gdpPerCapitaGoldKg: number;
  treasuryGoldKg: number;
  revenueGoldKg: number;
  expenditureGoldKg: number;
  tradeVolumeGoldKg: number;
  debtGoldKg: number;
  militarySpendingPctGdp: number;
  population: number;
  urbanizationRate: number;
  giniEstimate?: number;
}

export interface AssetPriceTick {
  assetId: string;
  year: number;
  priceGoldGrams: number;
  priceSilverGrams: number;
  volatility: number;
  eventDriver?: LocalizedText;
}

export interface ExchangeRatePoint {
  year: number;
  goldSilverRatio: number;
  pppGrainGoldG: number;
  pppWageGoldG: number;
}

export type AssetCategory =
  | "precious_metal"
  | "grain"
  | "commodity"
  | "luxury"
  | "energy"
  | "real_asset"
  | "labor"
  | "financial"
  | "industrial_metal"
  | "real_estate"
  | "equity"
  | "equity_index"
  | "private_equity"
  | "fund_lp"
  | "bond"
  | "futures"
  | "crypto"
  | "derivative"
  | "grey_market"
  | "etf"
  | "forex";

export interface CommodityDef {
  id: string;
  name: LocalizedText;
  category: AssetCategory;
  unit: string;
  availableFrom: number;
  availableTo: number;
  baseVolatility: number;
}

export interface EconomicPanelView {
  mode: "gdptrend" | "inequality" | "portfolio";
  selectedAssetIds: string[];
  selectedRegionIds: string[];
  denomination: "gold" | "silver" | "usd";
  timeRange: { from: number; to: number };
}

export interface EconShock {
  epicenterRegionId: string;
  magnitude: number;
  type: "crash" | "boom" | "trade_disruption" | "bubble_burst" | "currency_crisis";
  affectedRegionIds: string[];
  priceDeltas: Record<string, number>;
  description: LocalizedText;
}

export interface PriceEngineParams {
  thetaMeanReversion: number;
  volatilityMultiplier: number;
  shockMagnitudeMultiplier: number;
  enableStochastic: boolean;
  randomSeed?: number;
}

export const DEFAULT_PRICE_ENGINE_PARAMS: PriceEngineParams = {
  thetaMeanReversion: 0.3,
  volatilityMultiplier: 1.0,
  shockMagnitudeMultiplier: 1.0,
  enableStochastic: true,
};

export interface InertiaParams {
  minGrowthRate: number;
  maxGrowthRate: number;
  techPeakGrowth: number;
  techPeakWidth: number;
  urbanGrowthDampening: number;
  warGrowthPenalty: number;
  capitalShare: number;
  surplusInvestmentRate: number;
  baseTfpGrowth: number;
  tradeGrowthBonus: number;
  warGdpPenalty: number;
  minGdpGrowth: number;
  maxGdpGrowth: number;
  revenueElasticity: number;
  expenditureElasticity: number;
  baseInterestRate: number;
  riskPremiumMultiplier: number;
  enabled: boolean;
}

export const DEFAULT_INERTIA_PARAMS: InertiaParams = {
  minGrowthRate: 0.001,
  maxGrowthRate: 0.015,
  techPeakGrowth: 6,
  techPeakWidth: 2.5,
  urbanGrowthDampening: 0.3,
  warGrowthPenalty: 0.5,
  capitalShare: 0.35,
  surplusInvestmentRate: 0.4,
  baseTfpGrowth: 0.005,
  tradeGrowthBonus: 0.02,
  warGdpPenalty: 0.022,
  minGdpGrowth: -0.20,
  maxGdpGrowth: 0.10,
  revenueElasticity: 1.1,
  expenditureElasticity: 0.8,
  baseInterestRate: 0.05,
  riskPremiumMultiplier: 0.5,
  enabled: true,
};

export interface PortfolioAllocation {
  assetId: string;
  percentage: number;
  entryPrice: number;
}

export interface PortfolioSnapshot {
  year: number;
  totalValueGoldKg: number;
  cashGoldKg: number;
  holdings: Record<string, number>;
}

export interface Portfolio {
  id: string;
  name: string;
  eraId: string;
  startYear: number;
  initialGoldKg: number;
  allocations: PortfolioAllocation[];
  snapshots: PortfolioSnapshot[];
}
