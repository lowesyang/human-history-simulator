import { create } from "zustand";
import type { SupportedModelId, SimulationMode } from "@/lib/settings";
import { DEFAULT_MODEL } from "@/lib/settings";

interface SettingsStore {
  apiKey: string;
  model: SupportedModelId;
  simulationMode: SimulationMode;
  enableCivMemory: boolean;
  enableScenarioInjection: boolean;
  hasEnvKey: boolean;
  envModel: string;
  showSettings: boolean;
  settingsLoaded: boolean;

  setApiKey: (key: string) => void;
  setModel: (model: SupportedModelId) => void;
  setSimulationMode: (mode: SimulationMode) => void;
  setEnableCivMemory: (enable: boolean) => void;
  setEnableScenarioInjection: (enable: boolean) => void;
  setHasEnvKey: (has: boolean) => void;
  setEnvModel: (model: string) => void;
  setShowSettings: (show: boolean) => void;

  loadFromStorage: () => void;
  syncToServer: () => Promise<void>;
  fetchServerState: () => Promise<void>;
}

const STORAGE_KEY = "hcs-settings";

function loadStorage(): { apiKey: string; model: SupportedModelId; simulationMode?: SimulationMode; enableCivMemory?: boolean; enableScenarioInjection?: boolean } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveStorage(apiKey: string, model: SupportedModelId, simulationMode: SimulationMode, enableCivMemory: boolean, enableScenarioInjection: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKey, model, simulationMode, enableCivMemory, enableScenarioInjection }));
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  apiKey: "",
  model: DEFAULT_MODEL as SupportedModelId,
  simulationMode: "historical" as SimulationMode,
  enableCivMemory: false,
  enableScenarioInjection: false,
  hasEnvKey: false,
  envModel: DEFAULT_MODEL,
  showSettings: false,
  settingsLoaded: false,

  setApiKey: (apiKey) => set({ apiKey }),
  setModel: (model) => set({ model }),
  setSimulationMode: (simulationMode) => set({ simulationMode }),
  setEnableCivMemory: (enableCivMemory) => set({ enableCivMemory }),
  setEnableScenarioInjection: (enableScenarioInjection) => set({ enableScenarioInjection }),
  setHasEnvKey: (hasEnvKey) => set({ hasEnvKey }),
  setEnvModel: (envModel) => set({ envModel }),
  setShowSettings: (showSettings) => set({ showSettings }),

  loadFromStorage: () => {
    const stored = loadStorage();
    if (stored) {
      set({
        apiKey: stored.apiKey,
        model: stored.model,
        simulationMode: stored.simulationMode ?? "historical",
        enableCivMemory: stored.enableCivMemory ?? false,
        enableScenarioInjection: stored.enableScenarioInjection ?? false,
      });
    }
  },

  syncToServer: async () => {
    const { apiKey, model, simulationMode, enableCivMemory, enableScenarioInjection } = get();
    saveStorage(apiKey, model, simulationMode, enableCivMemory, enableScenarioInjection);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, model, simulationMode, enableCivMemory, enableScenarioInjection }),
    });
  },

  fetchServerState: async () => {
    try {
      const resp = await fetch("/api/settings");
      const data = await resp.json();

      const stored = loadStorage();
      const updates: Partial<SettingsStore> = {
        hasEnvKey: data.hasEnvKey,
        envModel: data.envModel,
        settingsLoaded: true,
      };

      if (stored) {
        updates.apiKey = stored.apiKey;
        updates.model = stored.model;
        updates.simulationMode = stored.simulationMode ?? "historical";
        updates.enableCivMemory = stored.enableCivMemory ?? false;
        updates.enableScenarioInjection = stored.enableScenarioInjection ?? false;
      }

      set(updates);

      if (stored) {
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: stored.apiKey,
            model: stored.model,
            simulationMode: stored.simulationMode ?? "historical",
            enableCivMemory: stored.enableCivMemory ?? false,
            enableScenarioInjection: stored.enableScenarioInjection ?? false,
          }),
        });
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      set({ settingsLoaded: true });
    }
  },
}));
