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
- MonetaryValue fields: provide {amount: delta, unit: {"zh":"单位","en":"unit"}, goldKg: delta, silverKg: delta}. The "unit" field MUST always be included to indicate the currency (e.g. {"zh":"百万美元","en":"million USD"} or {"zh":"万两白银","en":"10k taels silver"}). Convert the amount to goldKg and/or silverKg using historically accurate exchange rates for the period (e.g. 1945: 1oz gold ≈ $35; 2000: 1oz gold ≈ $280; 2020: 1oz gold ≈ $1800). NEVER leave goldKg/silverKg as 0 when amount is non-zero.
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

ABSOLUTELY FORBIDDEN — Vague / Placeholder Values:
- NEVER use placeholder text such as "待定", "TBD", "未知", "Unknown", "新当选总统", "New President", "（待定）", "(pending)", "to be determined", or ANY similar vague phrasing in ANY field.
- Every field you change MUST have a CONCRETE, SPECIFIC value. For leaders/rulers: provide a real historical name. For policies: describe the actual policy. For descriptions: state what specifically happened.
- This is a SIMULATION — when the historical record does not specify an exact outcome, you MUST make a well-reasoned prediction based on the political context, factional dynamics, succession rules, geopolitical pressures, and historical patterns of the civilization. Commit to a specific prediction; never hedge with "pending" or "TBD".
- Example: Instead of "新当选总统（待定）", write the actual name like "德怀特·艾森豪威尔" / "Dwight D. Eisenhower". Instead of "新政策（制定中）", write "马歇尔计划" / "Marshall Plan".

${FIELD_SCHEMA}`;

const SYSTEM_INDIRECT = `You are a historian for a civilization simulation. Given a civilization that is INDIRECTLY affected by nearby historical events, produce a TRANSITION describing minor ripple effects.

CRITICAL: The events provided are based on real historical records. Your indirect effects must be historically plausible and consistent with what actually happened in this period. Do NOT invent major events or outcomes that contradict the historical record.

Do NOT output the full updated state. Output ONLY the CHANGES (transition) as compact JSON.

Output format (compact JSON, no markdown):
{"era":{"zh":"...","en":"..."},"summary":{"zh":"...","en":"..."},"transitions":[{"regionId":"xxx","description":{"zh":"间接影响描述","en":"Indirect impact description"},"changes":{"field.path":value,...}}]}

Change value rules:
- Number fields: use relative delta. Use "=N" string for absolute set.
- LocalizedText fields: provide full {"zh":"...","en":"..."} as replacement.
- MonetaryValue fields: provide {amount: delta, unit: {"zh":"单位","en":"unit"}, goldKg: delta, silverKg: delta}. Always include "unit" and convert to goldKg/silverKg using historical exchange rates. NEVER leave goldKg/silverKg as 0 when amount is non-zero.
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

ABSOLUTELY FORBIDDEN — Vague / Placeholder Values:
- NEVER use placeholder text such as "待定", "TBD", "未知", "Unknown", "(pending)", "(to be determined)", or ANY similar vague phrasing.
- Every field you change MUST have a CONCRETE, SPECIFIC value — real names, real policies, real descriptions. When the historical record is ambiguous, make a well-reasoned prediction based on context. Never hedge.

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
- MonetaryValue fields: provide {amount: delta, unit: {"zh":"单位","en":"unit"}, goldKg: delta, silverKg: delta}. Always include "unit" and convert to goldKg/silverKg using historical exchange rates. NEVER leave goldKg/silverKg as 0 when amount is non-zero.
- Enum/string fields: provide the new value directly.
- ONLY include fields that actually change. Omit unchanged fields.
- Do NOT set military.totalTroops or demographics.urbanizationRate (auto-calculated).

Rules:
- Each region's transition must reflect ONLY its own internal development
- Keep the transition small per region (typically 2-5 field changes)
- ALL text must be bilingual: {"zh":"...","en":"..."}
- status must be one of: thriving|stable|declining|conflict|collapsed
- You MUST produce one transition entry for EVERY region listed

ABSOLUTELY FORBIDDEN — Vague / Placeholder Values:
- NEVER use placeholder text such as "待定", "TBD", "未知", "Unknown", "(pending)", "(to be determined)", or ANY similar vague phrasing.
- Every field you change MUST have a CONCRETE, SPECIFIC value — real names, real policies, real descriptions. When the outcome is uncertain, make a well-reasoned prediction based on internal dynamics, succession patterns, and historical context. Never hedge.

${FIELD_SCHEMA}`;

const TECH_ERA_SUPPLEMENT = `

TECHNOLOGY ERA RULES (post-1900):
Since this is the modern/contemporary era, technology is a PRIMARY driver of civilization change. Apply these amplified rules:

1. **Technology cascading**: Every technology/invention event must cascade across MULTIPLE fields — not just technology.level. Update economy (new industries, GDP growth, trade shifts), military (new weapons, doctrine changes), demographics (urbanization, life expectancy, migration patterns), culture (communication revolution, media, education), and government (surveillance, digital governance, technocratic shifts).
2. **Technology-driven power shifts**: Technological leadership directly determines geopolitical power. A civilization that leads in a tech wave (industrialization, nuclear, computing, space, AI) should see amplified gains in military.level, economy.level, and diplomatic leverage. Laggards should show relative decline.
3. **Economic transformation weight**: Technology events should produce LARGER economic deltas than pre-modern events. An industrial revolution or digital transformation reshapes GDP at 5-15% scale, not 1-2%. Update economy.mainIndustries, economy.economicSystem, and economy.gdpDescription to reflect technological paradigm shifts.
4. **Military-industrial coupling**: Post-1900 military changes are inseparable from technology. Always update military.technology when processing any technology event. Nuclear weapons, aircraft, missiles, cyber capabilities, and AI fundamentally alter military.threats and diplomacy.
5. **Demographic acceleration**: Technology events (medical advances, agricultural revolution, urbanization) should drive larger demographic changes — life expectancy jumps, urbanization surges, population growth or decline driven by industrial/post-industrial transitions.
6. **Technology as diplomatic leverage**: Update diplomacy fields to reflect technology-based alliances (NATO tech sharing, semiconductor supply chains, space cooperation), technology embargoes, and technology competition (Space Race, AI race, chip wars).
7. **Assessment must reflect tech position**: assessment.strengths/weaknesses/outlook MUST mention technological standing. A civilization's future trajectory in the modern era is dominated by its technology position.`;

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

  const eventsSummary = ctx.events.map((e) => ({
    title: e.title,
    description: e.description,
    affectedRegions: e.affectedRegions,
    category: e.category,
  }));

  const regionSnapshot = regionsToUpdate.map((r) =>
    isOrphanGroup
      ? {
        id: r.id,
        name: r.name,
        status: r.status,
        civilization: { type: r.civilization?.type, capital: r.civilization?.capital },
        demographics: { population: r.demographics?.population },
        economy: { level: r.economy?.level },
        technology: { level: r.technology?.level },
      }
      : {
        id: r.id,
        name: r.name,
        status: r.status,
        description: r.description,
        civilization: {
          name: r.civilization?.name,
          ruler: r.civilization?.ruler,
          rulerTitle: r.civilization?.rulerTitle,
          dynasty: r.civilization?.dynasty,
          capital: r.civilization?.capital,
          governmentForm: r.civilization?.governmentForm,
          type: r.civilization?.type,
          succession: r.civilization?.succession,
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
          foreignPolicy: r.diplomacy?.foreignPolicy,
        },
        assessment: r.assessment,
        ...(r.aiSector ? {
          aiSector: {
            level: r.aiSector.level,
            policy: r.aiSector.policy,
          },
        } : {}),
      }
  );

  const otherRegionNames = isOrphanGroup
    ? []
    : ctx.currentState.regions
      .filter((r) => !regionIds.includes(r.id))
      .map((r) => ({ id: r.id, name: r.name, status: r.status }));

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

  if (ctx.targetYear >= 1900) {
    systemPrompt += TECH_ERA_SUPPLEMENT;
  }

  const userParts = [
    `Year: ${ctx.targetYear}`,
    `Era: ${JSON.stringify(ctx.currentState.era)}`,
    `Events: ${JSON.stringify(eventsSummary)}`,
    `Regions to update (current key stats): ${JSON.stringify(regionSnapshot)}`,
  ];
  if (otherRegionNames.length > 0) {
    userParts.push(`Other civilizations: ${JSON.stringify(otherRegionNames)}`);
  }

  const messages: AgentMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userParts.join("\n") },
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
