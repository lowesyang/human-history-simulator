"use client";

import { useWorldStore } from "@/store/useWorldStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useLocale } from "@/lib/i18n";
import { DEFAULT_SIMULATION_PARAMS } from "@/lib/types";

export default function SimulationControlPanel() {
  const simulationParams = useWorldStore((s) => s.simulationParams);
  const isLoading = useWorldStore((s) => s.isLoading);
  const { t } = useLocale();

  const isDefault =
    simulationParams.contingencyRatio === DEFAULT_SIMULATION_PARAMS.contingencyRatio &&
    Object.keys(simulationParams.categoryWeights).length === 0;

  return (
    <button
      onClick={() => useSettingsStore.getState().setShowSettings(true, "simulation")}
      disabled={isLoading}
      className={`icon-btn tooltip-wrap border transition-all ${isDefault
          ? "border-border-subtle text-text-muted"
          : "border-accent-gold/50 text-accent-gold/80"
        }`}
      data-tooltip={t("sim.tuning")}
      style={{ opacity: isLoading ? 0.4 : 1 }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </svg>
    </button>
  );
}
