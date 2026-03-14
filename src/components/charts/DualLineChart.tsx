"use client";

import React, { useMemo, useRef } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

export interface DualLineDataPoint {
  year: number;
  side1Value: number;
  side2Value: number;
}

interface DualLineChartProps {
  data: DualLineDataPoint[];
  width?: number;
  height?: number;
  side1Color?: string;
  side2Color?: string;
  side1Label?: string;
  side2Label?: string;
  formatValue?: (value: number) => string;
  showWarStart?: boolean;
  warStartYear?: number;
  title?: string;
}

function formatYearShort(year: number): string {
  if (year < 0) return `${Math.abs(year)}BC`;
  return `${year}`;
}

export default function DualLineChart({
  data,
  width = 280,
  height = 120,
  side1Color = "#f87171",
  side2Color = "#60a5fa",
  side1Label = "Side 1",
  side2Label = "Side 2",
  formatValue = defaultFormat,
  showWarStart = false,
  warStartYear,
  title,
}: DualLineChartProps) {
  const chartRef = useRef<ReactEChartsCore>(null);

  const s1Start = data.length > 0 ? data[0].side1Value : 0;
  const s1End = data.length > 0 ? data[data.length - 1].side1Value : 0;
  const s2Start = data.length > 0 ? data[0].side2Value : 0;
  const s2End = data.length > 0 ? data[data.length - 1].side2Value : 0;

  const hasMeaningfulChange = data.length >= 2 && (s1Start !== s1End || s2Start !== s2End);
  const s1Pct = hasMeaningfulChange && s1Start !== 0 ? ((s1End - s1Start) / Math.abs(s1Start)) * 100 : null;
  const s2Pct = hasMeaningfulChange && s2Start !== 0 ? ((s2End - s2Start) / Math.abs(s2Start)) * 100 : null;

  const option = useMemo(() => {
    if (data.length === 0) return {};

    const years = data.map((d) => formatYearShort(d.year));
    const side1Data = data.map((d) => d.side1Value);
    const side2Data = data.map((d) => d.side2Value);

    const markLineData: { xAxis: number }[] = [];
    if (showWarStart && warStartYear != null) {
      const idx = data.findIndex((d) => d.year >= warStartYear);
      if (idx >= 0) {
        markLineData.push({ xAxis: idx });
      }
    }

    return {
      grid: {
        left: 40,
        right: 16,
        top: 14,
        bottom: 24,
        containLabel: false,
      },
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: "rgba(20, 18, 16, 0.95)",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: "#e5e5e5", fontSize: 12 },
        axisPointer: {
          type: "line" as const,
          lineStyle: { color: "rgba(255,255,255,0.15)", type: "dashed" as const, width: 1 },
        },
        formatter: (params: { axisValue: string; marker: string; seriesName: string; value: number }[]) => {
          if (!Array.isArray(params) || params.length === 0) return "";
          const yearLabel = params[0].axisValue;
          const lines = params.map(
            (p: { marker: string; seriesName: string; value: number }) =>
              `<div style="display:flex;align-items:center;gap:6px;margin-top:3px">${p.marker}<span style="flex:1">${p.seriesName}</span><b>${formatValue(p.value)}</b></div>`
          );
          return `<div style="font-size:12px;color:#9ca3af;margin-bottom:2px">${yearLabel}</div>${lines.join("")}`;
        },
      },
      xAxis: {
        type: "category" as const,
        data: years,
        boundaryGap: true,
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
        axisTick: { show: false },
        axisLabel: {
          color: "rgba(255,255,255,0.4)",
          fontSize: 12,
          margin: 8,
          interval: data.length <= 10 ? 0 : "auto",
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value" as const,
        scale: true,
        splitNumber: 3,
        axisLabel: {
          show: true,
          color: "rgba(255,255,255,0.25)",
          fontSize: 12,
          formatter: (v: number) => formatValue(v),
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          show: true,
          lineStyle: { color: "rgba(255,255,255,0.04)", type: "dashed" as const },
        },
      },
      series: [
        {
          name: side1Label,
          type: "line",
          data: side1Data,
          smooth: 0.3,
          symbol: "circle",
          symbolSize: data.length <= 12 ? 6 : 4,
          lineStyle: { color: side1Color, width: 2, shadowBlur: 4, shadowColor: side1Color + "40" },
          itemStyle: { color: side1Color, borderColor: "rgba(30,22,17,0.8)", borderWidth: 1.5 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: side1Color + "18" },
              { offset: 0.7, color: side1Color + "06" },
              { offset: 1, color: "transparent" },
            ]),
          },
          emphasis: {
            itemStyle: {
              borderColor: "#fff",
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: side1Color + "80",
            },
          },
          ...(markLineData.length > 0
            ? {
              markLine: {
                silent: true,
                symbol: "none",
                lineStyle: { color: "#fbbf24", type: "dashed" as const, width: 1, opacity: 0.45 },
                data: markLineData,
                label: { show: false },
              },
            }
            : {}),
        },
        {
          name: side2Label,
          type: "line",
          data: side2Data,
          smooth: 0.3,
          symbol: "circle",
          symbolSize: data.length <= 12 ? 6 : 4,
          lineStyle: { color: side2Color, width: 2, shadowBlur: 4, shadowColor: side2Color + "40" },
          itemStyle: { color: side2Color, borderColor: "rgba(30,22,17,0.8)", borderWidth: 1.5 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: side2Color + "18" },
              { offset: 0.7, color: side2Color + "06" },
              { offset: 1, color: "transparent" },
            ]),
          },
          emphasis: {
            itemStyle: {
              borderColor: "#fff",
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: side2Color + "80",
            },
          },
        },
      ],
    };
  }, [data, side1Color, side2Color, side1Label, side2Label, formatValue, showWarStart, warStartYear]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-text-muted text-xs" style={{ width, height }}>
        No data
      </div>
    );
  }

  const pctColor = (v: number | null) => {
    if (v == null) return undefined;
    return v >= 0 ? "#4ade80" : "#f87171";
  };

  return (
    <div style={{ width }}>
      {title && (
        <div className="flex items-center justify-between mb-1 px-0.5">
          <span className="text-xs font-semibold text-text-secondary">{title}</span>
          <div className="flex items-center gap-2">
            {s1Pct != null ? (
              <span className="text-xs font-mono" style={{ color: pctColor(s1Pct) }}>
                {s1Pct >= 0 ? "+" : ""}{s1Pct.toFixed(1)}%
              </span>
            ) : data.length >= 1 ? (
              <span className="text-xs font-mono" style={{ color: side1Color, opacity: 0.7 }}>
                {formatValue(s1End)}
              </span>
            ) : null}
            {s2Pct != null ? (
              <span className="text-xs font-mono" style={{ color: pctColor(s2Pct) }}>
                {s2Pct >= 0 ? "+" : ""}{s2Pct.toFixed(1)}%
              </span>
            ) : data.length >= 1 ? (
              <span className="text-xs font-mono" style={{ color: side2Color, opacity: 0.7 }}>
                {formatValue(s2End)}
              </span>
            ) : null}
          </div>
        </div>
      )}
      <ReactEChartsCore
        ref={chartRef}
        echarts={echarts}
        option={option}
        style={{ width, height }}
        opts={{ renderer: "canvas" }}
        notMerge
        lazyUpdate
      />
      {/* Legend rendered outside chart to avoid overlap with axis labels */}
      <div className="flex items-center justify-center gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: side1Color }} />
          <span className="text-xs text-text-muted">{side1Label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: side2Color }} />
          <span className="text-xs text-text-muted">{side2Label}</span>
        </div>
      </div>
    </div>
  );
}

export function Sparkline({
  values,
  years,
  width = 80,
  height = 20,
  color = "#f87171",
  formatValue: fmtVal,
}: {
  values: number[];
  years?: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  formatValue?: (v: number) => string;
}) {
  const fmt = fmtVal ?? defaultFormat;
  const option = useMemo(() => {
    if (values.length < 2) return {};
    const labels = years ?? values.map((_, i) => i);
    const hasYears = !!years && years.length === values.length;
    return {
      grid: { left: 0, right: 0, top: 2, bottom: 2 },
      xAxis: { type: "category" as const, show: false, data: labels },
      yAxis: { type: "value" as const, show: false, scale: true },
      series: [
        {
          type: "line",
          data: values,
          smooth: 0.4,
          symbol: "none",
          lineStyle: { color, width: 1.2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color + "28" },
              { offset: 1, color: color + "04" },
            ]),
          },
        },
      ],
      tooltip: hasYears
        ? {
          trigger: "axis" as const,
          backgroundColor: "rgba(20, 18, 16, 0.95)",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          padding: [4, 8],
          textStyle: { color: "#e5e5e5", fontSize: 12 },
          axisPointer: {
            type: "line" as const,
            lineStyle: { color: "rgba(255,255,255,0.15)", width: 1 },
          },
          formatter: (params: { axisValue: string; value: number }[]) => {
            if (!Array.isArray(params) || params.length === 0) return "";
            const p = params[0];
            return `<div style="font-size:12px"><span style="color:#9ca3af">${p.axisValue}</span> <b style="color:${color}">${fmt(p.value)}</b></div>`;
          },
        }
        : { show: false },
    };
  }, [values, years, color, fmt]);

  if (values.length < 2) return null;

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

function defaultFormat(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(1);
}
