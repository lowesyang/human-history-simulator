"use client";

import type { Region } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import MonetaryDisplay from "./MonetaryDisplay";
import DataTable from "./DataTable";

export default function FinancesTab({ region }: { region: Region }) {
  const { t, localized } = useLocale();
  const fin = region.finances;

  const surplusPositive = (fin.surplus?.amount ?? 0) >= 0;

  return (
    <div className="space-y-4 text-xs">
      {/* Revenue vs Expenditure */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded p-2 bg-bg-tertiary">
          <div className="text-xs text-text-muted">
            {t("finances.revenue")}
          </div>
          <MonetaryDisplay value={fin.annualRevenue} />
        </div>
        <div className="rounded p-2 bg-bg-tertiary">
          <div className="text-xs text-text-muted">
            {t("finances.expenditure")}
          </div>
          <MonetaryDisplay value={fin.annualExpenditure} />
        </div>
      </div>

      {/* Surplus/Deficit */}
      <div
        className="rounded p-2 text-center"
        style={{
          background: surplusPositive ? "rgba(46,107,79,0.2)" : "rgba(139,58,58,0.2)",
          border: `1px solid ${surplusPositive ? "#2e6b4f" : "#8b3a3a"}`,
        }}
      >
        <div className="text-xs text-text-muted">
          {surplusPositive ? t("finances.surplus") : t("finances.deficit")}
        </div>
        <MonetaryDisplay value={fin.surplus} />
      </div>

      {/* Revenue breakdown */}
      {fin.revenueBreakdown && fin.revenueBreakdown.length > 0 && (
        <div>
          <h4 className="font-semibold mb-1.5 text-accent-copper">
            {t("finances.revenueBreakdown")}
          </h4>
          <DataTable
            columns={[
              { key: "source", label: t("table.source"), width: "40%" },
              { key: "amount", label: t("table.amount"), width: "35%" },
              { key: "pct", label: "%", width: "25%" },
            ]}
            rows={fin.revenueBreakdown.map((r) => ({
              source: localized(r.source),
              amount: <MonetaryDisplay value={r.amount} compact />,
              pct: (
                <div className="flex items-center gap-1">
                  <div className="h-1.5 rounded bg-status-trade" style={{ width: `${r.percentage}%`, maxWidth: "60px" }} />
                  <span>{r.percentage}%</span>
                </div>
              ),
            }))}
          />
        </div>
      )}

      {/* Expenditure breakdown */}
      {fin.expenditureBreakdown && fin.expenditureBreakdown.length > 0 && (
        <div>
          <h4 className="font-semibold mb-1.5 text-accent-copper">
            {t("finances.expenditureBreakdown")}
          </h4>
          <DataTable
            columns={[
              { key: "category", label: t("table.category"), width: "40%" },
              { key: "amount", label: t("table.amount"), width: "35%" },
              { key: "pct", label: "%", width: "25%" },
            ]}
            rows={fin.expenditureBreakdown.map((e) => ({
              category: localized(e.category),
              amount: <MonetaryDisplay value={e.amount} compact />,
              pct: (
                <div className="flex items-center gap-1">
                  <div className="h-1.5 rounded bg-status-war" style={{ width: `${e.percentage}%`, maxWidth: "60px" }} />
                  <span>{e.percentage}%</span>
                </div>
              ),
            }))}
          />
        </div>
      )}

      {/* Treasury */}
      <div>
        <h4 className="font-semibold mb-1.5 text-accent-copper">
          {t("finances.treasury")}
        </h4>
        <MonetaryDisplay value={fin.treasury} />
        <p className="mt-1 text-text-secondary">
          {localized(fin.treasuryDescription)}
        </p>
      </div>

      {/* Fiscal policy */}
      <div>
        <h4 className="font-semibold mb-1.5 text-accent-copper">
          {t("finances.policy")}
        </h4>
        <p className="text-text-secondary">{localized(fin.fiscalPolicy)}</p>
      </div>
    </div>
  );
}
