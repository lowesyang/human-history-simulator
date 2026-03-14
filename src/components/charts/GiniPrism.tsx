"use client";

import React, { useMemo } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkAreaComponent,
  TitleComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkAreaComponent,
  TitleComponent,
  CanvasRenderer,
]);

export interface GiniRegionSeries {
  id: string;
  name: string;
  color: string;
  data: { year: number; gini: number }[];
}

interface GiniPrismProps {
  series: GiniRegionSeries[];
  locale?: string;
  title?: string;
  width?: number;
  height?: number;
}

function formatYearLabel(year: number, locale?: string): string {
  if (year < 0) return locale === "zh" ? `公元前${Math.abs(year)}` : `${Math.abs(year)} BCE`;
  return `${year}`;
}

export default function GiniPrism({
  series,
  locale,
  title,
  width = 488,
  height = 300,
}: GiniPrismProps) {
  const isZh = locale === "zh";

  const zoneLabels = useMemo(
    () => ({
      equal: isZh ? "平等" : "Equal",
      moderate: isZh ? "适度" : "Moderate",
      unequal: isZh ? "不平等" : "Unequal",
      extreme: isZh ? "极端" : "Extreme",
    }),
    [isZh]
  );

  const option = useMemo(() => {
    if (series.length === 0) return null;

    const yearSet = new Set<number>();
    for (const s of series) {
      for (const d of s.data) yearSet.add(d.year);
    }
    const years = Array.from(yearSet).sort((a, b) => a - b);
    const yearLabels = years.map((y) => formatYearLabel(y, locale));

    const dataByYear = new Map<number, Map<string, number>>();
    for (const yr of years) dataByYear.set(yr, new Map());
    for (const s of series) {
      const byYear = new Map<number, number>();
      for (const d of s.data) byYear.set(d.year, d.gini);
      for (const yr of years) {
        const v = byYear.get(yr);
        if (v !== undefined) dataByYear.get(yr)!.set(s.id, v);
      }
    }

    const markAreaData = [
      [
        { yAxis: 0 },
        {
          yAxis: 0.3,
          itemStyle: { color: "rgba(34, 197, 94, 0.06)" },
          label: {
            formatter: zoneLabels.equal, show: true,
            color: "rgba(255,255,255,0.2)", fontSize: 12,
            position: "insideTopRight" as const, offset: [0, 2],
          },
        },
      ],
      [
        { yAxis: 0.3 },
        {
          yAxis: 0.45,
          itemStyle: { color: "rgba(234, 179, 8, 0.06)" },
          label: {
            formatter: zoneLabels.moderate, show: true,
            color: "rgba(255,255,255,0.2)", fontSize: 12,
            position: "insideTopRight" as const, offset: [0, 2],
          },
        },
      ],
      [
        { yAxis: 0.45 },
        {
          yAxis: 0.55,
          itemStyle: { color: "rgba(249, 115, 22, 0.06)" },
          label: {
            formatter: zoneLabels.unequal, show: true,
            color: "rgba(255,255,255,0.2)", fontSize: 12,
            position: "insideTopRight" as const, offset: [0, 2],
          },
        },
      ],
      [
        { yAxis: 0.55 },
        {
          yAxis: 1.0,
          itemStyle: { color: "rgba(239, 68, 68, 0.06)" },
          label: {
            formatter: zoneLabels.extreme, show: true,
            color: "rgba(255,255,255,0.2)", fontSize: 12,
            position: "insideBottomRight" as const, offset: [0, -2],
          },
        },
      ],
    ];

    const fewPoints = years.length <= 5;
    const giniLabel = isZh ? "基尼系数" : "Gini";

    const chartSeries = series.map((s, idx) => ({
      name: s.name,
      type: "line" as const,
      data: years.map((yr) => {
        const v = dataByYear.get(yr)?.get(s.id);
        return v !== undefined ? v : null;
      }),
      smooth: 0.3,
      symbol: fewPoints ? "circle" : "none",
      symbolSize: fewPoints ? 8 : 4,
      lineStyle: { color: s.color, width: 2 },
      itemStyle: { color: s.color },
      connectNulls: true,
      ...(idx === 0
        ? {
          markArea: {
            silent: true,
            data: markAreaData,
          },
        }
        : {}),
    }));

    const gridLeft = 48;
    const gridRight = 24;
    const plotWidth = (width ?? 488) - gridLeft - gridRight;

    const maxLen = Math.max(...yearLabels.map((l) => l.length), 4);
    const labelPx = maxLen * 7 + 16;
    const maxVisible = Math.max(2, Math.floor(plotWidth / labelPx));
    const step = Math.max(1, Math.ceil(years.length / maxVisible));
    const visibleSet = new Set<number>();
    for (let i = 0; i < years.length; i += step) visibleSet.add(i);
    visibleSet.add(years.length - 1);
    const needRotate = visibleSet.size > 6;
    const extraBottom = needRotate ? 28 : 0;

    return {
      backgroundColor: "transparent",
      title: {
        text: title || (isZh ? "基尼系数走势 (Top 10)" : "Gini Coefficient Trend (Top 10)"),
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
        top: 36,
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
        formatter: (
          params: {
            axisValue: string;
            marker: string;
            seriesName: string;
            value?: number | number[];
          }[]
        ) => {
          if (!Array.isArray(params) || params.length === 0) return "";
          const yearLabel = params[0].axisValue;
          const lines = params
            .filter(
              (p) => p.value != null && !Number.isNaN(p.value as number)
            )
            .sort((a, b) => (b.value as number) - (a.value as number))
            .map((p) => {
              const v = p.value as number;
              return `<div style="display:flex;align-items:center;gap:6px;margin-top:3px">${p.marker}<span style="flex:1">${p.seriesName}</span><b>${v.toFixed(3)}</b></div>`;
            });
          return `<div style="font-size:12px"><div style="color:rgba(255,255,255,0.4);margin-bottom:4px">${yearLabel} — ${giniLabel}</div>${lines.join("")}</div>`;
        },
      },
      xAxis: {
        type: "category" as const,
        data: yearLabels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
        axisTick: { show: false },
        axisLabel: {
          color: "rgba(255,255,255,0.4)",
          fontSize: 12,
          margin: 8,
          interval: 0,
          rotate: needRotate ? 45 : 0,
          formatter: (_value: string, index: number) =>
            visibleSet.has(index) ? yearLabels[index] : "",
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value" as const,
        min: 0,
        max: 1,
        splitNumber: 5,
        axisLabel: {
          color: "rgba(255,255,255,0.35)",
          fontSize: 12,
          formatter: (v: number) => v.toFixed(2),
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          show: true,
          lineStyle: {
            color: "rgba(255,255,255,0.06)",
            type: "dashed" as const,
          },
        },
      },
      dataZoom: [
        { type: "inside" as const, xAxisIndex: 0, start: 0, end: 100 },
      ],
      series: chartSeries,
    };
  }, [series, locale, title, width, isZh, zoneLabels]);

  if (series.length === 0 || !option) {
    return (
      <div
        className="flex items-center justify-center text-text-muted"
        style={{ width, height, fontSize: 12 }}
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
