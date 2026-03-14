import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const catalogPath = join(root, "src/data/economic/asset-catalog.json");
const pricesPath = join(root, "src/data/economic/asset-prices.json");

const catalog = JSON.parse(readFileSync(catalogPath, "utf-8"));
const prices = JSON.parse(readFileSync(pricesPath, "utf-8"));

const existingCatIds = new Set(catalog.assets.map((a) => a.id));
const existingPriceIds = new Set(prices.assets.map((a) => a.id));

let addedCount = 0;

function add(cat, price) {
  if (!existingCatIds.has(cat.id)) {
    catalog.assets.push(cat);
    existingCatIds.add(cat.id);
  }
  if (!existingPriceIds.has(price.id)) {
    prices.assets.push(price);
    existingPriceIds.add(price.id);
  }
  addedCount++;
}

function crypto(id, nameZh, nameEn, ticker, from, to, risk, descZh, descEn, vol, ph) {
  add(
    {
      id, ticker, category: "crypto", icon: "crypto", riskLevel: risk,
      availableFrom: from, availableTo: to,
      name: { zh: nameZh, en: nameEn },
      description: { zh: descZh, en: descEn },
    },
    {
      id, category: "crypto", unit: "coin",
      availableFrom: from, availableTo: to,
      name: { zh: nameZh, en: nameEn },
      baseVolatility: vol, priceHistory: ph,
    }
  );
}

// ═══════════════════════════════════════════════════════════════════
// CMC Top 50 — coins that existed by 2023 and are NOT yet in catalog
// Prices in gold grams per coin (game-internal scale: BTC≈7, ETH≈0.5)
// ═══════════════════════════════════════════════════════════════════

// #13 LEO — UNUS SED LEO (Bitfinex exchange token, launched May 2019)
crypto("leo_token", "LEO代币", "UNUS SED LEO", "LEO", 2019, 2023, 2,
  "Bitfinex交易所平台代币", "Bitfinex exchange utility token", 0.08,
  [{ year: 2019, price: 0.00002 }, { year: 2020, price: 0.00002 }, { year: 2022, price: 0.00005 }, { year: 2023, price: 0.00006 }]);

// #18 XLM — Stellar (launched Jul 2014)
crypto("stellar", "恒星币", "Stellar", "XLM", 2014, 2023, 4,
  "跨境支付与汇款协议", "Cross-border payment and remittance protocol", 0.25,
  [{ year: 2014, price: 0.0000001 }, { year: 2018, price: 0.00005 }, { year: 2020, price: 0.000002 }, { year: 2021, price: 0.00005 }, { year: 2023, price: 0.000002 }]);

// #19 DAI — Dai (launched Dec 2017, MakerDAO)
crypto("dai", "Dai稳定币", "Dai", "DAI", 2017, 2023, 1,
  "去中心化超额抵押美元稳定币", "Decentralized over-collateralized USD stablecoin", 0.02,
  [{ year: 2017, price: 0.000016 }, { year: 2023, price: 0.000016 }]);

// #23 HBAR — Hedera (launched Sep 2019)
crypto("hedera", "Hedera", "Hedera", "HBAR", 2019, 2023, 4,
  "企业级分布式账本技术", "Enterprise-grade distributed ledger technology", 0.25,
  [{ year: 2019, price: 0.000005 }, { year: 2021, price: 0.00005 }, { year: 2023, price: 0.000001 }]);

// #25 SUI — Sui (launched May 2023)
crypto("sui", "Sui", "Sui", "SUI", 2023, 2023, 5,
  "Move语言新一代高性能L1", "Next-gen high-performance L1 built with Move", 0.3,
  [{ year: 2023, price: 0.00001 }]);

// #27 ZEC — Zcash (launched Oct 2016)
crypto("zcash", "Zcash", "Zcash", "ZEC", 2016, 2023, 4,
  "零知识证明隐私加密货币", "Zero-knowledge proof privacy cryptocurrency", 0.25,
  [{ year: 2016, price: 0.01 }, { year: 2017, price: 0.005 }, { year: 2018, price: 0.01 }, { year: 2021, price: 0.005 }, { year: 2023, price: 0.0005 }]);

// #28 TON — Toncoin (Telegram origin, launched Nov 2021)
crypto("toncoin", "Toncoin", "Toncoin", "TON", 2021, 2023, 4,
  "Telegram生态区块链", "Telegram ecosystem blockchain", 0.25,
  [{ year: 2021, price: 0.00005 }, { year: 2022, price: 0.00002 }, { year: 2023, price: 0.00004 }]);

// #29 CRO — Cronos / Crypto.com (launched Nov 2018)
crypto("cronos", "Cronos", "Cronos", "CRO", 2018, 2023, 4,
  "Crypto.com交易所生态链", "Crypto.com exchange ecosystem chain", 0.25,
  [{ year: 2018, price: 0.000001 }, { year: 2021, price: 0.00015 }, { year: 2023, price: 0.000001 }]);

// #31 XAUt — Tether Gold (launched Jan 2020)
crypto("tether_gold", "Tether黄金", "Tether Gold", "XAUt", 2020, 2023, 1,
  "泰达黄金代币，每枚锚定一盎司黄金", "Tether gold token, each pegged to one troy oz of gold", 0.05,
  [{ year: 2020, price: 0.03 }, { year: 2023, price: 0.031 }]);

// #33 TAO — Bittensor (launched 2021)
crypto("bittensor", "Bittensor", "Bittensor", "TAO", 2021, 2023, 5,
  "去中心化AI/机器学习网络", "Decentralized AI/machine learning network", 0.35,
  [{ year: 2021, price: 0.001 }, { year: 2023, price: 0.005 }]);

// #34 PAXG — PAX Gold (launched Sep 2019)
crypto("pax_gold", "PAX黄金", "PAX Gold", "PAXG", 2019, 2023, 1,
  "受监管的黄金代币化资产", "Regulated tokenized gold asset", 0.05,
  [{ year: 2019, price: 0.025 }, { year: 2020, price: 0.03 }, { year: 2023, price: 0.031 }]);

// #36 MNT — Mantle (launched Jul 2023)
crypto("mantle", "Mantle", "Mantle", "MNT", 2023, 2023, 5,
  "以太坊Layer 2模块化扩展方案", "Ethereum Layer 2 modular scaling solution", 0.3,
  [{ year: 2023, price: 0.000008 }]);

// #38 OKB — OKB (launched Apr 2019)
crypto("okb", "OKB", "OKB", "OKB", 2019, 2023, 3,
  "OKX交易所平台代币", "OKX exchange platform token", 0.15,
  [{ year: 2019, price: 0.00005 }, { year: 2021, price: 0.0003 }, { year: 2023, price: 0.0008 }]);

// #40 SKY (MakerDAO MKR rebranded 2024, but MKR since 2017)
crypto("maker", "MakerDAO", "MakerDAO", "MKR", 2017, 2023, 4,
  "去中心化借贷协议治理代币", "Decentralized lending protocol governance token", 0.2,
  [{ year: 2017, price: 0.001 }, { year: 2018, price: 0.025 }, { year: 2020, price: 0.008 }, { year: 2021, price: 0.06 }, { year: 2023, price: 0.025 }]);

// #41 NEAR — NEAR Protocol (launched Apr 2020)
crypto("near", "NEAR Protocol", "NEAR Protocol", "NEAR", 2020, 2023, 5,
  "分片式高性能区块链平台", "Sharded high-performance blockchain platform", 0.3,
  [{ year: 2020, price: 0.00003 }, { year: 2022, price: 0.003 }, { year: 2023, price: 0.00003 }]);

// #42 AAVE — Aave (launched Oct 2020, originally LEND 2017)
crypto("aave", "Aave", "Aave", "AAVE", 2020, 2023, 4,
  "最大的去中心化借贷协议", "Largest decentralized lending protocol", 0.25,
  [{ year: 2020, price: 0.001 }, { year: 2021, price: 0.01 }, { year: 2022, price: 0.001 }, { year: 2023, price: 0.0015 }]);

// #46 BGB — Bitget Token (launched 2022)
crypto("bitget", "Bitget Token", "Bitget Token", "BGB", 2022, 2023, 4,
  "Bitget交易所平台代币", "Bitget exchange platform token", 0.2,
  [{ year: 2022, price: 0.000005 }, { year: 2023, price: 0.00001 }]);

// #47 ICP — Internet Computer (launched May 2021)
crypto("icp", "Internet Computer", "Internet Computer", "ICP", 2021, 2023, 5,
  "去中心化世界计算机", "Decentralized world computer", 0.35,
  [{ year: 2021, price: 0.06 }, { year: 2022, price: 0.0005 }, { year: 2023, price: 0.0008 }]);

// #48 PEPE — Pepe (launched Apr 2023)
crypto("pepe", "Pepe", "Pepe", "PEPE", 2023, 2023, 5,
  "以青蛙Pepe为主题的Meme代币", "Pepe the Frog themed meme token", 0.4,
  [{ year: 2023, price: 0.00000001 }]);

// #49 ETC — Ethereum Classic (launched Jul 2016)
crypto("ethereum_classic", "以太坊经典", "Ethereum Classic", "ETC", 2016, 2023, 4,
  "以太坊原链，DAO分叉后保留", "Original Ethereum chain after DAO fork", 0.2,
  [{ year: 2016, price: 0.00002 }, { year: 2018, price: 0.0005 }, { year: 2021, price: 0.001 }, { year: 2023, price: 0.0003 }]);

// ═══════════════════════════════════════════════════════════════════
// Supplementary — notable coins just outside top 50 (to reach 50 total)
// ═══════════════════════════════════════════════════════════════════

// ATOM — Cosmos (launched Mar 2019)
crypto("cosmos", "Cosmos", "Cosmos", "ATOM", 2019, 2023, 4,
  "区块链互联网，跨链通信协议", "Internet of Blockchains, IBC protocol", 0.2,
  [{ year: 2019, price: 0.0001 }, { year: 2022, price: 0.0005 }, { year: 2023, price: 0.00015 }]);

// FIL — Filecoin (launched Oct 2020)
crypto("filecoin", "Filecoin", "Filecoin", "FIL", 2020, 2023, 5,
  "去中心化存储网络", "Decentralized storage network", 0.3,
  [{ year: 2020, price: 0.0005 }, { year: 2021, price: 0.003 }, { year: 2023, price: 0.0001 }]);

// APT — Aptos (launched Oct 2022)
crypto("aptos", "Aptos", "Aptos", "APT", 2022, 2023, 5,
  "Move语言L1区块链（前Meta团队）", "Move-based L1 blockchain (ex-Meta team)", 0.3,
  [{ year: 2022, price: 0.0001 }, { year: 2023, price: 0.00012 }]);

// RENDER — Render Network (launched 2020)
crypto("render", "Render Network", "Render Network", "RENDER", 2020, 2023, 5,
  "去中心化GPU渲染算力网络", "Decentralized GPU rendering compute network", 0.3,
  [{ year: 2020, price: 0.000005 }, { year: 2021, price: 0.0001 }, { year: 2023, price: 0.00005 }]);

// ARB — Arbitrum (launched Mar 2023)
crypto("arbitrum", "Arbitrum", "Arbitrum", "ARB", 2023, 2023, 5,
  "最大的以太坊Optimistic Rollup L2", "Largest Ethereum Optimistic Rollup L2", 0.3,
  [{ year: 2023, price: 0.00002 }]);

// STX — Stacks (launched Oct 2019)
crypto("stacks", "Stacks", "Stacks", "STX", 2019, 2023, 5,
  "比特币智能合约层", "Bitcoin smart contract layer", 0.3,
  [{ year: 2019, price: 0.000003 }, { year: 2021, price: 0.00003 }, { year: 2023, price: 0.00002 }]);

// ALGO — Algorand (launched Jun 2019)
crypto("algorand", "Algorand", "Algorand", "ALGO", 2019, 2023, 4,
  "纯权益证明高性能公链", "Pure proof-of-stake high-performance blockchain", 0.25,
  [{ year: 2019, price: 0.00005 }, { year: 2021, price: 0.00003 }, { year: 2023, price: 0.000003 }]);

// VET — VeChain (launched 2018)
crypto("vechain", "唯链", "VeChain", "VET", 2018, 2023, 4,
  "企业级供应链管理区块链", "Enterprise supply chain management blockchain", 0.2,
  [{ year: 2018, price: 0.00001 }, { year: 2021, price: 0.00003 }, { year: 2023, price: 0.000003 }]);

// GRT — The Graph (launched Dec 2020)
crypto("the_graph", "The Graph", "The Graph", "GRT", 2020, 2023, 5,
  "Web3数据索引协议", "Web3 data indexing protocol", 0.3,
  [{ year: 2020, price: 0.000005 }, { year: 2021, price: 0.00003 }, { year: 2023, price: 0.000003 }]);

// XTZ — Tezos (launched Jun 2018)
crypto("tezos", "Tezos", "Tezos", "XTZ", 2018, 2023, 4,
  "自修正区块链协议", "Self-amending blockchain protocol", 0.2,
  [{ year: 2018, price: 0.00005 }, { year: 2021, price: 0.0001 }, { year: 2023, price: 0.000012 }]);

// CRV — Curve DAO (launched Aug 2020)
crypto("curve", "Curve DAO", "Curve DAO", "CRV", 2020, 2023, 5,
  "稳定币交易专用去中心化交易所", "DEX specialized in stablecoin trading", 0.3,
  [{ year: 2020, price: 0.00005 }, { year: 2021, price: 0.00008 }, { year: 2023, price: 0.00001 }]);

// ═══════════════════════════════════════════════════════════════════
// Write out
// ═══════════════════════════════════════════════════════════════════
writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
writeFileSync(pricesPath, JSON.stringify(prices, null, 2) + "\n");

const cryptos = catalog.assets.filter((a) => a.category === "crypto");
console.log(`Added ${addedCount} new crypto assets`);
console.log(`Total crypto assets: ${cryptos.length}`);
console.log("\nAll crypto tickers:");
for (const c of cryptos) {
  console.log(`  ${c.ticker.padEnd(8)} ${c.name.en}`);
}
