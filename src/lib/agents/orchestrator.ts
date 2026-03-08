import type { WorldState, HistoricalEvent, Region, LocalizedText } from "../types";
import type { AgentContext, ProgressCallback, TokenStreamCallback } from "./types";
import type { RegionTransition, TransitionResult } from "../transition";
import { applyTransition } from "../transition";
import { runHistorian } from "./historian";

const MAX_PARALLEL = 4;

export interface OrchestrateResult {
  era: LocalizedText;
  summary: LocalizedText;
  regions: Region[];
  transitions: RegionTransition[];
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIdx = 0;

  async function worker() {
    while (nextIdx < tasks.length) {
      const idx = nextIdx++;
      results[idx] = await tasks[idx]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function orchestrate(
  currentState: WorldState,
  events: HistoricalEvent[],
  onProgress: ProgressCallback,
  onToken?: TokenStreamCallback
): Promise<OrchestrateResult> {
  const targetYear = events[events.length - 1].timestamp.year;
  const ctx: AgentContext = { currentState, events, targetYear };

  const allRegionIds = currentState.regions.map((r) => r.id);

  const directIds = new Set<string>();
  for (const evt of events) {
    for (const rid of evt.affectedRegions) {
      if (allRegionIds.includes(rid)) directIds.add(rid);
    }
  }

  const regionsToProcess = allRegionIds.filter((id) => directIds.has(id));
  const indirectRegions = allRegionIds.filter((id) => !directIds.has(id));
  const allToProcess = [...regionsToProcess, ...indirectRegions];

  onProgress("simulating", {
    targetYear,
    batch: 1,
    totalBatches: 1,
    regionIds: Array.from(directIds),
  });

  console.log(
    `[Orchestrator] Year ${targetYear}: ${directIds.size} direct + ${indirectRegions.length} indirect regions, concurrency=${MAX_PARALLEL}`
  );

  const tasks = allToProcess.map((regionId) => async (): Promise<TransitionResult | null> => {
    const isDirect = directIds.has(regionId);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await runHistorian(ctx, [regionId], isDirect, onToken);
      } catch (err) {
        console.warn(
          `[Orchestrator]   ${regionId} attempt ${attempt + 1} failed:`,
          err instanceof Error ? err.message : err
        );
        if (attempt === 2) {
          console.error(`[Orchestrator]   ${regionId} all attempts failed, keeping original`);
          return null;
        }
      }
    }
    return null;
  });

  const results = await runWithConcurrency(tasks, MAX_PARALLEL);

  let mergedEra = currentState.era;
  let mergedSummary = currentState.summary || { zh: "", en: "" };
  const allTransitions: RegionTransition[] = [];
  const updatedRegionMap = new Map<string, Region>();

  for (const result of results) {
    if (!result) continue;
    if (result.era) mergedEra = result.era;
    if (result.summary) mergedSummary = result.summary;

    const transitions = Array.isArray(result.transitions) ? result.transitions : [];
    for (const transition of transitions) {
      if (!transition?.regionId || !transition.changes) continue;
      allTransitions.push(transition);

      const original = currentState.regions.find((r) => r.id === transition.regionId);
      if (original) {
        updatedRegionMap.set(
          transition.regionId,
          applyTransition(original, transition)
        );
      }
    }
  }

  const finalRegions: Region[] = allRegionIds.map((id) =>
    updatedRegionMap.get(id) ?? currentState.regions.find((r) => r.id === id)!
  );

  return { era: mergedEra, summary: mergedSummary, regions: finalRegions, transitions: allTransitions };
}
