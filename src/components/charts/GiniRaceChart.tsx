"use client";

import React, { useCallback, useMemo } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  CanvasRenderer,
]);

export interface GiniRaceChartProps {
  rankings: {
    regionId: string;
    regionName: string;
    value: number;
  }[];
  currentYear: number;
  locale?: string;
  width?: number;
  height?: number;
  topN?: number;
  onRegionClick?: (regionId: string) => void;
}

function giniLabel(gini: number, isZh: boolean): string {
  if (gini >= 0.55) return isZh ? "极端" : "Extreme";
  if (gini >= 0.45) return isZh ? "不平等" : "Unequal";
  if (gini >= 0.3) return isZh ? "适度" : "Moderate";
  return isZh ? "平等" : "Equal";
}

function giniColor(gini: number): string {
  if (gini >= 0.55) return "#ef4444";
  if (gini >= 0.45) return "#f97316";
  if (gini >= 0.3) return "#eab308";
  return "#22c55e";
}

export default function GiniRaceChart({
  rankings,
  currentYear,
  locale,
  width = 488,
  height = 340,
  topN = 10,
  onRegionClick,
}: GiniRaceChartProps) {
  const isZh = locale === "zh";

  const onChartClick = useCallback(
    (params: { data?: { regionId?: string } }) => {
      const regionId = params?.data?.regionId;
      if (regionId && onRegionClick) {
        onRegionClick(regionId);
      }
    },
    [onRegionClick]
  );

  const option = useMemo(() => {
    const filtered = rankings.filter((r) => r.value > 0);
    if (filtered.length === 0) return {};

    const display = [...filtered]
      .sort((a, b) => a.value - b.value)
      .slice(0, topN);

    const reversed = [...display].reverse();
    const medals = ["🥇", "🥈", "🥉"];
    const categories = reversed.map((r, i) => {
      const rank = reversed.length - i;
      return rank <= 3 ? `${medals[rank - 1]} ${r.regionName}` : r.regionName;
    });

    const data = reversed.map((r, i) => ({
      value: r.value,
      regionId: r.regionId,
      regionName: r.regionName,
      rank: display.length - i,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: giniColor(r.value) + "AA" },
          { offset: 1, color: giniColor(r.value) },
        ]),
        borderRadius: [0, 3, 3, 0],
      },
    }));

    const barHeight = Math.min(22, Math.max(14, Math.floor((height - 80) / display.length)));
    const longestName = Math.max(...categories.map((c) => c.length));
    const leftMargin = Math.min(140, Math.max(80, longestName * 8));

    const titleText = isZh
      ? `${currentYear}年 基尼系数排名`
      : `${currentYear} Gini Coefficient Ranking`;

    const rankLabel = isZh ? "排名" : "Rank";
    const giniStr = isZh ? "基尼系数" : "Gini";

    return {
      backgroundColor: "transparent",
      animationDuration: 600,
      animationEasing: "cubicOut",
      title: {
        text: titleText,
        left: "center",
        top: 4,
        textStyle: {
          color: "rgba(255,255,255,0.6)",
          fontSize: 14,
          fontWeight: 500,
        },
      },
      grid: {
        left: leftMargin,
        right: 50,
        top: 36,
        bottom: 24,
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
          type: "shadow" as const,
          shadowStyle: { color: "rgba(255,255,255,0.03)" },
        },
        formatter: (
          params: {
            data: { rank: number; value: number; regionName: string };
          }[]
        ) => {
          if (!Array.isArray(params) || params.length === 0) return "";
          const p = params[0];
          const d = p.data as {
            rank?: number;
            value?: number;
            regionName?: string;
          };
          const rank = d?.rank ?? 0;
          const value = d?.value ?? 0;
          const name = d?.regionName ?? "";
          const label = giniLabel(value, isZh);
          return `<div style="font-size:12px">
            <div style="margin-bottom:4px;color:rgba(255,255,255,0.6)">${name}</div>
            <div>${rankLabel}: <b>#${rank}</b></div>
            <div>${giniStr}: <b>${value.toFixed(3)}</b> <span style="color:${giniColor(value)}">(${label})</span></div>
          </div>`;
        },
      },
      xAxis: {
        type: "value" as const,
        max: 1,
        min: 0,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "rgba(255,255,255,0.4)",
          fontSize: 12,
          formatter: (v: number) => v.toFixed(2),
        },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } },
      },
      yAxis: {
        type: "category" as const,
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "rgba(255,255,255,0.6)",
          fontSize: 12,
          overflow: "truncate" as const,
          width: leftMargin - 12,
        },
      },
      series: [
        {
          type: "bar",
          data,
          barWidth: barHeight,
          label: {
            show: true,
            position: "right" as const,
            color: "rgba(255,255,255,0.5)",
            fontSize: 12,
            formatter: (params: { data: { value: number } }) =>
              params.data.value.toFixed(3),
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(212, 168, 83, 0.3)",
            },
          },
        },
      ],
    };
  }, [rankings, currentYear, topN, height, isZh]);

  if (rankings.filter((r) => r.value > 0).length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs"
        style={{
          width,
          height,
          color: "rgba(255,255,255,0.6)",
        }}
      >
        No data
      </div>
    );
  }

  const onEvents = useMemo(
    () => (onRegionClick ? { click: onChartClick } : undefined),
    [onRegionClick, onChartClick]
  );

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ width, height, cursor: onRegionClick ? "pointer" : undefined }}
      opts={{ renderer: "canvas" }}
      notMerge
      lazyUpdate
      onEvents={onEvents}
    />
  );
}
