"use client";

import { useLocale } from "@/lib/i18n";
import type { MonetaryValue } from "@/lib/types";

export default function MonetaryDisplay({
  value,
  compact = false,
}: {
  value: MonetaryValue | undefined;
  compact?: boolean;
}) {
  const { localized } = useLocale();

  if (!value) return <span className="text-text-muted">—</span>;

  const unitStr = localized(value.unit);
  const amount =
    typeof value.amount === "number"
      ? value.amount.toLocaleString()
      : value.amount;

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
      <div className="flex gap-3 text-xs text-text-muted">
        {value.goldKg != null && value.goldKg > 0 && (
          <span>≈ {value.goldKg.toLocaleString()} kg gold</span>
        )}
        {value.silverKg != null && value.silverKg > 0 && (
          <span>≈ {value.silverKg.toLocaleString()} kg silver</span>
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
