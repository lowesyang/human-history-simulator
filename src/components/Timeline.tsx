"use client";

import { useState, useMemo } from "react";
import React from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import { getLlmHeaders } from "@/lib/client-headers";
import AdvanceConfirmModal from "./AdvanceConfirmModal";
import SimulationControlPanel from "./SimulationControlPanel";
import type { HistoricalEvent } from "@/lib/types";

function formatYear(year: number, locale: "zh" | "en") {
  if (locale === "zh") {
    return year < 0
      ? `公元前${Math.abs(year)}年`
      : `公元${year}年`;
  }
  return year < 0
    ? `${Math.abs(year)} BCE`
    : `${year} CE`;
}

function getRegionNames(ids: string[], locale: "zh" | "en"): string {
  const state = useWorldStore.getState().currentState;
  if (!state) return ids.join(", ");
  return ids
    .map((id) => {
      const region = state.regions.find((r) => r.id === id);
      return region ? region.name[locale] : id;
    })
    .join(", ");
}

function formatStageText(
  data: Record<string, unknown>,
  locale: "zh" | "en"
): string {
  const stage = data.stage as string;
  const epoch = data.epoch as number;
  const total = data.totalEpochs as number;
  const year = data.targetYear as number | undefined;
  const prefix =
    total > 1
      ? `[${epoch}/${total}] `
      : "";

  const yearStr = year
    ? locale === "zh"
      ? year < 0
        ? `公元前${Math.abs(year)}年`
        : `公元${year}年`
      : year < 0
        ? `${Math.abs(year)} BCE`
        : `${year} CE`
    : "";

  switch (stage) {
    case "loading_events": {
      const count = data.eventCount as number;
      return locale === "zh"
        ? `${prefix}加载 ${yearStr} 的 ${count} 个历史事件...`
        : `${prefix}Loading ${count} events for ${yearStr}...`;
    }
    case "simulating": {
      const ids = data.regionIds as string[] | undefined;
      const regionNames = ids ? getRegionNames(ids, locale) : "";
      const hint = regionNames ? ` — ${regionNames}` : "";
      return locale === "zh"
        ? `${prefix}AI 正在推演 ${yearStr} 的历史走向${hint}...`
        : `${prefix}AI simulating ${yearStr}${hint}...`;
    }
    case "saving":
      return locale === "zh"
        ? `${prefix}保存 ${yearStr} 的世界状态...`
        : `${prefix}Saving world state for ${yearStr}...`;
    default:
      return locale === "zh" ? "正在进行历史演变..." : "Simulating...";
  }
}

const EPOCH_OPTIONS = [1, 3, 5, 10];

export default React.memo(function Timeline() {
  const viewingTime = useWorldStore((s) => s.viewingTime);
  const setViewingTime = useWorldStore((s) => s.setViewingTime);
  const frontier = useWorldStore((s) => s.frontier);
  const epochCount = useWorldStore((s) => s.epochCount);
  const setEpochCount = useWorldStore((s) => s.setEpochCount);
  const isLoading = useWorldStore((s) => s.isLoading);
  const loadingStatus = useWorldStore((s) => s.loadingStatus);
  const currentState = useWorldStore((s) => s.currentState);
  const { locale, t } = useLocale();

  const eraName = useMemo(() => {
    const raw = currentState?.era
      ? currentState.era[locale]
      : locale === "zh" ? "青铜时代中期" : "Middle Bronze Age";
    return raw
      .replace(/^[^:：]+[：:]\s*/, "")
      .replace(/\s*[（(]\s*(?:公元前?\d+年|\d+\s*(?:BCE?|CE|AD))\s*[）)]\s*$/, "");
  }, [currentState?.era, locale]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<HistoricalEvent[]>([]);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);

  const originTime = useWorldStore((s) => s.originTime);
  const startYear = originTime.year;
  const frontierYear = frontier.year;
  const viewYear = viewingTime.year;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const year = parseInt(e.target.value, 10);
    setViewingTime({ year, month: 1 });
  };

  const handleAdvanceClick = async () => {
    setIsFetchingPreview(true);
    try {
      const store = useWorldStore.getState();
      const resp = await fetch(`/api/events/preview?epochs=${store.epochCount}`);
      const data = await resp.json();
      let events = data.events || [];

      if (events.length === 0 && store.futureEvents.length > 0) {
        await fetch("/api/events/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: store.futureEvents }),
        });
        const retryResp = await fetch(`/api/events/preview?epochs=${store.epochCount}`);
        const retryData = await retryResp.json();
        events = retryData.events || [];
      }

      setPreviewEvents(events);
      setShowConfirmModal(true);
    } catch (err) {
      console.error("Failed to fetch preview:", err);
    } finally {
      setIsFetchingPreview(false);
    }
  };

  const handleConfirmAdvance = async (excludedEventIds: string[]) => {
    setShowConfirmModal(false);
    setPreviewEvents([]);

    const store = useWorldStore.getState();
    const abortCtrl = new AbortController();
    store.setAbortController(abortCtrl);
    store.setIsLoading(true);
    store.setLoadingStatus(
      locale === "zh" ? "正在连接..." : "Connecting..."
    );
    store.clearLlmStreams();
    store.clearCompletedLlmRegions();
    store.setLlmEpochInfo(null);

    try {
      const resp = await fetch("/api/playback/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getLlmHeaders() },
        body: JSON.stringify({
          epochs: store.epochCount,
          excludedEventIds,
          simulationParams: store.simulationParams,
        }),
        signal: abortCtrl.signal,
      });

      if (!resp.ok || !resp.body) {
        console.error("Advance API error:", resp.status);
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
              handleSSEEvent(currentEvent, data, locale);
            } catch {
              // ignore parse errors for partial chunks
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
              handleSSEEvent(currentEvent, data, locale);
            } catch {
              // ignore
            }
            currentEvent = "";
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      console.error("Advance error:", err);
    } finally {
      useWorldStore.getState().setIsLoading(false);
      useWorldStore.getState().setLoadingStatus("");
      useWorldStore.getState().setAbortController(null);
      useWorldStore.getState().clearLlmStreams();
      useWorldStore.getState().clearCompletedLlmRegions();
      useWorldStore.getState().setPreAdvanceYear(null);
      useWorldStore.getState().setLlmEpochInfo(null);
      useWorldStore.getState().resetPipeline();
    }
  };

  const handleCancelAdvance = () => {
    setShowConfirmModal(false);
    setPreviewEvents([]);
  };

  const handleAbort = async () => {
    const store = useWorldStore.getState();
    const ctrl = store.abortController;
    if (ctrl) ctrl.abort();
    store.setIsLoading(false);
    store.setLoadingStatus("");
    store.setAbortController(null);

    const rollbackYear = store.preAdvanceYear;
    store.setPreAdvanceYear(null);

    if (rollbackYear != null) {
      try {
        const resp = await fetch("/api/playback/rollback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year: rollbackYear }),
        });
        const data = await resp.json();
        if (data.state) {
          store.setCurrentState(data.state);
          store.setFrontier(data.state.timestamp);
          store.setViewingTime(data.state.timestamp);
        }
        if (data.events) {
          store.setPastEvents(
            data.events.filter((e: { status: string }) => e.status === "processed")
          );
          store.setFutureEvents(
            data.events.filter((e: { status: string }) => e.status === "pending")
          );
        }
        if (data.wars) {
          store.setActiveWars(data.wars);
        }
      } catch (err) {
        console.error("Rollback failed:", err);
      }
    }
  };

  const handleReset = async () => {
    if (!confirm(t("timeline.resetConfirm"))) return;

    try {
      const resp = await fetch("/api/playback/reset", { method: "POST" });
      const data = await resp.json();
      if (data.error) {
        console.error("Reset failed:", data.error);
        return;
      }
      const store = useWorldStore.getState();
      if (data.state) {
        store.setCurrentState(data.state);
        store.setFrontier(data.state.timestamp);
        store.setViewingTime(data.state.timestamp);
      }
      if (data.originTime) {
        store.setOriginTime(data.originTime);
      } else if (data.state) {
        store.setOriginTime(data.state.timestamp);
      }
      if (data.events) {
        store.setPastEvents(
          data.events.filter((e: { status: string }) => e.status === "processed")
        );
        store.setFutureEvents(
          data.events.filter((e: { status: string }) => e.status === "pending")
        );
      }
      store.clearEvolutionLogs();
      store.setShowLogPanel(false);
      store.setActiveWars([]);
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  return (
    <>
      <div className="glass-panel border-t border-border-subtle px-4 py-3 flex items-center gap-4">
        {/* Epoch count selector */}
        <div
          className="flex items-center rounded-full overflow-visible border border-border-subtle"
        >
          {EPOCH_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setEpochCount(n)}
              disabled={isLoading}
              className={`tooltip-wrap px-2.5 py-1 text-xs font-semibold transition-all min-w-[28px] ${epochCount === n
                ? "bg-accent-gold text-bg-primary"
                : "bg-transparent text-text-muted"
                } ${isLoading ? "opacity-50" : ""}`}
              data-tooltip={
                locale === "zh"
                  ? `一次性演进 ${n} 个历史周期`
                  : `Advance ${n} epoch${n > 1 ? "s" : ""} at once`
              }
              style={{
                borderRadius:
                  n === EPOCH_OPTIONS[0]
                    ? "9999px 0 0 9999px"
                    : n === EPOCH_OPTIONS[EPOCH_OPTIONS.length - 1]
                      ? "0 9999px 9999px 0"
                      : "0",
              }}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Advance / Stop button */}
        {isLoading ? (
          <button
            onClick={handleAbort}
            className="icon-btn icon-btn-danger tooltip-wrap border border-[#dc503c] text-[#dc503c]"
            data-tooltip={t("timeline.stop")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleAdvanceClick}
            disabled={isFetchingPreview}
            className="icon-btn tooltip-wrap border border-accent-gold text-accent-gold"
            data-tooltip={t("timeline.advance")}
            style={{ opacity: isFetchingPreview ? 0.6 : 1 }}
          >
            {isFetchingPreview ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="6,4 20,12 6,20" />
              </svg>
            )}
          </button>
        )}

        {/* Reset button */}
        <button
          onClick={handleReset}
          disabled={isLoading}
          className="icon-btn tooltip-wrap border border-border-subtle text-text-muted"
          data-tooltip={t("timeline.reset")}
          style={{ opacity: isLoading ? 0.4 : 1 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>

        {/* Simulation tuning */}
        <SimulationControlPanel />

        {/* Era & Year display */}
        <div className="era-banner-inline">
          <div className="era-banner-year">
            {formatYear(viewingTime.year, locale)}
          </div>
          <div className="era-banner-divider" />
          <div className="era-banner-name">
            {eraName}
          </div>
        </div>

        {/* Timeline slider */}
        <div className="flex-1 relative">
          <input
            type="range"
            min={startYear}
            max={frontierYear}
            value={Math.min(viewYear, frontierYear)}
            onChange={handleSliderChange}
            className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-accent-gold"
            style={{
              background: `linear-gradient(to right, var(--color-accent-gold) ${((Math.min(viewYear, frontierYear) - startYear) /
                Math.max(frontierYear - startYear, 1)) *
                100
                }%, var(--color-bg-tertiary) 0%)`,
            }}
          />
        </div>

        {/* Loading status */}
        {isLoading && loadingStatus && (
          <div className="text-xs animate-pulse whitespace-nowrap max-w-[400px] truncate text-accent-amber">
            {loadingStatus}
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {showConfirmModal && (
        <AdvanceConfirmModal
          events={previewEvents}
          epochs={epochCount}
          onConfirm={handleConfirmAdvance}
          onCancel={handleCancelAdvance}
        />
      )}
    </>
  );
});

function handleSSEEvent(
  event: string,
  data: Record<string, unknown>,
  locale: "zh" | "en"
) {
  const store = useWorldStore.getState();

  switch (event) {
    case "pre_advance": {
      const preAdvanceYear = data.preAdvanceYear as number | null;
      store.setPreAdvanceYear(preAdvanceYear);
      store.resetPipeline();
      store.setPipelineInfo({ startedAt: Date.now() });
      store.setShowLogPanel(false);
      break;
    }

    case "epoch_start": {
      store.clearLlmStreams();
      store.clearCompletedLlmRegions();
      const epoch = data.epoch as number;
      const totalEpochs = data.totalEpochs as number;
      const targetYear = data.targetYear as number;
      store.setLlmEpochInfo({ epoch, totalEpochs, targetYear });
      store.setPipelinePhase("loading_events");
      break;
    }

    case "clustering_done": {
      const groups = data.groups as { groupIndex: number; regionIds: string[]; isOrphan: boolean; isDirect: boolean }[];
      if (groups) {
        store.setPipelineGroups(
          groups.map((g) => ({
            ...g,
            status: "pending" as const,
          }))
        );
      }
      store.setPipelinePhase("clustering");
      break;
    }

    case "civ_agent_start": {
      store.setPipelinePhase("civ_agent");
      store.setPipelineInfo({
        isSpeculative: true,
        maxParallel: (data.maxParallel as number) || 1,
      });
      break;
    }

    case "group_start": {
      const groupIndex = data.groupIndex as number;
      store.updatePipelineGroup(groupIndex, { status: "running", startedAt: Date.now() });
      const group = store.pipeline.groups.find((g) => g.groupIndex === groupIndex);
      if (group) {
        const names = getRegionNames(group.regionIds.slice(0, 4), locale);
        const extra = group.regionIds.length > 4 ? (locale === "zh" ? ` 等${group.regionIds.length}国` : ` +${group.regionIds.length - 4} more`) : "";
        const epochInfo = store.llmEpochInfo;
        const yearStr = epochInfo
          ? locale === "zh"
            ? epochInfo.targetYear < 0 ? `公元前${Math.abs(epochInfo.targetYear)}年` : `公元${epochInfo.targetYear}年`
            : epochInfo.targetYear < 0 ? `${Math.abs(epochInfo.targetYear)} BCE` : `${epochInfo.targetYear} CE`
          : "";
        store.setLoadingStatus(
          locale === "zh"
            ? `AI 正在推演 ${yearStr} 的历史走向 — ${names}${extra}...`
            : `AI simulating ${yearStr} — ${names}${extra}...`
        );
      }
      break;
    }

    case "group_done": {
      const groupIndex = data.groupIndex as number;
      const success = data.success as boolean;
      store.updatePipelineGroup(groupIndex, {
        status: success ? "done" : "error",
        doneAt: Date.now(),
      });
      break;
    }

    case "progress": {
      const stage = data.stage as string;
      if (stage === "simulating") {
        store.setPipelinePhase("simulating");
        store.setPipelineInfo({
          maxParallel: (data.maxParallel as number) || store.pipeline.maxParallel,
        });
      } else if (stage === "saving") {
        store.setPipelinePhase("saving");
      }
      store.setLoadingStatus(formatStageText(data, locale));
      break;
    }

    case "llm_token": {
      const regionId = data.regionId as string;
      const token = data.token as string;
      if (regionId && token) {
        store.appendLlmToken(regionId, token);
      }
      break;
    }

    case "llm_region_done": {
      const regionIds = data.regionIds as string[];
      if (regionIds) {
        store.markLlmRegionDone(regionIds);
      }
      break;
    }

    case "changelog": {
      store.addEvolutionLog(data as unknown as import("@/lib/changelog").EpochChangelog);
      break;
    }

    case "epoch_complete": {
      const state = data.state as Record<string, unknown> | undefined;
      if (state) {
        store.setCurrentState(state as unknown as import("@/lib/types").WorldState);
        store.setFrontier(
          state.timestamp as import("@/lib/types").YearMonth
        );
        store.setViewingTime(
          state.timestamp as import("@/lib/types").YearMonth
        );
      }
      const epochWars = data.wars as import("@/lib/types").War[] | undefined;
      if (epochWars) {
        store.setActiveWars(epochWars);
      }
      break;
    }

    case "economic_snapshots": {
      const snapshots = data.snapshots as Record<string, import("@/lib/types").EconomicSnapshot> | undefined;
      if (snapshots) {
        const prev = store.economicHistory;
        const year = data.year as number;
        const next = { ...prev };
        for (const [regionId, snap] of Object.entries(snapshots)) {
          const existing = next[regionId] ?? [];
          const filtered = existing.filter((s) => s.year !== year);
          next[regionId] = [...filtered, { ...snap, regionId, year }];
        }
        store.setEconomicHistory(next);
      }
      break;
    }

    case "asset_prices": {
      const prices = data.prices as import("@/lib/types").AssetPriceTick[] | undefined;
      if (prices && prices.length > 0) {
        const prev = store.assetPrices;
        const next = { ...prev };
        for (const tick of prices) {
          const existing = next[tick.assetId] ?? [];
          next[tick.assetId] = [...existing.filter((t) => t.year !== tick.year), tick];
        }
        store.setAssetPrices(next);
      }
      break;
    }

    case "econ_shocks": {
      const shocks = data.shocks as import("@/lib/types").EconShock[] | undefined;
      if (shocks) {
        for (const shock of shocks) {
          store.addEconShock(shock);
        }
      }
      break;
    }

    case "done": {
      const state = data.state as Record<string, unknown> | undefined;
      if (state) {
        store.setCurrentState(state as unknown as import("@/lib/types").WorldState);
        store.setFrontier(
          state.timestamp as import("@/lib/types").YearMonth
        );
        store.setViewingTime(
          state.timestamp as import("@/lib/types").YearMonth
        );
      }
      const doneWars = data.wars as import("@/lib/types").War[] | undefined;
      if (doneWars) {
        store.setActiveWars(doneWars);
      }
      store.setPipelinePhase("done");
      refreshEvents();
      refreshEconomicData();
      break;
    }

    case "war_update": {
      const warUpdateSnapshots = data.snapshots as Record<string, import("@/lib/types").WarMetricsSnapshot[]> | undefined;
      if (warUpdateSnapshots) {
        store.mergeWarSnapshots(warUpdateSnapshots);
      }
      const prevWars = store.activeWars;
      const newWars = data.wars as import("@/lib/types").War[] | undefined;
      if (newWars) {
        const prevIds = new Set(prevWars.map((w) => w.id));
        for (const w of newWars) {
          if (!prevIds.has(w.id)) {
            const warName = w.name[locale] || w.name.en;
            store.addWarNotification({
              id: `new-${w.id}-${Date.now()}`,
              message: locale === "zh" ? `战争爆发：${warName}` : `War Declared: ${warName}`,
              type: "new",
            });
          }
        }
        for (const w of newWars) {
          const prev = prevWars.find((pw) => pw.id === w.id);
          if (prev && prev.status === "ongoing" && w.status !== "ongoing") {
            const warName = w.name[locale] || w.name.en;
            const statusLabel = locale === "zh"
              ? (w.status === "ceasefire" ? "停战" : w.status.includes("victory") ? "胜利" : "僵持")
              : (w.status === "ceasefire" ? "Ceasefire" : w.status.includes("victory") ? "Victory" : "Stalemate");
            store.addWarNotification({
              id: `end-${w.id}-${Date.now()}`,
              message: `${statusLabel}: ${warName}`,
              type: "ended",
            });
          }
        }
        store.setActiveWars(newWars);
      }
      break;
    }

    case "error":
      console.error("SSE error:", data.error);
      store.setLoadingStatus(
        locale === "zh"
          ? `错误: ${data.error}`
          : `Error: ${data.error}`
      );
      break;
  }
}

async function refreshEvents() {
  try {
    const resp = await fetch("/api/events");
    const data = await resp.json();
    const events = data.events || [];
    useWorldStore
      .getState()
      .setPastEvents(
        events.filter((e: { status: string }) => e.status === "processed")
      );
    useWorldStore
      .getState()
      .setFutureEvents(
        events.filter((e: { status: string }) => e.status === "pending")
      );
  } catch (err) {
    console.error("Failed to refresh events:", err);
  }
}

async function refreshEconomicData() {
  try {
    const store = useWorldStore.getState();
    const [snapshotsResp, assetResp] = await Promise.all([
      fetch("/api/economic-history"),
      fetch("/api/asset-prices?latest=true&exchangeRates=true"),
    ]);
    if (snapshotsResp.ok) {
      const s = await snapshotsResp.json();
      store.setEconomicHistory(s.snapshots ?? {});
    }
    if (assetResp.ok) {
      const a = await assetResp.json();
      const pricesByAsset: Record<string, { assetId: string; year: number; priceGoldGrams: number; priceSilverGrams: number; volatility: number }[]> = {};
      for (const p of a.prices ?? []) {
        if (!pricesByAsset[p.assetId]) pricesByAsset[p.assetId] = [];
        pricesByAsset[p.assetId].push(p);
      }
      store.setAssetPrices(pricesByAsset);
      if (a.exchangeRates) store.setExchangeRates(a.exchangeRates);
    }
  } catch (err) {
    console.error("Failed to refresh economic data:", err);
  }
}
