import type { RegionTransition } from "../transition";
import type { LocalizedText } from "../types";
import { insertCivMemory, getRecentCivMemories } from "../db";
import { getRuntimeSettings } from "../settings";

function isSignificantTransition(transition: RegionTransition): boolean {
  const changes = transition.changes;
  if (!changes) return false;

  const significantKeys = [
    "status", "civilization.ruler", "civilization.dynasty",
    "civilization.governmentForm", "military.level", "economy.level",
  ];

  const changedKeys = Object.keys(changes);
  if (changedKeys.length >= 5) return true;
  return changedKeys.some((key) => significantKeys.includes(key));
}

function extractMemoryText(transition: RegionTransition): string {
  const desc = transition.description;
  if (!desc) return "";

  const en = typeof desc === "string" ? desc : desc.en || "";
  const zh = typeof desc === "string" ? desc : desc.zh || "";

  const intent = transition.strategicIntent;
  const intentStr = intent ? ` [Intent: ${intent.en || intent.zh || ""}]` : "";

  const text = en || zh;
  if (text.length > 150) return text.slice(0, 147) + "..." + intentStr;
  return text + intentStr;
}

export function processCivMemories(
  transitions: RegionTransition[],
  targetYear: number
): void {
  const settings = getRuntimeSettings();
  if (!settings?.enableCivMemory) return;

  for (const transition of transitions) {
    if (!transition.regionId) continue;
    if (!isSignificantTransition(transition)) continue;

    const memoryText = extractMemoryText(transition);
    if (!memoryText) continue;

    insertCivMemory(transition.regionId, targetYear, memoryText);
  }
}

export function buildMemoryContext(regionIds: string[]): string {
  const settings = getRuntimeSettings();
  if (!settings?.enableCivMemory) return "";

  const memories: string[] = [];
  for (const rid of regionIds) {
    const recent = getRecentCivMemories(rid, 5);
    if (recent.length === 0) continue;

    const lines = recent.map((m) => `[${m.year}] ${m.memoryText}`).join("; ");
    memories.push(`${rid}: ${lines}`);
  }

  if (memories.length === 0) return "";
  return `\nCivilization Memory (past decisions and outcomes):\n${memories.join("\n")}`;
}
