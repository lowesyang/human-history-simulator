import { create } from "zustand";
import type { SupportedModelId } from "@/lib/settings";
import { DEFAULT_MODEL } from "@/lib/settings";

interface SettingsStore {
  apiKey: string;
  model: SupportedModelId;
  hasEnvKey: boolean;
  envModel: string;
  showSettings: boolean;

  setApiKey: (key: string) => void;
  setModel: (model: SupportedModelId) => void;
  setHasEnvKey: (has: boolean) => void;
  setEnvModel: (model: string) => void;
  setShowSettings: (show: boolean) => void;

  loadFromStorage: () => void;
  syncToServer: () => Promise<void>;
  fetchServerState: () => Promise<void>;
}

const STORAGE_KEY = "hcs-settings";

function loadStorage(): { apiKey: string; model: SupportedModelId } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveStorage(apiKey: string, model: SupportedModelId) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKey, model }));
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  apiKey: "",
  model: DEFAULT_MODEL as SupportedModelId,
  hasEnvKey: false,
  envModel: DEFAULT_MODEL,
  showSettings: false,

  setApiKey: (apiKey) => set({ apiKey }),
  setModel: (model) => set({ model }),
  setHasEnvKey: (hasEnvKey) => set({ hasEnvKey }),
  setEnvModel: (envModel) => set({ envModel }),
  setShowSettings: (showSettings) => set({ showSettings }),

  loadFromStorage: () => {
    const stored = loadStorage();
    if (stored) {
      set({ apiKey: stored.apiKey, model: stored.model });
    }
  },

  syncToServer: async () => {
    const { apiKey, model } = get();
    saveStorage(apiKey, model);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, model }),
    });
  },

  fetchServerState: async () => {
    try {
      const resp = await fetch("/api/settings");
      const data = await resp.json();
      set({
        hasEnvKey: data.hasEnvKey,
        envModel: data.envModel,
      });

      const stored = loadStorage();
      if (stored) {
        set({ apiKey: stored.apiKey, model: stored.model });
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: stored.apiKey, model: stored.model }),
        });
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  },
}));
