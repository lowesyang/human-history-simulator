import type { WorldState, HistoricalEvent, Region, LocalizedText, War, SimulationParams } from "../types";
import type { AgentContext, ProgressCallback, TokenStreamCallback } from "./types";
import type { RegionTransition, TransitionResult } from "../transition";
import { applyTransition } from "../transition";
import { runHistorian } from "./historian";
import { buildRelationGraph, clusterRegions, type RegionGroup } from "../region-grouping";
import { getModelProfile, getSimulationMode, getWebSearchOnAdvance } from "../settings";
import { getLlmUsageStats, resetLlmUsageStats } from "./llm-client";
import { runCivAgentBatch, selectKeyRegions } from "./civ-agent";

function getMaxParallel(): number {
  const envVal = process.env.LLM_MAX_PARALLEL;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return getModelProfile().maxParallel;
}

export interface OrchestrateResult {
  era: LocalizedText;
  summary: LocalizedText;
  regions: Region[];
  transitions: RegionTransition[];
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
  taskTimeoutMs?: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIdx = 0;
  const PER_TASK_TIMEOUT = taskTimeoutMs ?? 150_000;

  async function worker() {
    while (nextIdx < tasks.length) {
      const idx = nextIdx++;
      const startTime = Date.now();
      try {
        results[idx] = await Promise.race([
          tasks[idx](),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Task ${idx} timed out after ${PER_TASK_TIMEOUT}ms`)), PER_TASK_TIMEOUT)
          ),
        ]);
      } catch (err) {
        const elapsed = Date.now() - startTime;
        console.warn(`[runWithConcurrency] Task ${idx} failed after ${elapsed}ms: ${err instanceof Error ? err.message : err}`);
        results[idx] = null as T;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export type RegionDoneCallback = (regionIds: string[]) => void;

function prioritizeGroups(
  groups: RegionGroup[],
  directIds: Set<string>
): RegionGroup[] {
  return [...groups].sort((a, b) => {
    const aScore = groupPriority(a, directIds);
    const bScore = groupPriority(b, directIds);
    return bScore - aScore;
  });
}

function groupPriority(group: RegionGroup, directIds: Set<string>): number {
  if (group.isOrphanGroup) return 0;
  const hasDirect = group.regionIds.some((id) => directIds.has(id));
  if (hasDirect) return 2 + group.regionIds.length;
  return 1;
}

export async function orchestrate(
  currentState: WorldState,
  events: HistoricalEvent[],
  onProgress: ProgressCallback,
  onToken?: TokenStreamCallback,
  activeWars?: War[],
  onRegionDone?: RegionDoneCallback,
  simulationParams?: SimulationParams
): Promise<OrchestrateResult> {
  const targetYear = events[events.length - 1].timestamp.year;
  const ctx: AgentContext = { currentState, events, targetYear };
  const isSpeculative = getSimulationMode() === "speculative";
  const webSearch = getWebSearchOnAdvance();

  const allRegionIds = currentState.regions.map((r) => r.id);

  const directIds = new Set<string>();
  for (const evt of events) {
    for (const rid of evt.affectedRegions) {
      if (allRegionIds.includes(rid)) directIds.add(rid);
    }
  }

  const graph = buildRelationGraph(
    currentState.regions,
    events,
    activeWars ?? []
  );
  const groups = prioritizeGroups(clusterRegions(graph), directIds);

  onProgress("clustering_done", {
    targetYear,
    totalGroups: groups.length,
    totalRegions: allRegionIds.length,
    directCount: directIds.size,
    groups: groups.map((g, i) => ({
      groupIndex: i,
      regionIds: g.regionIds,
      isOrphan: !!g.isOrphanGroup,
      isDirect: g.regionIds.some((id) => directIds.has(id)),
    })),
  });

  onProgress("simulating", {
    targetYear,
    batch: 1,
    totalBatches: groups.length,
    regionIds: Array.from(directIds),
  });

  const maxParallel = getMaxParallel();

  console.log(
    `[Orchestrator] Year ${targetYear}: ${directIds.size} direct + ${allRegionIds.length - directIds.size} indirect regions, ${groups.length} groups (max ${groups.reduce((m, g) => Math.max(m, g.regionIds.length), 0)} per group), concurrency=${maxParallel}${isSpeculative ? ", speculative mode" : ""}${webSearch ? ", web search ON" : ""}`
  );

  const epochStartTime = Date.now();
  resetLlmUsageStats();

  let completedGroups = 0;
  const totalGroups = groups.length;
  const groupStartTimes = new Map<number, number>();

  const stallMonitor = setInterval(() => {
    const now = Date.now();
    for (const [gi, start] of groupStartTimes) {
      const elapsed = now - start;
      if (elapsed > 60_000) {
        const g = groups[gi];
        const label = g ? g.regionIds.slice(0, 3).join(",") + (g.regionIds.length > 3 ? "..." : "") : `group-${gi}`;
        console.warn(`[Orchestrator] ⚠ Group ${gi} (${label}) running for ${Math.round(elapsed / 1000)}s`);
      }
    }
  }, 30_000);

  const wrapTask = (taskFn: () => Promise<TransitionResult | null>, groupIndex: number) => {
    return async (): Promise<TransitionResult | null> => {
      groupStartTimes.set(groupIndex, Date.now());
      onProgress("group_start", { groupIndex, targetYear });
      try {
        const result = await taskFn();
        onProgress("group_done", { groupIndex, targetYear, success: true });
        return result;
      } catch (err) {
        onProgress("group_done", { groupIndex, targetYear, success: false });
        throw err;
      } finally {
        groupStartTimes.delete(groupIndex);
        completedGroups++;
        if (completedGroups % 5 === 0 || completedGroups === totalGroups) {
          console.log(`[Orchestrator] Progress: ${completedGroups}/${totalGroups} groups done`);
        }
      }
    };
  };

  if (isSpeculative) {
    const keyRegionIds = selectKeyRegions(currentState.regions, events, activeWars ?? []);

    onProgress("civ_agent_start", {
      targetYear,
      keyRegionIds,
      isSpeculative: true,
      maxParallel,
    });

    const keyGroupSet = new Set<number>();
    for (let gi = 0; gi < groups.length; gi++) {
      if (groups[gi].regionIds.some((id) => keyRegionIds.includes(id))) {
        keyGroupSet.add(gi);
      }
    }

    const normalGroups = groups.filter((_, i) => !keyGroupSet.has(i));
    const keyGroups = groups.filter((_, i) => keyGroupSet.has(i));

    const civAgentPromise = keyRegionIds.length > 0
      ? runCivAgentBatch(currentState.regions, keyRegionIds, events, targetYear)
      : Promise.resolve([]);

    const normalTasks = normalGroups.map((group, i) => wrapTask(
      buildHistorianTask(ctx, group, directIds, onToken, onRegionDone, isSpeculative, undefined, simulationParams, webSearch),
      i
    ));
    const normalResults = await runWithConcurrency(normalTasks, maxParallel);

    const civDecisions = await civAgentPromise;
    if (civDecisions.length > 0) {
      console.log(`[Orchestrator] CivAgent returned ${civDecisions.length} decisions for key regions: ${civDecisions.map(d => d.regionId).join(", ")}`);
    }

    const keyTasks = keyGroups.map((group, i) => wrapTask(
      buildHistorianTask(ctx, group, directIds, onToken, onRegionDone, isSpeculative, civDecisions, simulationParams, webSearch),
      normalGroups.length + i
    ));
    const keyResults = await runWithConcurrency(keyTasks, maxParallel);

    clearInterval(stallMonitor);
    return mergeResults(currentState, allRegionIds, [...normalResults, ...keyResults], epochStartTime, targetYear);
  }

  const tasks = groups.map((group, i) => wrapTask(
    buildHistorianTask(ctx, group, directIds, onToken, onRegionDone, false, undefined, simulationParams, webSearch),
    i
  ));
  const results = await runWithConcurrency(tasks, maxParallel);
  clearInterval(stallMonitor);
  return mergeResults(currentState, allRegionIds, results, epochStartTime, targetYear);
}

function buildHistorianTask(
  ctx: AgentContext,
  group: RegionGroup,
  directIds: Set<string>,
  onToken?: TokenStreamCallback,
  onRegionDone?: RegionDoneCallback,
  isSpeculative?: boolean,
  civDecisions?: import("./civ-agent").CivDecision[],
  simulationParams?: SimulationParams,
  webSearch?: boolean
): () => Promise<TransitionResult | null> {
  return async (): Promise<TransitionResult | null> => {
    const { regionIds: groupIds, isOrphanGroup } = group;
    const hasDirect = groupIds.some((id) => directIds.has(id));
    const MAX_RETRIES = 2;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await runHistorian(ctx, groupIds, hasDirect, onToken, isOrphanGroup, isSpeculative, civDecisions, simulationParams, webSearch);
        onRegionDone?.(groupIds);
        return result;
      } catch (err) {
        const label = groupIds.length === 1 ? groupIds[0] : `[${groupIds.join(",")}]`;
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(
          `[Orchestrator]   ${label} attempt ${attempt + 1}/${MAX_RETRIES + 1} failed: ${errMsg}`
        );
        if (attempt === MAX_RETRIES) {
          console.error(`[Orchestrator]   ${label} all attempts failed, keeping original`);
          onRegionDone?.(groupIds);
          return null;
        }
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 4000);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
    return null;
  };
}

function mergeResults(
  currentState: WorldState,
  allRegionIds: string[],
  results: (TransitionResult | null)[],
  epochStartTime: number,
  targetYear: number
): OrchestrateResult {
  let mergedEra = currentState.era;
  let mergedSummary = currentState.summary || { zh: "", en: "" };
  const allTransitions: RegionTransition[] = [];
  const updatedRegionMap = new Map<string, Region>();

  const regionLookup = new Map<string, Region>();
  for (const r of currentState.regions) {
    regionLookup.set(r.id, r);
  }

  for (const result of results) {
    if (!result) continue;
    if (result.era) mergedEra = result.era;
    if (result.summary) mergedSummary = result.summary;

    const transitions = Array.isArray(result.transitions) ? result.transitions : [];
    for (const transition of transitions) {
      if (!transition?.regionId || !transition.changes) continue;
      allTransitions.push(transition);

      const original = regionLookup.get(transition.regionId);
      if (original) {
        updatedRegionMap.set(
          transition.regionId,
          applyTransition(original, transition)
        );
      }
    }
  }

  const finalRegions: Region[] = allRegionIds.map((id) =>
    updatedRegionMap.get(id) ?? regionLookup.get(id)!
  );

  const epochElapsed = Date.now() - epochStartTime;
  const usage = getLlmUsageStats();
  console.log(
    `[Orchestrator] Year ${targetYear} done in ${epochElapsed}ms: ${usage.totalCalls} LLM calls, ` +
    `${usage.totalPromptTokens}p + ${usage.totalCompletionTokens}c = ${usage.totalTokens}t total, ` +
    `${usage.avgLatencyMs}ms avg latency, ${allTransitions.length} transitions applied`
  );

  return { era: mergedEra, summary: mergedSummary, regions: finalRegions, transitions: allTransitions };
}
