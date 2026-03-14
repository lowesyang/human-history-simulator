import type { HistoricalEvent, War, Region } from "./types";
import { callAgent, safeParseJSON } from "./agents/llm-client";
import type { AgentMessage } from "./agents/types";
import { getWarLastNarrativeUpdateYear, updateWarDetails, getWarSnapshots } from "./db";

const WAR_SYSTEM = `You analyze historical events and extract war/conflict information. Given war-related events and the civilizations involved, produce structured war data.

CRITICAL: You MUST output a valid JSON ARRAY (e.g. [{...}, {...}]), even if there is only one war. Do NOT output a single object without array brackets.

Each war object in the array:
{
  "name": {"zh":"战争名称","en":"War Name"},
  "startYear": 2022,
  "belligerents": {
    "side1": {"regionIds":["id1"],"label":{"zh":"一方名称","en":"Side 1 Name"}},
    "side2": {"regionIds":["id2"],"label":{"zh":"二方名称","en":"Side 2 Name"}}
  },
  "cause": {"zh":"战争根本原因（领土争端、资源争夺、宗教冲突等）","en":"Root cause of the war"},
  "casus_belli": {"zh":"导火索事件","en":"The immediate trigger/casus belli"},
  "status": "ongoing|side1_victory|side2_victory|stalemate|ceasefire",
  "victor": "side1" | "side2" | null,
  "summary": {"zh":"当前战况概述","en":"Current war situation summary"},
  "advantages": {
    "side1": {"zh":"一方优势分析","en":"Side 1 advantages"},
    "side2": {"zh":"二方优势分析","en":"Side 2 advantages"}
  },
  "impact": {
    "side1": {"zh":"战争对一方文明的影响（军事损失、经济影响、领土变化、政治后果等）","en":"Impact on side 1 civilization"},
    "side2": {"zh":"战争对二方文明的影响（军事损失、经济影响、领土变化、政治后果等）","en":"Impact on side 2 civilization"}
  },
  "theater": {"zh":"主要战场/前线描述（地理位置、地形特点、战略意义）","en":"Main theater of operations description"},
  "casualties": {
    "side1": {"military":number,"civilian":number,"description":{"zh":"一方伤亡详情","en":"Side 1 casualty details"}},
    "side2": {"military":number,"civilian":number,"description":{"zh":"二方伤亡详情","en":"Side 2 casualty details"}}
  },
  "keyBattles": [
    {
      "name": {"zh":"战役名称","en":"Battle Name"},
      "year": number,
      "location": {"zh":"地点","en":"Location"},
      "outcome": {"zh":"结果","en":"Outcome"},
      "description": {"zh":"战术描述：部队部署、战术机动、关键时刻、转折点","en":"Tactical narrative: force deployment, maneuvers, key moments, turning points"},
      "casualties": {"side1":number,"side2":number}
    }
  ]
}

Rules:
- ALWAYS output a war for EVERY event that references an active military conflict, even if the event describes a continuation of an already-existing war (e.g. "war enters its second year", "conflict escalates")
- startYear: the actual year this war began, NOT the current year. For pre-existing wars (e.g. Russia-Ukraine war started 2022), use the real historical start year. For new wars triggered by the current events, use the current year.
- If an event resolves an existing war (peace treaty, surrender, etc.), output a war with matching name and appropriate status
- victor: set to "side1" or "side2" when the war has a clear winner (status is side1_victory or side2_victory). Set to null for ongoing, stalemate, or ceasefire.
- impact: describe concrete effects on each civilization — casualties, economic damage, territorial gains/losses, political consequences, morale changes
- theater: describe the geographic theater of war, key frontlines, terrain
- casualties: provide realistic estimates for military and civilian casualties on each side
- keyBattles: include 1-3 significant battles with tactical detail (troop movements, flanking maneuvers, siege tactics, naval engagements, etc.)
- Be historically accurate
- CRITICAL: regionIds MUST use exact IDs from the provided Regions list. Do NOT invent IDs. Copy the "id" field exactly as given.
- ALL text must be bilingual: {"zh":"...","en":"..."}
- If no wars are found, return an empty array: []`;

export async function extractWarsFromEvents(
  events: HistoricalEvent[],
  regions: Region[],
  existingWars: War[],
  year: number,
  _depth = 0
): Promise<Partial<War>[]> {
  const warEvents = events.filter((e) => e.category === "war");

  const warKeywords = /战争|冲突|入侵|进攻|军事|war|conflict|invasion|attack|military|battle|siege|offensive|bombardment/i;
  const warRelatedEvents = events.filter(
    (e) =>
      e.category !== "war" &&
      (warKeywords.test(typeof e.title === "string" ? e.title : `${e.title.zh} ${e.title.en}`) ||
        warKeywords.test(typeof e.description === "string" ? e.description : `${e.description.zh} ${e.description.en}`))
  );

  const allWarEvents = [...warEvents, ...warRelatedEvents];
  if (allWarEvents.length === 0) return [];

  console.log(`[WarExtractor] Found ${warEvents.length} war-category events + ${warRelatedEvents.length} war-keyword events`);

  const relevantRegionIds = new Set<string>();
  for (const evt of allWarEvents) {
    for (const rid of evt.affectedRegions) {
      relevantRegionIds.add(rid);
      const region = regions.find((r) => r.id === rid);
      if (region?.diplomacy?.allies) {
        const alliesText = typeof region.diplomacy.allies === "string"
          ? region.diplomacy.allies
          : (region.diplomacy.allies as { zh: string; en: string }).en || "";
        for (const r2 of regions) {
          const r2Name = typeof r2.name === "string" ? r2.name : r2.name.en;
          if (alliesText.includes(r2Name) || alliesText.includes(r2.id)) {
            relevantRegionIds.add(r2.id);
          }
        }
      }
      if (region?.diplomacy?.enemies) {
        const enemiesText = typeof region.diplomacy.enemies === "string"
          ? region.diplomacy.enemies
          : (region.diplomacy.enemies as { zh: string; en: string }).en || "";
        for (const r2 of regions) {
          const r2Name = typeof r2.name === "string" ? r2.name : r2.name.en;
          if (enemiesText.includes(r2Name) || enemiesText.includes(r2.id)) {
            relevantRegionIds.add(r2.id);
          }
        }
      }
    }
  }

  const regionSummaries = regions
    .filter((r) => relevantRegionIds.has(r.id))
    .map((r) => ({
      id: r.id,
      name: r.name,
      military: {
        level: r.military?.level,
        totalTroops: r.military?.totalTroops,
      },
    }));

  const existingWarSummaries = existingWars.map((w) => ({
    name: w.name,
    belligerents: w.belligerents,
    status: w.status,
  }));

  const warEventPayload = allWarEvents.map((e) => ({
    title: e.title,
    description: e.description,
    affectedRegions: e.affectedRegions,
    id: e.id,
    category: e.category,
  }));

  const allRegionIds = regions.map((r) => ({ id: r.id, name: r.name }));

  const messages: AgentMessage[] = [
    { role: "system", content: WAR_SYSTEM },
    {
      role: "user",
      content: `Year: ${year}

War events (${warEventPayload.length} total):
${JSON.stringify(warEventPayload)}

Relevant regions (with military data):
${JSON.stringify(regionSummaries)}

All valid region IDs (use ONLY these for regionIds):
${JSON.stringify(allRegionIds)}

Existing wars in database:
${JSON.stringify(existingWarSummaries)}

CRITICAL INSTRUCTIONS:
1. Output a JSON ARRAY: [{war1}, {war2}, ...]. Even for a single war, wrap it in [].
2. Each DISTINCT conflict in the events above MUST have its own war object. For example, if events mention BOTH "Russia-Ukraine War" AND "Israel-Hamas War", you MUST output TWO separate war objects.
3. Do NOT merge different conflicts into one war object.
4. Group events by their affectedRegions to identify which events belong to which conflict.
5. regionIds MUST use exact IDs from the "All valid region IDs" list above.`,
    },
  ];

  try {
    const response = await callAgent(
      messages,
      { temperature: 0.3 }
    );
    console.log(`[WarExtractor] Raw LLM response (first 500 chars): ${response.slice(0, 500)}`);
    const parsed = safeParseJSON<Partial<War>[] | Partial<War>>(response);
    let wars = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === "object" && "name" in parsed) ? [parsed] : [];
    console.log(`[WarExtractor] Extracted ${wars.length} wars from ${allWarEvents.length} war events`);

    if (_depth === 0 && wars.length < warEvents.length && warEvents.length > 1) {
      const alreadyExtractedRegions = new Set<string>();
      for (const w of wars) {
        if (!w.belligerents) continue;
        for (const rid of (w.belligerents.side1?.regionIds || [])) alreadyExtractedRegions.add(rid);
        for (const rid of (w.belligerents.side2?.regionIds || [])) alreadyExtractedRegions.add(rid);
      }

      const missedEvents = warEvents.filter((evt) => {
        return !evt.affectedRegions.some((r) => alreadyExtractedRegions.has(r));
      });

      if (missedEvents.length > 0) {
        console.log(`[WarExtractor] ${missedEvents.length} war events not covered by extracted wars, retrying`);

        const alreadyExtractedNames = wars
          .filter((w) => w.name)
          .map((w) => `${w.name!.en} (${w.name!.zh})`);

        const retryWars = await extractWarsFromEventsRetry(
          missedEvents,
          regions,
          [...existingWars, ...wars as War[]],
          year,
          alreadyExtractedNames,
        );
        wars = [...wars, ...retryWars];
        console.log(`[WarExtractor] After retry: ${wars.length} total wars`);
      }
    }

    const seen = new Set<string>();
    wars = wars.filter((w) => {
      if (!w.name) return false;
      const key = `${w.name.en}||${w.name.zh}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return wars;
  } catch (err) {
    console.error("[WarExtractor] Failed to extract wars:", err);
    return [];
  }
}

async function extractWarsFromEventsRetry(
  events: HistoricalEvent[],
  regions: Region[],
  existingWars: War[],
  year: number,
  alreadyExtractedNames: string[],
): Promise<Partial<War>[]> {
  const allWarEvents = events.filter((e) =>
    e.category === "war" ||
    /战争|冲突|入侵|进攻|军事|war|conflict|invasion|attack|military|battle|siege|offensive|bombardment/i.test(
      typeof e.title === "string" ? e.title : `${e.title.zh} ${e.title.en}`
    )
  );
  if (allWarEvents.length === 0) return [];

  const relevantRegionIds = new Set<string>();
  for (const evt of allWarEvents) {
    for (const rid of evt.affectedRegions) relevantRegionIds.add(rid);
  }

  const regionSummaries = regions
    .filter((r) => relevantRegionIds.has(r.id))
    .map((r) => ({
      id: r.id,
      name: r.name,
      military: { level: r.military?.level, totalTroops: r.military?.totalTroops },
    }));

  const allRegionIds = regions.map((r) => ({ id: r.id, name: r.name }));

  const warEventPayload = allWarEvents.map((e) => ({
    title: e.title,
    description: e.description,
    affectedRegions: e.affectedRegions,
    id: e.id,
    category: e.category,
  }));

  const messages: AgentMessage[] = [
    { role: "system", content: WAR_SYSTEM },
    {
      role: "user",
      content: `Year: ${year}

The following wars have ALREADY been extracted and should NOT be repeated:
${alreadyExtractedNames.map((n) => `- ${n}`).join("\n")}

These ${warEventPayload.length} events describe a DIFFERENT conflict that has NOT yet been extracted. Extract the NEW war(s) from these events:
${JSON.stringify(warEventPayload)}

Relevant regions:
${JSON.stringify(regionSummaries)}

All valid region IDs:
${JSON.stringify(allRegionIds)}

CRITICAL: Do NOT output any war named ${alreadyExtractedNames.join(" or ")}. These events describe a DIFFERENT conflict. Output ONLY the new war(s).`,
    },
  ];

  try {
    const response = await callAgent(messages, { temperature: 0.3 });
    console.log(`[WarExtractor Retry] Raw LLM response (first 500 chars): ${response.slice(0, 500)}`);
    const parsed = safeParseJSON<Partial<War>[] | Partial<War>>(response);
    const wars = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === "object" && "name" in parsed) ? [parsed] : [];

    const filtered = wars.filter((w) => {
      if (!w.name) return false;
      return !alreadyExtractedNames.some(
        (n) => n.includes(w.name!.en) || n.includes(w.name!.zh)
      );
    });

    console.log(`[WarExtractor Retry] Extracted ${wars.length} wars, kept ${filtered.length} after filtering duplicates`);
    return filtered;
  } catch (err) {
    console.error("[WarExtractor Retry] Failed:", err);
    return [];
  }
}

const NARRATIVE_UPDATE_SYSTEM = `You update war narratives based on current military and economic data. Given ongoing wars with metric snapshots showing how each side's military, economy, and population have changed over time, produce updated summary, advantages, impact, casualties, and key battles.

Output ONLY a valid JSON array (no markdown, no explanation). Each element:
{
  "warId": "the war ID",
  "summary": {"zh":"当前战况综合概述（包含具体数据变化）","en":"Updated war situation summary with concrete data changes"},
  "advantages": {
    "side1": {"zh":"一方当前优势","en":"Side 1 current advantages"},
    "side2": {"zh":"二方当前优势","en":"Side 2 current advantages"}
  },
  "impact": {
    "side1": {"zh":"战争对一方的累计影响（引用具体数据变化）","en":"Cumulative war impact on side 1 with specific data"},
    "side2": {"zh":"战争对二方的累计影响（引用具体数据变化）","en":"Cumulative war impact on side 2 with specific data"}
  },
  "theater": {"zh":"当前主要战场描述","en":"Current theater of operations"},
  "casualties": {
    "side1": {"military":number,"civilian":number,"description":{"zh":"...","en":"..."}},
    "side2": {"military":number,"civilian":number,"description":{"zh":"...","en":"..."}}
  },
  "keyBattles": [
    {
      "name": {"zh":"...","en":"..."},
      "year": number,
      "location": {"zh":"...","en":"..."},
      "outcome": {"zh":"...","en":"..."},
      "description": {"zh":"战术叙述","en":"Tactical narrative"},
      "casualties": {"side1":number,"side2":number}
    }
  ]
}

Rules:
- Reference concrete metric changes (e.g. "military strength declined 30% from 500K to 350K troops")
- Describe economic impact with GDP changes
- Note population trends
- Update cumulative casualties based on troop losses visible in metrics
- Add any new significant battles that occurred since the last update
- ALL text must be bilingual: {"zh":"...","en":"..."}
- If no meaningful changes, keep the existing narrative
- Return empty array if no updates needed: []`;

export async function updateOngoingWarNarratives(
  activeWars: War[],
  regions: Region[],
  currentYear: number
): Promise<void> {
  const ongoingWars = activeWars.filter((w) => w.status === "ongoing");
  if (ongoingWars.length === 0) return;

  const warsToUpdate: War[] = [];
  for (const war of ongoingWars) {
    const lastUpdate = getWarLastNarrativeUpdateYear(war.id);
    const yearsSinceStart = currentYear - war.startYear;
    if (yearsSinceStart < 2) continue;
    if (lastUpdate != null && currentYear - lastUpdate < 2) continue;
    warsToUpdate.push(war);
  }

  if (warsToUpdate.length === 0) return;

  const warDataForLLM = warsToUpdate.map((war) => {
    const snapshots = getWarSnapshots(war.id);
    const side1Regions = regions.filter((r) => war.belligerents.side1.regionIds.includes(r.id));
    const side2Regions = regions.filter((r) => war.belligerents.side2.regionIds.includes(r.id));

    const metricsOverTime = [];
    const seen = new Set<number>();
    for (const snap of snapshots) {
      if (seen.has(snap.year)) continue;
      seen.add(snap.year);
      const s1 = snapshots.filter((s) => s.year === snap.year && s.side === "side1")[0];
      const s2 = snapshots.filter((s) => s.year === snap.year && s.side === "side2")[0];
      if (s1 && s2) {
        metricsOverTime.push({
          year: snap.year,
          side1: { troops: s1.totalTroops, gdpGoldKg: s1.gdpGoldKg, population: s1.population, techLevel: s1.techLevel },
          side2: { troops: s2.totalTroops, gdpGoldKg: s2.gdpGoldKg, population: s2.population, techLevel: s2.techLevel },
        });
      }
    }

    return {
      warId: war.id,
      name: war.name,
      belligerents: {
        side1: { label: war.belligerents.side1.label, regions: side1Regions.map((r) => ({ id: r.id, name: r.name })) },
        side2: { label: war.belligerents.side2.label, regions: side2Regions.map((r) => ({ id: r.id, name: r.name })) },
      },
      startYear: war.startYear,
      currentYear,
      metricsOverTime,
      currentSummary: war.summary,
    };
  });

  const messages: AgentMessage[] = [
    { role: "system", content: NARRATIVE_UPDATE_SYSTEM },
    {
      role: "user",
      content: `Year: ${currentYear}\nWars to update:\n${JSON.stringify(warDataForLLM)}\n\nUpdate the narratives based on the metric trends.`,
    },
  ];

  try {
    const response = await callAgent(messages, { temperature: 0.3 });
    const updates = safeParseJSON<{
      warId: string;
      summary: { zh: string; en: string };
      advantages: { side1: { zh: string; en: string }; side2: { zh: string; en: string } };
      impact: { side1: { zh: string; en: string }; side2: { zh: string; en: string } };
      theater?: { zh: string; en: string };
      casualties?: {
        side1: { military: number; civilian: number; description: { zh: string; en: string } };
        side2: { military: number; civilian: number; description: { zh: string; en: string } };
      };
      keyBattles?: {
        name: { zh: string; en: string };
        year: number;
        location: { zh: string; en: string };
        outcome: { zh: string; en: string };
        description: { zh: string; en: string };
        casualties: { side1: number; side2: number };
      }[];
    }[]>(response);

    if (!Array.isArray(updates)) return;

    for (const update of updates) {
      if (!update.warId || !update.summary) continue;
      updateWarDetails(
        update.warId,
        update.summary,
        update.advantages || { side1: { zh: "", en: "" }, side2: { zh: "", en: "" } },
        update.impact || { side1: { zh: "", en: "" }, side2: { zh: "", en: "" } },
        currentYear,
        update.theater,
        update.casualties,
        update.keyBattles
      );
    }

    console.log(`[WarExtractor] Updated narratives for ${updates.length} wars`);
  } catch (err) {
    console.error("[WarExtractor] Failed to update war narratives:", err);
  }
}
