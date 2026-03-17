"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useWorldStore, detectLocale } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import EventList from "@/components/EventList";
import Timeline from "@/components/Timeline";
import LanguageSwitch from "@/components/LanguageSwitch";
import CivilizationDetail from "@/components/CivilizationDetail";
import LlmStreamPanel from "@/components/LlmStreamPanel";
import EvolutionLogPanel from "@/components/EvolutionLogPanel";
import WarsPanel from "@/components/WarsPanel";
import EconomicPanel from "@/components/EconomicPanel";
import RegionSearchBar from "@/components/RegionSearchBar";
import { useSettingsStore } from "@/store/useSettingsStore";
import { getLlmHeaders } from "@/lib/client-headers";
import { SUPPORTED_MODELS, DEFAULT_MODEL } from "@/lib/settings";
import type { HistoricalEvent, WorldState, War } from "@/lib/types";
import type { EpochChangelog } from "@/lib/changelog";
import { ERA_PRESETS } from "@/data/era-presets";

const DEFAULT_ERA_ID = "ai-age";

const WorldMap = dynamic(() => import("@/components/WorldMap"), { ssr: false });
const EraSelectModal = dynamic(() => import("@/components/EraSelectModal"), { ssr: false });
const WarDetailModal = dynamic(() => import("@/components/WarDetailModal"), { ssr: false });
const SettingsModal = dynamic(() => import("@/components/SettingsModal"), { ssr: false });
const WelcomeModal = dynamic(() => import("@/components/WelcomeModal"), { ssr: false });
const CommunityEventsModal = dynamic(() => import("@/components/CommunityEventsModal"), { ssr: false });

export default function Home() {
  const { t } = useLocale();

  // Only subscribe to values that drive rendering; setters accessed via getState()
  const evolutionLogs = useWorldStore((s) => s.evolutionLogs);
  const showLogPanel = useWorldStore((s) => s.showLogPanel);
  const activeWars = useWorldStore((s) => s.activeWars);
  const showWarsPanel = useWorldStore((s) => s.showWarsPanel);
  const showEconomicPanel = useWorldStore((s) => s.showEconomicPanel);
  const isLoading = useWorldStore((s) => s.isLoading);
  const loadingStatus = useWorldStore((s) => s.loadingStatus);
  const locale = useWorldStore((s) => s.locale);
  const selectedRegionId = useWorldStore((s) => s.selectedRegionId);
  const currentState = useWorldStore((s) => s.currentState);
  const viewingTime = useWorldStore((s) => s.viewingTime);

  const [showEraModal, setShowEraModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCommunityEvents, setShowCommunityEvents] = useState(false);
  const [requireApiKey, setRequireApiKey] = useState(false);
  const fetchServerState = useSettingsStore((s) => s.fetchServerState);
  const settingsModel = useSettingsStore((s) => s.model);
  const envModel = useSettingsStore((s) => s.envModel);
  const hasEnvKey = useSettingsStore((s) => s.hasEnvKey);
  const storedApiKey = useSettingsStore((s) => s.apiKey);
  const settingsLoaded = useSettingsStore((s) => s.settingsLoaded);

  const effectiveModelId = settingsModel || envModel || DEFAULT_MODEL;
  const effectiveModelLabel = SUPPORTED_MODELS.find((m) => m.id === effectiveModelId)?.label ?? effectiveModelId.split("/").pop();

  const autoLoadDefaultEra = () => {
    const defaultPreset = ERA_PRESETS.find((e) => e.id === DEFAULT_ERA_ID);
    if (!defaultPreset) return;
    const currentLocale = useWorldStore.getState().locale;
    const store = useWorldStore.getState();
    store.setIsLoading(true);
    store.setLoadingStatus(
      currentLocale === "zh"
        ? `正在加载「${defaultPreset.name.zh}」初始状态...`
        : `Loading "${defaultPreset.name.en}" initial state...`
    );
    store.clearLlmStreams();
    store.clearCompletedLlmRegions();
    store.clearEvolutionLogs();
    store.setShowLogPanel(false);
    store.setSelectedRegionId(null);
    store.setNeedsEvents(false);

    fetch("/api/playback/init-era", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getLlmHeaders() },
      body: JSON.stringify({ eraId: DEFAULT_ERA_ID }),
    })
      .then(async (resp) => {
        if (!resp.ok || !resp.body) {
          console.error("Auto era init API error:", resp.status);
          return;
        }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7);
            } else if (line.startsWith("data: ") && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6));
                handleEraSSE(currentEvent, data, useWorldStore.getState().locale);
              } catch { /* skip */ }
              currentEvent = "";
            }
          }
        }
      })
      .catch((err) => console.error("Auto era init error:", err))
      .finally(() => {
        useWorldStore.getState().setIsLoading(false);
        useWorldStore.getState().setLoadingStatus("");
      });
  };

  useEffect(() => {
    fetchServerState();
  }, [fetchServerState]);

  useEffect(() => {
    const real = detectLocale();
    if (real !== useWorldStore.getState().locale) {
      useWorldStore.getState().setLocale(real);
    }
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem("hcs-welcome-seen");
    if (!seen) { setShowWelcome(true); useWorldStore.getState().pushLayer("welcome"); }
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    if (!hasEnvKey && !storedApiKey) {
      setRequireApiKey(true);
      setShowWelcome(true);
      useWorldStore.getState().pushLayer("welcome");
    }
  }, [settingsLoaded, hasEnvKey, storedApiKey]);

  useEffect(() => {
    async function init() {
      try {
        const store = useWorldStore.getState();
        const [stateResp, eventsResp, logsResp] = await Promise.all([
          fetch("/api/state"),
          fetch("/api/events"),
          fetch("/api/logs"),
        ]);
        const stateData = await stateResp.json();
        const eventsData = await eventsResp.json();
        const logsData = await logsResp.json();

        let hasState = false;

        if (stateData && !stateData.error) {
          store.setCurrentState(stateData as WorldState);
          store.setFrontier(stateData.timestamp);
          store.setViewingTime(stateData.timestamp);
          if (stateData.wars) {
            store.setActiveWars(stateData.wars as War[]);
          }
          if (stateData.warSnapshots) {
            store.mergeWarSnapshots(stateData.warSnapshots);
          }
          hasState = true;
        }

        if (eventsData.events) {
          const events = eventsData.events as HistoricalEvent[];
          store.setPastEvents(events.filter((e) => e.status === "processed"));
          store.setFutureEvents(events.filter((e) => e.status === "pending"));
        }
        if (eventsData.frontier) {
          store.setFrontier(eventsData.frontier);
        }
        if (eventsData.originTime) {
          store.setOriginTime(eventsData.originTime);
        }
        if (eventsData.eraId) {
          store.setCurrentEraId(eventsData.eraId as string);
        }

        if (logsData.logs && logsData.logs.length > 0) {
          store.setEvolutionLogs(logsData.logs as EpochChangelog[]);
          store.setShowLogPanel(true);
        }

        if (!hasState) {
          autoLoadDefaultEra();
        }
      } catch (err) {
        console.error("Init failed:", err);
        autoLoadDefaultEra();
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadSnapshot() {
      const store = useWorldStore.getState();
      try {
        const resp = await fetch(
          `/api/state?year=${viewingTime.year}&month=${viewingTime.month}`
        );
        const data = await resp.json();
        if (data && !data.error) {
          store.setCurrentState(data as WorldState);
          if (data.wars) {
            store.setActiveWars(data.wars as War[]);
          }
          if (data.warSnapshots) {
            store.mergeWarSnapshots(data.warSnapshots);
          }
        }
      } catch (err) {
        console.error("Failed to load snapshot:", err);
      }
    }
    loadSnapshot();
  }, [viewingTime.year, viewingTime.month]);

  useEffect(() => {
    const LAYER_CLOSE: Record<string, () => void> = {
      welcome: () => { setShowWelcome(false); setRequireApiKey(false); },
      settings: () => useSettingsStore.getState().setShowSettings(false),
      eraModal: () => setShowEraModal(false),
      warDetail: () => useWorldStore.getState().setSelectedWar(null),
      regionDetail: () => useWorldStore.getState().setSelectedRegionId(null),
      economicPanel: () => useWorldStore.getState().setShowEconomicPanel(false),
      warsPanel: () => useWorldStore.getState().setShowWarsPanel(false),
      logPanel: () => useWorldStore.getState().setShowLogPanel(false),
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      const top = useWorldStore.getState().popLayer();
      if (top && LAYER_CLOSE[top]) {
        LAYER_CLOSE[top]();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const handleEraSelect = async (eraId: string) => {
    setShowEraModal(false);
    useWorldStore.getState().removeLayer("eraModal");

    const store = useWorldStore.getState();
    store.setIsLoading(true);
    store.setLoadingStatus(
      locale === "zh" ? "正在生成世界状态..." : "Generating world state..."
    );
    store.clearLlmStreams();
    store.clearCompletedLlmRegions();
    store.clearEvolutionLogs();
    store.setShowLogPanel(false);
    store.setSelectedRegionId(null);
    store.setNeedsEvents(false);

    try {
      const resp = await fetch("/api/playback/init-era", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getLlmHeaders() },
        body: JSON.stringify({ eraId }),
      });

      if (!resp.ok || !resp.body) {
        console.error("Era init API error:", resp.status);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              handleEraSSE(currentEvent, data, locale);
            } catch {
              // ignore
            }
            currentEvent = "";
          }
        }
      }

      if (buffer.trim()) {
        const remaining = buffer.split("\n");
        for (const line of remaining) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              handleEraSSE(currentEvent, data, locale);
            } catch {
              // ignore
            }
            currentEvent = "";
          }
        }
      }
    } catch (err) {
      console.error("Era init error:", err);
    } finally {
      useWorldStore.getState().setIsLoading(false);
      useWorldStore.getState().setLoadingStatus("");
    }
  };

  const eraNameRaw = currentState?.era
    ? currentState.era[locale]
    : locale === "zh" ? "青铜时代中期" : "Middle Bronze Age";
  const eraName = eraNameRaw
    .replace(/^[^:：]+[：:]\s*/, "")
    .replace(/\s*[（(]\s*(?:公元前?\d+年|\d+\s*(?:BCE?|CE|AD))\s*[）)]\s*$/, "");

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="glass-panel px-4 py-2 flex items-center justify-between shrink-0 z-50 border-b border-border-subtle relative">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-7 h-7" />
            <h1 className="font-cinzel text-lg font-bold tracking-wide text-accent-gold">
              {t("app.title")}
            </h1>
          </div>
          <div className="h-5 w-px bg-border-subtle" />
          <button
            onClick={() => {
              const next = !showLogPanel;
              const s = useWorldStore.getState();
              s.setShowLogPanel(next);
              if (next) {
                s.setShowWarsPanel(false);
                s.setShowEconomicPanel(false);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs cursor-pointer transition-all ${showLogPanel
              ? "border-accent-gold/60 bg-accent-gold/10 text-accent-gold"
              : "border-border-subtle text-text-muted hover:text-accent-gold hover:border-border-active"
              }`}
          >
            <span className="text-sm leading-none">📜</span>
            <span>{t("log.toggle")}</span>
            {evolutionLogs.length > 0 && (
              <span className="text-xs px-1 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold font-semibold min-w-[18px] text-center">
                {evolutionLogs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              const next = !showWarsPanel;
              const s = useWorldStore.getState();
              s.setShowWarsPanel(next);
              if (next) {
                s.setShowLogPanel(false);
                s.setShowEconomicPanel(false);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs cursor-pointer transition-all ${showWarsPanel
              ? "border-red-700/60 bg-red-900/25 text-red-300"
              : "border-border-subtle text-text-muted hover:text-red-400 hover:border-red-900/40"
              }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="3" x2="12" y2="12" />
              <line x1="12" y1="12" x2="20" y2="20" />
              <line x1="3" y1="7" x2="7" y2="3" />
              <line x1="17" y1="21" x2="21" y2="17" />
              <line x1="21" y1="3" x2="12" y2="12" />
              <line x1="12" y1="12" x2="4" y2="20" />
              <line x1="17" y1="3" x2="21" y2="7" />
              <line x1="3" y1="17" x2="7" y2="21" />
            </svg>
            <span>{t("war.title")}</span>
            {activeWars.length > 0 && (
              <span className="text-xs px-1 py-0.5 rounded-full bg-red-900/20 text-red-400 border border-red-900/30 font-semibold min-w-[18px] text-center">
                {activeWars.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              const next = !showEconomicPanel;
              const s = useWorldStore.getState();
              s.setShowEconomicPanel(next);
              if (next) {
                s.setShowLogPanel(false);
                s.setShowWarsPanel(false);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs cursor-pointer transition-all ${showEconomicPanel
              ? "border-accent-gold/60 bg-accent-gold/10 text-accent-gold"
              : "border-border-subtle text-text-muted hover:text-accent-gold hover:border-border-active"
              }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            <span>{t("economy")}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <RegionSearchBar />
          <button
            onClick={() => { setShowEraModal(true); useWorldStore.getState().pushLayer("eraModal"); }}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1 rounded border border-border-subtle text-text-secondary hover:text-accent-gold hover:border-border-active transition-all cursor-pointer text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>🏛</span>
            <span className="max-w-[120px] truncate">{eraName}</span>
            <span className="text-text-muted text-xs">▾</span>
          </button>
          <button
            onClick={() => useSettingsStore.getState().setShowSettings(true)}
            className="tooltip-wrap tooltip-below tooltip-multiline flex items-center gap-1.5 px-2.5 py-1 rounded border border-border-subtle text-text-muted hover:text-accent-gold hover:border-border-active transition-all cursor-pointer text-xs"
            data-tooltip={locale === "zh"
              ? `当前引擎：${effectiveModelLabel}。AI 基于大语言模型扮演历史学家，依据真实历史事件与用户自定义事件，科学推演各文明的兴衰变迁——王朝更替、战争胜负、经济涨落、人口迁徙、科技演进等，力求符合历史规律与因果逻辑。点击切换模型。`
              : `Engine: ${effectiveModelLabel}. Powered by LLM acting as a historian, it rigorously deduces each civilization's trajectory from both real historical events and user-defined scenarios — dynastic shifts, war outcomes, economic cycles, migrations, tech evolution — grounded in historical causality and logic. Click to switch.`
            }
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
              <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
              <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
            </svg>
            <span className="font-mono">{effectiveModelLabel}</span>
          </button>
          <button
            onClick={() => useSettingsStore.getState().setShowSettings(true)}
            className="tooltip-wrap tooltip-below flex items-center justify-center w-8 h-8 rounded-full border border-border-subtle text-text-secondary hover:text-accent-gold hover:border-border-active transition-all cursor-pointer"
            data-tooltip={t("settings.tooltip")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            onClick={() => { setShowWelcome(true); useWorldStore.getState().pushLayer("welcome"); }}
            className="tooltip-wrap tooltip-below flex items-center justify-center w-8 h-8 rounded-full border border-border-subtle text-text-secondary hover:text-accent-gold hover:border-border-active transition-all cursor-pointer"
            data-tooltip={locale === "zh" ? "关于" : "About"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
          <button
            onClick={() => setShowCommunityEvents(true)}
            className="tooltip-wrap tooltip-below flex items-center justify-center w-8 h-8 rounded-full border border-border-subtle text-text-secondary hover:text-accent-gold hover:border-border-active transition-all cursor-pointer"
            data-tooltip={t("communityEvents.viewAll")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </button>
          <LanguageSwitch />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Map */}
        <div className={`flex-1 relative ${selectedRegionId ? "map-dimmed" : ""}`}>
          <WorldMap />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-16 h-16 rounded-full loading-ring border-3 border-accent-gold border-t-transparent"
                  style={{
                    animation: "spin 1s linear infinite, pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
                  }}
                />
                <div className="text-sm font-cinzel animate-pulse text-center max-w-[360px] text-accent-gold">
                  {loadingStatus || t("loading.llm")}
                </div>
              </div>
            </div>
          )}

          <LlmStreamPanel />
        </div>

        <EvolutionLogPanel />
        <WarsPanel />
        <EconomicPanel />
        <CivilizationDetail />
        <EventList />
      </div>

      <Timeline />

      {showEraModal && (
        <EraSelectModal
          onConfirm={handleEraSelect}
          onCancel={() => { setShowEraModal(false); useWorldStore.getState().removeLayer("eraModal"); }}
        />
      )}

      <WarDetailModal />
      <SettingsModal />

      {showWelcome && (
        <WelcomeModal
          requireApiKey={requireApiKey}
          onClose={() => {
            setShowWelcome(false);
            setRequireApiKey(false);
            useWorldStore.getState().removeLayer("welcome");
            localStorage.setItem("hcs-welcome-seen", "1");
          }}
        />
      )}

      {showCommunityEvents && (
        <CommunityEventsModal onClose={() => setShowCommunityEvents(false)} />
      )}
    </div>
  );
}

function handleEraSSE(
  event: string,
  data: Record<string, unknown>,
  locale: "zh" | "en"
) {
  const store = useWorldStore.getState();

  switch (event) {
    case "progress": {
      const stage = data.stage as string;
      const era = data.era as { zh: string; en: string } | undefined;
      const eraName = era ? era[locale] : "";
      const tokens = data.tokens as number | undefined;

      if (stage === "loading_prebuilt") {
        store.setLoadingStatus(
          locale === "zh"
            ? `正在加载「${eraName}」的预构建数据...`
            : `Loading prebuilt data for "${eraName}"...`
        );
      } else if (stage === "generating_state") {
        store.setLoadingStatus(
          locale === "zh"
            ? `正在为「${eraName}」生成世界状态...`
            : `Generating world state for "${eraName}"...`
        );
      } else if (stage === "streaming") {
        const tokenInfo = tokens ? ` (${tokens} tokens)` : "";
        store.setLoadingStatus(
          locale === "zh"
            ? `AI 正在构建「${eraName}」的文明数据${tokenInfo}...`
            : `AI building civilization data for "${eraName}"${tokenInfo}...`
        );
      } else if (stage === "parsing") {
        store.setLoadingStatus(
          locale === "zh"
            ? `正在解析「${eraName}」的世界数据...`
            : `Parsing world data for "${eraName}"...`
        );
      } else if (stage === "saving") {
        store.setLoadingStatus(
          locale === "zh"
            ? `正在保存「${eraName}」的初始状态...`
            : `Saving initial state for "${eraName}"...`
        );
      }
      break;
    }

    case "done": {
      const state = data.state as Record<string, unknown> | undefined;
      if (state) {
        store.setCurrentState(state as unknown as import("@/lib/types").WorldState);
      }
      if (data.eraId) {
        store.setCurrentEraId(data.eraId as string);
      }
      if (data.frontier) {
        store.setFrontier(data.frontier as import("@/lib/types").YearMonth);
        store.setViewingTime(data.frontier as import("@/lib/types").YearMonth);
      } else if (state) {
        store.setFrontier(state.timestamp as import("@/lib/types").YearMonth);
        store.setViewingTime(state.timestamp as import("@/lib/types").YearMonth);
      }
      if (data.originTime) {
        store.setOriginTime(data.originTime as import("@/lib/types").YearMonth);
      } else if (state) {
        store.setOriginTime(state.timestamp as import("@/lib/types").YearMonth);
      }
      const events = data.events as { status: string }[] | undefined;
      if (events && events.length > 0) {
        store.setPastEvents(
          events.filter((e) => e.status === "processed") as unknown as import("@/lib/types").HistoricalEvent[]
        );
        store.setFutureEvents(
          events.filter((e) => e.status === "pending") as unknown as import("@/lib/types").HistoricalEvent[]
        );
      } else {
        store.setPastEvents([]);
        store.setFutureEvents([]);
      }
      const logs = data.evolutionLogs as unknown[] | undefined;
      if (logs && logs.length > 0) {
        store.setEvolutionLogs(logs as import("@/lib/changelog").EpochChangelog[]);
        store.setShowLogPanel(true);
      } else {
        store.clearEvolutionLogs();
        store.setShowLogPanel(false);
      }
      const wars = data.wars as import("@/lib/types").War[] | undefined;
      if (wars && wars.length > 0) {
        store.setActiveWars(wars);
      } else {
        store.setActiveWars([]);
      }
      store.clearWarSnapshots();
      if (data.needsEvents) {
        store.setNeedsEvents(true);
      }
      break;
    }

    case "error":
      console.error("Era SSE error:", data.error);
      store.setLoadingStatus(
        locale === "zh"
          ? `错误: ${data.error}`
          : `Error: ${data.error}`
      );
      break;
  }
}
