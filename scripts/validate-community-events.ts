#!/usr/bin/env npx tsx
/**
 * Validates all community event JSON files.
 * Used by CI (GitHub Actions) and can be run locally: npx tsx scripts/validate-community-events.ts
 *
 * IDs are NOT required in the JSON — they are auto-generated at load time from a
 * content fingerprint (sha256 of year|month|title.en|category).
 *
 * Exit code 0 = all valid, 1 = errors found.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

const COMMUNITY_DIR = path.join(process.cwd(), "public", "community-events");

const FILENAME_RE = /^(-?\d+)\.json$/;

const VALID_CATEGORIES = new Set([
  "war", "dynasty", "invention", "trade", "religion", "disaster",
  "natural_disaster", "exploration", "diplomacy", "migration",
  "technology", "finance", "political", "announcement", "other",
]);

interface CommunityEvent {
  timestamp?: { year?: number; month?: number };
  title?: { zh?: string; en?: string };
  description?: { zh?: string; en?: string };
  affectedRegions?: string[];
  category?: string;
  source?: string;
  contributor?: string;
}

function fingerprint(evt: CommunityEvent): string {
  const payload = `${evt.timestamp?.year}|${evt.timestamp?.month}|${evt.title?.en}|${evt.category}`;
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 12);
}

const errors: string[] = [];
const seenFingerprints = new Set<string>();
let totalEvents = 0;

function error(file: string, msg: string, label?: string) {
  const prefix = label ? `${file} → ${label}` : file;
  errors.push(`  ✗ ${prefix}: ${msg}`);
}

if (!fs.existsSync(COMMUNITY_DIR)) {
  console.log("✓ No public/community-events/ directory found — nothing to validate.");
  process.exit(0);
}

const allFiles = fs.readdirSync(COMMUNITY_DIR);
const jsonFiles = allFiles.filter((f) => f.endsWith(".json"));
const nonJsonNonReadme = allFiles.filter(
  (f) => !f.endsWith(".json") && f !== "README.md" && !f.startsWith(".")
);

for (const f of nonJsonNonReadme) {
  error(f, "unexpected file — only {year}.json and README.md are allowed");
}

for (const file of jsonFiles) {
  const filenameMatch = file.match(FILENAME_RE);
  if (!filenameMatch) {
    error(file, `filename must be {year}.json (e.g. 1939.json, -207.json)`);
    continue;
  }

  const fileYear = Number(filenameMatch[1]);
  const filePath = path.join(COMMUNITY_DIR, file);

  let parsed: unknown;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    parsed = JSON.parse(raw);
  } catch (e) {
    error(file, `invalid JSON — ${(e as Error).message}`);
    continue;
  }

  if (!Array.isArray(parsed)) {
    error(file, "root must be a JSON array");
    continue;
  }

  if (parsed.length === 0) {
    error(file, "file contains an empty array — must have at least one event");
    continue;
  }

  const events: CommunityEvent[] = parsed;

  for (let i = 0; i < events.length; i++) {
    const evt = events[i];
    const label = `[index ${i}]`;

    if (evt.timestamp?.year == null) {
      error(file, "missing required field: timestamp.year", label);
      continue;
    } else if (evt.timestamp.year !== fileYear) {
      error(file, `timestamp.year (${evt.timestamp.year}) does not match file year (${fileYear})`, label);
    }

    if (evt.timestamp?.month == null) {
      error(file, "missing required field: timestamp.month", label);
    } else if (evt.timestamp.month < 1 || evt.timestamp.month > 12) {
      error(file, `timestamp.month must be 1–12 (got ${evt.timestamp.month})`, label);
    }

    if (!evt.title?.zh) {
      error(file, "missing or empty: title.zh", label);
    }
    if (!evt.title?.en) {
      error(file, "missing or empty: title.en", label);
    }

    if (!evt.description?.zh) {
      error(file, "missing or empty: description.zh", label);
    }
    if (!evt.description?.en) {
      error(file, "missing or empty: description.en", label);
    }

    if (!Array.isArray(evt.affectedRegions) || evt.affectedRegions.length === 0) {
      error(file, "affectedRegions must be a non-empty array", label);
    }

    if (!evt.category) {
      error(file, "missing required field: category", label);
    } else if (!VALID_CATEGORIES.has(evt.category)) {
      error(
        file,
        `invalid category "${evt.category}" — must be one of: ${[...VALID_CATEGORIES].join(", ")}`,
        label,
      );
    }

    if (!evt.source) {
      error(file, "missing required field: source (must be a valid HTTP/HTTPS URL)", label);
    } else if (!/^https?:\/\/.+/.test(evt.source)) {
      error(file, `source must be a valid HTTP/HTTPS URL (got "${evt.source}")`, label);
    }

    const fp = fingerprint(evt);
    if (seenFingerprints.has(fp)) {
      error(file, `duplicate event — same year+month+title+category as another event (fingerprint: ${fp})`, label);
    }
    seenFingerprints.add(fp);

    totalEvents++;
  }
}

console.log();
if (errors.length === 0) {
  console.log(`✓ All community events valid (${jsonFiles.length} file(s), ${totalEvents} event(s))`);
  process.exit(0);
} else {
  console.log(`✗ Found ${errors.length} error(s) in community events:\n`);
  for (const e of errors) {
    console.log(e);
  }
  console.log();
  process.exit(1);
}
