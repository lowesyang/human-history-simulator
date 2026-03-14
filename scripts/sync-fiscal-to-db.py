#!/usr/bin/env python3
"""
Sync updated seed fiscal data to data/history.db economic_history table.

For each era that has DB rows:
  1. Read the updated seed file
  2. For each region, update the base-year snapshot with corrected fiscal values
  3. Recalculate the backfilled years using the same growth model as init-era

Usage:
  python3 scripts/sync-fiscal-to-db.py          # dry-run
  python3 scripts/sync-fiscal-to-db.py --write   # apply changes
"""
import json, sqlite3, os, sys, math
from pathlib import Path

WRITE_MODE = "--write" in sys.argv
DB_PATH = Path(__file__).resolve().parent.parent / "data" / "history.db"
SEED_DIR = Path(__file__).resolve().parent.parent / "src" / "data" / "seed"

ERA_FILE_TO_ID = {
    "era-ai-age": "ai-age",
    "era-modern-era": "modern-era",
    "era-world-war-era": "world-war-era",
    "era-imperialism": "imperialism",
    "era-industrial-revolution": "industrial-revolution",
    "era-early-modern": "early-modern",
    "era-mongol-empire": "mongol-empire",
    "era-bronze-age": "bronze-age",
}

def get_gold_kg(v):
    if not v or not isinstance(v, dict):
        return 0.0
    return v.get("goldKg", 0) or 0.0


def main():
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT era_id FROM economic_history WHERE era_id IS NOT NULL")
    db_eras = set(row[0] for row in cursor.fetchall())
    print(f"Eras in DB: {sorted(db_eras)}")

    total_updated = 0
    total_inserted = 0

    for era_file, era_id in ERA_FILE_TO_ID.items():
        if era_id not in db_eras:
            print(f"\nSkipping {era_id} (not in DB)")
            continue

        seed_path = SEED_DIR / f"{era_file}.json"
        if not seed_path.exists():
            print(f"\nSkipping {era_id} (seed file not found)")
            continue

        with open(seed_path, "r", encoding="utf-8") as f:
            era_data = json.load(f)

        era_year = era_data["timestamp"]["year"]
        regions = era_data.get("regions", [])
        era_updated = 0
        era_inserted = 0

        print(f"\nProcessing {era_id} (year {era_year}, {len(regions)} regions)")

        for region in regions:
            rid = region["id"]
            fin = region.get("finances", {})
            econ = region.get("economy", {})
            demo = region.get("demographics", {})
            mil = region.get("military", {})

            gdp_gk = get_gold_kg(econ.get("gdpEstimate"))
            gdppc_gk = get_gold_kg(econ.get("gdpPerCapita"))
            treasury_gk = get_gold_kg(fin.get("treasury"))
            rev_gk = get_gold_kg(fin.get("annualRevenue"))
            exp_gk = get_gold_kg(fin.get("annualExpenditure"))
            trade_gk = get_gold_kg(econ.get("foreignTradeVolume"))
            debt_gk = get_gold_kg(fin.get("debtLevel"))
            mil_pct = mil.get("militarySpendingPctGdp", 0) or 0
            pop = demo.get("population", 0) or 0
            urban = demo.get("urbanizationRate", 0) or 0
            gini = econ.get("giniEstimate")

            # Update the base-year row
            cursor.execute(
                """SELECT id FROM economic_history 
                   WHERE region_id = ? AND year = ? AND era_id = ?""",
                (rid, era_year, era_id)
            )
            row = cursor.fetchone()

            if row:
                if WRITE_MODE:
                    cursor.execute("""
                        UPDATE economic_history SET
                            gdp_gold_kg = ?,
                            gdp_per_capita_gold_kg = ?,
                            treasury_gold_kg = ?,
                            revenue_gold_kg = ?,
                            expenditure_gold_kg = ?,
                            trade_volume_gold_kg = ?,
                            debt_gold_kg = ?,
                            military_spending_pct_gdp = ?,
                            population = ?,
                            urbanization_rate = ?,
                            gini_estimate = ?
                        WHERE id = ?
                    """, (gdp_gk, gdppc_gk, treasury_gk, rev_gk, exp_gk,
                          trade_gk, debt_gk, mil_pct, pop, urban, gini, row[0]))
                era_updated += 1
            else:
                if WRITE_MODE:
                    snap_id = f"{rid}_{era_year}_{era_id}"
                    cursor.execute("""
                        INSERT INTO economic_history 
                        (id, region_id, year, era_id, gdp_gold_kg, gdp_per_capita_gold_kg,
                         treasury_gold_kg, revenue_gold_kg, expenditure_gold_kg,
                         trade_volume_gold_kg, debt_gold_kg, military_spending_pct_gdp,
                         population, urbanization_rate, gini_estimate)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (snap_id, rid, era_year, era_id, gdp_gk, gdppc_gk,
                          treasury_gk, rev_gk, exp_gk, trade_gk, debt_gk,
                          mil_pct, pop, urban, gini))
                era_inserted += 1

            # Update backfilled years (era_year - 5 to era_year - 1)
            if gdp_gk > 0:
                growth_rate = (0.03 if era_year >= 2000 else
                              0.04 if era_year >= 1950 else
                              0.02 if era_year >= 1800 else
                              0.005 if era_year >= 1000 else 0.002)
                pop_growth = (0.012 if era_year >= 1900 else
                             0.004 if era_year >= 1500 else 0.002)

                for y in range(1, 6):
                    past_year = era_year - y
                    factor = math.pow(1 + growth_rate, -y)
                    pop_factor = math.pow(1 + pop_growth, -y)

                    past_gdp = gdp_gk * factor
                    past_pop = round(pop * pop_factor) if pop > 0 else 0
                    past_gdppc = past_gdp / past_pop if past_pop > 0 else 0

                    cursor.execute(
                        """SELECT id FROM economic_history 
                           WHERE region_id = ? AND year = ? AND era_id = ?""",
                        (rid, past_year, era_id)
                    )
                    past_row = cursor.fetchone()

                    vals = {
                        "gdp_gold_kg": past_gdp,
                        "gdp_per_capita_gold_kg": past_gdppc,
                        "treasury_gold_kg": treasury_gk * factor,
                        "revenue_gold_kg": rev_gk * factor,
                        "expenditure_gold_kg": exp_gk * factor,
                        "trade_volume_gold_kg": trade_gk * factor,
                        "debt_gold_kg": debt_gk * factor,
                        "military_spending_pct_gdp": mil_pct,
                        "population": past_pop,
                        "urbanization_rate": urban,
                        "gini_estimate": gini,
                    }

                    if past_row:
                        if WRITE_MODE:
                            cursor.execute(f"""
                                UPDATE economic_history SET
                                    gdp_gold_kg = ?,
                                    gdp_per_capita_gold_kg = ?,
                                    treasury_gold_kg = ?,
                                    revenue_gold_kg = ?,
                                    expenditure_gold_kg = ?,
                                    trade_volume_gold_kg = ?,
                                    debt_gold_kg = ?,
                                    military_spending_pct_gdp = ?,
                                    population = ?,
                                    urbanization_rate = ?,
                                    gini_estimate = ?
                                WHERE id = ?
                            """, (*vals.values(), past_row[0]))
                        era_updated += 1
                    else:
                        if WRITE_MODE:
                            snap_id = f"{rid}_{past_year}_{era_id}"
                            cursor.execute("""
                                INSERT INTO economic_history 
                                (id, region_id, year, era_id, gdp_gold_kg, gdp_per_capita_gold_kg,
                                 treasury_gold_kg, revenue_gold_kg, expenditure_gold_kg,
                                 trade_volume_gold_kg, debt_gold_kg, military_spending_pct_gdp,
                                 population, urbanization_rate, gini_estimate)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (snap_id, rid, past_year, era_id,
                                  *vals.values()))
                        era_inserted += 1

        total_updated += era_updated
        total_inserted += era_inserted
        print(f"  Updated: {era_updated}, Inserted: {era_inserted}")

    if WRITE_MODE:
        conn.commit()
        print(f"\nCommitted. Total updated: {total_updated}, inserted: {total_inserted}")
    else:
        print(f"\nDRY-RUN. Would update: {total_updated}, insert: {total_inserted}")
        print("Run with --write to apply changes.")

    conn.close()


if __name__ == "__main__":
    main()
