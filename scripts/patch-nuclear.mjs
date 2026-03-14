import fs from "fs";
import path from "path";

const SEED_DIR = path.resolve("src/data/seed");

// Nuclear-armed states by era, with matching region ID patterns
// Historical nuclear acquisition: US 1945, USSR 1949, UK 1952, France 1960, China 1964,
// Israel ~1966 (undeclared), India 1974, Pakistan 1998, North Korea 2006
const NUCLEAR_STATES = {
  "era-cold-war.json": {
    year: 1962,
    states: [
      "usa_1962",
      "ussr_1962",
      "uk_1962",
      "france_1962",
      // China tested in 1964, by 1962 was very close but not yet — include as they had active program
      // Israel undeclared but widely believed to have had by early 1960s
      "israel_1962",
    ],
  },
  "era-modern-era.json": {
    year: 2000,
    states: [
      "north_america_usa",
      "modern_russia",
      "modern_uk",
      "modern_france",
      "east_asia_china_prc",
      "south_asia_india",
      "south_asia_pakistan",
      "modern_israel",
      "modern_north_korea",
    ],
  },
  "era-ai-age.json": {
    year: 2023,
    states: [
      "north_america_usa",
      "ai_russia",
      "ai_uk",
      "ai_france",
      "east_asia_china_prc",
      "south_asia_india",
      "south_asia_pakistan",
      "ai_israel",
      "ai_north_korea",
    ],
  },
};

// Nuclear weapon items per era context
const NUKE_ITEMS = {
  "era-cold-war.json": {
    name: { zh: "核武器", en: "Nuclear Weapons" },
    category: "nuclear",
    description: {
      zh: "战略与战术核弹头，搭载于洲际弹道导弹、潜射导弹及战略轰炸机，构成核三位一体威慑体系",
      en: "Strategic and tactical nuclear warheads delivered by ICBMs, SLBMs, and strategic bombers, forming the nuclear triad deterrence system",
    },
  },
  "era-modern-era.json": {
    name: { zh: "核武器", en: "Nuclear Weapons" },
    category: "nuclear",
    description: {
      zh: "核弹头武器库，包含战略核弹头与战术核武器，经由陆基洲际导弹、潜射弹道导弹及空射巡航导弹投送",
      en: "Nuclear warhead arsenal including strategic and tactical weapons, delivered via land-based ICBMs, submarine-launched ballistic missiles, and air-launched cruise missiles",
    },
  },
  "era-ai-age.json": {
    name: { zh: "核武器", en: "Nuclear Weapons" },
    category: "nuclear",
    description: {
      zh: "核武器库涵盖战略核弹头与战术核武器，具备陆基洲际导弹、潜射弹道导弹、高超音速载具及空基投送能力",
      en: "Nuclear arsenal encompassing strategic warheads and tactical weapons with ICBM, SLBM, hypersonic vehicle, and air-based delivery capabilities",
    },
  },
};

let totalFixed = 0;

for (const [file, config] of Object.entries(NUCLEAR_STATES)) {
  const filePath = path.join(SEED_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠ ${file} not found, skipping`);
    continue;
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const nukeItem = NUKE_ITEMS[file];
  const nukeStateSet = new Set(config.states);
  let added = 0;
  let removed = 0;

  for (const region of data.regions) {
    if (!region.military) continue;
    const eq = region.military.equipment || [];
    const isNukeState = nukeStateSet.has(region.id);

    if (isNukeState) {
      // Remove any existing nuclear items
      const filtered = eq.filter((e) => e.category !== "nuclear");
      // Insert nuclear weapon as first item
      region.military.equipment = [nukeItem, ...filtered];
      added++;
    } else {
      // Remove nuclear weapons from non-nuclear states
      const before = eq.length;
      region.military.equipment = eq.filter((e) => e.category !== "nuclear");
      if (region.military.equipment.length < before) removed++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(
    `✓ ${file}: added nukes to ${added} states, removed from ${removed} non-nuclear states`,
  );
  totalFixed += added + removed;
}

// Also check world-war-era for US (post-1945)
const wwFile = path.join(SEED_DIR, "era-world-war-era.json");
if (fs.existsSync(wwFile)) {
  const data = JSON.parse(fs.readFileSync(wwFile, "utf-8"));
  // 1939 - no nuclear weapons exist yet, remove any false positives
  let removed = 0;
  for (const region of data.regions) {
    if (!region.military?.equipment) continue;
    const before = region.military.equipment.length;
    region.military.equipment = region.military.equipment.filter(
      (e) => e.category !== "nuclear",
    );
    if (region.military.equipment.length < before) removed++;
  }
  if (removed > 0) {
    fs.writeFileSync(wwFile, JSON.stringify(data, null, 2) + "\n", "utf-8");
    console.log(
      `✓ era-world-war-era.json: removed nukes from ${removed} regions (1939, no nukes yet)`,
    );
    totalFixed += removed;
  }
}

// Remove nukes from all pre-modern eras just in case
const preModernFiles = [
  "era-bronze-age.json",
  "era-iron-age.json",
  "era-axial-age.json",
  "era-hellenistic.json",
  "era-qin-rome.json",
  "era-han-rome-peak.json",
  "era-three-kingdoms.json",
  "era-fall-of-rome.json",
  "era-tang-golden-age.json",
  "era-crusades.json",
  "era-mongol-empire.json",
  "era-renaissance.json",
  "era-early-modern.json",
  "era-enlightenment.json",
  "era-industrial-revolution.json",
  "era-imperialism.json",
];
for (const file of preModernFiles) {
  const filePath = path.join(SEED_DIR, file);
  if (!fs.existsSync(filePath)) continue;
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  let removed = 0;
  for (const region of data.regions) {
    if (!region.military?.equipment) continue;
    const before = region.military.equipment.length;
    region.military.equipment = region.military.equipment.filter(
      (e) => e.category !== "nuclear",
    );
    if (region.military.equipment.length < before) removed++;
  }
  if (removed > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
    console.log(`✓ ${file}: removed ${removed} false nuclear entries`);
    totalFixed += removed;
  }
}

console.log(`\nTotal fixes: ${totalFixed}`);
