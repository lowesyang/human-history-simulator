import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "history.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    const fs = require("fs");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS state_snapshots (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      era_json TEXT NOT NULL,
      regions_json TEXT NOT NULL,
      summary_json TEXT,
      triggered_by_event_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(year, month, triggered_by_event_id)
    );
    CREATE INDEX IF NOT EXISTS idx_snapshots_time ON state_snapshots(year, month);

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      title_json TEXT NOT NULL,
      description_json TEXT NOT NULL,
      affected_regions_json TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      is_custom INTEGER DEFAULT 0,
      processed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_events_time ON events(year, month);
    CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

    CREATE TABLE IF NOT EXISTS evolution_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_year INTEGER NOT NULL,
      log_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_evolution_logs_year ON evolution_logs(target_year);

    CREATE TABLE IF NOT EXISTS wars (
      id TEXT PRIMARY KEY,
      name_json TEXT NOT NULL,
      start_year INTEGER NOT NULL,
      end_year INTEGER,
      belligerents_json TEXT NOT NULL,
      cause_json TEXT NOT NULL,
      casus_belli_json TEXT NOT NULL,
      status TEXT DEFAULT 'ongoing',
      victor TEXT,
      summary_json TEXT NOT NULL,
      advantages_json TEXT NOT NULL,
      impact_json TEXT NOT NULL DEFAULT '{"side1":{"zh":"","en":""},"side2":{"zh":"","en":""}}',
      related_event_ids_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_wars_years ON wars(start_year, end_year);
    CREATE INDEX IF NOT EXISTS idx_wars_status ON wars(status);
  `);

  // Migration: add is_custom column if missing
  const cols = db.prepare("PRAGMA table_info(events)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "is_custom")) {
    db.exec("ALTER TABLE events ADD COLUMN is_custom INTEGER DEFAULT 0");
  }

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='wars'").get();
  if (!tables) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS wars (
        id TEXT PRIMARY KEY,
        name_json TEXT NOT NULL,
        start_year INTEGER NOT NULL,
        end_year INTEGER,
        belligerents_json TEXT NOT NULL,
        cause_json TEXT NOT NULL,
        casus_belli_json TEXT NOT NULL,
        status TEXT DEFAULT 'ongoing',
        victor TEXT,
        summary_json TEXT NOT NULL,
        advantages_json TEXT NOT NULL,
        impact_json TEXT NOT NULL DEFAULT '{"side1":{"zh":"","en":""},"side2":{"zh":"","en":""}}',
        related_event_ids_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_wars_years ON wars(start_year, end_year);
      CREATE INDEX IF NOT EXISTS idx_wars_status ON wars(status);
    `);
  }

  // Migration: add victor and impact_json columns to wars if missing
  const warCols = db.prepare("PRAGMA table_info(wars)").all() as { name: string }[];
  if (!warCols.some((c) => c.name === "victor")) {
    db.exec("ALTER TABLE wars ADD COLUMN victor TEXT");
  }
  if (!warCols.some((c) => c.name === "impact_json")) {
    db.exec(`ALTER TABLE wars ADD COLUMN impact_json TEXT NOT NULL DEFAULT '{"side1":{"zh":"","en":""},"side2":{"zh":"","en":""}}'`);
  }
}

export function insertSnapshot(
  id: string,
  year: number,
  month: number,
  era: object,
  regions: object[],
  summary?: object,
  triggeredByEventId?: string
) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO state_snapshots
      (id, year, month, era_json, regions_json, summary_json, triggered_by_event_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    year,
    month,
    JSON.stringify(era),
    JSON.stringify(regions),
    summary ? JSON.stringify(summary) : null,
    triggeredByEventId ?? null
  );
}

export function getSnapshot(year: number, month: number) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT * FROM state_snapshots
       WHERE year < ? OR (year = ? AND month <= ?)
       ORDER BY year DESC, month DESC
       LIMIT 1`
    )
    .get(year, year, month) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    year: row.year as number,
    month: row.month as number,
    era: JSON.parse(row.era_json as string),
    regions: JSON.parse(row.regions_json as string),
    summary: row.summary_json
      ? JSON.parse(row.summary_json as string)
      : undefined,
    triggeredByEventId: row.triggered_by_event_id as string | undefined,
    createdAt: row.created_at as string,
  };
}

export function getLatestSnapshot() {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT * FROM state_snapshots ORDER BY year DESC, month DESC LIMIT 1`
    )
    .get() as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    year: row.year as number,
    month: row.month as number,
    era: JSON.parse(row.era_json as string),
    regions: JSON.parse(row.regions_json as string),
    summary: row.summary_json
      ? JSON.parse(row.summary_json as string)
      : undefined,
    triggeredByEventId: row.triggered_by_event_id as string | undefined,
    createdAt: row.created_at as string,
  };
}

export function insertEvent(
  id: string,
  year: number,
  month: number,
  title: object,
  description: object,
  affectedRegions: string[],
  category: string,
  status: string = "pending",
  isCustom: boolean = false
) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO events
      (id, year, month, title_json, description_json, affected_regions_json, category, status, is_custom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    year,
    month,
    JSON.stringify(title),
    JSON.stringify(description),
    JSON.stringify(affectedRegions),
    category,
    status,
    isCustom ? 1 : 0
  );
}

export function getEvents(statusFilter?: "pending" | "processed") {
  const db = getDb();
  let rows: Record<string, unknown>[];
  if (statusFilter) {
    rows = db
      .prepare(`SELECT * FROM events WHERE status = ? ORDER BY year, month`)
      .all(statusFilter) as Record<string, unknown>[];
  } else {
    rows = db
      .prepare(`SELECT * FROM events ORDER BY year, month`)
      .all() as Record<string, unknown>[];
  }
  return rows.map((row) => ({
    id: row.id as string,
    timestamp: { year: row.year as number, month: row.month as number },
    title: JSON.parse(row.title_json as string),
    description: JSON.parse(row.description_json as string),
    affectedRegions: JSON.parse(row.affected_regions_json as string),
    category: row.category as string,
    status: row.status as string,
    isCustom: (row.is_custom as number) === 1,
    processedAt: row.processed_at as string | undefined,
  }));
}

export function getNextPendingEvents(batchMode: string) {
  const db = getDb();

  const firstPending = db
    .prepare(
      `SELECT year, month FROM events WHERE status = 'pending' ORDER BY year, month LIMIT 1`
    )
    .get() as { year: number; month: number } | undefined;

  if (!firstPending) return [];

  let rows: Record<string, unknown>[];

  if (batchMode === "per_event") {
    rows = db
      .prepare(
        `SELECT * FROM events WHERE status = 'pending' ORDER BY year, month LIMIT 1`
      )
      .all() as Record<string, unknown>[];
  } else if (batchMode === "per_month") {
    rows = db
      .prepare(
        `SELECT * FROM events WHERE status = 'pending' AND year = ? AND month = ? ORDER BY year, month`
      )
      .all(firstPending.year, firstPending.month) as Record<string, unknown>[];
  } else {
    rows = db
      .prepare(
        `SELECT * FROM events WHERE status = 'pending' AND year = ? ORDER BY month`
      )
      .all(firstPending.year) as Record<string, unknown>[];
  }

  return rows.map((row) => ({
    id: row.id as string,
    timestamp: { year: row.year as number, month: row.month as number },
    title: JSON.parse(row.title_json as string),
    description: JSON.parse(row.description_json as string),
    affectedRegions: JSON.parse(row.affected_regions_json as string),
    category: row.category as string,
    status: row.status as string,
    isCustom: (row.is_custom as number) === 1,
  }));
}

export function getNextEpochEvents() {
  const db = getDb();

  const firstPendingYear = db
    .prepare(
      `SELECT DISTINCT year FROM events WHERE status = 'pending' ORDER BY year LIMIT 1`
    )
    .get() as { year: number } | undefined;

  if (!firstPendingYear) return [];

  const rows = db
    .prepare(
      `SELECT * FROM events WHERE status = 'pending' AND year = ? ORDER BY month`
    )
    .all(firstPendingYear.year) as Record<string, unknown>[];

  return rows.map((row) => ({
    id: row.id as string,
    timestamp: { year: row.year as number, month: row.month as number },
    title: JSON.parse(row.title_json as string),
    description: JSON.parse(row.description_json as string),
    affectedRegions: JSON.parse(row.affected_regions_json as string),
    category: row.category as string,
    status: row.status as string,
    isCustom: (row.is_custom as number) === 1,
  }));
}

export function getNEpochsEvents(n: number) {
  const db = getDb();

  const yearRows = db
    .prepare(
      `SELECT DISTINCT year FROM events WHERE status = 'pending' ORDER BY year LIMIT ?`
    )
    .all(n) as { year: number }[];

  if (yearRows.length === 0) return [];

  const years = yearRows.map((r) => r.year);
  const placeholders = years.map(() => "?").join(",");

  const rows = db
    .prepare(
      `SELECT * FROM events WHERE status = 'pending' AND year IN (${placeholders}) ORDER BY year, month`
    )
    .all(...years) as Record<string, unknown>[];

  return rows.map((row) => ({
    id: row.id as string,
    timestamp: { year: row.year as number, month: row.month as number },
    title: JSON.parse(row.title_json as string),
    description: JSON.parse(row.description_json as string),
    affectedRegions: JSON.parse(row.affected_regions_json as string),
    category: row.category as string,
    status: row.status as string,
    isCustom: (row.is_custom as number) === 1,
  }));
}

export function getPendingEpochCount(): number {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COUNT(DISTINCT year) as cnt FROM events WHERE status = 'pending'`
    )
    .get() as { cnt: number };
  return row.cnt;
}

export function markEventsProcessed(eventIds: string[]) {
  const db = getDb();
  const stmt = db.prepare(
    `UPDATE events SET status = 'processed', processed_at = datetime('now') WHERE id = ?`
  );
  const tx = db.transaction(() => {
    for (const id of eventIds) {
      stmt.run(id);
    }
  });
  tx();
}

export function updateEvent(
  id: string,
  year: number,
  month: number,
  title: object,
  description: object,
  affectedRegions: string[],
  category: string
) {
  const db = getDb();
  db.prepare(`
    UPDATE events
    SET year = ?, month = ?, title_json = ?, description_json = ?,
        affected_regions_json = ?, category = ?
    WHERE id = ? AND is_custom = 1 AND status = 'pending'
  `).run(
    year,
    month,
    JSON.stringify(title),
    JSON.stringify(description),
    JSON.stringify(affectedRegions),
    category,
    id
  );
}

export function deleteEvent(id: string) {
  const db = getDb();
  db.prepare(
    `DELETE FROM events WHERE id = ? AND is_custom = 1 AND status = 'pending'`
  ).run(id);
}

export function deletePendingEvents() {
  const db = getDb();
  const result = db.prepare(
    `DELETE FROM events WHERE status = 'pending'`
  ).run();
  return result.changes;
}

export function getFrontier() {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT year, month FROM state_snapshots ORDER BY year DESC, month DESC LIMIT 1`
    )
    .get() as { year: number; month: number } | undefined;
  return row ?? { year: -1600, month: 1 };
}

export function getOriginTime() {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT year, month FROM state_snapshots ORDER BY year ASC, month ASC LIMIT 1`
    )
    .get() as { year: number; month: number } | undefined;
  return row ?? { year: -1600, month: 1 };
}

export function rollbackToYear(targetYear: number) {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM state_snapshots WHERE year > ?`).run(targetYear);

    db.prepare(
      `UPDATE events SET status = 'pending', processed_at = NULL WHERE year > ?`
    ).run(targetYear);

    db.prepare(`DELETE FROM evolution_logs WHERE target_year > ?`).run(targetYear);

    db.prepare(`DELETE FROM wars WHERE start_year > ?`).run(targetYear);

    db.prepare(
      `UPDATE wars SET status = 'ongoing', end_year = NULL WHERE end_year IS NOT NULL AND end_year > ?`
    ).run(targetYear);
  });
  tx();
}

export function resetToInitialState() {
  const db = getDb();
  const tx = db.transaction(() => {
    // Keep only the initial snapshot (the one with no triggered_by_event_id)
    db.prepare(
      `DELETE FROM state_snapshots WHERE triggered_by_event_id IS NOT NULL`
    ).run();
    // Reset all events back to pending
    db.prepare(
      `UPDATE events SET status = 'pending', processed_at = NULL`
    ).run();
    // Clear evolution logs
    db.prepare(`DELETE FROM evolution_logs`).run();
    // Clear wars
    db.prepare(`DELETE FROM wars`).run();
  });
  tx();
}

export function resetAndReinitialize(
  snapshotId: string,
  year: number,
  month: number,
  era: object,
  regions: object[],
  summary?: object,
  events?: {
    id: string;
    year: number;
    month: number;
    title: object;
    description: object;
    affectedRegions: string[];
    category: string;
    status?: string;
  }[]
) {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM state_snapshots`).run();
    db.prepare(`DELETE FROM events`).run();
    db.prepare(`DELETE FROM evolution_logs`).run();
    db.prepare(`DELETE FROM wars`).run();

    db.prepare(`
      INSERT INTO state_snapshots
        (id, year, month, era_json, regions_json, summary_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      snapshotId,
      year,
      month,
      JSON.stringify(era),
      JSON.stringify(regions),
      summary ? JSON.stringify(summary) : null
    );

    if (events && events.length > 0) {
      const insertEvt = db.prepare(`
        INSERT INTO events
          (id, year, month, title_json, description_json, affected_regions_json, category, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const evt of events) {
        insertEvt.run(
          evt.id,
          evt.year,
          evt.month,
          JSON.stringify(evt.title),
          JSON.stringify(evt.description),
          JSON.stringify(evt.affectedRegions),
          evt.category,
          evt.status || "pending"
        );
      }
    }
  });
  tx();
}

export function insertEvolutionLog(targetYear: number, log: object) {
  const db = getDb();
  db.prepare(
    `INSERT INTO evolution_logs (target_year, log_json) VALUES (?, ?)`
  ).run(targetYear, JSON.stringify(log));
}

export function getEvolutionLogs() {
  const db = getDb();
  const rows = db
    .prepare(`SELECT log_json FROM evolution_logs ORDER BY id ASC`)
    .all() as { log_json: string }[];
  return rows.map((row) => JSON.parse(row.log_json));
}

export function clearEvolutionLogs() {
  const db = getDb();
  db.prepare(`DELETE FROM evolution_logs`).run();
}

export function insertWar(
  id: string,
  name: object,
  startYear: number,
  endYear: number | null,
  belligerents: object,
  cause: object,
  casusBelli: object,
  status: string,
  summary: object,
  advantages: object,
  impact: object,
  relatedEventIds: string[],
  victor?: string | null
) {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO wars
      (id, name_json, start_year, end_year, belligerents_json, cause_json, casus_belli_json, status, victor, summary_json, advantages_json, impact_json, related_event_ids_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    JSON.stringify(name),
    startYear,
    endYear,
    JSON.stringify(belligerents),
    JSON.stringify(cause),
    JSON.stringify(casusBelli),
    status,
    victor ?? null,
    JSON.stringify(summary),
    JSON.stringify(advantages),
    JSON.stringify(impact),
    JSON.stringify(relatedEventIds)
  );
}

export function getActiveWars(year: number) {
  const db = getDb();
  const rows = db.prepare(
    `SELECT * FROM wars WHERE start_year <= ? AND (end_year IS NULL OR end_year >= ?) ORDER BY start_year DESC`
  ).all(year, year) as Record<string, unknown>[];
  return rows.map(parseWarRow);
}

export function getAllWars() {
  const db = getDb();
  const rows = db.prepare(
    `SELECT * FROM wars ORDER BY start_year DESC`
  ).all() as Record<string, unknown>[];
  return rows.map(parseWarRow);
}

export function updateWarStatus(id: string, status: string, endYear?: number) {
  const db = getDb();
  if (endYear != null) {
    db.prepare(`UPDATE wars SET status = ?, end_year = ? WHERE id = ?`).run(status, endYear, id);
  } else {
    db.prepare(`UPDATE wars SET status = ? WHERE id = ?`).run(status, id);
  }
}

export function deleteAllWars() {
  const db = getDb();
  db.prepare(`DELETE FROM wars`).run();
}

function parseWarRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: JSON.parse(row.name_json as string),
    startYear: row.start_year as number,
    endYear: row.end_year as number | null,
    belligerents: JSON.parse(row.belligerents_json as string),
    cause: JSON.parse(row.cause_json as string),
    casus_belli: JSON.parse(row.casus_belli_json as string),
    status: row.status as string,
    victor: (row.victor as string | null) ?? null,
    summary: JSON.parse(row.summary_json as string),
    advantages: JSON.parse(row.advantages_json as string),
    impact: JSON.parse((row.impact_json as string) || '{"side1":{"zh":"","en":""},"side2":{"zh":"","en":""}}'),
    relatedEventIds: JSON.parse(row.related_event_ids_json as string),
  };
}
