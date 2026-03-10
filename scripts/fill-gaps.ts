#!/usr/bin/env npx tsx
/**
 * Fill map gaps by adding civilizations from aourednik/historical-basemaps
 * that are not yet in our seed files. Focuses on significant entities
 * that create visible coverage on the map.
 *
 * Usage:  npx tsx scripts/fill-gaps.ts
 */

import fs from "fs";
import path from "path";

type CivType =
  | "empire"
  | "kingdom"
  | "city_state"
  | "tribal"
  | "nomadic"
  | "trade_network"
  | "theocracy"
  | "republic";

interface RegionAddition {
  id: string;
  nameZh: string;
  nameEn: string;
  basemapName: string;
  civType: CivType;
  capitalZh?: string;
  capitalEn?: string;
  status?: string;
}

const L = (zh: string, en: string) => ({ zh, en });
const MV = () => ({ amount: 0, unit: L("—", "—") });

function buildRegion(a: RegionAddition) {
  return {
    id: a.id,
    name: L(a.nameZh, a.nameEn),
    territoryId: a.id,
    territoryScale: "md" as const,
    civilization: {
      name: L(a.nameZh, a.nameEn),
      type: a.civType,
      ruler: L("—", "—"),
      rulerTitle: L("—", "—"),
      dynasty: L("—", "—"),
      capital: a.capitalZh ? L(a.capitalZh, a.capitalEn || a.capitalZh) : L("—", "—"),
      governmentForm: "other" as const,
      socialStructure: L("—", "—"),
      rulingClass: L("—", "—"),
      succession: L("—", "—"),
    },
    government: {
      structure: L("—", "—"),
      departments: [],
      totalOfficials: 0,
      localAdmin: L("—", "—"),
      legalSystem: L("—", "—"),
      taxationSystem: L("—", "—"),
    },
    culture: {
      religion: L("—", "—"),
      culturalAchievements: L("—", "—"),
      languageFamily: L("—", "—"),
    },
    economy: {
      level: 1,
      gdpEstimate: MV(),
      gdpPerCapita: MV(),
      gdpDescription: L("—", "—"),
      mainIndustries: L("—", "—"),
      tradeGoods: L("—", "—"),
      currency: { name: L("—", "—"), type: "commodity" as const, unitName: L("—", "—") },
      householdWealth: L("—", "—"),
      averageIncome: MV(),
      foreignTradeVolume: MV(),
      economicSystem: L("—", "—"),
    },
    finances: {
      annualRevenue: MV(),
      annualExpenditure: MV(),
      surplus: MV(),
      revenueBreakdown: [],
      expenditureBreakdown: [],
      treasury: MV(),
      treasuryDescription: L("—", "—"),
      fiscalPolicy: L("—", "—"),
    },
    military: {
      level: 1,
      totalTroops: 0,
      standingArmy: 0,
      reserves: 0,
      branches: [],
      commandStructure: { totalGenerals: 0 },
      technology: L("—", "—"),
      annualMilitarySpending: MV(),
      militarySpendingPctGdp: 0,
    },
    demographics: {
      population: 0,
      populationDescription: L("—", "—"),
      urbanPopulation: 0,
      urbanizationRate: 0,
      majorCities: [],
    },
    diplomacy: {
      allies: L("—", "—"),
      enemies: L("—", "—"),
      foreignPolicy: L("—", "—"),
    },
    technology: {
      level: 1,
      era: L("—", "—"),
      keyInnovations: L("—", "—"),
    },
    assessment: {
      strengths: L("—", "—"),
      weaknesses: L("—", "—"),
      outlook: L("—", "—"),
    },
    status: (a.status || "stable") as "stable",
    description: L("—", "—"),
  };
}

const GAP_FILLS: Record<string, RegionAddition[]> = {

  // ==================== MODERN ERA (2000) ====================
  "modern-era": [
    { id: "modern_angola", nameZh: "安哥拉", nameEn: "Angola", basemapName: "Angola", civType: "republic" },
    { id: "modern_czech", nameZh: "捷克", nameEn: "Czech Republic", basemapName: "Czech Republic", civType: "republic" },
    { id: "modern_slovakia", nameZh: "斯洛伐克", nameEn: "Slovakia", basemapName: "Slovakia", civType: "republic" },
    { id: "modern_slovenia", nameZh: "斯洛文尼亚", nameEn: "Slovenia", basemapName: "Slovenia", civType: "republic" },
    { id: "modern_cyprus", nameZh: "塞浦路斯", nameEn: "Cyprus", basemapName: "Cyprus", civType: "republic" },
    { id: "modern_mauritania", nameZh: "毛里塔尼亚", nameEn: "Mauritania", basemapName: "Mauritania", civType: "republic" },
    { id: "modern_guyana", nameZh: "圭亚那", nameEn: "Guyana", basemapName: "Guyana", civType: "republic" },
    { id: "modern_suriname", nameZh: "苏里南", nameEn: "Suriname", basemapName: "Suriname", civType: "republic" },
    { id: "modern_french_guiana", nameZh: "法属圭亚那", nameEn: "French Guiana", basemapName: "French Guiana", civType: "republic" },
    { id: "modern_guinea_bissau", nameZh: "几内亚比绍", nameEn: "Guinea-Bissau", basemapName: "Guinea-Bissau", civType: "republic" },
    { id: "modern_western_sahara", nameZh: "西撒哈拉", nameEn: "Western Sahara", basemapName: "Western Sahara", civType: "tribal" },
    { id: "modern_trinidad", nameZh: "特立尼达和多巴哥", nameEn: "Trinidad and Tobago", basemapName: "Trinidad", civType: "republic" },
    { id: "modern_bahamas", nameZh: "巴哈马", nameEn: "Bahamas", basemapName: "Bahamas", civType: "republic" },
    { id: "modern_samoa", nameZh: "萨摩亚", nameEn: "Samoa", basemapName: "Samoa", civType: "republic" },
    { id: "modern_tonga", nameZh: "汤加", nameEn: "Tonga", basemapName: "Tonga", civType: "kingdom" },
    { id: "modern_eq_guinea", nameZh: "赤道几内亚", nameEn: "Equatorial Guinea", basemapName: "Equatorial Guinea", civType: "republic" },
    { id: "modern_hong_kong", nameZh: "香港", nameEn: "Hong Kong", basemapName: "Hong Kong", civType: "republic" },
    { id: "modern_puerto_rico", nameZh: "波多黎各", nameEn: "Puerto Rico", basemapName: "Puerto Rico", civType: "republic" },
    { id: "modern_macedonia", nameZh: "北马其顿", nameEn: "North Macedonia", basemapName: "Macedonia", civType: "republic" },
    { id: "modern_malta", nameZh: "马耳他", nameEn: "Malta", basemapName: "Malta", civType: "republic" },
  ],

  // ==================== COLD WAR (1962) ====================
  "cold-war": [
    { id: "angola_1962", nameZh: "安哥拉（葡属）", nameEn: "Angola (Portuguese)", basemapName: "Angola", civType: "kingdom" },
    { id: "zaire_1962", nameZh: "刚果（扎伊尔）", nameEn: "Zaire (Congo)", basemapName: "Zaire", civType: "republic" },
    { id: "mauritania_1962", nameZh: "毛里塔尼亚", nameEn: "Mauritania", basemapName: "Mauritania", civType: "republic" },
    { id: "guinea_bissau_1962", nameZh: "几内亚比绍（葡属）", nameEn: "Guinea-Bissau (Portuguese)", basemapName: "Guinea-Bissau", civType: "kingdom" },
    { id: "guyana_1962", nameZh: "圭亚那（英属）", nameEn: "Guyana (British)", basemapName: "Guyana", civType: "kingdom" },
    { id: "suriname_1962", nameZh: "苏里南（荷属）", nameEn: "Suriname (Dutch)", basemapName: "Suriname", civType: "kingdom" },
    { id: "french_guiana_1962", nameZh: "法属圭亚那", nameEn: "French Guiana", basemapName: "French Guiana", civType: "kingdom" },
    { id: "cyprus_1962", nameZh: "塞浦路斯", nameEn: "Cyprus", basemapName: "Cyprus", civType: "republic" },
    { id: "western_sahara_1962", nameZh: "西撒哈拉（西属）", nameEn: "Western Sahara (Spanish)", basemapName: "Western Sahara", civType: "kingdom" },
    { id: "trinidad_1962", nameZh: "特立尼达和多巴哥", nameEn: "Trinidad and Tobago", basemapName: "Trinidad", civType: "republic" },
    { id: "bahamas_1962", nameZh: "巴哈马", nameEn: "Bahamas", basemapName: "Bahamas", civType: "kingdom" },
    { id: "hong_kong_1962", nameZh: "香港（英属）", nameEn: "Hong Kong (British)", basemapName: "Hong Kong", civType: "kingdom" },
    { id: "puerto_rico_1962", nameZh: "波多黎各", nameEn: "Puerto Rico", basemapName: "Puerto Rico", civType: "republic" },
    { id: "tonga_1962", nameZh: "汤加", nameEn: "Tonga", basemapName: "Tonga", civType: "kingdom" },
    { id: "samoa_1962", nameZh: "萨摩亚", nameEn: "Samoa", basemapName: "Samoa", civType: "kingdom" },
    { id: "eq_guinea_1962", nameZh: "赤道几内亚（西属）", nameEn: "Equatorial Guinea (Spanish)", basemapName: "Equatorial Guinea", civType: "kingdom" },
  ],

  // ==================== WORLD WAR ERA (1939) ====================
  "world-war-era": [
    { id: "belgian_congo_1939", nameZh: "比属刚果", nameEn: "Belgian Congo", basemapName: "Belgian Congo", civType: "kingdom" },
    { id: "angola_portugal_1939", nameZh: "安哥拉（葡属）", nameEn: "Angola (Portugal)", basemapName: "Angola (Portugal)", civType: "kingdom" },
    { id: "french_west_africa_1939", nameZh: "法属西非", nameEn: "French West Africa", basemapName: "French West Africa", civType: "kingdom" },
    { id: "french_eq_africa_1939", nameZh: "法属赤道非洲", nameEn: "French Equatorial Africa", basemapName: "French Equatorial Africa", civType: "kingdom" },
    { id: "gold_coast_1939", nameZh: "黄金海岸（英属）", nameEn: "Gold Coast (British)", basemapName: "Gold Coast", civType: "kingdom" },
    { id: "british_somaliland_1939", nameZh: "英属索马里兰", nameEn: "British Somaliland", basemapName: "British Somaliland", civType: "kingdom" },
    { id: "eritrea_italy_1939", nameZh: "厄立特里亚（意属）", nameEn: "Eritrea (Italy)", basemapName: "Eritrea (Italy)", civType: "kingdom" },
    { id: "italian_somaliland_1939", nameZh: "意属索马里兰", nameEn: "Italian Somaliland", basemapName: "Italian Somaliland", civType: "kingdom" },
    { id: "madagascar_france_1939", nameZh: "马达加斯加（法属）", nameEn: "Madagascar (France)", basemapName: "Madagascar (France)", civType: "kingdom" },
    { id: "mozambique_portugal_1939", nameZh: "莫桑比克（葡属）", nameEn: "Mozambique (Portugal)", basemapName: "Mozambique (Portugal)", civType: "kingdom" },
    { id: "french_guiana_1939", nameZh: "法属圭亚那", nameEn: "French Guiana", basemapName: "French Guiana", civType: "kingdom" },
    { id: "guyana_1939", nameZh: "圭亚那（英属）", nameEn: "Guyana (British)", basemapName: "Guyana", civType: "kingdom" },
    { id: "suriname_1939", nameZh: "苏里南（荷属）", nameEn: "Suriname", basemapName: "Suriname", civType: "kingdom" },
    { id: "hong_kong_1939", nameZh: "香港（英属）", nameEn: "Hong Kong (British)", basemapName: "Hong Kong", civType: "kingdom" },
    { id: "xinjiang_1939", nameZh: "新疆", nameEn: "Xinjiang", basemapName: "Xinjiang", civType: "republic" },
    { id: "north_rhodesia_1939", nameZh: "北罗德西亚", nameEn: "Northern Rhodesia", basemapName: "Northern Rhodesia", civType: "kingdom" },
    { id: "south_rhodesia_1939", nameZh: "南罗德西亚", nameEn: "Southern Rhodesia", basemapName: "Southern Rhodesia", civType: "kingdom" },
    { id: "french_cameroon_1939", nameZh: "法属喀麦隆", nameEn: "French Cameroons", basemapName: "French Cameroons", civType: "kingdom" },
    { id: "congo_france_1939", nameZh: "法属刚果", nameEn: "Congo (France)", basemapName: "Congo (France)", civType: "kingdom" },
    { id: "guinea_bissau_1939", nameZh: "几内亚比绍（葡属）", nameEn: "Guinea-Bissau", basemapName: "Guinea-Bissau", civType: "kingdom" },
    { id: "eq_guinea_1939", nameZh: "赤道几内亚（西属）", nameEn: "Equatorial Guinea", basemapName: "Equatorial Guinea", civType: "kingdom" },
    { id: "dominion_newfoundland_1939", nameZh: "纽芬兰自治领", nameEn: "Dominion of Newfoundland", basemapName: "Dominion of Newfoundland", civType: "kingdom" },
    { id: "puerto_rico_1939", nameZh: "波多黎各", nameEn: "Puerto Rico", basemapName: "Puerto Rico", civType: "republic" },
    { id: "trinidad_1939", nameZh: "特立尼达", nameEn: "Trinidad", basemapName: "Trinidad", civType: "kingdom" },
    { id: "bahamas_1939", nameZh: "巴哈马", nameEn: "Bahamas", basemapName: "Bahamas", civType: "kingdom" },
    { id: "tonga_1939", nameZh: "汤加", nameEn: "Tonga", basemapName: "Tonga", civType: "kingdom" },
    { id: "samoa_1939", nameZh: "萨摩亚", nameEn: "Samoa", basemapName: "Samoa", civType: "kingdom" },
    { id: "french_somaliland_1939", nameZh: "法属索马里兰", nameEn: "French Somaliland", basemapName: "French Somaliland", civType: "kingdom" },
    { id: "spanish_sahara_1939", nameZh: "西属撒哈拉", nameEn: "Spanish Sahara", basemapName: "Spanish Sahara", civType: "kingdom" },
  ],

  // ==================== IMPERIALISM (1900) ====================
  "imperialism": [
    { id: "angola_1900", nameZh: "安哥拉（葡属）", nameEn: "Angola (Portuguese)", basemapName: "Angola", civType: "kingdom" },
    { id: "portuguese_ea_1900", nameZh: "葡属东非", nameEn: "Portuguese East Africa", basemapName: "Portuguese East Africa", civType: "kingdom" },
    { id: "portuguese_guinea_1900", nameZh: "葡属几内亚", nameEn: "Portuguese Guinea", basemapName: "Portuguese Guinea", civType: "kingdom" },
    { id: "dutch_guiana_1900", nameZh: "荷属圭亚那", nameEn: "Dutch Guiana", basemapName: "Dutch Guiana", civType: "kingdom" },
    { id: "british_guiana_1900", nameZh: "英属圭亚那", nameEn: "British Guiana", basemapName: "British Guiana", civType: "kingdom" },
    { id: "french_guiana_1900", nameZh: "法属圭亚那", nameEn: "French Guiana", basemapName: "French Guiana", civType: "kingdom" },
    { id: "gambia_1900", nameZh: "冈比亚", nameEn: "Gambia", basemapName: "Gambia", civType: "kingdom" },
    { id: "bosnia_1900", nameZh: "波斯尼亚-黑塞哥维那", nameEn: "Bosnia-Herzegovina", basemapName: "Bosnia-Herzegovina", civType: "kingdom" },
    { id: "hong_kong_1900", nameZh: "香港（英属）", nameEn: "Hong Kong (British)", basemapName: "Hong Kong", civType: "kingdom" },
    { id: "orange_free_state_1900", nameZh: "奥兰治自由邦", nameEn: "Orange Free State", basemapName: "Orange Free State", civType: "republic" },
    { id: "transvaal_1900", nameZh: "德兰士瓦", nameEn: "Transvaal Republic", basemapName: "Transvaal", civType: "republic" },
    { id: "natal_1900", nameZh: "纳塔尔", nameEn: "Natal", basemapName: "Natal", civType: "kingdom" },
    { id: "basutoland_1900", nameZh: "巴苏陀兰", nameEn: "Basutoland", basemapName: "Basutoland", civType: "kingdom" },
    { id: "malta_1900", nameZh: "马耳他", nameEn: "Malta", basemapName: "Malta", civType: "kingdom" },
    { id: "spanish_guinea_1900", nameZh: "西属几内亚", nameEn: "Spanish Guinea", basemapName: "Spanish Guinea", civType: "kingdom" },
    { id: "tonga_1900", nameZh: "汤加", nameEn: "Tonga", basemapName: "Tonga", civType: "kingdom" },
    { id: "samoa_1900", nameZh: "萨摩亚", nameEn: "Samoa", basemapName: "Samoa", civType: "kingdom" },
    { id: "trucial_oman_1900", nameZh: "特鲁西尔阿曼", nameEn: "Trucial Oman", basemapName: "Trucial Oman", civType: "kingdom" },
    { id: "tukular_1900", nameZh: "图库洛尔哈里发国", nameEn: "Tukular Caliphate", basemapName: "Tukular Caliphate", civType: "theocracy" },
    { id: "samori_1900", nameZh: "萨摩里帝国", nameEn: "Samori Empire", basemapName: "Second Samori Empire", civType: "empire" },
  ],

  // ==================== INDUSTRIAL REVOLUTION (1840) ====================
  "industrial-revolution": [
    { id: "angola_1840", nameZh: "安哥拉（葡属）", nameEn: "Angola (Portuguese)", basemapName: "Angola", civType: "kingdom" },
    { id: "portuguese_ea_1840", nameZh: "葡属东非", nameEn: "Portuguese East Africa", basemapName: "Portuguese East Africa", civType: "kingdom" },
    { id: "portuguese_guinea_1840", nameZh: "葡属几内亚", nameEn: "Portuguese Guinea", basemapName: "Portuguese Guinea", civType: "kingdom" },
    { id: "hong_kong_1840", nameZh: "香港", nameEn: "Hong Kong", basemapName: "Hong Kong", civType: "kingdom" },
    { id: "bavaria_1840", nameZh: "巴伐利亚", nameEn: "Bavaria", basemapName: "Bavaria", civType: "kingdom" },
    { id: "saxony_1840", nameZh: "萨克森", nameEn: "Saxony", basemapName: "Saxony", civType: "kingdom" },
    { id: "hanover_1840", nameZh: "汉诺威", nameEn: "Hanover", basemapName: "Hanover", civType: "kingdom" },
    { id: "wuerttemberg_1840", nameZh: "符腾堡", nameEn: "Württemberg", basemapName: "Württemberg", civType: "kingdom" },
    { id: "baden_1840", nameZh: "巴登", nameEn: "Baden", basemapName: "Baden", civType: "kingdom" },
    { id: "hawaii_1840", nameZh: "夏威夷王国", nameEn: "Kingdom of Hawaii", basemapName: "Kongldom of Hawaii", civType: "kingdom" },
    { id: "sikkim_1840", nameZh: "锡金", nameEn: "Sikkim", basemapName: "Sikkim (Indian princely state)", civType: "kingdom" },
    { id: "tripolitania_1840", nameZh: "的黎波里塔尼亚", nameEn: "Tripolitania", basemapName: "Tripolitania", civType: "kingdom" },
    { id: "cyrenaica_1840", nameZh: "昔兰尼加", nameEn: "Cyrenaica", basemapName: "Cyrenaica", civType: "kingdom" },
    { id: "trinidad_1840", nameZh: "特立尼达（英属）", nameEn: "Trinidad (British)", basemapName: "Trinidad", civType: "kingdom" },
    { id: "san_marino_1840", nameZh: "圣马力诺", nameEn: "San Marino", basemapName: "San Marino", civType: "republic" },
    { id: "guiana_1840", nameZh: "圭亚那（英属）", nameEn: "British Guiana", basemapName: "Guiana", civType: "kingdom" },
  ],

  // ==================== ENLIGHTENMENT (1750) ====================
  "enlightenment": [
    { id: "austrian_netherlands_1750", nameZh: "奥属尼德兰", nameEn: "Austrian Netherlands", basemapName: "Austrian Netherlands", civType: "kingdom" },
    { id: "swiss_confederation_1750", nameZh: "瑞士邦联", nameEn: "Swiss Confederation", basemapName: "Swiss Confederation", civType: "republic" },
    { id: "carnatic_1750", nameZh: "卡纳提克", nameEn: "Carnatic", basemapName: "Carnatic", civType: "kingdom" },
    { id: "cochin_1750", nameZh: "柯钦", nameEn: "Cochin", basemapName: "Cochin", civType: "kingdom" },
    { id: "british_guiana_1750", nameZh: "英属圭亚那", nameEn: "British Guiana", basemapName: "British Guiana", civType: "kingdom" },
    { id: "portuguese_ea_1750", nameZh: "葡属东非", nameEn: "Portuguese East Africa", basemapName: "Portuguese East Africa", civType: "kingdom" },
    { id: "portuguese_guinea_1750", nameZh: "葡属几内亚", nameEn: "Portuguese Guinea", basemapName: "Portuguese Guinea", civType: "kingdom" },
    { id: "cyrenaica_1750", nameZh: "昔兰尼加", nameEn: "Cyrenaica", basemapName: "Cyrenaica", civType: "kingdom" },
    { id: "oromo_1750", nameZh: "奥罗莫", nameEn: "Oromo", basemapName: "Oromo", civType: "tribal" },
    { id: "hong_kong_1750", nameZh: "香港", nameEn: "Hong Kong", basemapName: "Hong Kong", civType: "kingdom" },
    { id: "kingdom_ireland_1750", nameZh: "爱尔兰王国", nameEn: "Kingdom of Ireland", basemapName: "Kingdom of Ireland", civType: "kingdom" },
    { id: "bavaria_1750", nameZh: "巴伐利亚", nameEn: "Bavaria", basemapName: "Bavaria", civType: "kingdom" },
    { id: "saxony_1750", nameZh: "萨克森", nameEn: "Saxony", basemapName: "Saxony", civType: "kingdom" },
    { id: "hanover_1750", nameZh: "汉诺威", nameEn: "Hanover", basemapName: "Hanover", civType: "kingdom" },
  ],

  // ==================== EARLY MODERN (1648) ====================
  "early-modern": [
    { id: "swiss_confederation_1648", nameZh: "瑞士邦联", nameEn: "Swiss Confederation", basemapName: "Swiss Confederation", civType: "republic" },
    { id: "portuguese_ea_1648", nameZh: "葡属东非", nameEn: "Portuguese East Africa", basemapName: "Portuguese East Africa", civType: "kingdom" },
    { id: "portuguese_guinea_1648", nameZh: "葡属几内亚", nameEn: "Portuguese Guinea", basemapName: "Portuguese Guinea", civType: "kingdom" },
    { id: "hong_kong_1648", nameZh: "香港", nameEn: "Hong Kong", basemapName: "Hong Kong", civType: "kingdom" },
    { id: "kandy_1648", nameZh: "康提王国", nameEn: "Kingdom of Kandy", basemapName: "Kandy", civType: "kingdom" },
    { id: "shan_states_1648", nameZh: "掸邦", nameEn: "Shan States", basemapName: "Shan states", civType: "kingdom" },
    { id: "oromo_1648", nameZh: "奥罗莫", nameEn: "Oromo", basemapName: "Oromo", civType: "tribal" },
    { id: "rozwi_1648", nameZh: "罗兹维帝国", nameEn: "Rozwi Empire", basemapName: "Rozwi", civType: "empire" },
    { id: "bavaria_1648", nameZh: "巴伐利亚", nameEn: "Bavaria", basemapName: "Bavaria", civType: "kingdom" },
    { id: "saxony_1648", nameZh: "萨克森", nameEn: "Saxony", basemapName: "Saxony", civType: "kingdom" },
    { id: "genoa_1648", nameZh: "热那亚共和国", nameEn: "Republic of Genoa", basemapName: "Genoa", civType: "republic" },
    { id: "sardinia_1648", nameZh: "萨丁尼亚", nameEn: "Sardinia", basemapName: "Sardinia", civType: "kingdom" },
  ],

  // ==================== RENAISSANCE (1500) ====================
  "renaissance": [
    { id: "swiss_confederation_1500", nameZh: "瑞士邦联", nameEn: "Swiss Confederation", basemapName: "Swiss Confederation", civType: "republic" },
    { id: "kalmar_union_1500", nameZh: "卡尔马联盟", nameEn: "Kalmar Union", basemapName: "Kalmar Union", civType: "kingdom" },
    { id: "teutonic_knights_1500", nameZh: "条顿骑士团", nameEn: "Teutonic Knights", basemapName: "Teutonic Knights", civType: "theocracy" },
    { id: "navarre_1500", nameZh: "纳瓦拉王国", nameEn: "Kingdom of Navarre", basemapName: "Navarre", civType: "kingdom" },
    { id: "golden_horde_1500", nameZh: "金帐汗国", nameEn: "Golden Horde", basemapName: "Golden Horde", civType: "nomadic" },
    { id: "cyprus_1500", nameZh: "塞浦路斯", nameEn: "Cyprus", basemapName: "Cyprus", civType: "kingdom" },
    { id: "pegu_1500", nameZh: "勃固王国", nameEn: "Kingdom of Pegu", basemapName: "Pegu", civType: "kingdom" },
    { id: "sinhalese_1500", nameZh: "僧伽罗诸王国", nameEn: "Sinhalese Kingdoms", basemapName: "Sinhalese kingdoms", civType: "kingdom" },
    { id: "algonquin_1500", nameZh: "阿尔冈昆人", nameEn: "Algonquin", basemapName: "Algonquin", civType: "tribal" },
    { id: "cherokee_1500", nameZh: "切罗基人", nameEn: "Cherokee", basemapName: "Cherookee", civType: "tribal" },
    { id: "navajo_1500", nameZh: "纳瓦霍人", nameEn: "Navajo", basemapName: "Navajo", civType: "tribal" },
    { id: "apache_1500", nameZh: "阿帕奇人", nameEn: "Apache", basemapName: "Apache", civType: "nomadic" },
    { id: "athabaskan_1500", nameZh: "阿萨巴斯坎人", nameEn: "Athabaskan", basemapName: "Athabaskan", civType: "tribal" },
    { id: "innu_1500", nameZh: "因纽人", nameEn: "Innu", basemapName: "Innu", civType: "tribal" },
    { id: "huron_1500", nameZh: "休伦人", nameEn: "Huron", basemapName: "Huron", civType: "tribal" },
    { id: "khanate_sibir_1500", nameZh: "西伯利亚汗国", nameEn: "Khanate of Sibir", basemapName: "Khanate of Sibir", civType: "nomadic" },
    { id: "sami_1500", nameZh: "萨米人", nameEn: "Sámi", basemapName: "Sámi", civType: "nomadic" },
    { id: "zayyanid_1500", nameZh: "扎亚尼德王朝", nameEn: "Zayyanid Caliphate", basemapName: "Zayyanid Caliphate", civType: "theocracy" },
    { id: "mwenemutapa_1500", nameZh: "穆塔帕帝国", nameEn: "Mwenemutapa", basemapName: "Mwenemutapa", civType: "empire" },
    { id: "brittany_1500", nameZh: "布列塔尼", nameEn: "Brittany", basemapName: "Britany", civType: "kingdom" },
  ],

  // ==================== MONGOL EMPIRE (1280) ====================
  "mongol-empire": [
    { id: "teutonic_knights_1280", nameZh: "条顿骑士团", nameEn: "Teutonic Knights", basemapName: "Teutonic Knights", civType: "theocracy" },
    { id: "navarre_1280", nameZh: "纳瓦拉王国", nameEn: "Kingdom of Navarre", basemapName: "Navarre", civType: "kingdom" },
    { id: "cyprus_1280", nameZh: "塞浦路斯", nameEn: "Cyprus", basemapName: "Cyprus", civType: "kingdom" },
    { id: "brittany_1280", nameZh: "布列塔尼", nameEn: "Brittany", basemapName: "Britany", civType: "kingdom" },
    { id: "trebizond_1280", nameZh: "特拉比松帝国", nameEn: "Empire of Trebizond", basemapName: "Trebizond", civType: "empire" },
    { id: "sardinia_1280", nameZh: "萨丁尼亚", nameEn: "Sardinia", basemapName: "Sardinia", civType: "kingdom" },
    { id: "corsica_1280", nameZh: "科西嘉", nameEn: "Corsica", basemapName: "Corsica", civType: "kingdom" },
    { id: "sinhalese_1280", nameZh: "僧伽罗王国", nameEn: "Sinhalese Kingdom", basemapName: "Sinhalese kingdom", civType: "kingdom" },
    { id: "thule_1280", nameZh: "图勒文化", nameEn: "Thule Culture", basemapName: "Thule", civType: "tribal" },
    { id: "sami_1280", nameZh: "萨米人", nameEn: "Sámi", basemapName: "Sámi", civType: "nomadic" },
    { id: "novgorod_1280", nameZh: "诺夫哥罗德", nameEn: "Novgorod", basemapName: "Novgorod", civType: "republic" },
    { id: "innu_1280", nameZh: "因纽人", nameEn: "Innu", basemapName: "Innu", civType: "tribal" },
    { id: "athabaskan_1280", nameZh: "阿萨巴斯坎人", nameEn: "Athabaskan", basemapName: "Athabaskan", civType: "tribal" },
    { id: "ainu_1280", nameZh: "阿伊努文化", nameEn: "Ainu", basemapName: "Ainus", civType: "tribal" },
    { id: "kashmir_1280", nameZh: "克什米尔", nameEn: "Kashmir and Ladakh", basemapName: "Kashmir and Ladakh", civType: "kingdom" },
    { id: "shoa_1280", nameZh: "绍阿苏丹国", nameEn: "Shoa Sultanate", basemapName: "Shoa", civType: "kingdom" },
    { id: "touareg_1280", nameZh: "图阿雷格", nameEn: "Touareg", basemapName: "Touareg", civType: "nomadic" },
  ],

  // ==================== CRUSADES (1200) ====================
  "crusades": [
    { id: "cyprus_1200", nameZh: "塞浦路斯王国", nameEn: "Kingdom of Cyprus", basemapName: "Cyprus", civType: "kingdom" },
    { id: "brittany_1200", nameZh: "布列塔尼公国", nameEn: "Duchy of Brittany", basemapName: "Britany", civType: "kingdom" },
    { id: "corsica_1200", nameZh: "科西嘉", nameEn: "Corsica", basemapName: "Corsica", civType: "kingdom" },
    { id: "sardinia_1200", nameZh: "萨丁尼亚", nameEn: "Sardinia", basemapName: "Sardinia", civType: "kingdom" },
    { id: "navarre_1200", nameZh: "纳瓦拉王国", nameEn: "Kingdom of Navarre", basemapName: "Navarre", civType: "kingdom" },
    { id: "leon_1200", nameZh: "莱昂王国", nameEn: "Kingdom of León", basemapName: "León", civType: "kingdom" },
    { id: "kanem_1200", nameZh: "卡涅姆帝国", nameEn: "Kanem Empire", basemapName: "Kanem", civType: "empire" },
    { id: "ifat_1200", nameZh: "伊法特苏丹国", nameEn: "Sultanate of Ifat", basemapName: "Ifat", civType: "kingdom" },
    { id: "thule_1200", nameZh: "图勒文化", nameEn: "Thule Culture", basemapName: "Thule", civType: "tribal" },
    { id: "sami_1200", nameZh: "萨米人", nameEn: "Sámi", basemapName: "Sámi", civType: "nomadic" },
    { id: "mon_state_1200", nameZh: "孟人国家", nameEn: "Mon State", basemapName: "Mon state", civType: "kingdom" },
    { id: "innu_1200", nameZh: "因纽人", nameEn: "Innu", basemapName: "Innu", civType: "tribal" },
    { id: "athabaskan_1200", nameZh: "阿萨巴斯坎人", nameEn: "Athabaskan", basemapName: "Athabaskan", civType: "tribal" },
    { id: "rajput_1200", nameZh: "拉其普特诸王国", nameEn: "Rajput Kingdoms", basemapName: "Rajput Kingdoms", civType: "kingdom" },
    { id: "kamarupa_1200", nameZh: "迦摩缕波", nameEn: "Kamarupa", basemapName: "Kamarupa", civType: "kingdom" },
    { id: "takrur_1200", nameZh: "塔克鲁尔", nameEn: "Takrur", basemapName: "Takrur", civType: "kingdom" },
    { id: "toulouse_1200", nameZh: "图卢兹伯爵领", nameEn: "County of Toulouse", basemapName: "Comté de Toulouse", civType: "kingdom" },
    { id: "burgundy_1200", nameZh: "勃艮第", nameEn: "Burgundy", basemapName: "Burgandy", civType: "kingdom" },
  ],

  // ==================== TANG GOLDEN AGE (750) ====================
  "tang-golden-age": [
    { id: "franks_750", nameZh: "法兰克王国", nameEn: "Frankish Kingdom", basemapName: "Frankish Kingdom", civType: "kingdom" },
    { id: "visigothic_750", nameZh: "西哥特王国", nameEn: "Visigothic Kingdom", basemapName: "Visigothic Kingdom", civType: "kingdom" },
    { id: "lombard_750", nameZh: "伦巴第诸侯国", nameEn: "Lombard Principalities", basemapName: "Lombard principalities", civType: "kingdom" },
    { id: "georgia_750", nameZh: "格鲁吉亚王国", nameEn: "Georgian Kingdom", basemapName: "Georgian Kingdom", civType: "kingdom" },
    { id: "khazars_750", nameZh: "可萨汗国", nameEn: "Khazar Khaganate", basemapName: "Khazars", civType: "nomadic" },
    { id: "umayyad_750", nameZh: "倭马亚哈里发国", nameEn: "Umayyad Caliphate", basemapName: "Umayyad Caliphate", civType: "empire" },
    { id: "east_roman_750", nameZh: "东罗马帝国", nameEn: "Eastern Roman Empire", basemapName: "Eastern Roman Empire", civType: "empire" },
    { id: "ghana_empire_750", nameZh: "加纳帝国", nameEn: "Empire of Ghana", basemapName: "Empire of Ghana", civType: "empire" },
    { id: "pala_750", nameZh: "波罗王朝", nameEn: "Pala Dynasty", basemapName: "Palas", civType: "kingdom" },
    { id: "pallava_750", nameZh: "帕拉瓦王朝", nameEn: "Pallava Dynasty", basemapName: "Pallavas", civType: "kingdom" },
    { id: "chola_750", nameZh: "朱罗王朝", nameEn: "Chola Dynasty", basemapName: "Cholas", civType: "kingdom" },
    { id: "pandya_750", nameZh: "潘地亚王朝", nameEn: "Pandya Dynasty", basemapName: "Pandyas", civType: "kingdom" },
    { id: "chera_750", nameZh: "哲罗王朝", nameEn: "Chera Dynasty", basemapName: "Cheras", civType: "kingdom" },
    { id: "nanzhao_750", nameZh: "南诏", nameEn: "Nanzhao Kingdom", basemapName: "Nan-Zhao", civType: "kingdom" },
    { id: "uyghurs_750", nameZh: "回鹘汗国", nameEn: "Uyghur Khaganate", basemapName: "Uyghurs", civType: "nomadic" },
    { id: "tufan_750", nameZh: "吐蕃帝国", nameEn: "Tibetan Empire", basemapName: "Tufan Empire", civType: "empire" },
    { id: "silla_750", nameZh: "新罗", nameEn: "Silla", basemapName: "Silla", civType: "kingdom" },
    { id: "yamato_750", nameZh: "大和", nameEn: "Yamato Japan", basemapName: "Yamato", civType: "empire" },
    { id: "maya_750", nameZh: "玛雅城邦", nameEn: "Maya States", basemapName: "Maya states", civType: "city_state" },
    { id: "huari_750", nameZh: "瓦里帝国", nameEn: "Huari Empire", basemapName: "Huari Empire", civType: "empire" },
    { id: "tiahuanaco_750", nameZh: "蒂亚瓦纳科帝国", nameEn: "Tiahuanaco Empire", basemapName: "Tiahuanaco Empire", civType: "empire" },
    { id: "saxon_750", nameZh: "萨克森人", nameEn: "Saxons", basemapName: "Saxons", civType: "tribal" },
    { id: "frisian_750", nameZh: "弗里斯人", nameEn: "Frisians", basemapName: "Frisians", civType: "tribal" },
    { id: "chen_la_750", nameZh: "真腊", nameEn: "Chen-La", basemapName: "Chen-La", civType: "kingdom" },
    { id: "dvaravati_750", nameZh: "陀罗钵地", nameEn: "Dvaravati", basemapName: "Dvaravati", civType: "kingdom" },
  ],

  // ==================== FALL OF ROME (476) ====================
  "fall-of-rome": [
    { id: "western_roman_476", nameZh: "西罗马帝国", nameEn: "Western Roman Empire", basemapName: "Western Roman Empire", civType: "empire" },
    { id: "dorset_476", nameZh: "多塞特文化", nameEn: "Dorset Culture", basemapName: "Dorset", civType: "tribal" },
    { id: "vishnu_kundins_476", nameZh: "毗湿奴昆丁王朝", nameEn: "Vishnu-Kundins", basemapName: "Vishnu-Kundins", civType: "kingdom" },
    { id: "armorica_476", nameZh: "阿莫里卡", nameEn: "Armorica", basemapName: "Armorica", civType: "tribal" },
  ],

  // ==================== THREE KINGDOMS (220) ====================
  "three-kingdoms": [
    { id: "sami_220", nameZh: "萨米人", nameEn: "Sámi", basemapName: "Sámi", civType: "nomadic" },
    { id: "paleo_inuit_220", nameZh: "古因纽特", nameEn: "Paleo-Inuit", basemapName: "Paleo-Inuit", civType: "tribal" },
  ],

  // ==================== HAN-ROME PEAK (100) ====================
  "han-rome-peak": [
    { id: "paleo_inuit_100", nameZh: "古因纽特", nameEn: "Paleo-Inuit", basemapName: "Paleo-Inuit", civType: "tribal" },
  ],

  // ==================== HELLENISTIC (-323) ====================
  "hellenistic": [
    { id: "colchis_323", nameZh: "科尔基斯", nameEn: "Colchis", basemapName: "Colchis", civType: "kingdom" },
    { id: "atropatene_323", nameZh: "阿特罗帕特尼", nameEn: "Atropatene", basemapName: "Atropatene", civType: "kingdom" },
    { id: "wankarani_323", nameZh: "万卡拉尼文化", nameEn: "Wankarani Culture", basemapName: "Wankarani", civType: "tribal" },
    { id: "chorrera_323", nameZh: "乔雷拉文化", nameEn: "Chorrera Culture", basemapName: "Chorrera", civType: "tribal" },
  ],

  // ==================== AXIAL AGE (-500) ====================
  "axial-age": [
    { id: "chorrera_500", nameZh: "乔雷拉文化", nameEn: "Chorrera Culture", basemapName: "Chorrera", civType: "tribal" },
    { id: "paleo_inuit_500", nameZh: "古因纽特", nameEn: "Paleo-Inuit", basemapName: "Paleo-Inuit", civType: "tribal" },
  ],

  // ==================== IRON AGE (-800) ====================
  "iron-age": [
    { id: "chorrera_ia", nameZh: "乔雷拉文化", nameEn: "Chorrera Culture", basemapName: "Chorrera", civType: "tribal" },
    { id: "lusatian_culture_ia", nameZh: "卢萨蒂亚文化", nameEn: "Lusatian Culture", basemapName: "Lusatian culture", civType: "tribal" },
    { id: "la_tene_ia", nameZh: "拉坦文化", nameEn: "La Tène Culture", basemapName: "La Tène culture", civType: "tribal" },
  ],

  // ==================== BRONZE AGE (-1600) ====================
  "bronze-age": [
    { id: "chorrera_ba", nameZh: "乔雷拉文化", nameEn: "Chorrera Culture", basemapName: "Chorrera", civType: "tribal" },
    { id: "poverty_point_ba", nameZh: "贫困点文化", nameEn: "Poverty Point Culture", basemapName: "Poverty point culture", civType: "tribal" },
    { id: "el_paraiso_ba", nameZh: "帕拉伊索文化", nameEn: "El Paraíso Culture", basemapName: "El Paraiso", civType: "tribal" },
  ],
};

const SEED_DIR = path.join(process.cwd(), "src", "data", "seed");

async function main() {
  let totalAdded = 0;

  for (const [eraId, additions] of Object.entries(GAP_FILLS)) {
    const seedFile = path.join(SEED_DIR, `era-${eraId}.json`);
    if (!fs.existsSync(seedFile)) {
      console.warn(`  ⚠ Seed file not found: ${seedFile}`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(seedFile, "utf-8"));
    const existingIds = new Set((data.regions as { id: string }[]).map((r) => r.id));

    let added = 0;
    for (const a of additions) {
      if (existingIds.has(a.id)) {
        continue;
      }
      data.regions.push(buildRegion(a));
      added++;
    }

    if (added > 0) {
      fs.writeFileSync(seedFile, JSON.stringify(data, null, 2), "utf-8");
    }
    console.log(`  ${eraId}: +${added} regions (total: ${data.regions.length})`);
    totalAdded += added;
  }

  console.log(`\n✓ Added ${totalAdded} regions across all eras.`);
}

main().catch(console.error);
