import type { AgentContext, AgentMessage } from "./types";
import type { TransitionResult } from "../transition";
import { getRegionFieldSchema, type FieldSchemaMode } from "../transition";
import { callAgentStreaming, safeParseJSON, type TokenCallback } from "./llm-client";
import { getSimulationMode } from "../settings";
import type { CivDecision } from "./civ-agent";
import { buildMemoryContext } from "./civ-memory";

function buildSystemPrompt(base: string, mode: FieldSchemaMode, includeAiSector: boolean): string {
  return base + getRegionFieldSchema(mode, includeAiSector);
}

const SYSTEM_DIRECT_BASE = `You are a historian for a civilization simulation. Given a civilization's current state and historical events that DIRECTLY affect it, produce a TRANSITION describing how this civilization changes.

CRITICAL: The events provided are based on real historical records. Your transitions must faithfully reflect what actually happened historically — real consequences, real outcomes, real leadership changes. Do NOT invent outcomes that contradict the historical record.

Do NOT output the full updated state. Output ONLY the CHANGES (transition) as compact JSON.

Output format (compact JSON, no markdown):
{"era":{"zh":"...","en":"..."},"summary":{"zh":"一句话总结本轮变化","en":"One-sentence summary"},"transitions":[{"regionId":"xxx","description":{"zh":"一句话概括","en":"One sentence"},"changes":{"field.path":value,...}}]}

BREVITY IS CRITICAL:
- description: 1 sentence per language, max 30 words each. Never write paragraphs.
- changes: Only include fields with MEANINGFUL changes. Typical: 4-8 fields per region.
- Do NOT update fields just to rephrase existing values. Only change fields where the VALUE actually differs.
- Skip assessment/description updates if nothing substantively changed.
- Prefer number deltas over replacing LocalizedText when possible.

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
- ALL text must be bilingual: {"zh":"...","en":"..."}
- status must be one of: thriving|rising|stable|declining|conflict|collapsed

ABSOLUTELY FORBIDDEN — Vague / Placeholder Values:
- NEVER use placeholder text such as "待定", "TBD", "未知", "Unknown", "新当选总统", "New President", "（待定）", "(pending)", "to be determined", or ANY similar vague phrasing in ANY field.
- Every field you change MUST have a CONCRETE, SPECIFIC value. For leaders/rulers: provide a real historical name. For policies: describe the actual policy. For descriptions: state what specifically happened.
- This is a SIMULATION — when the historical record does not specify an exact outcome, you MUST make a well-reasoned prediction based on the political context, factional dynamics, succession rules, geopolitical pressures, and historical patterns of the civilization. Commit to a specific prediction; never hedge with "pending" or "TBD".
- Example: Instead of "新当选总统（待定）", write the actual name like "德怀特·艾森豪威尔" / "Dwight D. Eisenhower". Instead of "新政策（制定中）", write "马歇尔计划" / "Marshall Plan".

`;

const SYSTEM_INDIRECT_BASE = `You are a historian for a civilization simulation. Given a civilization that is INDIRECTLY affected by nearby historical events, produce a TRANSITION describing minor ripple effects.

CRITICAL: The events provided are based on real historical records. Your indirect effects must be historically plausible and consistent with what actually happened in this period. Do NOT invent major events or outcomes that contradict the historical record.

Do NOT output the full updated state. Output ONLY the CHANGES (transition) as compact JSON.

Output format (compact JSON, no markdown):
{"era":{"zh":"...","en":"..."},"summary":{"zh":"...","en":"..."},"transitions":[{"regionId":"xxx","description":{"zh":"一句话概括间接影响","en":"One sentence indirect impact"},"changes":{"field.path":value,...}}]}

BREVITY IS CRITICAL:
- description: 1 sentence per language, max 20 words each.
- changes: Typically 2-5 fields per region. Only include genuinely affected fields.
- Do NOT update assessment or description unless the indirect effect is significant.

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
- ALL text must be bilingual: {"zh":"...","en":"..."}
- status must be one of: thriving|rising|stable|declining|conflict|collapsed

ABSOLUTELY FORBIDDEN — Vague / Placeholder Values:
- NEVER use placeholder text such as "待定", "TBD", "未知", "Unknown", "(pending)", "(to be determined)", or ANY similar vague phrasing.
- Every field you change MUST have a CONCRETE, SPECIFIC value — real names, real policies, real descriptions. When the historical record is ambiguous, make a well-reasoned prediction based on context. Never hedge.

`;

const SYSTEM_INDEPENDENT_BASE = `You are a historian for a civilization simulation. You are given MULTIPLE civilizations that are GEOGRAPHICALLY ISOLATED and have NO mutual relationship in this era. Produce a TRANSITION for EACH civilization describing its own independent historical evolution for this time period.

CRITICAL RULES:
1. Each civilization evolves INDEPENDENTLY. Do NOT invent interactions, trade, diplomacy, or influence between these civilizations — they are unrelated to each other.
2. Base each civilization's changes on its OWN internal dynamics: natural population growth, local economic development, internal politics, cultural evolution, and any background historical trends appropriate to its region and era.
3. The provided events may not directly affect these civilizations. Apply only plausible, minor background changes consistent with the historical period.
4. Keep changes small and realistic — typical internal evolution for the time period (e.g., modest population growth, gradual economic shifts, slow technological progress).

Do NOT output the full updated state. Output ONLY the CHANGES (transition) as compact JSON.

Output format (compact JSON, no markdown):
{"era":{"zh":"...","en":"..."},"summary":{"zh":"...","en":"..."},"transitions":[{"regionId":"xxx","description":{"zh":"一句话","en":"One sentence"},"changes":{"field.path":value,...}}]}

EXTREME BREVITY IS REQUIRED — these are minor background updates:
- description: 1 short sentence per language, max 15 words each. Example: {"zh":"人口缓慢增长，经济稳定","en":"Slow population growth, stable economy"}
- changes: 2-4 fields per region MAX. Only population, economy.level, technology.level, and status. Skip everything else unless truly warranted.
- Do NOT update assessment, description, diplomacy, culture, or government for background evolution.
- Do NOT write long descriptions or explanations. This is background noise, not narrative.
- You MUST produce one transition entry for EVERY region listed.

Change value rules:
- Number fields: use relative delta. Use "=N" string for absolute set.
- LocalizedText fields: provide full {"zh":"...","en":"..."} as replacement.
- MonetaryValue fields: provide {amount: delta, unit: {"zh":"单位","en":"unit"}, goldKg: delta, silverKg: delta}. Always include "unit" and convert to goldKg/silverKg using historical exchange rates. NEVER leave goldKg/silverKg as 0 when amount is non-zero.
- Enum/string fields: provide the new value directly.
- ONLY include fields that actually change. Omit unchanged fields.
- Do NOT set military.totalTroops or demographics.urbanizationRate (auto-calculated).

Rules:
- Each region's transition must reflect ONLY its own internal development
- ALL text must be bilingual: {"zh":"...","en":"..."}
- status must be one of: thriving|rising|stable|declining|conflict|collapsed

ABSOLUTELY FORBIDDEN — Vague / Placeholder Values:
- NEVER use placeholder text such as "待定", "TBD", "未知", "Unknown", "(pending)", "(to be determined)", or ANY similar vague phrasing.
- Every field you change MUST have a CONCRETE, SPECIFIC value — real names, real policies, real descriptions. When the outcome is uncertain, make a well-reasoned prediction based on internal dynamics, succession patterns, and historical context. Never hedge.

`;

const TECH_ERA_SUPPLEMENT = `

TECHNOLOGY ERA (post-1900):
Technology is a PRIMARY driver. For tech-related events:
1. Cascade tech changes across economy, military, demographics, and diplomacy — not just technology.level.
2. Tech leaders gain amplified military.level/economy.level; laggards show relative decline.
3. Post-1900 economic deltas from tech events should be 5-15% GDP scale, not 1-2%.
4. Always update military.technology for tech events. Nuclear/cyber/AI reshape threats and diplomacy.
5. assessment.outlook MUST reflect technological standing.
6. AI-Finance convergence (2025+): AI agents entering financial markets, agent-based digital finance.
Keep output concise — apply these as field changes, not as narrative.`;

const SPECULATIVE_DIRECT_OVERRIDE = `The events provided are SPECULATIVE future scenarios. Your transitions must reflect plausible consequences based on the civilization's current capabilities, resources, geopolitical position, and historical patterns. Apply causal reasoning: how would this civilization realistically respond to these events given its government form, economic structure, military capacity, and cultural values?`;

const SPECULATIVE_INDIRECT_OVERRIDE = `The events provided are SPECULATIVE future scenarios. Your indirect effects must reflect plausible ripple effects extrapolated from the civilization's current state and global trends. Apply causal reasoning while keeping changes minor and realistic.`;

const SPECULATIVE_INDEPENDENT_OVERRIDE = `The events represent SPECULATIVE future scenarios in this world. Each civilization evolves based on plausible extrapolations of its current trajectory — internal dynamics, demographic trends, technological adoption curves, and global macro-forces like climate change, resource competition, and ideological shifts. Make well-reasoned predictions, not just incremental tweaks.`;

const CIV_AGENCY_SUPPLEMENT = `

CIVILIZATION AGENCY (speculative mode):
Before computing transitions, reason about each civilization's STRATEGIC INTENT:

1. **Goal inference**: Based on the civilization's current assessment (strengths, weaknesses, outlook), government form, and diplomatic posture, infer 1-2 primary strategic goals (e.g. territorial expansion, economic reform, military buildup, diplomatic realignment, technology leapfrog).
2. **Decision logic**: How would this civilization's leadership CHOOSE to respond to the events — not just react passively? Consider: risk appetite based on government form, resource constraints, ideological alignment, succession pressures, public opinion.
3. **Proactive actions**: Beyond reacting to events, include 1-2 SELF-INITIATED changes that reflect the civilization pursuing its own agenda (e.g. launching a reform program, initiating trade negotiations, beginning military modernization), even if no external event triggers them.

Include a "strategicIntent" field in each transition:
"strategicIntent": {"zh":"...","en":"..."} — 1 sentence summary of the civilization's primary goal this period.
`;

export async function runHistorian(
  ctx: AgentContext,
  regionIds: string[],
  isDirect: boolean,
  onToken?: TokenCallback,
  isOrphanGroup?: boolean,
  isSpeculative?: boolean,
  civDecisions?: CivDecision[]
): Promise<TransitionResult> {
  const regionIdSet = new Set(regionIds);
  const regionsToUpdate = ctx.currentState.regions.filter((r) =>
    regionIdSet.has(r.id)
  );

  const hasAiSector = regionsToUpdate.some((r) => r.aiSector);

  // Even in orphan groups, check if any region is directly affected by events
  const directlyAffectedInGroup = isOrphanGroup
    ? ctx.events.some((e) =>
      e.affectedRegions.some((rid: string) => regionIdSet.has(rid))
    )
    : false;

  const effectiveOrphan = isOrphanGroup && !directlyAffectedInGroup;
  const effectiveDirect = isDirect || directlyAffectedInGroup;

  const relevantEvents = effectiveOrphan
    ? ctx.events.slice(0, 3)
    : ctx.events.filter((e) =>
      e.affectedRegions.some((rid: string) => regionIdSet.has(rid)) ||
      (effectiveDirect && e.affectedRegions.length === 0)
    );
  const eventsSummary = (relevantEvents.length > 0 ? relevantEvents : ctx.events.slice(0, 5)).map((e) => ({
    title: e.title,
    description: e.description,
    affectedRegions: e.affectedRegions,
    category: e.category,
  }));

  const regionSnapshot = regionsToUpdate.map((r) =>
    effectiveOrphan
      ? {
        id: r.id,
        name: r.name,
        status: r.status,
        civilization: { type: r.civilization?.type, capital: r.civilization?.capital },
        demographics: { population: r.demographics?.population },
        economy: { level: r.economy?.level },
        technology: { level: r.technology?.level },
      }
      : effectiveDirect
        ? {
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
        : {
          id: r.id,
          name: r.name,
          status: r.status,
          demographics: { population: r.demographics?.population },
          economy: { level: r.economy?.level },
          military: { level: r.military?.level },
          technology: { level: r.technology?.level },
          diplomacy: {
            allies: r.diplomacy?.allies,
            enemies: r.diplomacy?.enemies,
          },
        }
  );

  const otherRegionNames = effectiveOrphan
    ? []
    : ctx.currentState.regions
      .filter((r) => !regionIdSet.has(r.id))
      .filter((r) => {
        for (const myRegion of regionsToUpdate) {
          const alliesStr = JSON.stringify(myRegion.diplomacy?.allies || "");
          const enemiesStr = JSON.stringify(myRegion.diplomacy?.enemies || "");
          const rName = JSON.stringify(r.name);
          if (
            alliesStr.includes(r.id) ||
            enemiesStr.includes(r.id) ||
            alliesStr.includes(rName) ||
            enemiesStr.includes(rName)
          ) {
            return true;
          }
        }
        return false;
      })
      .slice(0, 20)
      .map((r) => ({ id: r.id, name: r.name, status: r.status }));

  let promptBase: string;
  let schemaMode: FieldSchemaMode;
  let temperature: number;
  if (effectiveOrphan) {
    promptBase = SYSTEM_INDEPENDENT_BASE;
    schemaMode = "minimal";
    temperature = isSpeculative ? 0.45 : 0.3;
  } else if (effectiveDirect) {
    promptBase = SYSTEM_DIRECT_BASE;
    schemaMode = "full";
    temperature = isSpeculative ? 0.65 : 0.5;
  } else {
    promptBase = SYSTEM_INDIRECT_BASE;
    schemaMode = "core";
    temperature = isSpeculative ? 0.45 : 0.3;
  }

  if (isSpeculative) {
    if (effectiveOrphan) {
      promptBase = promptBase.replace(
        /CRITICAL RULES:\n1\. Each civilization evolves INDEPENDENTLY[\s\S]*?4\. Keep changes small and realistic[^\n]*/,
        `CRITICAL RULES:\n1. Each civilization evolves INDEPENDENTLY. Do NOT invent interactions between these civilizations.\n2. ${SPECULATIVE_INDEPENDENT_OVERRIDE}\n3. Keep changes realistic but allow for meaningful shifts driven by plausible future dynamics. Still limit to 2-4 fields per region.`
      );
    } else if (effectiveDirect) {
      promptBase = promptBase.replace(
        "CRITICAL: The events provided are based on real historical records. Your transitions must faithfully reflect what actually happened historically — real consequences, real outcomes, real leadership changes. Do NOT invent outcomes that contradict the historical record.",
        SPECULATIVE_DIRECT_OVERRIDE
      );
    } else {
      promptBase = promptBase.replace(
        "CRITICAL: The events provided are based on real historical records. Your indirect effects must be historically plausible and consistent with what actually happened in this period. Do NOT invent major events or outcomes that contradict the historical record.",
        SPECULATIVE_INDIRECT_OVERRIDE
      );
    }
  }

  let systemPrompt = buildSystemPrompt(promptBase, schemaMode, hasAiSector);

  if (ctx.targetYear >= 1900 && !effectiveOrphan) {
    systemPrompt += TECH_ERA_SUPPLEMENT;
  }

  if (isSpeculative && !effectiveOrphan) {
    systemPrompt += CIV_AGENCY_SUPPLEMENT;
  }

  const userParts = [
    `Year: ${ctx.targetYear}`,
    `Era: ${JSON.stringify(ctx.currentState.era)}`,
    `Events: ${JSON.stringify(eventsSummary)}`,
    `Regions to update (current key stats): ${JSON.stringify(regionSnapshot)}`,
  ];
  if (regionIds.length > 5) {
    userParts.push(`You are updating ${regionIds.length} regions. Keep EACH transition minimal: 2-4 field changes for background regions, 4-8 for directly affected.`);
  }
  if (otherRegionNames.length > 0) {
    userParts.push(`Other civilizations: ${JSON.stringify(otherRegionNames)}`);
  }

  if (civDecisions && civDecisions.length > 0) {
    const relevant = civDecisions.filter((d) => regionIdSet.has(d.regionId));
    if (relevant.length > 0) {
      userParts.push(
        `Strategic decisions by key civilizations (use as additional context for computing transitions):\n${JSON.stringify(relevant)}`
      );
    }
  }

  const memoryCtx = buildMemoryContext(regionIds);
  if (memoryCtx) {
    userParts.push(memoryCtx);
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
