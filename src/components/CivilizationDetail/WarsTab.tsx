"use client";

import { useMemo } from "react";
import type { Region, War, LocalizedText, WarMetricsSnapshot } from "@/lib/types";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import { Sparkline } from "../charts/DualLineChart";

function formatYear(year: number, locale: "zh" | "en"): string {
  if (locale === "zh") return year < 0 ? `公元前${Math.abs(year)}年` : `公元${year}年`;
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  ongoing: { color: "#f87171", bg: "rgba(239,68,68,0.12)" },
  ceasefire: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  stalemate: { color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  side1_victory: { color: "#4ade80", bg: "rgba(34,197,94,0.12)" },
  side2_victory: { color: "#4ade80", bg: "rgba(34,197,94,0.12)" },
};

export default function WarsTab({ region }: { region: Region }) {
  const activeWars = useWorldStore((s) => s.activeWars);
  const pastEvents = useWorldStore((s) => s.pastEvents);
  const currentState = useWorldStore((s) => s.currentState);
  const setSelectedWar = useWorldStore((s) => s.setSelectedWar);
  const warSnapshots = useWorldStore((s) => s.warSnapshots);
  const { locale, t, localized } = useLocale();

  const involvedWars = activeWars.filter(
    (w) =>
      w.belligerents.side1.regionIds.includes(region.id) ||
      w.belligerents.side2.regionIds.includes(region.id)
  );

  if (involvedWars.length === 0) {
    return (
      <div className="space-y-4 text-xs">
        <div className="flex flex-col items-center justify-center py-8 text-text-muted">
          <span className="text-lg mb-2">🕊</span>
          <span>{t("wars.notAtWar")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs">
      {involvedWars.map((war) => (
        <WarInvolvementCard
          key={war.id}
          war={war}
          region={region}
          currentState={currentState}
          pastEvents={pastEvents}
          locale={locale}
          t={t}
          localized={localized}
          onOpenDetail={() => setSelectedWar(war)}
          snapshots={warSnapshots[war.id] || []}
        />
      ))}
    </div>
  );
}

function WarInvolvementCard({
  war,
  region,
  currentState,
  pastEvents,
  locale,
  t,
  localized,
  onOpenDetail,
  snapshots,
}: {
  war: War;
  region: Region;
  currentState: ReturnType<typeof useWorldStore.getState>["currentState"];
  pastEvents: ReturnType<typeof useWorldStore.getState>["pastEvents"];
  locale: "zh" | "en";
  t: (key: string) => string;
  localized: (text: LocalizedText | undefined) => string;
  onOpenDetail: () => void;
  snapshots: WarMetricsSnapshot[];
}) {
  const isOnSide1 = war.belligerents.side1.regionIds.includes(region.id);
  const mySide = isOnSide1 ? "side1" : "side2";
  const enemySide = isOnSide1 ? "side2" : "side1";
  const statusStyle = STATUS_STYLE[war.status] ?? STATUS_STYLE.ongoing;

  const myLabel = war.belligerents[mySide].label;
  const enemyLabel = war.belligerents[enemySide].label;

  const myAllyIds = war.belligerents[mySide].regionIds.filter((id) => id !== region.id);
  const enemyIds = war.belligerents[enemySide].regionIds;

  const myAllies = currentState?.regions.filter((r) => myAllyIds.includes(r.id)) ?? [];
  const enemies = currentState?.regions.filter((r) => enemyIds.includes(r.id)) ?? [];

  const myImpact = war.impact?.[mySide];
  const myAdvantages = war.advantages?.[mySide];
  const enemyAdvantages = war.advantages?.[enemySide];

  const isVictor = war.victor === mySide;
  const isDefeated = (war.victor === "side1" || war.victor === "side2") && war.victor !== mySide;

  const relatedEvents = pastEvents.filter(
    (e) =>
      war.relatedEventIds.includes(e.id) &&
      e.affectedRegions.includes(region.id)
  );

  const period = war.endYear
    ? `${formatYear(war.startYear, locale)} — ${formatYear(war.endYear, locale)}`
    : `${formatYear(war.startYear, locale)} — ${t("war.ongoing")}`;

  const mil = region.military;

  const warImpactDeltas = useMemo(() => {
    if (snapshots.length < 2) return null;
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const mySideFirst = first[mySide as "side1" | "side2"];
    const mySideLast = last[mySide as "side1" | "side2"];
    const pct = (from: number, to: number) =>
      from === 0 ? null : ((to - from) / Math.abs(from)) * 100;
    return {
      troopsPct: pct(mySideFirst.totalTroops, mySideLast.totalTroops),
      gdpPct: pct(mySideFirst.gdpGoldKg, mySideLast.gdpGoldKg),
      populationPct: pct(mySideFirst.population, mySideLast.population),
      techDelta: mySideLast.techLevel - mySideFirst.techLevel,
    };
  }, [snapshots, mySide]);

  const myTroopValues = useMemo(
    () => snapshots.map((s) => s[mySide as "side1" | "side2"].totalTroops),
    [snapshots, mySide]
  );

  return (
    <div className="rounded-lg border border-red-900/30 overflow-hidden" style={{ background: "rgba(139,58,58,0.06)" }}>
      {/* War header */}
      <div
        className="px-3 py-2.5 border-b border-red-900/20 cursor-pointer hover:bg-red-900/10 transition-colors"
        onClick={onOpenDetail}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">⚔</span>
              <h4 className="text-xs font-bold text-red-300 truncate">{localized(war.name)}</h4>
            </div>
            <div className="text-xs text-text-muted mt-0.5">{period}</div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isVictor && (
              <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                👑 {t("war.victor")}
              </span>
            )}
            {isDefeated && (
              <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-gray-500/10 text-gray-500 border border-gray-500/15">
                {t("war.defeated")}
              </span>
            )}
            <span
              className="text-xs px-1.5 py-0.5 rounded font-semibold"
              style={{ color: statusStyle.color, background: statusStyle.bg }}
            >
              {t(`war.${war.status}`)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-3 py-2.5 space-y-3">
        {/* War impact deltas */}
        {warImpactDeltas && (
          <div>
            <div className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
              <span>📊</span>
              <span>{t("wars.warImpactOnCiv")}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <DeltaCard label={t("war.chart.military")} value={warImpactDeltas.troopsPct} suffix="%" />
              <DeltaCard label={t("war.chart.economy")} value={warImpactDeltas.gdpPct} suffix="%" />
              <DeltaCard label={t("war.chart.population")} value={warImpactDeltas.populationPct} suffix="%" />
              <DeltaCard label={t("war.chart.technology")} value={warImpactDeltas.techDelta} suffix="" isAbsolute />
            </div>
            {myTroopValues.length >= 2 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-text-muted">{t("war.chart.military")}:</span>
                <Sparkline values={myTroopValues} color="#f87171" width={120} height={20} />
              </div>
            )}
          </div>
        )}

        {/* Side alignment */}
        <div>
          <div className="text-xs font-semibold text-text-secondary mb-1.5">{t("wars.warRole")}</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded p-2 bg-red-900/10 border border-red-900/20">
              <div className="text-xs font-semibold text-red-400 mb-1">{t("wars.yourSide")}</div>
              <div className="text-xs text-text-primary font-semibold mb-0.5">{localized(myLabel)}</div>
              {myAllies.length > 0 && (
                <div className="mt-1">
                  <span className="text-xs text-text-muted">{t("diplomacy.allies")}:</span>
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {myAllies.map((r) => (
                      <span key={r.id} className="text-xs px-1 py-0.5 rounded bg-bg-tertiary text-text-secondary">
                        {localized(r.name)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="rounded p-2 bg-blue-900/10 border border-blue-900/20">
              <div className="text-xs font-semibold text-blue-400 mb-1">{t("wars.enemySide")}</div>
              <div className="text-xs text-text-primary font-semibold mb-0.5">{localized(enemyLabel)}</div>
              {enemies.length > 0 && (
                <div className="mt-1">
                  <div className="flex flex-wrap gap-0.5">
                    {enemies.map((r) => (
                      <span key={r.id} className="text-xs px-1 py-0.5 rounded bg-bg-tertiary text-text-secondary">
                        {localized(r.name)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Impact on this civilization */}
        {myImpact && localized(myImpact) && (
          <div>
            <div className="text-xs font-semibold text-text-secondary mb-1">
              {t("wars.impactOnCiv").replace("{name}", localized(region.name))}
            </div>
            <div className="rounded p-2 bg-bg-tertiary/60 border border-border-subtle">
              <p className="text-xs leading-relaxed text-text-primary">{localized(myImpact)}</p>
            </div>
          </div>
        )}

        {/* Advantages comparison */}
        {(myAdvantages || enemyAdvantages) && (
          <div>
            <div className="text-xs font-semibold text-text-secondary mb-1">{t("war.advantages")}</div>
            <div className="grid grid-cols-2 gap-0 rounded overflow-hidden border border-border-subtle">
              <div className="p-2 border-r border-border-subtle" style={{ background: "rgba(239,68,68,0.04)" }}>
                <div className="text-xs font-semibold text-red-400 mb-0.5">{localized(myLabel)}</div>
                <p className="text-xs leading-relaxed text-text-secondary">{localized(myAdvantages)}</p>
              </div>
              <div className="p-2" style={{ background: "rgba(59,130,246,0.04)" }}>
                <div className="text-xs font-semibold text-blue-400 mb-0.5">{localized(enemyLabel)}</div>
                <p className="text-xs leading-relaxed text-text-secondary">{localized(enemyAdvantages)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Military situation */}
        <div>
          <div className="text-xs font-semibold text-text-secondary mb-1">{t("wars.militarySituation")}</div>
          <div className="rounded p-2 bg-bg-tertiary/60 border border-border-subtle space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">{t("military.total")}</span>
              <span className="text-xs font-mono text-text-primary">{mil.totalTroops.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">{t("military.standing")}</span>
              <span className="text-xs font-mono text-text-primary">{mil.standingArmy.toLocaleString()}</span>
            </div>
            {mil.recentBattles && (
              <div className="pt-1 border-t border-border-subtle">
                <span className="text-xs text-text-muted">{locale === "zh" ? "近期战事" : "Recent Battles"}:</span>
                <p className="text-xs text-text-secondary mt-0.5">{localized(mil.recentBattles)}</p>
              </div>
            )}
            {mil.threats && (
              <div className="pt-1 border-t border-border-subtle">
                <span className="text-xs text-[#CD5C5C]">{t("military.threats")}:</span>
                <p className="text-xs text-text-secondary mt-0.5">{localized(mil.threats)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Related events */}
        {relatedEvents.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-text-secondary mb-1">{t("wars.relatedEvents")}</div>
            <div className="space-y-1">
              {relatedEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center gap-2 rounded px-2 py-1 bg-bg-tertiary/60 border border-border-subtle"
                >
                  <span className="text-xs text-text-muted shrink-0">
                    {formatYear(evt.timestamp.year, locale)}
                  </span>
                  <span className="text-xs text-text-primary truncate flex-1">
                    {localized(evt.title)}
                  </span>
                  <span className="text-xs px-1 py-0.5 rounded shrink-0" style={{ background: "#8b3a3a", color: "#e8dcc8" }}>
                    {t(`events.category.${evt.category}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DeltaCard({
  label,
  value,
  suffix,
  isAbsolute = false,
}: {
  label: string;
  value: number | null;
  suffix: string;
  isAbsolute?: boolean;
}) {
  if (value == null) {
    return (
      <div className="rounded p-1.5 bg-bg-tertiary/60 border border-border-subtle text-center">
        <div className="text-xs text-text-muted truncate">{label}</div>
        <div className="text-xs font-mono text-text-muted">—</div>
      </div>
    );
  }

  const color = isAbsolute
    ? value > 0 ? "#4ade80" : value < 0 ? "#f87171" : "#9ca3af"
    : value >= 0 ? "#4ade80" : "#f87171";
  const sign = value >= 0 ? "+" : "";

  return (
    <div className="rounded p-1.5 bg-bg-tertiary/60 border border-border-subtle text-center">
      <div className="text-xs text-text-muted truncate">{label}</div>
      <div className="text-xs font-mono font-semibold" style={{ color }}>
        {sign}{isAbsolute ? value : value.toFixed(1)}{suffix}
      </div>
    </div>
  );
}
