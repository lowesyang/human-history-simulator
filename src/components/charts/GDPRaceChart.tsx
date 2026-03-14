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

export interface GDPRaceChartProps {
  rankings: {
    regionId: string;
    regionName: string;
    value: number;
    color?: string;
  }[];
  currentYear: number;
  denomLabel?: string;
  locale?: string;
  width?: number;
  height?: number;
  topN?: number;
  onRegionClick?: (regionId: string) => void;
}

function formatValue(value: number): string {
  if (Math.abs(value) >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (value === 0) return "0";
  return value.toFixed(1);
}

const PALETTE = [
  "#D4A853", "#cd7f32", "#e6a23c", "#c0956e", "#b8860b",
  "#daa520", "#d2691e", "#8b6914", "#bdb76b", "#f0e68c",
  "#eeb35a", "#c9a562", "#a67b5b", "#9b870c", "#8b7e66",
];

export default function GDPRaceChart({
  rankings,
  currentYear,
  denomLabel,
  locale,
  width = 488,
  height = 400,
  topN = 15,
  onRegionClick,
}: GDPRaceChartProps) {
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
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);

    const reversed = [...display].reverse();
    const medals = ["🥇", "🥈", "🥉"];
    const categories = reversed.map((r, i) => {
      const rank = reversed.length - i;
      return rank <= 3 ? `${medals[rank - 1]} ${r.regionName}` : r.regionName;
    });

    const maxVal = display[0]?.value ?? 1;

    const data = reversed.map((r, i) => ({
      value: r.value,
      regionId: r.regionId,
      regionName: r.regionName,
      rank: display.length - i,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: PALETTE[i % PALETTE.length] + "CC" },
          { offset: 1, color: PALETTE[i % PALETTE.length] },
        ]),
        borderRadius: [0, 3, 3, 0],
      },
    }));

    const barHeight = Math.min(24, Math.max(14, Math.floor((height - 80) / display.length)));
    const longestName = Math.max(...categories.map((c) => c.length));
    const leftMargin = Math.min(140, Math.max(80, longestName * 8));

    const titleText = locale === "zh"
      ? `${currentYear}年全球GDP排名`
      : `${currentYear} Global GDP Ranking`;

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
        right: 24,
        top: 36,
        bottom: 24,
        containLabel: false,
      },
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: "rgba(20, 18, 16, 0.95)",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: "rgba(255,255,255,0.9)", fontSize: 12 },
        axisPointer: {
          type: "shadow" as const,
          shadowStyle: { color: "rgba(255,255,255,0.03)" },
        },
        formatter: (params: { data: { rank: number; value: number; regionName: string } }[]) => {
          if (!Array.isArray(params) || params.length === 0) return "";
          const p = params[0];
          const d = p.data as { rank?: number; value?: number; regionName?: string };
          const rank = d?.rank ?? 0;
          const value = d?.value ?? 0;
          const name = d?.regionName ?? "";
          const unit = denomLabel || "kg gold";
          return `<div style="font-size:12px">
            <div style="margin-bottom:4px;color:rgba(255,255,255,0.6)">${name}</div>
            <div>Rank: <b>#${rank}</b></div>
            <div>GDP: <b>${formatValue(value)} ${unit}</b></div>
          </div>`;
        },
      },
      xAxis: {
        type: "value" as const,
        max: maxVal * 1.15,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "rgba(255,255,255,0.4)",
          fontSize: 12,
          formatter: (v: number) => formatValue(v),
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
              formatValue(params.data.value),
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
  }, [rankings, currentYear, topN, height, denomLabel, locale]);

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
