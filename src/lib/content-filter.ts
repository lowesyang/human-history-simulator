/**
 * Content filter for historically sensitive events that are prohibited
 * from being generated or displayed in certain jurisdictions.
 *
 * This module provides:
 * 1. A prompt-level instruction block to inject into LLM system prompts
 * 2. A post-generation filter to catch anything the LLM still produces
 */

const BLOCKED_KEYWORDS_ZH = [
  "六四",
  "天安门事件",
  "天安门广场抗议",
  "天安门屠杀",
  "天安门运动",
  "学潮",
  "八九民运",
  "八九学运",
  "六四事件",
  "六四屠杀",
  "六四运动",
  "法轮功",
  "法轮大法",
  "文化大革命",
  "文革",
  "大跃进",
  "大饥荒",
  "反右运动",
  "反右派",
  "百花运动",
  "西藏独立",
  "藏独",
  "疆独",
  "东突厥斯坦",
  "台独",
  "台湾独立",
  "刘晓波",
  "零八宪章",
  "达赖喇嘛",
  "新疆集中营",
  "再教育营",
  "三年自然灾害",
  "土地改革运动",
  "镇压反革命",
  "整风运动",
  "三反五反",
];

const BLOCKED_KEYWORDS_EN = [
  "tiananmen square protest",
  "tiananmen square massacre",
  "tiananmen incident",
  "tiananmen movement",
  "june fourth",
  "june 4th incident",
  "june 4th massacre",
  "1989 pro-democracy",
  "1989 student protest",
  "1989 democracy movement",
  "tank man",
  "falun gong",
  "falun dafa",
  "cultural revolution",
  "great leap forward",
  "great chinese famine",
  "anti-rightist",
  "anti rightist",
  "hundred flowers",
  "free tibet",
  "tibetan independence",
  "east turkestan",
  "taiwan independence movement",
  "liu xiaobo",
  "charter 08",
  "dalai lama",
  "xinjiang internment",
  "uyghur detention",
  "re-education camp",
  "reeducation camp",
  "three years of famine",
  "land reform movement china",
  "campaign to suppress counterrevolutionaries",
  "rectification movement",
  "three-anti five-anti",
];

const blockedPatternsZh = BLOCKED_KEYWORDS_ZH.map(
  (kw) => new RegExp(kw, "i")
);
const blockedPatternsEn = BLOCKED_KEYWORDS_EN.map(
  (kw) => new RegExp(kw, "i")
);

function textContainsBlocked(text: string): boolean {
  const lower = text.toLowerCase();
  for (const pat of blockedPatternsZh) {
    if (pat.test(text)) return true;
  }
  for (const pat of blockedPatternsEn) {
    if (pat.test(lower)) return true;
  }
  return false;
}

/**
 * Check whether a generated event should be blocked.
 * Inspects title and description in both zh and en.
 */
export function isBlockedEvent(event: {
  title?: { zh?: string; en?: string };
  description?: { zh?: string; en?: string };
}): boolean {
  const fields = [
    event.title?.zh,
    event.title?.en,
    event.description?.zh,
    event.description?.en,
  ];
  for (const field of fields) {
    if (field && textContainsBlocked(field)) return true;
  }
  return false;
}

/**
 * Prompt instruction block to prepend/append into LLM system prompts.
 * Tells the model not to generate events about sensitive topics.
 */
export const CONTENT_FILTER_PROMPT = `
CONTENT RESTRICTIONS — STRICTLY ENFORCED:
You MUST NOT generate any events, descriptions, or references related to the following topics. These are absolutely forbidden:
- The 1989 Tiananmen Square protests or any related student movements in China
- The Cultural Revolution (1966–1976)
- The Great Leap Forward and associated famine (1958–1962)
- The Anti-Rightist Campaign, Hundred Flowers Campaign
- Falun Gong / Falun Dafa
- Tibet independence movements or the Dalai Lama's political activities
- Xinjiang/East Turkestan independence movements or detention facilities
- Taiwan independence movements (distinct from cross-strait relations as a diplomatic topic)
- Liu Xiaobo, Charter 08
- The Three-Anti/Five-Anti Campaigns
- The Campaign to Suppress Counterrevolutionaries
- Any other event that is considered politically sensitive and censored in mainland China

If a year or period involves any of the above, simply skip those events and generate other historically significant events from the same timeframe instead. Do NOT mention these restrictions in any output.`.trim();
