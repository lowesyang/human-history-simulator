"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, MarkLineComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import assetCatalog from "@/data/economic/asset-catalog.json";
import exchangeRates from "@/data/economic/exchange-rates.json";
import type { LocalizedText } from "@/lib/types";

echarts.use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer]);

/* ── Types ── */

interface CatalogAsset {
  id: string;
  name: LocalizedText;
  ticker?: string;
  category: string;
  icon?: string;
  description?: LocalizedText;
  riskLevel?: number;
  availableFrom?: number;
  availableTo?: number;
  isBubble?: boolean;
}

interface PortfolioListItem {
  id: string;
  name: string;
  eraId: string;
  startYear: number;
  initialGoldKg: number;
  allocations: { assetId: string; percentage: number; entryPrice: number }[];
}

interface PortfolioSnap {
  year: number;
  totalValueGoldKg: number;
  cashGoldKg: number;
  holdings: Record<string, number>;
  costBasis?: Record<string, number>;
  realizedPnlGoldKg?: number;
}

interface Portfolio extends PortfolioListItem {
  snapshots: PortfolioSnap[];
}

/* ── Denomination system ── */

interface Denomination {
  id: string;
  labelZh: string;
  labelEn: string;
  unitZh: string;
  unitEn: string;
  icon: string;
  availableFrom: number;
  availableTo: number;
  rangeMin: number;
  rangeMax: number;
}

const DENOMINATIONS: Denomination[] = [
  { id: "usd", labelZh: "美元 ($)", labelEn: "USD ($)", unitZh: "美元", unitEn: "USD", icon: "💲", availableFrom: 1792, availableTo: 9999, rangeMin: 1000, rangeMax: 5e8 },
  { id: "gold_kg", labelZh: "黄金 (kg)", labelEn: "Gold (kg)", unitZh: "kg 黄金", unitEn: "kg gold", icon: "✦", availableFrom: -2000, availableTo: 9999, rangeMin: 10, rangeMax: 10000 },
  { id: "silver_kg", labelZh: "白银 (kg)", labelEn: "Silver (kg)", unitZh: "kg 白银", unitEn: "kg silver", icon: "◈", availableFrom: -2000, availableTo: 9999, rangeMin: 100, rangeMax: 150000 },
];

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
  return interpolateTimeSeries(exchangeRates.goldSilverRatio.map((r) => ({ year: r.year, value: r.ratio })), year);
}

function getUsdPerKgGold(year: number): number {
  const perOz = interpolateTimeSeries(exchangeRates.modernUsdGoldPrice.map((r) => ({ year: r.year, value: r.usdPerOzGold })), year);
  return perOz * 32.1507;
}

function denomToGoldKg(amount: number, denomId: string, year: number): number {
  switch (denomId) {
    case "gold_kg": return amount;
    case "silver_kg": return amount / getGoldSilverRatio(year);
    case "usd": return amount / getUsdPerKgGold(year);
    default: return amount;
  }
}

function goldKgToDenom(kg: number, denomId: string, year: number): number {
  switch (denomId) {
    case "gold_kg": return kg;
    case "silver_kg": return kg * getGoldSilverRatio(year);
    case "usd": return kg * getUsdPerKgGold(year);
    default: return kg;
  }
}

function goldGramsToDenom(grams: number, denomId: string, year: number): number {
  return goldKgToDenom(grams / 1000, denomId, year);
}

function getDisplayDenom(year: number): Denomination {
  if (year >= 1792) return DENOMINATIONS.find((d) => d.id === "usd")!;
  return DENOMINATIONS.find((d) => d.id === "gold_kg")!;
}

function denomSymbol(denomId: string): string {
  switch (denomId) {
    case "usd": return "$";
    case "silver_kg": return "Ag ";
    case "gold_kg":
    default: return "";
  }
}

function denomSuffix(denomId: string): string {
  switch (denomId) {
    case "usd": return "";
    case "silver_kg": return " kg";
    case "gold_kg":
    default: return " kg Au";
  }
}

function denomPriceSuffix(denomId: string): string {
  switch (denomId) {
    case "usd": return "";
    case "gold_kg":
    default: return " g Au";
  }
}

function logToValueDenom(pos: number, rangeMin: number, rangeMax: number): number {
  const logMin = Math.log10(Math.max(1, rangeMin));
  const logMax = Math.log10(Math.max(2, rangeMax));
  const logVal = logMin + (logMax - logMin) * (pos / 100);
  const raw = Math.pow(10, logVal);
  if (raw >= 1e6) return Math.round(raw / 10000) * 10000;
  if (raw >= 1e4) return Math.round(raw / 100) * 100;
  if (raw >= 100) return Math.round(raw / 10) * 10;
  return Math.round(raw);
}

function valueToLog(value: number, rangeMin: number, rangeMax: number): number {
  const logMin = Math.log10(Math.max(1, rangeMin));
  const logMax = Math.log10(Math.max(2, rangeMax));
  const logVal = Math.log10(Math.max(1, value));
  return Math.min(100, Math.max(0, Math.round(((logVal - logMin) / (logMax - logMin)) * 100)));
}

/* ── Helpers ── */

const ASSET_ID_ALIASES: Record<string, string> = { farmland: "land_hectare" };

function resolvePriceAssetId(id: string): string {
  return ASSET_ID_ALIASES[id] ?? id;
}

function isAvailableAtYear(asset: CatalogAsset, year: number): boolean {
  return year >= (asset.availableFrom ?? -2000) && year <= (asset.availableTo ?? 2023);
}

function fmt(v: number): string {
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  if (Math.abs(v) >= 1) return v.toFixed(2);
  if (Math.abs(v) >= 0.001) return v.toFixed(4);
  return v.toFixed(6);
}

function fmtCompact(v: number): string {
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(2);
}

function fmtPrice(v: number): string {
  if (v >= 100) return v.toFixed(1);
  if (v >= 1) return v.toFixed(3);
  if (v >= 0.01) return v.toFixed(4);
  if (v >= 0.0001) return v.toFixed(5);
  return v.toExponential(2);
}

const CATEGORY_ORDER = [
  "precious_metal", "commodity", "industrial_metal", "grain", "luxury",
  "energy", "real_estate", "real_asset",
  "equity", "equity_index", "etf", "private_equity", "fund_lp",
  "bond", "futures", "forex", "crypto", "derivative", "grey_market",
  "financial", "labor",
];

const ALL_ASSETS = (assetCatalog as { assets: CatalogAsset[] }).assets;

/* ── Component ── */

export default function PortfolioPanel() {
  const viewingTime = useWorldStore((s) => s.viewingTime);
  const currentEraId = useWorldStore((s) => s.currentEraId);
  const locale = useWorldStore((s) => s.locale);
  const { t, localized } = useLocale();
  const simYear = viewingTime.year;

  const [portfolios, setPortfolios] = useState<PortfolioListItem[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [assetPrices, setAssetPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradeStatus, setTradeStatus] = useState<string | null>(null);
  const [isTrading, setIsTrading] = useState(false);

  // Inline create-fund form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fundName, setFundName] = useState("");
  const defaultDenom = useMemo(() => simYear >= 1792 ? "usd" : "gold_kg", [simYear]);
  const [wizardDenom, setWizardDenom] = useState(defaultDenom);
  const activeDenom = useMemo(() => DENOMINATIONS.find((d) => d.id === wizardDenom) ?? DENOMINATIONS[0], [wizardDenom]);
  const availableDenoms = useMemo(() => DENOMINATIONS.filter((d) => simYear >= d.availableFrom && simYear <= d.availableTo), [simYear]);
  const defaultCapital = useMemo(() => {
    const d = DENOMINATIONS.find((dd) => dd.id === defaultDenom) ?? DENOMINATIONS[0];
    return Math.round((d.rangeMin + d.rangeMax) / 20);
  }, [defaultDenom]);
  const [capitalDenom, setCapitalDenom] = useState(defaultCapital);
  const capitalGoldKg = useMemo(() => denomToGoldKg(capitalDenom, wizardDenom, simYear), [capitalDenom, wizardDenom, simYear]);
  const [isCreating, setIsCreating] = useState(false);

  // Fund management
  const [showFundMenu, setShowFundMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"liquidate" | "delete" | null>(null);
  const fundMenuRef = useRef<HTMLDivElement>(null);

  // Market tab
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [buyQty, setBuyQty] = useState<Record<string, string>>({});
  const [sellQty, setSellQty] = useState<Record<string, string>>({});
  const [holdingsOpen, setHoldingsOpen] = useState(true);

  // Category tab scroll fade
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabScrollFade, setTabScrollFade] = useState<{ left: boolean; right: boolean }>({ left: false, right: true });

  const updateTabScrollFade = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setTabScrollFade({
      left: scrollLeft > 4,
      right: scrollLeft + clientWidth < scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    updateTabScrollFade();
    el.addEventListener("scroll", updateTabScrollFade, { passive: true });
    const ro = new ResizeObserver(updateTabScrollFade);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateTabScrollFade); ro.disconnect(); };
  }, [updateTabScrollFade]);

  /* ── Data fetching ── */

  const fetchPortfolios = useCallback(async () => {
    try {
      const resp = await fetch("/api/portfolio?list=true");
      if (resp.ok) {
        const list = await resp.json();
        setPortfolios(list ?? []);
        if (list?.length > 0 && !selectedPortfolio) {
          const detailResp = await fetch(`/api/portfolio?id=${list[0].id}`);
          if (detailResp.ok) {
            setSelectedPortfolio(await detailResp.json());
          }
        } else if (!list?.length) {
          setSelectedPortfolio(null);
        }
      }
    } catch { /* no-op */ } finally {
      setIsLoading(false);
    }
  }, [selectedPortfolio]);

  const fetchAssetPrices = useCallback(async () => {
    try {
      const resp = await fetch("/api/asset-prices?latest=true");
      if (resp.ok) {
        const data = await resp.json();
        const map: Record<string, number> = { gold: 1 };
        for (const p of data.prices ?? []) map[p.assetId] = p.priceGoldGrams ?? 0;
        setAssetPrices(map);
      }
    } catch { /* no-op */ }
  }, []);

  const refreshPortfolio = useCallback(async (id: string) => {
    const resp = await fetch(`/api/portfolio?id=${id}`);
    if (resp.ok) {
      const p = await resp.json();
      setSelectedPortfolio(p);
      setPortfolios((prev) => {
        const exists = prev.find((x) => x.id === p.id);
        if (exists) return prev.map((x) => x.id === p.id ? p : x);
        return [p, ...prev];
      });
    }
  }, []);

  useEffect(() => {
    fetchPortfolios();
    fetchAssetPrices();
  }, [fetchPortfolios, fetchAssetPrices, currentEraId, simYear]);

  /* ── Derived data ── */

  const latestSnap = selectedPortfolio?.snapshots?.[selectedPortfolio.snapshots.length - 1];
  const cashGoldKg = latestSnap?.cashGoldKg ?? selectedPortfolio?.initialGoldKg ?? 0;
  const holdings = latestSnap?.holdings ?? {};
  const costBasis = latestSnap?.costBasis ?? {};
  const realizedPnlGoldKg = latestSnap?.realizedPnlGoldKg ?? 0;
  const totalValue = latestSnap?.totalValueGoldKg ?? selectedPortfolio?.initialGoldKg ?? 0;
  const returnPct = selectedPortfolio && selectedPortfolio.initialGoldKg > 0
    ? ((totalValue - selectedPortfolio.initialGoldKg) / selectedPortfolio.initialGoldKg) * 100 : 0;

  const dispDenom = useMemo(() => getDisplayDenom(simYear), [simYear]);
  const sym = denomSymbol(dispDenom.id);
  const suf = denomSuffix(dispDenom.id);
  const psuf = denomPriceSuffix(dispDenom.id);
  const dKg = useCallback((kg: number) => goldKgToDenom(kg, dispDenom.id, simYear), [dispDenom.id, simYear]);
  const dGrams = useCallback((g: number) => goldGramsToDenom(g, dispDenom.id, simYear), [dispDenom.id, simYear]);

  const availableAssets = useMemo(() => ALL_ASSETS.filter((a) => isAvailableAtYear(a, simYear)), [simYear]);

  const categoriesWithAssets = useMemo(() => {
    const cats = new Set(availableAssets.map((a) => a.category));
    return CATEGORY_ORDER.filter((c) => cats.has(c));
  }, [availableAssets]);

  useEffect(() => {
    requestAnimationFrame(updateTabScrollFade);
  }, [categoriesWithAssets, updateTabScrollFade]);

  const filteredAssets = useMemo(() => {
    let assets = activeCategory === "all" ? availableAssets : availableAssets.filter((a) => a.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const chars = [...q];
      assets = assets.filter((a) => {
        const haystack = `${a.ticker ?? ""} ${a.name?.zh ?? ""} ${a.name?.en ?? ""} ${a.id}`.toLowerCase();
        if (haystack.includes(q)) return true;
        let ci = 0;
        for (const ch of haystack) {
          if (ch === chars[ci]) ci++;
          if (ci === chars.length) return true;
        }
        return false;
      });
    }
    return assets.sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category);
      const bi = CATEGORY_ORDER.indexOf(b.category);
      return ai - bi;
    });
  }, [activeCategory, availableAssets, searchQuery]);

  const holdingsData = useMemo(() => {
    return Object.entries(holdings).map(([assetId, quantity]) => {
      const priceAssetId = resolvePriceAssetId(assetId);
      const price = assetPrices[priceAssetId] ?? assetPrices[assetId] ?? 0;
      const valueGoldKg = (quantity * price) / 1000;
      const cost = costBasis[assetId] ?? 0;
      const unrealizedPnlKg = valueGoldKg - cost;
      const pnlPct = cost > 0 ? (unrealizedPnlKg / cost) * 100 : 0;
      return { assetId, quantity, price, valueGoldKg, costKg: cost, unrealizedPnlKg, pnlPct };
    }).filter((h) => h.quantity > 0.0001);
  }, [holdings, assetPrices, costBasis]);

  const totalUnrealizedPnlKg = holdingsData.reduce((s, h) => s + h.unrealizedPnlKg, 0);

  const holdingsValue = holdingsData.reduce((s, h) => s + h.valueGoldKg, 0);

  /* ── Performance chart ── */
  const chartData = useMemo(() => {
    if (!selectedPortfolio?.snapshots?.length) return [];
    return selectedPortfolio.snapshots.map((s) => ({ year: s.year, value: s.totalValueGoldKg }));
  }, [selectedPortfolio]);

  /* ── Actions ── */

  const handleCreateFund = async () => {
    if (!fundName.trim() || capitalGoldKg < 0.01) return;
    setIsCreating(true);
    setError(null);
    try {
      const resp = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fundName.trim(), initialGoldKg: capitalGoldKg }),
      });
      if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error || "Failed");
      const created = await resp.json();
      setSelectedPortfolio(created);
      setPortfolios((prev) => [created, ...prev]);
      setShowCreateForm(false);
      setFundName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleTrade = async (assetId: string, side: "buy" | "sell", qtyStr: string) => {
    if (!selectedPortfolio || isTrading) return;
    const qty = Number(qtyStr);
    if (!Number.isFinite(qty) || qty <= 0) return;
    setIsTrading(true);
    setError(null);
    setTradeStatus(null);
    try {
      const resp = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trade",
          portfolioId: selectedPortfolio.id,
          assetId,
          side,
          quantity: qty,
        }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Trade failed");
      }
      await refreshPortfolio(selectedPortfolio.id);
      await fetchAssetPrices();
      if (side === "buy") setBuyQty((p) => ({ ...p, [assetId]: "" }));
      else setSellQty((p) => ({ ...p, [assetId]: "" }));
      setTradeStatus(t("portfolio.trade.success") || "Trade executed");
      setTimeout(() => setTradeStatus(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsTrading(false);
    }
  };

  const handleLiquidate = async () => {
    if (!selectedPortfolio) return;
    setConfirmAction(null);
    setIsTrading(true);
    try {
      const resp = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "liquidate", portfolioId: selectedPortfolio.id }),
      });
      if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error || "Failed");
      await refreshPortfolio(selectedPortfolio.id);
      setTradeStatus(locale === "zh" ? "已清算所有持仓" : "All holdings liquidated");
      setTimeout(() => setTradeStatus(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsTrading(false);
    }
  };

  const handleDeleteFund = async () => {
    if (!selectedPortfolio) return;
    setConfirmAction(null);
    try {
      const resp = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", portfolioId: selectedPortfolio.id }),
      });
      if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error || "Failed");
      setSelectedPortfolio(null);
      setPortfolios((prev) => prev.filter((p) => p.id !== selectedPortfolio.id));
      setTradeStatus(locale === "zh" ? "基金已删除" : "Fund deleted");
      setTimeout(() => setTradeStatus(null), 2500);
      fetchPortfolios();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSelectPortfolio = async (id: string) => {
    const resp = await fetch(`/api/portfolio?id=${id}`);
    if (resp.ok) setSelectedPortfolio(await resp.json());
  };

  useEffect(() => {
    if (!showFundMenu) return;
    const handler = (e: MouseEvent) => {
      if (fundMenuRef.current && !fundMenuRef.current.contains(e.target as Node)) setShowFundMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showFundMenu]);

  const catLabel = (cat: string) => t(`asset.category.${cat}`) || cat;

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-text-muted text-xs">
        {t("loading") || "Loading..."}
      </div>
    );
  }

  /* ── Main terminal view ── */
  const perfOption = chartData.length > 0 ? (() => {
    const initLine = selectedPortfolio!.initialGoldKg;
    const isUp = chartData[chartData.length - 1].value >= initLine;
    const lineColor = isUp ? "#22c55e" : "#ef4444";
    return {
      backgroundColor: "transparent",
      grid: { left: 44, right: 12, top: 8, bottom: 20, containLabel: false },
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: "rgba(20,18,16,0.95)",
        borderColor: "rgba(255,255,255,0.1)",
        textStyle: { color: "rgba(255,255,255,0.9)", fontSize: 12 },
        formatter: (params: { axisValue: string; value: number }[]) => {
          if (!Array.isArray(params) || !params.length) return "";
          const p = params[0];
          return `<div style="font-size:12px"><div style="color:rgba(255,255,255,0.5)">${p.axisValue}</div><div style="color:#d4a853;font-weight:600">${sym}${fmtCompact(dKg(p.value))}${suf}</div></div>`;
        },
      },
      xAxis: { type: "category" as const, data: chartData.map((d) => d.year.toString()), boundaryGap: false, axisLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } }, axisTick: { show: false }, axisLabel: { color: "rgba(255,255,255,0.3)", fontSize: 12, interval: "auto" } },
      yAxis: { type: "value" as const, scale: true, splitNumber: 3, axisLabel: { color: "rgba(255,255,255,0.3)", fontSize: 12, formatter: (v: number) => `${sym}${fmtCompact(dKg(v))}` }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)", type: "dashed" as const } } },
      series: [{ type: "line", data: chartData.map((d) => d.value), smooth: 0.3, symbol: "none", lineStyle: { color: lineColor, width: 1.5 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: lineColor + "18" }, { offset: 1, color: "transparent" }]) }, markLine: { silent: true, symbol: "none", lineStyle: { color: "rgba(212,168,83,0.2)", type: "dashed" as const, width: 1 }, data: [{ yAxis: initLine }], label: { show: false } } }],
    };
  })() : null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden text-xs">
      {/* ── Zone 1: Account header ── */}
      <div className="shrink-0 border-b border-border-subtle bg-bg-secondary/50 px-4 py-2.5">
        {selectedPortfolio ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {portfolios.length > 1 ? (
                  <select value={selectedPortfolio.id} onChange={(e) => handleSelectPortfolio(e.target.value)}
                    className="max-w-[120px] truncate rounded border border-border-subtle bg-transparent px-1.5 py-0.5 text-xs font-semibold text-text-primary"
                  >
                    {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                ) : (
                  <span className="text-xs font-semibold text-text-primary truncate">{selectedPortfolio.name}</span>
                )}
                <span className="text-text-muted">{selectedPortfolio.startYear} → {simYear < 0 ? `${Math.abs(simYear)} BCE` : simYear}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => { setShowCreateForm(!showCreateForm); setShowFundMenu(false); }}
                  className="shrink-0 rounded border border-accent-gold/40 px-2 py-0.5 text-xs text-accent-gold hover:bg-accent-gold/10 transition-colors"
                >
                  +
                </button>
                <div className="relative" ref={fundMenuRef}>
                  <button onClick={() => { setShowFundMenu(!showFundMenu); setShowCreateForm(false); }}
                    className="shrink-0 rounded border border-border-subtle px-1.5 py-0.5 text-xs text-text-muted hover:text-text-primary hover:border-text-muted/40 transition-colors"
                  >
                    ···
                  </button>
                  {showFundMenu && (
                    <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-md border border-border-subtle bg-bg-secondary shadow-lg py-1">
                      <button onClick={() => { setConfirmAction("liquidate"); setShowFundMenu(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-tertiary hover:text-amber-400 transition-colors"
                      >
                        {locale === "zh" ? "清算所有持仓" : "Liquidate All"}
                      </button>
                      <button onClick={() => { setConfirmAction("delete"); setShowFundMenu(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-400/80 hover:bg-bg-tertiary hover:text-red-400 transition-colors"
                      >
                        {locale === "zh" ? "删除基金" : "Delete Fund"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <div>
                <span className="text-text-muted">{t("portfolio.nav") || "NAV"}: </span>
                <span className="font-mono font-semibold text-accent-gold">{sym}{fmtCompact(dKg(totalValue))}</span>
                <span className="text-text-muted">{suf}</span>
              </div>
              <div>
                <span className="text-text-muted">{t("portfolio.cash") || "Cash"}: </span>
                <span className="font-mono text-text-primary">{sym}{fmtCompact(dKg(cashGoldKg))}</span>
                <span className="text-text-muted">{suf}</span>
              </div>
              <span className={`font-mono font-semibold ${returnPct >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-text-muted">{locale === "zh" ? "浮盈" : "Unreal."}:</span>
                <span className={`font-mono font-medium ${totalUnrealizedPnlKg >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {totalUnrealizedPnlKg >= 0 ? "+" : "-"}{sym}{fmtCompact(Math.abs(dKg(totalUnrealizedPnlKg)))}{suf}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-text-muted">{locale === "zh" ? "已实现" : "Real."}:</span>
                <span className={`font-mono font-medium ${realizedPnlGoldKg >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {realizedPnlGoldKg >= 0 ? "+" : "-"}{sym}{fmtCompact(Math.abs(dKg(realizedPnlGoldKg)))}{suf}
                </span>
              </div>
            </div>
            {chartData.length > 1 && perfOption && (
              <div className="mt-1.5 -mx-1">
                <ReactEChartsCore echarts={echarts} option={perfOption} style={{ width: "100%", height: 60 }} opts={{ renderer: "canvas" }} notMerge lazyUpdate />
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-text-muted">
              <span className="text-lg opacity-60">⌛</span>
              <span className="text-xs">{t("portfolio.empty.desc") || "Create a fund to start investing"}</span>
            </div>
            <button onClick={() => setShowCreateForm(!showCreateForm)}
              className="shrink-0 rounded border border-accent-gold/60 bg-accent-gold/10 px-3 py-1 text-xs font-medium text-accent-gold hover:bg-accent-gold/20 transition-colors"
            >
              {locale === "zh" ? "创建基金" : "Create Fund"}
            </button>
          </div>
        )}

        {/* ── Inline create fund form ── */}
        {showCreateForm && (
          <div className="mt-2 rounded-md border border-accent-gold/20 bg-bg-tertiary/50 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-primary">{locale === "zh" ? "新建基金" : "New Fund"}</span>
              <button onClick={() => setShowCreateForm(false)} className="text-text-muted hover:text-text-primary text-xs leading-none">✕</button>
            </div>
            <div className="flex items-center gap-2">
              <input type="text" value={fundName} onChange={(e) => setFundName(e.target.value)}
                placeholder={locale === "zh" ? "基金名称" : "Fund name"}
                className="flex-1 min-w-0 rounded border border-border-subtle bg-bg-tertiary px-2 py-1 text-xs text-text-primary placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none"
              />
              <div className="flex items-center gap-1">
                {availableDenoms.map((d) => (
                  <button key={d.id} onClick={() => { setWizardDenom(d.id); const nd = DENOMINATIONS.find((dd) => dd.id === d.id) ?? DENOMINATIONS[0]; setCapitalDenom(Math.round((nd.rangeMin + nd.rangeMax) / 20)); }}
                    className={`rounded-full px-2 py-0.5 text-xs transition-colors ${wizardDenom === d.id ? "bg-accent-gold/20 text-accent-gold" : "text-text-muted hover:text-text-primary"}`}
                  >
                    {d.icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <input type="range" min={0} max={100}
                value={valueToLog(capitalDenom, activeDenom.rangeMin, activeDenom.rangeMax)}
                onChange={(e) => setCapitalDenom(logToValueDenom(Number(e.target.value), activeDenom.rangeMin, activeDenom.rangeMax))}
                className="w-full accent-[#D4A853] h-1"
                style={{ background: `linear-gradient(to right, #D4A853 ${valueToLog(capitalDenom, activeDenom.rangeMin, activeDenom.rangeMax)}%, rgba(255,255,255,0.08) ${valueToLog(capitalDenom, activeDenom.rangeMin, activeDenom.rangeMax)}%)` }}
              />
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-accent-gold font-medium">{fmt(capitalDenom)} {locale === "zh" ? activeDenom.unitZh : activeDenom.unitEn}</span>
                {wizardDenom !== "gold_kg" && <span className="text-xs text-text-muted">≈ {fmt(capitalGoldKg)} kg Au</span>}
              </div>
            </div>
            <button onClick={handleCreateFund} disabled={isCreating || !fundName.trim() || capitalGoldKg < 0.01}
              className="w-full rounded border border-accent-gold bg-accent-gold/20 px-3 py-1.5 text-xs font-medium text-accent-gold disabled:opacity-40 hover:bg-accent-gold/30 transition-colors"
            >
              {isCreating ? "..." : locale === "zh" ? "创建" : "Create"}
            </button>
          </div>
        )}

        {/* ── Confirm modal ── */}
        {confirmAction && (
          <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/5 p-3">
            <p className="text-xs text-text-primary mb-2">
              {confirmAction === "liquidate"
                ? (locale === "zh" ? "确认清算所有持仓？将以当前市价卖出全部资产转为现金。" : "Liquidate all holdings? All assets will be sold at current market price.")
                : (locale === "zh" ? "确认删除该基金？此操作不可撤销。" : "Delete this fund? This action cannot be undone.")}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={confirmAction === "liquidate" ? handleLiquidate : handleDeleteFund}
                className="rounded bg-red-500/20 border border-red-500/40 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/30 transition-colors"
              >
                {locale === "zh" ? "确认" : "Confirm"}
              </button>
              <button onClick={() => setConfirmAction(null)}
                className="rounded border border-border-subtle px-3 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                {locale === "zh" ? "取消" : "Cancel"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Zone 2: Market data grid ── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Category tabs */}
        <div className="shrink-0 relative border-b border-border-subtle">
          {tabScrollFade.left && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-bg-primary to-transparent" />
          )}
          <div ref={tabsRef} className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 scrollbar-hide">
            <button onClick={() => setActiveCategory("all")}
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs whitespace-nowrap transition-colors ${activeCategory === "all" ? "bg-accent-gold/20 text-accent-gold font-medium" : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary"}`}
            >
              {catLabel("all")}
            </button>
            {categoriesWithAssets.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs whitespace-nowrap transition-colors ${activeCategory === cat ? "bg-accent-gold/20 text-accent-gold font-medium" : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary"}`}
              >
                {catLabel(cat)}
              </button>
            ))}
          </div>
          {tabScrollFade.right && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-bg-primary to-transparent" />
          )}
        </div>

        {/* Search bar */}
        <div className="shrink-0 px-3 py-1.5 border-b border-border-subtle/50">
          <div className="relative">
            <svg className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === "zh" ? "搜索代码、名称…" : "Search ticker, name…"}
              className="w-full rounded-md border border-border-subtle/60 bg-bg-tertiary/60 pl-7 pr-7 py-1 text-xs text-text-primary placeholder:text-text-muted/40 focus:border-accent-gold/50 focus:outline-none focus:ring-1 focus:ring-accent-gold/20 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted/50 hover:text-text-primary transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Asset table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-bg-primary">
              <tr className="border-b border-border-subtle text-left text-text-muted">
                <th className="py-1.5 pl-4 pr-2 font-normal">{t("portfolio.market.ticker") || "Ticker"}</th>
                <th className="py-1.5 px-2 font-normal hidden sm:table-cell">{t("portfolio.market.name") || "Name"}</th>
                <th className="py-1.5 px-2 font-normal text-right">{t("portfolio.market.price") || "Price"}</th>
                <th className="py-1.5 px-2 font-normal text-center w-[90px]">{t("portfolio.trade.qty") || "Qty"}</th>
                <th className="py-1.5 pr-4 pl-2 font-normal text-right w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => {
                const pid = resolvePriceAssetId(asset.id);
                const price = assetPrices[pid] ?? assetPrices[asset.id] ?? 0;
                const qtyVal = buyQty[asset.id] ?? "";
                const costKg = Number(qtyVal || 0) * price / 1000;
                const canBuy = costKg > 0 && costKg <= cashGoldKg + 0.0001;
                return (
                  <tr key={asset.id} className="border-b border-border-subtle/30 hover:bg-bg-tertiary/40 group">
                    <td className="py-2 pl-4 pr-2">
                      <span className="font-mono font-medium text-accent-gold">{asset.ticker || asset.id.slice(0, 4).toUpperCase()}</span>
                      {asset.isBubble && <span className="ml-1 text-red-400" title="Bubble">!</span>}
                    </td>
                    <td className="py-2 px-2 text-text-secondary truncate max-w-[100px] hidden sm:table-cell">
                      {localized(asset.name)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-text-primary whitespace-nowrap">
                      {price > 0 ? <>{sym}{fmtPrice(dGrams(price))}<span className="text-text-muted ml-0.5">{psuf}</span></> : "—"}
                    </td>
                    <td className="py-1.5 px-2">
                      <input type="number" min="0" step="any" value={qtyVal}
                        onChange={(e) => setBuyQty((p) => ({ ...p, [asset.id]: e.target.value }))}
                        placeholder="0"
                        className="no-spin w-full rounded-md border border-border-subtle bg-bg-tertiary px-2 py-1 text-xs text-right font-mono text-text-primary placeholder:text-text-muted/40 focus:border-accent-gold/50 focus:outline-none focus:ring-1 focus:ring-accent-gold/20 transition-colors"
                      />
                    </td>
                    <td className="py-1.5 pr-4 pl-2 text-right">
                      <button onClick={() => handleTrade(asset.id, "buy", qtyVal)} disabled={!canBuy || isTrading}
                        className="whitespace-nowrap rounded-md bg-[#22c55e]/15 px-2.5 py-1 text-xs font-medium text-[#22c55e] hover:bg-[#22c55e]/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        {t("portfolio.trade.buy") || "Buy"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAssets.length === 0 && (
            <div className="flex items-center justify-center py-10 text-text-muted text-xs">
              {searchQuery.trim()
                ? (locale === "zh" ? `未找到 "${searchQuery}" 相关资产` : `No assets matching "${searchQuery}"`)
                : (locale === "zh" ? "该年代暂无可用资产" : "No assets available in this era")}
            </div>
          )}
        </div>
      </div>

      {/* ── Zone 3: Holdings panel ── */}
      <div className={`shrink-0 border-t border-border-subtle bg-bg-secondary/30 ${holdingsOpen ? "max-h-[300px]" : "max-h-[36px]"} transition-all overflow-hidden`}>
        <button onClick={() => setHoldingsOpen(!holdingsOpen)}
          className="flex w-full items-center justify-between px-4 py-2 text-xs hover:bg-bg-tertiary/30"
        >
          <span className="font-semibold text-text-primary">
            {t("portfolio.holdings.title") || "Holdings"}
            {holdingsData.length > 0 && <span className="ml-1.5 text-text-muted font-normal">({holdingsData.length})</span>}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-accent-gold">{sym}{fmtCompact(dKg(holdingsValue))}{suf}</span>
            <span className="text-text-muted">{holdingsOpen ? "▾" : "▴"}</span>
          </div>
        </button>
        {holdingsOpen && (
          <div className="overflow-y-auto max-h-[264px] px-0">
            {holdingsData.length === 0 ? (
              <div className="px-4 py-6 text-center text-text-muted text-xs">
                {t("portfolio.holdings.empty") || "No holdings yet. Buy assets from the market above."}
              </div>
            ) : (
              <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 bg-bg-secondary/90 backdrop-blur-sm">
                  <tr className="text-left text-text-muted border-b border-border-subtle/50">
                    <th className="py-1.5 pl-4 pr-2 font-normal">Asset</th>
                    <th className="py-1.5 px-2 font-normal text-right">Qty</th>
                    <th className="py-1.5 px-2 font-normal text-right">{locale === "zh" ? "成本" : "Cost"}</th>
                    <th className="py-1.5 px-2 font-normal text-right">{locale === "zh" ? "市值" : "Value"}</th>
                    <th className="py-1.5 px-2 font-normal text-right">{locale === "zh" ? "浮盈" : "Unreal."}</th>
                    <th className="py-1.5 px-1 font-normal text-center w-[100px]">{t("portfolio.trade.qty") || "Qty"}</th>
                    <th className="py-1.5 pr-4 pl-1 font-normal w-[60px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {holdingsData.map((h) => {
                    const asset = ALL_ASSETS.find((a) => a.id === h.assetId);
                    const sqty = sellQty[h.assetId] ?? "";
                    const canSell = Number(sqty || 0) > 0 && Number(sqty || 0) <= h.quantity + 0.0001;
                    return (
                      <tr key={h.assetId} className="border-b border-border-subtle/20 hover:bg-bg-tertiary/30">
                        <td className="py-2 pl-4 pr-2">
                          <span className="font-mono text-accent-gold">{(asset as CatalogAsset)?.ticker || h.assetId.slice(0, 4).toUpperCase()}</span>
                          <span className="ml-1.5 text-text-muted hidden sm:inline">{asset ? localized(asset.name) : ""}</span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-text-primary">{fmt(h.quantity)}</td>
                        <td className="py-2 px-2 text-right font-mono text-text-muted whitespace-nowrap">{sym}{fmtCompact(dKg(h.costKg))}{suf}</td>
                        <td className="py-2 px-2 text-right font-mono text-text-primary whitespace-nowrap">{sym}{fmtCompact(dKg(h.valueGoldKg))}{suf}</td>
                        <td className={`py-2 px-2 text-right font-mono font-medium whitespace-nowrap ${h.unrealizedPnlKg >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                          <div>{h.unrealizedPnlKg >= 0 ? "+" : ""}{sym}{fmtCompact(Math.abs(dKg(h.unrealizedPnlKg)))}</div>
                          <div className="text-[10px] opacity-70">{h.pnlPct >= 0 ? "+" : ""}{h.pnlPct.toFixed(1)}%</div>
                        </td>
                        <td className="py-1.5 px-1">
                          <div className="flex items-center gap-1">
                            <input type="number" min="0" step="any" value={sqty}
                              onChange={(e) => setSellQty((p) => ({ ...p, [h.assetId]: e.target.value }))}
                              placeholder="0"
                              className="no-spin w-full min-w-0 rounded-md border border-border-subtle bg-bg-tertiary px-1.5 py-1 text-xs text-right font-mono text-text-primary placeholder:text-text-muted/40 focus:border-[#ef4444]/40 focus:outline-none focus:ring-1 focus:ring-[#ef4444]/20 transition-colors"
                            />
                            <button
                              onClick={() => setSellQty((p) => ({ ...p, [h.assetId]: String(h.quantity) }))}
                              className="shrink-0 rounded border border-border-subtle bg-bg-tertiary px-1 py-0.5 text-[10px] font-medium text-text-muted hover:text-[#ef4444] hover:border-[#ef4444]/40 transition-colors"
                              title={locale === "zh" ? "全部" : "Max"}
                            >
                              MAX
                            </button>
                          </div>
                        </td>
                        <td className="py-1.5 pr-4 pl-1 text-right">
                          <button onClick={() => handleTrade(h.assetId, "sell", sqty)} disabled={!canSell || isTrading}
                            className="whitespace-nowrap rounded-md bg-[#ef4444]/15 px-2.5 py-1 text-xs font-medium text-[#ef4444] hover:bg-[#ef4444]/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            {t("portfolio.trade.sell") || "Sell"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      {(error || tradeStatus) && (
        <div className={`shrink-0 px-4 py-1.5 text-xs ${error ? "bg-red-500/10 text-red-400" : "bg-[#22c55e]/10 text-[#22c55e]"}`}>
          {error || tradeStatus}
        </div>
      )}
    </div>
  );
}
