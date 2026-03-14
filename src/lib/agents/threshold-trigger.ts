import { v4 as uuidv4 } from "uuid";
import type { Region, WorldState, HistoricalEvent, LocalizedText } from "../types";
import { insertEvent, getCurrentEraId } from "../db";

interface ThresholdRule {
  id: string;
  name: LocalizedText;
  condition: (prev: Region, next: Region, world: WorldState) => boolean;
  generateEvent: (region: Region, world: WorldState) => Partial<HistoricalEvent>;
}

const rules: ThresholdRule[] = [
  {
    id: "military_conflict_escalation",
    name: { zh: "军事冲突升级", en: "Military Conflict Escalation" },
    condition: (prev, next) => {
      if (next.status !== "conflict" && next.status !== "declining") return false;
      const prevMil = prev.military?.level ?? 0;
      const nextMil = next.military?.level ?? 0;
      return nextMil - prevMil > 1;
    },
    generateEvent: (region, world) => ({
      timestamp: { year: world.timestamp.year, month: 1 },
      title: {
        zh: `${region.name?.zh ?? region.id}边境紧张局势升级`,
        en: `Border Tensions Escalate in ${region.name?.en ?? region.id}`,
      },
      description: {
        zh: `${region.name?.zh ?? region.id}军事力量急剧增长，周边局势趋于紧张`,
        en: `Rapid military buildup in ${region.name?.en ?? region.id} heightens regional tensions`,
      },
      affectedRegions: [region.id],
      category: "war",
    }),
  },
  {
    id: "economic_collapse",
    name: { zh: "经济崩溃", en: "Economic Collapse" },
    condition: (prev, next) => {
      const prevGdp = prev.economy?.gdpEstimate?.goldKg ?? 0;
      const nextGdp = next.economy?.gdpEstimate?.goldKg ?? 0;
      if (prevGdp <= 0) return false;
      return (prevGdp - nextGdp) / prevGdp > 0.3;
    },
    generateEvent: (region, world) => ({
      timestamp: { year: world.timestamp.year, month: 1 },
      title: {
        zh: `${region.name?.zh ?? region.id}爆发经济危机`,
        en: `Economic Crisis Erupts in ${region.name?.en ?? region.id}`,
      },
      description: {
        zh: `${region.name?.zh ?? region.id}经济总量骤降超过30%，社会动荡加剧`,
        en: `GDP in ${region.name?.en ?? region.id} plunges over 30%, triggering social unrest`,
      },
      affectedRegions: [region.id],
      category: "trade",
    }),
  },
  {
    id: "technology_breakthrough",
    name: { zh: "技术突破", en: "Technology Breakthrough" },
    condition: (prev, next) => {
      const prevTech = prev.technology?.level ?? 0;
      const nextTech = next.technology?.level ?? 0;
      return nextTech >= 9.0 && prevTech < 9.0;
    },
    generateEvent: (region, world) => ({
      timestamp: { year: world.timestamp.year, month: 6 },
      title: {
        zh: `${region.name?.zh ?? region.id}接近技术奇点`,
        en: `${region.name?.en ?? region.id} Approaches Technological Singularity`,
      },
      description: {
        zh: `${region.name?.zh ?? region.id}的技术水平突破关键阈值，引发全球科技格局重组`,
        en: `${region.name?.en ?? region.id}'s technology level crosses a critical threshold, reshaping the global tech landscape`,
      },
      affectedRegions: [region.id],
      category: "technology",
    }),
  },
  {
    id: "population_crisis",
    name: { zh: "人口危机", en: "Population Crisis" },
    condition: (prev, next) => {
      const prevPop = prev.demographics?.population ?? 0;
      const nextPop = next.demographics?.population ?? 0;
      if (prevPop <= 0) return false;
      return (prevPop - nextPop) / prevPop > 0.1;
    },
    generateEvent: (region, world) => ({
      timestamp: { year: world.timestamp.year, month: 1 },
      title: {
        zh: `${region.name?.zh ?? region.id}面临人口结构危机`,
        en: `Demographic Crisis in ${region.name?.en ?? region.id}`,
      },
      description: {
        zh: `${region.name?.zh ?? region.id}人口下降超过10%，劳动力短缺影响经济发展`,
        en: `Population in ${region.name?.en ?? region.id} drops over 10%, labor shortages impact economic growth`,
      },
      affectedRegions: [region.id],
      category: "disaster",
    }),
  },
  {
    id: "alliance_collapse",
    name: { zh: "联盟瓦解", en: "Alliance Collapse" },
    condition: (prev, next) => {
      const prevAllies = (prev.diplomacy?.allies?.en || "").toLowerCase();
      const nextEnemies = (next.diplomacy?.enemies?.en || "").toLowerCase();
      if (!prevAllies || !nextEnemies) return false;
      const allyNames = prevAllies.split(/[,;、]/).map((s: string) => s.trim()).filter(Boolean);
      return allyNames.some((name: string) => name.length > 2 && nextEnemies.includes(name));
    },
    generateEvent: (region, world) => ({
      timestamp: { year: world.timestamp.year, month: 1 },
      title: {
        zh: `${region.name?.zh ?? region.id}的联盟体系瓦解`,
        en: `Alliance System Collapses for ${region.name?.en ?? region.id}`,
      },
      description: {
        zh: `${region.name?.zh ?? region.id}的前盟友转为敌对关系，地缘政治格局剧变`,
        en: `Former allies of ${region.name?.en ?? region.id} turn hostile, dramatically reshaping geopolitical dynamics`,
      },
      affectedRegions: [region.id],
      category: "diplomacy",
    }),
  },
  // ── Economic thresholds ──
  {
    id: "fiscal_crisis",
    name: { zh: "财政危机", en: "Fiscal Crisis" },
    condition: (prev, next) => {
      const debtGoldKg = next.finances?.debtLevel?.goldKg ?? 0;
      const gdpGoldKg = next.economy?.gdpEstimate?.goldKg ?? 0;
      if (gdpGoldKg <= 0) return false;
      const prevDebt = prev.finances?.debtLevel?.goldKg ?? 0;
      const prevGdp = prev.economy?.gdpEstimate?.goldKg ?? 0;
      if (prevGdp <= 0) return false;
      const nextDebt = debtGoldKg;
      const nextGdp = gdpGoldKg;
      const debtToGdp = debtGoldKg / gdpGoldKg;
      const prevDebtToGdp = prevDebt / prevGdp;
      const nextDebtToGdp = nextDebt / nextGdp;
      return debtToGdp > 0.8 && nextDebtToGdp > prevDebtToGdp;
    },
    generateEvent: (region, world) => ({
      id: `threshold-fiscal_crisis-${region.id}`,
      timestamp: { year: world.timestamp.year, month: 1 },
      title: {
        zh: `${region.name?.zh ?? region.id}债务危机加剧`,
        en: `Fiscal Crisis Deepens in ${region.name?.en ?? region.id}`,
      },
      description: {
        zh: `${region.name?.zh ?? region.id}债务占GDP比例突破80%且持续攀升，财政可持续性受到严重威胁`,
        en: `Debt-to-GDP in ${region.name?.en ?? region.id} exceeds 80% and continues rising, seriously threatening fiscal sustainability`,
      },
      affectedRegions: [region.id],
      category: "finance",
      importance: "high",
    }),
  },
  {
    id: "trade_boom",
    name: { zh: "贸易繁荣", en: "Trade Boom" },
    condition: (prev, next) => {
      const prevTrade = prev.economy?.foreignTradeVolume?.goldKg ?? 0;
      const nextTrade = next.economy?.foreignTradeVolume?.goldKg ?? 0;
      if (prevTrade <= 0) return false;
      return (nextTrade - prevTrade) / prevTrade > 0.5;
    },
    generateEvent: (region, world) => ({
      id: `threshold-trade_boom-${region.id}`,
      timestamp: { year: world.timestamp.year, month: 1 },
      title: {
        zh: `${region.name?.zh ?? region.id}对外贸易大幅增长`,
        en: `Trade Boom in ${region.name?.en ?? region.id}`,
      },
      description: {
        zh: `${region.name?.zh ?? region.id}对外贸易额同比增长超过50%，经济活力显著提升`,
        en: `Foreign trade volume in ${region.name?.en ?? region.id} surges over 50% year-on-year, significantly boosting economic vitality`,
      },
      affectedRegions: [region.id],
      category: "trade",
      importance: "medium",
    }),
  },
  {
    id: "hyperinflation",
    name: { zh: "恶性通货膨胀风险", en: "Hyperinflation Risk" },
    condition: (prev, next) => {
      const treasury = next.finances?.treasury?.goldKg ?? 0;
      const milPct = next.military?.militarySpendingPctGdp ?? 0;
      return treasury <= 0 && milPct > 30;
    },
    generateEvent: (region, world) => ({
      id: `threshold-hyperinflation-${region.id}`,
      timestamp: { year: world.timestamp.year, month: 1 },
      title: {
        zh: `${region.name?.zh ?? region.id}面临恶性通货膨胀风险`,
        en: `Hyperinflation Risk in ${region.name?.en ?? region.id}`,
      },
      description: {
        zh: `${region.name?.zh ?? region.id}国库枯竭且军费占GDP超30%，货币贬值与恶性通胀风险急剧上升`,
        en: `With depleted treasury and military spending exceeding 30% of GDP, ${region.name?.en ?? region.id} faces acute hyperinflation and currency collapse risk`,
      },
      affectedRegions: [region.id],
      category: "finance",
      importance: "critical",
    }),
  },
  {
    id: "golden_age",
    name: { zh: "黄金时代", en: "Golden Age" },
    condition: (prev, next) => {
      const prevGdp = prev.economy?.gdpEstimate?.goldKg ?? 0;
      const nextGdp = next.economy?.gdpEstimate?.goldKg ?? 0;
      if (prevGdp <= 0) return false;
      const growth = (nextGdp - prevGdp) / prevGdp;
      const milPct = next.military?.militarySpendingPctGdp ?? 0;
      return growth > 0.05 && milPct < 15 && next.status !== "conflict";
    },
    generateEvent: (region, world) => ({
      id: `threshold-golden_age-${region.id}`,
      timestamp: { year: world.timestamp.year, month: 1 },
      title: {
        zh: `${region.name?.zh ?? region.id}进入黄金时代`,
        en: `Golden Age in ${region.name?.en ?? region.id}`,
      },
      description: {
        zh: `${region.name?.zh ?? region.id}经济持续增长超5%、军费占比低于15%且无战事，社会繁荣稳定`,
        en: `Sustained GDP growth over 5%, military spending under 15% of GDP, and peace—${region.name?.en ?? region.id} enters a prosperous golden age`,
      },
      affectedRegions: [region.id],
      category: "trade",
      importance: "medium",
    }),
  },
];

export interface TriggeredEvent {
  id: string;
  rule: string;
  event: Partial<HistoricalEvent>;
}

export function checkThresholds(
  prevRegions: Region[],
  nextRegions: Region[],
  world: WorldState
): TriggeredEvent[] {
  const triggered: TriggeredEvent[] = [];
  const prevMap = new Map(prevRegions.map((r) => [r.id, r]));
  const eraId = getCurrentEraId();

  for (const next of nextRegions) {
    const prev = prevMap.get(next.id);
    if (!prev) continue;

    for (const rule of rules) {
      try {
        if (rule.condition(prev, next, world)) {
          const eventData = rule.generateEvent(next, world);
          const eventId = eventData.id ?? `evt-trigger-${uuidv4().slice(0, 8)}`;

          insertEvent(
            eventId,
            eventData.timestamp?.year ?? world.timestamp.year,
            eventData.timestamp?.month ?? 1,
            eventData.title!,
            eventData.description!,
            eventData.affectedRegions ?? [next.id],
            eventData.category ?? "other",
            "pending",
            false,
            eraId ?? undefined
          );

          triggered.push({ id: eventId, rule: rule.id, event: eventData });
        }
      } catch (err) {
        console.error(`[ThresholdTrigger] Rule ${rule.id} failed for ${next.id}:`, err);
      }
    }
  }

  if (triggered.length > 0) {
    console.log(`[ThresholdTrigger] Triggered ${triggered.length} events: ${triggered.map(t => t.rule).join(", ")}`);
  }

  return triggered;
}
