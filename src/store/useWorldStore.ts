import { create } from "zustand";
import type {
  WorldState,
  HistoricalEvent,
  Region,
  YearMonth,
  War,
  WarMetricsSnapshot,
  SimulationParams,
  EconomicSnapshot,
  AssetPriceTick,
  ExchangeRatePoint,
  EconShock,
  EconomicPanelView,
  PriceEngineParams,
  InertiaParams,
} from "@/lib/types";
import { DEFAULT_SIMULATION_PARAMS, DEFAULT_PRICE_ENGINE_PARAMS, DEFAULT_INERTIA_PARAMS } from "@/lib/types";
import type { EpochChangelog } from "@/lib/changelog";

type Locale = "zh" | "en";

export function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("hcs-locale");
  if (saved === "zh" || saved === "en") return saved;
  const browserLang = navigator.language || "";
  return browserLang.startsWith("zh") ? "zh" : "en";
}

export type PipelinePhase =
  | "idle"
  | "loading_events"
  | "clustering"
  | "civ_agent"
  | "simulating"
  | "saving"
  | "done";

export interface PipelineGroupInfo {
  groupIndex: number;
  regionIds: string[];
  isOrphan: boolean;
  isDirect: boolean;
  status: "pending" | "running" | "done" | "error";
  startedAt?: number;
  doneAt?: number;
}

export interface PipelineState {
  phase: PipelinePhase;
  totalGroups: number;
  completedGroups: number;
  totalRegions: number;
  completedRegions: number;
  groups: PipelineGroupInfo[];
  isSpeculative: boolean;
  maxParallel: number;
  startedAt: number;
  phaseTimings: Partial<Record<PipelinePhase, number>>;
}

const EMPTY_PIPELINE: PipelineState = {
  phase: "idle",
  totalGroups: 0,
  completedGroups: 0,
  totalRegions: 0,
  completedRegions: 0,
  groups: [],
  isSpeculative: false,
  maxParallel: 1,
  startedAt: 0,
  phaseTimings: {},
};

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

  warSnapshots: Record<string, WarMetricsSnapshot[]>;
  setWarSnapshots: (warId: string, snapshots: WarMetricsSnapshot[]) => void;
  mergeWarSnapshots: (snapshots: Record<string, WarMetricsSnapshot[]>) => void;
  clearWarSnapshots: () => void;

  warNotifications: { id: string; message: string; type: "new" | "ended" | "update" }[];
  addWarNotification: (notification: { id: string; message: string; type: "new" | "ended" | "update" }) => void;
  removeWarNotification: (id: string) => void;

  preAdvanceYear: number | null;
  setPreAdvanceYear: (year: number | null) => void;

  llmEpochInfo: { epoch: number; totalEpochs: number; targetYear: number } | null;
  setLlmEpochInfo: (info: { epoch: number; totalEpochs: number; targetYear: number } | null) => void;

  scenarioPremises: string[];
  addScenarioPremise: (premise: string) => void;
  removeScenarioPremise: (index: number) => void;
  clearScenarioPremises: () => void;

  pipeline: PipelineState;
  setPipelinePhase: (phase: PipelinePhase) => void;
  setPipelineInfo: (info: Partial<PipelineState>) => void;
  updatePipelineGroup: (groupIndex: number, update: Partial<PipelineGroupInfo>) => void;
  setPipelineGroups: (groups: PipelineGroupInfo[]) => void;
  resetPipeline: () => void;

  simulationParams: SimulationParams;
  setSimulationParams: (params: SimulationParams) => void;

  showEconomicPanel: boolean;
  setShowEconomicPanel: (show: boolean) => void;

  economicPanelView: EconomicPanelView;
  setEconomicPanelView: (view: Partial<EconomicPanelView>) => void;

  economicHistory: Record<string, EconomicSnapshot[]>;
  setEconomicHistory: (data: Record<string, EconomicSnapshot[]>) => void;

  assetPrices: Record<string, AssetPriceTick[]>;
  setAssetPrices: (data: Record<string, AssetPriceTick[]>) => void;

  exchangeRates: ExchangeRatePoint[];
  setExchangeRates: (data: ExchangeRatePoint[]) => void;

  econShocks: EconShock[];
  addEconShock: (shock: EconShock) => void;
  clearEconShocks: () => void;

  priceEngineParams: PriceEngineParams;
  setPriceEngineParams: (params: PriceEngineParams) => void;

  inertiaParams: InertiaParams;
  setInertiaParams: (params: InertiaParams) => void;

  mapFlyTo: ((opts: { longitude: number; latitude: number; zoom?: number }) => void) | null;
  setMapFlyTo: (fn: ((opts: { longitude: number; latitude: number; zoom?: number }) => void) | null) => void;

  layerStack: string[];
  pushLayer: (id: string) => void;
  removeLayer: (id: string) => void;
  popLayer: () => string | null;
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  locale: "en" as Locale,
  setLocale: (locale) => {
    if (typeof window !== "undefined") localStorage.setItem("hcs-locale", locale);
    set({ locale });
  },

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
    const prev = get().selectedRegionId;
    const state = get().currentState;
    const region = id && state ? state.regions.find((r) => r.id === id) ?? null : null;
    set({ selectedRegionId: id, selectedRegion: region });
    if (id && !prev) get().pushLayer("regionDetail");
    else if (!id && prev) get().removeLayer("regionDetail");
    else if (id && prev && id !== prev) { /* layer already in stack */ }
  },
  selectedRegion: null,

  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),

  loadingStatus: "",
  setLoadingStatus: (loadingStatus) => set({ loadingStatus }),

  llmStreams: {},
  appendLlmToken: (() => {
    let buffer: Record<string, string> = {};
    let scheduled = false;
    return (regionId: string, token: string) => {
      buffer[regionId] = (buffer[regionId] || "") + token;
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(() => {
          const pending = buffer;
          buffer = {};
          scheduled = false;
          useWorldStore.setState((state) => {
            const next = { ...state.llmStreams };
            for (const [id, tokens] of Object.entries(pending)) {
              next[id] = (next[id] || "") + tokens;
            }
            return { llmStreams: next };
          });
        });
      }
    };
  })(),
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
  setShowLogPanel: (showLogPanel) => {
    set({ showLogPanel });
    if (showLogPanel) get().pushLayer("logPanel");
    else get().removeLayer("logPanel");
  },

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
  setSelectedWar: (selectedWar) => {
    const prev = get().selectedWar;
    set({ selectedWar });
    if (selectedWar && !prev) get().pushLayer("warDetail");
    else if (!selectedWar && prev) get().removeLayer("warDetail");
  },

  showWarsPanel: false,
  setShowWarsPanel: (showWarsPanel) => {
    set({ showWarsPanel });
    if (showWarsPanel) get().pushLayer("warsPanel");
    else get().removeLayer("warsPanel");
  },

  warSnapshots: {},
  setWarSnapshots: (warId, snapshots) =>
    set((state) => ({
      warSnapshots: { ...state.warSnapshots, [warId]: snapshots },
    })),
  mergeWarSnapshots: (snapshots) =>
    set((state) => ({
      warSnapshots: { ...state.warSnapshots, ...snapshots },
    })),
  clearWarSnapshots: () => set({ warSnapshots: {} }),

  warNotifications: [],
  addWarNotification: (notification) =>
    set((state) => ({
      warNotifications: [...state.warNotifications, notification],
    })),
  removeWarNotification: (id) =>
    set((state) => ({
      warNotifications: state.warNotifications.filter((n) => n.id !== id),
    })),

  preAdvanceYear: null,
  setPreAdvanceYear: (preAdvanceYear) => set({ preAdvanceYear }),

  llmEpochInfo: null,
  setLlmEpochInfo: (llmEpochInfo) => set({ llmEpochInfo }),

  scenarioPremises: [],
  addScenarioPremise: (premise) =>
    set((state) => ({ scenarioPremises: [...state.scenarioPremises, premise] })),
  removeScenarioPremise: (index) =>
    set((state) => ({
      scenarioPremises: state.scenarioPremises.filter((_, i) => i !== index),
    })),
  clearScenarioPremises: () => set({ scenarioPremises: [] }),

  pipeline: { ...EMPTY_PIPELINE },
  setPipelinePhase: (phase) =>
    set((state) => ({
      pipeline: {
        ...state.pipeline,
        phase,
        phaseTimings: { ...state.pipeline.phaseTimings, [phase]: Date.now() },
      },
    })),
  setPipelineInfo: (info) =>
    set((state) => ({ pipeline: { ...state.pipeline, ...info } })),
  updatePipelineGroup: (groupIndex, update) =>
    set((state) => {
      const groups = state.pipeline.groups.map((g) =>
        g.groupIndex === groupIndex ? { ...g, ...update } : g
      );
      const completedGroups = groups.filter((g) => g.status === "done" || g.status === "error").length;
      const completedRegions = groups
        .filter((g) => g.status === "done" || g.status === "error")
        .reduce((sum, g) => sum + g.regionIds.length, 0);
      return {
        pipeline: { ...state.pipeline, groups, completedGroups, completedRegions },
      };
    }),
  setPipelineGroups: (groups) =>
    set((state) => ({
      pipeline: {
        ...state.pipeline,
        groups,
        totalGroups: groups.length,
        totalRegions: groups.reduce((s, g) => s + g.regionIds.length, 0),
      },
    })),
  resetPipeline: () => set({ pipeline: { ...EMPTY_PIPELINE } }),

  simulationParams: (() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hcs-simulation-params");
        if (saved) return JSON.parse(saved) as SimulationParams;
      } catch { /* use default */ }
    }
    return { ...DEFAULT_SIMULATION_PARAMS };
  })(),
  setSimulationParams: (simulationParams) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hcs-simulation-params", JSON.stringify(simulationParams));
    }
    set({ simulationParams });
  },

  showEconomicPanel: false,
  setShowEconomicPanel: (showEconomicPanel) => {
    set({ showEconomicPanel });
    if (showEconomicPanel) get().pushLayer("economicPanel");
    else get().removeLayer("economicPanel");
  },

  economicPanelView: {
    mode: "gdptrend",
    selectedAssetIds: [],
    selectedRegionIds: [],
    denomination: "gold",
    timeRange: { from: -2000, to: 2023 },
  },
  setEconomicPanelView: (view) =>
    set((state) => ({
      economicPanelView: { ...state.economicPanelView, ...view },
    })),

  economicHistory: {},
  setEconomicHistory: (economicHistory) => set({ economicHistory }),

  assetPrices: {},
  setAssetPrices: (assetPrices) => set({ assetPrices }),

  exchangeRates: [],
  setExchangeRates: (exchangeRates) => set({ exchangeRates }),

  econShocks: [],
  addEconShock: (shock) =>
    set((state) => ({ econShocks: [...state.econShocks, shock] })),
  clearEconShocks: () => set({ econShocks: [] }),

  priceEngineParams: (() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hcs-price-engine-params");
        if (saved) return JSON.parse(saved) as PriceEngineParams;
      } catch { /* use default */ }
    }
    return { ...DEFAULT_PRICE_ENGINE_PARAMS };
  })(),
  setPriceEngineParams: (priceEngineParams) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hcs-price-engine-params", JSON.stringify(priceEngineParams));
    }
    set({ priceEngineParams });
  },

  inertiaParams: (() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hcs-inertia-params");
        if (saved) return JSON.parse(saved) as InertiaParams;
      } catch { /* use default */ }
    }
    return { ...DEFAULT_INERTIA_PARAMS };
  })(),
  setInertiaParams: (inertiaParams) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hcs-inertia-params", JSON.stringify(inertiaParams));
    }
    set({ inertiaParams });
  },

  mapFlyTo: null,
  setMapFlyTo: (mapFlyTo) => set({ mapFlyTo }),

  layerStack: [],
  pushLayer: (id) =>
    set((state) => ({
      layerStack: [...state.layerStack.filter((l) => l !== id), id],
    })),
  removeLayer: (id) =>
    set((state) => ({
      layerStack: state.layerStack.filter((l) => l !== id),
    })),
  popLayer: () => {
    const stack = get().layerStack;
    if (stack.length === 0) return null;
    const top = stack[stack.length - 1];
    set({ layerStack: stack.slice(0, -1) });
    return top;
  },
}));
