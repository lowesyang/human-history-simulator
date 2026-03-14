/**
 * Shared chart axis utilities.
 *
 * All charts in the economic panel should use these helpers to ensure
 * consistent, non-overlapping x-axis labels.
 */

/**
 * Compute the numeric `interval` for an ECharts category axis so that
 * labels never overlap.
 *
 * @param labelCount  Total number of category labels
 * @param chartWidth  Pixel width available for the plot area (grid width,
 *                    i.e. total chart width minus left/right grid margins)
 * @param charWidth   Estimated pixel width per character at the given fontSize.
 *                    At fontSize 12 with 45° rotation, ~7px per char is safe.
 * @param maxLabelLen Longest label length in characters (default 8 for "2000 BCE")
 */
export function computeAxisInterval(
  labelCount: number,
  chartWidth: number,
  charWidth = 7,
  maxLabelLen = 8,
): number {
  if (labelCount <= 1) return 0;
  const labelPx = maxLabelLen * charWidth;
  const gap = 12;
  const maxVisible = Math.max(2, Math.floor(chartWidth / (labelPx + gap)));
  const interval = Math.max(0, Math.ceil(labelCount / maxVisible) - 1);
  return interval;
}

/**
 * Build a standard x-axis config for a category-type time axis.
 * Handles rotation and interval automatically based on chart width.
 *
 * @param yearLabels  Array of formatted year strings
 * @param plotWidth   Available pixel width of the plot area
 */
export function buildCategoryXAxis(
  yearLabels: string[],
  plotWidth: number,
) {
  const total = yearLabels.length;
  const maxLen = Math.max(...yearLabels.map((l) => l.length), 4);
  const interval = computeAxisInterval(total, plotWidth, 7, maxLen);
  const shouldRotate = interval >= 1 && total > 4;

  return {
    type: "category" as const,
    data: yearLabels,
    boundaryGap: false,
    axisLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
    axisTick: { show: false },
    axisLabel: {
      color: "rgba(255,255,255,0.4)",
      fontSize: 12,
      margin: 8,
      rotate: shouldRotate ? 45 : 0,
      interval,
    },
    splitLine: { show: false },
  };
}

/**
 * Compute the extra bottom margin needed when x-axis labels are rotated.
 * Accounts for the diagonal text height at 45°.
 */
export function rotatedLabelBottomMargin(
  yearLabels: string[],
  plotWidth: number,
): number {
  const maxLen = Math.max(...yearLabels.map((l) => l.length), 4);
  const interval = computeAxisInterval(yearLabels.length, plotWidth, 7, maxLen);
  const shouldRotate = interval >= 1 && yearLabels.length > 4;
  return shouldRotate ? 28 : 0;
}
