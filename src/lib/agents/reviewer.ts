import type { AgentMessage, ReviewResult } from "./types";
import type { Region } from "../types";
import { callAgent, safeParseJSON } from "./llm-client";

const REVIEWER_SYSTEM = `You are a quality reviewer for a historical civilization simulation.
You check updated region data for consistency, accuracy, and completeness.

Output ONLY compact JSON:
{
  "approved": true/false,
  "issues": ["issue 1", "issue 2"],
  "suggestions": ["suggestion 1"]
}

Check for:
1. Internal consistency: military.totalTroops = standingArmy + reserves
2. Financial consistency: revenue/expenditure breakdowns should roughly sum to totals
3. Population reasonableness: military = 1-5% of population, urbanization rate matches cities
4. Historical accuracy: names, titles, dates should be plausible for the era
5. Diplomatic consistency: if A lists B as ally, B should also reference A
6. All bilingual fields have both zh and en values
7. Status matches the actual state (e.g., "thriving" shouldn't have declining economy)

Be pragmatic — minor numerical rounding is fine. Only flag real problems.
Set approved=true if there are no critical issues (minor suggestions are OK).`;

export async function runReviewer(
  regions: Region[],
  year: number,
  eventSummary: string
): Promise<ReviewResult> {
  const compact = regions.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    population: r.demographics.population,
    totalTroops: r.military.totalTroops,
    standingArmy: r.military.standingArmy,
    reserves: r.military.reserves,
    branchTotal: r.military.branches.reduce((s, b) => s + b.count, 0),
    urbanPop: r.demographics.urbanPopulation,
    urbanRate: r.demographics.urbanizationRate,
    economyLevel: r.economy.level,
    allies: r.diplomacy.allies,
    enemies: r.diplomacy.enemies,
  }));

  const messages: AgentMessage[] = [
    { role: "system", content: REVIEWER_SYSTEM },
    {
      role: "user",
      content: `Year: ${year}
Events: ${eventSummary}

Region data to review:
${JSON.stringify(compact)}`,
    },
  ];

  const response = await callAgent(messages, { temperature: 0.2 });
  return safeParseJSON<ReviewResult>(response);
}
