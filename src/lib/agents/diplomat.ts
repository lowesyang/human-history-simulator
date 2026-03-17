import type { Region, LocalizedText, HistoricalEvent, War } from "../types";
import { callAgent, safeParseJSON } from "./llm-client";

export interface DiplomaticDecision {
  regionA: string;
  regionB: string;
  relation:
  | "alliance"
  | "rivalry"
  | "trade_pact"
  | "non_aggression"
  | "vassalage"
  | "deteriorating"
  | "improving"
  | "neutral";
  action: LocalizedText;
  rationale: LocalizedText;
  confidence: number;
  tradeImpact?: {
    direction: "increase" | "decrease" | "embargo" | "new_route" | "stable";
    magnitude: "minor" | "moderate" | "major";
    description: LocalizedText;
  };
  warImplication?: {
    effect:
    | "ally_joins"
    | "betrayal"
    | "ceasefire_pressure"
    | "escalation"
    | "arms_supply"
    | "none";
    targetWar?: string;
    description: LocalizedText;
  };
}

interface DiplomatBatchResult {
  decisions: DiplomaticDecision[];
}

export interface RegionPair {
  a: string;
  b: string;
  score: number;
}

const DIPLOMAT_SYSTEM = `You are a bilateral diplomacy, trade, and war-implication analyst for a civilization simulation. Given pairs of civilizations and recent events, analyze the bilateral relationship for EACH pair.

Output compact JSON:
{"decisions":[{"regionA":"id1","regionB":"id2","relation":"alliance|rivalry|trade_pact|non_aggression|vassalage|deteriorating|improving|neutral","action":{"zh":"...","en":"..."},"rationale":{"zh":"...","en":"..."},"confidence":0.8,"tradeImpact":{"direction":"increase|decrease|embargo|new_route|stable","magnitude":"minor|moderate|major","description":{"zh":"...","en":"..."}},"warImplication":{"effect":"ally_joins|betrayal|ceasefire_pressure|escalation|arms_supply|none","targetWar":"optional war name","description":{"zh":"...","en":"..."}}}]}

Rules:
- Produce exactly ONE decision per pair
- Consider BOTH sides' interests, power balance, historical context, and geographic proximity
- relation: the dominant bilateral relationship this period
- action: the concrete diplomatic action taken (1 sentence, e.g. "Sign mutual defense treaty")
- rationale: why this makes sense given both sides' situations (1 sentence)
- confidence: 0-1, how certain this outcome is
- tradeImpact: ALWAYS assess the bilateral trade consequence. Alliance -> trade growth; war -> embargo; treaty -> new route. Omit only if truly no trade relationship exists.
- warImplication: assess whether this diplomatic shift affects any ongoing or potential war. New alliances may bring a third party into a conflict; deteriorating relations may escalate to war; a trade embargo may precede military action. Set effect to "none" if no war relevance.
- Be historically accurate — use real diplomatic events, treaties, and alliances from the period
- ALL text must be bilingual: {"zh":"...","en":"..."}
- Keep output extremely concise — this feeds into downstream prompts`;

function textIncludes(text: LocalizedText | string | undefined, needle: string): boolean {
  if (!text) return false;
  const str = typeof text === "string" ? text : `${text.zh} ${text.en}`;
  return str.includes(needle);
}

function regionNameStr(r: Region): string {
  return typeof r.name === "string" ? r.name : r.name.en;
}

/**
 * Select pairs of regions that need bilateral diplomatic reasoning.
 * Returns scored pairs sorted by relevance, capped at maxPairs.
 */
export function selectDiplomaticPairs(
  regions: Region[],
  events: HistoricalEvent[],
  activeWars: War[],
  maxPairs = 8
): RegionPair[] {
  const regionIdSet = new Set(regions.map((r) => r.id));
  const pairScores = new Map<string, number>();

  function pairKey(a: string, b: string): string {
    return a < b ? `${a}||${b}` : `${b}||${a}`;
  }

  function addScore(a: string, b: string, points: number) {
    if (a === b || !regionIdSet.has(a) || !regionIdSet.has(b)) return;
    const key = pairKey(a, b);
    pairScores.set(key, (pairScores.get(key) || 0) + points);
  }

  for (const evt of events) {
    const rids = evt.affectedRegions.filter((id) => regionIdSet.has(id));
    for (let i = 0; i < rids.length; i++) {
      for (let j = i + 1; j < rids.length; j++) {
        addScore(rids[i], rids[j], 3);
      }
    }

    if (evt.category === "trade" || evt.category === "diplomacy") {
      for (let i = 0; i < rids.length; i++) {
        for (let j = i + 1; j < rids.length; j++) {
          addScore(rids[i], rids[j], 2);
        }
      }
    }
  }

  for (const war of activeWars) {
    if (war.status !== "ongoing") continue;
    const s1 = (war.belligerents?.side1?.regionIds ?? []).filter((id) => regionIdSet.has(id));
    const s2 = (war.belligerents?.side2?.regionIds ?? []).filter((id) => regionIdSet.has(id));
    for (const a of s1) {
      for (const b of s2) {
        addScore(a, b, 3);
      }
    }
    for (let i = 0; i < s1.length; i++) {
      for (let j = i + 1; j < s1.length; j++) {
        addScore(s1[i], s1[j], 1);
      }
    }
    for (let i = 0; i < s2.length; i++) {
      for (let j = i + 1; j < s2.length; j++) {
        addScore(s2[i], s2[j], 1);
      }
    }
  }

  for (const rA of regions) {
    const nameA = regionNameStr(rA);
    for (const rB of regions) {
      if (rA.id >= rB.id) continue;
      const nameB = regionNameStr(rB);

      if (
        textIncludes(rA.diplomacy?.allies, rB.id) ||
        textIncludes(rA.diplomacy?.allies, nameB) ||
        textIncludes(rB.diplomacy?.allies, rA.id) ||
        textIncludes(rB.diplomacy?.allies, nameA)
      ) {
        addScore(rA.id, rB.id, 2);
      }

      if (
        textIncludes(rA.diplomacy?.enemies, rB.id) ||
        textIncludes(rA.diplomacy?.enemies, nameB) ||
        textIncludes(rB.diplomacy?.enemies, rA.id) ||
        textIncludes(rB.diplomacy?.enemies, nameA)
      ) {
        addScore(rA.id, rB.id, 2);
      }

      if (
        textIncludes(rA.economy?.tradeRoutes, rB.id) ||
        textIncludes(rA.economy?.tradeRoutes, nameB) ||
        textIncludes(rB.economy?.tradeRoutes, rA.id) ||
        textIncludes(rB.economy?.tradeRoutes, nameA)
      ) {
        addScore(rA.id, rB.id, 2);
      }
    }
  }

  const sorted = [...pairScores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxPairs);

  return sorted.map(([key, score]) => {
    const [a, b] = key.split("||");
    return { a, b, score };
  });
}

export async function runDiplomatBatch(
  regions: Region[],
  pairs: RegionPair[],
  events: HistoricalEvent[],
  activeWars: War[],
  targetYear: number
): Promise<DiplomaticDecision[]> {
  if (pairs.length === 0) return [];

  const batchSize = 4;
  const batches: RegionPair[][] = [];
  for (let i = 0; i < pairs.length; i += batchSize) {
    batches.push(pairs.slice(i, i + batchSize));
  }

  const regionMap = new Map(regions.map((r) => [r.id, r]));

  const results = await Promise.all(
    batches.map(async (batch) => {
      const pairData = batch.map(({ a, b }) => {
        const rA = regionMap.get(a);
        const rB = regionMap.get(b);
        if (!rA || !rB) return null;
        return {
          regionA: {
            id: rA.id,
            name: rA.name,
            status: rA.status,
            diplomacy: {
              allies: rA.diplomacy?.allies,
              enemies: rA.diplomacy?.enemies,
              foreignPolicy: rA.diplomacy?.foreignPolicy,
            },
            economy: {
              level: rA.economy?.level,
              tradeRoutes: rA.economy?.tradeRoutes,
              foreignTradeVolume: rA.economy?.foreignTradeVolume,
            },
            military: { level: rA.military?.level },
            civilization: { governmentForm: rA.civilization?.governmentForm },
          },
          regionB: {
            id: rB.id,
            name: rB.name,
            status: rB.status,
            diplomacy: {
              allies: rB.diplomacy?.allies,
              enemies: rB.diplomacy?.enemies,
              foreignPolicy: rB.diplomacy?.foreignPolicy,
            },
            economy: {
              level: rB.economy?.level,
              tradeRoutes: rB.economy?.tradeRoutes,
              foreignTradeVolume: rB.economy?.foreignTradeVolume,
            },
            military: { level: rB.military?.level },
            civilization: { governmentForm: rB.civilization?.governmentForm },
          },
        };
      }).filter(Boolean);

      const eventSummary = events.slice(0, 5).map((e) => ({
        title: e.title,
        category: e.category,
        affectedRegions: e.affectedRegions,
      }));

      const warSummary = activeWars
        .filter((w) => w.status === "ongoing")
        .slice(0, 5)
        .map((w) => ({
          name: w.name,
          side1: w.belligerents?.side1?.regionIds,
          side2: w.belligerents?.side2?.regionIds,
          status: w.status,
        }));

      const userPrompt = [
        `Year: ${targetYear}`,
        `Pairs to analyze:\n${JSON.stringify(pairData)}`,
        `Recent events:\n${JSON.stringify(eventSummary)}`,
        warSummary.length > 0 ? `Ongoing wars:\n${JSON.stringify(warSummary)}` : "",
      ].filter(Boolean).join("\n");

      try {
        const response = await callAgent(
          [
            { role: "system", content: DIPLOMAT_SYSTEM },
            { role: "user", content: userPrompt },
          ],
          { temperature: 0.4 }
        );
        const parsed = safeParseJSON<DiplomatBatchResult>(response);
        return parsed.decisions || [];
      } catch (err) {
        console.error("[Diplomat] Batch failed:", err instanceof Error ? err.message : err);
        return [];
      }
    })
  );

  return results.flat();
}
