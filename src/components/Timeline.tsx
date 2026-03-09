"use client";

import { useState } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { useLocale } from "@/lib/i18n";
import AdvanceConfirmModal from "./AdvanceConfirmModal";
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

export default function Timeline() {
  const viewingTime = useWorldStore((s) => s.viewingTime);
  const setViewingTime = useWorldStore((s) => s.setViewingTime);
  const frontier = useWorldStore((s) => s.frontier);
  const epochCount = useWorldStore((s) => s.epochCount);
  const setEpochCount = useWorldStore((s) => s.setEpochCount);
  const isLoading = useWorldStore((s) => s.isLoading);
  const loadingStatus = useWorldStore((s) => s.loadingStatus);
  const showLogPanel = useWorldStore((s) => s.showLogPanel);
  const evolutionLogs = useWorldStore((s) => s.evolutionLogs);
  const { locale, t } = useLocale();

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
      setPreviewEvents(data.events || []);
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

    try {
      const resp = await fetch("/api/playback/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          epochs: store.epochCount,
          excludedEventIds,
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
      useWorldStore.getState().setPreAdvanceYear(null);
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
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  return (
    <>
      <div className="glass-panel border-t border-border-subtle px-4 py-3 flex items-center gap-4">
        {/* Log toggle button — leftmost */}
        {evolutionLogs.length > 0 && (
          <button
            onClick={() => useWorldStore.getState().setShowLogPanel(!showLogPanel)}
            className={`icon-btn tooltip-wrap border ${showLogPanel ? "border-accent-gold text-accent-gold" : "border-border-subtle text-text-muted"}`}
            data-tooltip={t("log.toggle")}
          >
            📜
          </button>
        )}

        {/* Epoch count selector */}
        <div
          className="tooltip-wrap flex items-center rounded-full overflow-visible border border-border-subtle"
          data-tooltip={
            locale === "zh"
              ? `一次性演进 ${epochCount} 个历史周期`
              : `Advance ${epochCount} epoch${epochCount > 1 ? "s" : ""} at once`
          }
        >
          {EPOCH_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setEpochCount(n)}
              disabled={isLoading}
              className={`px-2.5 py-1 text-xs font-semibold transition-all min-w-[28px] ${epochCount === n
                ? "bg-accent-gold text-bg-primary"
                : "bg-transparent text-text-muted"
                } ${isLoading ? "opacity-50" : ""}`}
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
            ⏹
          </button>
        ) : (
          <button
            onClick={handleAdvanceClick}
            disabled={isFetchingPreview}
            className="icon-btn tooltip-wrap border border-accent-gold text-accent-gold"
            data-tooltip={t("timeline.advance")}
            style={{ opacity: isFetchingPreview ? 0.6 : 1 }}
          >
            {isFetchingPreview ? "⏳" : "▶"}
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
          ↺
        </button>

        {/* Current time display */}
        <div className="font-mono text-sm whitespace-nowrap min-w-[180px] text-accent-gold">
          {formatYear(viewingTime.year, locale)}
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
}

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
      break;
    }

    case "progress":
      store.setLoadingStatus(formatStageText(data, locale));
      break;

    case "llm_token": {
      const regionId = data.regionId as string;
      const token = data.token as string;
      if (regionId && token) {
        store.appendLlmToken(regionId, token);
      }
      break;
    }

    case "changelog": {
      store.addEvolutionLog(data as unknown as import("@/lib/changelog").EpochChangelog);
      store.setShowLogPanel(true);
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
      refreshEvents();
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
