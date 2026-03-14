import { getDb, getCurrentEraId } from "./db";
import type { EconomicSnapshot, AssetPriceTick, ExchangeRatePoint, LocalizedText } from "./types";

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Economic History Snapshots ──

export function insertEconomicSnapshot(
  regionId: string,
  year: number,
  eraId: string | null,
  data: Omit<EconomicSnapshot, "regionId" | "year">
) {
  const db = getDb();
  const effectiveEraId = eraId ?? getCurrentEraId();
  db.prepare(`
    INSERT OR REPLACE INTO economic_history
      (id, region_id, year, era_id, gdp_gold_kg, gdp_per_capita_gold_kg,
       treasury_gold_kg, revenue_gold_kg, expenditure_gold_kg,
       trade_volume_gold_kg, debt_gold_kg, military_spending_pct_gdp,
       population, urbanization_rate, gini_estimate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    genId(), regionId, year, effectiveEraId,
    data.gdpGoldKg, data.gdpPerCapitaGoldKg,
    data.treasuryGoldKg, data.revenueGoldKg, data.expenditureGoldKg,
    data.tradeVolumeGoldKg, data.debtGoldKg, data.militarySpendingPctGdp,
    data.population, data.urbanizationRate, data.giniEstimate ?? null
  );
}

export function getEconomicHistory(
  regionId: string,
  eraId?: string | null
): EconomicSnapshot[] {
  const db = getDb();
  const era = eraId ?? getCurrentEraId();
  const rows = era
    ? db.prepare(
      `SELECT * FROM economic_history WHERE region_id = ? AND era_id = ? ORDER BY year ASC`
    ).all(regionId, era)
    : db.prepare(
      `SELECT * FROM economic_history WHERE region_id = ? ORDER BY year ASC`
    ).all(regionId);
  return (rows as Record<string, unknown>[]).map(parseEconRow);
}

export function getEconomicRankings(
  year: number,
  eraId: string | null,
  metric: string = "gdp_gold_kg",
  limit: number = 20
): { regionId: string; value: number }[] {
  const db = getDb();
  const era = eraId ?? getCurrentEraId();
  const allowedMetrics = new Set([
    "gdp_gold_kg", "gdp_per_capita_gold_kg", "treasury_gold_kg",
    "revenue_gold_kg", "trade_volume_gold_kg", "population",
    "urbanization_rate", "gini_estimate", "military_spending_pct_gdp",
  ]);
  const col = allowedMetrics.has(metric) ? metric : "gdp_gold_kg";

  const rows = era
    ? db.prepare(
      `SELECT region_id, ${col} as value FROM economic_history
         WHERE year = ? AND era_id = ? ORDER BY ${col} DESC LIMIT ?`
    ).all(year, era, limit)
    : db.prepare(
      `SELECT region_id, ${col} as value FROM economic_history
         WHERE year = ? ORDER BY ${col} DESC LIMIT ?`
    ).all(year, limit);

  return (rows as { region_id: string; value: number }[]).map((r) => ({
    regionId: r.region_id,
    value: r.value,
  }));
}

export function getGlobalEconomicTrend(
  eraId: string | null,
  metric: string = "gdp_gold_kg"
): { year: number; value: number }[] {
  const db = getDb();
  const era = eraId ?? getCurrentEraId();
  const allowedMetrics = new Set([
    "gdp_gold_kg", "trade_volume_gold_kg", "population",
    "revenue_gold_kg", "expenditure_gold_kg",
  ]);
  const col = allowedMetrics.has(metric) ? metric : "gdp_gold_kg";

  const rows = era
    ? db.prepare(
      `SELECT year, SUM(${col}) as value FROM economic_history
         WHERE era_id = ? GROUP BY year ORDER BY year ASC`
    ).all(era)
    : db.prepare(
      `SELECT year, SUM(${col}) as value FROM economic_history
         GROUP BY year ORDER BY year ASC`
    ).all();

  return (rows as { year: number; value: number }[]).map((r) => ({
    year: r.year,
    value: r.value,
  }));
}

export function getAllRegionSnapshots(
  eraId: string | null
): Record<string, EconomicSnapshot[]> {
  const db = getDb();
  const era = eraId ?? getCurrentEraId();
  const rows = era
    ? db.prepare(
      `SELECT * FROM economic_history WHERE era_id = ? ORDER BY region_id, year ASC`
    ).all(era)
    : db.prepare(
      `SELECT * FROM economic_history ORDER BY region_id, year ASC`
    ).all();

  const result: Record<string, EconomicSnapshot[]> = {};
  for (const row of rows as Record<string, unknown>[]) {
    const snap = parseEconRow(row);
    if (!result[snap.regionId]) result[snap.regionId] = [];
    result[snap.regionId].push(snap);
  }
  return result;
}

function parseEconRow(row: Record<string, unknown>): EconomicSnapshot {
  return {
    regionId: row.region_id as string,
    year: row.year as number,
    gdpGoldKg: (row.gdp_gold_kg as number) ?? 0,
    gdpPerCapitaGoldKg: (row.gdp_per_capita_gold_kg as number) ?? 0,
    treasuryGoldKg: (row.treasury_gold_kg as number) ?? 0,
    revenueGoldKg: (row.revenue_gold_kg as number) ?? 0,
    expenditureGoldKg: (row.expenditure_gold_kg as number) ?? 0,
    tradeVolumeGoldKg: (row.trade_volume_gold_kg as number) ?? 0,
    debtGoldKg: (row.debt_gold_kg as number) ?? 0,
    militarySpendingPctGdp: (row.military_spending_pct_gdp as number) ?? 0,
    population: (row.population as number) ?? 0,
    urbanizationRate: (row.urbanization_rate as number) ?? 0,
    giniEstimate: (row.gini_estimate as number) ?? undefined,
  };
}

// ── Population Trend (DB + static benchmarks) ──

import populationBenchmarksRaw from "@/data/economic/population-benchmarks.json";

const benchmarkData: Record<string, { year: number; population: number }[]> = {};
for (const [k, v] of Object.entries(populationBenchmarksRaw)) {
  if (k.startsWith("_")) continue;
  benchmarkData[k] = v as { year: number; population: number }[];
}

export function getPopulationTrend(
  regionId: string,
  currentYear: number,
  lookbackYears: number = 10,
  eraId?: string | null
): { year: number; population: number }[] {
  const dbSeries = getEconomicHistory(regionId, eraId);
  const dbMap = new Map<number, number>();
  for (const s of dbSeries) {
    if (s.population > 0) dbMap.set(s.year, s.population);
  }

  const benchSeries = benchmarkData[regionId];
  const benchMap = new Map<number, number>();
  if (benchSeries) {
    for (const p of benchSeries) {
      benchMap.set(p.year, p.population);
    }
  }

  const startYear = currentYear - lookbackYears;
  const result: { year: number; population: number }[] = [];

  for (let y = startYear; y <= currentYear; y++) {
    const pop = dbMap.get(y) ?? benchMap.get(y);
    if (pop != null && pop > 0) {
      result.push({ year: y, population: pop });
    }
  }

  if (result.length < 3 && benchSeries && benchSeries.length > 0) {
    const sorted = [...benchSeries].sort((a, b) => a.year - b.year);
    const nearby = sorted.filter(
      (p) => p.year >= startYear - 20 && p.year <= currentYear + 5
    );
    if (nearby.length > 0) {
      const merged = new Map<number, number>();
      for (const p of nearby) merged.set(p.year, p.population);
      for (const r of result) merged.set(r.year, r.population);
      return [...merged.entries()]
        .sort(([a], [b]) => a - b)
        .slice(-12)
        .map(([year, population]) => ({ year, population }));
    }
  }

  return result;
}

// ── Asset Prices ──

export function insertAssetPrice(
  assetId: string,
  year: number,
  eraId: string | null,
  priceGoldGrams: number,
  priceSilverGrams: number | null,
  volatility: number,
  eventDriver?: LocalizedText
) {
  const db = getDb();
  const effectiveEraId = eraId ?? getCurrentEraId();
  db.prepare(`
    INSERT OR REPLACE INTO asset_prices
      (id, asset_id, year, era_id, price_gold_grams, price_silver_grams, volatility, event_driver_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    genId(), assetId, year, effectiveEraId,
    priceGoldGrams, priceSilverGrams, volatility,
    eventDriver ? JSON.stringify(eventDriver) : null
  );
}

export function getAssetPriceHistory(
  assetId: string,
  eraId?: string | null,
  fromYear?: number,
  toYear?: number
): AssetPriceTick[] {
  const db = getDb();
  const era = eraId ?? getCurrentEraId();
  let query = `SELECT * FROM asset_prices WHERE asset_id = ?`;
  const params: unknown[] = [assetId];

  if (era) {
    query += ` AND era_id = ?`;
    params.push(era);
  }
  if (fromYear !== undefined) {
    query += ` AND year >= ?`;
    params.push(fromYear);
  }
  if (toYear !== undefined) {
    query += ` AND year <= ?`;
    params.push(toYear);
  }
  query += ` ORDER BY year ASC`;

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
  return rows.map(parseAssetPriceRow);
}

export function getAllAssetPrices(
  year: number,
  eraId?: string | null
): AssetPriceTick[] {
  const db = getDb();
  const era = eraId ?? getCurrentEraId();
  const rows = era
    ? db.prepare(
      `SELECT * FROM asset_prices WHERE year = ? AND era_id = ?`
    ).all(year, era)
    : db.prepare(
      `SELECT * FROM asset_prices WHERE year = ?`
    ).all(year);
  return (rows as Record<string, unknown>[]).map(parseAssetPriceRow);
}

export function getLatestAssetPrices(
  eraId?: string | null
): AssetPriceTick[] {
  const db = getDb();
  const era = eraId ?? getCurrentEraId();
  const rows = era
    ? db.prepare(`
        SELECT ap.* FROM asset_prices ap
        INNER JOIN (
          SELECT asset_id, MAX(year) as max_year FROM asset_prices WHERE era_id = ? GROUP BY asset_id
        ) latest ON ap.asset_id = latest.asset_id AND ap.year = latest.max_year AND ap.era_id = ?
      `).all(era, era)
    : db.prepare(`
        SELECT ap.* FROM asset_prices ap
        INNER JOIN (
          SELECT asset_id, MAX(year) as max_year FROM asset_prices GROUP BY asset_id
        ) latest ON ap.asset_id = latest.asset_id AND ap.year = latest.max_year
      `).all();
  return (rows as Record<string, unknown>[]).map(parseAssetPriceRow);
}

function parseAssetPriceRow(row: Record<string, unknown>): AssetPriceTick {
  return {
    assetId: row.asset_id as string,
    year: row.year as number,
    priceGoldGrams: row.price_gold_grams as number,
    priceSilverGrams: (row.price_silver_grams as number) ?? 0,
    volatility: (row.volatility as number) ?? 0,
    eventDriver: row.event_driver_json
      ? JSON.parse(row.event_driver_json as string)
      : undefined,
  };
}

// ── Exchange Rates ──

export function insertExchangeRate(
  year: number,
  eraId: string | null,
  goldSilverRatio: number,
  pppGrainGoldG: number | null,
  pppWageGoldG: number | null
) {
  const db = getDb();
  const effectiveEraId = eraId ?? getCurrentEraId();
  db.prepare(`
    INSERT OR REPLACE INTO exchange_rates
      (id, year, era_id, gold_silver_ratio, ppp_grain_gold_g, ppp_wage_gold_g)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(genId(), year, effectiveEraId, goldSilverRatio, pppGrainGoldG, pppWageGoldG);
}

export function getExchangeRateHistory(
  eraId?: string | null
): ExchangeRatePoint[] {
  const db = getDb();
  const era = eraId ?? getCurrentEraId();
  const rows = era
    ? db.prepare(
      `SELECT * FROM exchange_rates WHERE era_id = ? ORDER BY year ASC`
    ).all(era)
    : db.prepare(
      `SELECT * FROM exchange_rates ORDER BY year ASC`
    ).all();
  return (rows as Record<string, unknown>[]).map((r) => ({
    year: r.year as number,
    goldSilverRatio: r.gold_silver_ratio as number,
    pppGrainGoldG: (r.ppp_grain_gold_g as number) ?? 0,
    pppWageGoldG: (r.ppp_wage_gold_g as number) ?? 0,
  }));
}

// ── Portfolio ──

export function insertPortfolio(
  id: string,
  name: string,
  eraId: string | null,
  startYear: number,
  initialGoldKg: number,
  allocations: { assetId: string; percentage: number; entryPrice: number }[]
) {
  const db = getDb();
  const effectiveEraId = eraId ?? getCurrentEraId();
  db.prepare(`
    INSERT INTO portfolios (id, name, era_id, start_year, initial_gold_kg, allocations_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, effectiveEraId, startYear, initialGoldKg, JSON.stringify(allocations));
}

export function getPortfolio(id: string) {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM portfolios WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  const snapshots = db.prepare(
    `SELECT * FROM portfolio_snapshots WHERE portfolio_id = ? ORDER BY year ASC`
  ).all(id) as Record<string, unknown>[];
  return {
    id: row.id as string,
    name: row.name as string,
    eraId: row.era_id as string,
    startYear: row.start_year as number,
    initialGoldKg: row.initial_gold_kg as number,
    allocations: JSON.parse(row.allocations_json as string),
    snapshots: snapshots.map((s) => ({
      year: s.year as number,
      totalValueGoldKg: s.total_value_gold_kg as number,
      cashGoldKg: (s.cash_gold_kg as number) ?? 0,
      holdings: JSON.parse(s.holdings_json as string),
      costBasis: JSON.parse((s.cost_basis_json as string) || "{}"),
      realizedPnlGoldKg: (s.realized_pnl_gold_kg as number) ?? 0,
    })),
  };
}

export function listPortfolios(eraId?: string | null, allEras = false) {
  const db = getDb();
  if (allEras) {
    const rows = db.prepare(`SELECT * FROM portfolios ORDER BY created_at DESC`).all();
    return (rows as Record<string, unknown>[]).map(parsePortfolioRow);
  }
  const era = eraId ?? getCurrentEraId();
  const rows = era
    ? db.prepare(`SELECT * FROM portfolios WHERE era_id = ? ORDER BY created_at DESC`).all(era)
    : db.prepare(`SELECT * FROM portfolios ORDER BY created_at DESC`).all();
  return (rows as Record<string, unknown>[]).map(parsePortfolioRow);
}

function parsePortfolioRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    eraId: row.era_id as string,
    startYear: row.start_year as number,
    initialGoldKg: row.initial_gold_kg as number,
    allocations: JSON.parse(row.allocations_json as string),
  };
}

export function insertPortfolioSnapshot(
  portfolioId: string,
  year: number,
  totalValueGoldKg: number,
  holdings: Record<string, number>,
  cashGoldKg?: number,
  costBasis?: Record<string, number>,
  realizedPnlGoldKg?: number
) {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO portfolio_snapshots
      (id, portfolio_id, year, total_value_gold_kg, holdings_json, cash_gold_kg, cost_basis_json, realized_pnl_gold_kg)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    genId(), portfolioId, year, totalValueGoldKg,
    JSON.stringify(holdings), cashGoldKg ?? 0,
    JSON.stringify(costBasis ?? {}), realizedPnlGoldKg ?? 0
  );
}

export function updatePortfolioAllocations(
  portfolioId: string,
  allocations: { assetId: string; percentage: number; entryPrice: number }[]
) {
  const db = getDb();
  db.prepare(`UPDATE portfolios SET allocations_json = ? WHERE id = ?`).run(
    JSON.stringify(allocations), portfolioId
  );
}

export function getLatestPortfolioSnapshot(portfolioId: string) {
  const db = getDb();
  const row = db.prepare(
    `SELECT * FROM portfolio_snapshots WHERE portfolio_id = ? ORDER BY year DESC LIMIT 1`
  ).get(portfolioId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    year: row.year as number,
    totalValueGoldKg: row.total_value_gold_kg as number,
    cashGoldKg: (row.cash_gold_kg as number) ?? 0,
    holdings: JSON.parse(row.holdings_json as string) as Record<string, number>,
    costBasis: JSON.parse((row.cost_basis_json as string) || "{}") as Record<string, number>,
    realizedPnlGoldKg: (row.realized_pnl_gold_kg as number) ?? 0,
  };
}

export function deletePortfolio(portfolioId: string) {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM portfolio_snapshots WHERE portfolio_id = ?`).run(portfolioId);
    db.prepare(`DELETE FROM portfolios WHERE id = ?`).run(portfolioId);
  });
  tx();
}

// ── Interpolation utility ──

export function interpolatePrice(
  history: { year: number; price: number }[],
  targetYear: number
): number {
  if (history.length === 0) return 0;
  if (targetYear <= history[0].year) return history[0].price;
  if (targetYear >= history[history.length - 1].year)
    return history[history.length - 1].price;
  for (let i = 0; i < history.length - 1; i++) {
    if (targetYear >= history[i].year && targetYear <= history[i + 1].year) {
      const t =
        (targetYear - history[i].year) /
        (history[i + 1].year - history[i].year);
      return history[i].price + t * (history[i + 1].price - history[i].price);
    }
  }
  return history[history.length - 1].price;
}

export function interpolateSeries(
  series: { year: number;[key: string]: number }[],
  targetYear: number,
  key: string
): number {
  if (series.length === 0) return 0;
  const sorted = [...series].sort((a, b) => a.year - b.year);
  if (targetYear <= sorted[0].year) return sorted[0][key] ?? 0;
  if (targetYear >= sorted[sorted.length - 1].year)
    return sorted[sorted.length - 1][key] ?? 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (targetYear >= sorted[i].year && targetYear <= sorted[i + 1].year) {
      const t = (targetYear - sorted[i].year) / (sorted[i + 1].year - sorted[i].year);
      const v0 = sorted[i][key] ?? 0;
      const v1 = sorted[i + 1][key] ?? 0;
      return v0 + t * (v1 - v0);
    }
  }
  return sorted[sorted.length - 1][key] ?? 0;
}

// ── Portfolio migration across eras ──

export function migratePortfoliosToEra(
  newEraId: string,
  newStartYear: number,
  priceMap: Map<string, number>
): number {
  const db = getDb();
  const existing = db.prepare(
    `SELECT * FROM portfolios WHERE era_id = ?`
  ).all(newEraId) as Record<string, unknown>[];
  if (existing.length > 0) return 0;

  const allPortfolios = db.prepare(
    `SELECT * FROM portfolios WHERE era_id != ? ORDER BY created_at DESC`
  ).all(newEraId) as Record<string, unknown>[];
  if (allPortfolios.length === 0) return 0;

  const seen = new Set<string>();
  let count = 0;

  const tx = db.transaction(() => {
    for (const row of allPortfolios) {
      const name = row.name as string;
      if (seen.has(name)) continue;
      seen.add(name);

      const oldId = row.id as string;
      const snap = db.prepare(
        `SELECT * FROM portfolio_snapshots WHERE portfolio_id = ? ORDER BY year DESC LIMIT 1`
      ).get(oldId) as Record<string, unknown> | undefined;

      const holdings: Record<string, number> = snap
        ? JSON.parse(snap.holdings_json as string)
        : {};
      const cashGoldKg = snap
        ? (snap.cash_gold_kg as number) ?? 0
        : (row.initial_gold_kg as number);
      const costBasis: Record<string, number> = snap
        ? JSON.parse((snap.cost_basis_json as string) || "{}")
        : {};
      const realizedPnl = snap
        ? (snap.realized_pnl_gold_kg as number) ?? 0
        : 0;

      let totalValue = cashGoldKg;
      for (const [assetId, qty] of Object.entries(holdings)) {
        if (qty <= 0) continue;
        const priceGrams = priceMap.get(assetId) ?? 0;
        totalValue += qty * (priceGrams / 1000);
      }

      const newId = `${oldId}-${newEraId}`;
      const allocations = JSON.parse(row.allocations_json as string);

      db.prepare(`
        INSERT OR IGNORE INTO portfolios (id, name, era_id, start_year, initial_gold_kg, allocations_json)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(newId, name, newEraId, newStartYear, totalValue, JSON.stringify(allocations));

      db.prepare(`
        INSERT OR IGNORE INTO portfolio_snapshots (id, portfolio_id, year, total_value_gold_kg, holdings_json, cash_gold_kg, cost_basis_json, realized_pnl_gold_kg)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        newId, newStartYear, totalValue, JSON.stringify(holdings), cashGoldKg,
        JSON.stringify(costBasis), realizedPnl
      );

      count++;
    }
  });
  tx();
  return count;
}

// ── Clear all economic data for an era ──

export function clearEconomicData(eraId: string | null) {
  const db = getDb();
  const era = eraId ?? getCurrentEraId();
  if (!era) return;
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM economic_history WHERE era_id = ?`).run(era);
    db.prepare(`DELETE FROM asset_prices WHERE era_id = ?`).run(era);
    db.prepare(`DELETE FROM exchange_rates WHERE era_id = ?`).run(era);
    db.prepare(`DELETE FROM portfolio_snapshots WHERE portfolio_id IN (SELECT id FROM portfolios WHERE era_id = ?)`).run(era);
    db.prepare(`DELETE FROM portfolios WHERE era_id = ?`).run(era);
  });
  tx();
}
