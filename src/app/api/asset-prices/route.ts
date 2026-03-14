import { NextRequest, NextResponse } from "next/server";
import {
  getAssetPriceHistory,
  getAllAssetPrices,
  getLatestAssetPrices,
  getExchangeRateHistory,
  interpolatePrice,
} from "@/lib/economic-history";
import { getCurrentEraId, getFrontier } from "@/lib/db";
import assetPricesData from "@/data/economic/asset-prices.json";

interface SeedAsset {
  id: string;
  availableFrom: number;
  availableTo: number;
  baseVolatility: number;
  priceHistory: { year: number; price: number }[];
}

const seedAssets = (assetPricesData as { assets: SeedAsset[] }).assets;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId") ?? undefined;
    const fromYearStr = searchParams.get("fromYear");
    const toYearStr = searchParams.get("toYear");
    const fromYear = fromYearStr ? parseInt(fromYearStr, 10) : undefined;
    const toYear = toYearStr ? parseInt(toYearStr, 10) : undefined;
    const all = searchParams.get("all") === "true";
    const latest = searchParams.get("latest") === "true";
    const exchangeRates = searchParams.get("exchangeRates") === "true";

    const eraId = getCurrentEraId();

    const response: Record<string, unknown> = {};

    // 1. latest=true: latest prices for all assets (DB + seed fallback)
    if (latest) {
      const { year: currentYear } = getFrontier();
      const dbPrices = getLatestAssetPrices(eraId);
      const dbIds = new Set(dbPrices.map((p) => p.assetId));

      const fallbackPrices = seedAssets
        .filter((a) => !dbIds.has(a.id) && currentYear >= a.availableFrom && currentYear <= a.availableTo)
        .map((a) => ({
          assetId: a.id,
          year: currentYear,
          priceGoldGrams: interpolatePrice(a.priceHistory, currentYear),
          priceSilverGrams: 0,
          volatility: a.baseVolatility,
        }));

      const allPrices = [...dbPrices, ...fallbackPrices];

      if (allPrices.length === 0) {
        const seedOnly = seedAssets
          .filter((a) => currentYear >= a.availableFrom && currentYear <= a.availableTo)
          .map((a) => ({
            assetId: a.id,
            year: currentYear,
            priceGoldGrams: interpolatePrice(a.priceHistory, currentYear),
            priceSilverGrams: 0,
            volatility: a.baseVolatility,
          }));
        response.prices = seedOnly;
      } else {
        response.prices = allPrices;
      }
      response.year = currentYear;
    }
    // 2. all=true: all assets at latest year (with seed fallback)
    else if (all) {
      const { year } = getFrontier();
      const dbPrices = getAllAssetPrices(year, eraId);
      const dbIds = new Set(dbPrices.map((p: { assetId: string }) => p.assetId));

      const fallbackPrices = seedAssets
        .filter((a) => !dbIds.has(a.id) && year >= a.availableFrom && year <= a.availableTo)
        .map((a) => ({
          assetId: a.id,
          year,
          priceGoldGrams: interpolatePrice(a.priceHistory, year),
          priceSilverGrams: 0,
          volatility: a.baseVolatility,
        }));

      response.year = year;
      response.prices = [...dbPrices, ...fallbackPrices];
    }
    // 3. assetId provided: single asset series
    else if (assetId) {
      const series = getAssetPriceHistory(assetId, eraId, fromYear, toYear);
      response.assetId = assetId;
      response.series = series;
    }

    // Optional: include exchange rates when requested
    if (exchangeRates) {
      response.exchangeRates = getExchangeRateHistory(eraId);
    }

    // If only exchangeRates was requested (no other data), return just that
    if (exchangeRates && Object.keys(response).length === 1) {
      return NextResponse.json(response);
    }

    // If no data params were provided but exchangeRates was, we already have it
    if (Object.keys(response).length === 0 && !exchangeRates) {
      return NextResponse.json(
        { error: "Provide assetId, all=true, latest=true, or exchangeRates=true" },
        { status: 400 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Asset prices API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset prices" },
      { status: 500 }
    );
  }
}
