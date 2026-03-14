"use client";

import type { Region } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import MonetaryDisplay from "./MonetaryDisplay";
import DataTable from "./DataTable";
import StatBar from "./StatBar";

function safeNum(v: unknown): number {
  return typeof v === "number" && !Number.isNaN(v) ? v : 0;
}

const GRADE_LABELS: Record<number, { zh: string; en: string }> = {
  1: { zh: "极弱", en: "Abysmal" },
  2: { zh: "低劣", en: "Poor" },
  3: { zh: "较弱", en: "Below Avg" },
  4: { zh: "一般", en: "Average" },
  5: { zh: "中等", en: "Moderate" },
  6: { zh: "良好", en: "Good" },
  7: { zh: "优秀", en: "Strong" },
  8: { zh: "精锐", en: "Elite" },
  9: { zh: "顶尖", en: "Superior" },
  10: { zh: "无双", en: "Supreme" },
};

const EQUIP_CATEGORY_ICONS: Record<string, string> = {
  melee: "\u2694\uFE0F",
  ranged: "\uD83C\uDFF9",
  siege: "\uD83D\uDCA3",
  armor: "\uD83D\uDEE1\uFE0F",
  naval: "\u2693",
  aerial: "\u2708\uFE0F",
  vehicle: "\uD83D\uDE9C",
  artillery: "\uD83D\uDCA5",
  missile: "\uD83D\uDE80",
  nuclear: "\u2622\uFE0F",
  cyber: "\uD83D\uDCBB",
  other: "\u2699\uFE0F",
};

export default function MilitaryTab({ region }: { region: Region }) {
  const { t, localized, locale } = useLocale();
  const mil = region.military;

  if (!mil) return null;

  const grade = (level: number) => {
    const clamped = Math.min(10, Math.max(1, Math.round(level)));
    const g = GRADE_LABELS[clamped] || GRADE_LABELS[5];
    return locale === "zh" ? g.zh : g.en;
  };

  return (
    <div className="space-y-4">
      {/* Force Overview */}
      <div className="space-y-2">
        <StatBar label={t("info.military")} value={safeNum(mil.level)} color="#CD5C5C" gradeLabel={grade(safeNum(mil.level))} />
        {mil.training && (
          <StatBar label={t("military.training")} value={safeNum(mil.training.level)} color="#F59E0B" gradeLabel={grade(safeNum(mil.training.level))} />
        )}
        {mil.morale && (
          <StatBar label={t("military.morale")} value={safeNum(mil.morale.level)} color="#3B82F6" gradeLabel={grade(safeNum(mil.morale.level))} />
        )}
        <div className="grid grid-cols-3 gap-2 text-center">
          <StatBlock label={t("military.total")} value={safeNum(mil.totalTroops).toLocaleString()} />
          <StatBlock label={t("military.standing")} value={safeNum(mil.standingArmy).toLocaleString()} />
          <StatBlock label={t("military.reserves")} value={safeNum(mil.reserves).toLocaleString()} />
        </div>
      </div>

      {/* Training & Morale descriptions */}
      {(localized(mil.training?.description) || localized(mil.morale?.description)) && (
        <div className="grid grid-cols-2 gap-2">
          {mil.training?.description && localized(mil.training.description) && (
            <div className="rounded p-2 bg-bg-tertiary">
              <div className="font-semibold text-amber-400 mb-1">{t("military.training")}</div>
              <p className="text-text-secondary leading-relaxed">{localized(mil.training.description)}</p>
            </div>
          )}
          {mil.morale?.description && localized(mil.morale.description) && (
            <div className="rounded p-2 bg-bg-tertiary">
              <div className="font-semibold text-blue-400 mb-1">{t("military.morale")}</div>
              <p className="text-text-secondary leading-relaxed">{localized(mil.morale.description)}</p>
            </div>
          )}
        </div>
      )}

      {/* Representative Weapons */}
      {mil.equipment && mil.equipment.length > 0 && (
        <div>
          <h4 className="font-semibold mb-1.5 text-accent-copper">
            {t("military.weapons")}
          </h4>
          <div className="space-y-2">
            {mil.equipment.map((eq, i) => (
              <div key={i} className="rounded p-2.5 bg-bg-tertiary border border-border-subtle flex gap-3 items-start">
                <div className="text-2xl leading-none pt-0.5 shrink-0">
                  {EQUIP_CATEGORY_ICONS[eq.category] || "\u2699\uFE0F"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-text-primary">{localized(eq.name)}</span>
                    <span className="px-1.5 py-0.5 rounded text-[12px] leading-tight bg-bg-secondary text-text-muted border border-border-subtle">
                      {t(`military.cat.${eq.category}`)}
                    </span>
                    {eq.quantity != null && eq.quantity > 0 && (
                      <span className="font-mono text-amber-400">&times;{safeNum(eq.quantity).toLocaleString()}</span>
                    )}
                  </div>
                  {localized(eq.description) && (
                    <p className="readable-prose mt-1">{localized(eq.description)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Branches */}
      {mil.branches && mil.branches.length > 0 && (
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
            rows={mil.branches.map((b) => ({
              name: localized(b.name),
              count: safeNum(b.count).toLocaleString(),
              desc: localized(b.description),
            }))}
          />
        </div>
      )}

      {/* Commanders */}
      <div>
        <h4 className="font-semibold mb-1.5 text-accent-copper">
          {t("military.commanders")}
        </h4>
        <div className="text-text-secondary">
          {mil.commandStructure?.commanderInChief && (
            <div className="mb-1">
              {t("military.commanderInChief")}: {localized(mil.commandStructure.commanderInChief)}
            </div>
          )}
          {mil.commandStructure?.totalGenerals != null && (
            <div className="mb-1">
              {t("military.generals")}: {mil.commandStructure.totalGenerals}
            </div>
          )}
          {mil.commandStructure?.keyGenerals && mil.commandStructure.keyGenerals.length > 0 && (
            <div className="space-y-2 mt-2">
              {mil.commandStructure.keyGenerals.map((g, i) => (
                <div key={i} className="rounded p-2 bg-bg-tertiary border border-border-subtle">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-text-primary">{localized(g.name)}</span>
                    <span className="text-text-muted">— {localized(g.title)}</span>
                  </div>
                  <div className="text-text-secondary mb-0.5">{localized(g.command)}</div>
                  {g.notableBattles && (
                    <div className="text-text-muted mt-1">
                      <span className="text-amber-500 font-semibold">{t("military.notableBattles")}:</span> {localized(g.notableBattles)}
                    </div>
                  )}
                  {g.reputation && (
                    <div className="text-text-muted mt-0.5">
                      <span className="text-blue-400 font-semibold">{t("military.reputation")}:</span> {localized(g.reputation)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fortifications */}
      {mil.fortifications && mil.fortifications.length > 0 && (
        <div>
          <h4 className="font-semibold mb-1.5 text-accent-copper">
            {t("military.fortifications")}
          </h4>
          <DataTable
            columns={[
              { key: "name", label: t("table.name"), width: "25%" },
              { key: "type", label: t("military.fortType"), width: "20%" },
              { key: "desc", label: t("table.description"), width: "55%" },
            ]}
            rows={mil.fortifications.map((f) => ({
              name: localized(f.name),
              type: localized(f.type),
              desc: localized(f.description),
            }))}
          />
        </div>
      )}

      {/* Logistics */}
      {mil.logistics && (
        <div>
          <h4 className="font-semibold mb-1.5 text-accent-copper">
            {t("military.logistics")}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded p-2 bg-bg-tertiary">
              <div className="font-semibold text-text-muted mb-0.5">{t("military.supplyCapacity")}</div>
              <p className="text-text-secondary">{localized(mil.logistics.supplyCapacity)}</p>
            </div>
            <div className="rounded p-2 bg-bg-tertiary">
              <div className="font-semibold text-text-muted mb-0.5">{t("military.mobilization")}</div>
              <p className="text-text-secondary">{localized(mil.logistics.mobilizationSpeed)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Notable Campaigns */}
      {mil.notableCampaigns && mil.notableCampaigns.length > 0 && (
        <div>
          <h4 className="font-semibold mb-1.5 text-accent-copper">
            {t("military.campaigns")}
          </h4>
          <div className="space-y-2">
            {mil.notableCampaigns.map((c, i) => (
              <div key={i} className="rounded p-2.5 bg-bg-tertiary border-l-2 border-red-700/60">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-red-300">{localized(c.name)}</span>
                  <span className="text-text-muted font-mono">{c.year}</span>
                </div>
                <div className="text-text-secondary mb-1">{localized(c.description)}</div>
                <div className="text-text-muted">
                  <span className="font-semibold">{t("military.outcome")}:</span> {localized(c.outcome)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technology */}
      {mil.technology && (
        <div>
          <h4 className="font-semibold mb-1.5 text-accent-copper">
            {t("info.technology")}
          </h4>
          <p className="readable-prose">{localized(mil.technology)}</p>
        </div>
      )}

      {/* Military Spending */}
      <div>
        <h4 className="font-semibold mb-1.5 text-accent-copper">
          {t("military.spending")}
        </h4>
        <MonetaryDisplay value={mil.annualMilitarySpending} />
        {mil.militarySpendingPctGdp != null && (
          <div className="mt-1 text-text-muted">
            {t("military.gdpPct").replace("{pct}", String(mil.militarySpendingPctGdp))}
          </div>
        )}
      </div>

      {/* Threats */}
      {mil.threats && (
        <div>
          <h4 className="font-semibold mb-1.5 text-[#CD5C5C]">
            {t("military.threats")}
          </h4>
          <p className="readable-prose">{localized(mil.threats)}</p>
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
