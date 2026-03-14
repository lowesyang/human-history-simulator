"use client";

import { useState } from "react";
import type { Region, Faction } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import DataTable from "./DataTable";

const STATUS_COLORS: Record<Faction["status"], string> = {
  ruling: "#22c55e",
  opposition: "#eab308",
  insurgent: "#ef4444",
  underground: "#8b5cf6",
  allied: "#3b82f6",
  rival: "#f97316",
};

export default function FactionsTab({ region }: { region: Region }) {
  const { t, localized } = useLocale();
  const factions = region.factions ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(
    factions[0]?.id ?? null
  );

  if (factions.length === 0) {
    return (
      <div className="text-xs text-text-muted py-8 text-center">
        {t("factions.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {factions.map((faction) => {
        const isExpanded = expandedId === faction.id;
        return (
          <FactionCard
            key={faction.id}
            faction={faction}
            isExpanded={isExpanded}
            onToggle={() =>
              setExpandedId(isExpanded ? null : faction.id)
            }
            localized={localized}
            t={t}
          />
        );
      })}
    </div>
  );
}

function FactionCard({
  faction,
  isExpanded,
  onToggle,
  localized,
  t,
}: {
  faction: Faction;
  isExpanded: boolean;
  onToggle: () => void;
  localized: (text: { zh: string; en: string } | undefined) => string;
  t: (key: string) => string;
}) {
  const statusColor = STATUS_COLORS[faction.status] ?? "#9ca3af";

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-tertiary/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-bg-tertiary/80 transition-colors"
      >
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: statusColor }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-text-primary truncate">
            {localized(faction.name)}
          </div>
          <div className="text-text-muted mt-0.5">
            {localized(faction.leader)}
            {faction.leaderTitle && (
              <span className="text-text-muted">
                {" · "}
                {localized(faction.leaderTitle)}
              </span>
            )}
          </div>
        </div>
        <span
          className="text-[12px] px-1.5 py-0.5 rounded shrink-0"
          style={{
            background: `${statusColor}20`,
            color: statusColor,
          }}
        >
          {t(`factions.status.${faction.status}`)}
        </span>
        <span
          className={`text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""
            }`}
        >
          ▾
        </span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border-subtle pt-2">
          <div className="readable-prose">
            {localized(faction.description)}
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {faction.ideology && (
              <InfoRow
                label={t("factions.ideology")}
                value={localized(faction.ideology)}
              />
            )}
            <InfoRow
              label={t("factions.type")}
              value={t(`factions.typeLabel.${faction.type}`)}
            />
            {faction.headquarters && (
              <InfoRow
                label={t("factions.headquarters")}
                value={localized(faction.headquarters)}
              />
            )}
            {faction.foundedYear != null && (
              <InfoRow
                label={t("factions.founded")}
                value={
                  faction.foundedYear < 0
                    ? `${Math.abs(faction.foundedYear)} BCE`
                    : `${faction.foundedYear}`
                }
              />
            )}
            {faction.controlledArea && (
              <InfoRow
                label={t("factions.controlledArea")}
                value={localized(faction.controlledArea)}
                full
              />
            )}
          </div>

          {faction.militaryStrength && (
            <div>
              <h5 className="font-semibold text-accent-copper mb-1">
                {t("factions.military")}
              </h5>
              <div className="flex items-center gap-3">
                <span className="text-text-muted">
                  {t("military.total")}:
                </span>
                <span className="text-text-primary font-mono">
                  {faction.militaryStrength.troops.toLocaleString()}
                </span>
              </div>
              <p className="text-text-secondary mt-0.5">
                {localized(faction.militaryStrength.description)}
              </p>
            </div>
          )}

          {faction.population != null && faction.population > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-text-muted">
                {t("factions.population")}:
              </span>
              <span className="text-text-primary font-mono">
                {faction.population.toLocaleString()}
              </span>
            </div>
          )}

          <div>
            <h5 className="font-semibold text-accent-copper mb-1">
              {t("factions.relationship")}
            </h5>
            <p className="text-text-secondary">
              {localized(faction.relationship)}
            </p>
          </div>

          {faction.keyFigures && faction.keyFigures.length > 0 && (
            <div>
              <h5 className="font-semibold text-accent-copper mb-1">
                {t("factions.keyFigures")}
              </h5>
              <DataTable
                columns={[
                  { key: "name", label: t("table.name") },
                  { key: "title", label: t("table.title") },
                  { key: "role", label: t("table.role") },
                ]}
                rows={faction.keyFigures.map((f) => ({
                  name: localized(f.name),
                  title: localized(f.title),
                  role: localized(f.role),
                }))}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={`py-0.5 ${full ? "col-span-2" : ""}`}>
      <span className="text-text-muted">{label}: </span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
