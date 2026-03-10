"use client";

import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import type { War, LocalizedText } from "@/lib/types";

function formatYear(year: number, locale: "zh" | "en"): string {
  if (locale === "zh") return year < 0 ? `公元前${Math.abs(year)}年` : `公元${year}年`;
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

function CrossedSwordsIcon({ size = 18, color = "#f87171" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="3" x2="12" y2="12" />
      <line x1="12" y1="12" x2="20" y2="20" />
      <line x1="3" y1="7" x2="7" y2="3" />
      <line x1="17" y1="21" x2="21" y2="17" />
      <line x1="18" y1="22" x2="22" y2="18" />
      <line x1="21" y1="3" x2="12" y2="12" />
      <line x1="12" y1="12" x2="4" y2="20" />
      <line x1="17" y1="3" x2="21" y2="7" />
      <line x1="3" y1="17" x2="7" y2="21" />
      <line x1="2" y1="18" x2="6" y2="22" />
    </svg>
  );
}

function SkullIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="8" />
      <circle cx="9" cy="9" r="1.5" fill="#9ca3af" />
      <circle cx="15" cy="9" r="1.5" fill="#9ca3af" />
      <path d="M10 22v-4a2 2 0 014 0v4" />
      <path d="M9 14l1.5 2h3L15 14" />
    </svg>
  );
}

export default function WarDetailModal() {
  const selectedWar = useWorldStore((s) => s.selectedWar);
  const setSelectedWar = useWorldStore((s) => s.setSelectedWar);
  const { locale, t, localized } = useLocale();

  if (!selectedWar) return null;

  const war = selectedWar;

  const period = war.endYear
    ? `${formatYear(war.startYear, locale)} — ${formatYear(war.endYear, locale)}`
    : `${formatYear(war.startYear, locale)} — ${t("war.ongoing")}`;

  const hasVictor = war.victor === "side1" || war.victor === "side2";
  const victorSide = war.victor;

  const side1Victor = victorSide === "side1";
  const side2Victor = victorSide === "side2";
  const side1Defeated = hasVictor && !side1Victor;
  const side2Defeated = hasVictor && !side2Victor;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => setSelectedWar(null)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative rounded-lg max-w-[520px] w-full mx-4 border border-red-900/40 shadow-2xl max-h-[85vh] overflow-y-auto"
        style={{ background: "linear-gradient(to bottom, #1e1611, #151210)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-red-900/30 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-900/30 flex items-center justify-center border border-red-900/20">
              <CrossedSwordsIcon size={20} />
            </div>
            <div>
              <h2 className="text-sm font-cinzel font-bold text-red-300">
                {localized(war.name)}
              </h2>
              <div className="text-xs text-text-muted mt-0.5">{period}</div>
            </div>
          </div>
          <button
            onClick={() => setSelectedWar(null)}
            className="text-text-muted hover:text-text-primary transition-colors p-1"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* === Belligerents VS layout === */}
          <div className="relative">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-0 items-stretch">
              {/* Side 1 */}
              <BelligerentCard
                label={war.belligerents.side1.label}
                regionIds={war.belligerents.side1.regionIds}
                localized={localized}
                isVictor={side1Victor}
                isDefeated={side1Defeated}
                t={t}
                align="right"
              />

              {/* VS divider */}
              <div className="flex flex-col items-center justify-center px-2">
                <div className="w-8 h-8 rounded-full bg-red-900/40 border border-red-800/40 flex items-center justify-center">
                  <span className="text-xs font-black text-red-400 tracking-tight">VS</span>
                </div>
              </div>

              {/* Side 2 */}
              <BelligerentCard
                label={war.belligerents.side2.label}
                regionIds={war.belligerents.side2.regionIds}
                localized={localized}
                isVictor={side2Victor}
                isDefeated={side2Defeated}
                t={t}
                align="left"
              />
            </div>
          </div>

          {/* Summary */}
          <Section title={t("war.summary")} icon={<CrossedSwordsIcon size={13} color="#c4b49a" />}>
            <p className="text-xs leading-relaxed text-text-primary">
              {localized(war.summary)}
            </p>
          </Section>

          {/* Cause */}
          <Section title={t("war.cause")} icon="🔍">
            <p className="text-xs leading-relaxed text-text-primary">
              {localized(war.cause)}
            </p>
          </Section>

          {/* Casus Belli */}
          <Section title={t("war.casus_belli")} icon="🔥">
            <p className="text-xs leading-relaxed text-text-primary">
              {localized(war.casus_belli)}
            </p>
          </Section>

          {/* === Advantages: strong visual contrast === */}
          <div>
            <div className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1.5">
              <span>⚖️</span>
              <span>{t("war.advantages")}</span>
            </div>
            <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden border border-border-subtle">
              {/* Side 1 advantages */}
              <div
                className="p-3 border-r border-border-subtle"
                style={{
                  background: side1Victor
                    ? "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.03) 100%)"
                    : side1Defeated
                      ? "linear-gradient(135deg, rgba(107,114,128,0.1) 0%, rgba(107,114,128,0.02) 100%)"
                      : "rgba(239,68,68,0.04)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  {side1Victor && <span className="text-xs leading-none">👑</span>}
                  {side1Defeated && <SkullIcon />}
                  <span
                    className="text-xs font-bold"
                    style={{ color: side1Victor ? "#4ade80" : side1Defeated ? "#9ca3af" : "#f87171" }}
                  >
                    {localized(war.belligerents.side1.label)}
                  </span>
                </div>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: side1Defeated ? "#787878" : "#e8dcc8" }}
                >
                  {localized(war.advantages.side1)}
                </p>
              </div>
              {/* Side 2 advantages */}
              <div
                className="p-3"
                style={{
                  background: side2Victor
                    ? "linear-gradient(225deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.03) 100%)"
                    : side2Defeated
                      ? "linear-gradient(225deg, rgba(107,114,128,0.1) 0%, rgba(107,114,128,0.02) 100%)"
                      : "rgba(59,130,246,0.04)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  {side2Victor && <span className="text-xs leading-none">👑</span>}
                  {side2Defeated && <SkullIcon />}
                  <span
                    className="text-xs font-bold"
                    style={{ color: side2Victor ? "#4ade80" : side2Defeated ? "#9ca3af" : "#60a5fa" }}
                  >
                    {localized(war.belligerents.side2.label)}
                  </span>
                </div>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: side2Defeated ? "#787878" : "#e8dcc8" }}
                >
                  {localized(war.advantages.side2)}
                </p>
              </div>
            </div>
          </div>

          {/* === Impact === */}
          {war.impact && (localized(war.impact.side1) || localized(war.impact.side2)) && (
            <div>
              <div className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1.5">
                <span>💥</span>
                <span>{t("war.impact")}</span>
              </div>
              <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden border border-border-subtle">
                {/* Side 1 impact */}
                <div
                  className="p-3 border-r border-border-subtle"
                  style={{
                    background: side1Victor
                      ? "linear-gradient(135deg, rgba(34,197,94,0.08) 0%, transparent 100%)"
                      : "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, transparent 100%)",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xs">{side1Victor ? "📈" : "📉"}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: side1Victor ? "#4ade80" : "#f87171" }}
                    >
                      {localized(war.belligerents.side1.label)}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-text-primary">
                    {localized(war.impact.side1)}
                  </p>
                </div>
                {/* Side 2 impact */}
                <div
                  className="p-3"
                  style={{
                    background: side2Victor
                      ? "linear-gradient(225deg, rgba(34,197,94,0.08) 0%, transparent 100%)"
                      : "linear-gradient(225deg, rgba(239,68,68,0.08) 0%, transparent 100%)",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xs">{side2Victor ? "📈" : "📉"}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: side2Victor ? "#4ade80" : "#f87171" }}
                    >
                      {localized(war.belligerents.side2.label)}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-text-primary">
                    {localized(war.impact.side2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      <div className="rounded-md bg-bg-secondary/60 border border-border-subtle p-2.5">
        {children}
      </div>
    </div>
  );
}

function BelligerentCard({
  label,
  regionIds,
  localized,
  isVictor,
  isDefeated,
  t,
  align,
}: {
  label: LocalizedText;
  regionIds: string[];
  localized: (t: LocalizedText | undefined) => string;
  isVictor: boolean;
  isDefeated: boolean;
  t: (key: string) => string;
  align: "left" | "right";
}) {
  const currentState = useWorldStore((s) => s.currentState);
  const regions = currentState?.regions.filter((r) => regionIds.includes(r.id)) ?? [];

  const bgStyle = isVictor
    ? align === "right"
      ? "linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.03) 100%)"
      : "linear-gradient(225deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.03) 100%)"
    : isDefeated
      ? "rgba(107,114,128,0.06)"
      : "rgba(239,68,68,0.04)";

  const borderColor = isVictor ? "rgba(34,197,94,0.35)" : isDefeated ? "rgba(107,114,128,0.2)" : "rgba(201,168,76,0.15)";
  const nameColor = isVictor ? "#4ade80" : isDefeated ? "#6b7280" : "#e8dcc8";

  return (
    <div
      className="rounded-lg p-3 relative flex flex-col items-center text-center"
      style={{ background: bgStyle, border: `1px solid ${borderColor}` }}
    >
      {/* Victory tag */}
      {isVictor && (
        <div className="flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25">
          <span className="text-xs leading-none">👑</span>
          <span className="text-xs font-bold text-amber-400">{t("war.victor")}</span>
        </div>
      )}
      {isDefeated && (
        <div className="flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/15">
          <SkullIcon />
          <span className="text-xs font-semibold text-gray-500">{t("war.defeated")}</span>
        </div>
      )}

      {/* Name */}
      <div
        className="text-[13px] font-bold mb-1.5"
        style={{ color: nameColor, opacity: isDefeated ? 0.7 : 1 }}
      >
        {localized(label)}
      </div>

      {/* Regions */}
      {regions.map((r) => (
        <div key={r.id} className="flex items-center gap-1 text-xs justify-center" style={{ color: isDefeated ? "#6b7280" : "#c4b49a" }}>
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: isVictor ? "#4ade80" : isDefeated ? "#6b7280" : "#c4b49a" }}
          />
          <span>{localized(r.name)}</span>
        </div>
      ))}
    </div>
  );
}
