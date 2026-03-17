import { create } from "zustand";
import type { SupportedModelId, SimulationMode } from "@/lib/settings";
import { DEFAULT_MODEL } from "@/lib/settings";
import { useWorldStore } from "@/store/useWorldStore";

export type SettingsTab = "general" | "simulation";

interface SettingsStore {
  apiKey: string;
  model: SupportedModelId;
  simulationMode: SimulationMode;
  enableCivMemory: boolean;
  enableScenarioInjection: boolean;
  webSearchOnAdvance: boolean;
  enableDiplomatAgent: boolean;
  enablePresetEvents: boolean;
  hasEnvKey: boolean;
  envModel: string;
  showSettings: boolean;
  activeSettingsTab: SettingsTab;
  settingsLoaded: boolean;

  setApiKey: (key: string) => void;
  setModel: (model: SupportedModelId) => void;
  setSimulationMode: (mode: SimulationMode) => void;
  setEnableCivMemory: (enable: boolean) => void;
  setEnableScenarioInjection: (enable: boolean) => void;
  setWebSearchOnAdvance: (enable: boolean) => void;
  setEnableDiplomatAgent: (enable: boolean) => void;
  setEnablePresetEvents: (enable: boolean) => void;
  setHasEnvKey: (has: boolean) => void;
  setEnvModel: (model: string) => void;
  setShowSettings: (show: boolean, tab?: SettingsTab) => void;

  loadFromStorage: () => void | Promise<void>;
  syncToServer: () => Promise<void>;
  fetchServerState: () => Promise<void>;
}

const STORAGE_KEY = "hcs-settings";

interface StoredSettings {
  apiKey: string;
  model: SupportedModelId;
  simulationMode?: SimulationMode;
  enableCivMemory?: boolean;
  enableScenarioInjection?: boolean;
  webSearchOnAdvance?: boolean;
  enableDiplomatAgent?: boolean;
  enablePresetEvents?: boolean;
}

function isElectron(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as Record<string, unknown>).electronAPI;
}

function getElectronAPI(): { getAppSettings: () => Promise<StoredSettings>; setAppSettings: (s: Record<string, unknown>) => Promise<void> } | null {
  if (!isElectron()) return null;
  return (window as unknown as Record<string, unknown>).electronAPI as ReturnType<typeof getElectronAPI>;
}

async function loadStorageAsync(): Promise<StoredSettings | null> {
  const api = getElectronAPI();
  if (api) {
    try {
      const data = await api.getAppSettings();
      if (data && data.apiKey) return data;
      return null;
    } catch {
      return null;
    }
  }
  return loadStorageLocal();
}

function loadStorageLocal(): StoredSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function persistSettings(apiKey: string, model: SupportedModelId, simulationMode: SimulationMode, enableCivMemory: boolean, enableScenarioInjection: boolean, webSearchOnAdvance: boolean, enableDiplomatAgent: boolean, enablePresetEvents: boolean) {
  if (typeof window === "undefined") return;

  const payload = { apiKey, model, simulationMode, enableCivMemory, enableScenarioInjection, webSearchOnAdvance, enableDiplomatAgent, enablePresetEvents };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

  const api = getElectronAPI();
  if (api) {
    try {
      await api.setAppSettings(payload);
    } catch (err) {
      console.error("Failed to persist settings via Electron IPC:", err);
    }
  }
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  apiKey: "",
  model: DEFAULT_MODEL as SupportedModelId,
  simulationMode: "historical" as SimulationMode,
  enableCivMemory: false,
  enableScenarioInjection: false,
  webSearchOnAdvance: false,
  enableDiplomatAgent: false,
  enablePresetEvents: true,
  hasEnvKey: false,
  envModel: DEFAULT_MODEL,
  showSettings: false,
  activeSettingsTab: "general" as SettingsTab,
  settingsLoaded: false,

  setApiKey: (apiKey) => set({ apiKey }),
  setModel: (model) => set({ model }),
  setSimulationMode: (simulationMode) => set({ simulationMode }),
  setEnableCivMemory: (enableCivMemory) => set({ enableCivMemory }),
  setEnableScenarioInjection: (enableScenarioInjection) => set({ enableScenarioInjection }),
  setWebSearchOnAdvance: (webSearchOnAdvance) => set({ webSearchOnAdvance }),
  setEnableDiplomatAgent: (enableDiplomatAgent) => set({ enableDiplomatAgent }),
  setEnablePresetEvents: (enablePresetEvents) => set({ enablePresetEvents }),
  setHasEnvKey: (hasEnvKey) => set({ hasEnvKey }),
  setEnvModel: (envModel) => set({ envModel }),
  setShowSettings: (showSettings, tab) => {
    set({ showSettings, activeSettingsTab: tab ?? "general" });
    if (showSettings) useWorldStore.getState().pushLayer("settings");
    else useWorldStore.getState().removeLayer("settings");
  },

  loadFromStorage: async () => {
    const stored = await loadStorageAsync();
    if (stored) {
      set({
        apiKey: stored.apiKey,
        model: stored.model,
        simulationMode: stored.simulationMode ?? "historical",
        enableCivMemory: stored.enableCivMemory ?? false,
        enableScenarioInjection: stored.enableScenarioInjection ?? false,
        webSearchOnAdvance: stored.webSearchOnAdvance ?? false,
        enableDiplomatAgent: stored.enableDiplomatAgent ?? false,
        enablePresetEvents: stored.enablePresetEvents ?? true,
      });
    }
  },

  syncToServer: async () => {
    const { apiKey, model, simulationMode, enableCivMemory, enableScenarioInjection, webSearchOnAdvance, enableDiplomatAgent, enablePresetEvents } = get();
    await persistSettings(apiKey, model, simulationMode, enableCivMemory, enableScenarioInjection, webSearchOnAdvance, enableDiplomatAgent, enablePresetEvents);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, model, simulationMode, enableCivMemory, enableScenarioInjection, webSearchOnAdvance, enableDiplomatAgent, enablePresetEvents }),
    });
  },

  fetchServerState: async () => {
    try {
      const resp = await fetch("/api/settings");
      const data = await resp.json();

      const stored = await loadStorageAsync();
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
        updates.webSearchOnAdvance = stored.webSearchOnAdvance ?? false;
        updates.enableDiplomatAgent = stored.enableDiplomatAgent ?? false;
        updates.enablePresetEvents = stored.enablePresetEvents ?? true;
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
            webSearchOnAdvance: stored.webSearchOnAdvance ?? false,
            enableDiplomatAgent: stored.enableDiplomatAgent ?? false,
            enablePresetEvents: stored.enablePresetEvents ?? true,
          }),
        });
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      set({ settingsLoaded: true });
    }
  },
}));
