"use client";

import React, { useMemo, useRef } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export interface PopulationDataPoint {
  year: number;
  population: number;
}

interface PopulationTrendChartProps {
  data: PopulationDataPoint[];
  height?: number;
  color?: string;
  title?: string;
  formatValue?: (v: number) => string;
}

function defaultFormat(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatYearShort(year: number): string {
  if (year < 0) return `${Math.abs(year)}BC`;
  return `${year}`;
}

export default function PopulationTrendChart({
  data,
  height = 140,
  color = "#f59e0b",
  title,
  formatValue = defaultFormat,
}: PopulationTrendChartProps) {
  const chartRef = useRef<ReactEChartsCore>(null);

  const startPop = data.length > 0 ? data[0].population : 0;
  const endPop = data.length > 0 ? data[data.length - 1].population : 0;
  const pctChange =
    data.length >= 2 && startPop !== 0
      ? ((endPop - startPop) / Math.abs(startPop)) * 100
      : null;

  const option = useMemo(() => {
    if (data.length === 0) return {};

    const years = data.map((d) => formatYearShort(d.year));
    const values = data.map((d) => d.population);

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || maxVal * 0.1 || 1;
    const yMin = Math.max(0, minVal - range * 0.15);

    const maxLabelCount = 6;
    const xInterval = data.length <= maxLabelCount ? 0 : Math.ceil(data.length / maxLabelCount) - 1;

    return {
      grid: {
        left: 8,
        right: 16,
        top: 14,
        bottom: 24,
        containLabel: true,
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
        formatter: (params: { axisValue: string; value: number }[]) => {
          if (!Array.isArray(params) || params.length === 0) return "";
          const p = params[0];
          return `<div style="font-size:12px"><span style="color:#9ca3af">${p.axisValue}</span> <b style="color:${color}">${formatValue(p.value)}</b></div>`;
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
          interval: xInterval,
          rotate: data.length > 10 ? 30 : 0,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value" as const,
        min: yMin,
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
          type: "line",
          data: values,
          smooth: 0.3,
          symbol: "circle",
          symbolSize: data.length <= 12 ? 6 : 4,
          lineStyle: {
            color,
            width: 2,
            shadowBlur: 4,
            shadowColor: color + "40",
          },
          itemStyle: {
            color,
            borderColor: "rgba(30,22,17,0.8)",
            borderWidth: 1.5,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color + "20" },
              { offset: 0.7, color: color + "08" },
              { offset: 1, color: "transparent" },
            ]),
          },
          emphasis: {
            itemStyle: {
              borderColor: "#fff",
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: color + "80",
            },
          },
        },
      ],
    };
  }, [data, color, formatValue]);

  if (data.length === 0) {
    return null;
  }

  const pctColor = pctChange != null ? (pctChange >= 0 ? "#4ade80" : "#f87171") : undefined;

  return (
    <div className="w-full">
      {title && (
        <div className="flex items-center justify-between mb-1 px-0.5">
          <span className="text-xs font-semibold text-text-secondary">{title}</span>
          {pctChange != null && (
            <span className="text-xs font-mono" style={{ color: pctColor }}>
              {pctChange >= 0 ? "+" : ""}
              {pctChange.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <ReactEChartsCore
        ref={chartRef}
        echarts={echarts}
        option={option}
        style={{ width: "100%", height }}
        opts={{ renderer: "canvas" }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
