/**
 * Economic Inertia Module
 *
 * Computes background economic evolution using validated economic models,
 * running BEFORE LLM orchestration on each advance step.
 *
 * Models:
 * 1. Population: Modified Malthusian-Demographic Transition (Clark, "A Farewell to Alms")
 * 2. GDP: Simplified Solow Growth Model (alpha, dK/K, dL/L, TFP; Frankel & Romer 1999; Collier 1999)
 * 3. Fiscal: Barro 1979 tax smoothing, Domar 1944 debt sustainability (Homer & Sylla interest rates)
 */

import type { Region, InertiaParams } from "./types";
import { DEFAULT_INERTIA_PARAMS } from "./types";

// ── Interfaces ──

export interface InertiaDelta {
  regionId: string;
  populationDelta: number;
  gdpDelta: number;
  revenueDelta: number;
  expenditureDelta: number;
  treasuryDelta: number;
  debtDelta: number;
  interestPayment: number;
  giniEstimate: number;
}

export interface InertiaResult {
  deltas: InertiaDelta[];
  summary: {
    totalPopDelta: number;
    totalGdpDelta: number;
    regionsProcessed: number;
  };
}

// ── Helpers ──

function bellCurve(x: number, peak: number, width: number): number {
  return Math.exp(-0.5 * ((x - peak) / width) ** 2);
}

function getGoldKg(v: { goldKg?: number } | undefined): number {
  if (!v) return 0;
  if (typeof v.goldKg === "number") return v.goldKg;
  return 0;
  return 0;
}

// ── Model 1: Population Growth (Modified Malthusian-Demographic Transition) ──

/** Base capacity scales with tech. Each tech level roughly doubles capacity. */
function computeCarryingCapacity(region: Region, techLevel: number): number {
  const baseCapacity = 500_000;
  return baseCapacity * Math.pow(2, techLevel);
}

/**
 * Population growth rate varies by tech:
 * Pre-industrial: 0.1-0.3% p.a. (Clark, "A Farewell to Alms")
 * Industrial peak: 1.0-1.5% p.a.
 * Post-demographic-transition: 0.0-0.5% p.a.
 * Bell curve peaks at techLevel ~6 (industrializing).
 */
function computePopulationDelta(
  region: Region,
  yearDelta: number,
  params: InertiaParams
): number {
  const techLevel = region.technology?.level ?? 0;
  const pop = region.demographics?.population ?? 0;
  if (pop <= 0) return 0;

  const carryingCapacity = computeCarryingCapacity(region, techLevel);
  const utilization = Math.min(1, pop / Math.max(1, carryingCapacity));

  // Base growth: bell curve peaks at techPeak, with min/max bounds
  const bell = bellCurve(techLevel, params.techPeakGrowth, params.techPeakWidth);
  const peakRate = params.maxGrowthRate;
  const floorRate = params.minGrowthRate;
  const baseRate = floorRate + (peakRate - floorRate) * bell;

  // Pre-industrial: lower rate when far from peak
  const preIndustrialDampen = techLevel < 3 ? 0.5 : 1;
  // Post-transition: urbanization dampens growth
  const urbanRate = region.demographics?.urbanizationRate ?? 0;
  const postTransitionDampen =
    1 - params.urbanGrowthDampening * Math.min(1, urbanRate / 100);
  let effectiveRate = baseRate * preIndustrialDampen * postTransitionDampen;

  // War penalty
  if (region.status === "conflict") {
    effectiveRate -= params.warGrowthPenalty * effectiveRate;
  }

  // Carrying capacity pressure: slow growth when near capacity
  const capacityPressure = 1 - 0.5 * utilization;
  effectiveRate *= Math.max(0.2, capacityPressure);

  const delta = pop * effectiveRate * yearDelta;
  return Math.round(delta);
}

// ── Model 2: GDP Growth (Simplified Solow) ──

/**
 * dY/Y = alpha * dK/K + (1-alpha) * dL/L + A
 * - alpha = capital share (~0.35)
 * - dK/K = surplus investment rate
 * - dL/L = labor growth from population
 * - A = TFP (technology-driven with diminishing returns)
 * - Trade openness bonus (Frankel & Romer, 1999)
 * - War penalty (Collier, 1999: ~2.2% per year)
 * Clamp to [minGdpGrowth, maxGdpGrowth] per year
 */
function computeGdpDelta(
  region: Region,
  yearDelta: number,
  popDelta: number,
  params: InertiaParams
): number {
  const gdp = getGoldKg(region.economy?.gdpEstimate);
  const pop = region.demographics?.population ?? 1;
  if (gdp <= 0) return 0;

  const alpha = params.capitalShare;
  const dK_over_K = params.surplusInvestmentRate;
  const dL_over_L = popDelta / Math.max(1, pop);

  // TFP: technology-driven with diminishing returns
  const techLevel = region.technology?.level ?? 0;
  const tfpGrowth =
    params.baseTfpGrowth * Math.log1p(techLevel) * (1 / Math.log1p(10));

  // Trade openness bonus (Frankel & Romer, 1999)
  const tradeVolume = getGoldKg(region.economy?.foreignTradeVolume);
  const tradeOpenness = gdp > 0 ? Math.min(1, tradeVolume / gdp) : 0;
  const tradeBonus = params.tradeGrowthBonus * tradeOpenness;

  // War penalty (Collier, 1999: ~2.2% per year)
  const warPenalty =
    region.status === "conflict" ? params.warGdpPenalty * yearDelta : 0;

  const growthRate =
    alpha * dK_over_K +
    (1 - alpha) * dL_over_L +
    tfpGrowth +
    tradeBonus -
    warPenalty;

  const clampedRate = Math.max(
    params.minGdpGrowth * yearDelta,
    Math.min(params.maxGdpGrowth * yearDelta, growthRate * yearDelta)
  );

  return gdp * clampedRate;
}

// ── Model 3: Fiscal Dynamics (Government Budget Constraint) ──

/**
 * Model 4: Gini Coefficient Estimation (Kuznets Curve + structural factors)
 *
 * Kuznets (1955): inequality follows an inverted-U curve with development.
 * - Pre-industrial (tech 0-3): low inequality (0.20-0.35), egalitarian subsistence
 * - Industrializing (tech 4-6): peak inequality (0.45-0.60), capital accumulation
 * - Post-industrial (tech 7-10): declining inequality (0.25-0.40), welfare state
 *
 * Modifiers:
 * - Urbanization: higher urban → more inequality up to ~60%, then decreasing
 * - Trade openness: moderate trade reduces Gini, high trade has mixed effect
 * - Conflict: wars historically reduce inequality (Scheidel, "The Great Leveler")
 * - Government type: democracies/welfare states → lower Gini
 *
 * Output is smoothed against the previous value to avoid jumps.
 */
function computeGiniEstimate(
  region: Region,
  gdpDelta: number,
): number {
  const techLevel = region.technology?.level ?? 0;
  const urbanRate = (region.demographics?.urbanizationRate ?? 0) / 100;
  const gdp = getGoldKg(region.economy?.gdpEstimate);
  const tradeVol = getGoldKg(region.economy?.foreignTradeVolume);
  const tradeOpenness = gdp > 0 ? Math.min(1, tradeVol / gdp) : 0;
  const prevGini = region.economy?.giniEstimate;

  // Kuznets base curve: inverted-U peaking around tech 5
  const kuznetsBase = 0.20 + 0.35 * bellCurve(techLevel, 5, 2.5);

  // Urbanization modifier: peaks around 50-60% urbanization
  const urbanModifier = 0.08 * bellCurve(urbanRate, 0.55, 0.25);

  // Trade modifier: moderate trade reduces inequality slightly
  const tradeModifier = -0.03 * tradeOpenness;

  // Conflict modifier: wars reduce inequality (Scheidel)
  const conflictModifier = region.status === "conflict" ? -0.04 : 0;

  // Economic growth modifier: fast growth often increases inequality short-term
  const growthRate = gdp > 0 ? gdpDelta / gdp : 0;
  const growthModifier = 0.02 * Math.tanh(growthRate * 5);

  // Government type modifier
  let govModifier = 0;
  const govForm = typeof region.civilization?.governmentForm === "object"
    ? (region.civilization.governmentForm as { en?: string }).en?.toLowerCase() ?? ""
    : "";
  if (govForm.includes("democracy") || govForm.includes("republic") || govForm.includes("welfare")) {
    govModifier = -0.04;
  } else if (govForm.includes("communist") || govForm.includes("socialist")) {
    govModifier = -0.06;
  } else if (govForm.includes("absolute") || govForm.includes("feudal") || govForm.includes("monarchy")) {
    govModifier = 0.03;
  } else if (govForm.includes("oligarch")) {
    govModifier = 0.05;
  }

  let rawGini = kuznetsBase + urbanModifier + tradeModifier + conflictModifier + growthModifier + govModifier;
  rawGini = Math.max(0.15, Math.min(0.70, rawGini));

  // Smooth against previous value to avoid jumps
  if (prevGini != null && prevGini > 0) {
    return prevGini * 0.7 + rawGini * 0.3;
  }

  return rawGini;
}

/**
 * Barro (1979) tax smoothing, Domar (1944) debt sustainability.
 * Revenue tracks GDP with elasticity ~1.0-1.2.
 * Expenditure has downward rigidity (Ratchet effect).
 * Military spending responds to conflict.
 * Debt service: interest on existing debt. Historical rates: 5-8% ancient, 3-6% medieval, 2-5% modern.
 * Risk premium increases with debt/GDP ratio.
 */
function computeFiscalDeltas(
  region: Region,
  gdpDelta: number,
  gdpBefore: number,
  params: InertiaParams
): {
  revenueDelta: number;
  expenditureDelta: number;
  treasuryDelta: number;
  debtDelta: number;
  interestPayment: number;
} {
  const revenue = getGoldKg(region.finances?.annualRevenue);
  const expenditure = getGoldKg(region.finances?.annualExpenditure);
  const treasury = getGoldKg(region.finances?.treasury);
  const debt = getGoldKg(region.finances?.debtLevel);

  const gdpAfter = Math.max(0.1, gdpBefore + gdpDelta);
  const gdpGrowthRate = gdpBefore > 0 ? gdpDelta / gdpBefore : 0;

  // Revenue elasticity ~1.0-1.2 (tracks GDP)
  const revenueDelta = revenue * params.revenueElasticity * gdpGrowthRate;

  // Expenditure elasticity ~0.8 (downward rigidity - Ratchet effect)
  let expenditureDelta = expenditure * params.expenditureElasticity * gdpGrowthRate;
  // Expenditure never falls as much when GDP falls (downward rigidity)
  if (gdpGrowthRate < 0) {
    expenditureDelta *= 0.5; // less responsive to decline
  }

  // Military spending responds to conflict
  if (region.status === "conflict") {
    const baseMilitaryPct = region.military?.militarySpendingPctGdp ?? 0.03;
    const conflictMultiplier = 1.5;
    const militaryBump =
      gdpAfter * (baseMilitaryPct * (conflictMultiplier - 1)) * 0.1;
    expenditureDelta += militaryBump;
  }

  // Interest rate: base + risk premium from debt/GDP (Homer & Sylla)
  const debtToGdp = gdpAfter > 0 ? debt / gdpAfter : 0;
  const riskPremium = params.riskPremiumMultiplier * Math.min(1, debtToGdp);
  const interestRate = params.baseInterestRate + riskPremium;
  const interestPayment = debt * interestRate;

  expenditureDelta += interestPayment;

  // Net fiscal balance
  const netRevenue = revenue + revenueDelta;
  const netExpenditure = expenditure + expenditureDelta;
  const fiscalBalance = netRevenue - netExpenditure;

  let treasuryDelta = fiscalBalance;
  let debtDelta = 0;

  if (fiscalBalance >= 0) {
    treasuryDelta = fiscalBalance;
    if (debt > 0) {
      const paydown = Math.min(debt, fiscalBalance * 0.3);
      debtDelta = -paydown;
      treasuryDelta -= paydown;
    }
  } else {
    if (treasury >= -fiscalBalance) {
      treasuryDelta = fiscalBalance;
    } else {
      const deficit = -fiscalBalance;
      treasuryDelta = -treasury;
      debtDelta = deficit - treasury;
    }
  }

  return {
    revenueDelta,
    expenditureDelta,
    treasuryDelta,
    debtDelta,
    interestPayment,
  };
}

// ── Main ──

export function computeEconomicInertia(
  regions: Region[],
  yearDelta: number,
  params: InertiaParams = DEFAULT_INERTIA_PARAMS
): InertiaResult {
  if (!params.enabled) {
    return {
      deltas: [],
      summary: { totalPopDelta: 0, totalGdpDelta: 0, regionsProcessed: 0 },
    };
  }

  const deltas: InertiaDelta[] = [];
  let totalPopDelta = 0;
  let totalGdpDelta = 0;

  for (const region of regions) {
    const popDelta = computePopulationDelta(region, yearDelta, params);
    const gdpDelta = computeGdpDelta(region, yearDelta, popDelta, params);
    const gdpBefore = getGoldKg(region.economy?.gdpEstimate);
    const fiscal = computeFiscalDeltas(region, gdpDelta, gdpBefore, params);
    const giniEstimate = computeGiniEstimate(region, gdpDelta);

    deltas.push({
      regionId: region.id,
      populationDelta: popDelta,
      gdpDelta,
      revenueDelta: fiscal.revenueDelta,
      expenditureDelta: fiscal.expenditureDelta,
      treasuryDelta: fiscal.treasuryDelta,
      debtDelta: fiscal.debtDelta,
      interestPayment: fiscal.interestPayment,
      giniEstimate,
    });

    totalPopDelta += popDelta;
    totalGdpDelta += gdpDelta;
  }

  return {
    deltas,
    summary: {
      totalPopDelta,
      totalGdpDelta,
      regionsProcessed: regions.length,
    },
  };
}

export function applyInertiaDelta(region: Region, delta: InertiaDelta): void {
  if (region.id !== delta.regionId) return;

  const pop = region.demographics?.population ?? 0;
  region.demographics ??= {} as Region["demographics"];
  region.demographics.population = Math.max(0, pop + delta.populationDelta);

  const gdp = getGoldKg(region.economy?.gdpEstimate);
  const newGdp = Math.max(0, gdp + delta.gdpDelta);
  region.economy ??= {} as Region["economy"];
  region.economy.gdpEstimate ??= {} as Region["economy"]["gdpEstimate"];
  (region.economy.gdpEstimate as { goldKg?: number }).goldKg = newGdp;
  if (typeof region.economy.gdpEstimate.amount === "number") {
    region.economy.gdpEstimate.amount = newGdp;
  }

  const newPop = region.demographics.population;
  region.economy.gdpPerCapita ??= {} as Region["economy"]["gdpPerCapita"];
  (region.economy.gdpPerCapita as { goldKg?: number }).goldKg =
    newPop > 0 ? newGdp / newPop : 0;
  if (typeof region.economy.gdpPerCapita.amount === "number") {
    region.economy.gdpPerCapita.amount = newPop > 0 ? newGdp / newPop : 0;
  }

  region.finances ??= {} as Region["finances"];
  const rev = getGoldKg(region.finances.annualRevenue);
  const exp = getGoldKg(region.finances.annualExpenditure);
  (region.finances.annualRevenue as { goldKg?: number }).goldKg =
    rev + delta.revenueDelta;
  (region.finances.annualExpenditure as { goldKg?: number }).goldKg =
    exp + delta.expenditureDelta;

  const treasury = getGoldKg(region.finances.treasury);
  (region.finances.treasury as { goldKg?: number }).goldKg =
    treasury + delta.treasuryDelta;

  if (!region.finances.debtLevel) {
    region.finances.debtLevel = {
      amount: 0,
      unit: { zh: "黄金公斤", en: "kg gold" },
      goldKg: 0,
    };
  }
  const debt = getGoldKg(region.finances.debtLevel);
  (region.finances.debtLevel as { goldKg?: number }).goldKg = Math.max(
    0,
    debt + delta.debtDelta
  );

  const newRev = rev + delta.revenueDelta;
  const newExp = exp + delta.expenditureDelta;
  region.finances.surplus ??= {} as Region["finances"]["surplus"];
  (region.finances.surplus as { goldKg?: number }).goldKg = newRev - newExp;
  if (typeof region.finances.surplus.amount === "number") {
    region.finances.surplus.amount = newRev - newExp;
  }

  // Gini coefficient (Kuznets curve model)
  region.economy.giniEstimate = delta.giniEstimate;
}
