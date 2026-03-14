"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import { SUPPORTED_MODELS, DEFAULT_MODEL } from "@/lib/settings";
import type { SupportedModelId, SimulationMode } from "@/lib/settings";
import type { SettingsTab } from "@/store/useSettingsStore";
import type { EventCategory, SimulationParams, PriceEngineParams, InertiaParams } from "@/lib/types";
import { DEFAULT_SIMULATION_PARAMS, DEFAULT_PRICE_ENGINE_PARAMS, DEFAULT_INERTIA_PARAMS } from "@/lib/types";

const ALL_CATEGORIES: { id: EventCategory; key: string }[] = [
  { id: "war", key: "events.category.war" },
  { id: "trade", key: "events.category.trade" },
  { id: "technology", key: "events.category.technology" },
  { id: "diplomacy", key: "events.category.diplomacy" },
  { id: "dynasty", key: "events.category.dynasty" },
  { id: "invention", key: "events.category.invention" },
  { id: "religion", key: "events.category.religion" },
  { id: "disaster", key: "events.category.disaster" },
  { id: "natural_disaster", key: "events.category.natural_disaster" },
  { id: "exploration", key: "events.category.exploration" },
  { id: "migration", key: "events.category.migration" },
  { id: "finance", key: "events.category.finance" },
  { id: "announcement", key: "events.category.announcement" },
];

const TABS: SettingsTab[] = ["general", "simulation"];

const STEPS = [0, 25, 50, 75, 100];

function snapToStep(ratio: number): number {
  let best = STEPS[0];
  let bestDist = Math.abs(ratio - best);
  for (const s of STEPS) {
    const d = Math.abs(ratio - s);
    if (d < bestDist) { best = s; bestDist = d; }
  }
  return best;
}

function ContingencySlider({ value, onChange, t }: { value: number; onChange: (v: number) => void; t: (k: string) => string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const ratioFromPointer = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 100;
    return snapToStep(pct);
  }, [value]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      onChange(ratioFromPointer(e.clientX));
    };
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, onChange, ratioFromPointer]);

  const handleTrackClick = (e: React.MouseEvent) => {
    onChange(ratioFromPointer(e.clientX));
  };

  const thumbPct = value;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-medium text-text-secondary">{t("sim.contingency")}</label>
      </div>

      {/* Track area — clickable & draggable */}
      <div
        ref={trackRef}
        className="relative h-4 cursor-pointer select-none touch-none"
        onClick={handleTrackClick}
      >
        {/* Background track */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[3px] bg-bg-tertiary rounded-full" />
        {/* Active fill */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-[3px] bg-accent-gold/40 rounded-full"
          style={{ width: `${thumbPct}%`, transition: dragging ? "none" : "width 0.2s" }}
        />
        {/* Tick marks */}
        {STEPS.map((v) => (
          <div
            key={v}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full ${v === value ? "w-0 h-0" : "w-1.5 h-1.5 bg-text-muted/30"
              }`}
            style={{ left: `${v}%` }}
          />
        ))}
        {/* Draggable thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-accent-gold shadow-[0_0_8px_rgba(212,168,83,0.5)] cursor-grab active:cursor-grabbing z-10"
          style={{ left: `${thumbPct}%`, transition: dragging ? "none" : "left 0.2s" }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(true);
          }}
        />
      </div>

      {/* Labels */}
      <div className="relative mt-1.5 h-4">
        {STEPS.map((v, i) => {
          const active = value === v;
          const align = i === 0 ? "left" : i === STEPS.length - 1 ? "right" : "center";
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              className={`absolute text-xs leading-none whitespace-nowrap cursor-pointer transition-colors ${active ? "text-accent-gold font-semibold" : "text-text-muted hover:text-text-secondary"
                }`}
              style={{
                left: `${v}%`,
                transform: align === "left" ? "none" : align === "right" ? "translateX(-100%)" : "translateX(-50%)",
              }}
            >
              {t(`sim.level.${v}`)}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-text-muted mt-3 leading-relaxed">
        {t(`sim.levelDesc.${value}`)}
      </p>
    </div>
  );
}

export default function SettingsModal() {
  const { t } = useLocale();
  const showSettings = useSettingsStore((s) => s.showSettings);
  const activeTab = useSettingsStore((s) => s.activeSettingsTab);
  const setShowSettings = useSettingsStore((s) => s.setShowSettings);
  const storeApiKey = useSettingsStore((s) => s.apiKey);
  const storeModel = useSettingsStore((s) => s.model);
  const storeSimMode = useSettingsStore((s) => s.simulationMode);
  const storeCivMemory = useSettingsStore((s) => s.enableCivMemory);
  const storeScenarioInj = useSettingsStore((s) => s.enableScenarioInjection);
  const storeWebSearchAdv = useSettingsStore((s) => s.webSearchOnAdvance);
  const hasEnvKey = useSettingsStore((s) => s.hasEnvKey);
  const envModel = useSettingsStore((s) => s.envModel);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const setModel = useSettingsStore((s) => s.setModel);
  const setSimulationMode = useSettingsStore((s) => s.setSimulationMode);
  const setEnableCivMemory = useSettingsStore((s) => s.setEnableCivMemory);
  const setEnableScenarioInjection = useSettingsStore((s) => s.setEnableScenarioInjection);
  const setWebSearchOnAdvance = useSettingsStore((s) => s.setWebSearchOnAdvance);
  const syncToServer = useSettingsStore((s) => s.syncToServer);

  const simulationParams = useWorldStore((s) => s.simulationParams);
  const setSimulationParams = useWorldStore((s) => s.setSimulationParams);
  const priceEngineParams = useWorldStore((s) => s.priceEngineParams);
  const setPriceEngineParams = useWorldStore((s) => s.setPriceEngineParams);
  const inertiaParams = useWorldStore((s) => s.inertiaParams);
  const setInertiaParams = useWorldStore((s) => s.setInertiaParams);

  const [localKey, setLocalKey] = useState("");
  const [localModel, setLocalModel] = useState<SupportedModelId>(DEFAULT_MODEL as SupportedModelId);
  const [localSimMode, setLocalSimMode] = useState<SimulationMode>("historical");
  const [localCivMemory, setLocalCivMemory] = useState(false);
  const [localScenarioInj, setLocalScenarioInj] = useState(false);
  const [localWebSearchAdv, setLocalWebSearchAdv] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  useEffect(() => {
    if (!modelDropdownOpen) return;
    const handleClick = () => setModelDropdownOpen(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [modelDropdownOpen]);

  useEffect(() => {
    if (showSettings) {
      setLocalKey(storeApiKey);
      setLocalModel(storeModel);
      setLocalSimMode(storeSimMode);
      setLocalCivMemory(storeCivMemory);
      setLocalScenarioInj(storeScenarioInj);
      setLocalWebSearchAdv(storeWebSearchAdv);
      setSaved(false);
    }
  }, [showSettings, storeApiKey, storeModel, storeSimMode, storeCivMemory, storeScenarioInj, storeWebSearchAdv]);

  const setTab = useCallback((tab: SettingsTab) => {
    useSettingsStore.setState({ activeSettingsTab: tab });
    setModelDropdownOpen(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setApiKey(localKey);
    setModel(localModel);
    setSimulationMode(localSimMode);
    setEnableCivMemory(localCivMemory);
    setEnableScenarioInjection(localScenarioInj);
    setWebSearchOnAdvance(localWebSearchAdv);

    await new Promise((resolve) => setTimeout(resolve, 0));
    useSettingsStore.getState().syncToServer().then(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleReset = () => {
    setLocalKey("");
    setLocalModel(DEFAULT_MODEL as SupportedModelId);
    setLocalSimMode("historical");
    setLocalCivMemory(false);
    setLocalScenarioInj(false);
    setLocalWebSearchAdv(false);
  };

  const updateContingency = useCallback(
    (ratio: number) => {
      setSimulationParams({ ...simulationParams, contingencyRatio: ratio });
    },
    [simulationParams, setSimulationParams]
  );

  const updateWeight = useCallback(
    (cat: EventCategory, value: number) => {
      const next: SimulationParams = {
        ...simulationParams,
        categoryWeights: { ...simulationParams.categoryWeights, [cat]: value },
      };
      if (value === 1) {
        delete next.categoryWeights[cat];
      }
      setSimulationParams(next);
    },
    [simulationParams, setSimulationParams]
  );

  const resetSimDefaults = useCallback(() => {
    setSimulationParams({ ...DEFAULT_SIMULATION_PARAMS });
  }, [setSimulationParams]);

  const hasWeightChanges = Object.keys(simulationParams.categoryWeights).length > 0;
  const isSimDefault =
    simulationParams.contingencyRatio === DEFAULT_SIMULATION_PARAMS.contingencyRatio &&
    !hasWeightChanges;

  if (!showSettings) return null;

  const selectedModel = SUPPORTED_MODELS.find((m) => m.id === localModel);
  const keyPlaceholder = hasEnvKey ? t("settings.keyFromEnv") : t("settings.keyPlaceholder");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowSettings(false)}
      />

      <div className="relative glass-panel rounded-lg border border-border-active shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2.5">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent-gold"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            <h2 className="font-cinzel text-sm font-bold text-accent-gold tracking-wide">
              {t("settings.title")}
            </h2>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setTab(tab)}
              className={`flex-1 px-4 py-2.5 text-xs font-semibold tracking-wide transition-colors cursor-pointer ${activeTab === tab
                ? "text-accent-gold border-b-2 border-accent-gold"
                : "text-text-muted hover:text-text-secondary"
                }`}
            >
              {t(`settings.tab.${tab}`)}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === "general" && (
            <div className="px-5 py-4 space-y-5">
              {/* API Key */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text-secondary tracking-wide uppercase">
                  {t("settings.apiKey")}
                </label>
                {hasEnvKey && !localKey && (
                  <div className="flex items-center gap-1.5 text-xs text-accent-amber">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    {t("settings.envKeyActive")}
                  </div>
                )}
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={localKey}
                    onChange={(e) => setLocalKey(e.target.value)}
                    placeholder={keyPlaceholder}
                    className="w-full px-3 py-2 pr-10 rounded border border-border-subtle bg-bg-tertiary text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-border-active transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                  >
                    {showKey ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {t("settings.apiKeyHint")}
                </p>
              </div>

              {/* Model Selection - Dropdown */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text-secondary tracking-wide uppercase">
                  {t("settings.model")}
                </label>
                {envModel && envModel !== DEFAULT_MODEL && !localModel && (
                  <div className="flex items-center gap-1.5 text-xs text-accent-amber">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    {t("settings.envModelActive")}: {envModel}
                  </div>
                )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setModelDropdownOpen(!modelDropdownOpen); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded border border-border-subtle bg-bg-tertiary text-text-primary text-xs hover:border-border-active focus:outline-none focus:border-border-active transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold truncate">{selectedModel?.label ?? localModel}</span>
                      <span className="text-text-muted">{selectedModel?.provider}</span>
                      {localModel === DEFAULT_MODEL && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-accent-gold/15 text-accent-gold font-medium shrink-0">
                          {t("settings.default")}
                        </span>
                      )}
                    </div>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`shrink-0 transition-transform ${modelDropdownOpen ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {modelDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded border border-border-active bg-bg-secondary shadow-lg overflow-hidden">
                      {SUPPORTED_MODELS.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setLocalModel(m.id as SupportedModelId);
                            setModelDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors cursor-pointer ${localModel === m.id
                            ? "bg-accent-gold/10 text-accent-gold"
                            : "text-text-primary hover:bg-bg-tertiary"
                            }`}
                        >
                          <span className="font-semibold">{m.label}</span>
                          <span className="text-text-muted">{m.provider}</span>
                          {m.id === DEFAULT_MODEL && localModel !== m.id && (
                            <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-accent-gold/15 text-accent-gold font-medium">
                              {t("settings.default")}
                            </span>
                          )}
                          {localModel === m.id && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-auto text-accent-gold shrink-0">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Simulation Mode */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text-secondary tracking-wide uppercase">
                  {t("settings.simulationMode")}
                </label>
                <div className="space-y-1.5">
                  {(["historical", "speculative"] as const).map((mode) => (
                    <label
                      key={mode}
                      className={`flex items-center gap-3 px-3 py-2 rounded border cursor-pointer transition-all ${localSimMode === mode
                        ? "border-accent-gold bg-accent-gold/10"
                        : "border-border-subtle hover:border-border-active bg-bg-tertiary/50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="simMode"
                        value={mode}
                        checked={localSimMode === mode}
                        onChange={() => setLocalSimMode(mode)}
                        className="sr-only"
                      />
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${localSimMode === mode ? "border-accent-gold" : "border-text-muted"
                          }`}
                      >
                        {localSimMode === mode && (
                          <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-text-primary">
                          {t(`settings.simulationMode.${mode}`)}
                        </div>
                        <div className="text-xs text-text-muted">
                          {t(`settings.simulationMode.${mode}.desc`)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Web Search on Advance */}
              <div className="flex items-center justify-between py-1">
                <div className="flex-1 mr-3">
                  <div className="text-xs font-semibold text-text-secondary">{t("settings.webSearchOnAdvance")}</div>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t("settings.webSearchOnAdvance.desc")}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={localWebSearchAdv}
                  onClick={() => setLocalWebSearchAdv(!localWebSearchAdv)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 focus:outline-none cursor-pointer ${localWebSearchAdv
                    ? "bg-accent-gold/80 border-accent-gold"
                    : "bg-bg-tertiary border-border-subtle"
                    }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${localWebSearchAdv ? "translate-x-[18px]" : "translate-x-[2px]"
                      }`}
                  />
                </button>
              </div>

              {/* Advanced Speculative Options */}
              {localSimMode === "speculative" && (
                <div className="space-y-3 pt-1">
                  <label className="block text-xs font-semibold text-text-secondary tracking-wide uppercase">
                    {t("settings.advancedSpeculative")}
                  </label>
                  <div className="flex items-center justify-between py-1">
                    <div className="flex-1 mr-3">
                      <div className="text-xs font-semibold text-text-primary">{t("settings.enableCivMemory")}</div>
                      <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t("settings.enableCivMemory.desc")}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={localCivMemory}
                      onClick={() => setLocalCivMemory(!localCivMemory)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 focus:outline-none cursor-pointer ${localCivMemory
                        ? "bg-accent-gold/80 border-accent-gold"
                        : "bg-bg-tertiary border-border-subtle"
                        }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${localCivMemory ? "translate-x-[18px]" : "translate-x-[2px]"
                          }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <div className="flex-1 mr-3">
                      <div className="text-xs font-semibold text-text-primary">{t("settings.enableScenarioInjection")}</div>
                      <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t("settings.enableScenarioInjection.desc")}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={localScenarioInj}
                      onClick={() => setLocalScenarioInj(!localScenarioInj)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 focus:outline-none cursor-pointer ${localScenarioInj
                        ? "bg-accent-gold/80 border-accent-gold"
                        : "bg-bg-tertiary border-border-subtle"
                        }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${localScenarioInj ? "translate-x-[18px]" : "translate-x-[2px]"
                          }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "simulation" && (
            <div className="px-5 py-4 space-y-5">
              {/* Contingency slider */}
              <ContingencySlider
                value={simulationParams.contingencyRatio}
                onChange={updateContingency}
                t={t}
              />

              {/* Divider */}
              <div className="border-t border-border-subtle" />

              {/* Category weights */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-text-secondary">{t("sim.categoryWeights")}</label>
                  {hasWeightChanges && (
                    <button
                      onClick={() => setSimulationParams({ ...simulationParams, categoryWeights: {} })}
                      className="text-xs text-text-muted hover:text-accent-gold transition-colors cursor-pointer"
                    >
                      {t("sim.resetWeights")}
                    </button>
                  )}
                </div>
                <p className="text-xs text-text-muted mb-3 leading-relaxed">{t("sim.categoryWeightsDesc")}</p>

                <div className="space-y-2.5">
                  {ALL_CATEGORIES.map(({ id, key }) => {
                    const w = simulationParams.categoryWeights[id] ?? 1;
                    return (
                      <div key={id} className="flex items-center gap-2.5">
                        <span className="text-xs text-text-secondary w-[76px] shrink-0 truncate">{t(key)}</span>
                        <input
                          type="range"
                          min={0}
                          max={3}
                          step={0.25}
                          value={w}
                          onChange={(e) => updateWeight(id, Number(e.target.value))}
                          className="flex-1 h-1 rounded-full appearance-none cursor-pointer bg-bg-tertiary"
                          style={{ accentColor: w === 1 ? "var(--color-text-muted, #888)" : "var(--accent-gold, #d4a853)" }}
                        />
                        <span className={`text-xs w-[34px] text-right shrink-0 font-mono ${w === 1 ? "text-text-muted" : "text-accent-gold font-semibold"}`}>
                          {w.toFixed(1)}x
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border-subtle" />

              {/* Price Engine */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-text-secondary">{t("sim.priceEngine")}</label>
                  <button
                    onClick={() => setPriceEngineParams(DEFAULT_PRICE_ENGINE_PARAMS)}
                    className="text-xs text-text-muted hover:text-accent-gold transition-colors cursor-pointer"
                  >
                    {t("sim.resetWeights")}
                  </button>
                </div>
                <p className="text-xs text-text-muted mb-3 leading-relaxed">{t("sim.priceEngineDesc")}</p>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary">{t("sim.meanReversion")}</span>
                      <span className="text-xs text-accent-gold font-mono">{priceEngineParams.thetaMeanReversion.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min={0.05} max={0.8} step={0.05}
                      value={priceEngineParams.thetaMeanReversion}
                      onChange={(e) => setPriceEngineParams({ ...priceEngineParams, thetaMeanReversion: Number(e.target.value) })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-bg-tertiary"
                      style={{ accentColor: "var(--accent-gold, #d4a853)" }}
                    />
                    <div className="flex justify-between text-xs text-text-muted mt-0.5">
                      <span>{t("sim.slower")}</span>
                      <span>{t("sim.faster")}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary">{t("sim.volatility")}</span>
                      <span className="text-xs text-accent-gold font-mono">{priceEngineParams.volatilityMultiplier.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range" min={0.2} max={3.0} step={0.1}
                      value={priceEngineParams.volatilityMultiplier}
                      onChange={(e) => setPriceEngineParams({ ...priceEngineParams, volatilityMultiplier: Number(e.target.value) })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-bg-tertiary"
                      style={{ accentColor: priceEngineParams.volatilityMultiplier === 1 ? "var(--color-text-muted, #888)" : "var(--accent-gold, #d4a853)" }}
                    />
                    <div className="flex justify-between text-xs text-text-muted mt-0.5">
                      <span>{t("sim.stable")}</span>
                      <span>{t("sim.chaotic")}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary">{t("sim.shockMagnitude")}</span>
                      <span className="text-xs text-accent-gold font-mono">{priceEngineParams.shockMagnitudeMultiplier.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range" min={0.2} max={3.0} step={0.1}
                      value={priceEngineParams.shockMagnitudeMultiplier}
                      onChange={(e) => setPriceEngineParams({ ...priceEngineParams, shockMagnitudeMultiplier: Number(e.target.value) })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-bg-tertiary"
                      style={{ accentColor: priceEngineParams.shockMagnitudeMultiplier === 1 ? "var(--color-text-muted, #888)" : "var(--accent-gold, #d4a853)" }}
                    />
                    <div className="flex justify-between text-xs text-text-muted mt-0.5">
                      <span>{t("sim.mild")}</span>
                      <span>{t("sim.extreme")}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-text-secondary">{t("sim.deterministicMode")}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!priceEngineParams.enableStochastic}
                      onClick={() => setPriceEngineParams({ ...priceEngineParams, enableStochastic: !priceEngineParams.enableStochastic })}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 focus:outline-none cursor-pointer ${!priceEngineParams.enableStochastic
                        ? "bg-accent-gold/80 border-accent-gold"
                        : "bg-bg-tertiary border-border-subtle"
                        }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${!priceEngineParams.enableStochastic ? "translate-x-[18px]" : "translate-x-[2px]"
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border-subtle" />

              {/* Economic Inertia Engine */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-text-secondary">{t("sim.inertiaEngine")}</label>
                  <button
                    onClick={() => setInertiaParams(DEFAULT_INERTIA_PARAMS)}
                    className="text-xs text-text-muted hover:text-accent-gold transition-colors cursor-pointer"
                  >
                    {t("sim.resetWeights")}
                  </button>
                </div>
                <p className="text-xs text-text-muted mb-3 leading-relaxed">{t("sim.inertiaEngineDesc")}</p>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-text-secondary mb-1.5 block">{t("sim.populationGrowth")}</span>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-muted">{t("sim.maxRate")}</span>
                      <span className="text-xs text-accent-gold font-mono">{(inertiaParams.maxGrowthRate * 100).toFixed(1)}%</span>
                    </div>
                    <input
                      type="range" min={0.5} max={3.0} step={0.1}
                      value={inertiaParams.maxGrowthRate * 100}
                      onChange={(e) => setInertiaParams({ ...inertiaParams, maxGrowthRate: Number(e.target.value) / 100 })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-bg-tertiary"
                      style={{ accentColor: "var(--accent-gold, #d4a853)" }}
                    />
                  </div>

                  <div>
                    <span className="text-xs font-medium text-text-secondary mb-1.5 block">{t("sim.gdpModel")}</span>

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-muted">{t("sim.capitalShare")}</span>
                      <span className="text-xs text-accent-gold font-mono">{inertiaParams.capitalShare.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min={0.2} max={0.5} step={0.01}
                      value={inertiaParams.capitalShare}
                      onChange={(e) => setInertiaParams({ ...inertiaParams, capitalShare: Number(e.target.value) })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-bg-tertiary mb-2"
                      style={{ accentColor: inertiaParams.capitalShare === 0.35 ? "var(--color-text-muted, #888)" : "var(--accent-gold, #d4a853)" }}
                    />

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-muted">{t("sim.tfpGrowth")}</span>
                      <span className="text-xs text-accent-gold font-mono">{(inertiaParams.baseTfpGrowth * 100).toFixed(1)}%</span>
                    </div>
                    <input
                      type="range" min={0.1} max={2.0} step={0.1}
                      value={inertiaParams.baseTfpGrowth * 100}
                      onChange={(e) => setInertiaParams({ ...inertiaParams, baseTfpGrowth: Number(e.target.value) / 100 })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-bg-tertiary mb-2"
                      style={{ accentColor: "var(--accent-gold, #d4a853)" }}
                    />

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-muted">{t("sim.tradeBonus")}</span>
                      <span className="text-xs text-accent-gold font-mono">{(inertiaParams.tradeGrowthBonus * 100).toFixed(1)}%</span>
                    </div>
                    <input
                      type="range" min={0.5} max={5.0} step={0.5}
                      value={inertiaParams.tradeGrowthBonus * 100}
                      onChange={(e) => setInertiaParams({ ...inertiaParams, tradeGrowthBonus: Number(e.target.value) / 100 })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-bg-tertiary"
                      style={{ accentColor: "var(--accent-gold, #d4a853)" }}
                    />
                  </div>

                  <div>
                    <span className="text-xs font-medium text-text-secondary mb-1.5 block">{t("sim.fiscalModel")}</span>

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-muted">{t("sim.interestRate")}</span>
                      <span className="text-xs text-accent-gold font-mono">{(inertiaParams.baseInterestRate * 100).toFixed(1)}%</span>
                    </div>
                    <input
                      type="range" min={1.0} max={15.0} step={0.5}
                      value={inertiaParams.baseInterestRate * 100}
                      onChange={(e) => setInertiaParams({ ...inertiaParams, baseInterestRate: Number(e.target.value) / 100 })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-bg-tertiary mb-2"
                      style={{ accentColor: "var(--accent-gold, #d4a853)" }}
                    />

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-muted">{t("sim.revenueElasticity")}</span>
                      <span className="text-xs text-accent-gold font-mono">{inertiaParams.revenueElasticity.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range" min={0.5} max={2.0} step={0.1}
                      value={inertiaParams.revenueElasticity}
                      onChange={(e) => setInertiaParams({ ...inertiaParams, revenueElasticity: Number(e.target.value) })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-bg-tertiary"
                      style={{ accentColor: inertiaParams.revenueElasticity === 1.1 ? "var(--color-text-muted, #888)" : "var(--accent-gold, #d4a853)" }}
                    />
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-text-secondary">{t("sim.disableInertia")}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!inertiaParams.enabled}
                      onClick={() => setInertiaParams({ ...inertiaParams, enabled: !inertiaParams.enabled })}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 focus:outline-none cursor-pointer ${!inertiaParams.enabled
                        ? "bg-accent-gold/80 border-accent-gold"
                        : "bg-bg-tertiary border-border-subtle"
                        }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${!inertiaParams.enabled ? "translate-x-[18px]" : "translate-x-[2px]"
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-between shrink-0">
          <button
            onClick={activeTab === "general" ? handleReset : resetSimDefaults}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            {t("settings.reset")}
          </button>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-xs text-green-500 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t("settings.saved")}
              </span>
            )}
            <button
              onClick={() => setShowSettings(false)}
              className="px-3 py-1.5 rounded text-xs text-text-secondary border border-border-subtle hover:border-border-active transition-colors cursor-pointer"
            >
              {t("settings.cancel")}
            </button>
            {activeTab === "general" && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 rounded text-xs font-semibold bg-accent-gold/20 text-accent-gold border border-accent-gold/40 hover:bg-accent-gold/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? t("settings.saving") : t("settings.save")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
