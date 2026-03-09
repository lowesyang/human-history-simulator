import fs from "fs";
import path from "path";

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
const LLM_TIMEOUT_MS = 300_000;

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

// ─── LLM call ──────────────────────────────────────────────────────────────

function extractJSON(text: string): string {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) return m[1].trim();
  const b = text.indexOf("{");
  const a = text.indexOf("[");
  let s: number, e: number;
  if (b === -1 && a === -1) return text;
  if (b === -1) { s = a; e = text.lastIndexOf("]"); }
  else if (a === -1) { s = b; e = text.lastIndexOf("}"); }
  else if (a < b) { s = a; e = text.lastIndexOf("]"); }
  else { s = b; e = text.lastIndexOf("}"); }
  return s !== -1 && e >= s ? text.slice(s, e + 1) : text;
}

async function callLLM(
  apiKey: string,
  model: string,
  prompts: { system: string; user: string },
  label: string,
  maxRetries = 2
): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const ctrl = new AbortController();
    let th = setTimeout(() => ctrl.abort(), LLM_TIMEOUT_MS);
    const reset = () => { clearTimeout(th); th = setTimeout(() => ctrl.abort(), LLM_TIMEOUT_MS); };
    let content = "";
    let tokens = 0;
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://human-history-simulator.local",
          "X-Title": "Human Civilization Simulator",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: prompts.system },
            { role: "user", content: prompts.user },
          ],
          temperature: 0.7,
          stream: true,
        }),
        signal: ctrl.signal,
      });
      if (!resp.ok) throw new Error(`API ${resp.status}: ${await resp.text()}`);
      const reader = resp.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reset();
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const p = line.slice(6).trim();
          if (p === "[DONE]") continue;
          try {
            const d = JSON.parse(p).choices?.[0]?.delta?.content;
            if (d) { content += d; tokens++; }
          } catch { }
        }
      }
      clearTimeout(th);
      return content;
    } catch (err) {
      clearTimeout(th);
      if (attempt < maxRetries) {
        console.log(`    [${label}] attempt ${attempt + 1} failed (${tokens} tok), retry...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      throw new Error(`[${label}] failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new Error("unreachable");
}

// ─── Step 1: generate skeleton ─────────────────────────────────────────────

interface SkeletonRegion {
  id: string;
  name: { zh: string; en: string };
  territoryId: string;
  territoryScale: string;
  civilizationName: { zh: string; en: string };
  type: string;
  ruler: { zh: string; en: string };
  rulerTitle: { zh: string; en: string };
  dynasty: { zh: string; en: string };
  capital: { zh: string; en: string };
  governmentForm: string;
  population: number;
  status: string;
  description: { zh: string; en: string };
}

function buildSkeletonPrompt(preset: EraPreset, territoryList: string) {
  const yearLabel = preset.year < 0 ? `${Math.abs(preset.year)} BCE` : `${preset.year} CE`;
  const system = `You generate a SKELETON listing ALL civilizations, kingdoms, empires, and notable polities that existed in a given historical period.

Return a JSON object:
{
  "era": {"zh":"...","en":"..."},
  "summary": {"zh":"...","en":"..."},
  "regions": [
    {
      "id": "unique_id",
      "name": {"zh":"...","en":"..."},
      "territoryId": "from_territory_list",
      "territoryScale": "xs|sm|md|lg|xl",
      "civilizationName": {"zh":"...","en":"..."},
      "type": "empire|kingdom|city_state|tribal|nomadic|trade_network|theocracy|republic",
      "ruler": {"zh":"...","en":"..."},
      "rulerTitle": {"zh":"...","en":"..."},
      "dynasty": {"zh":"...","en":"..."},
      "capital": {"zh":"...","en":"..."},
      "governmentForm": "absolute_monarchy|feudal_monarchy|constitutional_monarchy|theocratic_monarchy|oligarchy|aristocratic_republic|democracy|tribal_council|military_dictatorship|colonial_administration|communist_state|federal_republic|confederation|other",
      "population": 1000000,
      "status": "thriving|stable|declining|conflict|collapsed",
      "description": {"zh":"one-line summary","en":"one-line summary"}
    }
  ]
}

Rules:
1. ALL text bilingual {"zh":"...","en":"..."}
2. Include ALL civilizations/polities that existed in this year, covering EVERY populated region on the map. For periods like the Warring States, list each state separately. For fragmented regions, list key kingdoms individually. AIM for 20-35 entries — do NOT limit yourself to just the "major" civilizations.
3. Coverage must include: East Asia, South/Southeast Asia, Central/West Asia, Europe, Africa, Americas (if applicable).
4. Use ONLY territoryIds from the list. One territoryId may be used by multiple polities at different scales.
5. Be historically accurate (rulers, capitals, dynasties)
6. Return ONLY valid JSON, no markdown

Available Territories:
${territoryList}`;

  const user = `Generate a COMPREHENSIVE civilization skeleton for year ${yearLabel}, "${preset.name.en}".
Context: ${preset.description.en}
Include every notable polity worldwide, not just the largest empires. Cover all regions of the map.`;

  return { system, user };
}

// ─── Step 2: generate detail for one region ─────────────────────────────────

function buildDetailPrompt(
  preset: EraPreset,
  skeleton: SkeletonRegion,
  allRegionNames: string[]
) {
  const yearLabel = preset.year < 0 ? `${Math.abs(preset.year)} BCE` : `${preset.year} CE`;
  const neighbors = allRegionNames.filter(n => n !== skeleton.name.en).join(", ");

  const system = `You generate DETAILED data for ONE civilization in year ${yearLabel}.
Given a skeleton, fill in all detail sections. Return ONLY a JSON object with these exact keys:

{
  "civilization": {
    "name":{"zh":"...","en":"..."}, "type":"...",
    "ruler":{"zh":"...","en":"..."}, "rulerTitle":{"zh":"...","en":"..."},
    "dynasty":{"zh":"...","en":"..."}, "capital":{"zh":"...","en":"..."},
    "governmentForm":{"zh":"...","en":"..."},
    "socialStructure":{"zh":"...","en":"..."}, "rulingClass":{"zh":"...","en":"..."}, "succession":{"zh":"...","en":"..."}
  },
  "government": {
    "structure":{"zh":"...","en":"..."},
    "departments":[{"name":{"zh":"...","en":"..."},"function":{"zh":"...","en":"..."},"headCount":100}],
    "totalOfficials":5000,
    "localAdmin":{"zh":"...","en":"..."}, "legalSystem":{"zh":"...","en":"..."}, "taxationSystem":{"zh":"...","en":"..."}
  },
  "culture": {
    "religion":{"zh":"...","en":"..."}, "philosophy":{"zh":"...","en":"..."},
    "writingSystem":{"zh":"...","en":"..."}, "culturalAchievements":{"zh":"...","en":"..."}, "languageFamily":{"zh":"...","en":"..."}
  },
  "economy": {
    "level":5,
    "gdpEstimate":{"amount":0,"unit":{"zh":"...","en":"..."},"goldKg":0,"silverKg":0},
    "gdpPerCapita":{"amount":0,"unit":{"zh":"...","en":"..."},"goldKg":0,"silverKg":0},
    "gdpDescription":{"zh":"...","en":"..."}, "mainIndustries":{"zh":"...","en":"..."}, "tradeGoods":{"zh":"...","en":"..."},
    "currency":{"name":{"zh":"...","en":"..."},"type":"commodity|metal_weight|coin|paper|fiat","unitName":{"zh":"...","en":"..."}},
    "householdWealth":{"zh":"...","en":"..."}, "averageIncome":{"amount":0,"unit":{"zh":"...","en":"..."},"silverKg":0},
    "foreignTradeVolume":{"amount":0,"unit":{"zh":"...","en":"..."},"goldKg":0,"silverKg":0},
    "economicSystem":{"zh":"...","en":"..."}
  },
  "finances": {
    "annualRevenue":{"amount":0,"unit":{"zh":"...","en":"..."},"goldKg":0,"silverKg":0},
    "annualExpenditure":{"amount":0,"unit":{"zh":"...","en":"..."},"goldKg":0,"silverKg":0},
    "surplus":{"amount":0,"unit":{"zh":"...","en":"..."},"goldKg":0,"silverKg":0},
    "revenueBreakdown":[{"source":{"zh":"...","en":"..."},"amount":{"amount":0,"unit":{"zh":"...","en":"..."}},"percentage":30}],
    "expenditureBreakdown":[{"category":{"zh":"...","en":"..."},"amount":{"amount":0,"unit":{"zh":"...","en":"..."}},"percentage":30}],
    "treasury":{"amount":0,"unit":{"zh":"...","en":"..."},"goldKg":0,"silverKg":0},
    "treasuryDescription":{"zh":"...","en":"..."}, "fiscalPolicy":{"zh":"...","en":"..."}
  },
  "military": {
    "level":5, "totalTroops":50000, "standingArmy":30000, "reserves":20000,
    "branches":[{"name":{"zh":"...","en":"..."},"count":10000,"description":{"zh":"...","en":"..."}}],
    "commandStructure":{"commanderInChief":{"zh":"...","en":"..."},"totalGenerals":10},
    "technology":{"zh":"...","en":"..."},
    "annualMilitarySpending":{"amount":0,"unit":{"zh":"...","en":"..."},"silverKg":0},
    "militarySpendingPctGdp":5, "threats":{"zh":"...","en":"..."}
  },
  "demographics": {
    "population":${skeleton.population}, "populationDescription":{"zh":"...","en":"..."},
    "urbanPopulation":100000, "urbanizationRate":10,
    "majorCities":[{"name":{"zh":"...","en":"..."},"population":50000}],
    "socialClasses":{"zh":"...","en":"..."}
  },
  "diplomacy": {
    "allies":{"zh":"...","en":"..."}, "enemies":{"zh":"...","en":"..."}, "foreignPolicy":{"zh":"...","en":"..."}
  },
  "technology": {
    "level":5, "era":{"zh":"...","en":"..."}, "keyInnovations":{"zh":"...","en":"..."}
  },
  "assessment": {
    "strengths":{"zh":"...","en":"..."}, "weaknesses":{"zh":"...","en":"..."}, "outlook":{"zh":"...","en":"..."}
  }
}

Rules:
1. ALL text bilingual {"zh":"...","en":"..."}
2. Military troops = 1-5% of population (${skeleton.population})
3. Be historically accurate
4. Return ONLY valid JSON, no markdown`;

  const user = `Generate full detail for: ${skeleton.civilizationName.en} (${skeleton.type})
Year: ${yearLabel}, Era: ${preset.name.en}
Ruler: ${skeleton.ruler.en} (${skeleton.rulerTitle.en}), Dynasty: ${skeleton.dynasty.en}
Capital: ${skeleton.capital.en}, Population: ${skeleton.population.toLocaleString()}
Status: ${skeleton.status}
Context: ${skeleton.description.en}
Neighboring civilizations: ${neighbors}`;

  return { system, user };
}

// ─── Generation pipeline ────────────────────────────────────────────────────

async function generateEra(
  preset: EraPreset,
  apiKey: string,
  model: string,
  territoryList: string,
  detailConcurrency: number
) {
  const t0 = Date.now();

  // Step 1: Skeleton
  console.log(`  [Step 1] Generating skeleton...`);
  const skeletonRaw = await callLLM(apiKey, model, buildSkeletonPrompt(preset, territoryList), `${preset.id}/skeleton`);
  const skeletonJson = extractJSON(skeletonRaw);
  const skeletonData = JSON.parse(skeletonJson) as {
    era: { zh: string; en: string };
    summary: { zh: string; en: string };
    regions: SkeletonRegion[];
  };

  if (!skeletonData.regions?.length) throw new Error("Empty skeleton");
  console.log(`  [Step 1] Got ${skeletonData.regions.length} civilizations (${((Date.now() - t0) / 1000).toFixed(0)}s)`);

  const allNames = skeletonData.regions.map(r => r.civilizationName?.en || r.name.en);

  // Step 2: Detail for each region (parallel with concurrency limit)
  console.log(`  [Step 2] Generating details (concurrency=${detailConcurrency})...`);
  const fullRegions: Record<string, unknown>[] = [];
  const queue = [...skeletonData.regions];
  let completed = 0;

  async function worker() {
    while (queue.length > 0) {
      const skel = queue.shift()!;
      const label = skel.name.en;
      try {
        const detailRaw = await callLLM(
          apiKey, model,
          buildDetailPrompt(preset, skel, allNames),
          `${preset.id}/${skel.id}`
        );
        const detailJson = extractJSON(detailRaw);
        const detail = JSON.parse(detailJson);

        fullRegions.push({
          id: skel.id,
          name: skel.name,
          territoryId: skel.territoryId,
          territoryScale: skel.territoryScale,
          ...detail,
          status: skel.status,
          description: skel.description,
        });

        completed++;
        console.log(`    ✓ ${label} (${completed}/${skeletonData.regions.length})`);
      } catch (err) {
        completed++;
        console.log(`    ✗ ${label} — ${err instanceof Error ? err.message.slice(0, 80) : "error"}`);
        // Create a minimal placeholder so the era isn't broken
        fullRegions.push(createMinimalRegion(skel));
      }
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(detailConcurrency, queue.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`  Done: ${fullRegions.length} regions in ${elapsed}s`);

  return {
    id: `state-y${preset.year}-m${preset.month}-initial`,
    timestamp: { year: preset.year, month: preset.month },
    era: skeletonData.era || preset.era,
    summary: skeletonData.summary,
    regions: fullRegions,
  };
}

function createMinimalRegion(skel: SkeletonRegion): Record<string, unknown> {
  return {
    id: skel.id,
    name: skel.name,
    territoryId: skel.territoryId,
    territoryScale: skel.territoryScale,
    civilization: {
      name: skel.civilizationName,
      type: skel.type,
      ruler: skel.ruler,
      rulerTitle: skel.rulerTitle,
      dynasty: skel.dynasty,
      capital: skel.capital,
      governmentForm: skel.governmentForm,
      socialStructure: { zh: "—", en: "—" },
      rulingClass: { zh: "—", en: "—" },
      succession: { zh: "—", en: "—" },
    },
    government: {
      structure: { zh: "—", en: "—" },
      departments: [],
      totalOfficials: 0,
      localAdmin: { zh: "—", en: "—" },
      legalSystem: { zh: "—", en: "—" },
      taxationSystem: { zh: "—", en: "—" },
    },
    culture: {
      religion: { zh: "—", en: "—" },
      culturalAchievements: { zh: "—", en: "—" },
      languageFamily: { zh: "—", en: "—" },
    },
    economy: {
      level: 3,
      gdpEstimate: { amount: 0, unit: { zh: "—", en: "—" } },
      gdpPerCapita: { amount: 0, unit: { zh: "—", en: "—" } },
      gdpDescription: { zh: "—", en: "—" },
      mainIndustries: { zh: "—", en: "—" },
      tradeGoods: { zh: "—", en: "—" },
      currency: { name: { zh: "—", en: "—" }, type: "commodity", unitName: { zh: "—", en: "—" } },
      householdWealth: { zh: "—", en: "—" },
      averageIncome: { amount: 0, unit: { zh: "—", en: "—" } },
      foreignTradeVolume: { amount: 0, unit: { zh: "—", en: "—" } },
      economicSystem: { zh: "—", en: "—" },
    },
    finances: {
      annualRevenue: { amount: 0, unit: { zh: "—", en: "—" } },
      annualExpenditure: { amount: 0, unit: { zh: "—", en: "—" } },
      surplus: { amount: 0, unit: { zh: "—", en: "—" } },
      revenueBreakdown: [],
      expenditureBreakdown: [],
      treasury: { amount: 0, unit: { zh: "—", en: "—" } },
      treasuryDescription: { zh: "—", en: "—" },
      fiscalPolicy: { zh: "—", en: "—" },
    },
    military: {
      level: 3,
      totalTroops: Math.round(skel.population * 0.02),
      standingArmy: Math.round(skel.population * 0.01),
      reserves: Math.round(skel.population * 0.01),
      branches: [],
      commandStructure: { totalGenerals: 0 },
      technology: { zh: "—", en: "—" },
      annualMilitarySpending: { amount: 0, unit: { zh: "—", en: "—" } },
      militarySpendingPctGdp: 0,
    },
    demographics: {
      population: skel.population,
      populationDescription: { zh: "—", en: "—" },
      urbanPopulation: Math.round(skel.population * 0.1),
      urbanizationRate: 10,
      majorCities: [],
      socialClasses: { zh: "—", en: "—" },
    },
    diplomacy: {
      allies: { zh: "—", en: "—" },
      enemies: { zh: "—", en: "—" },
      foreignPolicy: { zh: "—", en: "—" },
    },
    technology: {
      level: 3,
      era: { zh: "—", en: "—" },
      keyInnovations: { zh: "—", en: "—" },
    },
    assessment: {
      strengths: { zh: "—", en: "—" },
      weaknesses: { zh: "—", en: "—" },
      outlook: { zh: "—", en: "—" },
    },
    status: skel.status,
    description: skel.description,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTerritoryList(): string {
  const raw = fs.readFileSync(TERRITORY_PATH, "utf-8");
  const t = JSON.parse(raw) as Record<string, Record<string, unknown>>;
  return Object.entries(t).map(([id, scales]) => `- ${id}: [${Object.keys(scales).join(", ")}]`).join("\n");
}

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^(\w+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  loadEnv();
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) { console.error("OPENROUTER_API_KEY not set"); process.exit(1); }
  const model = process.env.LLM_MODEL || "openai/gpt-5.4";

  const args = process.argv.slice(2);
  const forceFlag = args.includes("--force");
  const concurrencyArg = args.find(a => a.startsWith("--concurrency="));
  const eraConcurrency = concurrencyArg ? parseInt(concurrencyArg.split("=")[1], 10) : 3;
  const detailConcArg = args.find(a => a.startsWith("--detail-concurrency="));
  const detailConcurrency = detailConcArg ? parseInt(detailConcArg.split("=")[1], 10) : 5;
  const specificEras = args.filter(a => !a.startsWith("--"));

  const erasToProcess = specificEras.length > 0
    ? ERA_PRESETS.filter(e => specificEras.includes(e.id))
    : ERA_PRESETS;

  if (!fs.existsSync(SEED_DIR)) fs.mkdirSync(SEED_DIR, { recursive: true });
  const territoryList = getTerritoryList();

  const toGen: EraPreset[] = [];
  const skipped: string[] = [];
  for (const p of erasToProcess) {
    if (fs.existsSync(path.join(SEED_DIR, `era-${p.id}.json`)) && !forceFlag) {
      skipped.push(p.id);
    } else {
      toGen.push(p);
    }
  }

  console.log(`\n=== Era State Generator (2-step: skeleton → detail) ===`);
  console.log(`Model: ${model}`);
  console.log(`Era concurrency: ${eraConcurrency}, Detail concurrency: ${detailConcurrency}`);
  console.log(`To generate: ${toGen.length}, Skipped: ${skipped.length}`);
  if (skipped.length) console.log(`  Existing: ${skipped.join(", ")}`);
  console.log(`Force: ${forceFlag}\n`);

  if (!toGen.length) { console.log("Nothing to generate."); return; }

  const succeeded: string[] = [];
  const failed: string[] = [];

  async function processEra(preset: EraPreset) {
    const outPath = path.join(SEED_DIR, `era-${preset.id}.json`);
    console.log(`\n[ERA] ${preset.name.en} (${preset.id}) — ${preset.year < 0 ? Math.abs(preset.year) + " BCE" : preset.year + " CE"}`);
    try {
      const result = await generateEra(preset, apiKey!, model, territoryList, detailConcurrency);
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
      console.log(`[ERA] ✓ ${preset.name.en} — ${result.regions.length} regions saved`);
      succeeded.push(preset.id);
    } catch (err) {
      console.error(`[ERA] ✗ ${preset.name.en} — ${err instanceof Error ? err.message : String(err)}`);
      failed.push(preset.id);
    }
  }

  const queue = [...toGen];
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(eraConcurrency, queue.length); i++) {
    workers.push((async () => {
      while (queue.length > 0) {
        await processEra(queue.shift()!);
      }
    })());
  }
  await Promise.all(workers);

  console.log(`\n=== Summary ===`);
  console.log(`  Succeeded: ${succeeded.length} — ${succeeded.join(", ") || "none"}`);
  console.log(`  Skipped:   ${skipped.length} — ${skipped.join(", ") || "none"}`);
  console.log(`  Failed:    ${failed.length} — ${failed.join(", ") || "none"}`);
  if (failed.length) {
    console.log(`\nRetry: npx tsx scripts/generate-era-states.ts ${failed.join(" ")}`);
  }
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
