import type { Region, HistoricalEvent, War } from "./types";

const DEFAULT_MAX_GROUP_SIZE = 10;

export interface RegionGroup {
  regionIds: string[];
  isOrphanGroup: boolean;
}

/**
 * Build an undirected relation graph between regions based on:
 * 1. Event co-occurrence (regions sharing the same event)
 * 2. War belligerents (all sides in active wars)
 * 3. Territory proximity (regions sharing the same territoryId)
 */
export function buildRelationGraph(
  regions: Region[],
  events: HistoricalEvent[],
  wars: War[]
): Map<string, Set<string>> {
  const regionIdSet = new Set(regions.map((r) => r.id));
  const graph = new Map<string, Set<string>>();

  for (const r of regions) {
    graph.set(r.id, new Set());
  }

  function addEdge(a: string, b: string) {
    if (a === b || !regionIdSet.has(a) || !regionIdSet.has(b)) return;
    graph.get(a)!.add(b);
    graph.get(b)!.add(a);
  }

  for (const evt of events) {
    const rids = evt.affectedRegions.filter((id) => regionIdSet.has(id));
    for (let i = 0; i < rids.length; i++) {
      for (let j = i + 1; j < rids.length; j++) {
        addEdge(rids[i], rids[j]);
      }
    }
  }

  for (const war of wars) {
    const all = [
      ...(war.belligerents?.side1?.regionIds ?? []),
      ...(war.belligerents?.side2?.regionIds ?? []),
    ].filter((id) => regionIdSet.has(id));
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        addEdge(all[i], all[j]);
      }
    }
  }

  const territoryMap = new Map<string, string[]>();
  for (const r of regions) {
    if (!r.territoryId) continue;
    const list = territoryMap.get(r.territoryId) || [];
    list.push(r.id);
    territoryMap.set(r.territoryId, list);
  }
  for (const members of territoryMap.values()) {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        addEdge(members[i], members[j]);
      }
    }
  }

  return graph;
}

/**
 * Cluster regions into groups using BFS connected components,
 * respecting a maximum group size cap. Orphan regions (no graph edges)
 * are merged into a single group marked as an orphan/independent group.
 */
export function clusterRegions(
  graph: Map<string, Set<string>>,
  maxGroupSize?: number
): RegionGroup[] {
  const cap = maxGroupSize ?? getMaxGroupSize();
  const visited = new Set<string>();
  const groups: RegionGroup[] = [];
  const orphans: string[] = [];

  for (const regionId of graph.keys()) {
    if (visited.has(regionId)) continue;

    const neighbors = graph.get(regionId)!;
    if (neighbors.size === 0) {
      visited.add(regionId);
      orphans.push(regionId);
      continue;
    }

    const component: string[] = [];
    const queue = [regionId];
    visited.add(regionId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);
      for (const neighbor of graph.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    if (component.length <= cap) {
      groups.push({ regionIds: component, isOrphanGroup: false });
    } else {
      for (let i = 0; i < component.length; i += cap) {
        groups.push({ regionIds: component.slice(i, i + cap), isOrphanGroup: false });
      }
    }
  }

  if (orphans.length > 0) {
    groups.push({ regionIds: orphans, isOrphanGroup: true });
  }

  return groups;
}

export function getMaxGroupSize(): number {
  const envVal = process.env.LLM_MAX_GROUP_SIZE;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_MAX_GROUP_SIZE;
}
