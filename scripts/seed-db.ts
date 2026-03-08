import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "history.db");
const SEED_DIR = path.join(process.cwd(), "src", "data", "seed");

function main() {
  const eraId = process.argv[2];
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log("Removed existing database");
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

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

  console.log("Schema created");

  let stateFile: string;
  if (eraId) {
    stateFile = path.join(SEED_DIR, `era-${eraId}.json`);
    if (!fs.existsSync(stateFile)) {
      console.error(`Era file not found: era-${eraId}.json`);
      console.log("Available eras:");
      const eras = fs.readdirSync(SEED_DIR)
        .filter((f: string) => f.startsWith("era-") && f.endsWith(".json"))
        .map((f: string) => f.replace("era-", "").replace(".json", ""));
      eras.forEach((e: string) => console.log(`  - ${e}`));
      if (fs.existsSync(path.join(SEED_DIR, "initial-state.json"))) {
        console.log("\nFalling back to initial-state.json (bronze-age)");
        stateFile = path.join(SEED_DIR, "initial-state.json");
      } else {
        process.exit(1);
      }
    }
  } else {
    stateFile = path.join(SEED_DIR, "initial-state.json");
  }

  const initialStateRaw = fs.readFileSync(stateFile, "utf-8");
  const initialState = JSON.parse(initialStateRaw);

  const insertSnapshot = db.prepare(`
    INSERT INTO state_snapshots (id, year, month, era_json, regions_json, summary_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertSnapshot.run(
    initialState.id,
    initialState.timestamp.year,
    initialState.timestamp.month,
    JSON.stringify(initialState.era),
    JSON.stringify(initialState.regions),
    initialState.summary ? JSON.stringify(initialState.summary) : null
  );
  console.log(
    `Inserted initial state: ${initialState.timestamp.year}/${initialState.timestamp.month} from ${path.basename(stateFile)}`
  );

  const insertEvent = db.prepare(`
    INSERT INTO events (id, year, month, title_json, description_json, affected_regions_json, category, status, is_custom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let totalEvents = 0;

  const insertAll = db.transaction(() => {
    if (initialState.events && initialState.events.length > 0) {
      for (const evt of initialState.events) {
        const ts = evt.timestamp || { year: initialState.timestamp.year, month: 6 };
        insertEvent.run(
          evt.id,
          ts.year,
          ts.month,
          JSON.stringify(evt.title),
          JSON.stringify(evt.description),
          JSON.stringify(evt.affectedRegions),
          evt.category,
          evt.status || "pending",
          0
        );
        totalEvents++;
      }
      console.log(`Loaded ${initialState.events.length} events from era file`);
    }

    const eventFiles = fs
      .readdirSync(SEED_DIR)
      .filter((f: string) => f.startsWith("events-") && f.endsWith(".json"));

    for (const file of eventFiles) {
      const raw = fs.readFileSync(path.join(SEED_DIR, file), "utf-8");
      const events = JSON.parse(raw);
      for (const evt of events) {
        insertEvent.run(
          evt.id,
          evt.timestamp.year,
          evt.timestamp.month,
          JSON.stringify(evt.title),
          JSON.stringify(evt.description),
          JSON.stringify(evt.affectedRegions),
          evt.category,
          evt.status || "pending",
          0
        );
        totalEvents++;
      }
      console.log(`Loaded ${events.length} events from ${file}`);
    }
  });

  insertAll();

  console.log(`\nSeeding complete!`);
  console.log(`  Snapshots: 1`);
  console.log(`  Events: ${totalEvents}`);

  db.close();
}

main();
