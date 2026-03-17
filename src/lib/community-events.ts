import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { HistoricalEvent } from "@/lib/types";

const COMMUNITY_EVENTS_DIR = "public/community-events";

const VALID_CATEGORIES = new Set([
  "war", "dynasty", "invention", "trade", "religion", "disaster",
  "natural_disaster", "exploration", "diplomacy", "migration",
  "technology", "finance", "political", "announcement", "other",
]);

const FILENAME_RE = /^(-?\d+)\.json$/;

function resolveEventsDir(): string {
  const appResourceDir = process.env.APP_RESOURCE_DIR;
  if (appResourceDir) {
    return path.join(appResourceDir, COMMUNITY_EVENTS_DIR);
  }
  return path.join(process.cwd(), COMMUNITY_EVENTS_DIR);
}

export interface RawCommunityEvent {
  timestamp: { year: number; month: number };
  title: { zh: string; en: string };
  description: { zh: string; en: string };
  affectedRegions: string[];
  category: string;
  source: string;
  contributor?: string;
}

export interface CommunityEventWithMeta extends HistoricalEvent {
  source: string;
  contributor?: string;
}

let eventsByYear: Map<number, CommunityEventWithMeta[]> | null = null;

function generateEventId(evt: RawCommunityEvent): string {
  const payload = `${evt.timestamp.year}|${evt.timestamp.month}|${evt.title.en}|${evt.category}`;
  const hash = crypto.createHash("sha256").update(payload).digest("hex").slice(0, 12);
  return `ce-${evt.timestamp.year}-${hash}`;
}

function validateEvent(evt: RawCommunityEvent, fileYear: number, file: string): string | null {
  if (evt.timestamp.year !== fileYear) {
    return `timestamp.year ${evt.timestamp.year} does not match file year ${fileYear} in ${file}`;
  }
  if (!evt.timestamp.month || evt.timestamp.month < 1 || evt.timestamp.month > 12) {
    return `invalid month ${evt.timestamp.month} — must be 1-12`;
  }
  if (!evt.title?.zh || !evt.title?.en) {
    return "title must have both zh and en fields";
  }
  if (!evt.description?.zh || !evt.description?.en) {
    return "description must have both zh and en fields";
  }
  if (!Array.isArray(evt.affectedRegions) || evt.affectedRegions.length === 0) {
    return "affectedRegions must be a non-empty array";
  }
  if (!VALID_CATEGORIES.has(evt.category)) {
    return `invalid category "${evt.category}"`;
  }
  if (!evt.source || !/^https?:\/\/.+/.test(evt.source)) {
    return `source must be a valid HTTP/HTTPS URL (got "${evt.source || ""}")`;
  }
  return null;
}

function loadAllCommunityEvents(): Map<number, CommunityEventWithMeta[]> {
  if (eventsByYear) return eventsByYear;

  eventsByYear = new Map();
  const dir = resolveEventsDir();

  if (!fs.existsSync(dir)) return eventsByYear;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const seenIds = new Set<string>();

  for (const file of files) {
    const filenameMatch = file.match(FILENAME_RE);
    if (!filenameMatch) {
      console.warn(`[CommunityEvents] Skipping "${file}" — filename must be {year}.json (e.g. 1939.json, -207.json)`);
      continue;
    }
    const fileYear = Number(filenameMatch[1]);

    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        console.warn(`[CommunityEvents] Skipping "${file}" — root must be a JSON array`);
        continue;
      }

      const events: RawCommunityEvent[] = parsed;

      for (let i = 0; i < events.length; i++) {
        const evt = events[i];
        if (!evt.timestamp?.year || !evt.title || !evt.affectedRegions) {
          console.warn(`[CommunityEvents] Skipping event [index ${i}] in ${file} — missing required fields`);
          continue;
        }

        const error = validateEvent(evt, fileYear, file);
        if (error) {
          console.warn(`[CommunityEvents] Skipping event [index ${i}] in ${file} — ${error}`);
          continue;
        }

        const id = generateEventId(evt);

        if (seenIds.has(id)) {
          console.warn(`[CommunityEvents] Skipping duplicate event [index ${i}] in ${file} — fingerprint collision (same year+month+title+category)`);
          continue;
        }
        seenIds.add(id);

        const communityEvent: CommunityEventWithMeta = {
          id,
          timestamp: { year: evt.timestamp.year, month: evt.timestamp.month },
          title: evt.title,
          description: evt.description,
          affectedRegions: evt.affectedRegions,
          category: evt.category as HistoricalEvent["category"],
          status: "pending",
          source: evt.source,
          contributor: evt.contributor,
        };

        if (!eventsByYear.has(fileYear)) {
          eventsByYear.set(fileYear, []);
        }
        eventsByYear.get(fileYear)!.push(communityEvent);
      }
    } catch (err) {
      console.error(`[CommunityEvents] Failed to parse ${file}:`, err);
    }
  }

  return eventsByYear;
}

export function getCommunityEventsForYears(years: number[]): HistoricalEvent[] {
  const allEvents = loadAllCommunityEvents();
  const result: HistoricalEvent[] = [];

  for (const year of years) {
    const yearEvents = allEvents.get(year);
    if (yearEvents) {
      result.push(...yearEvents);
    }
  }

  return result;
}

export function getCommunityEventsForYear(year: number): HistoricalEvent[] {
  const allEvents = loadAllCommunityEvents();
  return allEvents.get(year) ?? [];
}

export function getAvailableCommunityEventYears(): number[] {
  const allEvents = loadAllCommunityEvents();
  return [...allEvents.keys()].sort((a, b) => a - b);
}

export function getAllCommunityEvents(): CommunityEventWithMeta[] {
  const allEvents = loadAllCommunityEvents();
  const result: CommunityEventWithMeta[] = [];
  for (const events of allEvents.values()) {
    result.push(...events);
  }
  return result.sort((a, b) => a.timestamp.year - b.timestamp.year || a.timestamp.month - b.timestamp.month);
}

export function invalidateCommunityEventsCache(): void {
  eventsByYear = null;
}
