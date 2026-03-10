import { create } from "zustand";
import type {
  WorldState,
  HistoricalEvent,
  Region,
  YearMonth,
  War,
} from "@/lib/types";
import type { EpochChangelog } from "@/lib/changelog";

type Locale = "zh" | "en";

interface WorldStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;

  epochCount: number;
  setEpochCount: (count: number) => void;

  currentState: WorldState | null;
  setCurrentState: (state: WorldState | null) => void;

  pastEvents: HistoricalEvent[];
  futureEvents: HistoricalEvent[];
  setPastEvents: (events: HistoricalEvent[]) => void;
  setFutureEvents: (events: HistoricalEvent[]) => void;

  frontier: YearMonth;
  setFrontier: (frontier: YearMonth) => void;

  originTime: YearMonth;
  setOriginTime: (time: YearMonth) => void;

  viewingTime: YearMonth;
  setViewingTime: (time: YearMonth) => void;

  selectedRegionId: string | null;
  setSelectedRegionId: (id: string | null) => void;
  selectedRegion: Region | null;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  loadingStatus: string;
  setLoadingStatus: (status: string) => void;

  llmStreams: Record<string, string>;
  appendLlmToken: (regionId: string, token: string) => void;
  clearLlmStreams: () => void;

  completedLlmRegions: Set<string>;
  markLlmRegionDone: (regionIds: string[]) => void;
  clearCompletedLlmRegions: () => void;

  evolutionLogs: EpochChangelog[];
  addEvolutionLog: (log: EpochChangelog) => void;
  setEvolutionLogs: (logs: EpochChangelog[]) => void;
  clearEvolutionLogs: () => void;

  showLogPanel: boolean;
  setShowLogPanel: (show: boolean) => void;

  abortController: AbortController | null;
  setAbortController: (ctrl: AbortController | null) => void;

  isGeneratingEvents: boolean;
  setIsGeneratingEvents: (generating: boolean) => void;

  eventGenAbortController: AbortController | null;
  setEventGenAbortController: (ctrl: AbortController | null) => void;

  needsEvents: boolean;
  setNeedsEvents: (needs: boolean) => void;

  currentEraId: string | null;
  setCurrentEraId: (eraId: string | null) => void;

  activeWars: War[];
  setActiveWars: (wars: War[]) => void;

  selectedWar: War | null;
  setSelectedWar: (war: War | null) => void;

  showWarsPanel: boolean;
  setShowWarsPanel: (show: boolean) => void;

  preAdvanceYear: number | null;
  setPreAdvanceYear: (year: number | null) => void;
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  locale: "zh",
  setLocale: (locale) => set({ locale }),

  epochCount: 1,
  setEpochCount: (epochCount) => set({ epochCount }),

  currentState: null,
  setCurrentState: (currentState) => {
    set({ currentState });
    const selectedId = get().selectedRegionId;
    if (selectedId && currentState) {
      const region =
        currentState.regions.find((r) => r.id === selectedId) ?? null;
      set({ selectedRegion: region });
    }
  },

  pastEvents: [],
  futureEvents: [],
  setPastEvents: (pastEvents) => set({ pastEvents }),
  setFutureEvents: (futureEvents) => set({ futureEvents }),

  frontier: { year: -1600, month: 1 },
  setFrontier: (frontier) => set({ frontier }),

  originTime: { year: -1600, month: 1 },
  setOriginTime: (originTime) => set({ originTime }),

  viewingTime: { year: -1600, month: 1 },
  setViewingTime: (viewingTime) => set({ viewingTime }),

  selectedRegionId: null,
  setSelectedRegionId: (id) => {
    const state = get().currentState;
    const region = id && state ? state.regions.find((r) => r.id === id) ?? null : null;
    set({ selectedRegionId: id, selectedRegion: region });
  },
  selectedRegion: null,

  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),

  loadingStatus: "",
  setLoadingStatus: (loadingStatus) => set({ loadingStatus }),

  llmStreams: {},
  appendLlmToken: (regionId, token) =>
    set((state) => ({
      llmStreams: {
        ...state.llmStreams,
        [regionId]: (state.llmStreams[regionId] || "") + token,
      },
    })),
  clearLlmStreams: () => set({ llmStreams: {} }),

  completedLlmRegions: new Set(),
  markLlmRegionDone: (regionIds) =>
    set((state) => {
      const next = new Set(state.completedLlmRegions);
      for (const id of regionIds) next.add(id);
      return { completedLlmRegions: next };
    }),
  clearCompletedLlmRegions: () => set({ completedLlmRegions: new Set() }),

  evolutionLogs: [],
  addEvolutionLog: (log) =>
    set((state) => ({ evolutionLogs: [...state.evolutionLogs, log] })),
  setEvolutionLogs: (evolutionLogs) => set({ evolutionLogs }),
  clearEvolutionLogs: () => set({ evolutionLogs: [] }),

  showLogPanel: false,
  setShowLogPanel: (showLogPanel) => set({ showLogPanel }),

  abortController: null,
  setAbortController: (abortController) => set({ abortController }),

  isGeneratingEvents: false,
  setIsGeneratingEvents: (isGeneratingEvents) => set({ isGeneratingEvents }),

  eventGenAbortController: null,
  setEventGenAbortController: (eventGenAbortController) => set({ eventGenAbortController }),

  needsEvents: false,
  setNeedsEvents: (needsEvents) => set({ needsEvents }),

  currentEraId: null,
  setCurrentEraId: (currentEraId) => set({ currentEraId }),

  activeWars: [],
  setActiveWars: (activeWars) => set({ activeWars }),

  selectedWar: null,
  setSelectedWar: (selectedWar) => set({ selectedWar }),

  showWarsPanel: false,
  setShowWarsPanel: (showWarsPanel) => set({ showWarsPanel }),

  preAdvanceYear: null,
  setPreAdvanceYear: (preAdvanceYear) => set({ preAdvanceYear }),
}));
