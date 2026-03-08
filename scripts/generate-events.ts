import fs from "fs";
import path from "path";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OUTPUT_DIR = path.join(process.cwd(), "src", "data", "seed");

const ERAS = [
  {
    name: "iron-age",
    range: "1200-500 BCE",
    years: "-1200 to -500",
    regions: [
      "china_central",
      "china_qi",
      "china_chu",
      "china_qin",
      "china_jin",
      "egypt",
      "mesopotamia",
      "anatolia",
      "aegean",
      "levant",
      "persia",
      "india_north",
      "india_south",
      "nubia",
      "steppe",
      "italy",
      "europe_west",
    ],
    notes:
      "Zhou Dynasty (Western/Eastern), Assyrian Empire, Neo-Babylonian, Phoenician expansion, Greek city-states, Persian rise, Vedic India, Kingdom of Kush, Etruscans, Celtic expansion",
  },
  {
    name: "classical",
    range: "500 BCE - 200 CE",
    years: "-500 to 200",
    regions: [
      "china_central",
      "china_qin",
      "china_chu",
      "india_north",
      "india_south",
      "persia",
      "aegean",
      "italy",
      "egypt",
      "mesopotamia",
      "levant",
      "steppe",
      "southeast_asia",
      "japan",
      "korea",
      "central_america",
      "south_america",
      "europe_west",
      "east_africa",
      "west_africa",
    ],
    notes:
      "Warring States, Qin/Han unification, Maurya/Gupta India, Achaemenid Persia, Greek golden age, Alexander, Roman Republic/Empire, Ptolemaic Egypt, Silk Road, Mesoamerican civilizations",
  },
];

async function generateEvents(era: (typeof ERAS)[number]) {
  console.log(`\nGenerating events for ${era.name} (${era.range})...`);

  const prompt = `Generate a chronological list of the most important historical events during the period ${era.range}. For each event, provide:
- year and month (estimate month if unknown, use 6 as default). Years are negative for BCE (e.g., -800 for 800 BCE)
- title in both Chinese and English
- description in both Chinese and English (2-3 sentences). The description MUST mention how this event affects other civilizations beyond the directly affected ones.
- affected region IDs from this list: [${era.regions.join(", ")}]. Include ALL regions that feel any impact, even indirectly.
- category: war | dynasty | invention | trade | religion | disaster | natural_disaster | exploration | diplomacy | migration | other

IMPORTANT REQUIREMENTS:
1. Cover ALL major civilizations on Earth during this period: ${era.notes}
2. Include at least 10-15 NATURAL DISASTER events based on historical/archaeological evidence:
   - Documented droughts, floods, earthquakes, volcanic eruptions, tsunamis, epidemics
   - Climate shifts (e.g., aridification periods, cooling events from volcanic activity)
   - Famine caused by crop failures or natural causes
   - Use "natural_disaster" category for these (not "disaster" which is for man-made/civilizational collapse)
3. For each event, think about CROSS-CIVILIZATION IMPACT:
   - A drought in one region disrupts trade with partners
   - A war weakens one power, emboldening its rivals
   - A volcanic eruption causes global climate effects
   - List ALL affected regions, not just the primary one

Return as a JSON array of objects with this EXACT structure:
[
  {
    "id": "evt-${era.name}-001",
    "timestamp": { "year": -1200, "month": 6 },
    "title": { "zh": "标题", "en": "Title" },
    "description": { "zh": "描述...", "en": "Description..." },
    "affectedRegions": ["region_id"],
    "category": "war",
    "status": "pending"
  }
]

Aim for 80-100 events, evenly distributed across all active civilizations. Return ONLY the JSON array.`;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 24000,
        temperature: 0.7,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error(`API error for ${era.name}: ${err}`);
    return;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error(`No content for ${era.name}`);
    return;
  }

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error(`Could not extract JSON from response for ${era.name}`);
    return;
  }

  const events = JSON.parse(jsonMatch[0]);
  const outputPath = path.join(OUTPUT_DIR, `events-${era.name}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(events, null, 2));
  console.log(`  Written ${events.length} events to ${outputPath}`);
}

async function main() {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === "your_openrouter_api_key_here") {
    console.error("Please set OPENROUTER_API_KEY environment variable");
    console.log(
      "Usage: OPENROUTER_API_KEY=your_key npx tsx scripts/generate-events.ts"
    );
    process.exit(1);
  }

  for (const era of ERAS) {
    await generateEvents(era);
  }

  console.log("\nDone! Run 'npx tsx scripts/seed-db.ts' to load events into SQLite.");
}

main().catch(console.error);
