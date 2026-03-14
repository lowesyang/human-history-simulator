import { NextRequest, NextResponse } from "next/server";
import {
  getEconomicHistory,
  getEconomicRankings,
  getGlobalEconomicTrend,
  getAllRegionSnapshots,
  getPopulationTrend,
} from "@/lib/economic-history";
import { getCurrentEraId, getFrontier } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get("regionId") ?? undefined;
    const metric = searchParams.get("metric") ?? "gdp_gold_kg";
    const ranking = searchParams.get("ranking") === "true";
    const global = searchParams.get("global") === "true";
    const populationTrend = searchParams.get("populationTrend") === "true";

    const eraId = getCurrentEraId();

    // 1. ranking=true: top-20 ranking at latest year
    if (ranking) {
      const { year } = getFrontier();
      const rankings = getEconomicRankings(year, eraId, metric, 20);
      return NextResponse.json({ year, rankings });
    }

    // 2. global=true: aggregated global trend
    if (global) {
      const series = getGlobalEconomicTrend(eraId, metric);
      return NextResponse.json({ series });
    }

    // 3. populationTrend=true&regionId=xxx: 10-year population trend
    if (populationTrend && regionId) {
      const { year } = getFrontier();
      const trend = getPopulationTrend(regionId, year, 10, eraId);
      return NextResponse.json({ regionId, populationTrend: trend });
    }

    // 4. regionId provided: single region time series
    if (regionId) {
      const series = getEconomicHistory(regionId, eraId);
      return NextResponse.json({ regionId, series });
    }

    // 5. else: all region snapshots
    const snapshots = getAllRegionSnapshots(eraId);
    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("Economic history API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch economic history" },
      { status: 500 }
    );
  }
}
