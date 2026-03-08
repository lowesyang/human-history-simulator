import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

interface EraPreset {
  id: string;
  name: { zh: string; en: string };
  year: number;
  month: number;
  era: { zh: string; en: string };
  description: { zh: string; en: string };
}

const SEED_DIR = path.join(process.cwd(), "src", "data", "seed");
const TERRITORY_PATH = path.join(process.cwd(), "public", "geojson", "territories.json");

const ERA_PRESETS: EraPreset[] = [
  { id: "bronze-age", name: { zh: "青铜时代", en: "Bronze Age" }, year: -1600, month: 1, era: { zh: "青铜时代中期", en: "Middle Bronze Age" }, description: { zh: "商朝建立，巴比伦帝国鼎盛", en: "Shang Dynasty founded, Babylonian Empire at peak" } },
  { id: "iron-age", name: { zh: "铁器时代", en: "Iron Age" }, year: -800, month: 1, era: { zh: "铁器时代初期", en: "Early Iron Age" }, description: { zh: "西周末年，亚述帝国称霸两河流域", en: "Late Western Zhou, Assyrian Empire dominant" } },
  { id: "axial-age", name: { zh: "轴心时代", en: "Axial Age" }, year: -500, month: 1, era: { zh: "轴心时代", en: "Axial Age" }, description: { zh: "孔子与老子的时代，波斯帝国鼎盛", en: "Age of Confucius and Laozi, Persian Empire at peak" } },
  { id: "hellenistic", name: { zh: "希腊化时代", en: "Hellenistic Period" }, year: -323, month: 6, era: { zh: "希腊化时代", en: "Hellenistic Period" }, description: { zh: "亚历山大大帝去世，帝国分裂在即", en: "Alexander the Great just died, empire fragmenting" } },
  { id: "qin-rome", name: { zh: "秦汉与罗马", en: "Qin-Han & Rome" }, year: -221, month: 1, era: { zh: "帝国时代", en: "Age of Empires" }, description: { zh: "秦始皇统一六国，罗马共和国扩张", en: "Qin Shi Huang unifies China, Roman Republic expanding" } },
  { id: "han-rome-peak", name: { zh: "两大帝国鼎盛", en: "Twin Empires" }, year: 100, month: 1, era: { zh: "古典帝国鼎盛期", en: "Classical Empire Zenith" }, description: { zh: "东汉鼎盛，罗马帝国图拉真时代", en: "Eastern Han at peak, Roman Empire under Trajan" } },
  { id: "three-kingdoms", name: { zh: "三国时代", en: "Three Kingdoms Era" }, year: 220, month: 1, era: { zh: "三国与罗马危机", en: "Three Kingdoms & Roman Crisis" }, description: { zh: "魏蜀吴三足鼎立，罗马帝国陷入三世纪危机", en: "Wei, Shu, Wu competing, Roman Empire in Third Century Crisis" } },
  { id: "fall-of-rome", name: { zh: "罗马帝国衰亡", en: "Fall of Rome" }, year: 476, month: 9, era: { zh: "古典世界终结", en: "End of Classical World" }, description: { zh: "西罗马帝国灭亡，南北朝对峙", en: "Western Roman Empire fallen, Northern and Southern Dynasties in China" } },
  { id: "tang-golden-age", name: { zh: "大唐盛世", en: "Tang Golden Age" }, year: 750, month: 1, era: { zh: "中世纪盛期", en: "Early Medieval Zenith" }, description: { zh: "唐朝天宝年间极盛即将转衰", en: "Tang Dynasty at apex before An Lushan Rebellion" } },
  { id: "crusades", name: { zh: "十字军时代", en: "Age of Crusades" }, year: 1200, month: 1, era: { zh: "十字军时代", en: "Age of Crusades" }, description: { zh: "南宋偏安江南，蒙古帝国即将崛起", en: "Southern Song in China, Mongol Empire about to rise" } },
  { id: "mongol-empire", name: { zh: "蒙古帝国", en: "Mongol Empire" }, year: 1280, month: 1, era: { zh: "蒙古和平", en: "Pax Mongolica" }, description: { zh: "元朝统治中国，蒙古帝国横跨欧亚", en: "Yuan Dynasty rules China, Mongol Empire spans Eurasia" } },
  { id: "renaissance", name: { zh: "文艺复兴", en: "Renaissance" }, year: 1500, month: 1, era: { zh: "文艺复兴与大航海", en: "Renaissance & Age of Exploration" }, description: { zh: "明朝弘治中兴，欧洲文艺复兴高峰", en: "Ming Dynasty thriving, European Renaissance at peak" } },
  { id: "early-modern", name: { zh: "近代早期", en: "Early Modern Period" }, year: 1648, month: 10, era: { zh: "近代早期", en: "Early Modern Period" }, description: { zh: "三十年战争结束，威斯特伐利亚体系建立", en: "Thirty Years' War ends, Westphalian system established" } },
  { id: "enlightenment", name: { zh: "启蒙时代", en: "Age of Enlightenment" }, year: 1750, month: 1, era: { zh: "启蒙时代", en: "Age of Enlightenment" }, description: { zh: "清朝乾隆盛世，欧洲启蒙运动高潮", en: "Qing Dynasty Qianlong era, European Enlightenment at peak" } },
  { id: "industrial-revolution", name: { zh: "工业革命", en: "Industrial Revolution" }, year: 1840, month: 1, era: { zh: "工业革命时期", en: "Industrial Revolution" }, description: { zh: "鸦片战争爆发，英国维多利亚时代", en: "Opium War begins, Victorian Britain" } },
  { id: "imperialism", name: { zh: "帝国主义时代", en: "Age of Imperialism" }, year: 1900, month: 1, era: { zh: "帝国主义时代", en: "Age of Imperialism" }, description: { zh: "八国联军侵华，大英帝国日不落", en: "Eight-Nation Alliance in China, British Empire at zenith" } },
  { id: "world-war-era", name: { zh: "世界大战时代", en: "World War Era" }, year: 1939, month: 9, era: { zh: "第二次世界大战", en: "World War II" }, description: { zh: "二战爆发，纳粹德国侵略扩张", en: "WWII begins, Nazi Germany expanding" } },
  { id: "cold-war", name: { zh: "冷战时代", en: "Cold War Era" }, year: 1962, month: 10, era: { zh: "冷战高峰", en: "Cold War Peak" }, description: { zh: "古巴导弹危机，美苏对峙", en: "Cuban Missile Crisis, US-Soviet confrontation" } },
  { id: "modern-era", name: { zh: "现代世界", en: "Modern World" }, year: 2000, month: 1, era: { zh: "千禧之交", en: "Turn of the Millennium" }, description: { zh: "千年之交，互联网时代来临", en: "Turn of millennium, Internet age dawning" } },
];

const LLM_TIMEOUT_MS = 900_000;
const VALID_CATEGORIES = new Set([
  "war", "dynasty", "invention", "trade", "religion",
  "disaster", "natural_disaster", "exploration", "diplomacy", "migration", "other",
]);

function getTerritoryList(): string {
  const raw = fs.readFileSync(TERRITORY_PATH, "utf-8");
  const territories = JSON.parse(raw) as Record<string, Record<string, unknown>>;
  const lines: string[] = [];
  for (const [id, scales] of Object.entries(territories)) {
    const scaleKeys = Object.keys(scales).join(", ");
    lines.push(`- ${id}: [${scaleKeys}]`);
  }
  return lines.join("\n");
}

function buildPrompts(preset: EraPreset, territoryList: string) {
  const yearRange = `${preset.year} to ${preset.year + 29}`;
  const system = `You are a world history state generator for a civilization simulation.
Your task is to generate the complete world state for a specific historical period.

You must return a JSON object with two top-level keys:
1. "state" — the world state with era, summary, and regions
2. "events" — an array of 20-30 historical events spanning the next 30 years from the start date

## State Format
The "state" object must contain:
- "era": { "zh": "...", "en": "..." }
- "summary": { "zh": "...", "en": "..." }
- "regions": [ ... array of Region objects ... ]

Each Region must have ALL of these fields:
{
  "id": "territory_based_id",
  "name": { "zh": "...", "en": "..." },
  "territoryId": "from_territory_list",
  "territoryScale": "xs|sm|md|lg|xl",
  "civilization": {
    "name": { "zh": "...", "en": "..." },
    "type": "empire|kingdom|city_state|tribal|nomadic|trade_network|theocracy|republic",
    "ruler": { "zh": "...", "en": "..." },
    "rulerTitle": { "zh": "...", "en": "..." },
    "dynasty": { "zh": "...", "en": "..." },
    "capital": { "zh": "...", "en": "..." },
    "governmentForm": "absolute_monarchy|feudal_monarchy|constitutional_monarchy|theocratic_monarchy|oligarchy|aristocratic_republic|democracy|tribal_council|military_dictatorship|colonial_administration|communist_state|federal_republic|confederation|other",
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
    "level": 1-10,
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
    "revenueBreakdown": [{ "source": { "zh": "...", "en": "..." }, "amount": { "amount": 0, "unit": { "zh": "...", "en": "..." } }, "percentage": 0 }],
    "expenditureBreakdown": [{ "category": { "zh": "...", "en": "..." }, "amount": { "amount": 0, "unit": { "zh": "...", "en": "..." } }, "percentage": 0 }],
    "treasury": { "amount": 0, "unit": { "zh": "...", "en": "..." }, "goldKg": 0, "silverKg": 0 },
    "treasuryDescription": { "zh": "...", "en": "..." },
    "fiscalPolicy": { "zh": "...", "en": "..." }
  },
  "military": {
    "level": 1-10,
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
    "level": 1-10,
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

## Events Format
Each event in the "events" array:
{
  "timestamp": { "year": number, "month": number },
  "title": { "zh": "...", "en": "..." },
  "description": { "zh": "...", "en": "..." },
  "affectedRegions": ["region_id"],
  "category": "war|dynasty|invention|trade|religion|disaster|natural_disaster|exploration|diplomacy|migration|other"
}

## Rules
1. ALL text fields MUST be bilingual: { "zh": "...", "en": "..." }
2. Include 6-12 major civilizations that existed in this period
3. Use ONLY territoryIds from the available list
4. Be historically accurate with real names, titles, rulers, capitals
5. Each region's id should be based on its territoryId (e.g., "china_central" -> "tang_dynasty")
6. Military troops = 1-5% of population
7. finances must be internally consistent
8. Include 3-4 natural disasters in events
9. Events should span years ${yearRange}, covering all major regions
10. Return ONLY valid JSON, no markdown, no explanation

## Available Territory Templates
${territoryList}`;

  const yearLabel = preset.year < 0 ? `${Math.abs(preset.year)} BCE` : `${preset.year} CE`;
  const user = `Generate the complete world state for the year ${yearLabel}, the "${preset.name.en}" period.

Context: ${preset.description.en}

Create a historically accurate snapshot of all major civilizations that existed at this time, including their political systems, economies, militaries, cultures, and diplomatic relationships. Also generate 20-30 historical events for the next 30 years.

Return compact JSON: {"state":{...},"events":[...]}`;

  return { system, user };
}

function extractJSON(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();
  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1) return text.slice(braceStart, braceEnd + 1);
  return text;
}

function repairTruncatedJSON(json: string): string {
  let repaired = json.replace(/,\s*([}\]])/g, "$1");
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;
  for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += "]";
  for (let i = 0; i < openBraces - closeBraces; i++) repaired += "}";
  return repaired;
}

async function generateEraState(
  preset: EraPreset,
  apiKey: string,
  model: string,
  territoryList: string
) {
  const { system, user } = buildPrompts(preset, territoryList);
  const controller = new AbortController();
  let timeoutHandle = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  function resetTimeout() {
    clearTimeout(timeoutHandle);
    timeoutHandle = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  }

  let fullContent = "";
  let tokenCount = 0;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://human-history-simulator.local",
        "X-Title": "Human Civilization Simulator - Era Generator",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.7,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LLM API error ${response.status}: ${errText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      resetTimeout();
      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split("\n");
      sseBuffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") continue;
        try {
          const chunk = JSON.parse(payload);
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            tokenCount++;
            if (tokenCount % 500 === 0) process.stdout.write(`  ...${tokenCount} tokens\r`);
          }
        } catch { /* skip */ }
      }
    }

    console.log(`  Received ${tokenCount} tokens, ${fullContent.length} chars`);
  } catch (err) {
    clearTimeout(timeoutHandle);
    if (fullContent.length > 5000) {
      console.log(`  Stream interrupted after ${tokenCount} tokens (${fullContent.length} chars), attempting partial recovery...`);
    } else {
      throw new Error(`terminated after ${tokenCount} tokens: ${err instanceof Error ? err.message : String(err)}`);
    }
  } finally {
    clearTimeout(timeoutHandle);
  }

  return parseAndBuild(preset, fullContent);
}

function parseAndBuild(preset: EraPreset, fullContent: string) {
  const jsonStr = extractJSON(fullContent);
  let parsed: { state: { era?: object; summary?: object; regions: Record<string, unknown>[] }; events: Record<string, unknown>[] };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.log("  JSON parse failed, attempting repair...");
    parsed = JSON.parse(repairTruncatedJSON(jsonStr));
    console.log("  Repair successful");
  }

  if (!parsed.state?.regions) throw new Error("Invalid response: missing state.regions");

  const regionIds = new Set(parsed.state.regions.map((r) => r.id as string));
  const events = (parsed.events || []).map((evt) => {
    const ts = evt.timestamp as { year: number; month: number };
    const affected = ((evt.affectedRegions as string[]) || []).filter((r) => regionIds.has(r));
    if (affected.length === 0 && regionIds.size > 0) affected.push([...regionIds][0]);
    const category = VALID_CATEGORIES.has(evt.category as string) ? (evt.category as string) : "other";
    return {
      id: `evt-era-${uuidv4().slice(0, 8)}`,
      timestamp: { year: ts.year, month: ts.month || 6 },
      title: evt.title,
      description: evt.description,
      affectedRegions: affected,
      category,
      status: "pending",
    };
  });

  return {
    id: `state-y${preset.year}-m${preset.month}-initial`,
    timestamp: { year: preset.year, month: preset.month },
    era: parsed.state.era || preset.era,
    summary: parsed.state.summary,
    regions: parsed.state.regions,
    events,
  };
}

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^(\w+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
    }
  }
}

async function main() {
  loadEnv();
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) { console.error("Error: OPENROUTER_API_KEY not set."); process.exit(1); }
  const model = process.env.LLM_MODEL || "openai/gpt-5.4";
  const args = process.argv.slice(2);
  const forceFlag = args.includes("--force");
  const parallelFlag = args.includes("--parallel");
  const concurrencyArg = args.find((a) => a.startsWith("--concurrency="));
  const concurrency = concurrencyArg ? parseInt(concurrencyArg.split("=")[1], 10) : 5;
  const specificEras = args.filter((a) => !a.startsWith("--"));

  const erasToGenerate = specificEras.length > 0
    ? ERA_PRESETS.filter((e) => specificEras.includes(e.id))
    : ERA_PRESETS;

  if (specificEras.length > 0) {
    const unknown = specificEras.filter((id) => !ERA_PRESETS.find((e) => e.id === id));
    if (unknown.length > 0) {
      console.error(`Unknown era IDs: ${unknown.join(", ")}`);
      console.log("Available: " + ERA_PRESETS.map((e) => e.id).join(", "));
      process.exit(1);
    }
  }

  if (!fs.existsSync(SEED_DIR)) fs.mkdirSync(SEED_DIR, { recursive: true });
  const territoryList = getTerritoryList();

  const toGenerate: EraPreset[] = [];
  const skipped: string[] = [];

  for (const preset of erasToGenerate) {
    const outPath = path.join(SEED_DIR, `era-${preset.id}.json`);
    if (fs.existsSync(outPath) && !forceFlag) {
      skipped.push(preset.id);
    } else {
      toGenerate.push(preset);
    }
  }

  console.log(`\n=== Era State Generator ===`);
  console.log(`Model: ${model}`);
  console.log(`Mode: ${parallelFlag ? `parallel (concurrency=${concurrency})` : "sequential"}`);
  console.log(`To generate: ${toGenerate.length}`);
  console.log(`Skipped (already exist): ${skipped.length}${skipped.length > 0 ? " — " + skipped.join(", ") : ""}`);
  console.log(`Force regenerate: ${forceFlag}\n`);

  if (toGenerate.length === 0) {
    console.log("Nothing to generate. Use --force to regenerate existing files.");
    return;
  }

  const succeeded: string[] = [];
  const failed: string[] = [];

  async function processOne(preset: EraPreset): Promise<void> {
    const outPath = path.join(SEED_DIR, `era-${preset.id}.json`);
    const t0 = Date.now();
    console.log(`[START] ${preset.name.en} (${preset.id}) — year ${preset.year}`);
    try {
      const result = await generateEraState(preset, apiKey!, model, territoryList);
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`[DONE]  ${preset.name.en} — ${result.regions.length} regions, ${result.events.length} events (${elapsed}s)`);
      succeeded.push(preset.id);
    } catch (err) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.error(`[FAIL]  ${preset.name.en} — ${err instanceof Error ? err.message : String(err)} (${elapsed}s)`);
      failed.push(preset.id);
    }
  }

  if (parallelFlag) {
    const queue = [...toGenerate];
    const workers: Promise<void>[] = [];
    for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
      workers.push((async () => {
        while (queue.length > 0) {
          const preset = queue.shift()!;
          await processOne(preset);
        }
      })());
    }
    await Promise.all(workers);
  } else {
    for (const preset of toGenerate) {
      await processOne(preset);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Succeeded: ${succeeded.length} — ${succeeded.join(", ") || "none"}`);
  console.log(`  Skipped:   ${skipped.length} — ${skipped.join(", ") || "none"}`);
  console.log(`  Failed:    ${failed.length} — ${failed.join(", ") || "none"}`);
  if (failed.length > 0) {
    console.log(`\nTo retry failed eras:`);
    console.log(`  npx tsx scripts/generate-era-states.ts --parallel ${failed.join(" ")}`);
  }
}

main().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
