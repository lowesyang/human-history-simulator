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
  updateWarDetails,
  insertWarSnapshot,
  getWarSnapshotsForWars,
  hasWarSnapshotForYear,
} from "@/lib/db";
import { generateChangelog } from "@/lib/changelog";
import { extractWarsFromEvents, updateOngoingWarNarratives } from "@/lib/war-extractor";
import {
  findClosestSnapshotYear,
  mergeSnapshotGeometry,
} from "@/lib/geo-snapshots";
import { getSimulationMode } from "@/lib/settings";
import { applyClientHeaders } from "@/lib/api-headers";
import { checkThresholds } from "@/lib/agents/threshold-trigger";
import { processCivMemories } from "@/lib/agents/civ-memory";
import {
  insertEconomicSnapshot,
  insertAssetPrice,
  getLatestAssetPrices,
  listPortfolios,
  getLatestPortfolioSnapshot,
  insertPortfolioSnapshot,
} from "@/lib/economic-history";
import { updateAssetPrices, type AssetDef } from "@/lib/price-engine";
import { computeEconomicInertia, applyInertiaDelta } from "@/lib/economic-inertia";
import assetPricesData from "@/data/economic/asset-prices.json";
import type { WorldState, HistoricalEvent, Region, War, PriceEngineParams, InertiaParams } from "@/lib/types";
import { DEFAULT_PRICE_ENGINE_PARAMS, DEFAULT_INERTIA_PARAMS } from "@/lib/types";

const WAR_KEYWORDS = /战争|冲突|入侵|进攻|军事|war|conflict|invasion|attack|military|battle|siege|offensive|bombardment/i;

function hasWarRelatedEvents(events: HistoricalEvent[]): boolean {
  return events.some((e) => {
    if (e.category === "war") return true;
    const titleText = typeof e.title === "string" ? e.title : `${(e.title as { zh: string; en: string }).zh} ${(e.title as { zh: string; en: string }).en}`;
    const descText = typeof e.description === "string" ? e.description : `${(e.description as { zh: string; en: string }).zh} ${(e.description as { zh: string; en: string }).en}`;
    return WAR_KEYWORDS.test(titleText) || WAR_KEYWORDS.test(descText);
  });
}

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

  const hasWarEvents = hasWarRelatedEvents(pendingEvents);
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

  applyInertiaToRegions(currentState, targetYear, sendSSE, controller);

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

  captureEconomicSnapshots(result.regions as Region[], targetYear, sendSSE, controller);
  runPriceEngine(result.regions as Region[], pendingEvents, currentState.timestamp.year, targetYear, sendSSE, controller);
  revaluePortfolios(targetYear);

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

  processWars(rawWars, hasWarEvents, pendingEvents, targetYear, result.regions as Region[]);

  const activeWarsForYear = getActiveWars(targetYear) as War[];

  captureWarSnapshotsMultiYear(
    activeWarsForYear,
    currentState.regions,
    result.regions as Region[],
    years,
  );

  const warSnapshotsData = getWarSnapshotsForWars(activeWarsForYear.map((w) => w.id));
  sendSSE(controller, "war_update", {
    wars: activeWarsForYear,
    snapshots: warSnapshotsData,
  });

  updateOngoingWarNarratives(activeWarsForYear, result.regions as Region[], targetYear).catch(
    (err) => console.error("[Advance] War narrative update failed:", err)
  );

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

  const hasWarEvents = hasWarRelatedEvents(pendingEvents);
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

  applyInertiaToRegions(currentState, targetYear, sendSSE, controller);

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

  captureEconomicSnapshots(result.regions as Region[], targetYear, sendSSE, controller);
  runPriceEngine(result.regions as Region[], pendingEvents, currentState.timestamp.year, targetYear, sendSSE, controller);
  revaluePortfolios(targetYear);

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

  processWars(rawWars, hasWarEvents, pendingEvents, targetYear, result.regions as Region[]);

  const activeWarsForYear = getActiveWars(targetYear) as War[];

  captureWarSnapshotsWithBaseline(
    activeWarsForYear,
    currentState.regions,
    result.regions as Region[],
    targetYear,
  );

  const warSnapshotsData = getWarSnapshotsForWars(activeWarsForYear.map((w) => w.id));
  sendSSE(controller, "war_update", {
    wars: activeWarsForYear,
    snapshots: warSnapshotsData,
  });

  updateOngoingWarNarratives(activeWarsForYear, result.regions as Region[], targetYear).catch(
    (err) => console.error("[Advance] War narrative update failed:", err)
  );

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
  targetYear: number,
  regions: Region[]
) {
  if (!hasWarEvents || rawWars.length === 0) return;

  const existingWars = getActiveWars(targetYear) as War[];
  const regionIdSet = new Set(regions.map((r) => r.id));
  const insertedNames = new Set<string>();

  for (const w of rawWars) {
    if (!w.name || !w.belligerents) continue;

    for (const side of ["side1", "side2"] as const) {
      if (w.belligerents[side]?.regionIds) {
        w.belligerents[side].regionIds = resolveRegionIds(
          w.belligerents[side].regionIds, regionIdSet, regions
        );
      }
    }

    const nameKey = `${w.name.en}||${w.name.zh}`;
    if (insertedNames.has(nameKey)) continue;

    const existingMatch = existingWars.find(
      (ew) => ew.name.en === w.name!.en || ew.name.zh === w.name!.zh
    );

    if (existingMatch) {
      if (w.status && w.status !== "ongoing") {
        updateWarStatus(existingMatch.id, w.status, targetYear);
      }
      if (w.summary || w.advantages || w.impact) {
        updateWarDetails(
          existingMatch.id,
          w.summary || existingMatch.summary,
          w.advantages || existingMatch.advantages,
          w.impact || existingMatch.impact,
          targetYear
        );
      }
    } else {
      const llmStartYear = (w as Record<string, unknown>).startYear as number | undefined;
      const startYear = (llmStartYear && llmStartYear <= targetYear) ? llmStartYear : targetYear;
      const warId = `war-${uuidv4().slice(0, 8)}`;
      const warEventIds = pendingEvents.filter((e) => e.category === "war").map((e) => e.id);
      const war: War = {
        id: warId,
        name: w.name!,
        startYear,
        endYear: w.status && w.status !== "ongoing" ? targetYear : null,
        belligerents: w.belligerents!,
        cause: w.cause || { zh: "", en: "" },
        casus_belli: w.casus_belli || { zh: "", en: "" },
        status: w.status || "ongoing",
        victor: w.victor ?? null,
        summary: w.summary || { zh: "", en: "" },
        advantages: w.advantages || { side1: { zh: "", en: "" }, side2: { zh: "", en: "" } },
        impact: w.impact || { side1: { zh: "", en: "" }, side2: { zh: "", en: "" } },
        relatedEventIds: warEventIds,
        theater: w.theater,
        casualties: w.casualties,
        keyBattles: w.keyBattles,
      };
      insertWar(
        war.id, war.name, war.startYear, war.endYear,
        war.belligerents, war.cause, war.casus_belli,
        war.status, war.summary, war.advantages,
        war.impact, war.relatedEventIds, war.victor,
        war.theater, war.casualties, war.keyBattles
      );
      insertedNames.add(nameKey);
    }
  }
}

function resolveRegionIds(
  llmIds: string[],
  validIds: Set<string>,
  regions: Region[]
): string[] {
  const resolved: string[] = [];
  for (const id of llmIds) {
    if (validIds.has(id)) {
      resolved.push(id);
      continue;
    }
    const normalized = id.toLowerCase().replace(/[\s_-]+/g, "");
    let matched = false;
    for (const vid of validIds) {
      const vNorm = vid.toLowerCase().replace(/[\s_-]+/g, "");
      if (vNorm.includes(normalized) || normalized.includes(vNorm)) {
        resolved.push(vid);
        matched = true;
        break;
      }
    }
    if (!matched) {
      for (const r of regions) {
        const rName = typeof r.name === "string" ? r.name : `${r.name.en} ${r.name.zh}`;
        if (rName.toLowerCase().includes(normalized)) {
          resolved.push(r.id);
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      resolved.push(id);
    }
  }
  return resolved;
}

function captureWarSnapshotsWithBaseline(
  wars: War[],
  preRegions: Region[],
  postRegions: Region[],
  targetYear: number,
) {
  for (const war of wars) {
    const needsBaseline = war.startYear < targetYear && !hasWarSnapshotForYear(war.id, war.startYear);
    for (const side of ["side1", "side2"] as const) {
      const regionIds = war.belligerents[side].regionIds;
      const postSide = postRegions.filter((r) => regionIds.includes(r.id));
      const preSide = preRegions.filter((r) => regionIds.includes(r.id));

      if (needsBaseline && preSide.length > 0) {
        insertWarSnapshot(war.id, war.startYear, side, aggregateSideMetrics(preSide));
      }

      const regions = postSide.length > 0 ? postSide : preSide;
      if (regions.length === 0) continue;
      insertWarSnapshot(war.id, targetYear, side, aggregateSideMetrics(regions));
    }
  }
}

function captureWarSnapshotsMultiYear(
  wars: War[],
  preRegions: Region[],
  postRegions: Region[],
  years: number[],
) {
  if (wars.length === 0) return;

  const batchStart = years[0];
  const batchEnd = years[years.length - 1];

  for (const war of wars) {
    const warStart = war.startYear;
    const snapshotYears = [...years];
    if (warStart < batchStart) snapshotYears.unshift(warStart);
    const filteredYears = snapshotYears.filter((y) => y >= warStart);
    if (filteredYears.length === 0) continue;

    for (const side of ["side1", "side2"] as const) {
      const regionIds = war.belligerents[side].regionIds;
      const preSide = preRegions.filter((r) => regionIds.includes(r.id));
      const postSide = postRegions.filter((r) => regionIds.includes(r.id));

      if (preSide.length === 0 && postSide.length === 0) continue;

      const preMetrics = preSide.length > 0 ? aggregateSideMetrics(preSide) : aggregateSideMetrics(postSide);
      const postMetrics = postSide.length > 0 ? aggregateSideMetrics(postSide) : preMetrics;

      for (const year of filteredYears) {
        if (year <= batchStart) {
          insertWarSnapshot(war.id, year, side, preMetrics);
        } else if (year >= batchEnd) {
          insertWarSnapshot(war.id, year, side, postMetrics);
        } else {
          const ratio = (year - batchStart) / (batchEnd - batchStart);
          insertWarSnapshot(war.id, year, side, interpolateMetrics(preMetrics, postMetrics, ratio));
        }
      }
    }
  }
}

function interpolateMetrics(
  a: ReturnType<typeof aggregateSideMetrics>,
  b: ReturnType<typeof aggregateSideMetrics>,
  t: number
): ReturnType<typeof aggregateSideMetrics> {
  const lerp = (v1: number, v2: number) => Math.round(v1 + (v2 - v1) * t);
  return {
    totalTroops: lerp(a.totalTroops, b.totalTroops),
    standingArmy: lerp(a.standingArmy, b.standingArmy),
    militaryLevel: lerp(a.militaryLevel, b.militaryLevel),
    gdpGoldKg: Math.round((a.gdpGoldKg + (b.gdpGoldKg - a.gdpGoldKg) * t) * 100) / 100,
    population: lerp(a.population, b.population),
    techLevel: lerp(a.techLevel, b.techLevel),
    regionStatus: t < 0.5 ? a.regionStatus : b.regionStatus,
    casualties: lerp(a.casualties, b.casualties),
    morale: lerp(a.morale, b.morale),
  };
}

function aggregateSideMetrics(regions: Region[]) {
  const len = regions.length || 1;
  return {
    totalTroops: regions.reduce((s, r) => s + (r.military?.totalTroops ?? 0), 0),
    standingArmy: regions.reduce((s, r) => s + (r.military?.standingArmy ?? 0), 0),
    militaryLevel: Math.round(regions.reduce((s, r) => s + (r.military?.level ?? 0), 0) / len),
    gdpGoldKg: regions.reduce((s, r) => s + (r.economy?.gdpEstimate?.goldKg ?? 0), 0),
    population: regions.reduce((s, r) => s + (r.demographics?.population ?? 0), 0),
    techLevel: Math.round(regions.reduce((s, r) => s + (r.technology?.level ?? 0), 0) / len),
    regionStatus: regions[0]?.status ?? "stable",
    casualties: 0,
    morale: Math.round(regions.reduce((s, r) => s + (r.military?.morale?.level ?? 5), 0) / len),
  };
}

function captureEconomicSnapshots(
  regions: Region[],
  year: number,
  sendSSE?: (controller: ReadableStreamDefaultController, type: string, data: unknown) => void,
  controller?: ReadableStreamDefaultController
) {
  const snapshots: Record<string, Record<string, unknown>> = {};
  for (const region of regions) {
    const gk = (v: { goldKg?: number } | undefined) =>
      v?.goldKg ?? 0;
    const snap = {
      regionId: region.id,
      year,
      gdpGoldKg: gk(region.economy?.gdpEstimate),
      gdpPerCapitaGoldKg: gk(region.economy?.gdpPerCapita),
      treasuryGoldKg: gk(region.finances?.treasury),
      revenueGoldKg: gk(region.finances?.annualRevenue),
      expenditureGoldKg: gk(region.finances?.annualExpenditure),
      tradeVolumeGoldKg: gk(region.economy?.foreignTradeVolume),
      debtGoldKg: gk(region.finances?.debtLevel),
      militarySpendingPctGdp: region.military?.militarySpendingPctGdp ?? 0,
      population: region.demographics?.population ?? 0,
      urbanizationRate: region.demographics?.urbanizationRate ?? 0,
      giniEstimate: region.economy?.giniEstimate,
    };
    insertEconomicSnapshot(region.id, year, null, snap);
    snapshots[region.id] = snap;
  }
  if (sendSSE && controller) {
    sendSSE(controller, "economic_snapshots", { year, snapshots });
  }
}

function runPriceEngine(
  regions: Region[],
  events: HistoricalEvent[],
  fromYear: number,
  toYear: number,
  sendSSE: (controller: ReadableStreamDefaultController, type: string, data: unknown) => void,
  controller: ReadableStreamDefaultController
) {
  try {
    const yearDelta = toYear - fromYear;
    if (yearDelta <= 0) return;

    const seedAssets = (assetPricesData as { assets: AssetDef[] }).assets
      .filter((a: AssetDef) => a.availableFrom <= toYear && (a.availableTo >= 2023 || a.availableTo >= fromYear));
    if (seedAssets.length === 0) return;

    const latestPrices = getLatestAssetPrices();
    const currentPrices = new Map<string, number>();
    for (const p of latestPrices) {
      currentPrices.set(p.assetId, p.priceGoldGrams);
    }
    for (const asset of seedAssets) {
      if (!currentPrices.has(asset.id)) {
        const hist = asset.priceHistory;
        const closest = hist.reduce((best: { year: number; price: number }, pt: { year: number; price: number }) =>
          Math.abs(pt.year - fromYear) < Math.abs(best.year - fromYear) ? pt : best, hist[0]);
        if (closest) currentPrices.set(asset.id, closest.price);
      }
    }

    const params: PriceEngineParams = DEFAULT_PRICE_ENGINE_PARAMS;
    const rngSeed = fromYear * 31 + toYear;

    const { prices, shocks } = updateAssetPrices(
      currentPrices, seedAssets, events, regions, toYear, yearDelta, params, rngSeed
    );

    for (const tick of prices) {
      insertAssetPrice(
        tick.assetId, tick.year, null,
        tick.priceGoldGrams, tick.priceSilverGrams, tick.volatility, tick.eventDriver
      );
    }

    if (prices.length > 0) {
      sendSSE(controller, "asset_prices", { year: toYear, prices });
    }
    if (shocks.length > 0) {
      sendSSE(controller, "econ_shocks", { year: toYear, shocks });
    }
  } catch (err) {
    console.error("[Advance] Price engine error:", err);
  }
}

function revaluePortfolios(toYear: number) {
  try {
    const portfolios = listPortfolios();
    if (!portfolios.length) return;

    const latestPrices = getLatestAssetPrices();
    const priceMap = new Map<string, number>();
    for (const p of latestPrices) priceMap.set(p.assetId, p.priceGoldGrams);

    const seedAssets = (assetPricesData as { assets: AssetDef[] }).assets;
    for (const a of seedAssets) {
      if (!priceMap.has(a.id) && toYear >= a.availableFrom && (a.availableTo >= 2023 || toYear <= a.availableTo)) {
        const hist = a.priceHistory;
        const closest = hist.reduce(
          (best: { year: number; price: number }, pt: { year: number; price: number }) =>
            Math.abs(pt.year - toYear) < Math.abs(best.year - toYear) ? pt : best,
          hist[0]
        );
        if (closest) priceMap.set(a.id, closest.price);
      }
    }
    priceMap.set("gold", 1);

    for (const portfolio of portfolios) {
      const snap = getLatestPortfolioSnapshot(portfolio.id);
      if (!snap) continue;

      const holdings: Record<string, number> = snap.holdings ?? {};
      const cashGoldKg = snap.cashGoldKg ?? 0;
      const costBasis = snap.costBasis ?? {};
      const realizedPnl = snap.realizedPnlGoldKg ?? 0;
      let totalValue = cashGoldKg;

      for (const [assetId, qty] of Object.entries(holdings)) {
        if (qty <= 0) continue;
        const priceGrams = priceMap.get(assetId) ?? 0;
        totalValue += qty * (priceGrams / 1000);
      }

      insertPortfolioSnapshot(portfolio.id, toYear, totalValue, holdings, cashGoldKg, costBasis, realizedPnl);
    }
  } catch (err) {
    console.error("[Advance] Portfolio revaluation error:", err);
  }
}

function applyInertiaToRegions(
  state: WorldState,
  targetYear: number,
  sendSSE: (controller: ReadableStreamDefaultController, type: string, data: unknown) => void,
  controller: ReadableStreamDefaultController
) {
  try {
    const yearDelta = targetYear - state.timestamp.year;
    if (yearDelta <= 0) return;

    const params: InertiaParams = DEFAULT_INERTIA_PARAMS;
    const result = computeEconomicInertia(state.regions as Region[], yearDelta, params);

    if (result.deltas.length > 0) {
      for (const delta of result.deltas) {
        const region = (state.regions as Region[]).find((r) => r.id === delta.regionId);
        if (region) applyInertiaDelta(region, delta);
      }
      sendSSE(controller, "economic_inertia", {
        year: targetYear,
        summary: result.summary,
        deltasCount: result.deltas.length,
      });
    }
  } catch (err) {
    console.error("[Advance] Economic inertia error:", err);
  }
}
