"use client";

import { useState } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useLocale } from "@/lib/i18n";

export default function ScenarioPanel() {
  const { t } = useLocale();
  const simulationMode = useSettingsStore((s) => s.simulationMode);
  const enableScenarioInjection = useSettingsStore((s) => s.enableScenarioInjection);
  const premises = useWorldStore((s) => s.scenarioPremises);
  const addPremise = useWorldStore((s) => s.addScenarioPremise);
  const removePremise = useWorldStore((s) => s.removeScenarioPremise);
  const clearPremises = useWorldStore((s) => s.clearScenarioPremises);

  const [input, setInput] = useState("");

  if (simulationMode !== "speculative" || !enableScenarioInjection) return null;

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addPremise(trimmed);
    setInput("");
  };

  return (
    <div className="glass-panel rounded-lg border border-border-subtle p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-accent-gold tracking-wide uppercase">
          {t("simulation.scenarioPremise")}
        </h3>
        {premises.length > 0 && (
          <button
            onClick={clearPremises}
            className="text-xs text-text-muted hover:text-red-400 transition-colors cursor-pointer"
          >
            {t("events.clearAll")}
          </button>
        )}
      </div>

      {premises.length > 0 && (
        <div className="space-y-1.5">
          {premises.map((premise, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-2.5 py-1.5 rounded bg-bg-tertiary/60 border border-border-subtle"
            >
              <span className="flex-1 text-xs text-text-secondary leading-relaxed">
                {premise}
              </span>
              <button
                onClick={() => removePremise(i)}
                className="shrink-0 mt-0.5 text-text-muted hover:text-red-400 transition-colors cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={t("simulation.scenarioPremise") + "..."}
          className="flex-1 px-2.5 py-1.5 rounded border border-border-subtle bg-bg-tertiary text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-border-active transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="px-3 py-1.5 rounded text-xs font-semibold bg-accent-gold/20 text-accent-gold border border-accent-gold/40 hover:bg-accent-gold/30 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}
