#!/usr/bin/env npx tsx
/**
 * Batch-enrich sparse regions across all era seed files using the OpenRouter LLM API.
 *
 * Usage:
 *   npx tsx scripts/enrich-regions.ts                  # process ALL eras
 *   npx tsx scripts/enrich-regions.ts modern-era       # process one era
 *   npx tsx scripts/enrich-regions.ts cold-war world-war-era  # process specific eras
 */
import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const LLM_MODEL = process.env.LLM_MODEL || "openai/gpt-4.1";
const SEED_DIR = path.join(process.cwd(), "src", "data", "seed");
const MAX_PARALLEL = 3;
const BATCH_SIZE = 3;

interface L {
  zh: string;
  en: string;
}

const ERA_LABELS: Record<string, [string, number]> = {
  "bronze-age": ["Bronze Age", -1600],
  "iron-age": ["Iron Age", -800],
  "axial-age": ["Axial Age", -500],
  hellenistic: ["Hellenistic Period", -323],
  "qin-rome": ["Qin-Rome Era", -221],
  "han-rome-peak": ["Han-Rome Peak", 100],
  "three-kingdoms": ["Three Kingdoms", 220],
  "fall-of-rome": ["Fall of Rome", 476],
  "tang-golden-age": ["Tang Golden Age", 750],
  crusades: ["Crusades Era", 1200],
  "mongol-empire": ["Mongol Empire Era", 1280],
  renaissance: ["Renaissance", 1500],
  "early-modern": ["Early Modern", 1648],
  enlightenment: ["Enlightenment", 1750],
  "industrial-revolution": ["Industrial Revolution", 1840],
  imperialism: ["Age of Imperialism", 1900],
  "world-war-era": ["World War Era", 1939],
  "cold-war": ["Cold War", 1962],
  "modern-era": ["Modern Era", 2000],
};

function isSparse(r: any): boolean {
  const hasPop = (r.demographics?.population ?? 0) > 0;
  const hasRuler = (r.civilization?.ruler?.en ?? "—") !== "—";
  if (!hasPop || !hasRuler) return false;

  let dashCount = 0;
  for (const f of ["socialStructure", "rulingClass", "succession"]) {
    if ((r.civilization?.[f]?.en ?? "—") === "—") dashCount++;
  }
  if ((r.government?.structure?.en ?? "—") === "—") dashCount++;
  if ((r.government?.departments ?? []).length === 0) dashCount++;
  if ((r.economy?.gdpEstimate?.amount ?? 0) === 0) dashCount++;
  if ((r.military?.branches ?? []).length === 0) dashCount++;
  if ((r.demographics?.majorCities ?? []).length === 0) dashCount++;
  if ((r.diplomacy?.allies?.en ?? "—") === "—") dashCount++;
  return dashCount >= 7;
}

function buildPrompt(
  regions: any[],
  eraLabel: string,
  eraYear: number
): string {
  const regionList = regions
    .map((r) => {
      const id = r.id;
      const name = `${r.name.zh} / ${r.name.en}`;
      const ruler = `${r.civilization?.ruler?.zh ?? "?"} / ${r.civilization?.ruler?.en ?? "?"}`;
      const capital = r.civilization?.capital?.en ?? "?";
      const pop = r.demographics?.population ?? 0;
      const civType = r.civilization?.type ?? "?";
      const religion = r.culture?.religion?.en ?? "?";
      const ecoLvl = r.economy?.level ?? 1;
      const milLvl = r.military?.level ?? 1;
      const techLvl = r.technology?.level ?? 1;
      const troops = r.military?.totalTroops ?? 0;
      const status = r.status ?? "stable";
      return `  - id: ${id}, name: ${name}, ruler: ${ruler}, capital: ${capital}, pop: ${pop}, civType: ${civType}, religion: ${religion}, econ: ${ecoLvl}, mil: ${milLvl}, tech: ${techLvl}, troops: ${troops}, status: ${status}`;
    })
    .join("\n");

  return `You are a historical data specialist. For each civilization listed below (set in the ${eraLabel}, circa year ${eraYear}), generate detailed bilingual (Chinese/English) data filling ALL the fields specified in the schema.

REGIONS TO ENRICH:
${regionList}

OUTPUT: Return a JSON object mapping region id -> enrichment data. The enrichment object for each region MUST have this exact structure:

{
  "REGION_ID": {
    "civilization": {
      "dynasty": {"zh": "...", "en": "..."},
      "governmentForm": {"zh": "一句话描述", "en": "one sentence description"},
      "socialStructure": {"zh": "2-3句", "en": "2-3 sentences"},
      "rulingClass": {"zh": "1-2句", "en": "1-2 sentences"},
      "succession": {"zh": "1-2句", "en": "1-2 sentences"}
    },
    "government": {
      "structure": {"zh": "2-3句", "en": "2-3 sentences"},
      "departments": [
        {"name": {"zh":"","en":""}, "function": {"zh":"","en":""}, "headCount": NUMBER}
      ],
      "totalOfficials": NUMBER,
      "localAdmin": {"zh": "1-2句", "en": "1-2 sentences"},
      "legalSystem": {"zh": "1-2句", "en": "1-2 sentences"},
      "taxationSystem": {"zh": "1-2句", "en": "1-2 sentences"}
    },
    "culture": {
      "philosophy": {"zh":"", "en":""},
      "writingSystem": {"zh":"", "en":""},
      "culturalAchievements": {"zh":"1-2句", "en":"1-2 sentences"},
      "languageFamily": {"zh":"", "en":""}
    },
    "economy": {
      "gdpEstimate": {"amount": NUMBER, "unit": {"zh":"","en":""}},
      "gdpPerCapita": {"amount": NUMBER, "unit": {"zh":"","en":""}},
      "gdpDescription": {"zh":"1-2句", "en":"1-2 sentences"},
      "mainIndustries": {"zh":"", "en":""},
      "tradeGoods": {"zh":"", "en":""},
      "currency": {"name": {"zh":"","en":""}, "type": "commodity|fiat|mixed", "unitName": {"zh":"","en":""}},
      "householdWealth": {"zh":"", "en":""},
      "averageIncome": {"amount": NUMBER, "unit": {"zh":"","en":""}},
      "foreignTradeVolume": {"amount": NUMBER, "unit": {"zh":"","en":""}},
      "economicSystem": {"zh":"", "en":""}
    },
    "finances": {
      "annualRevenue": {"amount": NUMBER, "unit": {"zh":"","en":""}},
      "annualExpenditure": {"amount": NUMBER, "unit": {"zh":"","en":""}},
      "surplus": {"amount": NUMBER, "unit": {"zh":"","en":""}},
      "revenueBreakdown": [{"source":{"zh":"","en":""},"amount":{"amount":NUMBER,"unit":{"zh":"","en":""}},"percentage":NUMBER}],
      "expenditureBreakdown": [{"category":{"zh":"","en":""},"amount":{"amount":NUMBER,"unit":{"zh":"","en":""}},"percentage":NUMBER}],
      "treasury": {"amount": NUMBER, "unit": {"zh":"","en":""}},
      "treasuryDescription": {"zh":"", "en":""},
      "fiscalPolicy": {"zh":"", "en":""}
    },
    "military": {
      "standingArmy": NUMBER,
      "reserves": NUMBER,
      "branches": [{"name":{"zh":"","en":""},"count":NUMBER,"description":{"zh":"","en":""}}],
      "commandStructure": {"commanderInChief":{"zh":"","en":""},"totalGenerals":NUMBER},
      "technology": {"zh":"", "en":""},
      "annualMilitarySpending": {"amount": NUMBER, "unit": {"zh":"","en":""}},
      "militarySpendingPctGdp": NUMBER,
      "threats": {"zh":"", "en":""}
    },
    "demographics": {
      "populationDescription": {"zh":"1-2句", "en":"1-2 sentences"},
      "urbanPopulation": NUMBER,
      "urbanizationRate": NUMBER,
      "majorCities": [{"name":{"zh":"","en":""},"population":NUMBER}],
      "socialClasses": {"zh":"", "en":""}
    },
    "diplomacy": {
      "allies": {"zh":"", "en":""},
      "enemies": {"zh":"", "en":""},
      "foreignPolicy": {"zh":"", "en":""}
    },
    "technology_detail": {
      "era": {"zh":"", "en":""},
      "keyInnovations": {"zh":"", "en":""}
    },
    "assessment": {
      "strengths": {"zh":"", "en":""},
      "weaknesses": {"zh":"", "en":""},
      "outlook": {"zh":"", "en":""}
    },
    "description": {"zh":"一句话概述", "en":"one sentence overview"}
  }
}

RULES:
- All monetary amounts for pre-modern eras should be given in estimated silver/gold equivalent or period-appropriate units
- For tribal/nomadic societies, keep departments minimal (1-2), officials low, cities as "settlements" with small populations
- For colonial territories, reference the colonial power's administration
- GDP/finance numbers should be historically plausible estimates (use PPP equivalent where appropriate)
- revenueBreakdown should have 2-4 items that sum to ~100%
- expenditureBreakdown should have 2-4 items that sum to ~100%
- branches should have 1-3 military branches
- majorCities should have 2-5 cities
- departments should have 2-4 government departments
- All Chinese text must be historically accurate
- Return ONLY the JSON object, no markdown wrapping`;
}

async function callLLM(prompt: string, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: LLM_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 32000,
          }),
        }
      );

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`API ${resp.status}: ${text.slice(0, 200)}`);
      }

      const data = await resp.json();
      let content = data.choices?.[0]?.message?.content ?? "";

      content = content
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      try {
        return JSON.parse(content);
      } catch {
        // Try to repair truncated JSON by closing open structures
        let repaired = content;
        // Close any unclosed strings
        const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
        if (quoteCount % 2 !== 0) repaired += '"';
        // Count braces/brackets and close them
        let braces = 0, brackets = 0;
        for (const ch of repaired) {
          if (ch === "{") braces++;
          else if (ch === "}") braces--;
          else if (ch === "[") brackets++;
          else if (ch === "]") brackets--;
        }
        while (brackets > 0) { repaired += "]"; brackets--; }
        while (braces > 0) { repaired += "}"; braces--; }
        return JSON.parse(repaired);
      }
    } catch (err: any) {
      console.error(
        `  Attempt ${attempt}/${retries} failed: ${err.message?.slice(0, 120)}`
      );
      if (attempt < retries)
        await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  return null;
}

function deepMerge(target: any, source: any): void {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }
      const tVal = target[key];
      const sVal = source[key];

      if (isLObj(sVal) && sVal.zh && sVal.en) {
        if (isLObj(tVal) && (tVal.zh === "—" || tVal.en === "—")) {
          target[key] = sVal;
        } else if (
          !isLObj(tVal) ||
          (tVal.zh === "—" && tVal.en === "—")
        ) {
          target[key] = sVal;
        } else {
          deepMerge(tVal, sVal);
        }
      } else {
        deepMerge(tVal, sVal);
      }
    } else if (Array.isArray(source[key]) && source[key].length > 0) {
      if (!target[key] || (Array.isArray(target[key]) && target[key].length === 0)) {
        target[key] = source[key];
      }
    } else if (source[key] !== undefined && source[key] !== null) {
      const tCur = target[key];
      if (tCur === 0 || tCur === "—" || tCur === "" || tCur === null || tCur === undefined) {
        target[key] = source[key];
      }
    }
  }
}

function isLObj(o: any): o is L {
  return o && typeof o === "object" && "zh" in o && "en" in o;
}

function applyEnrichment(region: any, enrichment: any): void {
  if (enrichment.civilization) {
    deepMerge(region.civilization, enrichment.civilization);
  }
  if (enrichment.government) {
    deepMerge(region.government, enrichment.government);
  }
  if (enrichment.culture) {
    deepMerge(region.culture, enrichment.culture);
  }
  if (enrichment.economy) {
    deepMerge(region.economy, enrichment.economy);
  }
  if (enrichment.finances) {
    deepMerge(region.finances, enrichment.finances);
  }
  if (enrichment.military) {
    deepMerge(region.military, enrichment.military);
  }
  if (enrichment.demographics) {
    deepMerge(region.demographics, enrichment.demographics);
  }
  if (enrichment.diplomacy) {
    deepMerge(region.diplomacy, enrichment.diplomacy);
  }
  if (enrichment.technology_detail) {
    deepMerge(region.technology, enrichment.technology_detail);
  }
  if (enrichment.assessment) {
    deepMerge(region.assessment, enrichment.assessment);
  }
  if (enrichment.description) {
    if (
      isLObj(region.description) &&
      (region.description.zh === "—" || region.description.en === "—")
    ) {
      region.description = enrichment.description;
    }
  }
}

async function processEra(eraKey: string): Promise<number> {
  const [eraLabel, eraYear] = ERA_LABELS[eraKey];
  const filePath = path.join(SEED_DIR, `era-${eraKey}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const sparseRegions = data.regions.filter(isSparse);
  if (sparseRegions.length === 0) {
    console.log(`  ${eraKey}: no sparse regions, skipping`);
    return 0;
  }

  console.log(`  ${eraKey}: enriching ${sparseRegions.length} regions...`);

  const batches: any[][] = [];
  for (let i = 0; i < sparseRegions.length; i += BATCH_SIZE) {
    batches.push(sparseRegions.slice(i, i + BATCH_SIZE));
  }

  let enriched = 0;
  for (let bi = 0; bi < batches.length; bi += MAX_PARALLEL) {
    const chunk = batches.slice(bi, bi + MAX_PARALLEL);
    const results = await Promise.all(
      chunk.map(async (batch, ci) => {
        const batchIdx = bi + ci;
        const prompt = buildPrompt(batch, eraLabel, eraYear);
        console.log(
          `    batch ${batchIdx + 1}/${batches.length} (${batch.length} regions)...`
        );
        return callLLM(prompt);
      })
    );

    for (let ci = 0; ci < chunk.length; ci++) {
      const result = results[ci];
      if (!result) {
        console.error(
          `    batch ${bi + ci + 1} FAILED - regions skipped: ${chunk[ci].map((r: any) => r.id).join(", ")}`
        );
        continue;
      }

      for (const region of chunk[ci]) {
        const enrichmentData = result[region.id];
        if (enrichmentData) {
          const target = data.regions.find((r: any) => r.id === region.id);
          if (target) {
            applyEnrichment(target, enrichmentData);
            enriched++;
          }
        } else {
          console.warn(`    missing enrichment for ${region.id}`);
        }
      }
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`  ${eraKey}: ✓ enriched ${enriched}/${sparseRegions.length}`);
  return enriched;
}

async function main() {
  const args = process.argv.slice(2);
  const eras =
    args.length > 0
      ? args.filter((a) => a in ERA_LABELS)
      : Object.keys(ERA_LABELS);

  if (eras.length === 0) {
    console.error("No valid era keys provided.");
    process.exit(1);
  }

  console.log(`=== Enriching ${eras.length} era(s) ===\n`);
  let total = 0;

  for (const era of eras) {
    const count = await processEra(era);
    total += count;
    console.log();
  }

  console.log(`\n=== Done. Total enriched: ${total} regions ===`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
