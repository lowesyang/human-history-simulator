"use client";

import type { Region } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import MonetaryDisplay from "./MonetaryDisplay";
import DataTable from "./DataTable";
import StatBar from "./StatBar";

export default function MilitaryTab({ region }: { region: Region }) {
  const { t, localized } = useLocale();
  const mil = region.military;

  return (
    <div className="space-y-4 text-xs">
      <div className="space-y-2">
        <StatBar label={t("info.military")} value={mil.level} color="#CD5C5C" />
        <div className="grid grid-cols-3 gap-2 text-center">
          <StatBlock label={t("military.total")} value={mil.totalTroops.toLocaleString()} />
          <StatBlock label={t("military.standing")} value={mil.standingArmy.toLocaleString()} />
          <StatBlock label={t("military.reserves")} value={mil.reserves.toLocaleString()} />
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-1.5 text-accent-copper">
          {t("military.branches")}
        </h4>
        <DataTable
          columns={[
            { key: "name", label: t("table.branch"), width: "25%" },
            { key: "count", label: t("table.count"), width: "15%" },
            { key: "desc", label: t("table.description"), width: "60%" },
          ]}
          rows={(mil.branches || []).map((b) => ({
            name: localized(b.name),
            count: b.count.toLocaleString(),
            desc: localized(b.description),
          }))}
        />
      </div>

      <div>
        <h4 className="font-semibold mb-1.5 text-accent-copper">
          {t("military.commanders")}
        </h4>
        <div className="text-text-secondary">
          {mil.commandStructure.commanderInChief && (
            <div className="mb-1">
              {t("military.commanderInChief")}: {localized(mil.commandStructure.commanderInChief)}
            </div>
          )}
          <div className="mb-1">
            {t("military.generals")}: {mil.commandStructure.totalGenerals}
          </div>
          {mil.commandStructure.keyGenerals && mil.commandStructure.keyGenerals.length > 0 && (
            <DataTable
              columns={[
                { key: "name", label: t("table.name") },
                { key: "title", label: t("table.title") },
                { key: "command", label: t("table.command") },
              ]}
              rows={mil.commandStructure.keyGenerals.map((g) => ({
                name: localized(g.name),
                title: localized(g.title),
                command: localized(g.command),
              }))}
            />
          )}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-1.5 text-accent-copper">
          {t("info.technology")}
        </h4>
        <p className="text-text-secondary">{localized(mil.technology)}</p>
      </div>

      <div>
        <h4 className="font-semibold mb-1.5 text-accent-copper">
          {t("military.spending")}
        </h4>
        <MonetaryDisplay value={mil.annualMilitarySpending} />
        <div className="mt-1 text-text-muted">
          {t("military.gdpPct").replace("{pct}", String(mil.militarySpendingPctGdp))}
        </div>
      </div>

      {mil.threats && (
        <div>
          <h4 className="font-semibold mb-1.5 text-[#CD5C5C]">
            {t("military.threats")}
          </h4>
          <p className="text-text-secondary">{localized(mil.threats)}</p>
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded p-2 bg-bg-tertiary">
      <div className="font-mono font-semibold text-text-primary">
        {value}
      </div>
      <div className="text-xs text-text-muted">
        {label}
      </div>
    </div>
  );
}
