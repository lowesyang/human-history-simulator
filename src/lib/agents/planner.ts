import type { AgentContext, PlannerOutput, AgentMessage } from "./types";
import { callAgent, safeParseJSON } from "./llm-client";

const PLANNER_SYSTEM = `You are a historical analysis planner. Given historical events and the current world state,
you determine which civilizations are directly and indirectly affected, and outline what aspects need to change.

You must output ONLY compact JSON (no markdown, no explanation):
{
  "affectedRegionIds": ["id1", "id2"],
  "indirectRegionIds": ["id3", "id4"],
  "analysisPoints": [
    "Point 1: What direct effects to apply",
    "Point 2: What ripple effects to consider",
    "Point 3: What diplomatic shifts occur"
  ],
  "eventSummary": "Brief summary of all events in this epoch"
}

Rules:
- affectedRegionIds: regions directly named in or targeted by the events
- indirectRegionIds: regions not directly involved but affected by ripple effects (trade disruption, power shifts, etc.)
- analysisPoints: 3-8 specific points about what changes to make, covering economy, military, demographics, diplomacy, culture
- Be thorough: consider trade route disruptions, power vacuums, refugee flows, alliance shifts`;

export async function runPlanner(ctx: AgentContext): Promise<PlannerOutput> {
  const regionSummary = ctx.currentState.regions.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    type: r.civilization.type,
  }));

  const eventsSummary = ctx.events.map((e) => ({
    title: e.title,
    description: e.description,
    affectedRegions: e.affectedRegions,
    category: e.category,
  }));

  const messages: AgentMessage[] = [
    { role: "system", content: PLANNER_SYSTEM },
    {
      role: "user",
      content: `Year: ${ctx.targetYear}

Current civilizations:
${JSON.stringify(regionSummary)}

Events to process:
${JSON.stringify(eventsSummary)}`,
    },
  ];

  const response = await callAgent(messages, { temperature: 0.3 });
  return safeParseJSON<PlannerOutput>(response);
}
