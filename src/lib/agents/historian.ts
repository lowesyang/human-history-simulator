import type { AgentContext, AgentMessage } from "./types";
import type { TransitionResult } from "../transition";
import { getRegionFieldSchema } from "../transition";
import { callAgentStreaming, safeParseJSON, type TokenCallback } from "./llm-client";

const FIELD_SCHEMA = getRegionFieldSchema();

const SYSTEM_DIRECT = `You are a historian for a civilization simulation. Given a civilization's current state and historical events that DIRECTLY affect it, produce a TRANSITION describing how this civilization changes.

CRITICAL: The events provided are based on real historical records. Your transitions must faithfully reflect what actually happened historically — real consequences, real outcomes, real leadership changes. Do NOT invent outcomes that contradict the historical record.

Do NOT output the full updated state. Output ONLY the CHANGES (transition) as compact JSON.

Output format (compact JSON, no markdown):
{"era":{"zh":"...","en":"..."},"summary":{"zh":"一句话总结本轮变化","en":"One-sentence summary"},"transitions":[{"regionId":"xxx","description":{"zh":"描述发生了什么（2-3句）","en":"What happened (2-3 sentences)"},"changes":{"field.path":value,...}}]}

Change value rules:
- Number fields: use relative delta (e.g. -50000 means subtract 50000 from current). Use "=50000" string for absolute set.
- LocalizedText fields: provide full {"zh":"...","en":"..."} as replacement.
- MonetaryValue fields: provide {amount: delta, goldKg: delta} — numeric sub-fields are added to current values.
- Enum/string fields: provide the new value directly.
- null: clear/remove the field.
- ONLY include fields that actually change. Omit unchanged fields.
- Do NOT set military.totalTroops (auto-calculated from standingArmy + reserves).
- Do NOT set demographics.urbanizationRate (auto-calculated).

Rules:
- Be historically accurate and proportional to the events
- Apply direct event effects: casualties, territorial changes, economic impact, leadership changes
- Update diplomacy, assessment, and description to reflect the new reality
- Keep descriptions concise (1-2 sentences per field)
- ALL text must be bilingual: {"zh":"...","en":"..."}
- status must be one of: thriving|stable|declining|conflict|collapsed

${FIELD_SCHEMA}`;

const SYSTEM_INDIRECT = `You are a historian for a civilization simulation. Given a civilization that is INDIRECTLY affected by nearby historical events, produce a TRANSITION describing minor ripple effects.

CRITICAL: The events provided are based on real historical records. Your indirect effects must be historically plausible and consistent with what actually happened in this period. Do NOT invent major events or outcomes that contradict the historical record.

Do NOT output the full updated state. Output ONLY the CHANGES (transition) as compact JSON.

Output format (compact JSON, no markdown):
{"era":{"zh":"...","en":"..."},"summary":{"zh":"...","en":"..."},"transitions":[{"regionId":"xxx","description":{"zh":"间接影响描述","en":"Indirect impact description"},"changes":{"field.path":value,...}}]}

Change value rules:
- Number fields: use relative delta. Use "=N" string for absolute set.
- LocalizedText fields: provide full {"zh":"...","en":"..."} as replacement.
- MonetaryValue fields: provide {amount: delta, goldKg: delta}.
- Enum/string fields: provide the new value directly.
- ONLY include fields that actually change. Omit unchanged fields.
- Do NOT set military.totalTroops or demographics.urbanizationRate (auto-calculated).

Rules:
- Changes should be MINOR — trade disruptions, diplomatic shifts, small economic ripples
- Do NOT invent major events for this civilization
- Only update fields realistically affected by indirect ripple effects
- Keep the transition small (typically 2-6 field changes)
- ALL text must be bilingual: {"zh":"...","en":"..."}
- status must be one of: thriving|stable|declining|conflict|collapsed

${FIELD_SCHEMA}`;

const SYSTEM_INDEPENDENT = `You are a historian for a civilization simulation. You are given MULTIPLE civilizations that are GEOGRAPHICALLY ISOLATED and have NO mutual relationship in this era. Produce a TRANSITION for EACH civilization describing its own independent historical evolution for this time period.

CRITICAL RULES:
1. Each civilization evolves INDEPENDENTLY. Do NOT invent interactions, trade, diplomacy, or influence between these civilizations — they are unrelated to each other.
2. Base each civilization's changes on its OWN internal dynamics: natural population growth, local economic development, internal politics, cultural evolution, and any background historical trends appropriate to its region and era.
3. The provided events may not directly affect these civilizations. Apply only plausible, minor background changes consistent with the historical period.
4. Keep changes small and realistic — typical internal evolution for the time period (e.g., modest population growth, gradual economic shifts, slow technological progress).

Do NOT output the full updated state. Output ONLY the CHANGES (transition) as compact JSON.

Output format (compact JSON, no markdown):
{"era":{"zh":"...","en":"..."},"summary":{"zh":"...","en":"..."},"transitions":[{"regionId":"xxx","description":{"zh":"本期独立演进","en":"Independent evolution this period"},"changes":{"field.path":value,...}},{"regionId":"yyy","description":{"zh":"...","en":"..."},"changes":{...}}]}

Change value rules:
- Number fields: use relative delta. Use "=N" string for absolute set.
- LocalizedText fields: provide full {"zh":"...","en":"..."} as replacement.
- MonetaryValue fields: provide {amount: delta, goldKg: delta}.
- Enum/string fields: provide the new value directly.
- ONLY include fields that actually change. Omit unchanged fields.
- Do NOT set military.totalTroops or demographics.urbanizationRate (auto-calculated).

Rules:
- Each region's transition must reflect ONLY its own internal development
- Keep the transition small per region (typically 2-5 field changes)
- ALL text must be bilingual: {"zh":"...","en":"..."}
- status must be one of: thriving|stable|declining|conflict|collapsed
- You MUST produce one transition entry for EVERY region listed

${FIELD_SCHEMA}`;

export async function runHistorian(
  ctx: AgentContext,
  regionIds: string[],
  isDirect: boolean,
  onToken?: TokenCallback,
  isOrphanGroup?: boolean
): Promise<TransitionResult> {
  const regionsToUpdate = ctx.currentState.regions.filter((r) =>
    regionIds.includes(r.id)
  );

  const otherRegionNames = ctx.currentState.regions
    .filter((r) => !regionIds.includes(r.id))
    .map((r) => ({ id: r.id, name: r.name, status: r.status }));

  const eventsSummary = ctx.events.map((e) => ({
    title: e.title,
    description: e.description,
    affectedRegions: e.affectedRegions,
    category: e.category,
  }));

  const regionSnapshot = regionsToUpdate.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    civilization: {
      ruler: r.civilization?.ruler,
      dynasty: r.civilization?.dynasty,
      capital: r.civilization?.capital,
      governmentForm: r.civilization?.governmentForm,
      type: r.civilization?.type,
    },
    demographics: {
      population: r.demographics?.population,
      urbanPopulation: r.demographics?.urbanPopulation,
    },
    economy: {
      level: r.economy?.level,
      gdpEstimate: r.economy?.gdpEstimate,
    },
    military: {
      level: r.military?.level,
      standingArmy: r.military?.standingArmy,
      reserves: r.military?.reserves,
      totalTroops: r.military?.totalTroops,
    },
    technology: { level: r.technology?.level },
    diplomacy: {
      allies: r.diplomacy?.allies,
      enemies: r.diplomacy?.enemies,
    },
  }));

  let systemPrompt: string;
  let temperature: number;
  if (isOrphanGroup) {
    systemPrompt = SYSTEM_INDEPENDENT;
    temperature = 0.3;
  } else if (isDirect) {
    systemPrompt = SYSTEM_DIRECT;
    temperature = 0.5;
  } else {
    systemPrompt = SYSTEM_INDIRECT;
    temperature = 0.3;
  }

  const messages: AgentMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Year: ${ctx.targetYear}
Era: ${JSON.stringify(ctx.currentState.era)}
Events: ${JSON.stringify(eventsSummary)}
Regions to update (current key stats): ${JSON.stringify(regionSnapshot)}
Other civilizations: ${JSON.stringify(otherRegionNames)}`,
    },
  ];

  const rid = regionIds[0] || "unknown";
  const response = await callAgentStreaming(
    messages,
    rid,
    onToken ?? (() => { }),
    { temperature }
  );
  return safeParseJSON<TransitionResult>(response);
}
