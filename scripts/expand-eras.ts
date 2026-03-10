#!/usr/bin/env npx tsx
/**
 * Expand era seed files with new civilizations from aourednik/historical-basemaps.
 * Each addition corresponds to a real NAME in the basemap GeoJSON.
 *
 * Usage:  npx tsx scripts/expand-eras.ts
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

// ============================================================
// ERA_ADDITIONS — curated per era from basemap GeoJSON NAMEs
// ============================================================

const ERA_ADDITIONS: Record<string, RegionAddition[]> = {

  // ==================== BRONZE AGE (-1600) ====================
  "bronze-age": [
    { id: "ainu_jomon", nameZh: "绳文·阿伊努", nameEn: "Jomon Ainu", basemapName: "Ainu", civType: "tribal" },
    { id: "austronesian_expansion", nameZh: "南岛语族", nameEn: "Austronesian Peoples", basemapName: "Austronesians", civType: "tribal" },
    { id: "saharan_pastoralists", nameZh: "撒哈拉游牧民", nameEn: "Saharan Pastoralists", basemapName: "Saharan pastoral nomads", civType: "nomadic" },
    { id: "desert_hunter_gatherers", nameZh: "沙漠采集者", nameEn: "Desert Hunter-Gatherers", basemapName: "Desert hunter-gatherers", civType: "tribal" },
    { id: "khoisan_peoples", nameZh: "科伊桑人", nameEn: "Khoisan Peoples", basemapName: "Khoiasan", civType: "tribal" },
    { id: "paleo_siberian_hunters", nameZh: "古西伯利亚猎人", nameEn: "Paleo-Siberian Hunters", basemapName: "Paleo-Siberian hunter-gatherers", civType: "tribal" },
    { id: "arctic_marine_hunters", nameZh: "北极海猎民", nameEn: "Arctic Marine Mammal Hunters", basemapName: "Arctic marine mammal hunters", civType: "tribal" },
    { id: "plain_bison_hunters", nameZh: "平原野牛猎人", nameEn: "Plains Bison Hunters", basemapName: "Plain bison hunters", civType: "nomadic" },
    { id: "papuan_farmers", nameZh: "巴布亚新石器农民", nameEn: "Papuan Neolithic Farmers", basemapName: "Papuan neolithic farmers", civType: "tribal" },
    { id: "caribbean_hunter_gatherers", nameZh: "加勒比采集者", nameEn: "Caribbean Hunter-Gatherers", basemapName: "Caribbean hunter-gatherers", civType: "tribal" },
    { id: "saami_peoples", nameZh: "萨米人", nameEn: "Sámi Peoples", basemapName: "Saami", civType: "nomadic" },
    { id: "maize_farmers_mesoamerica", nameZh: "中美洲玉米农民", nameEn: "Mesoamerican Maize Farmers", basemapName: "Maize farmers", civType: "tribal" },
    { id: "manioc_farmers_amazonia", nameZh: "亚马逊木薯农民", nameEn: "Amazonian Manioc Farmers", basemapName: "Manioc farmers", civType: "tribal" },
    { id: "finno_ugric_hunters", nameZh: "芬兰-乌戈尔猎人", nameEn: "Finno-Ugric Taiga Hunters", basemapName: "Finno-Ugric taiga hunter-gatherers", civType: "tribal" },
    { id: "pampas_cultures_ba", nameZh: "潘帕斯文化", nameEn: "Pampas Cultures", basemapName: "Pampas cultures", civType: "tribal" },
    { id: "patagonian_hunters", nameZh: "巴塔哥尼亚猎人", nameEn: "Patagonian Hunters", basemapName: "Patagonian shellfish and marine mammal hunters", civType: "tribal" },
    { id: "east_na_hunter_gatherers", nameZh: "北美东部采集者", nameEn: "Eastern N. American Hunter-Gatherers", basemapName: "Eastern North Amercian hunter-gatherers", civType: "tribal" },
    { id: "savanna_hunter_gatherers", nameZh: "热带草原采集者", nameEn: "Savanna Hunter-Gatherers", basemapName: "Savanna hunter-gatherers", civType: "tribal" },
    { id: "shellfish_gatherers_sa", nameZh: "贝丘采集者", nameEn: "Shellfish Gatherers", basemapName: "Shellfish gatherers", civType: "tribal" },
    { id: "subarctic_hunters", nameZh: "亚北极森林猎人", nameEn: "Subarctic Forest Hunters", basemapName: "Subarctic forest hunter-gatherers", civType: "tribal" },
    { id: "tasmanian_hunters", nameZh: "塔斯马尼亚猎人", nameEn: "Tasmanian Hunters", basemapName: "Tasmanian hunter-gatherers", civType: "tribal" },
    { id: "na_pacific_foragers", nameZh: "北美太平洋沿岸采集者", nameEn: "N. American Pacific Foragers", basemapName: "North American Pacifi foraging, hunting and fishing peoples", civType: "tribal" },
    { id: "plateau_fishers", nameZh: "高原渔猎民", nameEn: "Plateau Fishers & Hunters", basemapName: "Plateau fichers and hunter gatherers", civType: "tribal" },
    { id: "karasuk_culture", nameZh: "卡拉苏克文化", nameEn: "Karasuk Culture", basemapName: "Karasuk culture", civType: "tribal" },
    { id: "tibetan_peoples_ba", nameZh: "藏族先民", nameEn: "Tibetan Peoples", basemapName: "Tibetans", civType: "tribal" },
    { id: "thracian_tribes", nameZh: "色雷斯部落", nameEn: "Thracian Tribes", basemapName: "Thrace", civType: "tribal" },
    { id: "illyrian_tribes", nameZh: "伊利里亚部落", nameEn: "Illyrian Tribes", basemapName: "Illyrians", civType: "tribal" },
    { id: "burmese_early", nameZh: "缅甸早期民族", nameEn: "Early Burmese Peoples", basemapName: "Burmese", civType: "tribal" },
    { id: "chinchorro_culture", nameZh: "钦乔罗文化", nameEn: "Chinchorro Culture", basemapName: "Chinchoros", civType: "tribal" },
    { id: "australian_aboriginals_ba", nameZh: "澳大利亚原住民", nameEn: "Australian Aboriginals", basemapName: "Australian aboriginal hunter-gatherers", civType: "tribal" },
  ],

  // ==================== IRON AGE (-800) ====================
  "iron-age": [
    { id: "ainu_iron", nameZh: "阿伊努文化", nameEn: "Ainu Culture", basemapName: "Ainu", civType: "tribal" },
    { id: "austronesian_iron", nameZh: "南岛语族", nameEn: "Austronesian Peoples", basemapName: "Austronesians", civType: "tribal" },
    { id: "saharan_pastoralists_ia", nameZh: "撒哈拉游牧民", nameEn: "Saharan Pastoralists", basemapName: "Saharan pastoral nomads", civType: "nomadic" },
    { id: "desert_hunter_gatherers_ia", nameZh: "沙漠采集者", nameEn: "Desert Hunter-Gatherers", basemapName: "Desert hunter-gatherers", civType: "tribal" },
    { id: "khoisan_ia", nameZh: "科伊桑人", nameEn: "Khoisan Peoples", basemapName: "Khoiasan", civType: "tribal" },
    { id: "paleo_siberian_ia", nameZh: "古西伯利亚猎人", nameEn: "Paleo-Siberian Hunters", basemapName: "Paleo-Siberian hunter-gatherers", civType: "tribal" },
    { id: "arctic_hunters_ia", nameZh: "北极海猎民", nameEn: "Arctic Marine Hunters", basemapName: "Arctic marine mammal hunters", civType: "tribal" },
    { id: "plain_bison_hunters_ia", nameZh: "平原野牛猎人", nameEn: "Plains Bison Hunters", basemapName: "Plain bison hunters", civType: "nomadic" },
    { id: "papuan_ia", nameZh: "巴布亚农民", nameEn: "Papuan Farmers", basemapName: "Papuan neolithic farmers", civType: "tribal" },
    { id: "caribbean_ia", nameZh: "加勒比采集者", nameEn: "Caribbean Hunter-Gatherers", basemapName: "Caribbean hunter-gatherers", civType: "tribal" },
    { id: "saami_ia", nameZh: "萨米人", nameEn: "Sámi Peoples", basemapName: "Saami", civType: "nomadic" },
    { id: "proto_scythian", nameZh: "原始斯基泰文化", nameEn: "Proto-Scythian Culture", basemapName: "Proto-Scythian culture", civType: "nomadic" },
    { id: "chavin_culture", nameZh: "查文文化", nameEn: "Chavín Culture", basemapName: "Chavin", civType: "theocracy", capitalZh: "查文-德万塔尔", capitalEn: "Chavín de Huántar" },
    { id: "savanna_ia", nameZh: "热带草原采集者", nameEn: "Savanna Hunter-Gatherers", basemapName: "Savanna hunter-gatherers", civType: "tribal" },
    { id: "finno_ugric_ia", nameZh: "芬兰-乌戈尔猎人", nameEn: "Finno-Ugric Peoples", basemapName: "Finno-Ugric taiga hunter-gatherers", civType: "tribal" },
    { id: "maize_farmers_ia", nameZh: "中美洲玉米农民", nameEn: "Maize Farmers", basemapName: "Maize farmers", civType: "tribal" },
    { id: "pampas_ia", nameZh: "潘帕斯文化", nameEn: "Pampas Cultures", basemapName: "Pampas cultures", civType: "tribal" },
    { id: "east_na_ia", nameZh: "北美东部采集者", nameEn: "Eastern N. American Peoples", basemapName: "Eastern North Amercian hunter-gatherers", civType: "tribal" },
    { id: "australian_aboriginals_ia", nameZh: "澳大利亚原住民", nameEn: "Australian Aboriginals", basemapName: "Australian aboriginal hunter-gatherers", civType: "tribal" },
    { id: "burmese_ia", nameZh: "缅甸先民", nameEn: "Early Burmese", basemapName: "Burmese", civType: "tribal" },
  ],

  // ==================== AXIAL AGE (-500) ====================
  "axial-age": [
    { id: "adena_culture", nameZh: "阿德纳文化", nameEn: "Adena Culture", basemapName: "Adena Culture", civType: "tribal" },
    { id: "simhala_kingdom", nameZh: "僧伽罗王国", nameEn: "Simhala Kingdom", basemapName: "Simhala", civType: "kingdom" },
    { id: "boii_celts", nameZh: "波伊人", nameEn: "Boii Celts", basemapName: "Boii", civType: "tribal" },
    { id: "khoisan_axial", nameZh: "科伊桑人", nameEn: "Khoisan Peoples", basemapName: "Khoiasan", civType: "tribal" },
    { id: "australian_aboriginals_ax", nameZh: "澳大利亚原住民", nameEn: "Australian Aboriginals", basemapName: "Australian aboriginal hunter-gatherers", civType: "tribal" },
    { id: "austronesian_axial", nameZh: "南岛语族", nameEn: "Austronesian Peoples", basemapName: "Austronesians", civType: "tribal" },
    { id: "illyrian_axial", nameZh: "伊利里亚人", nameEn: "Illyrians", basemapName: "Illyrians", civType: "tribal" },
    { id: "finno_ugric_axial", nameZh: "芬兰-乌戈尔民族", nameEn: "Finno-Ugric Peoples", basemapName: "Finno-Ugric taiga hunter-gatherers", civType: "tribal" },
    { id: "pampas_axial", nameZh: "潘帕斯文化", nameEn: "Pampas Cultures", basemapName: "Pampas cultures", civType: "tribal" },
    { id: "plain_bison_axial", nameZh: "平原野牛猎人", nameEn: "Plains Bison Hunters", basemapName: "Plain bison hunters", civType: "nomadic" },
    { id: "saami_axial", nameZh: "萨米人", nameEn: "Sámi Peoples", basemapName: "Saami", civType: "nomadic" },
    { id: "savanna_axial", nameZh: "热带草原采集者", nameEn: "Savanna Hunter-Gatherers", basemapName: "Savanna hunter-gatherers", civType: "tribal" },
    { id: "samnites_500bce", nameZh: "萨莫奈人", nameEn: "Samnites", basemapName: "Samnites", civType: "tribal" },
    { id: "paleo_siberian_axial", nameZh: "古西伯利亚猎人", nameEn: "Paleo-Siberian Hunters", basemapName: "Paleo-Siberian hunter-gatherers", civType: "tribal" },
    { id: "desert_hunter_axial", nameZh: "沙漠采集者", nameEn: "Desert Hunter-Gatherers", basemapName: "Desert hunter-gatherers", civType: "tribal" },
    { id: "iron_age_megalith_india", nameZh: "南印度巨石文化", nameEn: "Iron Age Megalith Cultures", basemapName: "Iron Age megalith cultures", civType: "tribal" },
    { id: "arctic_hunters_axial", nameZh: "北极海猎民", nameEn: "Arctic Marine Hunters", basemapName: "Arctic marine mammal hunters", civType: "tribal" },
    { id: "caribbean_axial", nameZh: "加勒比采集者", nameEn: "Caribbean Hunter-Gatherers", basemapName: "Caribbean hunter-gatherers", civType: "tribal" },
  ],

  // ==================== HELLENISTIC (-323) ====================
  "hellenistic": [
    { id: "paracas_culture", nameZh: "帕拉卡斯文化", nameEn: "Paracas Culture", basemapName: "Paracas", civType: "tribal" },
    { id: "zhangzhung_kingdom", nameZh: "象雄王国", nameEn: "Zhangzhung Kingdom", basemapName: "Zhangzhung Kingdom", civType: "kingdom" },
    { id: "qataban_kingdom", nameZh: "卡塔班王国", nameEn: "Qataban Kingdom", basemapName: "Qataban", civType: "kingdom" },
    { id: "bosporan_kingdom_323", nameZh: "博斯普鲁斯王国", nameEn: "Bosporan Kingdom", basemapName: "Bosporan Kingdom", civType: "kingdom" },
    { id: "khoisan_hellen", nameZh: "科伊桑人", nameEn: "Khoisan Peoples", basemapName: "Khoiasan", civType: "tribal" },
    { id: "australian_aboriginals_hel", nameZh: "澳大利亚原住民", nameEn: "Australian Aboriginals", basemapName: "Australian aboriginal hunter-gatherers", civType: "tribal" },
    { id: "caribbean_hellen", nameZh: "加勒比采集者", nameEn: "Caribbean Hunter-Gatherers", basemapName: "Caribbean hunter-gatherers", civType: "tribal" },
    { id: "pampas_hellen", nameZh: "潘帕斯文化", nameEn: "Pampas Cultures", basemapName: "Pampas cultures", civType: "tribal" },
    { id: "finno_ugric_hellen", nameZh: "芬兰-乌戈尔民族", nameEn: "Finno-Ugric Peoples", basemapName: "Finno-Ugric taiga hunter-gatherers", civType: "tribal" },
    { id: "paleo_siberian_hellen", nameZh: "古西伯利亚猎人", nameEn: "Paleo-Siberian Hunters", basemapName: "Paleo-Siberian hunter-gatherers", civType: "tribal" },
    { id: "sabines_323", nameZh: "萨宾人", nameEn: "Sabines", basemapName: "Sabines", civType: "tribal" },
    { id: "desert_hunter_hellen", nameZh: "沙漠采集者", nameEn: "Desert Hunter-Gatherers", basemapName: "Desert hunter-gatherers", civType: "tribal" },
    { id: "savanna_hellen", nameZh: "热带草原采集者", nameEn: "Savanna Hunter-Gatherers", basemapName: "Savanna hunter-gatherers", civType: "tribal" },
  ],

  // ==================== QIN-ROME (-221) ====================
  "qin-rome": [
    { id: "mon_khmer_peoples", nameZh: "孟-高棉民族", nameEn: "Mon-Khmer Peoples", basemapName: "Mon-Khmer", civType: "tribal" },
    { id: "malays_prestate", nameZh: "马来先民", nameEn: "Malay Peoples", basemapName: "Malays", civType: "tribal" },
    { id: "norsemen_early", nameZh: "古北欧人", nameEn: "Early Norsemen", basemapName: "Norsemen", civType: "tribal" },
    { id: "thai_early", nameZh: "泰族先民", nameEn: "Early Thai Peoples", basemapName: "Thai", civType: "tribal" },
    { id: "khoisan_qin", nameZh: "科伊桑人", nameEn: "Khoisan Peoples", basemapName: "Khoiasan", civType: "tribal" },
    { id: "pampas_qin", nameZh: "潘帕斯文化", nameEn: "Pampas Cultures", basemapName: "Pampas cultures", civType: "tribal" },
    { id: "australian_aboriginals_qin", nameZh: "澳大利亚原住民", nameEn: "Australian Aboriginals", basemapName: "Australian aboriginal hunter-gatherers", civType: "tribal" },
    { id: "caribbean_qin", nameZh: "加勒比采集者", nameEn: "Caribbean Hunter-Gatherers", basemapName: "Caribbean hunter-gatherers", civType: "tribal" },
    { id: "finno_ugric_qin", nameZh: "芬兰-乌戈尔民族", nameEn: "Finno-Ugric Peoples", basemapName: "Finno-Ugric taiga hunter-gatherers", civType: "tribal" },
    { id: "paleo_siberian_qin", nameZh: "古西伯利亚猎人", nameEn: "Paleo-Siberian Hunters", basemapName: "Paleo-Siberian hunter-gatherers", civType: "tribal" },
    { id: "savanna_qin", nameZh: "热带草原采集者", nameEn: "Savanna Hunter-Gatherers", basemapName: "Savanna hunter-gatherers", civType: "tribal" },
    { id: "desert_hunter_qin", nameZh: "沙漠采集者", nameEn: "Desert Hunter-Gatherers", basemapName: "Desert hunter-gatherers", civType: "tribal" },
    { id: "dardania_221", nameZh: "达尔达尼亚", nameEn: "Dardania", basemapName: "Dardania", civType: "tribal" },
    { id: "tungus_early", nameZh: "通古斯先民", nameEn: "Tungus Peoples", basemapName: "Tungus", civType: "nomadic" },
    { id: "scythian_qin", nameZh: "斯基泰人", nameEn: "Scythians", basemapName: "Scythians", civType: "nomadic" },
  ],

  // ==================== HAN-ROME PEAK (100) ====================
  "han-rome-peak": [
    { id: "hainan_100", nameZh: "海南部族", nameEn: "Hainan Peoples", basemapName: "Hainan", civType: "tribal" },
    { id: "alans_100", nameZh: "阿兰人", nameEn: "Alans", basemapName: "Alans", civType: "nomadic" },
    { id: "suren_kingdom", nameZh: "苏连王国", nameEn: "Suren Kingdom", basemapName: "Suren Kingdom", civType: "kingdom" },
    { id: "hopewell_culture", nameZh: "霍普韦尔文化", nameEn: "Hopewell Culture", basemapName: "Hopewell Culture", civType: "tribal" },
    { id: "himyarite_kingdom_100", nameZh: "希木叶尔王国", nameEn: "Himyarite Kingdom", basemapName: "Himyarite Kingdom", civType: "kingdom" },
    { id: "hadramawt_100", nameZh: "哈德拉毛", nameEn: "Hadramaut", basemapName: "Hadramaut", civType: "kingdom" },
    { id: "simhala_100", nameZh: "僧伽罗", nameEn: "Simhala", basemapName: "Simhala", civType: "kingdom" },
    { id: "bosporan_100", nameZh: "博斯普鲁斯王国", nameEn: "Bosporan Kingdom", basemapName: "Bosporian Kingdom", civType: "kingdom" },
    { id: "khoisan_han", nameZh: "科伊桑人", nameEn: "Khoisan Peoples", basemapName: "Khoiasan", civType: "tribal" },
    { id: "kalinga_100", nameZh: "羯陵伽", nameEn: "Kalinga", basemapName: "Kalinga", civType: "kingdom" },
    { id: "pampas_han", nameZh: "潘帕斯文化", nameEn: "Pampas Cultures", basemapName: "Pampas cultures", civType: "tribal" },
    { id: "australian_aboriginals_han", nameZh: "澳大利亚原住民", nameEn: "Australian Aboriginals", basemapName: "Australian aboriginal hunter-gatherers", civType: "tribal" },
    { id: "caribbean_han", nameZh: "加勒比采集者", nameEn: "Caribbean Hunter-Gatherers", basemapName: "Caribbean hunter-gatherers", civType: "tribal" },
    { id: "finno_ugric_han", nameZh: "芬兰-乌戈尔民族", nameEn: "Finno-Ugric Peoples", basemapName: "Finno-Ugric taiga hunter-gatherers", civType: "tribal" },
    { id: "savanna_han", nameZh: "热带草原采集者", nameEn: "Savanna Hunter-Gatherers", basemapName: "Savanna hunter-gatherers", civType: "tribal" },
    { id: "ainu_han", nameZh: "阿伊努文化", nameEn: "Ainu Culture", basemapName: "Ainu", civType: "tribal" },
    { id: "saka_kingdom", nameZh: "塞迦王国", nameEn: "Saka Kingdom", basemapName: "Saka Kingdom", civType: "kingdom" },
    { id: "paleo_siberian_han", nameZh: "古西伯利亚猎人", nameEn: "Paleo-Siberian Hunters", basemapName: "Paleo-Siberian hunter-gatherers", civType: "tribal" },
  ],

  // ==================== THREE KINGDOMS (220) ====================
  "three-kingdoms": [
    { id: "hainan_220", nameZh: "海南部族", nameEn: "Hainan Peoples", basemapName: "Hainan", civType: "tribal" },
    { id: "simhala_220", nameZh: "僧伽罗", nameEn: "Simhala", basemapName: "Simhala", civType: "kingdom" },
    { id: "bosporan_220", nameZh: "博斯普鲁斯王国", nameEn: "Bosporan Kingdom", basemapName: "Bosporian Kingdom", civType: "kingdom" },
    { id: "himyarite_220", nameZh: "希木叶尔王国", nameEn: "Himyarite Kingdom", basemapName: "Himyarite Kingdom", civType: "kingdom" },
    { id: "hopewell_220", nameZh: "霍普韦尔文化", nameEn: "Hopewell Culture", basemapName: "Hopewell Culture", civType: "tribal" },
    { id: "khoisan_220", nameZh: "科伊桑人", nameEn: "Khoisan Peoples", basemapName: "Khoiasan", civType: "tribal" },
    { id: "pampas_220", nameZh: "潘帕斯文化", nameEn: "Pampas Cultures", basemapName: "Pampas cultures", civType: "tribal" },
    { id: "caribbean_220", nameZh: "加勒比采集者", nameEn: "Caribbean Peoples", basemapName: "Caribbean hunter-gatherers", civType: "tribal" },
    { id: "australian_aboriginals_220", nameZh: "澳大利亚原住民", nameEn: "Australian Aboriginals", basemapName: "Australian aboriginal hunter-gatherers", civType: "tribal" },
    { id: "savanna_220", nameZh: "热带草原采集者", nameEn: "Savanna Peoples", basemapName: "Savanna hunter-gatherers", civType: "tribal" },
    { id: "heruli_220", nameZh: "赫鲁利人", nameEn: "Heruli", basemapName: "Heruli", civType: "tribal" },
    { id: "ainu_220", nameZh: "阿伊努文化", nameEn: "Ainu Culture", basemapName: "Ainu", civType: "tribal" },
    { id: "hadramawt_220", nameZh: "哈德拉毛", nameEn: "Hadramaut", basemapName: "Hadramaut", civType: "kingdom" },
    { id: "finno_ugric_220", nameZh: "芬兰-乌戈尔民族", nameEn: "Finno-Ugric Peoples", basemapName: "Finno-Ugric taiga hunter-gatherers", civType: "tribal" },
  ],

  // ==================== FALL OF ROME (476) ====================
  "fall-of-rome": [
    { id: "ghana_empire_476", nameZh: "加纳帝国", nameEn: "Empire of Ghana", basemapName: "Empire of Ghana", civType: "empire" },
    { id: "cheras_476", nameZh: "哲罗王朝", nameEn: "Cheras", basemapName: "Cheras", civType: "kingdom" },
    { id: "cholas_476", nameZh: "朱罗王朝", nameEn: "Cholas", basemapName: "Cholas", civType: "kingdom" },
    { id: "pandyas_476", nameZh: "潘地亚王朝", nameEn: "Pandyas", basemapName: "Pandyas", civType: "kingdom" },
    { id: "swedes_476", nameZh: "瑞典人", nameEn: "Swedes", basemapName: "Swedes", civType: "tribal" },
    { id: "western_gangas_476", nameZh: "西恒河王朝", nameEn: "Western Gangas", basemapName: "Western Gangas", civType: "kingdom" },
    { id: "simhala_476", nameZh: "僧伽罗", nameEn: "Simhala", basemapName: "Simhala", civType: "kingdom" },
    { id: "khoisan_476", nameZh: "科伊桑人", nameEn: "Khoisan Peoples", basemapName: "Khoiasan", civType: "tribal" },
    { id: "caribbean_476", nameZh: "加勒比采集者", nameEn: "Caribbean Peoples", basemapName: "Caribbean hunter-gatherers", civType: "tribal" },
    { id: "pampas_476", nameZh: "潘帕斯文化", nameEn: "Pampas Cultures", basemapName: "Pampas cultures", civType: "tribal" },
    { id: "ainu_476", nameZh: "阿伊努文化", nameEn: "Ainu Culture", basemapName: "Ainu", civType: "tribal" },
    { id: "australian_aboriginals_476", nameZh: "澳大利亚原住民", nameEn: "Australian Aboriginals", basemapName: "Australian aboriginal hunter-gatherers", civType: "tribal" },
    { id: "savanna_476", nameZh: "热带草原采集者", nameEn: "Savanna Peoples", basemapName: "Savanna hunter-gatherers", civType: "tribal" },
    { id: "tui_tonga_476", nameZh: "汤加帝国", nameEn: "Tu'i Tonga Empire", basemapName: "Tuʻi Tonga Empire", civType: "kingdom" },
  ],

  // ==================== TANG GOLDEN AGE (750) ====================
  "tang-golden-age": [
    { id: "mataram_750", nameZh: "马打兰王国", nameEn: "Mataram Kingdom", basemapName: "Mataram", civType: "kingdom", capitalZh: "日惹", capitalEn: "Yogyakarta" },
    { id: "kingdom_kashmir", nameZh: "克什米尔王国", nameEn: "Kingdom of Kashmir", basemapName: "Kingdom of Kashmir", civType: "kingdom" },
    { id: "kingdom_sind", nameZh: "信德王国", nameEn: "Kingdom of Sind", basemapName: "Kingdom of Sind", civType: "kingdom" },
    { id: "chalukyas_750", nameZh: "遮娄其王朝", nameEn: "Chalukyas", basemapName: "Chalukyas", civType: "kingdom" },
    { id: "avars_750", nameZh: "阿瓦尔汗国", nameEn: "Avars", basemapName: "Avars", civType: "nomadic" },
    { id: "magyars_750", nameZh: "马扎尔人", nameEn: "Magyars", basemapName: "Magyars", civType: "nomadic" },
    { id: "simhala_750", nameZh: "僧伽罗", nameEn: "Simhala", basemapName: "Simhala", civType: "kingdom" },
    { id: "khoisan_750", nameZh: "科伊桑人", nameEn: "Khoisan Peoples", basemapName: "Khoiasan", civType: "tribal" },
    { id: "caribbean_750", nameZh: "加勒比原住民", nameEn: "Caribbean Peoples", basemapName: "Caribbean hunter-gatherers", civType: "tribal" },
    { id: "pampas_750", nameZh: "潘帕斯文化", nameEn: "Pampas Cultures", basemapName: "Pampas cultures", civType: "tribal" },
    { id: "australian_aboriginals_750", nameZh: "澳大利亚原住民", nameEn: "Australian Aboriginals", basemapName: "Australian aboriginal hunter-gatherers", civType: "tribal" },
    { id: "slavonic_tribes_750", nameZh: "斯拉夫部落", nameEn: "Slavonic Tribes", basemapName: "Slavonic tribes", civType: "tribal" },
    { id: "champa_750", nameZh: "占婆", nameEn: "Champa", basemapName: "Champa", civType: "kingdom" },
    { id: "ainu_750", nameZh: "阿伊努文化", nameEn: "Ainu Culture", basemapName: "Ainu", civType: "tribal" },
    { id: "savanna_750", nameZh: "热带草原采集者", nameEn: "Savanna Peoples", basemapName: "Savanna hunter-gatherers", civType: "tribal" },
    { id: "tui_tonga_750", nameZh: "汤加帝国", nameEn: "Tu'i Tonga Empire", basemapName: "Tuʻi Tonga Empire", civType: "kingdom" },
    { id: "goturks_750", nameZh: "后突厥", nameEn: "Göktürks", basemapName: "Göktürks", civType: "nomadic" },
  ],

  // ==================== CRUSADES (1200) ====================
  "crusades": [
    { id: "polynesian_1200", nameZh: "波利尼西亚人", nameEn: "Polynesians", basemapName: "Polynesians", civType: "tribal" },
    { id: "taino_1200", nameZh: "泰诺人", nameEn: "Taíno People", basemapName: "Taino", civType: "tribal" },
    { id: "great_zimbabwe", nameZh: "大津巴布韦", nameEn: "Great Zimbabwe", basemapName: "Great Zimbabwe", civType: "kingdom" },
    { id: "tuareg_1200", nameZh: "图阿雷格游牧部落", nameEn: "Tuareg Nomadic Tribes", basemapName: "Tuareg Nomadic Tribes", civType: "nomadic" },
    { id: "cuman_khanates", nameZh: "库曼汗国", nameEn: "Cuman Khanates", basemapName: "Cuman Khanates", civType: "nomadic" },
    { id: "novgorod_republic", nameZh: "诺夫哥罗德公国", nameEn: "Principality of Novgorod", basemapName: "Principality of Novgorod", civType: "republic", capitalZh: "诺夫哥罗德", capitalEn: "Novgorod" },
    { id: "croatia_1200", nameZh: "克罗地亚", nameEn: "Croatia", basemapName: "Croatia", civType: "kingdom" },
    { id: "nepal_1200", nameZh: "尼泊尔", nameEn: "Nepal", basemapName: "Nepal", civType: "kingdom" },
    { id: "taiwanese_tribes", nameZh: "台湾原住民", nameEn: "Taiwanese Tribes", basemapName: "Taiwanese Tribes", civType: "tribal" },
    { id: "merina_1200", nameZh: "梅里纳王国", nameEn: "Kingdom of Merina", basemapName: "Expansionist Kingdom of Merina", civType: "kingdom" },
    { id: "khoisan_1200", nameZh: "科伊桑人", nameEn: "Khoisan Peoples", basemapName: "Khoiasan", civType: "tribal" },
    { id: "pampas_1200", nameZh: "潘帕斯文化", nameEn: "Pampas Cultures", basemapName: "Pampas cultures", civType: "tribal" },
    { id: "australian_aboriginals_1200", nameZh: "澳大利亚原住民", nameEn: "Australian Aboriginals", basemapName: "Australian aboriginal hunter-gatherers", civType: "tribal" },
    { id: "tui_tonga_1200", nameZh: "汤加帝国", nameEn: "Tu'i Tonga Empire", basemapName: "Tuʻi Tonga Empire", civType: "kingdom" },
    { id: "kara_khitai", nameZh: "西辽", nameEn: "Kara-Khitai", basemapName: "Kara Khitai Khaganate", civType: "empire" },
    { id: "srivijaya_1200", nameZh: "三佛齐", nameEn: "Srivijaya Empire", basemapName: "Srivijaya Empire", civType: "empire" },
    { id: "bhutan_1200", nameZh: "不丹", nameEn: "Bhutan", basemapName: "Bhutan", civType: "kingdom" },
    { id: "volga_bulgars", nameZh: "伏尔加保加尔", nameEn: "Volga Bulgars", basemapName: "Volga Bulgars", civType: "kingdom" },
    { id: "vladimir_suzdal", nameZh: "弗拉基米尔-苏兹达尔公国", nameEn: "Principality of Vladimir-Suzdal", basemapName: "Principality of Vladimir-Suzdal", civType: "kingdom" },
    { id: "savanna_1200", nameZh: "热带草原采集者", nameEn: "Savanna Peoples", basemapName: "Savanna hunter-gatherers", civType: "tribal" },
  ],

  // ==================== MONGOL EMPIRE (1280) ====================
  "mongol-empire": [
    { id: "polynesian_1280", nameZh: "波利尼西亚人", nameEn: "Polynesians", basemapName: "Polynesians", civType: "tribal" },
    { id: "great_zimbabwe_1280", nameZh: "大津巴布韦", nameEn: "Great Zimbabwe", basemapName: "Great Zimbabwe", civType: "kingdom" },
    { id: "taino_1280", nameZh: "泰诺人", nameEn: "Taíno People", basemapName: "Taino", civType: "tribal" },
    { id: "merina_1280", nameZh: "梅里纳王国", nameEn: "Kingdom of Merina", basemapName: "Expansionist Kingdom of Merina", civType: "kingdom" },
    { id: "srivijaya_1280", nameZh: "三佛齐", nameEn: "Srivijaya Empire", basemapName: "Srivijaya Empire", civType: "empire" },
    { id: "australian_aboriginals_1280", nameZh: "澳大利亚原住民", nameEn: "Australian Aboriginals", basemapName: "Australian aboriginal hunter-gatherers", civType: "tribal" },
    { id: "khoisan_1280", nameZh: "科伊桑人", nameEn: "Khoisan Peoples", basemapName: "Khoiasan", civType: "tribal" },
    { id: "savanna_1280", nameZh: "热带草原采集者", nameEn: "Savanna Peoples", basemapName: "Savanna hunter-gatherers", civType: "tribal" },
    { id: "pampas_1280", nameZh: "潘帕斯文化", nameEn: "Pampas Cultures", basemapName: "Pampas cultures", civType: "tribal" },
    { id: "tui_tonga_1280", nameZh: "汤加帝国", nameEn: "Tu'i Tonga Empire", basemapName: "Tuʻi Tonga Empire", civType: "kingdom" },
    { id: "nepal_1280", nameZh: "尼泊尔", nameEn: "Nepal", basemapName: "Nepal", civType: "kingdom" },
  ],

  // ==================== RENAISSANCE (1500) ====================
  "renaissance": [
    { id: "iroquois_1500", nameZh: "易洛魁联盟", nameEn: "Iroquois Confederacy", basemapName: "Iroquois", civType: "confederation" as CivType },
    { id: "crimean_khanate_1500", nameZh: "克里米亚汗国", nameEn: "Crimean Khanate", basemapName: "Crimean Khanate", civType: "kingdom" },
    { id: "bornu_kanem_1500", nameZh: "博尔努-卡涅姆", nameEn: "Bornu-Kanem", basemapName: "Bornu-Kanem", civType: "empire" },
    { id: "benin_1500", nameZh: "贝宁王国", nameEn: "Kingdom of Benin", basemapName: "Benin", civType: "kingdom" },
    { id: "kongo_1500", nameZh: "刚果王国", nameEn: "Kingdom of Kongo", basemapName: "Congo", civType: "kingdom" },
    { id: "merina_1500", nameZh: "梅里纳王国", nameEn: "Kingdom of Merina", basemapName: "Expansionist Kingdom of Merina", civType: "kingdom" },
    { id: "maori_1500", nameZh: "毛利人", nameEn: "Māori People", basemapName: "Maori", civType: "tribal" },
    { id: "arakan_1500", nameZh: "阿拉干王国", nameEn: "Kingdom of Arakan", basemapName: "Arakan", civType: "kingdom" },
    { id: "polynesian_1500", nameZh: "波利尼西亚人", nameEn: "Polynesians", basemapName: "Polynesians", civType: "tribal" },
    { id: "hausa_states_1500", nameZh: "豪萨城邦", nameEn: "Hausa States", basemapName: "Hausa States", civType: "city_state" },
    { id: "oyo_1500", nameZh: "奥约帝国", nameEn: "Oyo Empire", basemapName: "Oyo", civType: "empire" },
    { id: "khoisan_1500", nameZh: "科伊桑人", nameEn: "Khoisan Peoples", basemapName: "Khoiasan", civType: "tribal" },
    { id: "australian_aboriginals_1500", nameZh: "澳大利亚原住民", nameEn: "Australian Aboriginals", basemapName: "Australian aboriginal hunter-gatherers", civType: "tribal" },
    { id: "tui_tonga_1500", nameZh: "汤加帝国", nameEn: "Tu'i Tonga Empire", basemapName: "Tuʻi Tonga Empire", civType: "kingdom" },
    { id: "pampas_1500", nameZh: "潘帕斯文化", nameEn: "Pampas Cultures", basemapName: "Pampas cultures", civType: "tribal" },
    { id: "mossi_states_1500", nameZh: "莫西诸国", nameEn: "Mossi States", basemapName: "Mossi States", civType: "kingdom" },
    { id: "islamic_city_states_ea", nameZh: "东非伊斯兰城邦", nameEn: "East African Islamic City-States", basemapName: "Islamic city-states", civType: "city_state" },
  ],

  // ==================== EARLY MODERN (1648) ====================
  "early-modern": [
    { id: "cherokee_1648", nameZh: "切罗基人", nameEn: "Cherokee", basemapName: "Cherokee", civType: "tribal" },
    { id: "comanche_1648", nameZh: "科曼奇人", nameEn: "Comanche", basemapName: "Comanche", civType: "nomadic" },
    { id: "cree_1648", nameZh: "克里人", nameEn: "Cree", basemapName: "Cree", civType: "tribal" },
    { id: "luba_kingdom", nameZh: "卢巴王国", nameEn: "Luba Kingdom", basemapName: "Luba", civType: "kingdom" },
    { id: "lunda_empire", nameZh: "隆达帝国", nameEn: "Lunda Empire", basemapName: "Lunda", civType: "empire" },
    { id: "merina_1648", nameZh: "梅里纳王国", nameEn: "Kingdom of Merina", basemapName: "Expansionist Kingdom of Merina", civType: "kingdom" },
    { id: "bagirmi_1648", nameZh: "巴吉尔米苏丹国", nameEn: "Bagirmi Sultanate", basemapName: "Bagirmi", civType: "kingdom" },
    { id: "arakan_1648", nameZh: "阿拉干王国", nameEn: "Kingdom of Arakan", basemapName: "Arakan", civType: "kingdom" },
    { id: "australian_aboriginals_1648", nameZh: "澳大利亚原住民", nameEn: "Australian Aboriginals", basemapName: "Australian aboriginal hunter-gatherers", civType: "tribal" },
    { id: "polynesian_1648", nameZh: "波利尼西亚人", nameEn: "Polynesians", basemapName: "Polynesians", civType: "tribal" },
    { id: "khoisan_1648", nameZh: "科伊桑人", nameEn: "Khoisan Peoples", basemapName: "Khoiasan", civType: "tribal" },
    { id: "pampas_1648", nameZh: "潘帕斯文化", nameEn: "Pampas Cultures", basemapName: "Pampas cultures", civType: "tribal" },
    { id: "tui_tonga_1648", nameZh: "汤加帝国", nameEn: "Tu'i Tonga Empire", basemapName: "Tuʻi Tonga Empire", civType: "kingdom" },
    { id: "ceylon_1648", nameZh: "锡兰", nameEn: "Ceylon", basemapName: "Ceylon", civType: "kingdom" },
  ],

  // ==================== ENLIGHTENMENT (1750) ====================
  "enlightenment": [
    { id: "cape_colony_1750", nameZh: "开普殖民地", nameEn: "Cape Colony", basemapName: "Cape Colony", civType: "colonial_administration" as CivType },
    { id: "assam_1750", nameZh: "阿萨姆", nameEn: "Assam", basemapName: "Assam", civType: "kingdom" },
    { id: "bhutan_1750", nameZh: "不丹", nameEn: "Bhutan", basemapName: "Bhutan", civType: "kingdom" },
    { id: "nepal_1750", nameZh: "尼泊尔", nameEn: "Nepal", basemapName: "Nepal", civType: "kingdom", capitalZh: "加德满都", capitalEn: "Kathmandu" },
    { id: "polynesian_1750", nameZh: "波利尼西亚人", nameEn: "Polynesians", basemapName: "Polynesians", civType: "tribal" },
    { id: "khoisan_1750", nameZh: "科伊桑人", nameEn: "Khoisan Peoples", basemapName: "Khoiasan", civType: "tribal" },
    { id: "australian_aboriginals_1750", nameZh: "澳大利亚原住民", nameEn: "Australian Aboriginals", basemapName: "Australian aboriginal hunter-gatherers", civType: "tribal" },
    { id: "pampas_1750", nameZh: "潘帕斯文化", nameEn: "Pampas Cultures", basemapName: "Pampas cultures", civType: "tribal" },
    { id: "luba_1750", nameZh: "卢巴王国", nameEn: "Luba Kingdom", basemapName: "Luba", civType: "kingdom" },
    { id: "lunda_1750", nameZh: "隆达帝国", nameEn: "Lunda Empire", basemapName: "Lunda", civType: "empire" },
    { id: "lozi_1750", nameZh: "洛兹王国", nameEn: "Lozi Kingdom", basemapName: "Lozi", civType: "kingdom" },
    { id: "kong_empire_1750", nameZh: "孔帝国", nameEn: "Kong Empire", basemapName: "Kong Empire", civType: "empire" },
    { id: "ceylon_1750", nameZh: "锡兰（荷兰）", nameEn: "Ceylon (Dutch)", basemapName: "Ceylon (Dutch)", civType: "kingdom" },
  ],

  // ==================== INDUSTRIAL REVOLUTION (1840) ====================
  "industrial-revolution": [
    { id: "buganda_1840", nameZh: "布干达王国", nameEn: "Buganda Kingdom", basemapName: "Buganda", civType: "kingdom" },
    { id: "bunyoro_1840", nameZh: "布尼奥罗王国", nameEn: "Bunyoro Kingdom", basemapName: "Bunyoro", civType: "kingdom" },
    { id: "lozi_1840", nameZh: "洛兹王国", nameEn: "Lozi Kingdom", basemapName: "Lozi", civType: "kingdom" },
    { id: "lunda_1840", nameZh: "隆达帝国", nameEn: "Lunda Empire", basemapName: "Lunda", civType: "empire" },
    { id: "cape_colony_1840", nameZh: "开普殖民地", nameEn: "Cape Colony", basemapName: "Cape Colony", civType: "colonial_administration" as CivType },
    { id: "arakan_1840", nameZh: "阿拉干", nameEn: "Arakan", basemapName: "Arakan", civType: "kingdom" },
    { id: "assam_1840", nameZh: "阿萨姆", nameEn: "Assam", basemapName: "Assam", civType: "kingdom" },
    { id: "burundi_1840", nameZh: "布隆迪", nameEn: "Burundi", basemapName: "Burundi", civType: "kingdom" },
    { id: "kazembe_1840", nameZh: "卡泽姆贝", nameEn: "Kazembe", basemapName: "Kazembe", civType: "kingdom" },
    { id: "bhutan_1840", nameZh: "不丹", nameEn: "Bhutan", basemapName: "Bhutan", civType: "kingdom" },
    { id: "pampas_1840", nameZh: "潘帕斯文化", nameEn: "Pampas Cultures", basemapName: "Pampas cultures", civType: "tribal" },
    { id: "australian_aboriginals_1840", nameZh: "澳大利亚原住民", nameEn: "Australian Aboriginals", basemapName: "Australian aboriginal hunter-gatherers", civType: "tribal" },
  ],

  // ==================== IMPERIALISM (1900) ====================
  "imperialism": [
    { id: "buganda_1900", nameZh: "布干达王国", nameEn: "Buganda", basemapName: "Buganda", civType: "kingdom" },
    { id: "bunyoro_1900", nameZh: "布尼奥罗王国", nameEn: "Bunyoro", basemapName: "Bunyoro", civType: "kingdom" },
    { id: "rwanda_1900", nameZh: "卢旺达", nameEn: "Rwanda", basemapName: "Rwanda", civType: "kingdom" },
    { id: "burundi_1900", nameZh: "布隆迪", nameEn: "Burundi", basemapName: "Burundi", civType: "kingdom" },
    { id: "luba_1900", nameZh: "卢巴", nameEn: "Luba", basemapName: "Luba", civType: "kingdom" },
    { id: "lunda_1900", nameZh: "隆达", nameEn: "Lunda", basemapName: "Lunda", civType: "empire" },
    { id: "lozi_1900", nameZh: "洛兹", nameEn: "Lozi (Barotse)", basemapName: "Barotse", civType: "kingdom" },
    { id: "fiji_1900", nameZh: "斐济", nameEn: "Fiji", basemapName: "Fiji", civType: "kingdom" },
    { id: "hawaii_1900", nameZh: "夏威夷王国", nameEn: "Kingdom of Hawaii", basemapName: "Kingdom of Hawaii", civType: "kingdom" },
    { id: "cape_colony_1900", nameZh: "开普殖民地", nameEn: "Cape Colony", basemapName: "Cape Colony", civType: "colonial_administration" as CivType },
    { id: "ndebele_1900", nameZh: "恩德贝莱", nameEn: "Ndebele", basemapName: "Ndebele", civType: "kingdom" },
    { id: "canada_1900", nameZh: "加拿大", nameEn: "Canada", basemapName: "Canada", civType: "kingdom", capitalZh: "渥太华", capitalEn: "Ottawa" },
    { id: "colombia_1900", nameZh: "哥伦比亚", nameEn: "Colombia", basemapName: "Colombia", civType: "republic" },
    { id: "ecuador_1900", nameZh: "厄瓜多尔", nameEn: "Ecuador", basemapName: "Ecuador", civType: "republic" },
    { id: "venezuela_1900", nameZh: "委内瑞拉", nameEn: "Venezuela", basemapName: "Venezuela", civType: "republic" },
    { id: "paraguay_1900", nameZh: "巴拉圭", nameEn: "Paraguay", basemapName: "Paraguay", civType: "republic" },
    { id: "uruguay_1900", nameZh: "乌拉圭", nameEn: "Uruguay", basemapName: "Uruguay", civType: "republic" },
    { id: "greece_1900", nameZh: "希腊", nameEn: "Greece", basemapName: "Greece", civType: "kingdom" },
    { id: "bulgaria_1900", nameZh: "保加利亚", nameEn: "Bulgaria", basemapName: "Bulgaria", civType: "kingdom" },
    { id: "montenegro_1900", nameZh: "黑山", nameEn: "Montenegro", basemapName: "Montenegro", civType: "kingdom" },
  ],

  // ==================== WORLD WAR ERA (1939) ====================
  "world-war-era": [
    { id: "finland_1939", nameZh: "芬兰", nameEn: "Finland", basemapName: "Finland", civType: "republic", capitalZh: "赫尔辛基", capitalEn: "Helsinki" },
    { id: "ireland_1939", nameZh: "爱尔兰", nameEn: "Ireland", basemapName: "Ireland", civType: "republic", capitalZh: "都柏林", capitalEn: "Dublin" },
    { id: "hungary_1939", nameZh: "匈牙利", nameEn: "Hungary", basemapName: "Hungary", civType: "kingdom", capitalZh: "布达佩斯", capitalEn: "Budapest" },
    { id: "romania_1939", nameZh: "罗马尼亚", nameEn: "Romania", basemapName: "Romania", civType: "kingdom", capitalZh: "布加勒斯特", capitalEn: "Bucharest" },
    { id: "thailand_1939", nameZh: "泰国", nameEn: "Thailand (Siam)", basemapName: "Siam", civType: "kingdom", capitalZh: "曼谷", capitalEn: "Bangkok" },
    { id: "brazil_1939", nameZh: "巴西", nameEn: "Brazil", basemapName: "Brazil", civType: "republic", capitalZh: "里约热内卢", capitalEn: "Rio de Janeiro" },
    { id: "argentina_1939", nameZh: "阿根廷", nameEn: "Argentina", basemapName: "Argentina", civType: "republic", capitalZh: "布宜诺斯艾利斯", capitalEn: "Buenos Aires" },
    { id: "australia_1939", nameZh: "澳大利亚", nameEn: "Australia", basemapName: "Australia", civType: "kingdom", capitalZh: "堪培拉", capitalEn: "Canberra" },
    { id: "new_zealand_1939", nameZh: "新西兰", nameEn: "New Zealand", basemapName: "New Zealand", civType: "kingdom" },
    { id: "greece_1939", nameZh: "希腊", nameEn: "Greece", basemapName: "Greece", civType: "kingdom", capitalZh: "雅典", capitalEn: "Athens" },
    { id: "belgium_1939", nameZh: "比利时", nameEn: "Belgium", basemapName: "Belgium", civType: "kingdom", capitalZh: "布鲁塞尔", capitalEn: "Brussels" },
    { id: "netherlands_1939", nameZh: "荷兰", nameEn: "Netherlands", basemapName: "Netherlands", civType: "kingdom", capitalZh: "阿姆斯特丹", capitalEn: "Amsterdam" },
    { id: "switzerland_1939", nameZh: "瑞士", nameEn: "Switzerland", basemapName: "Switzerland", civType: "republic", capitalZh: "伯尔尼", capitalEn: "Bern" },
    { id: "albania_1939", nameZh: "阿尔巴尼亚", nameEn: "Albania", basemapName: "Albania", civType: "kingdom" },
    { id: "bulgaria_1939", nameZh: "保加利亚", nameEn: "Bulgaria", basemapName: "Bulgaria", civType: "kingdom" },
    { id: "estonia_1939", nameZh: "爱沙尼亚", nameEn: "Estonia", basemapName: "Estonia", civType: "republic" },
    { id: "latvia_1939", nameZh: "拉脱维亚", nameEn: "Latvia", basemapName: "Latvia", civType: "republic" },
    { id: "lithuania_1939", nameZh: "立陶宛", nameEn: "Lithuania", basemapName: "Lithuania", civType: "republic" },
    { id: "chile_1939", nameZh: "智利", nameEn: "Chile", basemapName: "Chile", civType: "republic" },
    { id: "peru_1939", nameZh: "秘鲁", nameEn: "Peru", basemapName: "Peru", civType: "republic" },
    { id: "colombia_1939", nameZh: "哥伦比亚", nameEn: "Colombia", basemapName: "Colombia", civType: "republic" },
    { id: "venezuela_1939", nameZh: "委内瑞拉", nameEn: "Venezuela", basemapName: "Venezuela", civType: "republic" },
  ],

  // ==================== COLD WAR (1962) ====================
  "cold-war": [
    { id: "algeria_1962", nameZh: "阿尔及利亚", nameEn: "Algeria", basemapName: "Algeria", civType: "republic" },
    { id: "morocco_1962", nameZh: "摩洛哥", nameEn: "Morocco", basemapName: "Morocco", civType: "kingdom" },
    { id: "tunisia_1962", nameZh: "突尼斯", nameEn: "Tunisia", basemapName: "Tunisia", civType: "republic" },
    { id: "libya_1962", nameZh: "利比亚", nameEn: "Libya", basemapName: "Libya", civType: "kingdom" },
    { id: "cameroon_1962", nameZh: "喀麦隆", nameEn: "Cameroon", basemapName: "Cameroon", civType: "republic" },
    { id: "mali_1962", nameZh: "马里", nameEn: "Mali", basemapName: "Mali", civType: "republic" },
    { id: "senegal_1962", nameZh: "塞内加尔", nameEn: "Senegal", basemapName: "Senegal", civType: "republic" },
    { id: "ivory_coast_1962", nameZh: "科特迪瓦", nameEn: "Ivory Coast", basemapName: "Ivory Coast", civType: "republic" },
    { id: "guinea_1962", nameZh: "几内亚", nameEn: "Guinea", basemapName: "Guinea", civType: "republic" },
    { id: "madagascar_1962", nameZh: "马达加斯加", nameEn: "Madagascar", basemapName: "Madagascar", civType: "republic" },
    { id: "tanzania_1962", nameZh: "坦桑尼亚", nameEn: "Tanzania", basemapName: "Tanzania, United Republic of", civType: "republic" },
    { id: "uganda_1962", nameZh: "乌干达", nameEn: "Uganda", basemapName: "Uganda", civType: "republic" },
    { id: "nepal_1962", nameZh: "尼泊尔", nameEn: "Nepal", basemapName: "Nepal", civType: "kingdom" },
    { id: "finland_1962", nameZh: "芬兰", nameEn: "Finland", basemapName: "Finland", civType: "republic" },
    { id: "ireland_1962", nameZh: "爱尔兰", nameEn: "Ireland", basemapName: "Ireland", civType: "republic" },
    { id: "austria_1962", nameZh: "奥地利", nameEn: "Austria", basemapName: "Austria", civType: "republic" },
    { id: "romania_1962", nameZh: "罗马尼亚", nameEn: "Romania", basemapName: "Romania", civType: "republic" },
    { id: "hungary_1962", nameZh: "匈牙利", nameEn: "Hungary", basemapName: "Hungary", civType: "republic" },
    { id: "australia_1962", nameZh: "澳大利亚", nameEn: "Australia", basemapName: "Australia", civType: "republic" },
    { id: "new_zealand_1962", nameZh: "新西兰", nameEn: "New Zealand", basemapName: "New Zealand", civType: "kingdom" },
    { id: "colombia_1962", nameZh: "哥伦比亚", nameEn: "Colombia", basemapName: "Colombia", civType: "republic" },
    { id: "venezuela_1962", nameZh: "委内瑞拉", nameEn: "Venezuela", basemapName: "Venezuela", civType: "republic" },
    { id: "chile_1962", nameZh: "智利", nameEn: "Chile", basemapName: "Chile", civType: "republic" },
    { id: "bolivia_1962", nameZh: "玻利维亚", nameEn: "Bolivia", basemapName: "Bolivia", civType: "republic" },
    { id: "ecuador_1962", nameZh: "厄瓜多尔", nameEn: "Ecuador", basemapName: "Ecuador", civType: "republic" },
    { id: "iraq_1962", nameZh: "伊拉克", nameEn: "Iraq", basemapName: "Iraq", civType: "republic" },
    { id: "rwanda_1962", nameZh: "卢旺达", nameEn: "Rwanda", basemapName: "Rwanda", civType: "republic" },
    { id: "chad_1962", nameZh: "乍得", nameEn: "Chad", basemapName: "Chad", civType: "republic" },
    { id: "niger_1962", nameZh: "尼日尔", nameEn: "Niger", basemapName: "Niger", civType: "republic" },
  ],

  // ==================== MODERN ERA (2000) ====================
  "modern-era": [
    { id: "modern_australia", nameZh: "澳大利亚", nameEn: "Australia", basemapName: "Australia", civType: "republic", capitalZh: "堪培拉", capitalEn: "Canberra" },
    { id: "modern_new_zealand", nameZh: "新西兰", nameEn: "New Zealand", basemapName: "New Zealand", civType: "kingdom" },
    { id: "modern_egypt", nameZh: "埃及", nameEn: "Egypt", basemapName: "Egypt", civType: "republic", capitalZh: "开罗", capitalEn: "Cairo" },
    { id: "modern_south_korea", nameZh: "韩国", nameEn: "South Korea", basemapName: "Korea, Republic of", civType: "republic", capitalZh: "首尔", capitalEn: "Seoul" },
    { id: "modern_north_korea", nameZh: "朝鲜", nameEn: "North Korea", basemapName: "Korea, Democratic People's Republic of", civType: "communist_state" as CivType },
    { id: "modern_indonesia", nameZh: "印度尼西亚", nameEn: "Indonesia", basemapName: "Indonesia", civType: "republic", capitalZh: "雅加达", capitalEn: "Jakarta" },
    { id: "modern_thailand", nameZh: "泰国", nameEn: "Thailand", basemapName: "Thailand", civType: "kingdom", capitalZh: "曼谷", capitalEn: "Bangkok" },
    { id: "modern_vietnam", nameZh: "越南", nameEn: "Vietnam", basemapName: "Vietnam", civType: "republic", capitalZh: "河内", capitalEn: "Hanoi" },
    { id: "modern_philippines", nameZh: "菲律宾", nameEn: "Philippines", basemapName: "Philippines", civType: "republic", capitalZh: "马尼拉", capitalEn: "Manila" },
    { id: "modern_malaysia", nameZh: "马来西亚", nameEn: "Malaysia", basemapName: "Malaysia", civType: "kingdom", capitalZh: "吉隆坡", capitalEn: "Kuala Lumpur" },
    { id: "modern_nigeria", nameZh: "尼日利亚", nameEn: "Nigeria", basemapName: "Nigeria", civType: "republic", capitalZh: "阿布贾", capitalEn: "Abuja" },
    { id: "modern_south_africa", nameZh: "南非", nameEn: "South Africa", basemapName: "South Africa", civType: "republic", capitalZh: "比勒陀利亚", capitalEn: "Pretoria" },
    { id: "modern_kenya", nameZh: "肯尼亚", nameEn: "Kenya", basemapName: "Kenya", civType: "republic", capitalZh: "内罗毕", capitalEn: "Nairobi" },
    { id: "modern_ethiopia_2000", nameZh: "埃塞俄比亚", nameEn: "Ethiopia", basemapName: "Ethiopia", civType: "republic", capitalZh: "亚的斯亚贝巴", capitalEn: "Addis Ababa" },
    { id: "modern_colombia", nameZh: "哥伦比亚", nameEn: "Colombia", basemapName: "Colombia", civType: "republic" },
    { id: "modern_argentina", nameZh: "阿根廷", nameEn: "Argentina", basemapName: "Argentina", civType: "republic" },
    { id: "modern_poland", nameZh: "波兰", nameEn: "Poland", basemapName: "Poland", civType: "republic" },
    { id: "modern_ukraine", nameZh: "乌克兰", nameEn: "Ukraine", basemapName: "Ukraine", civType: "republic" },
    { id: "modern_saudi_arabia", nameZh: "沙特阿拉伯", nameEn: "Saudi Arabia", basemapName: "Saudi Arabia", civType: "kingdom" },
    { id: "modern_iran", nameZh: "伊朗", nameEn: "Iran", basemapName: "Iran", civType: "theocracy" },
  ],
};

// ============================================================
// Main: read seed, append, write
// ============================================================

const SEED_DIR = path.join(process.cwd(), "src", "data", "seed");

async function main() {
  let totalAdded = 0;

  for (const [eraId, additions] of Object.entries(ERA_ADDITIONS)) {
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
