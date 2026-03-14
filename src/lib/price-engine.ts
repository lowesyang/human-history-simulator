import type {
  PriceEngineParams,
  AssetPriceTick,
  EconShock,
  LocalizedText,
  HistoricalEvent,
  Region,
  EventCategory,
} from "./types";
import { interpolatePrice } from "./economic-history";

export interface AssetDef {
  id: string;
  name: LocalizedText;
  category: string;
  unit: string;
  availableFrom: number;
  availableTo: number;
  baseVolatility: number;
  priceHistory: { year: number; price: number }[];
}

export interface PriceImpactRule {
  eventCategory: EventCategory | EventCategory[];
  assetCategories: string[];
  impactRange: [number, number];
  condition?: (event: HistoricalEvent) => boolean;
}

// ── Mulberry32 Seeded PRNG ──
function mulberry32(seed: number) {
  return function (): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Box-Muller transform for normal distribution ──
function boxMuller(u1: number, u2: number): number {
  const r = Math.sqrt(-2 * Math.log(u1));
  return r * Math.cos(2 * Math.PI * u2);
}

// ── createSeededRng: returns uniform and normal generators ──
export function createSeededRng(seed: number): {
  uniform: () => number;
  normal: () => number;
} {
  const uniform = mulberry32(seed);
  return {
    uniform,
    normal: () => {
      let u1 = uniform();
      let u2 = uniform();
      while (u1 <= 0) u1 = uniform();
      return boxMuller(u1, u2);
    },
  };
}

// ── Price impact rules (event category → asset categories → impact range) ──
// war: grain +15-40%, precious_metal +5-15%, real_asset -10-30%
// war (end): grain -10-20%, precious_metal -5-10%, real_asset +5-15%
// trade (new route): luxury -10-25%
// disaster/natural_disaster: grain +20-50%, labor +10-30%
// invention (agriculture): grain -10-20%
// finance (bubble): +30-100% then crash -40-70%
// exploration: real_asset -5-15%
const WAR_END_KEYWORDS = /ceasefire|war end|peace treaty|armistice|surrender|victory|defeat|conclusion of war/i;
const AGRICULTURE_KEYWORDS = /agricultur|grain|crop|farming|irrigation|plow|harvest|wheat|rice/i;
const BUBBLE_KEYWORDS = /bubble|speculation|mania|crisis|crash|panic/i;
const REGULATION_KEYWORDS = /regulation|ban|prohibit|crackdown|restrict|sanction|illegal|outlaw/i;
const INFLATION_KEYWORDS = /inflation|hyperinflation|devaluation|money supply|printing money|quantitative easing/i;

const PRICE_IMPACT_RULES: PriceImpactRule[] = [
  {
    eventCategory: "war",
    assetCategories: ["grain"],
    impactRange: [0.15, 0.4],
    condition: (e) => !WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["precious_metal"],
    impactRange: [0.05, 0.15],
    condition: (e) => !WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["real_asset"],
    impactRange: [-0.3, -0.1],
    condition: (e) => !WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["equity", "equity_index"],
    impactRange: [-0.25, -0.1],
    condition: (e) => !WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["bond"],
    impactRange: [0.05, 0.15],
    condition: (e) => !WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["private_equity", "fund_lp"],
    impactRange: [-0.15, -0.05],
    condition: (e) => !WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["grey_market"],
    impactRange: [0.1, 0.3],
    condition: (e) => !WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["grain"],
    impactRange: [-0.2, -0.1],
    condition: (e) => WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["precious_metal"],
    impactRange: [-0.1, -0.05],
    condition: (e) => WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["real_asset"],
    impactRange: [0.05, 0.15],
    condition: (e) => WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["equity", "equity_index"],
    impactRange: [0.05, 0.2],
    condition: (e) => WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "trade",
    assetCategories: ["luxury"],
    impactRange: [-0.25, -0.1],
  },
  { eventCategory: "disaster", assetCategories: ["grain"], impactRange: [0.2, 0.5] },
  { eventCategory: "disaster", assetCategories: ["labor"], impactRange: [0.1, 0.3] },
  { eventCategory: "disaster", assetCategories: ["equity", "equity_index"], impactRange: [-0.15, -0.05] },
  { eventCategory: "natural_disaster", assetCategories: ["grain"], impactRange: [0.2, 0.5] },
  { eventCategory: "natural_disaster", assetCategories: ["labor"], impactRange: [0.1, 0.3] },
  { eventCategory: "natural_disaster", assetCategories: ["equity", "equity_index"], impactRange: [-0.1, -0.03] },
  {
    eventCategory: "invention",
    assetCategories: ["grain"],
    impactRange: [-0.2, -0.1],
    condition: (e) => AGRICULTURE_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "invention",
    assetCategories: ["equity", "equity_index"],
    impactRange: [0.1, 0.3],
  },
  {
    eventCategory: "invention",
    assetCategories: ["private_equity"],
    impactRange: [0.05, 0.2],
  },
  {
    eventCategory: "finance",
    assetCategories: ["financial", "equity", "equity_index"],
    impactRange: [0.3, 1.0],
    condition: (e) => BUBBLE_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")) && !/crash|burst|panic|collapse/i.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "finance",
    assetCategories: ["financial", "equity", "equity_index"],
    impactRange: [-0.7, -0.4],
    condition: (e) => /crash|burst|panic|collapse/i.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "finance",
    assetCategories: ["crypto"],
    impactRange: [-0.4, -0.15],
    condition: (e) => /crash|burst|panic|collapse|crisis/i.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "finance",
    assetCategories: ["derivative"],
    impactRange: [-0.6, -0.3],
    condition: (e) => /crash|burst|panic|collapse|crisis/i.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "finance",
    assetCategories: ["bond"],
    impactRange: [0.1, 0.25],
    condition: (e) => /crash|burst|panic|collapse|crisis/i.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "finance",
    assetCategories: ["private_equity", "fund_lp"],
    impactRange: [-0.4, -0.15],
    condition: (e) => /crash|burst|panic|collapse|crisis/i.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "finance",
    assetCategories: ["futures"],
    impactRange: [-0.3, -0.1],
    condition: (e) => /crash|burst|panic|collapse|crisis/i.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "finance",
    assetCategories: ["grey_market"],
    impactRange: [-0.3, -0.1],
    condition: (e) => /crash|burst|panic|collapse|crisis/i.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "finance",
    assetCategories: ["crypto"],
    impactRange: [0.15, 0.5],
    condition: (e) => !(/crash|burst|panic|collapse|crisis/i.test((e.title?.en ?? "") + (e.description?.en ?? ""))) && BUBBLE_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "exploration",
    assetCategories: ["real_asset"],
    impactRange: [-0.15, -0.05],
  },
  {
    eventCategory: "political",
    assetCategories: ["equity", "equity_index"],
    impactRange: [-0.15, -0.05],
    condition: (e) => REGULATION_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "political",
    assetCategories: ["crypto"],
    impactRange: [-0.4, -0.2],
    condition: (e) => REGULATION_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "political",
    assetCategories: ["grey_market"],
    impactRange: [-0.6, -0.3],
    condition: (e) => REGULATION_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "political",
    assetCategories: ["bond"],
    impactRange: [-0.3, -0.1],
    condition: (e) => INFLATION_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "political",
    assetCategories: ["precious_metal"],
    impactRange: [0.1, 0.3],
    condition: (e) => INFLATION_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "political",
    assetCategories: ["crypto"],
    impactRange: [0.1, 0.3],
    condition: (e) => INFLATION_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["energy", "commodity"],
    impactRange: [0.1, 0.35],
    condition: (e) => !WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["industrial_metal"],
    impactRange: [0.1, 0.3],
    condition: (e) => !WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["real_estate"],
    impactRange: [-0.2, -0.05],
    condition: (e) => !WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["futures"],
    impactRange: [0.05, 0.2],
    condition: (e) => !WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  { eventCategory: "disaster", assetCategories: ["energy"], impactRange: [0.1, 0.3] },
  { eventCategory: "disaster", assetCategories: ["commodity"], impactRange: [0.1, 0.25] },
  { eventCategory: "disaster", assetCategories: ["real_estate"], impactRange: [-0.15, -0.05] },
  { eventCategory: "natural_disaster", assetCategories: ["energy"], impactRange: [0.1, 0.35] },
  { eventCategory: "natural_disaster", assetCategories: ["commodity"], impactRange: [0.15, 0.3] },
  {
    eventCategory: "invention",
    assetCategories: ["industrial_metal"],
    impactRange: [0.05, 0.2],
  },
  {
    eventCategory: "invention",
    assetCategories: ["energy"],
    impactRange: [0.05, 0.15],
  },
  {
    eventCategory: "finance",
    assetCategories: ["real_estate"],
    impactRange: [-0.4, -0.15],
    condition: (e) => /crash|burst|panic|collapse|crisis/i.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "finance",
    assetCategories: ["real_estate"],
    impactRange: [0.15, 0.4],
    condition: (e) => BUBBLE_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")) && !/crash|burst|panic|collapse/i.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "trade",
    assetCategories: ["commodity"],
    impactRange: [-0.1, -0.03],
  },
  {
    eventCategory: "trade",
    assetCategories: ["energy"],
    impactRange: [-0.1, -0.03],
  },
  {
    eventCategory: "political",
    assetCategories: ["real_estate"],
    impactRange: [-0.1, -0.03],
    condition: (e) => REGULATION_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "political",
    assetCategories: ["energy"],
    impactRange: [-0.2, -0.05],
    condition: (e) => REGULATION_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "political",
    assetCategories: ["industrial_metal"],
    impactRange: [-0.1, -0.03],
    condition: (e) => REGULATION_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["etf"],
    impactRange: [-0.2, -0.08],
    condition: (e) => !WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "war",
    assetCategories: ["forex"],
    impactRange: [-0.1, 0.1],
    condition: (e) => !WAR_END_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "finance",
    assetCategories: ["etf"],
    impactRange: [-0.5, -0.2],
    condition: (e) => /crash|burst|panic|collapse|crisis/i.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "finance",
    assetCategories: ["etf"],
    impactRange: [0.1, 0.4],
    condition: (e) => BUBBLE_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")) && !/crash|burst|panic|collapse/i.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "finance",
    assetCategories: ["forex"],
    impactRange: [-0.15, -0.05],
    condition: (e) => /crash|burst|panic|collapse|crisis/i.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "political",
    assetCategories: ["etf"],
    impactRange: [-0.12, -0.04],
    condition: (e) => REGULATION_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  {
    eventCategory: "political",
    assetCategories: ["forex"],
    impactRange: [-0.2, -0.05],
    condition: (e) => REGULATION_KEYWORDS.test((e.title?.en ?? "") + (e.description?.en ?? "")),
  },
  { eventCategory: "disaster", assetCategories: ["etf"], impactRange: [-0.12, -0.04] },
  { eventCategory: "natural_disaster", assetCategories: ["etf"], impactRange: [-0.1, -0.03] },
  {
    eventCategory: "invention",
    assetCategories: ["etf"],
    impactRange: [0.05, 0.15],
  },
  {
    eventCategory: "trade",
    assetCategories: ["forex"],
    impactRange: [-0.08, 0.08],
  },
];

const DEFAULT_GOLD_SILVER_RATIO = 15;

export function updateAssetPrices(
  currentPrices: Map<string, number>,
  seedAssets: AssetDef[],
  events: HistoricalEvent[],
  regions: Region[],
  currentYear: number,
  yearDelta: number,
  params: PriceEngineParams,
  rngSeed: number,
  options?: { goldSilverRatio?: number }
): { prices: AssetPriceTick[]; shocks: EconShock[] } {
  const goldSilverRatio = options?.goldSilverRatio ?? DEFAULT_GOLD_SILVER_RATIO;
  const totalRegions = regions.length || 1;
  const rng = createSeededRng(rngSeed + currentYear);

  const theta = params.thetaMeanReversion;
  const dt = Math.max(0.001, Math.min(1, yearDelta));
  const shockMult = params.shockMagnitudeMultiplier;

  const priceMap = new Map<string, number>(currentPrices);
  const volatilityMap = new Map<string, number>();
  const eventDriverMap = new Map<string, LocalizedText>();
  const shocks: EconShock[] = [];

  // Phase 1: OU process for each available asset
  for (const asset of seedAssets) {
    if (currentYear < asset.availableFrom || currentYear > asset.availableTo) continue;

    const mu = interpolatePrice(asset.priceHistory, currentYear);
    const P = priceMap.get(asset.id) ?? mu;
    const sigma = asset.baseVolatility * params.volatilityMultiplier;

    let newPrice = P;
    if (params.enableStochastic) {
      const Z = rng.normal();
      newPrice = P + theta * (mu - P) * dt + sigma * Math.sqrt(dt) * Z;
    } else {
      newPrice = P + theta * (mu - P) * dt;
    }

    const floor = 0.001 * mu;
    newPrice = Math.max(floor, newPrice);
    priceMap.set(asset.id, newPrice);
    volatilityMap.set(asset.id, sigma);
  }

  // Phase 2: Event shocks
  for (const event of events) {
    const affectedRegionIds = event.affectedRegions.filter((id) =>
      regions.some((r) => r.id === id)
    );
    const regionMod = affectedRegionIds.length / totalRegions;

    for (const rule of PRICE_IMPACT_RULES) {
      const cats = Array.isArray(rule.eventCategory)
        ? rule.eventCategory
        : [rule.eventCategory];
      if (!cats.includes(event.category)) continue;
      if (rule.condition && !rule.condition(event)) continue;

      const [lo, hi] = rule.impactRange;
      const rawMag = lo + rng.uniform() * (hi - lo);
      const magnitude = rawMag * shockMult * regionMod;
      if (Math.abs(magnitude) < 0.01) continue;

      const priceDeltas: Record<string, number> = {};
      let totalShockMagnitude = 0;

      for (const asset of seedAssets) {
        if (!rule.assetCategories.includes(asset.category)) continue;
        if (currentYear < asset.availableFrom || currentYear > asset.availableTo) continue;

        const p = priceMap.get(asset.id) ?? 0;
        if (p <= 0) continue;

        const delta = p * magnitude;
        const newP = Math.max(0.001, p + delta);
        priceMap.set(asset.id, newP);
        priceDeltas[asset.id] = delta;
        totalShockMagnitude += Math.abs(magnitude);
      }

      if (Object.keys(priceDeltas).length > 0 && totalShockMagnitude > 0.15) {
        const epicenter = affectedRegionIds[0] ?? regions[0]?.id ?? "";
        const shockType =
          magnitude > 0.2
            ? "boom"
            : magnitude < -0.2
              ? "crash"
              : magnitude < -0.1
                ? "bubble_burst"
                : "trade_disruption";
        shocks.push({
          epicenterRegionId: epicenter,
          magnitude: Math.abs(totalShockMagnitude),
          type: shockType,
          affectedRegionIds,
          priceDeltas,
          description: {
            en: `Price shock from event: ${event.title?.en ?? event.id}`,
            zh: event.title?.zh ?? event.description?.zh ?? "",
          },
        });
      }
    }
  }

  // Build output ticks
  const prices: AssetPriceTick[] = [];
  for (const asset of seedAssets) {
    if (currentYear < asset.availableFrom || currentYear > asset.availableTo) continue;
    const p = priceMap.get(asset.id);
    if (p === undefined) continue;
    const vol = volatilityMap.get(asset.id) ?? asset.baseVolatility;
    const eventDriver = eventDriverMap.get(asset.id);
    prices.push({
      assetId: asset.id,
      year: currentYear,
      priceGoldGrams: p,
      priceSilverGrams: p * goldSilverRatio,
      volatility: vol,
      eventDriver,
    });
  }

  return { prices, shocks };
}
