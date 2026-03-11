import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { orchestrate } from "@/lib/agents";
import {
  getLatestSnapshot,
  getNextEpochEvents,
  getNEpochsEvents,
  insertSnapshot,
  markEventsProcessed,
  insertEvolutionLog,
  insertWar,
  getActiveWars,
  updateWarStatus,
} from "@/lib/db";
import { generateChangelog } from "@/lib/changelog";
import { extractWarsFromEvents } from "@/lib/war-extractor";
import {
  findClosestSnapshotYear,
  mergeSnapshotGeometry,
} from "@/lib/geo-snapshots";
import { getSimulationMode } from "@/lib/settings";
import { applyClientHeaders } from "@/lib/api-headers";
import { checkThresholds } from "@/lib/agents/threshold-trigger";
import { processCivMemories } from "@/lib/agents/civ-memory";
import type { WorldState, HistoricalEvent, Region, War } from "@/lib/types";

export async function POST(request: NextRequest) {
  applyClientHeaders(request);
  const body = await request.json();
  const epochs = Math.min(Math.max(body.epochs || 1, 1), 10);
  const excludedEventIds = new Set<string>(
    Array.isArray(body.excludedEventIds) ? body.excludedEventIds : []
  );

  const encoder = new TextEncoder();
  let closed = false;

  function sendSSE(
    controller: ReadableStreamDefaultController,
    event: string,
    data: unknown
  ) {
    if (closed) return;
    try {
      controller.enqueue(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      );
    } catch {
      closed = true;
    }
  }

  function safeClose(controller: ReadableStreamDefaultController) {
    if (closed) return;
    closed = true;
    try {
      controller.close();
    } catch {
      // already closed
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const preSnapshot = getLatestSnapshot();
        const preAdvanceYear = preSnapshot ? preSnapshot.year : null;
        sendSSE(controller, "pre_advance", { preAdvanceYear });

        const isSpeculative = getSimulationMode() === "speculative";

        if (epochs > 1) {
          await runBatchAdvance(controller, epochs, excludedEventIds, isSpeculative, sendSSE);
        } else {
          await runSingleAdvance(controller, excludedEventIds, isSpeculative, sendSSE);
        }

        safeClose(controller);
      } catch (error) {
        console.error("Playback advance error:", error);
        sendSSE(controller, "error", {
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
        safeClose(controller);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

type SSESender = (
  controller: ReadableStreamDefaultController,
  event: string,
  data: unknown
) => void;

async function runBatchAdvance(
  controller: ReadableStreamDefaultController,
  epochs: number,
  excludedEventIds: Set<string>,
  isSpeculative: boolean,
  sendSSE: SSESender
) {
  const allEpochEvents = getNEpochsEvents(epochs) as HistoricalEvent[];
  const pendingEvents = excludedEventIds.size > 0
    ? allEpochEvents.filter((e) => !excludedEventIds.has(e.id))
    : allEpochEvents;

  if (pendingEvents.length === 0) {
    if (allEpochEvents.length > 0) {
      markEventsProcessed(allEpochEvents.map((e) => e.id));
    }
    sendSSE(controller, "done", { error: "No pending events", done: true });
    return;
  }

  const years = [...new Set(pendingEvents.map((e) => e.timestamp.year))].sort((a, b) => a - b);
  const startYear = years[0];
  const endYear = years[years.length - 1];
  const targetYear = endYear;

  sendSSE(controller, "epoch_start", {
    epoch: 1,
    totalEpochs: 1,
    targetYear,
    startYear,
    endYear,
    eventCount: pendingEvents.length,
    yearSpan: years.length,
  });

  sendSSE(controller, "progress", {
    stage: "loading_events",
    epoch: 1,
    totalEpochs: 1,
    targetYear,
    eventCount: pendingEvents.length,
  });

  const latestSnapshot = getLatestSnapshot();
  if (!latestSnapshot) {
    sendSSE(controller, "error", { error: "No initial state found" });
    return;
  }

  const currentState: WorldState = {
    id: latestSnapshot.id,
    timestamp: { year: latestSnapshot.year, month: latestSnapshot.month },
    era: latestSnapshot.era,
    regions: latestSnapshot.regions as Region[],
    summary: latestSnapshot.summary,
  };

  const tokenBuffers = new Map<string, string>();
  let tokenFlushTimer: ReturnType<typeof setTimeout> | null = null;
  const flushTokens = () => {
    for (const [rid, buf] of tokenBuffers.entries()) {
      if (buf) {
        sendSSE(controller, "llm_token", { regionId: rid, token: buf });
      }
    }
    tokenBuffers.clear();
    tokenFlushTimer = null;
  };

  const warsForOrchestrate = getActiveWars(targetYear) as War[];

  const hasWarEvents = pendingEvents.some((e) => e.category === "war");
  const warPromise = hasWarEvents
    ? (async () => {
      try {
        return await extractWarsFromEvents(
          pendingEvents, currentState.regions, warsForOrchestrate, targetYear
        );
      } catch (err) {
        console.error("[Advance] War extraction failed:", err);
        return [];
      }
    })()
    : Promise.resolve([] as Partial<War>[]);

  const result = await orchestrate(
    currentState,
    pendingEvents,
    (stage, detail) => {
      if (stage === "clustering_done" || stage === "civ_agent_start" || stage === "group_start" || stage === "group_done") {
        sendSSE(controller, stage, { epoch: 1, totalEpochs: 1, targetYear, ...detail });
      } else {
        sendSSE(controller, "progress", {
          stage, epoch: 1, totalEpochs: 1, targetYear, ...detail,
        });
      }
    },
    (regionId, token) => {
      tokenBuffers.set(regionId, (tokenBuffers.get(regionId) || "") + token);
      if (!tokenFlushTimer) {
        tokenFlushTimer = setTimeout(flushTokens, 80);
      }
    },
    warsForOrchestrate,
    (regionIds) => {
      if (tokenFlushTimer) { clearTimeout(tokenFlushTimer); tokenFlushTimer = null; }
      flushTokens();
      sendSSE(controller, "llm_region_done", { regionIds });
    }
  );

  if (tokenFlushTimer) clearTimeout(tokenFlushTimer);
  flushTokens();

  sendSSE(controller, "progress", {
    stage: "saving", epoch: 1, totalEpochs: 1, targetYear,
  });

  const lastEvent = pendingEvents[pendingEvents.length - 1];
  const newSnapshotId = uuidv4();

  const prevSnapshotYear = findClosestSnapshotYear(currentState.timestamp.year);
  const newSnapshotYear = findClosestSnapshotYear(targetYear);
  if (newSnapshotYear !== prevSnapshotYear) {
    mergeSnapshotGeometry(result.regions as Region[], newSnapshotYear);
  }

  insertSnapshot(
    newSnapshotId,
    lastEvent.timestamp.year,
    lastEvent.timestamp.month,
    result.era as object,
    result.regions as object[],
    result.summary as object,
    lastEvent.id
  );

  const eventIds = allEpochEvents.map((e) => e.id);
  markEventsProcessed(eventIds);

  const lastState: WorldState = {
    id: newSnapshotId,
    timestamp: lastEvent.timestamp,
    era: result.era,
    regions: result.regions,
    triggeredByEventId: lastEvent.id,
    summary: result.summary,
  };

  if (isSpeculative) {
    const triggered = checkThresholds(currentState.regions, result.regions as Region[], {
      ...currentState, regions: result.regions as Region[],
    });
    if (triggered.length > 0) {
      sendSSE(controller, "triggered_events", { events: triggered });
    }
  }

  const directIds = new Set<string>();
  for (const evt of pendingEvents) {
    for (const rid of evt.affectedRegions) directIds.add(rid);
  }

  const changelog = generateChangelog(
    result.transitions,
    currentState.regions,
    pendingEvents,
    targetYear,
    result.era,
    result.summary,
    directIds,
    startYear !== endYear ? startYear : undefined,
    startYear !== endYear ? endYear : undefined,
  );

  const rawWars = await warPromise;
  sendSSE(controller, "changelog", changelog);
  insertEvolutionLog(targetYear, changelog);

  if (isSpeculative) {
    processCivMemories(result.transitions, targetYear);
  }

  processWars(rawWars, hasWarEvents, pendingEvents, targetYear);

  const activeWarsForYear = getActiveWars(targetYear) as War[];

  sendSSE(controller, "epoch_complete", {
    epoch: 1, totalEpochs: 1,
    state: lastState, wars: activeWarsForYear,
  });

  sendSSE(controller, "done", {
    state: lastState,
    processedEvents: pendingEvents.map((e) => e.id),
    wars: activeWarsForYear,
    done: false,
  });
}

async function runSingleAdvance(
  controller: ReadableStreamDefaultController,
  excludedEventIds: Set<string>,
  isSpeculative: boolean,
  sendSSE: SSESender
) {
  const allEpochEvents = getNextEpochEvents() as HistoricalEvent[];
  const pendingEvents = excludedEventIds.size > 0
    ? allEpochEvents.filter((e) => !excludedEventIds.has(e.id))
    : allEpochEvents;

  if (pendingEvents.length === 0) {
    if (allEpochEvents.length > 0) {
      markEventsProcessed(allEpochEvents.map((e) => e.id));
    }
    sendSSE(controller, "done", { error: "No pending events", done: true });
    return;
  }

  const targetYear = pendingEvents[0].timestamp.year;

  sendSSE(controller, "epoch_start", {
    epoch: 1, totalEpochs: 1, targetYear,
    eventCount: pendingEvents.length,
  });

  sendSSE(controller, "progress", {
    stage: "loading_events", epoch: 1, totalEpochs: 1,
    targetYear, eventCount: pendingEvents.length,
  });

  const latestSnapshot = getLatestSnapshot();
  if (!latestSnapshot) {
    sendSSE(controller, "error", { error: "No initial state found" });
    return;
  }

  const currentState: WorldState = {
    id: latestSnapshot.id,
    timestamp: { year: latestSnapshot.year, month: latestSnapshot.month },
    era: latestSnapshot.era,
    regions: latestSnapshot.regions as Region[],
    summary: latestSnapshot.summary,
  };

  const tokenBuffers = new Map<string, string>();
  let tokenFlushTimer: ReturnType<typeof setTimeout> | null = null;
  const flushTokens = () => {
    for (const [rid, buf] of tokenBuffers.entries()) {
      if (buf) {
        sendSSE(controller, "llm_token", { regionId: rid, token: buf });
      }
    }
    tokenBuffers.clear();
    tokenFlushTimer = null;
  };

  const warsForOrchestrate = getActiveWars(targetYear) as War[];

  const hasWarEvents = pendingEvents.some((e) => e.category === "war");
  const warPromise = hasWarEvents
    ? (async () => {
      try {
        return await extractWarsFromEvents(
          pendingEvents, currentState.regions, warsForOrchestrate, targetYear
        );
      } catch (err) {
        console.error("[Advance] War extraction failed:", err);
        return [];
      }
    })()
    : Promise.resolve([] as Partial<War>[]);

  const result = await orchestrate(
    currentState,
    pendingEvents,
    (stage, detail) => {
      if (stage === "clustering_done" || stage === "civ_agent_start" || stage === "group_start" || stage === "group_done") {
        sendSSE(controller, stage, { epoch: 1, totalEpochs: 1, targetYear, ...detail });
      } else {
        sendSSE(controller, "progress", {
          stage, epoch: 1, totalEpochs: 1, targetYear, ...detail,
        });
      }
    },
    (regionId, token) => {
      tokenBuffers.set(regionId, (tokenBuffers.get(regionId) || "") + token);
      if (!tokenFlushTimer) {
        tokenFlushTimer = setTimeout(flushTokens, 80);
      }
    },
    warsForOrchestrate,
    (regionIds) => {
      if (tokenFlushTimer) { clearTimeout(tokenFlushTimer); tokenFlushTimer = null; }
      flushTokens();
      sendSSE(controller, "llm_region_done", { regionIds });
    }
  );

  if (tokenFlushTimer) clearTimeout(tokenFlushTimer);
  flushTokens();

  sendSSE(controller, "progress", {
    stage: "saving", epoch: 1, totalEpochs: 1, targetYear,
  });

  const lastEvent = pendingEvents[pendingEvents.length - 1];
  const newSnapshotId = uuidv4();

  const prevSnapshotYear = findClosestSnapshotYear(currentState.timestamp.year);
  const newSnapshotYear = findClosestSnapshotYear(targetYear);
  if (newSnapshotYear !== prevSnapshotYear) {
    mergeSnapshotGeometry(result.regions as Region[], newSnapshotYear);
  }

  insertSnapshot(
    newSnapshotId,
    lastEvent.timestamp.year,
    lastEvent.timestamp.month,
    result.era as object,
    result.regions as object[],
    result.summary as object,
    lastEvent.id
  );

  const eventIds = allEpochEvents.map((e) => e.id);
  markEventsProcessed(eventIds);

  const lastState: WorldState = {
    id: newSnapshotId,
    timestamp: lastEvent.timestamp,
    era: result.era,
    regions: result.regions,
    triggeredByEventId: lastEvent.id,
    summary: result.summary,
  };

  if (isSpeculative) {
    const triggered = checkThresholds(currentState.regions, result.regions as Region[], {
      ...currentState, regions: result.regions as Region[],
    });
    if (triggered.length > 0) {
      sendSSE(controller, "triggered_events", { events: triggered });
    }
  }

  const directIds = new Set<string>();
  for (const evt of pendingEvents) {
    for (const rid of evt.affectedRegions) directIds.add(rid);
  }

  const changelog = generateChangelog(
    result.transitions, currentState.regions, pendingEvents,
    targetYear, result.era, result.summary, directIds
  );

  const rawWars = await warPromise;
  sendSSE(controller, "changelog", changelog);
  insertEvolutionLog(targetYear, changelog);

  if (isSpeculative) {
    processCivMemories(result.transitions, targetYear);
  }

  processWars(rawWars, hasWarEvents, pendingEvents, targetYear);

  const activeWarsForYear = getActiveWars(targetYear) as War[];

  sendSSE(controller, "epoch_complete", {
    epoch: 1, totalEpochs: 1,
    state: lastState, wars: activeWarsForYear,
  });

  sendSSE(controller, "done", {
    state: lastState,
    processedEvents: pendingEvents.map((e) => e.id),
    wars: activeWarsForYear,
    done: false,
  });
}

function processWars(
  rawWars: Partial<War>[],
  hasWarEvents: boolean,
  pendingEvents: HistoricalEvent[],
  targetYear: number
) {
  if (!hasWarEvents || rawWars.length === 0) return;

  const existingWars = getActiveWars(targetYear) as War[];
  for (const w of rawWars) {
    if (!w.name || !w.belligerents) continue;
    const existingMatch = existingWars.find(
      (ew) => ew.name.en === w.name!.en || ew.name.zh === w.name!.zh
    );
    if (existingMatch && w.status && w.status !== "ongoing") {
      updateWarStatus(existingMatch.id, w.status, targetYear);
    } else if (!existingMatch) {
      const warId = `war-${uuidv4().slice(0, 8)}`;
      const war: War = {
        id: warId,
        name: w.name!,
        startYear: targetYear,
        endYear: w.status && w.status !== "ongoing" ? targetYear : null,
        belligerents: w.belligerents!,
        cause: w.cause || { zh: "", en: "" },
        casus_belli: w.casus_belli || { zh: "", en: "" },
        status: w.status || "ongoing",
        victor: w.victor ?? null,
        summary: w.summary || { zh: "", en: "" },
        advantages: w.advantages || { side1: { zh: "", en: "" }, side2: { zh: "", en: "" } },
        impact: w.impact || { side1: { zh: "", en: "" }, side2: { zh: "", en: "" } },
        relatedEventIds: pendingEvents.filter((e) => e.category === "war").map((e) => e.id),
      };
      insertWar(
        war.id, war.name, war.startYear, war.endYear,
        war.belligerents, war.cause, war.casus_belli,
        war.status, war.summary, war.advantages,
        war.impact, war.relatedEventIds, war.victor
      );
    }
  }
}
