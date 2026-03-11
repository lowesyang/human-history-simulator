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
          const id = `evt-trigger-${uuidv4().slice(0, 8)}`;

          insertEvent(
            id,
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

          triggered.push({ id, rule: rule.id, event: eventData });
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
