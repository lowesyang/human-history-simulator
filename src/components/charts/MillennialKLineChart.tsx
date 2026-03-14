"use client";

import React, { useMemo } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DataZoomComponent,
  MarkPointComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { buildCategoryXAxis, rotatedLabelBottomMargin } from "./chart-utils";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DataZoomComponent,
  MarkPointComponent,
  CanvasRenderer,
]);

export interface MillennialKLineChartProps {
  series: {
    id: string;
    name: string;
    color: string;
    data: { year: number; value: number }[];
  }[];
  events?: { year: number; category: string; title: string }[];
  width?: number;
  height?: number;
  denomination?: "gold" | "silver" | "usd";
  title?: string;
  locale?: string;
}

const EVENT_SYMBOL: Record<string, string> = {
  war: "diamond",
  invention: "triangle",
  technology: "triangle",
  disaster: "roundRect",
  natural_disaster: "roundRect",
  trade: "circle",
  finance: "circle",
};

const EVENT_COLOR: Record<string, string> = {
  war: "#ef4444",
  invention: "#3b82f6",
  technology: "#3b82f6",
  disaster: "#a855f7",
  natural_disaster: "#a855f7",
  trade: "#22c55e",
  finance: "#22c55e",
};

export function formatYearLabel(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year}`;
}

function formatValueWithUnit(value: number): string {
  if (Math.abs(value) >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(1);
}

function getEventSymbol(category: string): string {
  const key = category.toLowerCase().replace(/\s+/g, "_");
  return EVENT_SYMBOL[key] ?? "rect";
}

function getEventColor(category: string): string {
  const key = category.toLowerCase().replace(/\s+/g, "_");
  return EVENT_COLOR[key] ?? "#9ca3af";
}

export default function MillennialKLineChart({
  series,
  events = [],
  width = 600,
  height = 320,
  denomination,
  title,
  locale,
}: MillennialKLineChartProps) {
  const option = useMemo(() => {
    if (series.length === 0) return null;

    const yearSet = new Set<number>();
    for (const s of series) {
      for (const d of s.data) yearSet.add(d.year);
    }
    for (const e of events) {
      if (yearSet.has(e.year)) continue;
      yearSet.add(e.year);
    }
    const years = Array.from(yearSet).sort((a, b) => a - b);

    const dataYearSet = new Set<number>();
    for (const s of series) {
      for (const d of s.data) dataYearSet.add(d.year);
    }
    const yearLabels = years.map(formatYearLabel);

    const dataByYear = new Map<number, Map<string, number>>();
    for (const yr of years) dataByYear.set(yr, new Map());
    for (const s of series) {
      const byYear = new Map<number, number>();
      for (const d of s.data) byYear.set(d.year, d.value);
      for (const yr of years) {
        const v = byYear.get(yr);
        if (v !== undefined) dataByYear.get(yr)!.set(s.id, v);
      }
    }

    const eventsByYear = new Map<number, typeof events>();
    for (const e of events) {
      const list = eventsByYear.get(e.year) ?? [];
      list.push(e);
      eventsByYear.set(e.year, list);
    }

    const fewPoints = years.length <= 5;

    const chartSeries = series.map((s) => ({
      name: s.name,
      type: "line" as const,
      data: fewPoints
        ? years.map((yr) => {
          const v = dataByYear.get(yr)?.get(s.id);
          return v !== undefined ? [yr, v] : null;
        })
        : years.map((yr) => dataByYear.get(yr)!.get(s.id) ?? null),
      smooth: 0.3,
      symbol: fewPoints ? "circle" : "none",
      symbolSize: fewPoints ? 8 : 4,
      lineStyle: { color: s.color, width: 2 },
      itemStyle: { color: s.color },
      areaStyle: {
        color: echarts.graphic.LinearGradient
          ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: s.color + "0F" },
            { offset: 0.5, color: s.color + "06" },
            { offset: 1, color: "transparent" },
          ])
          : s.color + "0F",
      },
    }));

    const firstSeries = chartSeries[0];
    if (firstSeries && events.length > 0) {
      const markPointData = events.map((e) => {
        const idx = years.indexOf(e.year);
        if (idx < 0) return null;
        const val = dataByYear.get(e.year)?.get(series[0].id);
        const coord: [number, number | "max"] =
          val !== undefined ? [idx, val] : [idx, "max"];
        return {
          coord,
          symbol: getEventSymbol(e.category),
          symbolSize: 8,
          itemStyle: { color: getEventColor(e.category) },
          label: { show: false },
          name: e.title,
        };
      }).filter(Boolean) as { coord: [number, number | string]; symbol: string; symbolSize: number; itemStyle: { color: string }; label: { show: boolean }; name: string }[];

      (firstSeries as Record<string, unknown>).markPoint = {
        symbolSize: 8,
        data: markPointData,
      };
    }

    const denomLabels: Record<string, string> = { gold: "kg gold", silver: "kg silver", usd: "USD" };
    const denomSuffix = denomination ? ` (${denomLabels[denomination] ?? denomination})` : "";

    const chartTitle = title
      ? title
      : locale === "zh"
        ? "GDP 走势"
        : "GDP Trend";

    const gridLeft = 56;
    const gridRight = 24;
    const plotWidth = (width ?? 600) - gridLeft - gridRight;
    const extraBottom = fewPoints ? 0 : rotatedLabelBottomMargin(yearLabels, plotWidth);

    return {
      backgroundColor: "transparent",
      title: {
        text: chartTitle,
        left: "center",
        top: 4,
        textStyle: {
          color: "rgba(255,255,255,0.6)",
          fontSize: 14,
          fontWeight: 500,
        },
      },
      grid: {
        left: gridLeft,
        right: gridRight,
        top: 40,
        bottom: 12 + extraBottom,
        containLabel: false,
      },
      tooltip: {
        trigger: "axis" as const,
        appendToBody: true,
        backgroundColor: "rgba(20, 18, 16, 0.95)",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: "rgba(255,255,255,0.9)", fontSize: 12 },
        axisPointer: {
          type: "line" as const,
          lineStyle: {
            color: "rgba(255,255,255,0.15)",
            type: "dashed" as const,
            width: 1,
          },
        },
        formatter: (params: { axisValue: string; marker: string; seriesName: string; value?: number | number[] }[]) => {
          if (!Array.isArray(params) || params.length === 0) return "";
          const yearLabel = fewPoints
            ? formatYearLabel(Array.isArray(params[0].value) ? params[0].value[0] : Number(params[0].axisValue))
            : params[0].axisValue;
          const yearNum = fewPoints
            ? (Array.isArray(params[0].value) ? params[0].value[0] : Number(params[0].axisValue))
            : years[yearLabels.indexOf(params[0].axisValue)];
          const lines = params
            .filter((p) => p.value != null && !Number.isNaN(Array.isArray(p.value) ? p.value[1] : p.value))
            .map(
              (p) => {
                const v = Array.isArray(p.value) ? p.value[1] : p.value!;
                return `<div style="display:flex;align-items:center;gap:6px;margin-top:3px">${p.marker}<span style="flex:1">${p.seriesName}</span><b>${formatValueWithUnit(v as number)}</b></div>`;
              }
            );
          const evts = eventsByYear.get(yearNum);
          let evtBlock = "";
          if (evts?.length) {
            evtBlock =
              '<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);font-size:12px;color:rgba(255,255,255,0.6)">' +
              evts
                .map(
                  (e) =>
                    `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:4px;background:${getEventColor(e.category)}"></span>${e.title}`
                )
                .join("<br/>") +
              "</div>";
          }
          return `<div style="font-size:12px"><div style="color:rgba(255,255,255,0.4);margin-bottom:4px">${yearLabel}${denomSuffix}</div>${lines.join("")}${evtBlock}</div>`;
        },
      },
      xAxis: fewPoints
        ? {
          type: "value" as const,
          min: years[0] - 1,
          max: years[years.length - 1] + 1,
          axisLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } },
          axisTick: { show: false },
          axisLabel: {
            color: "rgba(255,255,255,0.4)",
            fontSize: 12,
            margin: 8,
            formatter: (v: number) => {
              const rounded = Math.round(v);
              if (rounded !== v) return "";
              return dataYearSet.has(rounded) ? formatYearLabel(rounded) : "";
            },
          },
          splitLine: { show: false },
          interval: 1,
        }
        : (() => {
          const base = buildCategoryXAxis(yearLabels, plotWidth);
          return {
            ...base,
            axisLabel: {
              ...base.axisLabel,
              formatter: (value: string, index: number) => {
                return dataYearSet.has(years[index]) ? value : "";
              },
            },
          };
        })(),
      yAxis: {
        type: "value" as const,
        scale: true,
        splitNumber: 4,
        axisLabel: {
          color: "rgba(255,255,255,0.4)",
          fontSize: 12,
          formatter: (v: number) => formatValueWithUnit(v),
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          show: true,
          lineStyle: { color: "rgba(255,255,255,0.04)", type: "dashed" as const },
        },
      },
      dataZoom: [
        { type: "inside" as const, xAxisIndex: 0, start: 0, end: 100 },
      ],
      series: chartSeries,
    };
  }, [series, events, width, denomination, title, locale]);

  if (series.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-text-muted text-xs"
        style={{ width, height }}
      >
        No data
      </div>
    );
  }

  if (!option) {
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
    <div style={{ width }}>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ width, height }}
        opts={{ renderer: "canvas" }}
        notMerge
        lazyUpdate
      />
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-1 px-1">
        {series.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
