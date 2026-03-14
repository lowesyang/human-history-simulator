import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const catalogPath = join(root, "src/data/economic/asset-catalog.json");
const pricesPath = join(root, "src/data/economic/asset-prices.json");

const catalog = JSON.parse(readFileSync(catalogPath, "utf-8"));
const prices = JSON.parse(readFileSync(pricesPath, "utf-8"));

const existingIds = new Set(catalog.assets.map((a) => a.id));
const existingPriceIds = new Set(prices.assets.map((a) => a.id));

const newCatalog = [];
const newPrices = [];

function addAsset(cat, price) {
  if (existingIds.has(cat.id)) {
    console.log(`SKIP catalog: ${cat.id} already exists`);
  } else {
    newCatalog.push(cat);
  }
  if (existingPriceIds.has(price.id)) {
    console.log(`SKIP prices: ${price.id} already exists`);
  } else {
    newPrices.push(price);
  }
}

// ─── PRECIOUS METALS ────────────────────────────────────────────
addAsset(
  {
    id: "rhodium",
    name: { zh: "铑", en: "Rhodium" },
    ticker: "RHOD",
    category: "precious_metal",
    icon: "precious",
    description: {
      zh: "最稀有的贵金属，催化转换器关键材料",
      en: "Rarest precious metal, critical for catalytic converters",
    },
    riskLevel: 4,
    availableFrom: 1803,
    availableTo: 2023,
  },
  {
    id: "rhodium",
    name: { zh: "铑", en: "Rhodium" },
    category: "precious_metal",
    unit: "gram",
    availableFrom: 1803,
    availableTo: 2023,
    baseVolatility: 0.25,
    priceHistory: [
      { year: 1803, price: 0.8 },
      { year: 1900, price: 1.2 },
      { year: 1970, price: 2.0 },
      { year: 2000, price: 3.0 },
      { year: 2008, price: 5.0 },
      { year: 2021, price: 15.0 },
      { year: 2023, price: 2.5 },
    ],
  },
);

// ─── INDUSTRIAL METALS ──────────────────────────────────────────
addAsset(
  {
    id: "lithium",
    name: { zh: "锂", en: "Lithium" },
    ticker: "LITH",
    category: "industrial_metal",
    icon: "metal",
    description: {
      zh: "电池革命的核心金属",
      en: "Core metal of the battery revolution",
    },
    riskLevel: 4,
    availableFrom: 1817,
    availableTo: 2023,
  },
  {
    id: "lithium",
    name: { zh: "锂", en: "Lithium" },
    category: "industrial_metal",
    unit: "kg",
    availableFrom: 1817,
    availableTo: 2023,
    baseVolatility: 0.2,
    priceHistory: [
      { year: 1817, price: 0.01 },
      { year: 1950, price: 0.02 },
      { year: 2000, price: 0.05 },
      { year: 2015, price: 0.1 },
      { year: 2021, price: 0.6 },
      { year: 2022, price: 1.2 },
      { year: 2023, price: 0.3 },
    ],
  },
);

addAsset(
  {
    id: "cobalt",
    name: { zh: "钴", en: "Cobalt" },
    ticker: "CBLT",
    category: "industrial_metal",
    icon: "metal",
    description: {
      zh: "电池与航空合金的战略金属",
      en: "Strategic metal for batteries and aerospace alloys",
    },
    riskLevel: 4,
    availableFrom: 1735,
    availableTo: 2023,
  },
  {
    id: "cobalt",
    name: { zh: "钴", en: "Cobalt" },
    category: "industrial_metal",
    unit: "kg",
    availableFrom: 1735,
    availableTo: 2023,
    baseVolatility: 0.18,
    priceHistory: [
      { year: 1735, price: 0.01 },
      { year: 1900, price: 0.05 },
      { year: 1970, price: 0.1 },
      { year: 2000, price: 0.3 },
      { year: 2018, price: 1.2 },
      { year: 2023, price: 0.5 },
    ],
  },
);

addAsset(
  {
    id: "manganese",
    name: { zh: "锰", en: "Manganese" },
    ticker: "MANG",
    category: "industrial_metal",
    icon: "metal",
    description: {
      zh: "炼钢不可或缺的合金元素",
      en: "Essential alloying element for steelmaking",
    },
    riskLevel: 2,
    availableFrom: 1774,
    availableTo: 2023,
  },
  {
    id: "manganese",
    name: { zh: "锰", en: "Manganese" },
    category: "industrial_metal",
    unit: "kg",
    availableFrom: 1774,
    availableTo: 2023,
    baseVolatility: 0.1,
    priceHistory: [
      { year: 1774, price: 0.005 },
      { year: 1900, price: 0.01 },
      { year: 2000, price: 0.02 },
      { year: 2023, price: 0.03 },
    ],
  },
);

// ─── GRAINS ────────────────────────────────────────────────────
addAsset(
  {
    id: "oats",
    name: { zh: "燕麦", en: "Oats" },
    ticker: "OATS",
    category: "grain",
    icon: "grain",
    description: {
      zh: "北方主要谷物，饲料与食品",
      en: "Northern cereal grain for feed and food",
    },
    riskLevel: 2,
    availableFrom: -3000,
    availableTo: 2023,
  },
  {
    id: "oats",
    name: { zh: "燕麦", en: "Oats" },
    category: "grain",
    unit: "kg",
    availableFrom: -3000,
    availableTo: 2023,
    baseVolatility: 0.1,
    priceHistory: [
      { year: -3000, price: 0.005 },
      { year: 0, price: 0.004 },
      { year: 1800, price: 0.003 },
      { year: 2000, price: 0.003 },
      { year: 2023, price: 0.004 },
    ],
  },
);

addAsset(
  {
    id: "soybean_oil",
    name: { zh: "豆油", en: "Soybean Oil" },
    ticker: "SOYO",
    category: "grain",
    icon: "grain",
    description: {
      zh: "全球最大宗植物油",
      en: "World's most traded vegetable oil",
    },
    riskLevel: 2,
    availableFrom: 1900,
    availableTo: 2023,
  },
  {
    id: "soybean_oil",
    name: { zh: "豆油", en: "Soybean Oil" },
    category: "grain",
    unit: "kg",
    availableFrom: 1900,
    availableTo: 2023,
    baseVolatility: 0.12,
    priceHistory: [
      { year: 1900, price: 0.005 },
      { year: 1950, price: 0.008 },
      { year: 2000, price: 0.01 },
      { year: 2022, price: 0.02 },
      { year: 2023, price: 0.015 },
    ],
  },
);

// ─── COMMODITIES (from Yahoo Finance Futures) ───────────────────
addAsset(
  {
    id: "orange_juice",
    name: { zh: "橙汁", en: "Orange Juice" },
    ticker: "OJ",
    category: "commodity",
    icon: "commodity",
    description: {
      zh: "浓缩橙汁期货标的",
      en: "Frozen concentrate orange juice futures",
    },
    riskLevel: 3,
    availableFrom: 1500,
    availableTo: 2023,
  },
  {
    id: "orange_juice",
    name: { zh: "橙汁", en: "Orange Juice" },
    category: "commodity",
    unit: "lb",
    availableFrom: 1500,
    availableTo: 2023,
    baseVolatility: 0.15,
    priceHistory: [
      { year: 1500, price: 0.01 },
      { year: 1800, price: 0.008 },
      { year: 1960, price: 0.01 },
      { year: 2000, price: 0.015 },
      { year: 2023, price: 0.03 },
    ],
  },
);

addAsset(
  {
    id: "lumber",
    name: { zh: "木材期货", en: "Lumber" },
    ticker: "LMBR",
    category: "commodity",
    icon: "commodity",
    description: {
      zh: "随机长度木材期货，建筑业基石",
      en: "Random length lumber futures, construction staple",
    },
    riskLevel: 3,
    availableFrom: -3000,
    availableTo: 2023,
  },
  {
    id: "lumber",
    name: { zh: "木材期货", en: "Lumber" },
    category: "commodity",
    unit: "board_foot",
    availableFrom: -3000,
    availableTo: 2023,
    baseVolatility: 0.18,
    priceHistory: [
      { year: -3000, price: 0.001 },
      { year: 0, price: 0.002 },
      { year: 1800, price: 0.003 },
      { year: 2000, price: 0.005 },
      { year: 2021, price: 0.02 },
      { year: 2023, price: 0.006 },
    ],
  },
);

addAsset(
  {
    id: "live_cattle",
    name: { zh: "活牛", en: "Live Cattle" },
    ticker: "CATL",
    category: "commodity",
    icon: "commodity",
    description: {
      zh: "芝加哥商品交易所活牛期货",
      en: "CME live cattle futures",
    },
    riskLevel: 2,
    availableFrom: -8000,
    availableTo: 2023,
  },
  {
    id: "live_cattle",
    name: { zh: "活牛", en: "Live Cattle" },
    category: "commodity",
    unit: "cwt",
    availableFrom: -8000,
    availableTo: 2023,
    baseVolatility: 0.08,
    priceHistory: [
      { year: -8000, price: 0.5 },
      { year: -2000, price: 1.0 },
      { year: 0, price: 0.8 },
      { year: 1800, price: 0.6 },
      { year: 1960, price: 0.3 },
      { year: 2000, price: 0.5 },
      { year: 2023, price: 2.5 },
    ],
  },
);

addAsset(
  {
    id: "lean_hogs",
    name: { zh: "瘦猪肉", en: "Lean Hogs" },
    ticker: "HOGS",
    category: "commodity",
    icon: "commodity",
    description: { zh: "芝加哥商品交易所瘦猪期货", en: "CME lean hog futures" },
    riskLevel: 3,
    availableFrom: -7000,
    availableTo: 2023,
  },
  {
    id: "lean_hogs",
    name: { zh: "瘦猪肉", en: "Lean Hogs" },
    category: "commodity",
    unit: "cwt",
    availableFrom: -7000,
    availableTo: 2023,
    baseVolatility: 0.12,
    priceHistory: [
      { year: -7000, price: 0.3 },
      { year: 0, price: 0.4 },
      { year: 1800, price: 0.3 },
      { year: 1960, price: 0.2 },
      { year: 2000, price: 0.4 },
      { year: 2023, price: 1.2 },
    ],
  },
);

addAsset(
  {
    id: "palm_oil",
    name: { zh: "棕榈油", en: "Palm Oil" },
    ticker: "PLMO",
    category: "commodity",
    icon: "commodity",
    description: {
      zh: "全球产量最大的植物油",
      en: "World's most produced vegetable oil",
    },
    riskLevel: 2,
    availableFrom: 1800,
    availableTo: 2023,
  },
  {
    id: "palm_oil",
    name: { zh: "棕榈油", en: "Palm Oil" },
    category: "commodity",
    unit: "ton",
    availableFrom: 1800,
    availableTo: 2023,
    baseVolatility: 0.1,
    priceHistory: [
      { year: 1800, price: 0.3 },
      { year: 1900, price: 0.4 },
      { year: 1960, price: 0.3 },
      { year: 2000, price: 0.2 },
      { year: 2022, price: 0.8 },
      { year: 2023, price: 0.5 },
    ],
  },
);

addAsset(
  {
    id: "soybean_meal",
    name: { zh: "豆粕", en: "Soybean Meal" },
    ticker: "SOYM",
    category: "commodity",
    icon: "commodity",
    description: {
      zh: "全球最重要的蛋白饲料原料",
      en: "World's most important protein feed ingredient",
    },
    riskLevel: 2,
    availableFrom: 1900,
    availableTo: 2023,
  },
  {
    id: "soybean_meal",
    name: { zh: "豆粕", en: "Soybean Meal" },
    category: "commodity",
    unit: "ton",
    availableFrom: 1900,
    availableTo: 2023,
    baseVolatility: 0.1,
    priceHistory: [
      { year: 1900, price: 0.1 },
      { year: 1950, price: 0.15 },
      { year: 2000, price: 0.15 },
      { year: 2022, price: 0.5 },
      { year: 2023, price: 0.35 },
    ],
  },
);

addAsset(
  {
    id: "feeder_cattle",
    name: { zh: "育肥牛", en: "Feeder Cattle" },
    ticker: "FCATL",
    category: "commodity",
    icon: "commodity",
    description: {
      zh: "用于育肥的小牛期货",
      en: "Young cattle for fattening, CME futures",
    },
    riskLevel: 3,
    availableFrom: 1971,
    availableTo: 2023,
  },
  {
    id: "feeder_cattle",
    name: { zh: "育肥牛", en: "Feeder Cattle" },
    category: "commodity",
    unit: "cwt",
    availableFrom: 1971,
    availableTo: 2023,
    baseVolatility: 0.1,
    priceHistory: [
      { year: 1971, price: 0.3 },
      { year: 1990, price: 0.4 },
      { year: 2000, price: 0.5 },
      { year: 2023, price: 2.8 },
    ],
  },
);

// ─── ENERGY (from Yahoo Finance) ────────────────────────────────
addAsset(
  {
    id: "brent_crude",
    name: { zh: "布伦特原油", en: "Brent Crude Oil" },
    ticker: "BRNT",
    category: "energy",
    icon: "energy",
    description: {
      zh: "国际原油定价基准",
      en: "International crude oil pricing benchmark",
    },
    riskLevel: 3,
    availableFrom: 1970,
    availableTo: 2023,
  },
  {
    id: "brent_crude",
    name: { zh: "布伦特原油", en: "Brent Crude Oil" },
    category: "energy",
    unit: "barrel",
    availableFrom: 1970,
    availableTo: 2023,
    baseVolatility: 0.15,
    priceHistory: [
      { year: 1970, price: 0.05 },
      { year: 1980, price: 0.5 },
      { year: 1998, price: 0.3 },
      { year: 2008, price: 1.5 },
      { year: 2014, price: 1.0 },
      { year: 2020, price: 0.3 },
      { year: 2023, price: 0.75 },
    ],
  },
);

addAsset(
  {
    id: "heating_oil",
    name: { zh: "取暖油", en: "Heating Oil" },
    ticker: "HEAT",
    category: "energy",
    icon: "energy",
    description: {
      zh: "冬季取暖与柴油基础",
      en: "Winter heating fuel and diesel base",
    },
    riskLevel: 3,
    availableFrom: 1880,
    availableTo: 2023,
  },
  {
    id: "heating_oil",
    name: { zh: "取暖油", en: "Heating Oil" },
    category: "energy",
    unit: "gallon",
    availableFrom: 1880,
    availableTo: 2023,
    baseVolatility: 0.14,
    priceHistory: [
      { year: 1880, price: 0.005 },
      { year: 1950, price: 0.01 },
      { year: 1980, price: 0.05 },
      { year: 2000, price: 0.03 },
      { year: 2022, price: 0.06 },
      { year: 2023, price: 0.04 },
    ],
  },
);

addAsset(
  {
    id: "gasoline",
    name: { zh: "汽油", en: "RBOB Gasoline" },
    ticker: "GSLN",
    category: "energy",
    icon: "energy",
    description: {
      zh: "NYMEX无铅汽油期货",
      en: "NYMEX reformulated gasoline blendstock",
    },
    riskLevel: 3,
    availableFrom: 1900,
    availableTo: 2023,
  },
  {
    id: "gasoline",
    name: { zh: "汽油", en: "RBOB Gasoline" },
    category: "energy",
    unit: "gallon",
    availableFrom: 1900,
    availableTo: 2023,
    baseVolatility: 0.14,
    priceHistory: [
      { year: 1900, price: 0.002 },
      { year: 1950, price: 0.005 },
      { year: 1980, price: 0.02 },
      { year: 2000, price: 0.015 },
      { year: 2022, price: 0.05 },
      { year: 2023, price: 0.035 },
    ],
  },
);

addAsset(
  {
    id: "propane",
    name: { zh: "丙烷", en: "Propane" },
    ticker: "PROP",
    category: "energy",
    icon: "energy",
    description: {
      zh: "液化石油气，家用与工业能源",
      en: "LPG fuel for residential and industrial use",
    },
    riskLevel: 2,
    availableFrom: 1910,
    availableTo: 2023,
  },
  {
    id: "propane",
    name: { zh: "丙烷", en: "Propane" },
    category: "energy",
    unit: "gallon",
    availableFrom: 1910,
    availableTo: 2023,
    baseVolatility: 0.12,
    priceHistory: [
      { year: 1910, price: 0.001 },
      { year: 1950, price: 0.003 },
      { year: 2000, price: 0.005 },
      { year: 2022, price: 0.015 },
      { year: 2023, price: 0.01 },
    ],
  },
);

addAsset(
  {
    id: "ethanol",
    name: { zh: "乙醇", en: "Ethanol" },
    ticker: "ETHN",
    category: "energy",
    icon: "energy",
    description: {
      zh: "生物燃料与可再生能源",
      en: "Biofuel and renewable energy",
    },
    riskLevel: 3,
    availableFrom: 1906,
    availableTo: 2023,
  },
  {
    id: "ethanol",
    name: { zh: "乙醇", en: "Ethanol" },
    category: "energy",
    unit: "gallon",
    availableFrom: 1906,
    availableTo: 2023,
    baseVolatility: 0.15,
    priceHistory: [
      { year: 1906, price: 0.002 },
      { year: 1970, price: 0.005 },
      { year: 2006, price: 0.03 },
      { year: 2023, price: 0.02 },
    ],
  },
);

// ─── LUXURY ─────────────────────────────────────────────────────
addAsset(
  {
    id: "fine_art",
    name: { zh: "艺术品", en: "Fine Art" },
    ticker: "ART",
    category: "luxury",
    icon: "luxury",
    description: {
      zh: "名家绘画与雕塑收藏",
      en: "Master paintings and sculpture collectibles",
    },
    riskLevel: 3,
    availableFrom: -500,
    availableTo: 2023,
  },
  {
    id: "fine_art",
    name: { zh: "艺术品", en: "Fine Art" },
    category: "luxury",
    unit: "piece",
    availableFrom: -500,
    availableTo: 2023,
    baseVolatility: 0.08,
    priceHistory: [
      { year: -500, price: 0.5 },
      { year: 1500, price: 2.0 },
      { year: 1800, price: 5.0 },
      { year: 1950, price: 8.0 },
      { year: 2000, price: 15.0 },
      { year: 2023, price: 20.0 },
    ],
  },
);

addAsset(
  {
    id: "luxury_watches",
    name: { zh: "奢侈腕表", en: "Luxury Watches" },
    ticker: "WTCH",
    category: "luxury",
    icon: "luxury",
    description: {
      zh: "百达翡丽、劳力士等顶级腕表",
      en: "Patek Philippe, Rolex and other top timepieces",
    },
    riskLevel: 3,
    availableFrom: 1839,
    availableTo: 2023,
  },
  {
    id: "luxury_watches",
    name: { zh: "奢侈腕表", en: "Luxury Watches" },
    category: "luxury",
    unit: "piece",
    availableFrom: 1839,
    availableTo: 2023,
    baseVolatility: 0.08,
    priceHistory: [
      { year: 1839, price: 1.0 },
      { year: 1920, price: 1.5 },
      { year: 1970, price: 2.0 },
      { year: 2000, price: 5.0 },
      { year: 2021, price: 12.0 },
      { year: 2023, price: 8.0 },
    ],
  },
);

addAsset(
  {
    id: "rare_whisky",
    name: { zh: "稀有威士忌", en: "Rare Whisky" },
    ticker: "WSKY",
    category: "luxury",
    icon: "luxury",
    description: {
      zh: "年份威士忌收藏投资",
      en: "Vintage whisky collectible investment",
    },
    riskLevel: 3,
    availableFrom: 1494,
    availableTo: 2023,
  },
  {
    id: "rare_whisky",
    name: { zh: "稀有威士忌", en: "Rare Whisky" },
    category: "luxury",
    unit: "bottle",
    availableFrom: 1494,
    availableTo: 2023,
    baseVolatility: 0.06,
    priceHistory: [
      { year: 1494, price: 0.1 },
      { year: 1800, price: 0.3 },
      { year: 1950, price: 0.5 },
      { year: 2000, price: 1.0 },
      { year: 2023, price: 3.0 },
    ],
  },
);

// ─── REAL ESTATE (additional from Yahoo Finance sectors) ────────
addAsset(
  {
    id: "hongkong_property",
    name: { zh: "香港房产", en: "Hong Kong Property" },
    ticker: "HKRE",
    category: "real_estate",
    icon: "real_estate",
    description: {
      zh: "全球最贵房产市场之一",
      en: "One of the world's most expensive property markets",
    },
    riskLevel: 3,
    availableFrom: 1841,
    availableTo: 2023,
  },
  {
    id: "hongkong_property",
    name: { zh: "香港房产", en: "Hong Kong Property" },
    category: "real_estate",
    unit: "sqm",
    availableFrom: 1841,
    availableTo: 2023,
    baseVolatility: 0.1,
    priceHistory: [
      { year: 1841, price: 0.01 },
      { year: 1950, price: 0.1 },
      { year: 1980, price: 0.8 },
      { year: 1997, price: 4.0 },
      { year: 2003, price: 2.0 },
      { year: 2019, price: 12.0 },
      { year: 2023, price: 8.0 },
    ],
  },
);

addAsset(
  {
    id: "shanghai_property",
    name: { zh: "上海房产", en: "Shanghai Property" },
    ticker: "SHRE",
    category: "real_estate",
    icon: "real_estate",
    description: {
      zh: "中国最大城市核心地产",
      en: "China's largest city core property",
    },
    riskLevel: 3,
    availableFrom: 1843,
    availableTo: 2023,
  },
  {
    id: "shanghai_property",
    name: { zh: "上海房产", en: "Shanghai Property" },
    category: "real_estate",
    unit: "sqm",
    availableFrom: 1843,
    availableTo: 2023,
    baseVolatility: 0.12,
    priceHistory: [
      { year: 1843, price: 0.005 },
      { year: 1949, price: 0.02 },
      { year: 1990, price: 0.1 },
      { year: 2005, price: 1.0 },
      { year: 2017, price: 5.0 },
      { year: 2023, price: 4.0 },
    ],
  },
);

addAsset(
  {
    id: "singapore_property",
    name: { zh: "新加坡房产", en: "Singapore Property" },
    ticker: "SGRE",
    category: "real_estate",
    icon: "real_estate",
    description: {
      zh: "东南亚金融中心地产",
      en: "Southeast Asian financial hub property",
    },
    riskLevel: 2,
    availableFrom: 1965,
    availableTo: 2023,
  },
  {
    id: "singapore_property",
    name: { zh: "新加坡房产", en: "Singapore Property" },
    category: "real_estate",
    unit: "sqm",
    availableFrom: 1965,
    availableTo: 2023,
    baseVolatility: 0.08,
    priceHistory: [
      { year: 1965, price: 0.02 },
      { year: 1990, price: 0.5 },
      { year: 1997, price: 0.8 },
      { year: 2003, price: 0.4 },
      { year: 2013, price: 3.5 },
      { year: 2023, price: 5.0 },
    ],
  },
);

addAsset(
  {
    id: "sydney_property",
    name: { zh: "悉尼房产", en: "Sydney Property" },
    ticker: "SYRE",
    category: "real_estate",
    icon: "real_estate",
    description: {
      zh: "澳大利亚最大城市房产",
      en: "Australia's largest city property market",
    },
    riskLevel: 2,
    availableFrom: 1788,
    availableTo: 2023,
  },
  {
    id: "sydney_property",
    name: { zh: "悉尼房产", en: "Sydney Property" },
    category: "real_estate",
    unit: "sqm",
    availableFrom: 1788,
    availableTo: 2023,
    baseVolatility: 0.08,
    priceHistory: [
      { year: 1788, price: 0.001 },
      { year: 1900, price: 0.05 },
      { year: 1970, price: 0.2 },
      { year: 2000, price: 1.5 },
      { year: 2023, price: 4.0 },
    ],
  },
);

// ─── EQUITIES (from Yahoo Finance most active + sector leaders) ─
const equities = [
  {
    id: "meta",
    name: { zh: "Meta Platforms", en: "Meta Platforms" },
    ticker: "META",
    from: 2012,
    to: 2023,
    risk: 4,
    desc: {
      zh: "全球社交媒体巨头（前Facebook）",
      en: "Global social media giant (formerly Facebook)",
    },
    ph: [
      { year: 2012, price: 0.005 },
      { year: 2015, price: 0.012 },
      { year: 2018, price: 0.025 },
      { year: 2021, price: 0.05 },
      { year: 2022, price: 0.015 },
      { year: 2023, price: 0.05 },
    ],
  },
  {
    id: "amd",
    name: { zh: "超威半导体", en: "AMD" },
    ticker: "AMD",
    from: 1969,
    to: 2023,
    risk: 4,
    desc: {
      zh: "先进微处理器与GPU制造商",
      en: "Advanced microprocessor and GPU manufacturer",
    },
    ph: [
      { year: 1969, price: 0.001 },
      { year: 2000, price: 0.005 },
      { year: 2015, price: 0.0003 },
      { year: 2020, price: 0.01 },
      { year: 2023, price: 0.02 },
    ],
  },
  {
    id: "intel",
    name: { zh: "英特尔", en: "Intel" },
    ticker: "INTC",
    from: 1971,
    to: 2023,
    risk: 3,
    desc: {
      zh: "全球半导体巨头，x86架构缔造者",
      en: "Global semiconductor giant, creator of x86 architecture",
    },
    ph: [
      { year: 1971, price: 0.001 },
      { year: 1990, price: 0.005 },
      { year: 2000, price: 0.06 },
      { year: 2010, price: 0.01 },
      { year: 2020, price: 0.007 },
      { year: 2023, price: 0.007 },
    ],
  },
  {
    id: "tsmc",
    name: { zh: "台积电", en: "TSMC" },
    ticker: "TSM",
    from: 1994,
    to: 2023,
    risk: 3,
    desc: {
      zh: "全球最大芯片代工厂",
      en: "World's largest semiconductor foundry",
    },
    ph: [
      { year: 1994, price: 0.001 },
      { year: 2000, price: 0.005 },
      { year: 2010, price: 0.005 },
      { year: 2020, price: 0.01 },
      { year: 2023, price: 0.015 },
    ],
  },
  {
    id: "broadcom",
    name: { zh: "博通", en: "Broadcom" },
    ticker: "AVGO",
    from: 2009,
    to: 2023,
    risk: 3,
    desc: {
      zh: "半导体与基础设施软件巨头",
      en: "Semiconductor and infrastructure software giant",
    },
    ph: [
      { year: 2009, price: 0.003 },
      { year: 2015, price: 0.01 },
      { year: 2020, price: 0.02 },
      { year: 2023, price: 0.015 },
    ],
  },
  {
    id: "qualcomm",
    name: { zh: "高通", en: "Qualcomm" },
    ticker: "QCOM",
    from: 1991,
    to: 2023,
    risk: 3,
    desc: {
      zh: "移动通信芯片与5G领导者",
      en: "Mobile communications chip and 5G leader",
    },
    ph: [
      { year: 1991, price: 0.001 },
      { year: 2000, price: 0.08 },
      { year: 2010, price: 0.005 },
      { year: 2020, price: 0.012 },
      { year: 2023, price: 0.02 },
    ],
  },
  {
    id: "micron",
    name: { zh: "美光科技", en: "Micron Technology" },
    ticker: "MU",
    from: 1984,
    to: 2023,
    risk: 4,
    desc: {
      zh: "全球领先的存储芯片制造商",
      en: "Global leading memory chip manufacturer",
    },
    ph: [
      { year: 1984, price: 0.001 },
      { year: 2000, price: 0.008 },
      { year: 2016, price: 0.002 },
      { year: 2023, price: 0.012 },
    ],
  },
  {
    id: "arm_holdings",
    name: { zh: "ARM控股", en: "ARM Holdings" },
    ticker: "ARM",
    from: 2023,
    to: 2023,
    risk: 5,
    desc: {
      zh: "全球移动芯片架构设计公司",
      en: "Global mobile chip architecture designer",
    },
    ph: [{ year: 2023, price: 0.008 }],
  },
  {
    id: "eli_lilly",
    name: { zh: "礼来制药", en: "Eli Lilly" },
    ticker: "LLY",
    from: 1952,
    to: 2023,
    risk: 3,
    desc: {
      zh: "全球顶级制药公司，GLP-1药物领导者",
      en: "Top global pharma, GLP-1 drug leader",
    },
    ph: [
      { year: 1952, price: 0.001 },
      { year: 1980, price: 0.003 },
      { year: 2000, price: 0.01 },
      { year: 2020, price: 0.02 },
      { year: 2023, price: 0.09 },
    ],
  },
  {
    id: "jnj",
    name: { zh: "强生", en: "Johnson & Johnson" },
    ticker: "JNJ",
    from: 1944,
    to: 2023,
    risk: 2,
    desc: {
      zh: "全球医疗健康多元化巨头",
      en: "Global diversified healthcare giant",
    },
    ph: [
      { year: 1944, price: 0.001 },
      { year: 1970, price: 0.003 },
      { year: 2000, price: 0.01 },
      { year: 2023, price: 0.025 },
    ],
  },
  {
    id: "unitedhealth",
    name: { zh: "联合健康", en: "UnitedHealth" },
    ticker: "UNH",
    from: 1984,
    to: 2023,
    risk: 3,
    desc: {
      zh: "美国最大医疗保险公司",
      en: "Largest US health insurance company",
    },
    ph: [
      { year: 1984, price: 0.001 },
      { year: 2000, price: 0.005 },
      { year: 2010, price: 0.005 },
      { year: 2023, price: 0.08 },
    ],
  },
  {
    id: "pfizer",
    name: { zh: "辉瑞", en: "Pfizer" },
    ticker: "PFE",
    from: 1944,
    to: 2023,
    risk: 2,
    desc: {
      zh: "全球最大制药公司之一",
      en: "One of the world's largest pharmaceutical companies",
    },
    ph: [
      { year: 1944, price: 0.001 },
      { year: 1970, price: 0.003 },
      { year: 2000, price: 0.04 },
      { year: 2021, price: 0.008 },
      { year: 2023, price: 0.004 },
    ],
  },
  {
    id: "abbvie",
    name: { zh: "艾伯维", en: "AbbVie" },
    ticker: "ABBV",
    from: 2013,
    to: 2023,
    risk: 3,
    desc: {
      zh: "生物制药巨头，修美乐制造商",
      en: "Biopharmaceutical giant, maker of Humira",
    },
    ph: [
      { year: 2013, price: 0.005 },
      { year: 2018, price: 0.012 },
      { year: 2023, price: 0.025 },
    ],
  },
  {
    id: "merck",
    name: { zh: "默沙东", en: "Merck & Co." },
    ticker: "MRK",
    from: 1946,
    to: 2023,
    risk: 2,
    desc: {
      zh: "全球顶级制药与疫苗公司",
      en: "Top global pharmaceutical and vaccine company",
    },
    ph: [
      { year: 1946, price: 0.001 },
      { year: 1970, price: 0.003 },
      { year: 2000, price: 0.008 },
      { year: 2023, price: 0.016 },
    ],
  },
  {
    id: "novo_nordisk",
    name: { zh: "诺和诺德", en: "Novo Nordisk" },
    ticker: "NVO",
    from: 1981,
    to: 2023,
    risk: 3,
    desc: {
      zh: "全球糖尿病与肥胖治疗领导者",
      en: "Global leader in diabetes and obesity treatment",
    },
    ph: [
      { year: 1981, price: 0.001 },
      { year: 2000, price: 0.003 },
      { year: 2015, price: 0.008 },
      { year: 2023, price: 0.015 },
    ],
  },
  {
    id: "walmart",
    name: { zh: "沃尔玛", en: "Walmart" },
    ticker: "WMT",
    from: 1972,
    to: 2023,
    risk: 2,
    desc: { zh: "全球最大零售商", en: "World's largest retailer" },
    ph: [
      { year: 1972, price: 0.001 },
      { year: 1990, price: 0.003 },
      { year: 2000, price: 0.008 },
      { year: 2023, price: 0.025 },
    ],
  },
  {
    id: "costco",
    name: { zh: "好市多", en: "Costco" },
    ticker: "COST",
    from: 1985,
    to: 2023,
    risk: 2,
    desc: { zh: "会员制仓储零售巨头", en: "Membership warehouse retail giant" },
    ph: [
      { year: 1985, price: 0.001 },
      { year: 2000, price: 0.005 },
      { year: 2015, price: 0.02 },
      { year: 2023, price: 0.09 },
    ],
  },
  {
    id: "home_depot",
    name: { zh: "家得宝", en: "Home Depot" },
    ticker: "HD",
    from: 1981,
    to: 2023,
    risk: 2,
    desc: {
      zh: "全球最大家居建材零售商",
      en: "World's largest home improvement retailer",
    },
    ph: [
      { year: 1981, price: 0.001 },
      { year: 1995, price: 0.005 },
      { year: 2000, price: 0.005 },
      { year: 2023, price: 0.05 },
    ],
  },
  {
    id: "nike",
    name: { zh: "耐克", en: "Nike" },
    ticker: "NKE",
    from: 1980,
    to: 2023,
    risk: 2,
    desc: { zh: "全球最大运动品牌", en: "World's largest sports brand" },
    ph: [
      { year: 1980, price: 0.001 },
      { year: 1995, price: 0.005 },
      { year: 2015, price: 0.015 },
      { year: 2021, price: 0.025 },
      { year: 2023, price: 0.016 },
    ],
  },
  {
    id: "mcdonalds",
    name: { zh: "麦当劳", en: "McDonald's" },
    ticker: "MCD",
    from: 1965,
    to: 2023,
    risk: 1,
    desc: { zh: "全球最大连锁快餐企业", en: "World's largest fast-food chain" },
    ph: [
      { year: 1965, price: 0.001 },
      { year: 1985, price: 0.003 },
      { year: 2000, price: 0.005 },
      { year: 2023, price: 0.045 },
    ],
  },
  {
    id: "visa",
    name: { zh: "Visa", en: "Visa" },
    ticker: "V",
    from: 2008,
    to: 2023,
    risk: 2,
    desc: {
      zh: "全球最大电子支付网络",
      en: "World's largest electronic payment network",
    },
    ph: [
      { year: 2008, price: 0.003 },
      { year: 2015, price: 0.01 },
      { year: 2023, price: 0.04 },
    ],
  },
  {
    id: "mastercard",
    name: { zh: "万事达卡", en: "Mastercard" },
    ticker: "MA",
    from: 2006,
    to: 2023,
    risk: 2,
    desc: {
      zh: "全球第二大支付网络",
      en: "World's second largest payment network",
    },
    ph: [
      { year: 2006, price: 0.003 },
      { year: 2015, price: 0.012 },
      { year: 2023, price: 0.06 },
    ],
  },
  {
    id: "disney",
    name: { zh: "迪士尼", en: "Disney" },
    ticker: "DIS",
    from: 1957,
    to: 2023,
    risk: 3,
    desc: { zh: "全球娱乐帝国", en: "Global entertainment empire" },
    ph: [
      { year: 1957, price: 0.001 },
      { year: 1980, price: 0.003 },
      { year: 2000, price: 0.005 },
      { year: 2019, price: 0.02 },
      { year: 2023, price: 0.014 },
    ],
  },
  {
    id: "netflix",
    name: { zh: "奈飞", en: "Netflix" },
    ticker: "NFLX",
    from: 2002,
    to: 2023,
    risk: 4,
    desc: { zh: "全球流媒体先驱", en: "Global streaming pioneer" },
    ph: [
      { year: 2002, price: 0.001 },
      { year: 2010, price: 0.003 },
      { year: 2018, price: 0.005 },
      { year: 2021, price: 0.01 },
      { year: 2022, price: 0.003 },
      { year: 2023, price: 0.008 },
    ],
  },
  {
    id: "boeing",
    name: { zh: "波音", en: "Boeing" },
    ticker: "BA",
    from: 1934,
    to: 2023,
    risk: 3,
    desc: {
      zh: "全球最大航空航天制造商",
      en: "World's largest aerospace manufacturer",
    },
    ph: [
      { year: 1934, price: 0.001 },
      { year: 1960, price: 0.005 },
      { year: 2000, price: 0.01 },
      { year: 2019, price: 0.06 },
      { year: 2020, price: 0.02 },
      { year: 2023, price: 0.035 },
    ],
  },
  {
    id: "caterpillar",
    name: { zh: "卡特彼勒", en: "Caterpillar" },
    ticker: "CAT",
    from: 1929,
    to: 2023,
    risk: 3,
    desc: {
      zh: "全球最大工程机械制造商",
      en: "World's largest construction equipment manufacturer",
    },
    ph: [
      { year: 1929, price: 0.001 },
      { year: 1960, price: 0.003 },
      { year: 2000, price: 0.005 },
      { year: 2023, price: 0.04 },
    ],
  },
  {
    id: "procter_gamble",
    name: { zh: "宝洁", en: "Procter & Gamble" },
    ticker: "PG",
    from: 1890,
    to: 2023,
    risk: 1,
    desc: {
      zh: "全球最大日用消费品公司",
      en: "World's largest consumer goods company",
    },
    ph: [
      { year: 1890, price: 0.001 },
      { year: 1950, price: 0.003 },
      { year: 2000, price: 0.006 },
      { year: 2023, price: 0.024 },
    ],
  },
  {
    id: "salesforce",
    name: { zh: "Salesforce", en: "Salesforce" },
    ticker: "CRM",
    from: 2004,
    to: 2023,
    risk: 4,
    desc: {
      zh: "全球最大CRM与企业云平台",
      en: "World's largest CRM and enterprise cloud platform",
    },
    ph: [
      { year: 2004, price: 0.001 },
      { year: 2015, price: 0.01 },
      { year: 2021, price: 0.04 },
      { year: 2023, price: 0.04 },
    ],
  },
  {
    id: "adobe",
    name: { zh: "Adobe", en: "Adobe" },
    ticker: "ADBE",
    from: 1986,
    to: 2023,
    risk: 3,
    desc: {
      zh: "创意与文档软件巨头",
      en: "Creative and document software giant",
    },
    ph: [
      { year: 1986, price: 0.001 },
      { year: 2000, price: 0.005 },
      { year: 2015, price: 0.015 },
      { year: 2021, price: 0.1 },
      { year: 2023, price: 0.09 },
    ],
  },
  {
    id: "oracle",
    name: { zh: "甲骨文", en: "Oracle" },
    ticker: "ORCL",
    from: 1986,
    to: 2023,
    risk: 3,
    desc: {
      zh: "企业数据库与云计算巨头",
      en: "Enterprise database and cloud computing giant",
    },
    ph: [
      { year: 1986, price: 0.001 },
      { year: 2000, price: 0.04 },
      { year: 2010, price: 0.005 },
      { year: 2023, price: 0.016 },
    ],
  },
  {
    id: "tencent",
    name: { zh: "腾讯控股", en: "Tencent" },
    ticker: "0700",
    from: 2004,
    to: 2023,
    risk: 3,
    desc: {
      zh: "中国最大社交与游戏平台",
      en: "China's largest social and gaming platform",
    },
    ph: [
      { year: 2004, price: 0.001 },
      { year: 2010, price: 0.005 },
      { year: 2018, price: 0.03 },
      { year: 2023, price: 0.02 },
    ],
  },
  {
    id: "asml",
    name: { zh: "阿斯麦", en: "ASML" },
    ticker: "ASML",
    from: 1995,
    to: 2023,
    risk: 3,
    desc: {
      zh: "EUV光刻机垄断供应商",
      en: "Monopoly supplier of EUV lithography machines",
    },
    ph: [
      { year: 1995, price: 0.001 },
      { year: 2010, price: 0.004 },
      { year: 2020, price: 0.05 },
      { year: 2023, price: 0.1 },
    ],
  },
  {
    id: "lvmh",
    name: { zh: "路威酩轩", en: "LVMH" },
    ticker: "LVMH",
    from: 1987,
    to: 2023,
    risk: 2,
    desc: {
      zh: "全球最大奢侈品集团",
      en: "World's largest luxury goods conglomerate",
    },
    ph: [
      { year: 1987, price: 0.002 },
      { year: 2000, price: 0.005 },
      { year: 2015, price: 0.02 },
      { year: 2023, price: 0.12 },
    ],
  },
  {
    id: "nestle",
    name: { zh: "雀巢", en: "Nestlé" },
    ticker: "NESN",
    from: 1905,
    to: 2023,
    risk: 1,
    desc: {
      zh: "全球最大食品饮料公司",
      en: "World's largest food and beverage company",
    },
    ph: [
      { year: 1905, price: 0.001 },
      { year: 1960, price: 0.005 },
      { year: 2000, price: 0.01 },
      { year: 2023, price: 0.017 },
    ],
  },
  {
    id: "shell",
    name: { zh: "壳牌", en: "Shell" },
    ticker: "SHEL",
    from: 1907,
    to: 2023,
    risk: 2,
    desc: {
      zh: "全球最大能源公司之一",
      en: "One of the world's largest energy companies",
    },
    ph: [
      { year: 1907, price: 0.001 },
      { year: 1960, price: 0.005 },
      { year: 2000, price: 0.008 },
      { year: 2023, price: 0.01 },
    ],
  },
];

for (const eq of equities) {
  addAsset(
    {
      id: eq.id,
      name: eq.name,
      ticker: eq.ticker,
      category: "equity",
      icon: "stock",
      description: eq.desc,
      riskLevel: eq.risk,
      availableFrom: eq.from,
      availableTo: eq.to,
    },
    {
      id: eq.id,
      name: eq.name,
      category: "equity",
      unit: "share",
      availableFrom: eq.from,
      availableTo: eq.to,
      baseVolatility: 0.15,
      priceHistory: eq.ph,
    },
  );
}

// ─── EQUITY INDICES (from Yahoo Finance World Indices) ──────────
const indices = [
  {
    id: "russell2000",
    name: { zh: "罗素2000", en: "Russell 2000" },
    ticker: "RUT",
    from: 1984,
    to: 2023,
    risk: 3,
    desc: { zh: "美国小盘股基准指数", en: "US small-cap benchmark index" },
    ph: [
      { year: 1984, price: 0.01 },
      { year: 2000, price: 0.06 },
      { year: 2007, price: 0.08 },
      { year: 2020, price: 0.15 },
      { year: 2023, price: 0.3 },
    ],
  },
  {
    id: "cac40",
    name: { zh: "法国CAC 40", en: "CAC 40" },
    ticker: "CAC",
    from: 1987,
    to: 2023,
    risk: 3,
    desc: {
      zh: "法国40大上市公司指数",
      en: "France's top 40 listed companies index",
    },
    ph: [
      { year: 1987, price: 0.03 },
      { year: 2000, price: 0.08 },
      { year: 2009, price: 0.04 },
      { year: 2023, price: 0.12 },
    ],
  },
  {
    id: "kospi",
    name: { zh: "韩国KOSPI", en: "KOSPI" },
    ticker: "KSPI",
    from: 1983,
    to: 2023,
    risk: 3,
    desc: { zh: "韩国综合股价指数", en: "Korea Composite Stock Price Index" },
    ph: [
      { year: 1983, price: 0.01 },
      { year: 1994, price: 0.03 },
      { year: 2007, price: 0.04 },
      { year: 2023, price: 0.04 },
    ],
  },
  {
    id: "bse_sensex",
    name: { zh: "印度SENSEX", en: "BSE Sensex" },
    ticker: "SNSX",
    from: 1986,
    to: 2023,
    risk: 3,
    desc: {
      zh: "印度孟买证券交易所30股指数",
      en: "Bombay Stock Exchange 30-stock index",
    },
    ph: [
      { year: 1986, price: 0.005 },
      { year: 2000, price: 0.01 },
      { year: 2008, price: 0.03 },
      { year: 2023, price: 0.1 },
    ],
  },
  {
    id: "ibovespa",
    name: { zh: "巴西IBOVESPA", en: "IBOVESPA" },
    ticker: "BVSP",
    from: 1968,
    to: 2023,
    risk: 4,
    desc: {
      zh: "巴西圣保罗证券交易所指数",
      en: "São Paulo Stock Exchange index",
    },
    ph: [
      { year: 1968, price: 0.0001 },
      { year: 1990, price: 0.001 },
      { year: 2008, price: 0.05 },
      { year: 2023, price: 0.02 },
    ],
  },
  {
    id: "asx200",
    name: { zh: "澳洲ASX 200", en: "S&P/ASX 200" },
    ticker: "ASX2",
    from: 2000,
    to: 2023,
    risk: 2,
    desc: {
      zh: "澳大利亚200大上市公司指数",
      en: "Australia's top 200 listed companies index",
    },
    ph: [
      { year: 2000, price: 0.05 },
      { year: 2007, price: 0.1 },
      { year: 2009, price: 0.05 },
      { year: 2023, price: 0.12 },
    ],
  },
  {
    id: "stoxx600",
    name: { zh: "欧洲STOXX 600", en: "STOXX Europe 600" },
    ticker: "SX6E",
    from: 1998,
    to: 2023,
    risk: 2,
    desc: { zh: "泛欧洲600家公司指数", en: "Pan-European 600 companies index" },
    ph: [
      { year: 1998, price: 0.005 },
      { year: 2007, price: 0.006 },
      { year: 2009, price: 0.003 },
      { year: 2023, price: 0.007 },
    ],
  },
  {
    id: "moex",
    name: { zh: "俄罗斯MOEX", en: "MOEX Russia" },
    ticker: "MOEX",
    from: 1997,
    to: 2023,
    risk: 5,
    desc: { zh: "莫斯科交易所综合指数", en: "Moscow Exchange composite index" },
    ph: [
      { year: 1997, price: 0.005 },
      { year: 2008, price: 0.03 },
      { year: 2014, price: 0.02 },
      { year: 2022, price: 0.005 },
      { year: 2023, price: 0.01 },
    ],
  },
];

for (const idx of indices) {
  addAsset(
    {
      id: idx.id,
      name: idx.name,
      ticker: idx.ticker,
      category: "equity_index",
      icon: "index",
      description: idx.desc,
      riskLevel: idx.risk,
      availableFrom: idx.from,
      availableTo: idx.to,
    },
    {
      id: idx.id,
      name: idx.name,
      category: "equity_index",
      unit: "point",
      availableFrom: idx.from,
      availableTo: idx.to,
      baseVolatility: 0.12,
      priceHistory: idx.ph,
    },
  );
}

// ─── ETFs (new category from Yahoo Finance) ─────────────────────
const etfs = [
  {
    id: "spy_etf",
    name: { zh: "SPDR标普500 ETF", en: "SPDR S&P 500 ETF Trust" },
    ticker: "SPY",
    from: 1993,
    to: 2023,
    risk: 2,
    desc: {
      zh: "全球交易量最大的ETF，追踪标普500",
      en: "World's most traded ETF, tracks S&P 500",
    },
    ph: [
      { year: 1993, price: 0.05 },
      { year: 2000, price: 0.15 },
      { year: 2009, price: 0.08 },
      { year: 2020, price: 0.3 },
      { year: 2023, price: 0.65 },
    ],
  },
  {
    id: "qqq_etf",
    name: { zh: "纳斯达克100 ETF", en: "Invesco QQQ Trust" },
    ticker: "QQQ",
    from: 1999,
    to: 2023,
    risk: 3,
    desc: {
      zh: "追踪纳斯达克100指数的科技ETF",
      en: "Tech ETF tracking Nasdaq 100",
    },
    ph: [
      { year: 1999, price: 0.1 },
      { year: 2002, price: 0.025 },
      { year: 2015, price: 0.15 },
      { year: 2023, price: 0.6 },
    ],
  },
  {
    id: "iwm_etf",
    name: { zh: "罗素2000 ETF", en: "iShares Russell 2000 ETF" },
    ticker: "IWM",
    from: 2000,
    to: 2023,
    risk: 3,
    desc: { zh: "追踪美国小盘股指数", en: "Tracks US small-cap stocks index" },
    ph: [
      { year: 2000, price: 0.08 },
      { year: 2009, price: 0.04 },
      { year: 2020, price: 0.12 },
      { year: 2023, price: 0.3 },
    ],
  },
  {
    id: "gld_etf",
    name: { zh: "SPDR黄金ETF", en: "SPDR Gold Shares" },
    ticker: "GLD",
    from: 2004,
    to: 2023,
    risk: 2,
    desc: { zh: "全球最大黄金ETF", en: "World's largest gold ETF" },
    ph: [
      { year: 2004, price: 0.5 },
      { year: 2011, price: 1.2 },
      { year: 2015, price: 0.7 },
      { year: 2023, price: 0.95 },
    ],
  },
  {
    id: "tlt_etf",
    name: { zh: "20年+美债ETF", en: "iShares 20+ Year Treasury Bond" },
    ticker: "TLT",
    from: 2002,
    to: 2023,
    risk: 2,
    desc: { zh: "追踪长期美国国债", en: "Tracks long-term US Treasury bonds" },
    ph: [
      { year: 2002, price: 0.1 },
      { year: 2008, price: 0.12 },
      { year: 2020, price: 0.15 },
      { year: 2023, price: 0.015 },
    ],
  },
  {
    id: "eem_etf",
    name: { zh: "新兴市场ETF", en: "iShares MSCI Emerging Markets" },
    ticker: "EEM",
    from: 2003,
    to: 2023,
    risk: 4,
    desc: {
      zh: "追踪新兴市场股票指数",
      en: "Tracks emerging markets equity index",
    },
    ph: [
      { year: 2003, price: 0.03 },
      { year: 2007, price: 0.06 },
      { year: 2015, price: 0.03 },
      { year: 2023, price: 0.06 },
    ],
  },
  {
    id: "vti_etf",
    name: { zh: "全美股票ETF", en: "Vanguard Total Stock Market" },
    ticker: "VTI",
    from: 2001,
    to: 2023,
    risk: 2,
    desc: {
      zh: "覆盖全美股票市场的ETF",
      en: "ETF covering the entire US stock market",
    },
    ph: [
      { year: 2001, price: 0.1 },
      { year: 2009, price: 0.05 },
      { year: 2020, price: 0.15 },
      { year: 2023, price: 0.35 },
    ],
  },
  {
    id: "uso_etf",
    name: { zh: "美国石油ETF", en: "United States Oil Fund" },
    ticker: "USO",
    from: 2006,
    to: 2023,
    risk: 4,
    desc: {
      zh: "追踪WTI原油期货的ETF",
      en: "ETF tracking WTI crude oil futures",
    },
    ph: [
      { year: 2006, price: 0.08 },
      { year: 2008, price: 0.15 },
      { year: 2020, price: 0.02 },
      { year: 2023, price: 0.1 },
    ],
  },
  {
    id: "slv_etf",
    name: { zh: "iShares白银ETF", en: "iShares Silver Trust" },
    ticker: "SLV",
    from: 2006,
    to: 2023,
    risk: 3,
    desc: { zh: "追踪白银现货价格的ETF", en: "ETF tracking silver spot price" },
    ph: [
      { year: 2006, price: 0.15 },
      { year: 2011, price: 0.6 },
      { year: 2015, price: 0.15 },
      { year: 2023, price: 0.35 },
    ],
  },
  {
    id: "hyg_etf",
    name: { zh: "高收益债ETF", en: "iShares High Yield Corporate Bond" },
    ticker: "HYG",
    from: 2007,
    to: 2023,
    risk: 3,
    desc: {
      zh: "追踪高收益（垃圾）公司债",
      en: "Tracks high-yield (junk) corporate bonds",
    },
    ph: [
      { year: 2007, price: 0.12 },
      { year: 2009, price: 0.06 },
      { year: 2015, price: 0.1 },
      { year: 2023, price: 0.12 },
    ],
  },
  {
    id: "lqd_etf",
    name: { zh: "投资级债ETF", en: "iShares Investment Grade Corp Bond" },
    ticker: "LQD",
    from: 2002,
    to: 2023,
    risk: 2,
    desc: {
      zh: "追踪投资级公司债",
      en: "Tracks investment-grade corporate bonds",
    },
    ph: [
      { year: 2002, price: 0.13 },
      { year: 2009, price: 0.08 },
      { year: 2020, price: 0.12 },
      { year: 2023, price: 0.017 },
    ],
  },
  {
    id: "tqqq_etf",
    name: { zh: "三倍做多纳指ETF", en: "ProShares UltraPro QQQ" },
    ticker: "TQQQ",
    from: 2010,
    to: 2023,
    risk: 5,
    desc: {
      zh: "3倍杠杆追踪纳斯达克100",
      en: "3x leveraged Nasdaq 100 tracker",
    },
    ph: [
      { year: 2010, price: 0.005 },
      { year: 2018, price: 0.02 },
      { year: 2020, price: 0.01 },
      { year: 2021, price: 0.12 },
      { year: 2023, price: 0.07 },
    ],
  },
  {
    id: "xlf_etf",
    name: { zh: "金融行业ETF", en: "Financial Select Sector SPDR" },
    ticker: "XLF",
    from: 1998,
    to: 2023,
    risk: 3,
    desc: { zh: "追踪标普500金融板块", en: "Tracks S&P 500 financial sector" },
    ph: [
      { year: 1998, price: 0.02 },
      { year: 2007, price: 0.04 },
      { year: 2009, price: 0.01 },
      { year: 2023, price: 0.055 },
    ],
  },
  {
    id: "xlk_etf",
    name: { zh: "科技行业ETF", en: "Technology Select Sector SPDR" },
    ticker: "XLK",
    from: 1998,
    to: 2023,
    risk: 3,
    desc: { zh: "追踪标普500科技板块", en: "Tracks S&P 500 technology sector" },
    ph: [
      { year: 1998, price: 0.03 },
      { year: 2000, price: 0.06 },
      { year: 2002, price: 0.02 },
      { year: 2023, price: 0.28 },
    ],
  },
  {
    id: "xle_etf",
    name: { zh: "能源行业ETF", en: "Energy Select Sector SPDR" },
    ticker: "XLE",
    from: 1998,
    to: 2023,
    risk: 3,
    desc: { zh: "追踪标普500能源板块", en: "Tracks S&P 500 energy sector" },
    ph: [
      { year: 1998, price: 0.03 },
      { year: 2008, price: 0.08 },
      { year: 2020, price: 0.02 },
      { year: 2023, price: 0.14 },
    ],
  },
  {
    id: "bito_etf",
    name: { zh: "比特币策略ETF", en: "ProShares Bitcoin ETF" },
    ticker: "BITO",
    from: 2021,
    to: 2023,
    risk: 5,
    desc: { zh: "首个美国比特币期货ETF", en: "First US Bitcoin futures ETF" },
    ph: [
      { year: 2021, price: 0.06 },
      { year: 2022, price: 0.02 },
      { year: 2023, price: 0.03 },
    ],
  },
  {
    id: "soxl_etf",
    name: {
      zh: "三倍做多半导体ETF",
      en: "Direxion Daily Semiconductor Bull 3X",
    },
    ticker: "SOXL",
    from: 2010,
    to: 2023,
    risk: 5,
    desc: {
      zh: "3倍杠杆追踪费城半导体指数",
      en: "3x leveraged Philadelphia Semiconductor tracker",
    },
    ph: [
      { year: 2010, price: 0.005 },
      { year: 2018, price: 0.01 },
      { year: 2020, price: 0.005 },
      { year: 2021, price: 0.06 },
      { year: 2023, price: 0.03 },
    ],
  },
];

for (const etf of etfs) {
  addAsset(
    {
      id: etf.id,
      name: etf.name,
      ticker: etf.ticker,
      category: "etf",
      icon: "etf",
      description: etf.desc,
      riskLevel: etf.risk,
      availableFrom: etf.from,
      availableTo: etf.to,
    },
    {
      id: etf.id,
      name: etf.name,
      category: "etf",
      unit: "share",
      availableFrom: etf.from,
      availableTo: etf.to,
      baseVolatility: 0.1,
      priceHistory: etf.ph,
    },
  );
}

// ─── CRYPTO (from Yahoo Finance top crypto) ─────────────────────
const cryptos = [
  {
    id: "cardano",
    name: { zh: "卡尔达诺", en: "Cardano" },
    ticker: "ADA",
    from: 2017,
    to: 2023,
    risk: 5,
    desc: {
      zh: "第三代区块链智能合约平台",
      en: "Third-generation blockchain smart contract platform",
    },
    ph: [
      { year: 2017, price: 0.000001 },
      { year: 2018, price: 0.0002 },
      { year: 2021, price: 0.00005 },
      { year: 2023, price: 0.00001 },
    ],
  },
  {
    id: "chainlink",
    name: { zh: "Chainlink", en: "Chainlink" },
    ticker: "LINK",
    from: 2017,
    to: 2023,
    risk: 5,
    desc: { zh: "去中心化预言机网络", en: "Decentralized oracle network" },
    ph: [
      { year: 2017, price: 0.000005 },
      { year: 2021, price: 0.0005 },
      { year: 2023, price: 0.0002 },
    ],
  },
  {
    id: "litecoin",
    name: { zh: "莱特币", en: "Litecoin" },
    ticker: "LTC",
    from: 2011,
    to: 2023,
    risk: 4,
    desc: { zh: '比特币的"数字白银"', en: 'Bitcoin\'s "digital silver"' },
    ph: [
      { year: 2011, price: 0.000001 },
      { year: 2017, price: 0.005 },
      { year: 2021, price: 0.003 },
      { year: 2023, price: 0.001 },
    ],
  },
  {
    id: "bitcoin_cash",
    name: { zh: "比特币现金", en: "Bitcoin Cash" },
    ticker: "BCH",
    from: 2017,
    to: 2023,
    risk: 5,
    desc: {
      zh: "比特币硬分叉，大区块链",
      en: "Bitcoin hard fork with larger blocks",
    },
    ph: [
      { year: 2017, price: 0.005 },
      { year: 2017, price: 0.05 },
      { year: 2021, price: 0.01 },
      { year: 2023, price: 0.004 },
    ],
  },
  {
    id: "polkadot",
    name: { zh: "波卡", en: "Polkadot" },
    ticker: "DOT",
    from: 2020,
    to: 2023,
    risk: 5,
    desc: { zh: "跨链互操作协议", en: "Cross-chain interoperability protocol" },
    ph: [
      { year: 2020, price: 0.00005 },
      { year: 2021, price: 0.0008 },
      { year: 2023, price: 0.0001 },
    ],
  },
  {
    id: "avalanche",
    name: { zh: "雪崩", en: "Avalanche" },
    ticker: "AVAX",
    from: 2020,
    to: 2023,
    risk: 5,
    desc: {
      zh: "高性能智能合约平台",
      en: "High-performance smart contract platform",
    },
    ph: [
      { year: 2020, price: 0.00005 },
      { year: 2021, price: 0.002 },
      { year: 2023, price: 0.0003 },
    ],
  },
  {
    id: "polygon",
    name: { zh: "Polygon", en: "Polygon" },
    ticker: "MATIC",
    from: 2019,
    to: 2023,
    risk: 5,
    desc: {
      zh: "以太坊Layer 2扩展方案",
      en: "Ethereum Layer 2 scaling solution",
    },
    ph: [
      { year: 2019, price: 0.0000005 },
      { year: 2021, price: 0.00004 },
      { year: 2023, price: 0.00001 },
    ],
  },
  {
    id: "shiba_inu",
    name: { zh: "柴犬币", en: "Shiba Inu" },
    ticker: "SHIB",
    from: 2020,
    to: 2023,
    risk: 5,
    desc: { zh: "Meme代币，社区驱动", en: "Meme token, community-driven" },
    ph: [
      { year: 2020, price: 0.0000000001 },
      { year: 2021, price: 0.000001 },
      { year: 2023, price: 0.0000002 },
    ],
  },
  {
    id: "uniswap",
    name: { zh: "Uniswap", en: "Uniswap" },
    ticker: "UNI",
    from: 2020,
    to: 2023,
    risk: 5,
    desc: {
      zh: "最大去中心化交易所协议",
      en: "Largest decentralized exchange protocol",
    },
    ph: [
      { year: 2020, price: 0.00005 },
      { year: 2021, price: 0.0006 },
      { year: 2023, price: 0.0001 },
    ],
  },
  {
    id: "tron",
    name: { zh: "波场", en: "TRON" },
    ticker: "TRX",
    from: 2017,
    to: 2023,
    risk: 5,
    desc: {
      zh: "去中心化内容分发协议",
      en: "Decentralized content distribution protocol",
    },
    ph: [
      { year: 2017, price: 0.000001 },
      { year: 2018, price: 0.00003 },
      { year: 2023, price: 0.000015 },
    ],
  },
  {
    id: "monero",
    name: { zh: "门罗币", en: "Monero" },
    ticker: "XMR",
    from: 2014,
    to: 2023,
    risk: 5,
    desc: { zh: "专注隐私的加密货币", en: "Privacy-focused cryptocurrency" },
    ph: [
      { year: 2014, price: 0.00001 },
      { year: 2018, price: 0.005 },
      { year: 2021, price: 0.004 },
      { year: 2023, price: 0.003 },
    ],
  },
  {
    id: "tether",
    name: { zh: "泰达币", en: "Tether" },
    ticker: "USDT",
    from: 2015,
    to: 2023,
    risk: 1,
    desc: { zh: "最大的美元稳定币", en: "Largest USD stablecoin" },
    ph: [
      { year: 2015, price: 0.000016 },
      { year: 2023, price: 0.000016 },
    ],
  },
  {
    id: "usdc",
    name: { zh: "USD Coin", en: "USD Coin" },
    ticker: "USDC",
    from: 2018,
    to: 2023,
    risk: 1,
    desc: { zh: "受监管的美元稳定币", en: "Regulated USD stablecoin" },
    ph: [
      { year: 2018, price: 0.000016 },
      { year: 2023, price: 0.000016 },
    ],
  },
];

for (const c of cryptos) {
  addAsset(
    {
      id: c.id,
      name: c.name,
      ticker: c.ticker,
      category: "crypto",
      icon: "crypto",
      description: c.desc,
      riskLevel: c.risk,
      availableFrom: c.from,
      availableTo: c.to,
    },
    {
      id: c.id,
      name: c.name,
      category: "crypto",
      unit: "coin",
      availableFrom: c.from,
      availableTo: c.to,
      baseVolatility: 0.3,
      priceHistory: c.ph,
    },
  );
}

// ─── FOREX (new category from Yahoo Finance Currencies) ─────────
const forexPairs = [
  {
    id: "eurusd",
    name: { zh: "欧元/美元", en: "EUR/USD" },
    ticker: "EURUSD",
    from: 1999,
    to: 2023,
    risk: 2,
    desc: {
      zh: "全球交易量最大的货币对",
      en: "World's most traded currency pair",
    },
    ph: [
      { year: 1999, price: 0.000018 },
      { year: 2002, price: 0.000014 },
      { year: 2008, price: 0.000024 },
      { year: 2015, price: 0.000017 },
      { year: 2023, price: 0.000017 },
    ],
  },
  {
    id: "usdjpy",
    name: { zh: "美元/日元", en: "USD/JPY" },
    ticker: "USDJPY",
    from: 1971,
    to: 2023,
    risk: 2,
    desc: {
      zh: "美日货币对，避险指标",
      en: "USD/JPY pair, safe-haven indicator",
    },
    ph: [
      { year: 1971, price: 0.00005 },
      { year: 1985, price: 0.00003 },
      { year: 1995, price: 0.00008 },
      { year: 2012, price: 0.00005 },
      { year: 2023, price: 0.000105 },
    ],
  },
  {
    id: "gbpusd",
    name: { zh: "英镑/美元", en: "GBP/USD" },
    ticker: "GBPUSD",
    from: 1971,
    to: 2023,
    risk: 2,
    desc: { zh: '英美货币对，"电缆"', en: 'GBP/USD pair, "Cable"' },
    ph: [
      { year: 1971, price: 0.00004 },
      { year: 1985, price: 0.000018 },
      { year: 2007, price: 0.000032 },
      { year: 2023, price: 0.00002 },
    ],
  },
  {
    id: "audusd",
    name: { zh: "澳元/美元", en: "AUD/USD" },
    ticker: "AUDUSD",
    from: 1983,
    to: 2023,
    risk: 3,
    desc: {
      zh: "商品货币，与大宗商品高度相关",
      en: "Commodity currency, highly correlated with raw materials",
    },
    ph: [
      { year: 1983, price: 0.000014 },
      { year: 2001, price: 0.000008 },
      { year: 2011, price: 0.000016 },
      { year: 2023, price: 0.00001 },
    ],
  },
  {
    id: "usdcny",
    name: { zh: "美元/人民币", en: "USD/CNY" },
    ticker: "USDCNY",
    from: 1994,
    to: 2023,
    risk: 3,
    desc: {
      zh: "全球第二大经济体货币对",
      en: "Currency pair of world's 2nd largest economy",
    },
    ph: [
      { year: 1994, price: 0.000016 },
      { year: 2005, price: 0.000016 },
      { year: 2014, price: 0.000016 },
      { year: 2023, price: 0.000016 },
    ],
  },
  {
    id: "usdchf",
    name: { zh: "美元/瑞郎", en: "USD/CHF" },
    ticker: "USDCHF",
    from: 1971,
    to: 2023,
    risk: 2,
    desc: {
      zh: "瑞士法郎，传统避险货币",
      en: "Swiss franc, traditional safe-haven currency",
    },
    ph: [
      { year: 1971, price: 0.00004 },
      { year: 1985, price: 0.00002 },
      { year: 2000, price: 0.00001 },
      { year: 2015, price: 0.000016 },
      { year: 2023, price: 0.000018 },
    ],
  },
  {
    id: "eurgbp",
    name: { zh: "欧元/英镑", en: "EUR/GBP" },
    ticker: "EURGBP",
    from: 1999,
    to: 2023,
    risk: 2,
    desc: {
      zh: "欧英货币对，欧洲主要交叉盘",
      en: "EUR/GBP cross, major European pair",
    },
    ph: [
      { year: 1999, price: 0.000011 },
      { year: 2009, price: 0.000015 },
      { year: 2016, price: 0.000014 },
      { year: 2023, price: 0.000013 },
    ],
  },
  {
    id: "eurjpy",
    name: { zh: "欧元/日元", en: "EUR/JPY" },
    ticker: "EURJPY",
    from: 1999,
    to: 2023,
    risk: 3,
    desc: {
      zh: "套利交易最受欢迎的货币对",
      en: "Most popular carry trade currency pair",
    },
    ph: [
      { year: 1999, price: 0.000018 },
      { year: 2008, price: 0.000025 },
      { year: 2012, price: 0.000015 },
      { year: 2023, price: 0.000025 },
    ],
  },
  {
    id: "usdhkd",
    name: { zh: "美元/港币", en: "USD/HKD" },
    ticker: "USDHKD",
    from: 1983,
    to: 2023,
    risk: 1,
    desc: {
      zh: "联系汇率制度下的货币对",
      en: "Currency pair under linked exchange rate system",
    },
    ph: [
      { year: 1983, price: 0.000016 },
      { year: 2000, price: 0.000016 },
      { year: 2023, price: 0.000016 },
    ],
  },
  {
    id: "usdsgd",
    name: { zh: "美元/新加坡元", en: "USD/SGD" },
    ticker: "USDSGD",
    from: 1971,
    to: 2023,
    risk: 2,
    desc: {
      zh: "新加坡元，亚洲金融中心货币",
      en: "Singapore dollar, Asian financial hub currency",
    },
    ph: [
      { year: 1971, price: 0.00002 },
      { year: 1990, price: 0.000014 },
      { year: 2010, price: 0.000012 },
      { year: 2023, price: 0.000012 },
    ],
  },
  {
    id: "usdinr",
    name: { zh: "美元/印度卢比", en: "USD/INR" },
    ticker: "USDINR",
    from: 1991,
    to: 2023,
    risk: 3,
    desc: {
      zh: "印度卢比，新兴市场主要货币",
      en: "Indian rupee, major emerging market currency",
    },
    ph: [
      { year: 1991, price: 0.000016 },
      { year: 2000, price: 0.000016 },
      { year: 2013, price: 0.000016 },
      { year: 2023, price: 0.000016 },
    ],
  },
  {
    id: "usdmxn",
    name: { zh: "美元/墨西哥比索", en: "USD/MXN" },
    ticker: "USDMXN",
    from: 1994,
    to: 2023,
    risk: 4,
    desc: {
      zh: "拉美最大经济体货币对",
      en: "Latin America's largest economy currency pair",
    },
    ph: [
      { year: 1994, price: 0.000016 },
      { year: 2000, price: 0.000016 },
      { year: 2016, price: 0.000016 },
      { year: 2023, price: 0.000016 },
    ],
  },
  {
    id: "usdzar",
    name: { zh: "美元/南非兰特", en: "USD/ZAR" },
    ticker: "USDZAR",
    from: 1961,
    to: 2023,
    risk: 4,
    desc: { zh: "非洲最大经济体货币", en: "Africa's largest economy currency" },
    ph: [
      { year: 1961, price: 0.000022 },
      { year: 1985, price: 0.000012 },
      { year: 2001, price: 0.000008 },
      { year: 2023, price: 0.000009 },
    ],
  },
  {
    id: "nzdusd",
    name: { zh: "新西兰元/美元", en: "NZD/USD" },
    ticker: "NZDUSD",
    from: 1985,
    to: 2023,
    risk: 3,
    desc: {
      zh: "纽元，商品出口国货币",
      en: "Kiwi dollar, commodity exporter currency",
    },
    ph: [
      { year: 1985, price: 0.000008 },
      { year: 2001, price: 0.000006 },
      { year: 2014, price: 0.000013 },
      { year: 2023, price: 0.00001 },
    ],
  },
  {
    id: "usdrub",
    name: { zh: "美元/俄罗斯卢布", en: "USD/RUB" },
    ticker: "USDRUB",
    from: 1992,
    to: 2023,
    risk: 5,
    desc: {
      zh: "俄罗斯卢布，地缘政治敏感货币",
      en: "Russian ruble, geopolitically sensitive currency",
    },
    ph: [
      { year: 1992, price: 0.000016 },
      { year: 1998, price: 0.000002 },
      { year: 2014, price: 0.000005 },
      { year: 2022, price: 0.000002 },
      { year: 2023, price: 0.000003 },
    ],
  },
];

for (const fx of forexPairs) {
  addAsset(
    {
      id: fx.id,
      name: fx.name,
      ticker: fx.ticker,
      category: "forex",
      icon: "forex",
      description: fx.desc,
      riskLevel: fx.risk,
      availableFrom: fx.from,
      availableTo: fx.to,
    },
    {
      id: fx.id,
      name: fx.name,
      category: "forex",
      unit: "lot",
      availableFrom: fx.from,
      availableTo: fx.to,
      baseVolatility: 0.05,
      priceHistory: fx.ph,
    },
  );
}

// ─── BONDS (additional from Yahoo Finance) ──────────────────────
addAsset(
  {
    id: "tips",
    name: { zh: "通胀保护债券", en: "TIPS" },
    ticker: "TIPS",
    category: "bond",
    icon: "bond",
    description: {
      zh: "美国通胀保护国债",
      en: "US Treasury Inflation-Protected Securities",
    },
    riskLevel: 1,
    availableFrom: 1997,
    availableTo: 2023,
  },
  {
    id: "tips",
    name: { zh: "通胀保护债券", en: "TIPS" },
    category: "bond",
    unit: "unit",
    availableFrom: 1997,
    availableTo: 2023,
    baseVolatility: 0.03,
    priceHistory: [
      { year: 1997, price: 0.015 },
      { year: 2008, price: 0.012 },
      { year: 2020, price: 0.015 },
      { year: 2023, price: 0.013 },
    ],
  },
);

addAsset(
  {
    id: "mbs",
    name: { zh: "抵押贷款证券", en: "Mortgage-Backed Securities" },
    ticker: "MBS",
    category: "bond",
    icon: "bond",
    description: {
      zh: "房贷支持的资产证券化产品",
      en: "Asset-backed securities from mortgage pools",
    },
    riskLevel: 3,
    availableFrom: 1970,
    availableTo: 2023,
  },
  {
    id: "mbs",
    name: { zh: "抵押贷款证券", en: "Mortgage-Backed Securities" },
    category: "bond",
    unit: "unit",
    availableFrom: 1970,
    availableTo: 2023,
    baseVolatility: 0.06,
    priceHistory: [
      { year: 1970, price: 0.015 },
      { year: 2000, price: 0.012 },
      { year: 2007, price: 0.015 },
      { year: 2008, price: 0.005 },
      { year: 2023, price: 0.012 },
    ],
  },
);

addAsset(
  {
    id: "muni_bonds",
    name: { zh: "市政债券", en: "Municipal Bonds" },
    ticker: "MUNI",
    category: "bond",
    icon: "bond",
    description: {
      zh: "美国州和地方政府债券，税收优惠",
      en: "US state and local government bonds, tax-exempt",
    },
    riskLevel: 2,
    availableFrom: 1812,
    availableTo: 2023,
  },
  {
    id: "muni_bonds",
    name: { zh: "市政债券", en: "Municipal Bonds" },
    category: "bond",
    unit: "unit",
    availableFrom: 1812,
    availableTo: 2023,
    baseVolatility: 0.03,
    priceHistory: [
      { year: 1812, price: 0.02 },
      { year: 1900, price: 0.015 },
      { year: 1970, price: 0.012 },
      { year: 2023, price: 0.012 },
    ],
  },
);

addAsset(
  {
    id: "em_bonds",
    name: { zh: "新兴市场债券", en: "Emerging Market Bonds" },
    ticker: "EMB",
    category: "bond",
    icon: "bond",
    description: {
      zh: "新兴市场国家主权债券",
      en: "Sovereign bonds from emerging market nations",
    },
    riskLevel: 4,
    availableFrom: 1990,
    availableTo: 2023,
  },
  {
    id: "em_bonds",
    name: { zh: "新兴市场债券", en: "Emerging Market Bonds" },
    category: "bond",
    unit: "unit",
    availableFrom: 1990,
    availableTo: 2023,
    baseVolatility: 0.1,
    priceHistory: [
      { year: 1990, price: 0.02 },
      { year: 1998, price: 0.01 },
      { year: 2008, price: 0.015 },
      { year: 2023, price: 0.018 },
    ],
  },
);

addAsset(
  {
    id: "italian_btp",
    name: { zh: "意大利BTP国债", en: "Italian BTP" },
    ticker: "BTP",
    category: "bond",
    icon: "bond",
    description: {
      zh: "意大利政府债券，欧债危机焦点",
      en: "Italian government bonds, eurozone crisis focal point",
    },
    riskLevel: 3,
    availableFrom: 1861,
    availableTo: 2023,
  },
  {
    id: "italian_btp",
    name: { zh: "意大利BTP国债", en: "Italian BTP" },
    category: "bond",
    unit: "unit",
    availableFrom: 1861,
    availableTo: 2023,
    baseVolatility: 0.06,
    priceHistory: [
      { year: 1861, price: 0.02 },
      { year: 1945, price: 0.005 },
      { year: 2000, price: 0.012 },
      { year: 2011, price: 0.008 },
      { year: 2023, price: 0.01 },
    ],
  },
);

// ─── FUTURES (additional from Yahoo Finance) ─────────────────────
addAsset(
  {
    id: "brent_futures",
    name: { zh: "布伦特原油期货", en: "Brent Crude Futures" },
    ticker: "BZF",
    category: "futures",
    icon: "futures",
    description: {
      zh: "ICE布伦特原油期货合约",
      en: "ICE Brent crude oil futures contract",
    },
    riskLevel: 4,
    availableFrom: 1988,
    availableTo: 2023,
  },
  {
    id: "brent_futures",
    name: { zh: "布伦特原油期货", en: "Brent Crude Futures" },
    category: "futures",
    unit: "contract",
    availableFrom: 1988,
    availableTo: 2023,
    baseVolatility: 0.18,
    priceHistory: [
      { year: 1988, price: 0.2 },
      { year: 2000, price: 0.4 },
      { year: 2008, price: 1.5 },
      { year: 2020, price: 0.3 },
      { year: 2023, price: 0.75 },
    ],
  },
);

addAsset(
  {
    id: "corn_futures",
    name: { zh: "玉米期货", en: "Corn Futures" },
    ticker: "ZCF",
    category: "futures",
    icon: "futures",
    description: { zh: "CBOT玉米期货合约", en: "CBOT corn futures contract" },
    riskLevel: 3,
    availableFrom: 1877,
    availableTo: 2023,
  },
  {
    id: "corn_futures",
    name: { zh: "玉米期货", en: "Corn Futures" },
    category: "futures",
    unit: "contract",
    availableFrom: 1877,
    availableTo: 2023,
    baseVolatility: 0.12,
    priceHistory: [
      { year: 1877, price: 0.005 },
      { year: 1950, price: 0.004 },
      { year: 2000, price: 0.003 },
      { year: 2022, price: 0.01 },
      { year: 2023, price: 0.007 },
    ],
  },
);

addAsset(
  {
    id: "soybean_futures",
    name: { zh: "大豆期货", en: "Soybean Futures" },
    ticker: "ZSF",
    category: "futures",
    icon: "futures",
    description: {
      zh: "CBOT大豆期货合约",
      en: "CBOT soybean futures contract",
    },
    riskLevel: 3,
    availableFrom: 1877,
    availableTo: 2023,
  },
  {
    id: "soybean_futures",
    name: { zh: "大豆期货", en: "Soybean Futures" },
    category: "futures",
    unit: "contract",
    availableFrom: 1877,
    availableTo: 2023,
    baseVolatility: 0.12,
    priceHistory: [
      { year: 1877, price: 0.008 },
      { year: 1950, price: 0.006 },
      { year: 2000, price: 0.008 },
      { year: 2022, price: 0.02 },
      { year: 2023, price: 0.015 },
    ],
  },
);

addAsset(
  {
    id: "silver_futures",
    name: { zh: "白银期货", en: "Silver Futures" },
    ticker: "SIF",
    category: "futures",
    icon: "futures",
    description: {
      zh: "COMEX白银期货合约",
      en: "COMEX silver futures contract",
    },
    riskLevel: 4,
    availableFrom: 1963,
    availableTo: 2023,
  },
  {
    id: "silver_futures",
    name: { zh: "白银期货", en: "Silver Futures" },
    category: "futures",
    unit: "contract",
    availableFrom: 1963,
    availableTo: 2023,
    baseVolatility: 0.2,
    priceHistory: [
      { year: 1963, price: 0.15 },
      { year: 1980, price: 0.8 },
      { year: 2000, price: 0.08 },
      { year: 2011, price: 0.6 },
      { year: 2023, price: 0.35 },
    ],
  },
);

addAsset(
  {
    id: "platinum_futures",
    name: { zh: "铂金期货", en: "Platinum Futures" },
    ticker: "PLF",
    category: "futures",
    icon: "futures",
    description: {
      zh: "NYMEX铂金期货合约",
      en: "NYMEX platinum futures contract",
    },
    riskLevel: 4,
    availableFrom: 1956,
    availableTo: 2023,
  },
  {
    id: "platinum_futures",
    name: { zh: "铂金期货", en: "Platinum Futures" },
    category: "futures",
    unit: "contract",
    availableFrom: 1956,
    availableTo: 2023,
    baseVolatility: 0.15,
    priceHistory: [
      { year: 1956, price: 0.2 },
      { year: 1980, price: 0.6 },
      { year: 2008, price: 1.2 },
      { year: 2023, price: 0.5 },
    ],
  },
);

addAsset(
  {
    id: "palladium_futures",
    name: { zh: "钯金期货", en: "Palladium Futures" },
    ticker: "PAF",
    category: "futures",
    icon: "futures",
    description: {
      zh: "NYMEX钯金期货合约",
      en: "NYMEX palladium futures contract",
    },
    riskLevel: 4,
    availableFrom: 1977,
    availableTo: 2023,
  },
  {
    id: "palladium_futures",
    name: { zh: "钯金期货", en: "Palladium Futures" },
    category: "futures",
    unit: "contract",
    availableFrom: 1977,
    availableTo: 2023,
    baseVolatility: 0.2,
    priceHistory: [
      { year: 1977, price: 0.1 },
      { year: 2001, price: 1.2 },
      { year: 2008, price: 0.3 },
      { year: 2021, price: 1.5 },
      { year: 2023, price: 0.6 },
    ],
  },
);

addAsset(
  {
    id: "lean_hog_futures",
    name: { zh: "瘦猪肉期货", en: "Lean Hog Futures" },
    ticker: "HEF",
    category: "futures",
    icon: "futures",
    description: {
      zh: "CME瘦猪肉期货合约",
      en: "CME lean hog futures contract",
    },
    riskLevel: 3,
    availableFrom: 1966,
    availableTo: 2023,
  },
  {
    id: "lean_hog_futures",
    name: { zh: "瘦猪肉期货", en: "Lean Hog Futures" },
    category: "futures",
    unit: "contract",
    availableFrom: 1966,
    availableTo: 2023,
    baseVolatility: 0.14,
    priceHistory: [
      { year: 1966, price: 0.02 },
      { year: 1990, price: 0.03 },
      { year: 2000, price: 0.04 },
      { year: 2023, price: 0.12 },
    ],
  },
);

addAsset(
  {
    id: "cattle_futures",
    name: { zh: "活牛期货", en: "Live Cattle Futures" },
    ticker: "LEF",
    category: "futures",
    icon: "futures",
    description: {
      zh: "CME活牛期货合约",
      en: "CME live cattle futures contract",
    },
    riskLevel: 3,
    availableFrom: 1964,
    availableTo: 2023,
  },
  {
    id: "cattle_futures",
    name: { zh: "活牛期货", en: "Live Cattle Futures" },
    category: "futures",
    unit: "contract",
    availableFrom: 1964,
    availableTo: 2023,
    baseVolatility: 0.1,
    priceHistory: [
      { year: 1964, price: 0.02 },
      { year: 1990, price: 0.05 },
      { year: 2000, price: 0.05 },
      { year: 2023, price: 0.25 },
    ],
  },
);

// ─── DERIVATIVES (additional) ───────────────────────────────────
addAsset(
  {
    id: "bitcoin_futures",
    name: { zh: "比特币期货", en: "Bitcoin Futures" },
    ticker: "BTCF",
    category: "derivative",
    icon: "derivative",
    description: {
      zh: "CME比特币期货合约",
      en: "CME Bitcoin futures contract",
    },
    riskLevel: 5,
    availableFrom: 2017,
    availableTo: 2023,
  },
  {
    id: "bitcoin_futures",
    name: { zh: "比特币期货", en: "Bitcoin Futures" },
    category: "derivative",
    unit: "contract",
    availableFrom: 2017,
    availableTo: 2023,
    baseVolatility: 0.35,
    priceHistory: [
      { year: 2017, price: 0.3 },
      { year: 2021, price: 10.0 },
      { year: 2022, price: 2.5 },
      { year: 2023, price: 7.0 },
    ],
  },
);

addAsset(
  {
    id: "currency_options",
    name: { zh: "外汇期权", en: "Currency Options" },
    ticker: "FXOP",
    category: "derivative",
    icon: "derivative",
    description: {
      zh: "主要货币对的期权合约",
      en: "Options contracts on major currency pairs",
    },
    riskLevel: 4,
    availableFrom: 1982,
    availableTo: 2023,
  },
  {
    id: "currency_options",
    name: { zh: "外汇期权", en: "Currency Options" },
    category: "derivative",
    unit: "contract",
    availableFrom: 1982,
    availableTo: 2023,
    baseVolatility: 0.12,
    priceHistory: [
      { year: 1982, price: 0.01 },
      { year: 2000, price: 0.015 },
      { year: 2023, price: 0.02 },
    ],
  },
);

addAsset(
  {
    id: "commodity_swaps",
    name: { zh: "大宗商品互换", en: "Commodity Swaps" },
    ticker: "CMSWP",
    category: "derivative",
    icon: "derivative",
    description: {
      zh: "大宗商品价格互换合约",
      en: "Commodity price swap agreements",
    },
    riskLevel: 4,
    availableFrom: 1986,
    availableTo: 2023,
  },
  {
    id: "commodity_swaps",
    name: { zh: "大宗商品互换", en: "Commodity Swaps" },
    category: "derivative",
    unit: "contract",
    availableFrom: 1986,
    availableTo: 2023,
    baseVolatility: 0.1,
    priceHistory: [
      { year: 1986, price: 0.02 },
      { year: 2000, price: 0.03 },
      { year: 2023, price: 0.04 },
    ],
  },
);

// ─── PRIVATE EQUITY (additional from Yahoo Finance) ─────────────
addAsset(
  {
    id: "stripe",
    name: { zh: "Stripe", en: "Stripe" },
    ticker: "STRP",
    category: "private_equity",
    icon: "private",
    description: {
      zh: "全球最大在线支付处理平台",
      en: "World's largest online payment processing platform",
    },
    riskLevel: 4,
    availableFrom: 2010,
    availableTo: 2023,
  },
  {
    id: "stripe",
    name: { zh: "Stripe", en: "Stripe" },
    category: "private_equity",
    unit: "share",
    availableFrom: 2010,
    availableTo: 2023,
    baseVolatility: 0.15,
    priceHistory: [
      { year: 2010, price: 0.001 },
      { year: 2019, price: 0.03 },
      { year: 2021, price: 0.06 },
      { year: 2023, price: 0.04 },
    ],
  },
);

addAsset(
  {
    id: "anthropic",
    name: { zh: "Anthropic", en: "Anthropic" },
    ticker: "ANTH",
    category: "private_equity",
    icon: "private",
    description: {
      zh: "AI安全研究公司，Claude开发者",
      en: "AI safety research company, developer of Claude",
    },
    riskLevel: 5,
    availableFrom: 2021,
    availableTo: 2023,
  },
  {
    id: "anthropic",
    name: { zh: "Anthropic", en: "Anthropic" },
    category: "private_equity",
    unit: "share",
    availableFrom: 2021,
    availableTo: 2023,
    baseVolatility: 0.2,
    priceHistory: [
      { year: 2021, price: 0.005 },
      { year: 2023, price: 0.03 },
    ],
  },
);

addAsset(
  {
    id: "databricks",
    name: { zh: "Databricks", en: "Databricks" },
    ticker: "DBKS",
    category: "private_equity",
    icon: "private",
    description: {
      zh: "企业级数据与AI平台",
      en: "Enterprise data and AI platform",
    },
    riskLevel: 4,
    availableFrom: 2013,
    availableTo: 2023,
  },
  {
    id: "databricks",
    name: { zh: "Databricks", en: "Databricks" },
    category: "private_equity",
    unit: "share",
    availableFrom: 2013,
    availableTo: 2023,
    baseVolatility: 0.15,
    priceHistory: [
      { year: 2013, price: 0.001 },
      { year: 2020, price: 0.01 },
      { year: 2023, price: 0.04 },
    ],
  },
);

// ─── GREY MARKET (additional) ────────────────────────────────────
addAsset(
  {
    id: "nft_market",
    name: { zh: "NFT市场", en: "NFT Market" },
    ticker: "NFT",
    category: "grey_market",
    icon: "grey",
    description: {
      zh: "数字收藏品与NFT投机市场",
      en: "Digital collectibles and NFT speculation market",
    },
    riskLevel: 5,
    availableFrom: 2017,
    availableTo: 2023,
  },
  {
    id: "nft_market",
    name: { zh: "NFT市场", en: "NFT Market" },
    category: "grey_market",
    unit: "index",
    availableFrom: 2017,
    availableTo: 2023,
    baseVolatility: 0.4,
    priceHistory: [
      { year: 2017, price: 0.0001 },
      { year: 2021, price: 0.05 },
      { year: 2022, price: 0.005 },
      { year: 2023, price: 0.002 },
    ],
  },
);

addAsset(
  {
    id: "carbon_credits",
    name: { zh: "碳排放权", en: "Carbon Credits" },
    ticker: "CRBN",
    category: "grey_market",
    icon: "grey",
    description: {
      zh: "碳交易市场排放配额",
      en: "Emission allowances from carbon trading markets",
    },
    riskLevel: 4,
    availableFrom: 2005,
    availableTo: 2023,
  },
  {
    id: "carbon_credits",
    name: { zh: "碳排放权", en: "Carbon Credits" },
    category: "grey_market",
    unit: "ton_CO2",
    availableFrom: 2005,
    availableTo: 2023,
    baseVolatility: 0.2,
    priceHistory: [
      { year: 2005, price: 0.003 },
      { year: 2008, price: 0.004 },
      { year: 2013, price: 0.001 },
      { year: 2020, price: 0.004 },
      { year: 2023, price: 0.013 },
    ],
  },
);

// ─── Merge & Write ──────────────────────────────────────────────
catalog.assets.push(...newCatalog);
prices.assets.push(...newPrices);

writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
writeFileSync(pricesPath, JSON.stringify(prices, null, 2) + "\n");

console.log(`\n=== Summary ===`);
console.log(
  `Added ${newCatalog.length} new assets to catalog (total: ${catalog.assets.length})`,
);
console.log(
  `Added ${newPrices.length} new assets to prices (total: ${prices.assets.length})`,
);

const catCounts = {};
for (const a of catalog.assets) {
  catCounts[a.category] = (catCounts[a.category] || 0) + 1;
}
console.log("\nAssets per category:");
for (const [cat, count] of Object.entries(catCounts).sort(
  (a, b) => b[1] - a[1],
)) {
  console.log(`  ${cat}: ${count}`);
}
