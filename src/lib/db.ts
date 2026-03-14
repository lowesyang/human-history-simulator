import Database from "better-sqlite3";
import path from "path";
import { getDbPath } from "./paths";

const DB_PATH = getDbPath();

const globalForDb = globalThis as unknown as {
  __historyDb?: Database.Database;
  __historyDbVersion?: number;
};

const CURRENT_MIGRATION_VERSION = 9;

export function getDb(): Database.Database {
  if (!globalForDb.__historyDb) {
    const fs = require("fs");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    globalForDb.__historyDb = new Database(DB_PATH);
    globalForDb.__historyDb.pragma("journal_mode = WAL");
    globalForDb.__historyDb.pragma("foreign_keys = ON");
    initSchema(globalForDb.__historyDb);
    globalForDb.__historyDbVersion = CURRENT_MIGRATION_VERSION;
  } else if ((globalForDb.__historyDbVersion ?? 0) < CURRENT_MIGRATION_VERSION) {
    initSchema(globalForDb.__historyDb);
    globalForDb.__historyDbVersion = CURRENT_MIGRATION_VERSION;
  }
  return globalForDb.__historyDb;
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
      era_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
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
      era_id TEXT,
      processed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_events_time ON events(year, month);
    CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

    CREATE TABLE IF NOT EXISTS evolution_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_year INTEGER NOT NULL,
      era_id TEXT,
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
      era_id TEXT,
      last_narrative_update_year INTEGER,
      theater_json TEXT,
      casualties_json TEXT,
      key_battles_json TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_wars_years ON wars(start_year, end_year);
    CREATE INDEX IF NOT EXISTS idx_wars_status ON wars(status);

    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  const cols = db.prepare("PRAGMA table_info(events)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "is_custom")) {
    db.exec("ALTER TABLE events ADD COLUMN is_custom INTEGER DEFAULT 0");
  }
  if (!cols.some((c) => c.name === "era_id")) {
    db.exec("ALTER TABLE events ADD COLUMN era_id TEXT");
  }
  db.exec("CREATE INDEX IF NOT EXISTS idx_events_era ON events(era_id)");

  const snapCols = db.prepare("PRAGMA table_info(state_snapshots)").all() as { name: string }[];
  if (!snapCols.some((c) => c.name === "era_id")) {
    db.exec("ALTER TABLE state_snapshots ADD COLUMN era_id TEXT");
  }

  const logCols = db.prepare("PRAGMA table_info(evolution_logs)").all() as { name: string }[];
  if (!logCols.some((c) => c.name === "era_id")) {
    db.exec("ALTER TABLE evolution_logs ADD COLUMN era_id TEXT");
  }

  const warCols = db.prepare("PRAGMA table_info(wars)").all() as { name: string }[];
  if (!warCols.some((c) => c.name === "era_id")) {
    db.exec("ALTER TABLE wars ADD COLUMN era_id TEXT");
  }
  if (!warCols.some((c) => c.name === "victor")) {
    db.exec("ALTER TABLE wars ADD COLUMN victor TEXT");
  }
  if (!warCols.some((c) => c.name === "impact_json")) {
    db.exec(`ALTER TABLE wars ADD COLUMN impact_json TEXT NOT NULL DEFAULT '{"side1":{"zh":"","en":""},"side2":{"zh":"","en":""}}'`);
  }

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='app_config'").get();
  if (!tables) {
    db.exec(`CREATE TABLE IF NOT EXISTS app_config (key TEXT PRIMARY KEY, value TEXT)`);
  }

  // v4 migration: is_triggered on events + civ_memories table
  if (!cols.some((c) => c.name === "is_triggered")) {
    db.exec("ALTER TABLE events ADD COLUMN is_triggered INTEGER DEFAULT 0");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS civ_memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      region_id TEXT NOT NULL,
      year INTEGER NOT NULL,
      memory_text TEXT NOT NULL,
      era_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_civ_memories_region ON civ_memories(region_id, year);
  `);

  // v5 migration: war_snapshots table + last_narrative_update_year on wars
  db.exec(`
    CREATE TABLE IF NOT EXISTS war_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      war_id TEXT NOT NULL,
      year INTEGER NOT NULL,
      side TEXT NOT NULL,
      total_troops INTEGER,
      standing_army INTEGER,
      military_level INTEGER,
      gdp_gold_kg REAL,
      population INTEGER,
      tech_level INTEGER,
      region_status TEXT,
      era_id TEXT,
      FOREIGN KEY (war_id) REFERENCES wars(id)
    );
    CREATE INDEX IF NOT EXISTS idx_war_snapshots_war ON war_snapshots(war_id, year);
  `);

  if (!warCols.some((c) => c.name === "last_narrative_update_year")) {
    db.exec("ALTER TABLE wars ADD COLUMN last_narrative_update_year INTEGER");
  }
  if (!warCols.some((c) => c.name === "theater_json")) {
    db.exec("ALTER TABLE wars ADD COLUMN theater_json TEXT");
  }
  if (!warCols.some((c) => c.name === "casualties_json")) {
    db.exec("ALTER TABLE wars ADD COLUMN casualties_json TEXT");
  }
  if (!warCols.some((c) => c.name === "key_battles_json")) {
    db.exec("ALTER TABLE wars ADD COLUMN key_battles_json TEXT DEFAULT '[]'");
  }

  const snapCols2 = db.prepare("PRAGMA table_info(war_snapshots)").all() as { name: string }[];
  if (!snapCols2.some((c) => c.name === "casualties")) {
    db.exec("ALTER TABLE war_snapshots ADD COLUMN casualties INTEGER DEFAULT 0");
  }
  if (!snapCols2.some((c) => c.name === "morale")) {
    db.exec("ALTER TABLE war_snapshots ADD COLUMN morale INTEGER DEFAULT 5");
  }

  // v6 migration: unique constraint on war_snapshots to support upsert
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_war_snapshots_unique
      ON war_snapshots(war_id, year, side);
  `);

  // v7 migration: economic history tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS economic_history (
      id TEXT PRIMARY KEY,
      region_id TEXT NOT NULL,
      year INTEGER NOT NULL,
      era_id TEXT,
      gdp_gold_kg REAL DEFAULT 0,
      gdp_per_capita_gold_kg REAL DEFAULT 0,
      treasury_gold_kg REAL DEFAULT 0,
      revenue_gold_kg REAL DEFAULT 0,
      expenditure_gold_kg REAL DEFAULT 0,
      trade_volume_gold_kg REAL DEFAULT 0,
      debt_gold_kg REAL DEFAULT 0,
      military_spending_pct_gdp REAL DEFAULT 0,
      population INTEGER DEFAULT 0,
      urbanization_rate REAL DEFAULT 0,
      gini_estimate REAL,
      UNIQUE(region_id, year, era_id)
    );
    CREATE INDEX IF NOT EXISTS idx_econ_hist_region_year ON economic_history(region_id, year);
    CREATE INDEX IF NOT EXISTS idx_econ_hist_era ON economic_history(era_id);

    CREATE TABLE IF NOT EXISTS asset_prices (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      year INTEGER NOT NULL,
      era_id TEXT,
      price_gold_grams REAL NOT NULL,
      price_silver_grams REAL,
      volatility REAL DEFAULT 0,
      event_driver_json TEXT,
      UNIQUE(asset_id, year, era_id)
    );
    CREATE INDEX IF NOT EXISTS idx_asset_year ON asset_prices(asset_id, year);

    CREATE TABLE IF NOT EXISTS exchange_rates (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      era_id TEXT,
      gold_silver_ratio REAL NOT NULL,
      ppp_grain_gold_g REAL,
      ppp_wage_gold_g REAL,
      UNIQUE(year, era_id)
    );

    CREATE TABLE IF NOT EXISTS portfolios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      era_id TEXT,
      start_year INTEGER NOT NULL,
      initial_gold_kg REAL NOT NULL,
      allocations_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id TEXT PRIMARY KEY,
      portfolio_id TEXT NOT NULL REFERENCES portfolios(id),
      year INTEGER NOT NULL,
      total_value_gold_kg REAL NOT NULL,
      holdings_json TEXT NOT NULL,
      UNIQUE(portfolio_id, year)
    );
    CREATE INDEX IF NOT EXISTS idx_portfolio_snap ON portfolio_snapshots(portfolio_id, year);
  `);

  // v9 migration: cash_gold_kg on portfolio_snapshots
  const psCols = db.prepare("PRAGMA table_info(portfolio_snapshots)").all() as { name: string }[];
  if (!psCols.some((c) => c.name === "cash_gold_kg")) {
    db.exec("ALTER TABLE portfolio_snapshots ADD COLUMN cash_gold_kg REAL DEFAULT 0");
  }

  // v10 migration: cost basis and realized P&L tracking
  const psCols2 = db.prepare("PRAGMA table_info(portfolio_snapshots)").all() as { name: string }[];
  if (!psCols2.some((c) => c.name === "cost_basis_json")) {
    db.exec("ALTER TABLE portfolio_snapshots ADD COLUMN cost_basis_json TEXT DEFAULT '{}'");
  }
  if (!psCols2.some((c) => c.name === "realized_pnl_gold_kg")) {
    db.exec("ALTER TABLE portfolio_snapshots ADD COLUMN realized_pnl_gold_kg REAL DEFAULT 0");
  }
}

export function insertSnapshot(
  id: string,
  year: number,
  month: number,
  era: object,
  regions: object[],
  summary?: object,
  triggeredByEventId?: string,
  eraId?: string
) {
  const db = getDb();
  const effectiveEraId = eraId ?? getCurrentEraId();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO state_snapshots
      (id, year, month, era_json, regions_json, summary_json, triggered_by_event_id, era_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    year,
    month,
    JSON.stringify(era),
    JSON.stringify(regions),
    summary ? JSON.stringify(summary) : null,
    triggeredByEventId ?? null,
    effectiveEraId ?? null
  );
}

export function getSnapshot(year: number, month: number) {
  const db = getDb();
  const eraId = getCurrentEraId();
  let query: string;
  let params: unknown[];
  if (eraId) {
    query = `SELECT * FROM state_snapshots
       WHERE era_id = ? AND (year < ? OR (year = ? AND month <= ?))
       ORDER BY year DESC, month DESC
       LIMIT 1`;
    params = [eraId, year, year, month];
  } else {
    query = `SELECT * FROM state_snapshots
       WHERE year < ? OR (year = ? AND month <= ?)
       ORDER BY year DESC, month DESC
       LIMIT 1`;
    params = [year, year, month];
  }
  const row = db.prepare(query).get(...params) as Record<string, unknown> | undefined;
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
  const eraId = getCurrentEraId();
  let row: Record<string, unknown> | undefined;
  if (eraId) {
    row = db
      .prepare(
        `SELECT * FROM state_snapshots WHERE era_id = ? ORDER BY year DESC, month DESC LIMIT 1`
      )
      .get(eraId) as Record<string, unknown> | undefined;
  } else {
    row = db
      .prepare(
        `SELECT * FROM state_snapshots ORDER BY year DESC, month DESC LIMIT 1`
      )
      .get() as Record<string, unknown> | undefined;
  }
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
  isCustom: boolean = false,
  eraId?: string
) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO events
      (id, year, month, title_json, description_json, affected_regions_json, category, status, is_custom, era_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    isCustom ? 1 : 0,
    eraId ?? null
  );
}

export function getEvents(statusFilter?: "pending" | "processed") {
  const db = getDb();
  const eraId = getCurrentEraId();
  let rows: Record<string, unknown>[];
  if (eraId && statusFilter) {
    rows = db
      .prepare(`SELECT * FROM events WHERE era_id = ? AND status = ? ORDER BY year, month`)
      .all(eraId, statusFilter) as Record<string, unknown>[];
  } else if (eraId) {
    rows = db
      .prepare(`SELECT * FROM events WHERE era_id = ? ORDER BY year, month`)
      .all(eraId) as Record<string, unknown>[];
  } else if (statusFilter) {
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
  const eraId = getCurrentEraId();
  const eraFilter = eraId ? ` AND era_id = ?` : "";
  const eraParam = eraId ? [eraId] : [];

  const firstPending = db
    .prepare(
      `SELECT year, month FROM events WHERE status = 'pending'${eraFilter} ORDER BY year, month LIMIT 1`
    )
    .get(...eraParam) as { year: number; month: number } | undefined;

  if (!firstPending) return [];

  let rows: Record<string, unknown>[];

  if (batchMode === "per_event") {
    rows = db
      .prepare(
        `SELECT * FROM events WHERE status = 'pending'${eraFilter} ORDER BY year, month LIMIT 1`
      )
      .all(...eraParam) as Record<string, unknown>[];
  } else if (batchMode === "per_month") {
    rows = db
      .prepare(
        `SELECT * FROM events WHERE status = 'pending' AND year = ? AND month = ?${eraFilter} ORDER BY year, month`
      )
      .all(firstPending.year, firstPending.month, ...eraParam) as Record<string, unknown>[];
  } else {
    rows = db
      .prepare(
        `SELECT * FROM events WHERE status = 'pending' AND year = ?${eraFilter} ORDER BY month`
      )
      .all(firstPending.year, ...eraParam) as Record<string, unknown>[];
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
  const eraId = getCurrentEraId();
  const eraFilter = eraId ? ` AND era_id = ?` : "";
  const eraParam = eraId ? [eraId] : [];

  const firstPendingYear = db
    .prepare(
      `SELECT DISTINCT year FROM events WHERE status = 'pending'${eraFilter} ORDER BY year LIMIT 1`
    )
    .get(...eraParam) as { year: number } | undefined;

  if (!firstPendingYear) return [];

  const rows = db
    .prepare(
      `SELECT * FROM events WHERE status = 'pending' AND year = ?${eraFilter} ORDER BY month`
    )
    .all(firstPendingYear.year, ...eraParam) as Record<string, unknown>[];

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
  const eraId = getCurrentEraId();
  const eraFilter = eraId ? ` AND era_id = ?` : "";
  const eraParam = eraId ? [eraId] : [];

  const yearRows = db
    .prepare(
      `SELECT DISTINCT year FROM events WHERE status = 'pending'${eraFilter} ORDER BY year LIMIT ?`
    )
    .all(...eraParam, n) as { year: number }[];

  if (yearRows.length === 0) return [];

  const years = yearRows.map((r) => r.year);
  const placeholders = years.map(() => "?").join(",");

  let query = `SELECT * FROM events WHERE status = 'pending' AND year IN (${placeholders})`;
  const params: unknown[] = [...years];
  if (eraId) {
    query += ` AND era_id = ?`;
    params.push(eraId);
  }
  query += ` ORDER BY year, month`;

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];

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
  const eraId = getCurrentEraId();
  let row: { cnt: number };
  if (eraId) {
    row = db
      .prepare(
        `SELECT COUNT(DISTINCT year) as cnt FROM events WHERE status = 'pending' AND era_id = ?`
      )
      .get(eraId) as { cnt: number };
  } else {
    row = db
      .prepare(
        `SELECT COUNT(DISTINCT year) as cnt FROM events WHERE status = 'pending'`
      )
      .get() as { cnt: number };
  }
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
  const eraId = getCurrentEraId();
  let result;
  if (eraId) {
    result = db.prepare(
      `DELETE FROM events WHERE status = 'pending' AND era_id = ?`
    ).run(eraId);
  } else {
    result = db.prepare(
      `DELETE FROM events WHERE status = 'pending'`
    ).run();
  }
  return result.changes;
}

export function getFrontier() {
  const db = getDb();
  const eraId = getCurrentEraId();
  let row: { year: number; month: number } | undefined;
  if (eraId) {
    row = db
      .prepare(
        `SELECT year, month FROM state_snapshots WHERE era_id = ? ORDER BY year DESC, month DESC LIMIT 1`
      )
      .get(eraId) as { year: number; month: number } | undefined;
  } else {
    row = db
      .prepare(
        `SELECT year, month FROM state_snapshots ORDER BY year DESC, month DESC LIMIT 1`
      )
      .get() as { year: number; month: number } | undefined;
  }
  return row ?? { year: -1600, month: 1 };
}

export function getOriginTime() {
  const db = getDb();
  const eraId = getCurrentEraId();
  let row: { year: number; month: number } | undefined;
  if (eraId) {
    row = db
      .prepare(
        `SELECT year, month FROM state_snapshots WHERE era_id = ? ORDER BY year ASC, month ASC LIMIT 1`
      )
      .get(eraId) as { year: number; month: number } | undefined;
  } else {
    row = db
      .prepare(
        `SELECT year, month FROM state_snapshots ORDER BY year ASC, month ASC LIMIT 1`
      )
      .get() as { year: number; month: number } | undefined;
  }
  return row ?? { year: -1600, month: 1 };
}

export function getCurrentEraId(): string | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT value FROM app_config WHERE key = 'current_era_id'`)
    .get() as { value: string } | undefined;
  return row?.value ?? null;
}

export function setCurrentEraId(eraId: string) {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO app_config (key, value) VALUES ('current_era_id', ?)`
  ).run(eraId);
}

export function rollbackToYear(targetYear: number) {
  const db = getDb();
  const eraId = getCurrentEraId();
  const tx = db.transaction(() => {
    if (eraId) {
      db.prepare(`DELETE FROM state_snapshots WHERE era_id = ? AND year > ?`).run(eraId, targetYear);
      db.prepare(
        `UPDATE events SET status = 'pending', processed_at = NULL WHERE era_id = ? AND year > ?`
      ).run(eraId, targetYear);
      db.prepare(`DELETE FROM evolution_logs WHERE era_id = ? AND target_year > ?`).run(eraId, targetYear);
      db.prepare(`DELETE FROM war_snapshots WHERE era_id = ? AND year > ?`).run(eraId, targetYear);
      db.prepare(`DELETE FROM wars WHERE era_id = ? AND start_year > ?`).run(eraId, targetYear);
      db.prepare(
        `UPDATE wars SET status = 'ongoing', end_year = NULL WHERE era_id = ? AND end_year IS NOT NULL AND end_year > ?`
      ).run(eraId, targetYear);
      db.prepare(`DELETE FROM economic_history WHERE era_id = ? AND year > ?`).run(eraId, targetYear);
      db.prepare(`DELETE FROM asset_prices WHERE era_id = ? AND year > ?`).run(eraId, targetYear);
      db.prepare(`DELETE FROM exchange_rates WHERE era_id = ? AND year > ?`).run(eraId, targetYear);
    } else {
      db.prepare(`DELETE FROM state_snapshots WHERE year > ?`).run(targetYear);
      db.prepare(
        `UPDATE events SET status = 'pending', processed_at = NULL WHERE year > ?`
      ).run(targetYear);
      db.prepare(`DELETE FROM evolution_logs WHERE target_year > ?`).run(targetYear);
      db.prepare(`DELETE FROM war_snapshots WHERE year > ?`).run(targetYear);
      db.prepare(`DELETE FROM wars WHERE start_year > ?`).run(targetYear);
      db.prepare(
        `UPDATE wars SET status = 'ongoing', end_year = NULL WHERE end_year IS NOT NULL AND end_year > ?`
      ).run(targetYear);
      db.prepare(`DELETE FROM economic_history WHERE year > ?`).run(targetYear);
      db.prepare(`DELETE FROM asset_prices WHERE year > ?`).run(targetYear);
      db.prepare(`DELETE FROM exchange_rates WHERE year > ?`).run(targetYear);
    }
  });
  tx();
}

export function resetToInitialState() {
  const db = getDb();
  const eraId = getCurrentEraId();
  const tx = db.transaction(() => {
    if (eraId) {
      db.prepare(
        `DELETE FROM state_snapshots WHERE era_id = ? AND triggered_by_event_id IS NOT NULL`
      ).run(eraId);
      db.prepare(
        `UPDATE events SET status = 'pending', processed_at = NULL WHERE era_id = ?`
      ).run(eraId);
      db.prepare(`DELETE FROM evolution_logs WHERE era_id = ?`).run(eraId);
      db.prepare(`DELETE FROM war_snapshots WHERE era_id = ?`).run(eraId);
      db.prepare(`DELETE FROM wars WHERE era_id = ?`).run(eraId);
    } else {
      db.prepare(
        `DELETE FROM state_snapshots WHERE triggered_by_event_id IS NOT NULL`
      ).run();
      db.prepare(
        `UPDATE events SET status = 'pending', processed_at = NULL`
      ).run();
      db.prepare(`DELETE FROM evolution_logs`).run();
      db.prepare(`DELETE FROM war_snapshots`).run();
      db.prepare(`DELETE FROM wars`).run();
    }
  });
  tx();
}

export function switchToEra(
  snapshotId: string,
  year: number,
  month: number,
  era: object,
  regions: object[],
  summary?: object,
  seedEvents?: {
    id: string;
    year: number;
    month: number;
    title: object;
    description: object;
    affectedRegions: string[];
    category: string;
    status?: string;
  }[],
  eraId?: string
) {
  const db = getDb();
  const tx = db.transaction(() => {
    if (eraId) {
      db.prepare(
        `INSERT OR REPLACE INTO app_config (key, value) VALUES ('current_era_id', ?)`
      ).run(eraId);
    }

    const hasSnapshot = db.prepare(
      `SELECT COUNT(*) as cnt FROM state_snapshots WHERE era_id = ?`
    ).get(eraId ?? null) as { cnt: number };

    if (hasSnapshot.cnt > 0) {
      db.prepare(`DELETE FROM state_snapshots WHERE era_id = ?`).run(eraId ?? null);
      db.prepare(`DELETE FROM events WHERE era_id = ?`).run(eraId ?? null);
      db.prepare(`DELETE FROM evolution_logs WHERE era_id = ?`).run(eraId ?? null);
      db.prepare(`DELETE FROM war_snapshots WHERE era_id = ?`).run(eraId ?? null);
      db.prepare(`DELETE FROM wars WHERE era_id = ?`).run(eraId ?? null);
      db.prepare(`DELETE FROM economic_history WHERE era_id = ?`).run(eraId ?? null);
      db.prepare(`DELETE FROM asset_prices WHERE era_id = ?`).run(eraId ?? null);
      db.prepare(`DELETE FROM exchange_rates WHERE era_id = ?`).run(eraId ?? null);
      db.prepare(`DELETE FROM portfolio_snapshots WHERE portfolio_id IN (SELECT id FROM portfolios WHERE era_id = ?)`).run(eraId ?? null);
      db.prepare(`DELETE FROM portfolios WHERE era_id = ?`).run(eraId ?? null);
    }

    db.prepare(`
      INSERT INTO state_snapshots
        (id, year, month, era_json, regions_json, summary_json, era_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      snapshotId,
      year,
      month,
      JSON.stringify(era),
      JSON.stringify(regions),
      summary ? JSON.stringify(summary) : null,
      eraId ?? null
    );

    if (seedEvents && seedEvents.length > 0) {
      const insertEvt = db.prepare(`
        INSERT OR IGNORE INTO events
          (id, year, month, title_json, description_json, affected_regions_json, category, status, era_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const evt of seedEvents) {
        insertEvt.run(
          evt.id,
          evt.year,
          evt.month,
          JSON.stringify(evt.title),
          JSON.stringify(evt.description),
          JSON.stringify(evt.affectedRegions),
          evt.category,
          evt.status || "pending",
          eraId ?? null
        );
      }
    }
  });
  tx();
}

export function resetCurrentEra() {
  const db = getDb();
  const eraId = getCurrentEraId();
  if (!eraId) return;

  const tx = db.transaction(() => {
    db.prepare(
      `DELETE FROM state_snapshots WHERE era_id = ? AND triggered_by_event_id IS NOT NULL`
    ).run(eraId);

    db.prepare(
      `UPDATE events SET status = 'pending', processed_at = NULL WHERE era_id = ?`
    ).run(eraId);

    db.prepare(`DELETE FROM evolution_logs WHERE era_id = ?`).run(eraId);

    db.prepare(`DELETE FROM war_snapshots WHERE era_id = ?`).run(eraId);

    db.prepare(`DELETE FROM wars WHERE era_id = ?`).run(eraId);

    db.prepare(`DELETE FROM economic_history WHERE era_id = ?`).run(eraId);
    db.prepare(`DELETE FROM asset_prices WHERE era_id = ?`).run(eraId);
    db.prepare(`DELETE FROM exchange_rates WHERE era_id = ?`).run(eraId);
    db.prepare(`DELETE FROM portfolio_snapshots WHERE portfolio_id IN (SELECT id FROM portfolios WHERE era_id = ?)`).run(eraId);
    db.prepare(`DELETE FROM portfolios WHERE era_id = ?`).run(eraId);
  });
  tx();
}

export function hardResetCurrentEra() {
  const db = getDb();
  const eraId = getCurrentEraId();
  if (!eraId) return;

  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM state_snapshots WHERE era_id = ? AND triggered_by_event_id IS NOT NULL`).run(eraId);
    db.prepare(`DELETE FROM events WHERE era_id = ?`).run(eraId);
    db.prepare(`DELETE FROM evolution_logs WHERE era_id = ?`).run(eraId);
    db.prepare(`DELETE FROM war_snapshots WHERE era_id = ?`).run(eraId);
    db.prepare(`DELETE FROM wars WHERE era_id = ?`).run(eraId);
  });
  tx();
}

export function insertEvolutionLog(targetYear: number, log: object) {
  const db = getDb();
  const eraId = getCurrentEraId();
  db.prepare(
    `INSERT INTO evolution_logs (target_year, log_json, era_id) VALUES (?, ?, ?)`
  ).run(targetYear, JSON.stringify(log), eraId ?? null);
}

export function getEvolutionLogs() {
  const db = getDb();
  const eraId = getCurrentEraId();
  let rows: { log_json: string }[];
  if (eraId) {
    rows = db
      .prepare(`SELECT log_json FROM evolution_logs WHERE era_id = ? ORDER BY id ASC`)
      .all(eraId) as { log_json: string }[];
  } else {
    rows = db
      .prepare(`SELECT log_json FROM evolution_logs ORDER BY id ASC`)
      .all() as { log_json: string }[];
  }
  return rows.map((row) => JSON.parse(row.log_json));
}

export function clearEvolutionLogs() {
  const db = getDb();
  const eraId = getCurrentEraId();
  if (eraId) {
    db.prepare(`DELETE FROM evolution_logs WHERE era_id = ?`).run(eraId);
  } else {
    db.prepare(`DELETE FROM evolution_logs`).run();
  }
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
  victor?: string | null,
  theater?: object | null,
  casualties?: object | null,
  keyBattles?: object[] | null
) {
  const db = getDb();
  const eraId = getCurrentEraId();
  db.prepare(`
    INSERT OR REPLACE INTO wars
      (id, name_json, start_year, end_year, belligerents_json, cause_json, casus_belli_json, status, victor, summary_json, advantages_json, impact_json, related_event_ids_json, era_id, theater_json, casualties_json, key_battles_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    JSON.stringify(relatedEventIds),
    eraId ?? null,
    theater ? JSON.stringify(theater) : null,
    casualties ? JSON.stringify(casualties) : null,
    JSON.stringify(keyBattles ?? [])
  );
}

export function getActiveWars(year: number) {
  const db = getDb();
  const eraId = getCurrentEraId();
  let rows: Record<string, unknown>[];
  if (eraId) {
    rows = db.prepare(
      `SELECT * FROM wars WHERE era_id = ? AND start_year <= ? AND (end_year IS NULL OR end_year >= ?) ORDER BY start_year DESC`
    ).all(eraId, year, year) as Record<string, unknown>[];
  } else {
    rows = db.prepare(
      `SELECT * FROM wars WHERE start_year <= ? AND (end_year IS NULL OR end_year >= ?) ORDER BY start_year DESC`
    ).all(year, year) as Record<string, unknown>[];
  }
  return rows.map(parseWarRow);
}

export function getAllWars() {
  const db = getDb();
  const eraId = getCurrentEraId();
  let rows: Record<string, unknown>[];
  if (eraId) {
    rows = db.prepare(
      `SELECT * FROM wars WHERE era_id = ? ORDER BY start_year DESC`
    ).all(eraId) as Record<string, unknown>[];
  } else {
    rows = db.prepare(
      `SELECT * FROM wars ORDER BY start_year DESC`
    ).all() as Record<string, unknown>[];
  }
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
  const eraId = getCurrentEraId();
  if (eraId) {
    db.prepare(`DELETE FROM war_snapshots WHERE era_id = ?`).run(eraId);
    db.prepare(`DELETE FROM wars WHERE era_id = ?`).run(eraId);
  } else {
    db.prepare(`DELETE FROM war_snapshots`).run();
    db.prepare(`DELETE FROM wars`).run();
  }
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
    theater: row.theater_json ? JSON.parse(row.theater_json as string) : undefined,
    casualties: row.casualties_json ? JSON.parse(row.casualties_json as string) : undefined,
    keyBattles: row.key_battles_json ? JSON.parse(row.key_battles_json as string) : [],
  };
}

// ── Civilization Memory ──

export function insertWarSnapshot(
  warId: string,
  year: number,
  side: "side1" | "side2",
  metrics: {
    totalTroops: number;
    standingArmy: number;
    militaryLevel: number;
    gdpGoldKg: number;
    population: number;
    techLevel: number;
    regionStatus?: string;
    casualties?: number;
    morale?: number;
  }
) {
  const db = getDb();
  const eraId = getCurrentEraId();
  db.prepare(`
    INSERT OR REPLACE INTO war_snapshots
      (war_id, year, side, total_troops, standing_army, military_level, gdp_gold_kg, population, tech_level, region_status, era_id, casualties, morale)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    warId, year, side,
    metrics.totalTroops, metrics.standingArmy, metrics.militaryLevel,
    metrics.gdpGoldKg, metrics.population, metrics.techLevel,
    metrics.regionStatus ?? null, eraId ?? null,
    metrics.casualties ?? 0, metrics.morale ?? 5
  );
}

export function getWarSnapshots(warId: string) {
  const db = getDb();
  const rows = db.prepare(
    `SELECT * FROM war_snapshots WHERE war_id = ? ORDER BY year ASC, side ASC`
  ).all(warId) as Record<string, unknown>[];
  return rows.map(parseWarSnapshotRow);
}

export function hasWarSnapshotForYear(warId: string, year: number): boolean {
  const db = getDb();
  const row = db.prepare(
    `SELECT 1 FROM war_snapshots WHERE war_id = ? AND year = ? LIMIT 1`
  ).get(warId, year);
  return !!row;
}

export function getWarSnapshotsForWars(warIds: string[]) {
  if (warIds.length === 0) return {};
  const db = getDb();
  const placeholders = warIds.map(() => "?").join(",");
  const rows = db.prepare(
    `SELECT * FROM war_snapshots WHERE war_id IN (${placeholders}) ORDER BY year ASC, side ASC`
  ).all(...warIds) as Record<string, unknown>[];

  const result: Record<string, { year: number; side1: Record<string, unknown>; side2: Record<string, unknown> }[]> = {};
  for (const row of rows) {
    const parsed = parseWarSnapshotRow(row);
    if (!result[parsed.warId]) result[parsed.warId] = [];
    let entry = result[parsed.warId].find((e) => e.year === parsed.year);
    if (!entry) {
      entry = { year: parsed.year, side1: {}, side2: {} };
      result[parsed.warId].push(entry);
    }
    entry[parsed.side as "side1" | "side2"] = {
      totalTroops: parsed.totalTroops,
      standingArmy: parsed.standingArmy,
      militaryLevel: parsed.militaryLevel,
      gdpGoldKg: parsed.gdpGoldKg,
      population: parsed.population,
      techLevel: parsed.techLevel,
      casualties: parsed.casualties,
      morale: parsed.morale,
    };
  }
  return result;
}

function parseWarSnapshotRow(row: Record<string, unknown>) {
  return {
    warId: row.war_id as string,
    year: row.year as number,
    side: row.side as string,
    totalTroops: row.total_troops as number,
    standingArmy: row.standing_army as number,
    militaryLevel: row.military_level as number,
    gdpGoldKg: row.gdp_gold_kg as number,
    population: row.population as number,
    techLevel: row.tech_level as number,
    regionStatus: row.region_status as string | null,
    casualties: (row.casualties as number) ?? 0,
    morale: (row.morale as number) ?? 5,
  };
}

export function deleteWarSnapshotsForEra(eraId: string) {
  const db = getDb();
  db.prepare(`DELETE FROM war_snapshots WHERE era_id = ?`).run(eraId);
}

export function deleteWarSnapshotsAfterYear(year: number, eraId?: string | null) {
  const db = getDb();
  if (eraId) {
    db.prepare(`DELETE FROM war_snapshots WHERE era_id = ? AND year > ?`).run(eraId, year);
  } else {
    db.prepare(`DELETE FROM war_snapshots WHERE year > ?`).run(year);
  }
}

export function updateWarDetails(
  id: string,
  summary: object,
  advantages: object,
  impact: object,
  lastNarrativeUpdateYear: number,
  theater?: object | null,
  casualties?: object | null,
  keyBattles?: object[] | null
) {
  const db = getDb();
  db.prepare(`
    UPDATE wars SET summary_json = ?, advantages_json = ?, impact_json = ?, last_narrative_update_year = ?,
      theater_json = COALESCE(?, theater_json),
      casualties_json = COALESCE(?, casualties_json),
      key_battles_json = COALESCE(?, key_battles_json)
    WHERE id = ?
  `).run(
    JSON.stringify(summary), JSON.stringify(advantages), JSON.stringify(impact), lastNarrativeUpdateYear,
    theater ? JSON.stringify(theater) : null,
    casualties ? JSON.stringify(casualties) : null,
    keyBattles ? JSON.stringify(keyBattles) : null,
    id
  );
}

export function getWarLastNarrativeUpdateYear(id: string): number | null {
  const db = getDb();
  const row = db.prepare(`SELECT last_narrative_update_year FROM wars WHERE id = ?`).get(id) as { last_narrative_update_year: number | null } | undefined;
  return row?.last_narrative_update_year ?? null;
}

// ── Civilization Memory ──

export function insertCivMemory(
  regionId: string,
  year: number,
  memoryText: string,
  eraId?: string
) {
  const db = getDb();
  db.prepare(
    `INSERT INTO civ_memories (region_id, year, memory_text, era_id) VALUES (?, ?, ?, ?)`
  ).run(regionId, year, memoryText, eraId ?? getCurrentEraId() ?? null);
}

export function getRecentCivMemories(
  regionId: string,
  limit: number = 5
): { year: number; memoryText: string }[] {
  const db = getDb();
  const eraId = getCurrentEraId();
  const rows = eraId
    ? db.prepare(
      `SELECT year, memory_text FROM civ_memories WHERE region_id = ? AND era_id = ? ORDER BY year DESC LIMIT ?`
    ).all(regionId, eraId, limit)
    : db.prepare(
      `SELECT year, memory_text FROM civ_memories WHERE region_id = ? ORDER BY year DESC LIMIT ?`
    ).all(regionId, limit);
  return (rows as { year: number; memory_text: string }[]).map((r) => ({
    year: r.year,
    memoryText: r.memory_text,
  }));
}
