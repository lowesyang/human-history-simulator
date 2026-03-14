"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import MillennialKLineChart from "@/components/charts/MillennialKLineChart";
import GDPRaceChart from "@/components/charts/GDPRaceChart";
import GiniPrism from "@/components/charts/GiniPrism";
import GiniRaceChart from "@/components/charts/GiniRaceChart";
import PortfolioPanel from "@/components/PortfolioPanel";
import exchangeRates from "@/data/economic/exchange-rates.json";
import gdpAnnualBenchmarks from "@/data/economic/gdp-annual-benchmarks.json";
import giniBenchmarksRaw from "@/data/economic/gini-benchmarks.json";

const giniBenchmarkData: Record<string, { year: number; gini: number }[]> = {};
for (const [k, v] of Object.entries(giniBenchmarksRaw)) {
  if (k.startsWith("_")) continue;
  giniBenchmarkData[k] = v as { year: number; gini: number }[];
}

const ACCENT_GOLD = "#D4A853";
const REGION_COLORS = [
  "#D4A853", "#cd7f32", "#3b82f6", "#22c55e", "#a855f7",
  "#ef4444", "#06b6d4", "#f59e0b", "#ec4899", "#8b5cf6",
];

/* ── Denomination conversion using historical exchange rates ── */

function interpolateTimeSeries(series: { year: number; value: number }[], year: number): number {
  if (series.length === 0) return 1;
  if (year <= series[0].year) return series[0].value;
  if (year >= series[series.length - 1].year) return series[series.length - 1].value;
  for (let i = 0; i < series.length - 1; i++) {
    if (year >= series[i].year && year <= series[i + 1].year) {
      const t = (year - series[i].year) / (series[i + 1].year - series[i].year);
      return series[i].value + t * (series[i + 1].value - series[i].value);
    }
  }
  return series[series.length - 1].value;
}

function getGoldSilverRatio(year: number): number {
  return interpolateTimeSeries(
    exchangeRates.goldSilverRatio.map((r) => ({ year: r.year, value: r.ratio })),
    year
  );
}

function getUsdPerKgGold(year: number): number {
  const perOz = interpolateTimeSeries(
    exchangeRates.modernUsdGoldPrice.map((r) => ({ year: r.year, value: r.usdPerOzGold })),
    year
  );
  return perOz * 32.1507; // 1 kg ≈ 32.15 troy oz
}

/** Convert a value from gold kg to the target denomination at the given year */
function convertFromGoldKg(goldKg: number, denom: "gold" | "silver" | "usd", year: number): number {
  switch (denom) {
    case "gold": return goldKg;
    case "silver": return goldKg * getGoldSilverRatio(year);
    case "usd": return goldKg * getUsdPerKgGold(year);
    default: return goldKg;
  }
}

/** Convert current USD to gold kg for a given year */
function convertUsdToGoldKg(usdValue: number, year: number): number {
  const usdPerKg = getUsdPerKgGold(year);
  return usdPerKg > 0 ? usdValue / usdPerKg : 0;
}

const gdpBenchmarkData: Record<string, { year: number; gdpGoldKg: number }[]> = {};
for (const [regionId, entries] of Object.entries(gdpAnnualBenchmarks)) {
  if (regionId.startsWith("_")) continue;
  gdpBenchmarkData[regionId] = (entries as { year: number; gdpBillionUsd: number }[]).map((e) => ({
    year: e.year,
    gdpGoldKg: convertUsdToGoldKg(e.gdpBillionUsd * 1_000_000_000, e.year),
  }));
}

function denomUnit(denom: "gold" | "silver" | "usd", loc: string): string {
  switch (denom) {
    case "gold": return loc === "zh" ? "kg 黄金" : "kg gold";
    case "silver": return loc === "zh" ? "kg 白银" : "kg silver";
    case "usd": return "USD";
    default: return "";
  }
}
const TABS = ["gdptrend", "inequality", "portfolio"] as const;
const TAB_ICONS: Record<string, string> = {
  gdptrend: "📊",
  inequality: "⚖️",
  portfolio: "💼",
};
const DENOMINATIONS = ["gold", "silver", "usd"] as const;

/** Pick the default denomination based on the simulation year */
function getEraDefaultDenomination(year: number): "gold" | "silver" | "usd" {
  if (year >= 1792) return "usd";
  return "gold";
}

export default function EconomicPanel() {
  const showEconomicPanel = useWorldStore((s) => s.showEconomicPanel);
  const setShowEconomicPanel = useWorldStore((s) => s.setShowEconomicPanel);
  const economicPanelView = useWorldStore((s) => s.economicPanelView);
  const setEconomicPanelView = useWorldStore((s) => s.setEconomicPanelView);
  const setSelectedRegionId = useWorldStore((s) => s.setSelectedRegionId);
  const setEconomicHistory = useWorldStore((s) => s.setEconomicHistory);
  const setAssetPrices = useWorldStore((s) => s.setAssetPrices);
  const setExchangeRates = useWorldStore((s) => s.setExchangeRates);
  const currentState = useWorldStore((s) => s.currentState);
  const currentEraId = useWorldStore((s) => s.currentEraId);
  const viewingTime = useWorldStore((s) => s.viewingTime);
  const locale = useWorldStore((s) => s.locale);
  const economicHistory = useWorldStore((s) => s.economicHistory);

  const { t, localized } = useLocale();

  const mode = economicPanelView.mode ?? "gdptrend";
  const denomination = (economicPanelView.denomination ?? "gold") as "gold" | "silver" | "usd";

  const [, setGlobalSeries] = useState<{ year: number; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gdpTrendRegionIds, setGdpTrendRegionIds] = useState<string[] | null>(null);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const fetchData = useCallback(async () => {
    if (!showEconomicPanel) return;
    setIsLoading(true);
    try {
      const [globalResp, assetResp, , snapshotsResp] = await Promise.all([
        fetch("/api/economic-history?global=true"),
        fetch("/api/asset-prices?latest=true&exchangeRates=true"),
        fetch("/api/economic-history?ranking=true"),
        fetch("/api/economic-history"),
      ]);

      if (globalResp.ok) {
        const g = await globalResp.json();
        setGlobalSeries(g.series ?? []);
      }
      if (assetResp.ok) {
        const a = await assetResp.json();
        const pricesByAsset: Record<string, { assetId: string; year: number; priceGoldGrams: number; priceSilverGrams: number; volatility: number }[]> = {};
        for (const p of a.prices ?? []) {
          if (!pricesByAsset[p.assetId]) pricesByAsset[p.assetId] = [];
          pricesByAsset[p.assetId].push(p);
        }
        setAssetPrices(pricesByAsset);
        if (a.exchangeRates) setExchangeRates(a.exchangeRates);
      }
      if (snapshotsResp.ok) {
        const s = await snapshotsResp.json();
        setEconomicHistory(s.snapshots ?? {});
      }
    } catch (err) {
      console.error("Economic panel fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [showEconomicPanel, setAssetPrices, setExchangeRates, setEconomicHistory, viewingTime.year]);

  useEffect(() => {
    fetchData();
  }, [fetchData, currentEraId]);

  // Auto-set denomination to the era's core currency when era changes
  useEffect(() => {
    const defaultDenom = getEraDefaultDenomination(viewingTime.year);
    setEconomicPanelView({ denomination: defaultDenom });
    setGdpTrendRegionIds(null);
  }, [currentEraId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    setShowEconomicPanel(false);
  }, [setShowEconomicPanel]);

  const handleRegionClick = useCallback(
    (regionId: string) => {
      setSelectedRegionId(regionId);
    },
    [setSelectedRegionId]
  );

  const handleTabChange = useCallback(
    (mode: "gdptrend" | "inequality" | "portfolio") => {
      setEconomicPanelView({ mode });
      setShowRegionPicker(false);
    },
    [setEconomicPanelView]
  );

  const handleDenominationChange = useCallback(
    (d: "gold" | "silver" | "usd") => {
      setEconomicPanelView({ denomination: d });
    },
    [setEconomicPanelView]
  );

  // Top 10 regions by GDP for GDP trend default selection
  const top10RegionIds = useMemo(() => {
    const regions = currentState?.regions ?? [];
    return regions
      .map((r) => ({ id: r.id, gdp: r.economy?.gdpEstimate?.goldKg ?? 0 }))
      .filter((r) => r.gdp > 0)
      .sort((a, b) => b.gdp - a.gdp)
      .slice(0, 10)
      .map((r) => r.id);
  }, [currentState?.regions]);

  const activeGdpTrendIds = gdpTrendRegionIds ?? top10RegionIds;

  const gdpTrendSeries = useMemo(() => {
    const currentYear = viewingTime.year;
    const startYear = currentYear - 5;
    const regions = currentState?.regions ?? [];

    const result: { id: string; name: string; color: string; data: { year: number; value: number }[] }[] = [];

    for (let i = 0; i < activeGdpTrendIds.length; i++) {
      const regionId = activeGdpTrendIds[i];
      const region = regions.find((r) => r.id === regionId);
      const name = region ? localized(region.name) : regionId;
      const color = REGION_COLORS[i % REGION_COLORS.length];

      const dbSnaps = economicHistory[regionId] ?? [];
      const dbMap = new Map<number, number>();
      for (const s of dbSnaps) {
        if (s.year >= startYear && s.year <= currentYear && s.gdpGoldKg > 0) {
          dbMap.set(s.year, s.gdpGoldKg);
        }
      }

      const benchSeries = gdpBenchmarkData[regionId];
      const benchMap = new Map<number, number>();
      if (benchSeries) {
        for (const b of benchSeries) {
          if (b.year >= startYear && b.year <= currentYear) {
            benchMap.set(b.year, b.gdpGoldKg);
          }
        }
      }

      const regionData: { year: number; value: number }[] = [];
      for (let y = startYear; y <= currentYear; y++) {
        const goldKg = dbMap.get(y) ?? benchMap.get(y);
        if (goldKg != null && goldKg > 0) {
          regionData.push({ year: y, value: convertFromGoldKg(goldKg, denomination, y) });
        }
      }

      if (regionData.length === 0 && region) {
        const goldKg = region.economy?.gdpEstimate?.goldKg ?? 0;
        if (goldKg > 0) {
          regionData.push({ year: currentYear, value: convertFromGoldKg(goldKg, denomination, currentYear) });
        }
      }

      if (regionData.length > 0) {
        result.push({ id: regionId, name, color, data: regionData });
      }
    }

    return result;
  }, [viewingTime.year, activeGdpTrendIds, economicHistory, currentState?.regions, localized, denomination]);

  const gdpRankings = useMemo(() => {
    const regions = currentState?.regions ?? [];
    const yr = viewingTime.year;

    return regions
      .map((r) => {
        const goldKg = r.economy?.gdpEstimate?.goldKg ?? 0;
        return {
          regionId: r.id,
          regionName: localized(r.name) || r.id,
          value: convertFromGoldKg(goldKg, denomination, yr),
          gdpGoldKg: goldKg,
        };
      })
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [currentState?.regions, localized, denomination, viewingTime.year]);

  const giniTrendSeries = useMemo(() => {
    const currentYear = viewingTime.year;
    const startYear = currentYear - 20;
    const regions = currentState?.regions ?? [];

    const result: { id: string; name: string; color: string; data: { year: number; gini: number }[] }[] = [];

    for (let i = 0; i < top10RegionIds.length; i++) {
      const regionId = top10RegionIds[i];
      const region = regions.find((r) => r.id === regionId);
      const name = region ? localized(region.name) : regionId;
      const color = REGION_COLORS[i % REGION_COLORS.length];

      const merged = new Map<number, number>();

      const benchSeries = giniBenchmarkData[regionId];
      if (benchSeries) {
        for (const p of benchSeries) {
          if (p.year >= startYear && p.year <= currentYear && p.gini > 0) {
            merged.set(p.year, p.gini);
          }
        }
      }

      const snaps = economicHistory[regionId] ?? [];
      for (const s of snaps) {
        if (s.year >= startYear && s.year <= currentYear && s.giniEstimate != null && s.giniEstimate > 0) {
          merged.set(s.year, s.giniEstimate);
        }
      }

      if (region && !merged.has(currentYear)) {
        const gini = region.economy?.giniEstimate ?? 0;
        if (gini > 0) merged.set(currentYear, gini);
      }

      if (merged.size > 0) {
        const regionData = [...merged.entries()]
          .sort(([a], [b]) => a - b)
          .map(([year, gini]) => ({ year, gini }));
        result.push({ id: regionId, name, color, data: regionData });
      }
    }

    return result;
  }, [viewingTime.year, top10RegionIds, economicHistory, currentState?.regions, localized]);

  const giniRankings = useMemo(() => {
    const regions = currentState?.regions ?? [];
    return regions
      .map((r) => ({
        regionId: r.id,
        regionName: localized(r.name) || r.id,
        value: r.economy?.giniEstimate ?? 0,
      }))
      .filter((r) => r.value > 0)
      .sort((a, b) => a.value - b.value);
  }, [currentState?.regions, localized]);

  return (
    <div
      className={`absolute top-0 bottom-0 left-0 w-[520px] z-40 glass-panel flex flex-col overflow-hidden border-r border-border-subtle transition-transform duration-300 ease-out ${showEconomicPanel ? "translate-x-0" : "-translate-x-full"
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-accent-gold">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
          <span className="text-sm font-semibold text-text-primary">
            {t("economic.panelTitle")}
          </span>
        </div>
        <button
          onClick={handleClose}
          className="icon-btn tooltip-wrap border border-border-subtle text-text-muted"
          style={{ width: 24, height: 24 }}
          data-tooltip={t("tooltip.close")}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 shrink-0 border-b border-border-subtle overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-2 py-1 rounded text-xs transition-all border flex items-center gap-1 whitespace-nowrap ${mode === tab
              ? "bg-accent-gold text-bg-primary border-accent-gold"
              : "bg-transparent text-text-secondary border-border-subtle hover:border-border-active"
              }`}
          >
            <span className="text-xs leading-none">{TAB_ICONS[tab]}</span>
            {t(`economic.tab.${tab}`)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center flex-1 text-text-muted text-xs">
            {t("loading")}
          </div>
        ) : (
          <>
            {mode === "gdptrend" && (
              <div className="flex-1 overflow-auto p-3">
                <TabIntro text={t("economic.intro.gdptrend")} />
                {/* Country chips */}
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  {activeGdpTrendIds.map((rid, i) => {
                    const region = (currentState?.regions ?? []).find((r) => r.id === rid);
                    return (
                      <span
                        key={rid}
                        className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-tertiary px-2 py-0.5 text-xs text-text-primary"
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full shrink-0"
                          style={{ background: REGION_COLORS[i % REGION_COLORS.length] }}
                        />
                        {region ? localized(region.name) : rid}
                        <button
                          onClick={() => {
                            const next = activeGdpTrendIds.filter((id) => id !== rid);
                            setGdpTrendRegionIds(next.length > 0 ? next : []);
                          }}
                          className="ml-0.5 text-text-muted hover:text-text-primary text-xs leading-none"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                  {activeGdpTrendIds.length < 5 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowRegionPicker(!showRegionPicker)}
                        className="inline-flex items-center gap-1 rounded-full border border-dashed border-border-subtle px-2 py-0.5 text-xs text-text-muted hover:text-text-primary hover:border-accent-gold/40 transition-colors"
                      >
                        + {locale === "zh" ? "添加" : "Add"}
                      </button>
                      {showRegionPicker && (
                        <div className="absolute top-full left-0 z-50 mt-1 max-h-[200px] w-[200px] overflow-y-auto rounded border border-border-subtle bg-bg-secondary shadow-lg">
                          {(currentState?.regions ?? [])
                            .filter((r) => !activeGdpTrendIds.includes(r.id))
                            .map((r) => (
                              <button
                                key={r.id}
                                onClick={() => {
                                  setGdpTrendRegionIds([...activeGdpTrendIds, r.id]);
                                  setShowRegionPicker(false);
                                }}
                                className="block w-full px-3 py-1.5 text-left text-xs text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                              >
                                {localized(r.name)}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {gdpTrendSeries.length > 0 ? (
                  <MillennialKLineChart
                    series={gdpTrendSeries}
                    width={488}
                    height={320}
                    denomination={denomination}
                    locale={locale}
                  />
                ) : (
                  <EmptyState
                    icon="📊"
                    title={t("economic.empty.gdptrend.title")}
                    desc={t("economic.empty.gdptrend.desc")}
                  />
                )}
                {/* GDP Ranking below trend chart */}
                {gdpRankings.length > 0 && (
                  <div className="mt-3">
                    <GDPRaceChart
                      rankings={gdpRankings}
                      currentYear={viewingTime.year}
                      denomLabel={denomUnit(denomination, locale)}
                      locale={locale}
                      width={488}
                      height={400}
                      topN={15}
                      onRegionClick={handleRegionClick}
                    />
                  </div>
                )}
              </div>
            )}
            {mode === "inequality" && (
              <div className="flex-1 overflow-auto min-h-0 p-3">
                <TabIntro text={t("economic.intro.inequality")} />
                {giniTrendSeries.length > 0 ? (
                  <>
                    <GiniPrism
                      series={giniTrendSeries}
                      locale={locale}
                      width={488}
                      height={300}
                    />
                    {giniRankings.length > 0 && (
                      <div className="mt-2">
                        <GiniRaceChart
                          rankings={giniRankings}
                          currentYear={viewingTime.year}
                          locale={locale}
                          width={488}
                          height={340}
                          topN={10}
                          onRegionClick={handleRegionClick}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState
                    icon="⚖️"
                    title={t("economic.empty.inequality.title")}
                    desc={t("economic.empty.inequality.desc")}
                  />
                )}
              </div>
            )}
            {mode === "portfolio" && (
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="px-3 pt-3">
                  <TabIntro text={t("economic.intro.portfolio")} />
                </div>
                <PortfolioPanel />
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom controls - denomination selector */}
      {mode !== "portfolio" && (
        <div className="shrink-0 px-3 py-2 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted shrink-0">
              {locale === "zh" ? "计价" : "Unit"}
            </span>
            <div className="flex rounded overflow-hidden border border-border-subtle">
              {DENOMINATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => handleDenominationChange(d)}
                  className={`px-2.5 py-1 text-xs transition-colors ${denomination === d
                    ? "bg-accent-gold/20 text-accent-gold border-accent-gold/40"
                    : "bg-bg-tertiary/50 text-text-secondary hover:text-text-primary"
                    }`}
                >
                  {t(`economic.denomination.${d}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="text-3xl mb-3 opacity-50">{icon}</div>
      <h4 className="text-xs font-semibold text-text-primary mb-2">{title || "No Data"}</h4>
      <p className="text-xs text-text-muted max-w-[320px] leading-relaxed">{desc || "Run a simulation advance to generate data for this module."}</p>
    </div>
  );
}

function TabIntro({ text }: { text: string }) {
  return (
    <p className="text-xs text-text-muted leading-relaxed mb-3">
      {text}
    </p>
  );
}
