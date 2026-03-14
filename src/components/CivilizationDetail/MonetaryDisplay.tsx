"use client";

import { useLocale } from "@/lib/i18n";
import { fmtNum, fmtKg } from "@/lib/format-number";
import type { MonetaryValue } from "@/lib/types";

export default function MonetaryDisplay({
  value,
  compact = false,
}: {
  value: MonetaryValue | undefined;
  compact?: boolean;
}) {
  const { locale, localized } = useLocale();

  if (!value) return <span className="text-text-muted">—</span>;

  const unitStr = localized(value.unit);
  const amount =
    typeof value.amount === "number"
      ? fmtNum(value.amount, locale)
      : value.amount;

  const goldLabel = locale === "zh" ? "黄金" : " gold";
  const silverLabel = locale === "zh" ? "白银" : " silver";

  if (compact) {
    return (
      <span className="text-text-primary">
        {amount} {unitStr}
      </span>
    );
  }

  return (
    <div>
      <div className="text-text-primary">
        {amount} {unitStr}
      </div>
      <div className="text-xs text-text-muted">
        {value.goldKg != null && value.goldKg !== 0 && (
          <span>≈ {fmtKg(Math.abs(value.goldKg), locale)}{goldLabel}</span>
        )}
        {value.silverKg != null && value.silverKg !== 0 && (
          <span className="ml-3">≈ {fmtKg(Math.abs(value.silverKg), locale)}{silverLabel}</span>
        )}
      </div>
      {value.displayNote && (
        <div className="text-xs italic text-text-muted">
          {localized(value.displayNote)}
        </div>
      )}
    </div>
  );
}
