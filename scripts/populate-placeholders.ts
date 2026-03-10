#!/usr/bin/env npx tsx
import fs from "fs";
import path from "path";

interface RegionData {
  ruler: [string, string];
  rulerTitle: [string, string];
  capital?: [string, string];
  governmentForm: string;
  religion: [string, string];
  population: number;
  economyLevel: number;
  militaryLevel: number;
  totalTroops: number;
  technologyLevel: number;
  status: string;
}

const PLACEHOLDER_DIR = path.join(__dirname, "placeholder-data");
const SEED_DIR = path.join(process.cwd(), "src", "data", "seed");

function loadAllPlaceholderData(): Record<string, RegionData> {
  const merged: Record<string, RegionData> = {};
  for (const file of fs.readdirSync(PLACEHOLDER_DIR).filter((f) => f.endsWith(".json"))) {
    const data = JSON.parse(fs.readFileSync(path.join(PLACEHOLDER_DIR, file), "utf-8"));
    Object.assign(merged, data);
  }
  return merged;
}

function main() {
  const REGION_DATA = loadAllPlaceholderData();
  const totalKeys = Object.keys(REGION_DATA).length;
  console.log(`Loaded ${totalKeys} region entries from placeholder-data/`);

  let totalUpdated = 0;

  for (const file of fs.readdirSync(SEED_DIR).filter((f) => f.startsWith("era-") && f.endsWith(".json"))) {
    const filePath = path.join(SEED_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    let updated = 0;

    for (const region of data.regions) {
      const rd = REGION_DATA[region.id];
      if (!rd) continue;
      if (region.civilization?.ruler?.en !== "—" || region.demographics?.population > 0) continue;

      region.civilization.ruler = { zh: rd.ruler[0], en: rd.ruler[1] };
      region.civilization.rulerTitle = { zh: rd.rulerTitle[0], en: rd.rulerTitle[1] };
      if (rd.capital && (!region.civilization.capital || region.civilization.capital?.en === "—")) {
        region.civilization.capital = { zh: rd.capital[0], en: rd.capital[1] };
      }
      region.civilization.governmentForm = rd.governmentForm;
      region.culture.religion = { zh: rd.religion[0], en: rd.religion[1] };
      region.demographics.population = rd.population;
      region.economy.level = rd.economyLevel;
      region.military.level = rd.militaryLevel;
      region.military.totalTroops = rd.totalTroops;
      region.technology.level = rd.technologyLevel;
      region.status = rd.status;
      updated++;
    }

    if (updated > 0) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`  ${file}: updated ${updated} regions`);
      totalUpdated += updated;
    }
  }

  console.log(`\nDone. Total regions updated: ${totalUpdated}`);
}

main();
