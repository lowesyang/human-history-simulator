#!/usr/bin/env python3
"""
Sync giniEstimate from seed JSON files into data/history.db's economic_history table.
Backfill years are at 5-year intervals: year-5, year-10, year-15, year-20, year-25.

Usage:
  python3 scripts/sync-gini-to-db.py          # dry-run
  python3 scripts/sync-gini-to-db.py --write   # apply changes
"""
import json, glob, os, sys, sqlite3, math
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
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # First: delete old backfill rows (years that are NOT at 5-year intervals)
    # and rebuild with correct 5-year interval data

    era_files = sorted(glob.glob(str(SEED_DIR / "era-*.json")))
    total_deleted = 0
    total_inserted = 0
    total_updated = 0

    for filepath in era_files:
        era_file = os.path.basename(filepath).replace(".json", "")
        era_id = era_file[4:] if era_file.startswith("era-") else era_file
        with open(filepath, "r", encoding="utf-8") as f:
            era_data = json.load(f)

        era_year = era_data.get("timestamp", {}).get("year", 0)
        regions = era_data.get("regions", [])
        era_deleted = 0
        era_inserted = 0
        era_updated = 0

        # Valid years for this era: base year + 5 backfill at 5-year intervals
        valid_years = {era_year} | {era_year - i * 5 for i in range(1, 6)}

        for region in regions:
            gini = region.get("economy", {}).get("giniEstimate")
            if gini is None or gini <= 0:
                continue

            region_id = region["id"]

            # Get all existing rows for this region+era
            rows = cur.execute(
                "SELECT id, year, gini_estimate FROM economic_history WHERE region_id = ? AND era_id = ?",
                (region_id, era_id)
            ).fetchall()

            existing_years = {row["year"] for row in rows}

            # Delete rows at years that are NOT valid (old 1-year backfill)
            for row in rows:
                yr = row["year"]
                if yr not in valid_years:
                    if WRITE_MODE:
                        cur.execute("DELETE FROM economic_history WHERE id = ?", (row["id"],))
                    era_deleted += 1

            # Update or insert base-year row with exact gini
            for row in rows:
                if row["year"] == era_year:
                    if WRITE_MODE:
                        cur.execute(
                            "UPDATE economic_history SET gini_estimate = ? WHERE id = ?",
                            (gini, row["id"])
                        )
                    era_updated += 1

            # Update existing backfill rows with varied gini
            for i in range(1, 6):
                past_year = era_year - i * 5
                drift = 0.012 * (3 - i)
                mod = max(0.01, min(0.99, gini * (1 + drift)))

                matching = [r for r in rows if r["year"] == past_year]
                if matching:
                    if WRITE_MODE:
                        cur.execute(
                            "UPDATE economic_history SET gini_estimate = ? WHERE id = ?",
                            (mod, matching[0]["id"])
                        )
                    era_updated += 1

        total_deleted += era_deleted
        total_inserted += era_inserted
        total_updated += era_updated
        print(f"{era_id:<35} {era_year:>6} | del: {era_deleted:>4} | upd: {era_updated:>4}")

    if WRITE_MODE:
        conn.commit()

    conn.close()
    print(f"\nTotal: deleted={total_deleted}, updated={total_updated}")
    print(f"Mode: {'WRITE' if WRITE_MODE else 'DRY-RUN'}")
    if not WRITE_MODE:
        print("Run with --write to apply changes.")


if __name__ == "__main__":
    main()
