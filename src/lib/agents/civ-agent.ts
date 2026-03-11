import type { Region, LocalizedText, HistoricalEvent, War } from "../types";
import { callAgent, safeParseJSON } from "./llm-client";

export interface CivDecision {
  regionId: string;
  strategicIntent: LocalizedText;
  actions: {
    type: "expand" | "defend" | "trade" | "tech" | "diplomacy" | "reform";
    target?: string;
    description: LocalizedText;
  }[];
}

interface CivAgentResult {
  decisions: CivDecision[];
}

const CIV_AGENT_SYSTEM = `You are a civilization strategic advisor. Given a set of civilizations and recent events, determine each civilization's primary strategic intent and planned actions.

Output compact JSON:
{"decisions":[{"regionId":"xxx","strategicIntent":{"zh":"...","en":"..."},"actions":[{"type":"expand|defend|trade|tech|diplomacy|reform","target":"optional target region/entity","description":{"zh":"...","en":"..."}}]}]}

Rules:
- Each civilization gets exactly 1-2 actions
- Actions must be realistic given the civilization's capabilities
- strategicIntent is a 1-sentence summary of the civilization's primary goal
- type must be one of: expand, defend, trade, tech, diplomacy, reform
- Keep output extremely concise — this feeds into downstream prompts
- ALL text must be bilingual: {"zh":"...","en":"..."}`;

export function selectKeyRegions(
  regions: Region[],
  events: HistoricalEvent[],
  activeWars: War[]
): string[] {
  const scores = new Map<string, number>();

  for (const r of regions) {
    scores.set(r.id, 0);
  }

  const eventHits = new Map<string, number>();
  for (const evt of events) {
    for (const rid of evt.affectedRegions) {
      eventHits.set(rid, (eventHits.get(rid) || 0) + 1);
    }
  }
  for (const [rid, count] of eventHits) {
    if (count >= 2) scores.set(rid, (scores.get(rid) || 0) + 3);
  }

  const warRegions = new Set<string>();
  for (const war of activeWars) {
    if (war.status !== "ongoing") continue;
    for (const rid of [...war.belligerents.side1.regionIds, ...war.belligerents.side2.regionIds]) {
      warRegions.add(rid);
    }
  }
  for (const rid of warRegions) {
    scores.set(rid, (scores.get(rid) || 0) + 2);
  }

  for (const r of regions) {
    if (r.status === "conflict" || r.status === "declining") {
      scores.set(r.id, (scores.get(r.id) || 0) + 2);
    }
    const outlook = JSON.stringify(r.assessment?.outlook || "").toLowerCase();
    if (outlook.includes("crisis") || outlook.includes("decline") || outlook.includes("threat") || outlook.includes("危机") || outlook.includes("衰落")) {
      scores.set(r.id, (scores.get(r.id) || 0) + 1);
    }
  }

  const gdpSorted = [...regions]
    .filter((r) => r.economy?.gdpEstimate?.goldKg)
    .sort((a, b) => (b.economy?.gdpEstimate?.goldKg || 0) - (a.economy?.gdpEstimate?.goldKg || 0));
  for (let i = 0; i < Math.min(5, gdpSorted.length); i++) {
    scores.set(gdpSorted[i].id, (scores.get(gdpSorted[i].id) || 0) + 2);
  }

  const maxN = Math.min(5, Math.ceil(regions.length * 0.1));
  const sorted = [...scores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxN);

  return sorted.map(([id]) => id);
}

export async function runCivAgentBatch(
  regions: Region[],
  keyRegionIds: string[],
  events: HistoricalEvent[],
  targetYear: number
): Promise<CivDecision[]> {
  if (keyRegionIds.length === 0) return [];

  const batchSize = 3;
  const batches: string[][] = [];
  for (let i = 0; i < keyRegionIds.length; i += batchSize) {
    batches.push(keyRegionIds.slice(i, i + batchSize));
  }

  const regionMap = new Map(regions.map((r) => [r.id, r]));

  const results = await Promise.all(
    batches.map(async (batch) => {
      const regionData = batch
        .map((id) => regionMap.get(id))
        .filter(Boolean)
        .map((r) => ({
          id: r!.id,
          name: r!.name,
          status: r!.status,
          assessment: r!.assessment,
          diplomacy: {
            allies: r!.diplomacy?.allies,
            enemies: r!.diplomacy?.enemies,
          },
          economy: { level: r!.economy?.level },
          military: { level: r!.military?.level },
          civilization: { governmentForm: r!.civilization?.governmentForm },
        }));

      const eventSummary = events.slice(0, 5).map((e) => ({
        title: e.title,
        category: e.category,
        affectedRegions: e.affectedRegions,
      }));

      const userPrompt = `Year: ${targetYear}\nCivilizations:\n${JSON.stringify(regionData)}\nRecent events:\n${JSON.stringify(eventSummary)}`;

      try {
        const response = await callAgent(
          [
            { role: "system", content: CIV_AGENT_SYSTEM },
            { role: "user", content: userPrompt },
          ],
          { temperature: 0.4 }
        );
        const parsed = safeParseJSON<CivAgentResult>(response);
        return parsed.decisions || [];
      } catch (err) {
        console.error("[CivAgent] Batch failed:", err instanceof Error ? err.message : err);
        return [];
      }
    })
  );

  return results.flat();
}
