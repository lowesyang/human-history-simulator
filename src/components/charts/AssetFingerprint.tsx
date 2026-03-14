"use client";

import React, { useMemo } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { RadarChart } from "echarts/charts";
import { TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([RadarChart, TooltipComponent, CanvasRenderer]);

export interface AssetFingerprintProps {
  current: {
    gdpPerCapita: number;
    tradeOpenness: number;
    fiscalBalance: number;
    militarySpendingPctGdp: number;
    urbanizationRate: number;
    population: number;
    debtToGdp: number;
    technologyLevel: number;
  };
  comparison?: {
    gdpPerCapita: number;
    tradeOpenness: number;
    fiscalBalance: number;
    militarySpendingPctGdp: number;
    urbanizationRate: number;
    population: number;
    debtToGdp: number;
    technologyLevel: number;
  };
  maxValues?: {
    gdpPerCapita: number;
    tradeOpenness: number;
    fiscalBalance: number;
    militarySpendingPctGdp: number;
    urbanizationRate: number;
    population: number;
    debtToGdp: number;
    technologyLevel: number;
  };
  regionName?: string;
  comparisonLabel?: string;
  locale?: string;
  width?: number;
  height?: number;
}

const AXIS_LABELS_EN = [
  "GDP/Cap",
  "Trade",
  "Fiscal",
  "Military",
  "Urban",
  "Pop.",
  "Debt",
  "Tech",
] as const;

const AXIS_LABELS_ZH = [
  "人均GDP",
  "贸易",
  "财政",
  "军费",
  "城市化",
  "人口",
  "负债",
  "科技",
] as const;

const AXIS_KEYS: (keyof AssetFingerprintProps["current"])[] = [
  "gdpPerCapita",
  "tradeOpenness",
  "fiscalBalance",
  "militarySpendingPctGdp",
  "urbanizationRate",
  "population",
  "debtToGdp",
  "technologyLevel",
];

function formatValue(key: string, value: number, locale?: string): string {
  if (key === "tradeOpenness" && value === TRADE_MISSING) return "N/A";
  if (key === "fiscalBalance" && value === FISCAL_MISSING) return "N/A";
  if (key === "fiscalBalance") {
    const label = value >= 0
      ? (locale === "zh" ? "盈余" : "surplus")
      : (locale === "zh" ? "赤字" : "deficit");
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}% ${label}`;
  }
  if (key === "urbanizationRate" || key === "militarySpendingPctGdp" || key === "tradeOpenness" || key === "debtToGdp") {
    return `${value.toFixed(1)}%`;
  }
  if (key === "technologyLevel") {
    return `${value.toFixed(0)}/10`;
  }
  if (key === "population") {
    if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return `${value.toFixed(0)}`;
  }
  if (key === "gdpPerCapita") {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(0);
  }
  return value.toFixed(1);
}

const TRADE_MISSING = -1;
const FISCAL_MISSING = -999;

/**
 * Fixed reference scales for normalization.
 * Each dimension uses a carefully chosen max that represents the high end
 * of real-world values, so countries spread across the 0-1 range.
 *
 * Using log scales for dimensions with huge dynamic range (GDP/cap, population)
 * and linear for bounded percentages.
 */
const REF_SCALES: Record<string, { max: number; log?: boolean; invert?: boolean }> = {
  gdpPerCapita: { max: 0.002, log: true },       // ~0.002 kg gold/person ≈ $130k (Luxembourg level)
  tradeOpenness: { max: 200 },                     // 0–200% of GDP
  fiscalBalance: { max: 50 },                      // special bipolar handling
  militarySpendingPctGdp: { max: 10, invert: true },        // 0–10% of GDP
  urbanizationRate: { max: 100 },                     // 0–100%
  population: { max: 1_500_000_000, log: true }, // up to 1.5B
  debtToGdp: { max: 250, invert: true },       // 0–250% of GDP
  technologyLevel: { max: 10 },                      // 0–10
};

function normalizeSingle(key: string, val: number): number {
  const spec = REF_SCALES[key];
  if (!spec) return 0.5;

  if (key === "fiscalBalance") {
    if (val === FISCAL_MISSING) return 0.5;
    return Math.max(0, Math.min(1, (val + spec.max) / (2 * spec.max)));
  }

  if (key === "tradeOpenness" && val === TRADE_MISSING) return 0.5;

  if (spec.log) {
    if (val <= 0) return 0;
    const logVal = Math.log10(Math.max(val, 1e-10));
    const logMax = Math.log10(spec.max);
    const logMin = logMax - 4; // 4 orders of magnitude range
    const n = (logVal - logMin) / (logMax - logMin);
    const clamped = Math.max(0, Math.min(1, n));
    return spec.invert ? 1 - clamped : clamped;
  }

  let n = val / spec.max;
  n = Math.max(0, Math.min(1, n));
  return spec.invert ? 1 - n : n;
}

function normalize(
  c: AssetFingerprintProps["current"],
  _comp: AssetFingerprintProps["comparison"] | undefined,
  _maxV: AssetFingerprintProps["maxValues"] | undefined
): number[] {
  return AXIS_KEYS.map((key) => normalizeSingle(key, c[key]));
}

function normalizeComparison(
  comp: NonNullable<AssetFingerprintProps["comparison"]>,
  _c: AssetFingerprintProps["current"],
  _maxV: AssetFingerprintProps["maxValues"] | undefined
): number[] {
  return AXIS_KEYS.map((key) => normalizeSingle(key, comp[key]));
}

export default function AssetFingerprint({
  current,
  comparison,
  maxValues,
  regionName,
  comparisonLabel = "Comparison",
  locale,
  width = 280,
  height = 280,
}: AssetFingerprintProps) {
  const AXIS_LABELS = locale === "zh" ? AXIS_LABELS_ZH : AXIS_LABELS_EN;
  const allZero =
    current.gdpPerCapita === 0 &&
    (current.tradeOpenness === 0 || current.tradeOpenness === TRADE_MISSING) &&
    (current.fiscalBalance === 0 || current.fiscalBalance === FISCAL_MISSING) &&
    current.militarySpendingPctGdp === 0 &&
    current.urbanizationRate === 0 &&
    current.population === 0 &&
    current.debtToGdp === 0 &&
    current.technologyLevel === 0;

  const option = useMemo(() => {
    if (allZero) return {};

    const currNorm = normalize(current, comparison, maxValues);
    const compNorm = comparison
      ? normalizeComparison(comparison, current, maxValues)
      : null;

    const seriesData: { value: number[]; name: string; itemStyle: object; lineStyle: object; areaStyle: object }[] = [
      {
        value: currNorm,
        name: regionName ?? "Current",
        itemStyle: {
          color: "#D4A853",
          borderColor: "rgba(212, 168, 83, 0.8)",
          borderWidth: 2,
        },
        lineStyle: {
          color: "rgba(212, 168, 83, 0.8)",
          width: 2,
        },
        areaStyle: {
          color: "rgba(212, 168, 83, 0.2)",
        },
      },
    ];

    if (compNorm) {
      seriesData.push({
        value: compNorm,
        name: comparisonLabel,
        itemStyle: {
          color: "#cd7f32",
          borderColor: "rgba(205, 127, 50, 0.8)",
          borderWidth: 1.5,
        },
        lineStyle: {
          color: "rgba(205, 127, 50, 0.8)",
          width: 1.5,
          type: "dashed",
        },
        areaStyle: {
          color: "rgba(205, 127, 50, 0.15)",
        },
      });
    }

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(20, 18, 16, 0.95)",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: "rgba(255,255,255,0.9)", fontSize: 12 },
        formatter: (params: { seriesName: string; value: number[] } | { seriesName: string; value: number[] }[]) => {
          const items = Array.isArray(params) ? params : [params];
          const data = items[0];
          if (!data?.value) return "";

          const raw = data.seriesName === (regionName ?? "Current") ? current : comparison;
          if (!raw) return "";

          const lines = AXIS_KEYS.map(
            (key, i) =>
              `<div style="display:flex;align-items:center;gap:6px;margin-top:3px"><span style="flex:1;color:rgba(255,255,255,0.7)">${AXIS_LABELS[i]}</span><b>${formatValue(key, raw[key], locale)}</b></div>`
          );
          return `<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:4px">${data.seriesName}</div>${lines.join("")}`;
        },
      },
      radar: {
        indicator: AXIS_LABELS.map((name) => ({ name, max: 1 })),
        center: ["50%", "50%"],
        radius: "50%",
        nameGap: 8,
        axisName: {
          color: "rgba(255,255,255,0.5)",
          fontSize: 12,
        },
        splitLine: {
          lineStyle: {
            color: "rgba(255,255,255,0.06)",
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: [
              "rgba(255,255,255,0.02)",
              "rgba(255,255,255,0.04)",
            ],
          },
        },
        axisLine: {
          lineStyle: {
            color: "rgba(255,255,255,0.08)",
          },
        },
      },
      series: [
        {
          type: "radar",
          data: seriesData,
          symbol: "circle",
          symbolSize: 4,
          emphasis: {
            lineStyle: { width: 3 },
            areaStyle: { opacity: 0.4 },
          },
        },
      ],
    };
  }, [
    current,
    comparison,
    maxValues,
    regionName,
    comparisonLabel,
    allZero,
    locale,
    AXIS_LABELS,
  ]);

  if (allZero) {
    return (
      <div
        className="flex items-center justify-center text-text-muted text-xs"
        style={{ width, height }}
      >
        No data
      </div>
    );
  }

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ width, height }}
      opts={{ renderer: "canvas" }}
      notMerge
      lazyUpdate
    />
  );
}
