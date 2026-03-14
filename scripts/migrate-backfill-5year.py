#!/usr/bin/env python3
"""
Migrate economic_history backfill from 1-year to 5-year intervals.

Before: era_year, era_year-1, era_year-2, era_year-3, era_year-4, era_year-5
After:  era_year, era_year-5, era_year-10, era_year-15, era_year-20, era_year-25

Deletes old backfill rows (era_year-1..era_year-5), then sync-fiscal will
insert the new 5-year interval rows when run.

Usage:
  python3 scripts/migrate-backfill-5year.py          # dry-run
  python3 scripts/migrate-backfill-5year.py --write  # apply
"""
import json, glob, os, sys, sqlite3
from pathlib import Path

WRITE_MODE = "--write" in sys.argv
ROOT = Path(__file__).resolve().parent.parent
SEED_DIR = ROOT / "src" / "data" / "seed"
DB_PATH = ROOT / "data" / "history.db"


def main():
    if not DB_PATH.exists():
        print(f"Database not found: {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    cur.execute("SELECT DISTINCT era_id FROM economic_history WHERE era_id IS NOT NULL")
    db_eras = [r[0] for r in cur.fetchall()]
    print(f"Eras in DB: {sorted(db_eras)}")

    total_deleted = 0

    for era_id in db_eras:
        era_file = f"era-{era_id}"
        seed_path = SEED_DIR / f"{era_file}.json"
        if not seed_path.exists():
            print(f"  Skip {era_id} (no seed)")
            continue

        with open(seed_path, "r", encoding="utf-8") as f:
            era_data = json.load(f)
        era_year = era_data.get("timestamp", {}).get("year", 0)

        old_years = [era_year - 1, era_year - 2, era_year - 3, era_year - 4, era_year - 5]
        placeholders = ",".join("?" * len(old_years))
        params = [era_id] + old_years
        cur.execute(
            f"SELECT id, region_id, year FROM economic_history WHERE era_id = ? AND year IN ({placeholders})",
            params
        )
        rows = cur.fetchall()
        n = len(rows)
        if n > 0:
            ids = [r[0] for r in rows]
            if WRITE_MODE:
                cur.execute(
                    f"DELETE FROM economic_history WHERE id IN ({','.join('?'*len(ids))})",
                    ids
                )
            total_deleted += n
            print(f"  {era_id} (year {era_year}): delete {n} old backfill rows")

    if WRITE_MODE:
        conn.commit()
        print(f"\nDeleted {total_deleted} rows. Run sync-fiscal-to-db.py --write to insert 5-year backfill.")
    else:
        print(f"\nDRY-RUN: would delete {total_deleted} rows. Run with --write to apply.")

    conn.close()


if __name__ == "__main__":
    main()
