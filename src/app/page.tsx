"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import EventList from "@/components/EventList";
import Timeline from "@/components/Timeline";
import LanguageSwitch from "@/components/LanguageSwitch";
import CivilizationDetail from "@/components/CivilizationDetail";
import LlmStreamPanel from "@/components/LlmStreamPanel";
import EvolutionLogPanel from "@/components/EvolutionLogPanel";
import EraSelectModal from "@/components/EraSelectModal";
import type { HistoricalEvent, WorldState } from "@/lib/types";
import type { EpochChangelog } from "@/lib/changelog";

const WorldMap = dynamic(() => import("@/components/WorldMap"), { ssr: false });

export default function Home() {
  const { t } = useLocale();
  const setCurrentState = useWorldStore((s) => s.setCurrentState);
  const setPastEvents = useWorldStore((s) => s.setPastEvents);
  const setFutureEvents = useWorldStore((s) => s.setFutureEvents);
  const setFrontier = useWorldStore((s) => s.setFrontier);
  const setOriginTime = useWorldStore((s) => s.setOriginTime);
  const setViewingTime = useWorldStore((s) => s.setViewingTime);
  const setEvolutionLogs = useWorldStore((s) => s.setEvolutionLogs);
  const setShowLogPanel = useWorldStore((s) => s.setShowLogPanel);
  const isLoading = useWorldStore((s) => s.isLoading);
  const loadingStatus = useWorldStore((s) => s.loadingStatus);
  const viewingTime = useWorldStore((s) => s.viewingTime);
  const locale = useWorldStore((s) => s.locale);
  const selectedRegionId = useWorldStore((s) => s.selectedRegionId);
  const currentState = useWorldStore((s) => s.currentState);

  const [showEraModal, setShowEraModal] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [stateResp, eventsResp, logsResp] = await Promise.all([
          fetch("/api/state"),
          fetch("/api/events"),
          fetch("/api/logs"),
        ]);
        const stateData = await stateResp.json();
        const eventsData = await eventsResp.json();
        const logsData = await logsResp.json();

        if (stateData && !stateData.error) {
          setCurrentState(stateData as WorldState);
          setFrontier(stateData.timestamp);
          setViewingTime(stateData.timestamp);
        }

        if (eventsData.events) {
          const events = eventsData.events as HistoricalEvent[];
          setPastEvents(events.filter((e) => e.status === "processed"));
          setFutureEvents(events.filter((e) => e.status === "pending"));
        }
        if (eventsData.frontier) {
          setFrontier(eventsData.frontier);
        }
        if (eventsData.originTime) {
          setOriginTime(eventsData.originTime);
        }

        if (logsData.logs && logsData.logs.length > 0) {
          setEvolutionLogs(logsData.logs as EpochChangelog[]);
          setShowLogPanel(true);
        }
      } catch (err) {
        console.error("Init failed:", err);
      }
    }
    init();
  }, [setCurrentState, setPastEvents, setFutureEvents, setFrontier, setOriginTime, setViewingTime, setEvolutionLogs, setShowLogPanel]);

  useEffect(() => {
    async function loadSnapshot() {
      try {
        const resp = await fetch(
          `/api/state?year=${viewingTime.year}&month=${viewingTime.month}`
        );
        const data = await resp.json();
        if (data && !data.error) {
          setCurrentState(data as WorldState);
        }
      } catch (err) {
        console.error("Failed to load snapshot:", err);
      }
    }
    loadSnapshot();
  }, [viewingTime.year, viewingTime.month, setCurrentState]);

  const formatYear = (year: number) => {
    if (locale === "zh") {
      return year < 0 ? `公元前${Math.abs(year)}年` : `公元${year}年`;
    }
    return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
  };

  const handleEraSelect = async (eraId: string) => {
    setShowEraModal(false);

    const store = useWorldStore.getState();
    store.setIsLoading(true);
    store.setLoadingStatus(
      locale === "zh" ? "正在生成世界状态..." : "Generating world state..."
    );
    store.clearLlmStreams();
    store.clearEvolutionLogs();
    store.setShowLogPanel(false);
    store.setSelectedRegionId(null);

    try {
      const resp = await fetch("/api/playback/init-era", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eraId }),
      });

      if (!resp.ok || !resp.body) {
        console.error("Era init API error:", resp.status);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
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
    } catch (err) {
      console.error("Era init error:", err);
    } finally {
      useWorldStore.getState().setIsLoading(false);
      useWorldStore.getState().setLoadingStatus("");
    }
  };

  const eraName = currentState?.era
    ? currentState.era[locale]
    : locale === "zh" ? "青铜时代中期" : "Middle Bronze Age";

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="glass-panel px-4 py-2 flex items-center justify-between shrink-0 z-30 border-b border-border-subtle">
        <h1 className="font-cinzel text-sm font-bold tracking-wide text-accent-gold">
          {t("app.title")}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEraModal(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1 rounded border border-border-subtle text-text-secondary hover:text-accent-gold hover:border-border-active transition-all cursor-pointer text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>🏛</span>
            <span className="max-w-[120px] truncate">{eraName}</span>
            <span className="text-text-muted text-xs">▾</span>
          </button>
          <LanguageSwitch />
          <div className="font-mono text-xs px-2 py-1 rounded bg-bg-tertiary text-accent-amber">
            {formatYear(viewingTime.year)} M{viewingTime.month}
          </div>
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
        <CivilizationDetail />
        <EventList />
      </div>

      <Timeline />

      {showEraModal && (
        <EraSelectModal
          onConfirm={handleEraSelect}
          onCancel={() => setShowEraModal(false)}
        />
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
        store.setFrontier(state.timestamp as import("@/lib/types").YearMonth);
        store.setViewingTime(state.timestamp as import("@/lib/types").YearMonth);
        store.setOriginTime(state.timestamp as import("@/lib/types").YearMonth);
      }
      const events = data.events as { status: string }[] | undefined;
      if (events) {
        store.setPastEvents(
          events.filter((e) => e.status === "processed") as unknown as import("@/lib/types").HistoricalEvent[]
        );
        store.setFutureEvents(
          events.filter((e) => e.status === "pending") as unknown as import("@/lib/types").HistoricalEvent[]
        );
      }
      store.clearEvolutionLogs();
      store.setShowLogPanel(false);
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
