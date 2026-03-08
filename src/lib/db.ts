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
  `);

  // Migration: add is_custom column if missing
  const cols = db.prepare("PRAGMA table_info(events)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "is_custom")) {
    db.exec("ALTER TABLE events ADD COLUMN is_custom INTEGER DEFAULT 0");
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
