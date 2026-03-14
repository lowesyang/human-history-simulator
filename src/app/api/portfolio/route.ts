import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getLatestSnapshot, getCurrentEraId } from "@/lib/db";
import {
  insertPortfolio,
  getPortfolio,
  listPortfolios,
  insertPortfolioSnapshot,
  updatePortfolioAllocations,
  getLatestAssetPrices,
  getAllAssetPrices,
  getLatestPortfolioSnapshot,
  interpolatePrice,
  deletePortfolio,
} from "@/lib/economic-history";
import assetCatalog from "@/data/economic/asset-catalog.json";
import assetPricesData from "@/data/economic/asset-prices.json";
import type { PortfolioAllocation } from "@/lib/types";

interface SeedAsset {
  id: string;
  availableFrom: number;
  availableTo: number;
  baseVolatility: number;
  priceHistory: { year: number; price: number }[];
}
const seedAssets = (assetPricesData as { assets: SeedAsset[] }).assets;

const ASSET_ID_ALIASES: Record<string, string> = {
  farmland: "land_hectare",
};

function resolvePriceAssetId(catalogId: string): string {
  return ASSET_ID_ALIASES[catalogId] ?? catalogId;
}

function isAssetAvailableAtYear(assetId: string, year: number): boolean {
  const asset = assetCatalog.assets.find((a) => a.id === assetId);
  if (!asset) return false;
  const from = (asset as { availableFrom?: number }).availableFrom ?? -2000;
  const to = (asset as { availableTo?: number }).availableTo ?? 2023;
  return year >= from && year <= to;
}

function buildPriceMap(currentYear: number): Map<string, number> {
  const pricesLatest = getLatestAssetPrices();
  const pricesByYear = getAllAssetPrices(currentYear);
  const priceMap = new Map<string, number>();
  for (const p of pricesByYear.length > 0 ? pricesByYear : pricesLatest) {
    priceMap.set(p.assetId, p.priceGoldGrams);
  }
  for (const a of seedAssets) {
    if (!priceMap.has(a.id) && currentYear >= a.availableFrom && currentYear <= a.availableTo) {
      priceMap.set(a.id, interpolatePrice(a.priceHistory, currentYear));
    }
  }
  priceMap.set("gold", 1);
  return priceMap;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const list = searchParams.get("list") === "true";

    if (list) {
      const currentEra = listPortfolios();
      if (currentEra.length > 0) {
        return NextResponse.json(currentEra);
      }
      const all = listPortfolios(undefined, true);
      return NextResponse.json(all);
    }

    if (!id) {
      return NextResponse.json(
        { error: "Missing id or list=true" },
        { status: 400 }
      );
    }

    const portfolio = getPortfolio(id);
    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error("Portfolio GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Trade action: buy/sell by quantity ──
    if (body.action === "trade") {
      const { portfolioId, assetId, side, quantity } = body;
      if (!portfolioId || !assetId || !side || !quantity) {
        return NextResponse.json(
          { error: "portfolioId, assetId, side (buy|sell), and quantity required" },
          { status: 400 }
        );
      }
      if (side !== "buy" && side !== "sell") {
        return NextResponse.json({ error: "side must be 'buy' or 'sell'" }, { status: 400 });
      }
      const qty = Number(quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        return NextResponse.json({ error: "quantity must be a positive number" }, { status: 400 });
      }

      const portfolio = getPortfolio(portfolioId);
      if (!portfolio) {
        return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
      }

      const latestSimSnapshot = getLatestSnapshot();
      if (!latestSimSnapshot) {
        return NextResponse.json({ error: "No simulation state available" }, { status: 400 });
      }
      const currentYear = latestSimSnapshot.year;

      if (!isAssetAvailableAtYear(assetId, currentYear)) {
        return NextResponse.json(
          { error: `Asset ${assetId} not available in year ${currentYear}` },
          { status: 400 }
        );
      }

      const priceMap = buildPriceMap(currentYear);
      const priceAssetId = resolvePriceAssetId(assetId);
      let priceGoldGrams = priceMap.get(priceAssetId) ?? priceMap.get(assetId);
      if (priceGoldGrams == null || priceGoldGrams <= 0) {
        priceGoldGrams = 0.0001;
      }

      const latestPortSnap = getLatestPortfolioSnapshot(portfolioId);
      const holdings = latestPortSnap?.holdings ? { ...latestPortSnap.holdings } : {};
      let cashGoldKg = latestPortSnap?.cashGoldKg ?? portfolio.initialGoldKg;
      const costBasis: Record<string, number> = latestPortSnap?.costBasis ? { ...latestPortSnap.costBasis } : {};
      let realizedPnl = latestPortSnap?.realizedPnlGoldKg ?? 0;

      const costPerUnitGoldKg = priceGoldGrams / 1000;

      if (side === "buy") {
        const totalCost = qty * costPerUnitGoldKg;
        if (totalCost > cashGoldKg + 0.0001) {
          return NextResponse.json(
            { error: `Insufficient cash: need ${totalCost.toFixed(4)} kg, have ${cashGoldKg.toFixed(4)} kg` },
            { status: 400 }
          );
        }
        cashGoldKg -= totalCost;
        holdings[assetId] = (holdings[assetId] ?? 0) + qty;
        costBasis[assetId] = (costBasis[assetId] ?? 0) + totalCost;
      } else {
        const currentQty = holdings[assetId] ?? 0;
        if (qty > currentQty + 0.0001) {
          return NextResponse.json(
            { error: `Insufficient holdings: have ${currentQty.toFixed(4)}, trying to sell ${qty}` },
            { status: 400 }
          );
        }
        const proceeds = qty * costPerUnitGoldKg;
        cashGoldKg += proceeds;

        const avgCostPerUnit = currentQty > 0 ? (costBasis[assetId] ?? 0) / currentQty : 0;
        const costOfSold = qty * avgCostPerUnit;
        realizedPnl += proceeds - costOfSold;
        costBasis[assetId] = Math.max(0, (costBasis[assetId] ?? 0) - costOfSold);

        holdings[assetId] = currentQty - qty;
        if (holdings[assetId] < 0.0001) {
          delete holdings[assetId];
          delete costBasis[assetId];
        }
      }

      let totalValueGoldKg = cashGoldKg;
      for (const [hAssetId, hQty] of Object.entries(holdings)) {
        const hPriceAssetId = resolvePriceAssetId(hAssetId);
        const hPrice = priceMap.get(hPriceAssetId) ?? priceMap.get(hAssetId) ?? 0;
        totalValueGoldKg += (hQty * hPrice) / 1000;
      }

      insertPortfolioSnapshot(portfolioId, currentYear, totalValueGoldKg, holdings, cashGoldKg, costBasis, realizedPnl);

      const updatedAllocations: PortfolioAllocation[] = Object.entries(holdings).map(([aid, q]) => {
        const hPriceAssetId = resolvePriceAssetId(aid);
        const hPrice = priceMap.get(hPriceAssetId) ?? priceMap.get(aid) ?? 0;
        const val = (q * hPrice) / 1000;
        const pct = totalValueGoldKg > 0 ? (val / totalValueGoldKg) * 100 : 0;
        const avgCost = q > 0 ? ((costBasis[aid] ?? 0) / q) * 1000 : hPrice;
        return { assetId: aid, percentage: pct, entryPrice: avgCost };
      });
      updatePortfolioAllocations(portfolioId, updatedAllocations);

      const updated = getPortfolio(portfolioId);
      return NextResponse.json(updated);
    }

    // ── Liquidate: sell all holdings → cash ──
    if (body.action === "liquidate") {
      const { portfolioId } = body;
      if (!portfolioId) {
        return NextResponse.json({ error: "portfolioId required" }, { status: 400 });
      }
      const portfolio = getPortfolio(portfolioId);
      if (!portfolio) {
        return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
      }

      const latestSimSnapshot = getLatestSnapshot();
      const currentYear = latestSimSnapshot?.year ?? 0;
      const priceMap = buildPriceMap(currentYear);
      const latestPortSnap = getLatestPortfolioSnapshot(portfolioId);
      const holdings = latestPortSnap?.holdings ?? {};
      const costBasis = latestPortSnap?.costBasis ?? {};
      let cashGoldKg = latestPortSnap?.cashGoldKg ?? portfolio.initialGoldKg;
      let realizedPnl = latestPortSnap?.realizedPnlGoldKg ?? 0;

      for (const [assetId, qty] of Object.entries(holdings)) {
        if (qty <= 0) continue;
        const priceAssetId = resolvePriceAssetId(assetId);
        const price = priceMap.get(priceAssetId) ?? priceMap.get(assetId) ?? 0;
        const proceeds = (qty * price) / 1000;
        const cost = costBasis[assetId] ?? 0;
        realizedPnl += proceeds - cost;
        cashGoldKg += proceeds;
      }

      insertPortfolioSnapshot(portfolioId, currentYear, cashGoldKg, {}, cashGoldKg, {}, realizedPnl);
      updatePortfolioAllocations(portfolioId, []);

      const updated = getPortfolio(portfolioId);
      return NextResponse.json(updated);
    }

    // ── Delete portfolio ──
    if (body.action === "delete") {
      const { portfolioId } = body;
      if (!portfolioId) {
        return NextResponse.json({ error: "portfolioId required" }, { status: 400 });
      }
      const portfolio = getPortfolio(portfolioId);
      if (!portfolio) {
        return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
      }
      deletePortfolio(portfolioId);
      return NextResponse.json({ success: true, deletedId: portfolioId });
    }

    // ── Rebalance flow (legacy) ──
    if (body.rebalance === true) {
      const { portfolioId, newAllocations } = body;
      if (!portfolioId || !Array.isArray(newAllocations)) {
        return NextResponse.json(
          { error: "portfolioId and newAllocations required when rebalance=true" },
          { status: 400 }
        );
      }

      const portfolio = getPortfolio(portfolioId);
      if (!portfolio) {
        return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
      }

      const totalPct = newAllocations.reduce((sum: number, a: { percentage?: number }) => sum + (a.percentage ?? 0), 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        return NextResponse.json(
          { error: "Allocations must sum to 100%" },
          { status: 400 }
        );
      }

      const latestSnapshot = getLatestSnapshot();
      if (!latestSnapshot) {
        return NextResponse.json({ error: "No simulation state available" }, { status: 400 });
      }
      const currentYear = latestSnapshot.year;

      for (const a of newAllocations) {
        const aid = a.assetId ?? a.asset_id;
        if (!aid || !isAssetAvailableAtYear(aid, currentYear)) {
          return NextResponse.json(
            { error: `Asset ${aid} not available in year ${currentYear}` },
            { status: 400 }
          );
        }
      }

      const priceMap = buildPriceMap(currentYear);

      const allocationsWithPrice: PortfolioAllocation[] = [];
      const holdings: Record<string, number> = {};
      const totalValueGoldKg = portfolio.snapshots?.length
        ? (portfolio.snapshots[portfolio.snapshots.length - 1] as { totalValueGoldKg: number }).totalValueGoldKg
        : portfolio.initialGoldKg;

      for (const a of newAllocations) {
        const assetId = a.assetId ?? a.asset_id;
        const percentage = a.percentage ?? 0;
        const priceAssetId = resolvePriceAssetId(assetId);
        let priceGoldGrams = priceMap.get(priceAssetId) ?? priceMap.get(assetId);
        if (priceGoldGrams == null) {
          return NextResponse.json(
            { error: `No price data for asset ${assetId}` },
            { status: 400 }
          );
        }
        if (priceGoldGrams <= 0) priceGoldGrams = 0.0001;
        const valueGoldKg = totalValueGoldKg * (percentage / 100);
        const quantity = (valueGoldKg * 1000) / priceGoldGrams;
        holdings[assetId] = quantity;
        allocationsWithPrice.push({ assetId, percentage, entryPrice: priceGoldGrams });
      }

      updatePortfolioAllocations(portfolioId, allocationsWithPrice);
      insertPortfolioSnapshot(portfolioId, currentYear, totalValueGoldKg, holdings, 0);

      const updated = getPortfolio(portfolioId);
      return NextResponse.json(updated);
    }

    // ── Create portfolio flow ──
    const { name, initialGoldKg, allocations } = body;
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    const goldKg = Number(initialGoldKg);
    if (!Number.isFinite(goldKg) || goldKg <= 0) {
      return NextResponse.json(
        { error: "initialGoldKg must be a positive number" },
        { status: 400 }
      );
    }

    const latestSnapshot = getLatestSnapshot();
    if (!latestSnapshot) {
      return NextResponse.json(
        { error: "No simulation state available" },
        { status: 400 }
      );
    }
    const currentYear = latestSnapshot.year;

    // If no allocations provided, create cash-only portfolio
    if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
      const id = uuidv4();
      const eraId = getCurrentEraId();
      insertPortfolio(id, name, eraId, currentYear, goldKg, []);
      insertPortfolioSnapshot(id, currentYear, goldKg, {}, goldKg);
      const portfolio = getPortfolio(id);
      return NextResponse.json(portfolio);
    }

    const totalPct = allocations.reduce((sum: number, a: { percentage?: number }) => sum + (a.percentage ?? 0), 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      return NextResponse.json(
        { error: "Allocations must sum to 100%" },
        { status: 400 }
      );
    }

    for (const a of allocations) {
      const aid = a.assetId ?? a.asset_id;
      if (!aid || !isAssetAvailableAtYear(aid, currentYear)) {
        return NextResponse.json(
          { error: `Asset ${aid} not available in year ${currentYear}` },
          { status: 400 }
        );
      }
    }

    const priceMap = buildPriceMap(currentYear);

    const allocationsWithPrice: PortfolioAllocation[] = [];
    const holdings: Record<string, number> = {};
    const costBasis: Record<string, number> = {};

    for (const a of allocations) {
      const assetId = a.assetId ?? a.asset_id;
      const percentage = a.percentage ?? 0;
      const priceAssetId = resolvePriceAssetId(assetId);
      let priceGoldGrams = priceMap.get(priceAssetId) ?? priceMap.get(assetId);
      if (priceGoldGrams == null) {
        return NextResponse.json(
          { error: `No price data for asset ${assetId}` },
          { status: 400 }
        );
      }
      if (priceGoldGrams <= 0) priceGoldGrams = 0.0001;
      const valueGoldKg = goldKg * (percentage / 100);
      const quantity = (valueGoldKg * 1000) / priceGoldGrams;
      holdings[assetId] = quantity;
      costBasis[assetId] = valueGoldKg;
      allocationsWithPrice.push({ assetId, percentage, entryPrice: priceGoldGrams });
    }

    const id = uuidv4();
    const eraId = getCurrentEraId();
    insertPortfolio(id, name, eraId, currentYear, goldKg, allocationsWithPrice);
    insertPortfolioSnapshot(id, currentYear, goldKg, holdings, 0, costBasis, 0);

    const portfolio = getPortfolio(id);
    return NextResponse.json(portfolio);
  } catch (error) {
    console.error("Portfolio POST error:", error);
    return NextResponse.json(
      { error: "Failed to create or update portfolio" },
      { status: 500 }
    );
  }
}
