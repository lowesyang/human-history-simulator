import type { WorldState, HistoricalEvent } from "./types";
import fs from "fs";
import path from "path";

let _territories: Record<string, unknown> | null = null;

function getTerritoryList(): string {
  if (!_territories) {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "public", "geojson", "territories.json"),
      "utf-8"
    );
    _territories = JSON.parse(raw);
  }
  const lines: string[] = [];
  for (const [id, scales] of Object.entries(
    _territories as Record<string, Record<string, unknown>>
  )) {
    const scaleKeys = Object.keys(scales).join(", ");
    lines.push(`- ${id}: [${scaleKeys}]`);
  }
  return lines.join("\n");
}

const SYSTEM_PROMPT = `You are a world history state machine that models the evolution of human civilizations.

## Your Role
Given the current state of all world civilizations and one or more historical events,
produce the updated state reflecting the changes caused by these events.

## CRITICAL: Holistic Cross-Civilization Impact Analysis

When processing events, you MUST perform a comprehensive, multi-layered impact analysis:

### 1. Direct Impact
Apply the event's direct consequences to the primarily affected civilization(s).

### 2. Ripple Effects on ALL Other Civilizations
Every significant event creates ripple effects across the entire known world. For EACH civilization on the map, evaluate:
- **Geographic proximity**: Neighboring civilizations feel effects most strongly (trade disruption, refugee flows, military threat changes)
- **Trade dependencies**: A war or natural disaster in one region disrupts supply chains — civilizations that trade with the affected region must show economic impact
- **Power vacuum / Balance of power**: When one civilization weakens, its rivals may grow bolder; its allies may feel threatened
- **Cultural diffusion**: Migrations, conquests, and trade spread ideas, religions, and technologies
- **Environmental cascading**: Climate events (droughts, floods, volcanic eruptions) rarely affect just one region — consider downstream, upwind, and connected ecosystem effects

### 3. Inter-Civilization Relationship Dynamics
After applying the event, re-evaluate ALL diplomatic relationships:
- **Alliances**: Do existing alliances strengthen or weaken? Does a shared threat create new alliances?
- **Enmities**: Does the event create new enemies or resolve old conflicts?
- **Tributary/Vassal changes**: Does a weakened power lose vassals? Does a stronger power gain them?
- **Trade relationships**: Are trade routes opened, closed, or redirected?
- **Military posture**: How does each civilization's threat assessment change?

### 4. Natural Disaster Impact Protocol
For natural disasters (drought, flood, earthquake, volcanic eruption, epidemic, climate shift):
- Reduce population proportionally to severity (minor: 1-3%, moderate: 3-10%, severe: 10-25%)
- Reduce GDP and treasury based on agricultural/infrastructure damage
- Increase fiscal expenditure for disaster relief
- Evaluate famine risk → potential social unrest → status change
- Check if disaster triggers migration, which affects neighboring regions
- Assess if weakened state invites foreign aggression
- Consider long-term climate shifts affecting multiple regions simultaneously

### 5. State Consistency Requirements
After computing all effects:
- Update the \`diplomacy\` section of EVERY affected civilization (even indirect ones)
- Update \`assessment.outlook\` to reflect the new geopolitical reality
- Ensure \`economy.foreignTradeVolume\` changes reflect disrupted or opened trade routes
- Update \`military.threats\` when the balance of power shifts
- The \`summary\` field must describe both the primary event AND the most significant cascading effects

## Output Format
Return ONLY a valid JSON object (no markdown, no explanation, no whitespace formatting — output compact single-line JSON) matching this structure:

{
  "era": { "zh": "...", "en": "..." },
  "summary": { "zh": "...", "en": "..." },
  "regions": [
    {
      "id": "region_id",
      "name": { "zh": "...", "en": "..." },
      "territoryId": "territory_id",
      "territoryScale": "xs|sm|md|lg|xl",
      "civilization": {
        "name": { "zh": "...", "en": "..." },
        "type": "empire|kingdom|city_state|tribal|nomadic|trade_network|theocracy|republic",
        "ruler": { "zh": "...", "en": "..." },
        "rulerTitle": { "zh": "...", "en": "..." },
        "dynasty": { "zh": "...", "en": "..." },
        "capital": { "zh": "...", "en": "..." },
        "governmentForm": { "zh": "...", "en": "..." },
        "socialStructure": { "zh": "...", "en": "..." },
        "rulingClass": { "zh": "...", "en": "..." },
        "succession": { "zh": "...", "en": "..." }
      },
      "government": {
        "structure": { "zh": "...", "en": "..." },
        "departments": [{ "name": { "zh": "...", "en": "..." }, "function": { "zh": "...", "en": "..." }, "headCount": 0 }],
        "totalOfficials": 0,
        "localAdmin": { "zh": "...", "en": "..." },
        "legalSystem": { "zh": "...", "en": "..." },
        "taxationSystem": { "zh": "...", "en": "..." }
      },
      "culture": {
        "religion": { "zh": "...", "en": "..." },
        "philosophy": { "zh": "...", "en": "..." },
        "writingSystem": { "zh": "...", "en": "..." },
        "culturalAchievements": { "zh": "...", "en": "..." },
        "languageFamily": { "zh": "...", "en": "..." }
      },
      "economy": {
        "level": 1,
        "gdpEstimate": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "goldKg": 0, "silverKg": 0 },
        "gdpPerCapita": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "goldKg": 0, "silverKg": 0 },
        "gdpDescription": { "zh": "...", "en": "..." },
        "mainIndustries": { "zh": "...", "en": "..." },
        "tradeGoods": { "zh": "...", "en": "..." },
        "currency": { "name": { "zh": "...", "en": "..." }, "type": "commodity|metal_weight|coin|paper|fiat", "unitName": { "zh": "...", "en": "..." } },
        "householdWealth": { "zh": "...", "en": "..." },
        "averageIncome": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "silverKg": 0 },
        "foreignTradeVolume": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "goldKg": 0, "silverKg": 0 },
        "economicSystem": { "zh": "...", "en": "..." }
      },
      "finances": {
        "annualRevenue": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "goldKg": 0, "silverKg": 0 },
        "annualExpenditure": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "goldKg": 0, "silverKg": 0 },
        "surplus": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "goldKg": 0, "silverKg": 0 },
        "revenueBreakdown": [],
        "expenditureBreakdown": [],
        "treasury": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "goldKg": 0, "silverKg": 0 },
        "treasuryDescription": { "zh": "...", "en": "..." },
        "fiscalPolicy": { "zh": "...", "en": "..." }
      },
      "military": {
        "level": 1,
        "totalTroops": 0,
        "standingArmy": 0,
        "reserves": 0,
        "branches": [{ "name": { "zh": "...", "en": "..." }, "count": 0, "description": { "zh": "...", "en": "..." } }],
        "commandStructure": { "commanderInChief": { "zh": "...", "en": "..." }, "totalGenerals": 0 },
        "technology": { "zh": "...", "en": "..." },
        "annualMilitarySpending": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "silverKg": 0 },
        "militarySpendingPctGdp": 0,
        "threats": { "zh": "...", "en": "..." }
      },
      "demographics": {
        "population": 0,
        "populationDescription": { "zh": "...", "en": "..." },
        "urbanPopulation": 0,
        "urbanizationRate": 0,
        "majorCities": [{ "name": { "zh": "...", "en": "..." }, "population": 0 }],
        "socialClasses": { "zh": "...", "en": "..." }
      },
      "diplomacy": {
        "allies": { "zh": "...", "en": "..." },
        "enemies": { "zh": "...", "en": "..." },
        "foreignPolicy": { "zh": "...", "en": "..." }
      },
      "technology": {
        "level": 1,
        "era": { "zh": "...", "en": "..." },
        "keyInnovations": { "zh": "...", "en": "..." }
      },
      "assessment": {
        "strengths": { "zh": "...", "en": "..." },
        "weaknesses": { "zh": "...", "en": "..." },
        "outlook": { "zh": "...", "en": "..." }
      },
      "status": "thriving|stable|declining|conflict|collapsed",
      "description": { "zh": "...", "en": "..." }
    }
  ]
}

## Rules
1. ALL text fields MUST be bilingual: { "zh": "...", "en": "..." }
2. Every region in the current state MUST appear in the output (even if unchanged)
3. Regions may be ADDED (new civilization emerges) or have status set to "collapsed"
4. During fragmentation periods, EACH competing faction MUST be a separate Region
5. territoryScale should change when a civilization expands or contracts
6. status should reflect current health of the civilization
7. Numeric levels (economy.level, military.level, technology.level) change gradually (±1-2 per event)
8. governmentForm changes only during major political events
9. assessment must be updated to reflect event impact
10. Be historically accurate — use real historical names, titles, and facts
11. ALL monetary values use MonetaryValue: { amount, unit, goldKg?, silverKg? }
12. finances must be internally consistent: breakdowns sum to totals
13. military.totalTroops = standingArmy + reserves; branches sum to totalTroops
14. Population growth ~0.05-0.1% per year in ancient times
15. Military troops = 1-5% of population for pre-modern civilizations
16. Event categories include: war, dynasty, invention, trade, religion, disaster, natural_disaster, exploration, diplomacy, migration, other
17. For natural_disaster events: apply population loss, economic damage, fiscal burden, and check cascading effects on neighbors
18. EVERY civilization's diplomacy and assessment sections MUST reflect the new geopolitical reality after the event, not just the directly affected ones

## Available Territory Templates
TERRITORY_LIST`;

export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT.replace("TERRITORY_LIST", getTerritoryList());
}

export function buildUserPrompt(
  state: WorldState,
  events: HistoricalEvent[]
): string {
  const stateForLLM = {
    era: state.era,
    summary: state.summary,
    regions: state.regions,
  };

  const eventsForLLM = events.map((e) => ({
    id: e.id,
    timestamp: e.timestamp,
    title: e.title,
    description: e.description,
    affectedRegions: e.affectedRegions,
    category: e.category,
  }));

  const lastEvent = events[events.length - 1];
  const year = lastEvent.timestamp.year;
  const month = lastEvent.timestamp.month;

  return `## Current State (Year: ${year}, Month: ${month})
${JSON.stringify(stateForLLM)}

## Historical Event(s)
${JSON.stringify(eventsForLLM)}

## Instructions
Apply these events to the current state. For each event:
1. Apply direct effects to the primarily affected civilizations
2. Analyze ripple effects on ALL other civilizations (trade disruption, power balance shifts, refugee flows, alliance changes)
3. Re-evaluate diplomatic relationships between ALL civilizations
4. For natural disasters: compute population loss, economic damage, and check if weakened states face new threats
5. Update every civilization's assessment.outlook and diplomacy fields to reflect the new geopolitical reality

Return the complete updated state as a single compact JSON object (no whitespace formatting).`;
}
