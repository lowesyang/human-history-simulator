import type { HistoricalEvent, War, Region, LocalizedText } from "./types";
import { callAgentStreaming, safeParseJSON } from "./agents/llm-client";
import type { AgentMessage } from "./agents/types";

const WAR_SYSTEM = `You analyze historical events and extract war/conflict information. Given war-related events and the civilizations involved, produce structured war data.

Output ONLY a valid JSON array of war objects (no markdown, no explanation). Each war object:
{
  "name": {"zh":"战争名称","en":"War Name"},
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
  }
}

Rules:
- Only create wars for events that describe actual military conflicts between distinct civilizations/regions
- If an event resolves an existing war (peace treaty, surrender, etc.), output a war with matching name and appropriate status
- victor: set to "side1" or "side2" when the war has a clear winner (status is side1_victory or side2_victory). Set to null for ongoing, stalemate, or ceasefire.
- impact: describe concrete effects on each civilization — casualties, economic damage, territorial gains/losses, political consequences, morale changes
- Be historically accurate
- Each side must reference valid region IDs from the provided list
- ALL text must be bilingual: {"zh":"...","en":"..."}
- If no wars are found, return an empty array: []`;

export async function extractWarsFromEvents(
  events: HistoricalEvent[],
  regions: Region[],
  existingWars: War[],
  year: number
): Promise<Partial<War>[]> {
  const warEvents = events.filter((e) => e.category === "war");
  if (warEvents.length === 0) return [];

  const regionSummaries = regions.map((r) => ({
    id: r.id,
    name: r.name,
    diplomacy: {
      allies: r.diplomacy?.allies,
      enemies: r.diplomacy?.enemies,
    },
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

  const messages: AgentMessage[] = [
    { role: "system", content: WAR_SYSTEM },
    {
      role: "user",
      content: `Year: ${year}
War events: ${JSON.stringify(warEvents.map((e) => ({ title: e.title, description: e.description, affectedRegions: e.affectedRegions, id: e.id })))}
Regions: ${JSON.stringify(regionSummaries)}
Existing wars: ${JSON.stringify(existingWarSummaries)}

Analyze these war events and extract structured war data. Update existing wars if applicable, or create new ones.`,
    },
  ];

  try {
    const response = await callAgentStreaming(
      messages,
      "war-analyzer",
      () => { },
      { temperature: 0.3 }
    );
    const wars = safeParseJSON<Partial<War>[]>(response);
    return Array.isArray(wars) ? wars : [];
  } catch (err) {
    console.error("[WarExtractor] Failed to extract wars:", err);
    return [];
  }
}
