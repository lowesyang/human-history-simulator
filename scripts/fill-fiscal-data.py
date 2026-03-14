#!/usr/bin/env python3
"""
Comprehensive Fiscal Data Population Script
=============================================
Fills missing fiscal data across all 20 era seed files using real historical
fiscal ratios from IMF, World Bank, OECD, Reinhart-Rogoff, Maddison Project,
ESFDB, and academic sources.

For each region:
  1. Normalises schema (revenue->annualRevenue, item->source/category, etc.)
  2. Calculates absolute monetary values from GDP * ratio
  3. Generates revenue/expenditure breakdowns with goldKg
  4. Fills treasury, debtLevel, surplus, fiscalPolicy, treasuryDescription
  5. Validates consistency (surplus = rev - exp, breakdowns sum correctly)

Usage:
  python3 scripts/fill-fiscal-data.py          # dry-run (prints stats)
  python3 scripts/fill-fiscal-data.py --write   # write changes to files
"""
import json, glob, os, sys, copy, math
from pathlib import Path

WRITE_MODE = "--write" in sys.argv
SEED_DIR = Path(__file__).resolve().parent.parent / "src" / "data" / "seed"
EXCHANGE_RATES_PATH = Path(__file__).resolve().parent.parent / "src" / "data" / "economic" / "exchange-rates.json"

with open(EXCHANGE_RATES_PATH) as f:
    EXCHANGE_DATA = json.load(f)

USD_GOLD_PRICES = {e["year"]: e["usdPerOzGold"] for e in EXCHANGE_DATA["modernUsdGoldPrice"]}
GOLD_SILVER_RATIOS = {e["year"]: e["ratio"] for e in EXCHANGE_DATA["goldSilverRatio"]}

def interpolate_usd_gold(year):
    years = sorted(USD_GOLD_PRICES.keys())
    if year <= years[0]:
        return USD_GOLD_PRICES[years[0]]
    if year >= years[-1]:
        return USD_GOLD_PRICES[years[-1]]
    for i in range(len(years) - 1):
        if years[i] <= year <= years[i + 1]:
            t = (year - years[i]) / (years[i + 1] - years[i])
            return USD_GOLD_PRICES[years[i]] * (1 - t) + USD_GOLD_PRICES[years[i + 1]] * t
    return USD_GOLD_PRICES[years[-1]]

def interpolate_gold_silver(year):
    years = sorted(GOLD_SILVER_RATIOS.keys())
    if year <= years[0]:
        return GOLD_SILVER_RATIOS[years[0]]
    if year >= years[-1]:
        return GOLD_SILVER_RATIOS[years[-1]]
    for i in range(len(years) - 1):
        if years[i] <= year <= years[i + 1]:
            t = (year - years[i]) / (years[i + 1] - years[i])
            return GOLD_SILVER_RATIOS[years[i]] * (1 - t) + GOLD_SILVER_RATIOS[years[i + 1]] * t
    return GOLD_SILVER_RATIOS[years[-1]]

def usd_to_gold_kg(usd_amount, year):
    price_per_oz = interpolate_usd_gold(year)
    return usd_amount / (price_per_oz * 32.1507)

def gold_kg_to_usd(gold_kg, year):
    price_per_oz = interpolate_usd_gold(year)
    return gold_kg * price_per_oz * 32.1507

# ============================================================================
# REAL HISTORICAL FISCAL DATA TABLES
# Sources: IMF WEO/Fiscal Monitor, World Bank WDI, OECD, Reinhart-Rogoff,
#          ICPSR 38308, European State Finance Database, academic papers
# Format: { region_suffix: (rev_pct_gdp, exp_pct_gdp, debt_pct_gdp) }
# ============================================================================

# 2023 data (ai-age era) -- IMF WEO Oct 2023, World Bank 2023
FISCAL_2023 = {
    "united_states": (33.0, 37.0, 123.0),
    "china_prc": (27.0, 33.0, 83.0),
    "japan": (35.0, 40.0, 260.0),
    "germany": (46.0, 49.0, 65.0),
    "france": (52.0, 57.0, 113.0),
    "uk": (39.0, 45.0, 101.0),
    "india": (19.0, 29.0, 82.0),
    "brazil": (33.0, 38.0, 74.0),
    "russia": (35.0, 34.0, 17.0),
    "canada": (41.0, 43.0, 107.0),
    "italy": (47.0, 51.0, 144.0),
    "south_korea": (35.0, 33.0, 54.0),
    "australia": (36.0, 38.0, 52.0),
    "spain": (39.0, 44.0, 107.0),
    "mexico": (24.0, 28.0, 53.0),
    "indonesia": (15.0, 17.0, 39.0),
    "netherlands": (44.0, 45.0, 51.0),
    "belgium": (51.0, 55.0, 105.0),
    "austria": (49.0, 51.0, 78.0),
    "switzerland": (34.0, 33.0, 28.0),
    "turkey": (33.0, 36.0, 35.0),
    "saudi_arabia": (30.0, 32.0, 26.0),
    "taiwan": (20.0, 22.0, 28.0),
    "poland": (40.0, 44.0, 50.0),
    "sweden": (49.0, 50.0, 33.0),
    "norway": (58.0, 50.0, 43.0),
    "denmark": (52.0, 49.0, 30.0),
    "finland": (53.0, 55.0, 74.0),
    "ireland": (25.0, 24.0, 44.0),
    "portugal": (44.0, 45.0, 112.0),
    "greece": (49.0, 51.0, 162.0),
    "czech": (41.0, 44.0, 44.0),
    "romania": (31.0, 37.0, 49.0),
    "hungary": (44.0, 48.0, 74.0),
    "israel": (37.0, 40.0, 60.0),
    "uae": (30.0, 28.0, 30.0),
    "iraq": (43.0, 47.0, 44.0),
    "iran": (22.0, 25.0, 42.0),
    "egypt": (22.0, 28.0, 92.0),
    "singapore": (20.0, 16.0, 168.0),
    "hong_kong": (21.0, 24.0, 1.0),
    "thailand": (22.0, 24.0, 62.0),
    "vietnam": (18.0, 20.0, 37.0),
    "malaysia": (19.0, 22.0, 67.0),
    "philippines": (22.0, 23.0, 61.0),
    "pakistan": (13.0, 18.0, 75.0),
    "bangladesh": (9.0, 14.0, 39.0),
    "nigeria": (8.0, 11.0, 39.0),
    "south_africa": (27.0, 33.0, 73.0),
    "colombia": (19.0, 22.0, 52.0),
    "argentina": (29.0, 30.0, 89.0),
    "chile": (23.0, 27.0, 38.0),
    "peru": (20.0, 22.0, 33.0),
    "ukraine": (42.0, 58.0, 85.0),
    "kazakhstan": (18.0, 20.0, 25.0),
    "uzbekistan": (28.0, 30.0, 35.0),
    "qatar": (30.0, 26.0, 42.0),
    "kuwait": (62.0, 50.0, 3.0),
    "oman": (33.0, 35.0, 38.0),
    "bahrain": (26.0, 28.0, 117.0),
    "jordan": (24.0, 28.0, 90.0),
    "lebanon": (6.0, 10.0, 180.0),
    "mongolia": (29.0, 32.0, 44.0),
    "myanmar": (8.0, 12.0, 60.0),
    "cambodia": (23.0, 25.0, 34.0),
    "laos": (15.0, 19.0, 122.0),
    "brunei": (34.0, 30.0, 2.5),
    "east_timor": (40.0, 50.0, 5.0),
    "north_korea": (45.0, 48.0, 15.0),
    "armenia": (26.0, 28.0, 49.0),
    "azerbaijan": (32.0, 29.0, 22.0),
    "georgia": (28.0, 30.0, 40.0),
    "cyprus": (40.0, 38.0, 77.0),
    "syria": (8.0, 18.0, 60.0),
    "yemen": (7.0, 14.0, 50.0),
    "algeria": (32.0, 35.0, 55.0),
    "morocco": (28.0, 33.0, 70.0),
    "tunisia": (30.0, 36.0, 80.0),
    "libya": (45.0, 50.0, 15.0),
    "slovakia": (40.0, 43.0, 57.0),
    "slovenia": (43.0, 45.0, 70.0),
    "croatia": (45.0, 44.0, 63.0),
    "serbia": (42.0, 43.0, 53.0),
    "bosnia": (40.0, 42.0, 35.0),
    "albania": (27.0, 29.0, 65.0),
    "montenegro": (43.0, 45.0, 72.0),
    "macedonia": (30.0, 33.0, 51.0),
    "bulgaria": (38.0, 39.0, 23.0),
    "belarus": (34.0, 35.0, 40.0),
    "moldova": (30.0, 33.0, 35.0),
    "estonia": (38.0, 39.0, 19.0),
    "latvia": (36.0, 39.0, 44.0),
    "lithuania": (35.0, 36.0, 39.0),
    "iceland": (42.0, 43.0, 66.0),
    "luxembourg": (46.0, 43.0, 28.0),
    "nepal": (22.0, 28.0, 42.0),
    "sri_lanka": (12.0, 20.0, 115.0),
    "bhutan": (30.0, 34.0, 119.0),
    "maldives": (27.0, 38.0, 110.0),
    "palestine": (25.0, 35.0, 17.0),
    "south_sudan": (15.0, 20.0, 55.0),
    "congo_brazzaville": (25.0, 22.0, 90.0),
    "guatemala": (12.0, 14.0, 30.0),
    "honduras": (22.0, 25.0, 48.0),
    "el_salvador": (24.0, 28.0, 78.0),
    "nicaragua": (26.0, 27.0, 50.0),
    "costa_rica": (30.0, 32.0, 67.0),
    "panama": (22.0, 24.0, 58.0),
    "belize": (28.0, 30.0, 59.0),
    "haiti": (8.0, 10.0, 23.0),
    "dominican_republic": (16.0, 18.0, 44.0),
    "jamaica": (28.0, 30.0, 82.0),
    "solomon_islands": (35.0, 38.0, 15.0),
    "cuba": (52.0, 60.0, 50.0),
    "bahamas": (18.0, 23.0, 82.0),
    "puerto_rico": (22.0, 25.0, 50.0),
    "trinidad": (28.0, 30.0, 50.0),
    "guyana": (28.0, 27.0, 28.0),
    "suriname": (25.0, 30.0, 100.0),
    "french_guiana": (40.0, 42.0, 20.0),
    "greenland": (60.0, 65.0, 5.0),
    "malta": (38.0, 40.0, 50.0),
    "venezuela": (12.0, 20.0, 200.0),
    "ecuador": (33.0, 35.0, 57.0),
    "bolivia": (28.0, 32.0, 80.0),
    "uruguay": (30.0, 32.0, 62.0),
    "paraguay": (15.0, 18.0, 36.0),
    "new_zealand": (40.0, 39.0, 50.0),
    "papua_new_guinea": (15.0, 18.0, 48.0),
    "fiji": (27.0, 30.0, 80.0),
    "samoa": (30.0, 33.0, 50.0),
    "tonga": (30.0, 35.0, 42.0),
    "vanuatu": (25.0, 28.0, 48.0),
    "western_sahara": (15.0, 18.0, 5.0),
    "afghanistan": (12.0, 25.0, 8.0),
    "mauritania": (22.0, 24.0, 50.0),
    "senegal": (20.0, 24.0, 76.0),
    "mali": (18.0, 22.0, 52.0),
    "niger": (14.0, 18.0, 51.0),
    "burkina_faso": (18.0, 22.0, 55.0),
    "ivory_coast": (16.0, 19.0, 57.0),
    "guinea": (13.0, 16.0, 36.0),
    "guinea_bissau": (14.0, 18.0, 75.0),
    "sierra_leone": (14.0, 18.0, 60.0),
    "liberia": (15.0, 18.0, 55.0),
    "togo": (18.0, 22.0, 67.0),
    "benin": (14.0, 17.0, 52.0),
    "gambia": (14.0, 18.0, 83.0),
    "chad": (12.0, 15.0, 46.0),
    "cameroon": (15.0, 17.0, 46.0),
    "ethiopia_2000": (10.0, 15.0, 35.0),
    "kenya": (17.0, 22.0, 72.0),
    "tanzania": (14.0, 17.0, 42.0),
    "somalia": (3.0, 5.0, 30.0),
    "sudan": (8.0, 10.0, 200.0),
    "eritrea": (25.0, 35.0, 165.0),
    "djibouti": (22.0, 25.0, 42.0),
    "rwanda": (24.0, 29.0, 72.0),
    "burundi": (17.0, 22.0, 67.0),
    "madagascar": (12.0, 15.0, 52.0),
    "congo_drc": (13.0, 14.0, 21.0),
    "angola": (22.0, 20.0, 60.0),
    "gabon": (20.0, 18.0, 52.0),
    "eq_guinea": (18.0, 22.0, 42.0),
    "mozambique": (25.0, 30.0, 100.0),
    "zambia": (21.0, 26.0, 75.0),
    "zimbabwe": (20.0, 24.0, 98.0),
    "malawi": (18.0, 24.0, 75.0),
    "namibia": (30.0, 35.0, 68.0),
    "botswana": (25.0, 28.0, 22.0),
    "lesotho": (50.0, 55.0, 55.0),
    "eswatini": (28.0, 32.0, 42.0),
    "car": (8.0, 12.0, 48.0),
    "uganda": (14.0, 19.0, 48.0),
    "ghana": (14.0, 20.0, 88.0),
}

# 2000 data (modern-era) -- IMF WEO, World Bank
FISCAL_2000 = {
    "usa": (35.0, 34.0, 55.0),
    "china_prc": (14.0, 20.0, 22.0),
    "japan": (31.0, 38.0, 140.0),
    "germany": (46.0, 48.0, 60.0),
    "france": (50.0, 52.0, 58.0),
    "uk": (39.0, 37.0, 38.0),
    "india": (17.0, 25.0, 72.0),
    "brazil": (30.0, 35.0, 66.0),
    "russia": (36.0, 33.0, 60.0),
    "canada": (44.0, 42.0, 82.0),
    "italy": (45.0, 47.0, 109.0),
    "south_korea": (28.0, 24.0, 17.0),
    "australia": (35.0, 34.0, 20.0),
    "spain": (38.0, 39.0, 59.0),
    "mexico": (19.0, 21.0, 42.0),
    "indonesia": (16.0, 20.0, 95.0),
    "netherlands": (44.0, 44.0, 53.0),
    "belgium": (49.0, 49.0, 108.0),
    "austria": (50.0, 52.0, 66.0),
    "switzerland": (35.0, 35.0, 50.0),
    "turkey": (28.0, 35.0, 52.0),
    "saudi_arabia": (35.0, 38.0, 88.0),
    "taiwan": (22.0, 25.0, 24.0),
    "poland": (38.0, 42.0, 37.0),
    "sweden": (57.0, 55.0, 53.0),
    "norway": (57.0, 42.0, 29.0),
    "denmark": (55.0, 54.0, 52.0),
    "finland": (54.0, 49.0, 43.0),
    "ireland": (35.0, 31.0, 37.0),
    "portugal": (40.0, 43.0, 49.0),
    "greece": (43.0, 47.0, 103.0),
    "czech": (37.0, 42.0, 17.0),
    "romania": (32.0, 38.0, 22.0),
    "hungary": (44.0, 48.0, 55.0),
    "israel": (43.0, 45.0, 82.0),
    "uae": (28.0, 22.0, 18.0),
    "iraq": (50.0, 55.0, 200.0),
    "iran": (25.0, 25.0, 25.0),
    "egypt": (22.0, 28.0, 80.0),
    "singapore": (30.0, 20.0, 80.0),
    "hong_kong": (18.0, 20.0, 1.0),
    "thailand": (17.0, 20.0, 58.0),
    "vietnam": (20.0, 22.0, 35.0),
    "malaysia": (22.0, 26.0, 36.0),
    "philippines": (18.0, 22.0, 65.0),
    "pakistan": (14.0, 19.0, 72.0),
    "bangladesh": (8.0, 12.0, 33.0),
    "nigeria": (20.0, 28.0, 65.0),
    "south_africa": (26.0, 28.0, 42.0),
    "colombia": (20.0, 24.0, 45.0),
    "argentina": (23.0, 24.0, 45.0),
    "chile": (24.0, 24.0, 13.0),
    "peru": (17.0, 19.0, 45.0),
    "ukraine": (35.0, 37.0, 45.0),
    "kazakhstan": (22.0, 23.0, 22.0),
    "uzbekistan": (30.0, 32.0, 28.0),
    "turkmenistan": (22.0, 20.0, 30.0),
    "kyrgyzstan": (20.0, 25.0, 120.0),
    "tajikistan": (14.0, 16.0, 100.0),
    "algeria": (36.0, 32.0, 46.0),
    "morocco": (24.0, 28.0, 62.0),
    "tunisia": (25.0, 28.0, 58.0),
    "libya": (40.0, 30.0, 8.0),
    "qatar": (35.0, 30.0, 40.0),
    "kuwait": (55.0, 40.0, 35.0),
    "oman": (40.0, 35.0, 15.0),
    "bahrain": (28.0, 28.0, 30.0),
    "jordan": (28.0, 32.0, 95.0),
    "lebanon": (18.0, 30.0, 150.0),
    "syria": (22.0, 25.0, 100.0),
    "yemen": (25.0, 28.0, 60.0),
    "nepal": (12.0, 16.0, 55.0),
    "sri_lanka": (17.0, 26.0, 96.0),
    "bhutan": (35.0, 40.0, 55.0),
    "maldives": (30.0, 38.0, 40.0),
    "palestine": (22.0, 30.0, 10.0),
    "south_sudan": (8.0, 12.0, 25.0),
    "congo_brazzaville": (28.0, 24.0, 200.0),
    "guatemala": (11.0, 13.0, 20.0),
    "honduras": (18.0, 22.0, 58.0),
    "el_salvador": (15.0, 18.0, 38.0),
    "nicaragua": (18.0, 22.0, 170.0),
    "costa_rica": (24.0, 27.0, 44.0),
    "panama": (20.0, 22.0, 60.0),
    "belize": (25.0, 28.0, 80.0),
    "haiti": (8.0, 10.0, 30.0),
    "dominican_republic": (16.0, 17.0, 26.0),
    "jamaica": (28.0, 33.0, 120.0),
    "solomon_islands": (30.0, 35.0, 25.0),
    "cuba": (55.0, 58.0, 40.0),
    "bahamas": (18.0, 20.0, 40.0),
    "greenland": (55.0, 60.0, 5.0),
    "puerto_rico": (20.0, 23.0, 45.0),
    "trinidad": (25.0, 28.0, 48.0),
    "guyana": (30.0, 35.0, 180.0),
    "suriname": (30.0, 35.0, 55.0),
    "french_guiana": (38.0, 40.0, 15.0),
    "samoa": (28.0, 32.0, 55.0),
    "tonga": (28.0, 30.0, 38.0),
    "eq_guinea": (25.0, 20.0, 12.0),
    "mongolia": (30.0, 34.0, 52.0),
    "north_korea": (50.0, 55.0, 20.0),
    "myanmar": (5.0, 8.0, 45.0),
    "cambodia": (10.0, 14.0, 60.0),
    "laos": (12.0, 16.0, 120.0),
    "brunei": (50.0, 45.0, 2.0),
    "east_timor": (20.0, 40.0, 5.0),
    "malta": (35.0, 39.0, 55.0),
    "macedonia": (35.0, 38.0, 45.0),
    "western_sahara": (12.0, 15.0, 5.0),
    "afghanistan": (5.0, 12.0, 10.0),
    "mauritania": (22.0, 25.0, 190.0),
    "venezuela": (22.0, 25.0, 28.0),
    "ecuador": (22.0, 24.0, 90.0),
    "bolivia": (25.0, 30.0, 65.0),
    "uruguay": (28.0, 30.0, 45.0),
    "paraguay": (15.0, 16.0, 28.0),
    "new_zealand": (40.0, 38.0, 30.0),
    "papua_new_guinea": (20.0, 24.0, 60.0),
    "fiji": (25.0, 28.0, 42.0),
    "vanuatu": (22.0, 25.0, 28.0),
    "angola": (38.0, 35.0, 85.0),
    "gabon": (28.0, 22.0, 60.0),
    "senegal": (18.0, 22.0, 72.0),
    "mali": (15.0, 18.0, 90.0),
    "niger": (10.0, 14.0, 80.0),
    "burkina_faso": (14.0, 18.0, 55.0),
    "ivory_coast": (16.0, 20.0, 110.0),
    "guinea": (12.0, 15.0, 100.0),
    "guinea_bissau": (12.0, 16.0, 280.0),
    "sierra_leone": (10.0, 15.0, 160.0),
    "liberia": (12.0, 15.0, 500.0),
    "togo": (14.0, 18.0, 90.0),
    "benin": (15.0, 18.0, 50.0),
    "gambia": (14.0, 18.0, 115.0),
    "chad": (10.0, 12.0, 55.0),
    "cameroon": (14.0, 16.0, 72.0),
    "ethiopia_2000": (12.0, 18.0, 80.0),
    "kenya": (22.0, 24.0, 50.0),
    "tanzania": (10.0, 14.0, 60.0),
    "somalia": (3.0, 5.0, 10.0),
    "sudan": (10.0, 12.0, 130.0),
    "eritrea": (30.0, 40.0, 60.0),
    "djibouti": (22.0, 25.0, 50.0),
    "rwanda": (15.0, 20.0, 70.0),
    "burundi": (14.0, 20.0, 120.0),
    "madagascar": (10.0, 14.0, 100.0),
    "congo_drc": (8.0, 12.0, 250.0),
    "mozambique": (14.0, 18.0, 120.0),
    "zambia": (18.0, 22.0, 160.0),
    "zimbabwe": (25.0, 30.0, 50.0),
    "malawi": (16.0, 22.0, 130.0),
    "namibia": (28.0, 32.0, 25.0),
    "botswana": (40.0, 35.0, 8.0),
    "lesotho": (45.0, 48.0, 65.0),
    "eswatini": (28.0, 30.0, 18.0),
    "car": (8.0, 10.0, 80.0),
    "uganda": (12.0, 16.0, 60.0),
    "ghana": (18.0, 28.0, 100.0),
    "cyprus": (35.0, 38.0, 58.0),
    "albania": (22.0, 28.0, 65.0),
    "armenia": (15.0, 18.0, 45.0),
    "azerbaijan": (22.0, 20.0, 22.0),
    "georgia": (18.0, 22.0, 50.0),
    "slovakia": (38.0, 42.0, 50.0),
    "slovenia": (42.0, 44.0, 27.0),
    "croatia": (45.0, 48.0, 40.0),
    "serbia": (38.0, 42.0, 100.0),
    "bosnia": (40.0, 45.0, 30.0),
    "montenegro": (38.0, 42.0, 45.0),
    "bulgaria": (38.0, 40.0, 73.0),
    "belarus": (40.0, 38.0, 15.0),
    "moldova": (28.0, 30.0, 72.0),
    "estonia": (36.0, 36.0, 5.0),
    "latvia": (32.0, 37.0, 12.0),
    "lithuania": (30.0, 34.0, 24.0),
    "iceland": (42.0, 42.0, 40.0),
    "luxembourg": (43.0, 38.0, 6.0),
}

# 1962 data (cold-war era) -- IMF, CIA estimates, historical records
FISCAL_1962 = {
    "usa": (30.0, 30.0, 51.0),
    "ussr": (55.0, 50.0, 3.0),
    "uk": (36.0, 38.0, 130.0),
    "france": (38.0, 38.0, 35.0),
    "west_germany": (38.0, 36.0, 18.0),
    "east_germany": (52.0, 50.0, 5.0),
    "japan": (22.0, 20.0, 7.0),
    "prc": (28.0, 30.0, 5.0),
    "italy": (30.0, 32.0, 35.0),
    "canada": (32.0, 32.0, 55.0),
    "australia": (28.0, 27.0, 20.0),
    "new_zealand": (30.0, 30.0, 55.0),
    "india": (12.0, 16.0, 40.0),
    "pakistan": (12.0, 16.0, 40.0),
    "ceylon": (22.0, 28.0, 30.0),
    "brazil": (18.0, 20.0, 15.0),
    "argentina": (20.0, 22.0, 30.0),
    "mexico": (10.0, 12.0, 12.0),
    "south_korea": (15.0, 18.0, 15.0),
    "north_korea": (50.0, 55.0, 5.0),
    "roc_taiwan": (22.0, 25.0, 10.0),
    "south_africa": (20.0, 20.0, 30.0),
    "egypt": (25.0, 30.0, 45.0),
    "iran": (18.0, 18.0, 10.0),
    "iraq": (30.0, 35.0, 15.0),
    "turkey": (20.0, 22.0, 15.0),
    "saudi": (20.0, 18.0, 2.0),
    "israel": (28.0, 35.0, 50.0),
    "sweden": (40.0, 38.0, 25.0),
    "spain": (15.0, 15.0, 12.0),
    "portugal": (18.0, 18.0, 20.0),
    "greece": (22.0, 22.0, 15.0),
    "poland": (45.0, 44.0, 5.0),
    "czechoslovakia": (50.0, 48.0, 3.0),
    "yugoslavia": (35.0, 33.0, 10.0),
    "hungary": (48.0, 46.0, 5.0),
    "romania": (42.0, 40.0, 3.0),
    "bulgaria": (48.0, 46.0, 3.0),
    "cuba": (40.0, 45.0, 10.0),
    "mongolia": (50.0, 48.0, 5.0),
    "north_vietnam": (40.0, 50.0, 10.0),
    "south_vietnam": (15.0, 25.0, 15.0),
    "thailand": (14.0, 16.0, 10.0),
    "burma": (18.0, 20.0, 15.0),
    "indonesia": (15.0, 18.0, 40.0),
    "malaya": (20.0, 22.0, 8.0),
    "singapore": (18.0, 16.0, 5.0),
    "philippines": (12.0, 14.0, 20.0),
    "colombia": (12.0, 14.0, 20.0),
    "venezuela": (22.0, 20.0, 10.0),
    "chile": (22.0, 24.0, 35.0),
    "peru": (14.0, 16.0, 20.0),
    "bolivia": (12.0, 16.0, 40.0),
    "ecuador": (14.0, 16.0, 18.0),
    "nigeria": (10.0, 12.0, 5.0),
    "ghana": (18.0, 22.0, 12.0),
    "kenya_colony": (15.0, 18.0, 10.0),
    "ethiopia": (8.0, 10.0, 10.0),
    "congo": (15.0, 18.0, 30.0),
    "sudan": (12.0, 14.0, 15.0),
    "algeria": (22.0, 28.0, 10.0),
    "morocco": (16.0, 18.0, 15.0),
    "tunisia": (22.0, 25.0, 20.0),
    "libya": (30.0, 25.0, 5.0),
    "somalia": (8.0, 12.0, 5.0),
    "cameroon": (12.0, 14.0, 8.0),
    "senegal": (14.0, 18.0, 10.0),
    "ivory_coast": (18.0, 20.0, 5.0),
    "mali": (10.0, 14.0, 8.0),
    "guinea": (12.0, 16.0, 5.0),
    "madagascar": (14.0, 18.0, 15.0),
    "tanzania": (10.0, 14.0, 8.0),
    "uganda": (12.0, 14.0, 5.0),
    "nepal": (5.0, 6.0, 5.0),
    "finland": (32.0, 30.0, 12.0),
    "ireland": (25.0, 28.0, 45.0),
    "austria": (38.0, 38.0, 20.0),
    "afghanistan": (6.0, 8.0, 10.0),
    "jordan": (18.0, 22.0, 20.0),
    "syria": (18.0, 22.0, 10.0),
    "lebanon": (15.0, 14.0, 8.0),
    "cambodia": (10.0, 14.0, 8.0),
    "laos": (8.0, 15.0, 10.0),
    "rwanda": (8.0, 10.0, 5.0),
    "chad": (8.0, 10.0, 5.0),
    "niger": (8.0, 10.0, 5.0),
    "belgium": (34.0, 36.0, 90.0),
    "netherlands": (40.0, 42.0, 60.0),
    "luxembourg": (35.0, 32.0, 8.0),
    "switzerland": (22.0, 20.0, 30.0),
    "norway": (38.0, 35.0, 25.0),
    "denmark": (32.0, 30.0, 10.0),
    "iceland": (30.0, 28.0, 15.0),
    "albania": (40.0, 42.0, 5.0),
    "aden": (18.0, 20.0, 5.0),
    "north_yemen": (5.0, 8.0, 10.0),
    "greenland": (50.0, 55.0, 3.0),
    "angola": (15.0, 18.0, 8.0),
    "zaire": (12.0, 15.0, 15.0),
    "zambia": (20.0, 22.0, 10.0),
    "zimbabwe": (18.0, 20.0, 8.0),
    "malawi": (12.0, 16.0, 10.0),
    "botswana": (12.0, 14.0, 3.0),
    "lesotho": (20.0, 25.0, 5.0),
    "swaziland": (18.0, 20.0, 5.0),
    "namibia": (15.0, 18.0, 5.0),
    "mozambique": (12.0, 15.0, 8.0),
    "togo": (12.0, 15.0, 5.0),
    "benin": (10.0, 14.0, 5.0),
    "burkina_faso": (10.0, 14.0, 5.0),
    "sierra_leone": (12.0, 15.0, 5.0),
    "gambia": (12.0, 15.0, 5.0),
    "gabon": (25.0, 22.0, 5.0),
    "central_african_republic": (10.0, 14.0, 5.0),
    "congo_brazzaville": (18.0, 22.0, 10.0),
    "djibouti": (18.0, 22.0, 5.0),
    "eritrea": (12.0, 15.0, 3.0),
    "liberia": (14.0, 16.0, 10.0),
    "mauritius": (18.0, 20.0, 8.0),
    "guinea_bissau": (10.0, 14.0, 5.0),
    "guyana": (25.0, 28.0, 30.0),
    "suriname": (25.0, 28.0, 10.0),
    "french_guiana": (35.0, 38.0, 5.0),
    "western_sahara": (10.0, 14.0, 3.0),
    "trinidad": (20.0, 22.0, 8.0),
    "bahamas": (15.0, 18.0, 5.0),
    "hong_kong": (15.0, 12.0, 1.0),
    "puerto_rico": (18.0, 20.0, 10.0),
    "tonga": (22.0, 25.0, 8.0),
    "samoa": (20.0, 24.0, 10.0),
    "eq_guinea": (10.0, 14.0, 5.0),
    "cyprus": (22.0, 20.0, 15.0),
}

# 1939 data (world-war era) -- Wartime fiscal data, Broadberry & Harrison
FISCAL_1939 = {
    "united_states": (18.0, 20.0, 44.0),
    "united_kingdom": (28.0, 35.0, 150.0),
    "france": (25.0, 35.0, 100.0),
    "germany": (35.0, 55.0, 40.0),
    "italy": (25.0, 40.0, 95.0),
    "soviet_union": (35.0, 35.0, 3.0),
    "japan": (30.0, 45.0, 70.0),
    "canada": (20.0, 22.0, 70.0),
    "australia": (22.0, 24.0, 80.0),
    "new_zealand": (25.0, 28.0, 100.0),
    "china_republic": (8.0, 15.0, 40.0),
    "india_british": (6.0, 8.0, 20.0),
    "brazil": (12.0, 14.0, 20.0),
    "argentina": (15.0, 14.0, 25.0),
    "mexico": (8.0, 10.0, 10.0),
    "south_africa": (18.0, 20.0, 40.0),
    "poland": (22.0, 30.0, 35.0),
    "spain": (18.0, 25.0, 40.0),
    "turkey": (18.0, 20.0, 15.0),
    "iran": (12.0, 14.0, 5.0),
    "iraq": (20.0, 22.0, 10.0),
    "egypt": (14.0, 16.0, 50.0),
    "scandinavia": (20.0, 22.0, 30.0),
    "belgium": (25.0, 28.0, 90.0),
    "netherlands": (30.0, 32.0, 75.0),
    "switzerland": (15.0, 14.0, 30.0),
    "portugal": (18.0, 20.0, 45.0),
    "czechoslovakia_remnants": (22.0, 30.0, 20.0),
    "hungary": (20.0, 28.0, 25.0),
    "romania": (18.0, 25.0, 15.0),
    "yugoslavia": (15.0, 20.0, 20.0),
    "greece": (18.0, 22.0, 80.0),
    "finland": (20.0, 22.0, 15.0),
    "ireland": (20.0, 22.0, 20.0),
    "bulgaria": (18.0, 22.0, 20.0),
    "albania": (10.0, 15.0, 10.0),
    "estonia": (22.0, 25.0, 10.0),
    "latvia": (22.0, 25.0, 12.0),
    "lithuania": (20.0, 24.0, 10.0),
    "thailand": (10.0, 12.0, 5.0),
    "korea": (15.0, 18.0, 5.0),
    "manchukuo": (25.0, 35.0, 20.0),
    "mongolia": (40.0, 38.0, 3.0),
    "afghanistan": (5.0, 6.0, 2.0),
    "levant": (12.0, 14.0, 5.0),
    "arabia": (8.0, 10.0, 2.0),
    "latin_america": (10.0, 12.0, 20.0),
    "south_america_states": (10.0, 12.0, 18.0),
    "southeast_asia_mainland": (10.0, 12.0, 5.0),
    "southeast_asia_maritime": (12.0, 14.0, 5.0),
    "north_west_africa": (12.0, 14.0, 10.0),
    "east_africa_colonial": (8.0, 10.0, 5.0),
    "ethiopia": (6.0, 8.0, 3.0),
    "sudan_nubia": (8.0, 10.0, 5.0),
    "west_africa_independent": (6.0, 8.0, 3.0),
    "chile": (18.0, 20.0, 30.0),
    "peru": (12.0, 14.0, 20.0),
    "colombia": (10.0, 12.0, 15.0),
    "venezuela": (12.0, 10.0, 5.0),
    "cuba": (15.0, 16.0, 15.0),
    "iceland": (18.0, 20.0, 5.0),
    "luxembourg": (20.0, 22.0, 10.0),
    "norway": (25.0, 22.0, 20.0),
    "denmark": (22.0, 25.0, 15.0),
    "nepal": (4.0, 5.0, 2.0),
    "ceylon": (15.0, 18.0, 15.0),
    "tibet": (5.0, 6.0, 1.0),
    "yemen": (5.0, 6.0, 2.0),
    "oman": (5.0, 6.0, 1.0),
    "kuwait": (30.0, 25.0, 1.0),
    "bolivia": (10.0, 14.0, 25.0),
    "ecuador": (10.0, 12.0, 15.0),
    "paraguay": (8.0, 10.0, 15.0),
    "uruguay": (15.0, 16.0, 20.0),
    "panama": (12.0, 14.0, 10.0),
    "costa_rica": (10.0, 12.0, 8.0),
    "guatemala": (8.0, 10.0, 5.0),
    "honduras": (8.0, 10.0, 10.0),
    "el_salvador": (8.0, 10.0, 5.0),
    "nicaragua": (8.0, 10.0, 10.0),
    "haiti": (6.0, 8.0, 15.0),
    "dominican_republic": (8.0, 10.0, 20.0),
    "jamaica": (12.0, 14.0, 10.0),
    "malta": (20.0, 22.0, 15.0),
    "french_morocco": (10.0, 12.0, 5.0),
    "slovakia": (18.0, 22.0, 10.0),
    "liberia": (8.0, 10.0, 5.0),
}

# 1900 data (imperialism era) -- Broadberry, Harrison, ICPSR 38308
FISCAL_1900 = {
    "british_empire_home": (14.0, 15.0, 30.0),
    "france_third_republic": (12.0, 12.0, 95.0),
    "german_empire": (10.0, 10.0, 2.0),
    "russian_empire": (12.0, 14.0, 45.0),
    "austro_hungarian_empire": (12.0, 14.0, 35.0),
    "italy_kingdom": (12.0, 14.0, 110.0),
    "usa": (7.0, 7.0, 10.0),
    "japan": (12.0, 14.0, 25.0),  # Meiji
    "ottoman_empire": (10.0, 14.0, 100.0),
    "qing_empire": (5.0, 7.0, 12.0),
    "british_india": (4.0, 5.0, 8.0),
    "spain": (10.0, 12.0, 80.0),
    "portugal": (10.0, 12.0, 75.0),
    "netherlands": (8.0, 8.0, 40.0),
    "belgium": (10.0, 10.0, 50.0),
    "sweden_norway": (8.0, 8.0, 15.0),
    "denmark": (8.0, 8.0, 10.0),
    "switzerland": (5.0, 5.0, 5.0),
    "brazil": (8.0, 10.0, 30.0),
    "argentina": (10.0, 12.0, 40.0),
    "mexico": (7.0, 8.0, 20.0),
    "canada": (10.0, 10.0, 15.0),
    "australia": (10.0, 10.0, 30.0),
    "new_zealand": (12.0, 12.0, 50.0),
    "south_africa": (8.0, 10.0, 15.0),  # Cape colony
    "cape_colony": (8.0, 10.0, 15.0),
    "chile": (10.0, 10.0, 20.0),
    "peru": (8.0, 10.0, 30.0),
    "colombia": (6.0, 8.0, 25.0),
    "egypt": (10.0, 12.0, 70.0),  # Khedivate
    "khedivate_egypt": (10.0, 12.0, 70.0),
    "iranian": (5.0, 6.0, 10.0),
    "qajar_iran": (5.0, 6.0, 10.0),
    "joseon": (5.0, 6.0, 5.0),
    "joseon_korean_empire": (5.0, 6.0, 5.0),
    "korean_empire": (5.0, 6.0, 5.0),
    "ethiopian_empire": (4.0, 5.0, 2.0),
    "siam": (8.0, 10.0, 5.0),
    "hyderabad": (5.0, 6.0, 3.0),
    "greece": (10.0, 14.0, 100.0),
    "bulgaria": (10.0, 12.0, 15.0),
    "romania": (10.0, 12.0, 30.0),
    "serbia": (8.0, 10.0, 15.0),
    "montenegro": (8.0, 10.0, 10.0),
    "norway": (8.0, 8.0, 10.0),
    "finland": (8.0, 8.0, 5.0),
    "iceland": (6.0, 7.0, 3.0),
    "luxembourg": (6.0, 6.0, 3.0),
    "cuba_us_occupation": (8.0, 10.0, 10.0),
    "venezuela": (6.0, 8.0, 15.0),
    "ecuador": (5.0, 7.0, 30.0),
    "uruguay": (8.0, 10.0, 20.0),
    "bolivia": (6.0, 8.0, 15.0),
    "paraguay": (5.0, 6.0, 10.0),
    "liberia": (4.0, 5.0, 10.0),
    "morocco": (5.0, 6.0, 15.0),
    "meiji_japan": (12.0, 14.0, 25.0),
    "afghanistan": (3.0, 4.0, 2.0),
    "mysore": (5.0, 6.0, 3.0),
    "bukharan_emirate": (8.0, 10.0, 5.0),
    "khiva_khanate": (6.0, 8.0, 3.0),
    "saudi_emirate": (3.0, 4.0, 1.0),
    "al_rashid_jabal_shammar": (3.0, 4.0, 1.0),
    "mutawakkil_yemen": (4.0, 5.0, 2.0),
    "emirate_of_kuwait": (5.0, 4.0, 1.0),
    "congo_free_state": (8.0, 10.0, 20.0),
    "french_indochina": (8.0, 10.0, 5.0),
    "dutch_east_indies": (8.0, 10.0, 10.0),
    "guatemala": (5.0, 7.0, 10.0),
    "haiti": (4.0, 6.0, 30.0),
    "bosna": (8.0, 10.0, 5.0),
    "bosnia": (8.0, 10.0, 5.0),
    "albania": (3.0, 5.0, 2.0),
    "malta": (8.0, 10.0, 5.0),
    "sokoto_caliphate": (4.0, 5.0, 1.0),
    "ashanti_confederacy": (4.0, 5.0, 1.0),
    "brunei": (5.0, 4.0, 1.0),
    "johor": (6.0, 7.0, 3.0),
    "tunisia": (8.0, 10.0, 35.0),
}

# 1840 data (industrial revolution) -- Broadberry, Andersson
FISCAL_1840 = {
    "united_kingdom": (12.0, 11.0, 180.0),
    "france_july_monarchy": (10.0, 10.0, 40.0),
    "prussia": (8.0, 8.0, 10.0),
    "austrian_empire": (8.0, 10.0, 25.0),
    "russian_empire": (8.0, 10.0, 30.0),
    "ottoman_empire": (8.0, 12.0, 30.0),
    "us": (3.0, 3.0, 2.0),
    "qing_empire": (4.0, 5.0, 3.0),
    "tokugawa_japan": (8.0, 8.0, 5.0),
    "brazil_empire": (6.0, 8.0, 20.0),
    "spain": (8.0, 10.0, 60.0),
    "portugal": (8.0, 10.0, 50.0),
    "netherlands": (8.0, 8.0, 120.0),
    "belgium": (8.0, 8.0, 20.0),
    "sweden_norway": (6.0, 7.0, 15.0),
    "denmark": (6.0, 7.0, 10.0),
    "switzerland": (4.0, 4.0, 3.0),
    "joseon": (5.0, 5.0, 2.0),
    "siam": (6.0, 7.0, 2.0),
    "egypt_khedival": (8.0, 12.0, 15.0),
    "qajar_iran": (5.0, 6.0, 3.0),
    "british_india_company": (5.0, 6.0, 10.0),
    "papal_states": (6.0, 8.0, 20.0),
    "kingdom_two_sicilies": (6.0, 8.0, 25.0),
    "sardinia_piedmont": (7.0, 8.0, 15.0),
    "mexico": (5.0, 8.0, 25.0),
    "chile": (6.0, 7.0, 10.0),
    "argentine_confederation": (4.0, 6.0, 15.0),
    "peru": (6.0, 8.0, 20.0),
    "new_granada": (5.0, 7.0, 15.0),
    "bolivia": (5.0, 7.0, 10.0),
    "ecuador": (4.0, 6.0, 10.0),
    "uruguay": (5.0, 7.0, 10.0),
    "haiti": (4.0, 6.0, 25.0),
    "central_american_republic": (4.0, 6.0, 8.0),
    "morocco": (4.0, 5.0, 3.0),
    "ethiopia": (3.0, 4.0, 1.0),
    "sikh_empire": (6.0, 8.0, 2.0),
    "hyderabad": (5.0, 6.0, 3.0),
    "mysore": (5.0, 6.0, 2.0),
    "awadh": (5.0, 7.0, 5.0),
    "afghanistan": (3.0, 4.0, 1.0),
    "nepal": (4.0, 5.0, 1.0),
    "konbaung_burma": (4.0, 5.0, 2.0),
    "nguyen_vietnam": (5.0, 6.0, 2.0),
    "saudi_second_state": (3.0, 4.0, 1.0),
    "oman": (4.0, 5.0, 2.0),
    "kazakh_horde": (3.0, 4.0, 1.0),
    "cape_colony": (6.0, 7.0, 5.0),
    "canada": (6.0, 7.0, 10.0),
    "greece": (6.0, 8.0, 20.0),
    "serbia": (5.0, 6.0, 5.0),
    "liberia": (4.0, 5.0, 3.0),
    "sokoto": (4.0, 5.0, 1.0),
    "paraguay": (4.0, 5.0, 3.0),
    "venezuela": (5.0, 7.0, 12.0),
    "dominican_republic": (4.0, 6.0, 8.0),
    "dutch_east_indies": (6.0, 8.0, 5.0),
    "brunei": (3.0, 3.0, 1.0),
    "khmer": (3.0, 4.0, 1.0),
    "lao_luang_prabang": (3.0, 4.0, 1.0),
    "bavaria": (6.0, 7.0, 10.0),
    "saxony": (6.0, 7.0, 8.0),
    "hanover": (6.0, 7.0, 8.0),
    "wuerttemberg": (6.0, 7.0, 8.0),
    "baden": (6.0, 7.0, 6.0),
    "hawaii": (5.0, 6.0, 2.0),
    "tunis": (6.0, 8.0, 15.0),
    "australia_colonies": (6.0, 7.0, 20.0),
    "new_zealand": (5.0, 6.0, 10.0),
}

# Pre-1800 default fiscal ratios by era
# (rev_pct_gdp, exp_pct_gdp, debt_pct_gdp)
ERA_DEFAULTS = {
    "era-bronze-age":         (4.0, 4.5, 0.0),
    "era-iron-age":           (5.0, 5.5, 0.0),
    "era-axial-age":          (6.0, 6.5, 0.0),
    "era-hellenistic":        (8.0, 9.0, 0.0),
    "era-qin-rome":           (8.0, 9.0, 0.0),
    "era-han-rome-peak":      (8.0, 9.0, 2.0),
    "era-three-kingdoms":     (7.0, 8.0, 2.0),
    "era-fall-of-rome":       (6.0, 7.0, 1.0),
    "era-tang-golden-age":    (8.0, 9.0, 2.0),
    "era-crusades":           (8.0, 9.0, 3.0),
    "era-mongol-empire":      (7.0, 8.0, 2.0),
    "era-renaissance":        (8.0, 10.0, 5.0),
    "era-early-modern":       (9.0, 11.0, 8.0),
    "era-enlightenment":      (10.0, 12.0, 15.0),
    "era-industrial-revolution": (8.0, 10.0, 20.0),
    "era-imperialism":        (8.0, 10.0, 15.0),
    "era-world-war-era":      (15.0, 20.0, 25.0),
    "era-cold-war":           (20.0, 22.0, 15.0),
    "era-modern-era":         (20.0, 24.0, 40.0),
    "era-ai-age":             (20.0, 24.0, 45.0),
}

# Major civilisations with known higher fiscal extraction for pre-modern eras
PRE_MODERN_OVERRIDES = {
    "era-han-rome-peak": {
        "roman_empire": (12.0, 13.0, 3.0),
        "han_dynasty": (10.0, 11.0, 1.0),
        "kushan_empire": (8.0, 9.0, 1.0),
        "parthian_empire": (7.0, 8.0, 1.0),
    },
    "era-three-kingdoms": {
        "cao_wei": (10.0, 12.0, 2.0),
        "roman_empire": (12.0, 14.0, 5.0),
        "sasanian_empire": (9.0, 10.0, 1.0),
        "sun_wu": (9.0, 11.0, 2.0),
        "shu_han": (10.0, 12.0, 3.0),
        "kushan_empire": (7.0, 8.0, 1.0),
        "aksum": (6.0, 7.0, 1.0),
    },
    "era-fall-of-rome": {
        "byzantine_empire": (10.0, 12.0, 3.0),
        "sasanian_empire": (9.0, 10.0, 2.0),
        "gupta_empire": (8.0, 9.0, 1.0),
        "liu_song": (8.0, 9.0, 2.0),
        "northern_wei": (8.0, 10.0, 2.0),
    },
    "era-tang-golden-age": {
        "tang_dynasty": (12.0, 13.0, 2.0),
        "abbasid_caliphate": (12.0, 14.0, 3.0),
        "byzantine_empire": (10.0, 12.0, 3.0),
        "frankish_empire": (5.0, 6.0, 0.0),
        "umayyad_cordoba": (10.0, 11.0, 1.0),
        "pala_empire": (7.0, 8.0, 1.0),
        "rashtrakuta": (7.0, 8.0, 1.0),
        "tibetan_empire": (6.0, 7.0, 1.0),
        "khazar_khaganate": (6.0, 7.0, 0.0),
    },
    "era-crusades": {
        "song_dynasty": (15.0, 16.0, 5.0),
        "jin_dynasty": (10.0, 12.0, 3.0),
        "ayyubid": (10.0, 12.0, 2.0),
        "almohad": (8.0, 9.0, 2.0),
        "byzantine_empire": (10.0, 12.0, 5.0),
        "delhi_sultanate": (10.0, 12.0, 2.0),
        "holy_roman_empire": (5.0, 6.0, 2.0),
        "kingdom_of_france": (6.0, 7.0, 3.0),
        "kingdom_of_england": (8.0, 10.0, 5.0),
        "latin_empire": (6.0, 8.0, 5.0),
        "khmer_empire": (8.0, 9.0, 1.0),
        "western_xia": (8.0, 9.0, 2.0),
    },
    "era-mongol-empire": {
        "yuan_dynasty": (12.0, 14.0, 3.0),
        "golden_horde": (8.0, 10.0, 1.0),
        "ilkhanate": (10.0, 12.0, 2.0),
        "chagatai": (7.0, 9.0, 1.0),
        "delhi_sultanate": (10.0, 12.0, 2.0),
        "mamluk_sultanate": (12.0, 14.0, 3.0),
        "kingdom_of_france": (8.0, 9.0, 5.0),
        "kingdom_of_england": (8.0, 10.0, 8.0),
        "holy_roman_empire": (5.0, 6.0, 2.0),
        "byzantine_empire": (8.0, 10.0, 8.0),
    },
    "era-renaissance": {
        "ming_china": (8.0, 9.0, 2.0),
        "ottoman_empire": (12.0, 14.0, 5.0),
        "france": (8.0, 10.0, 10.0),
        "england": (8.0, 10.0, 5.0),
        "spain": (10.0, 14.0, 15.0),
        "venice": (12.0, 14.0, 8.0),
        "florence": (10.0, 12.0, 5.0),
        "papal_states": (10.0, 12.0, 8.0),
        "portugal": (10.0, 12.0, 10.0),
        "hungary": (6.0, 8.0, 3.0),
        "holy_roman_empire": (5.0, 6.0, 3.0),
        "poland_lithuania": (5.0, 6.0, 2.0),
        "moscow_grand_principality": (6.0, 8.0, 1.0),
        "mamluk_sultanate": (10.0, 12.0, 3.0),
        "vijayanagara": (10.0, 12.0, 2.0),
        "delhi_sultanate": (10.0, 12.0, 3.0),
        "songhai": (6.0, 7.0, 1.0),
        "aztec_empire": (8.0, 9.0, 0.0),
        "inca_empire": (10.0, 11.0, 0.0),
    },
    "era-early-modern": {
        "qing_dynasty": (6.0, 7.0, 2.0),
        "mughal_empire": (12.0, 14.0, 3.0),
        "ottoman_empire": (12.0, 15.0, 10.0),
        "safavid_iran": (10.0, 12.0, 3.0),
        "kingdom_france": (10.0, 14.0, 30.0),
        "spanish_monarchy": (12.0, 18.0, 50.0),
        "dutch_republic": (15.0, 16.0, 60.0),
        "english_commonwealth": (10.0, 12.0, 15.0),
        "habsburg_monarchy": (8.0, 12.0, 15.0),
        "tsardom_russia": (6.0, 8.0, 3.0),
        "swedish_empire": (10.0, 14.0, 10.0),
        "polish_lithuanian_commonwealth": (5.0, 7.0, 3.0),
        "tokugawa_shogunate": (10.0, 10.0, 5.0),
        "joseon_korea": (6.0, 7.0, 2.0),
        "venice_republic": (12.0, 14.0, 15.0),
        "portugal_restoration": (8.0, 12.0, 20.0),
        "new_spain": (8.0, 10.0, 5.0),
        "viceroyalty_peru": (8.0, 10.0, 5.0),
        "portuguese_brazil": (6.0, 8.0, 3.0),
        "denmark_norway": (8.0, 10.0, 8.0),
    },
    "era-enlightenment": {
        "qing_dynasty": (6.0, 7.0, 2.0),
        "mughal_empire": (10.0, 13.0, 5.0),
        "ottoman_empire": (10.0, 14.0, 20.0),
        "kingdom_of_france": (12.0, 16.0, 60.0),
        "kingdom_of_great_britain": (12.0, 14.0, 100.0),
        "kingdom_of_spain": (10.0, 13.0, 30.0),
        "habsburg_monarchy": (10.0, 14.0, 25.0),
        "russian_empire": (8.0, 10.0, 10.0),
        "dutch_republic": (12.0, 14.0, 180.0),
        "prussia": (12.0, 14.0, 10.0),
        "portuguese_kingdom": (8.0, 10.0, 30.0),
        "sweden_age_of_liberty": (10.0, 12.0, 20.0),
        "denmark_norway": (10.0, 12.0, 15.0),
        "polish_lithuanian_commonwealth": (4.0, 5.0, 3.0),
        "tokugawa_shogunate": (10.0, 10.0, 5.0),
        "joseon_korea": (6.0, 7.0, 2.0),
        "viceroyalty_new_spain": (8.0, 10.0, 5.0),
        "viceroyalty_peru": (8.0, 10.0, 5.0),
        "portuguese_brazil": (6.0, 8.0, 3.0),
        "venice": (10.0, 12.0, 20.0),
        "papal_states": (8.0, 10.0, 15.0),
        "kingdom_of_naples_sicily": (6.0, 8.0, 15.0),
        "sardinia_piedmont": (7.0, 9.0, 10.0),
        "durrani_empire": (6.0, 8.0, 1.0),
        "maratha_confederacy": (8.0, 10.0, 3.0),
        "afsharid_iran": (8.0, 10.0, 2.0),
        "ethiopian_empire": (4.0, 5.0, 1.0),
        "ayutthaya_kingdom": (8.0, 10.0, 2.0),
        "konbaung_dynasty": (6.0, 8.0, 1.0),
    },
}

# ============================================================================
# REVENUE & EXPENDITURE BREAKDOWN TEMPLATES BY ERA
# ============================================================================

def get_revenue_breakdown_template(era_name, year):
    if year >= 2000:
        return [
            ({"zh": "所得税与个人税", "en": "Income and personal taxes"}, 35),
            ({"zh": "增值税与消费税", "en": "VAT and consumption taxes"}, 25),
            ({"zh": "企业税", "en": "Corporate taxes"}, 12),
            ({"zh": "社会保障缴款", "en": "Social security contributions"}, 18),
            ({"zh": "其他收入", "en": "Other revenue"}, 10),
        ]
    elif year >= 1945:
        return [
            ({"zh": "所得税", "en": "Income taxes"}, 30),
            ({"zh": "间接税与消费税", "en": "Indirect and consumption taxes"}, 25),
            ({"zh": "企业税", "en": "Corporate taxes"}, 15),
            ({"zh": "社会保障", "en": "Social security"}, 15),
            ({"zh": "关税与其他", "en": "Customs and other"}, 15),
        ]
    elif year >= 1800:
        return [
            ({"zh": "关税与贸易税", "en": "Customs and trade taxes"}, 30),
            ({"zh": "土地税与财产税", "en": "Land and property taxes"}, 25),
            ({"zh": "消费税与执照费", "en": "Excise taxes and licenses"}, 20),
            ({"zh": "直接税", "en": "Direct taxes"}, 15),
            ({"zh": "国有资产与杂项", "en": "State assets and miscellaneous"}, 10),
        ]
    elif year >= 1500:
        return [
            ({"zh": "田赋与土地税", "en": "Land tax and tribute"}, 35),
            ({"zh": "关税与商税", "en": "Customs and commercial taxes"}, 20),
            ({"zh": "专卖与官营收入", "en": "Monopolies and state enterprises"}, 15),
            ({"zh": "贡纳与附庸收入", "en": "Tribute and vassal income"}, 15),
            ({"zh": "矿产与杂项", "en": "Mining and miscellaneous"}, 15),
        ]
    elif year >= 500:
        return [
            ({"zh": "田赋与实物税", "en": "Land tax and in-kind levies"}, 40),
            ({"zh": "商税与市场税", "en": "Market and trade taxes"}, 15),
            ({"zh": "盐铁专卖", "en": "Salt and iron monopolies"}, 15),
            ({"zh": "贡纳与附庸", "en": "Tribute and vassalage"}, 15),
            ({"zh": "劳役与矿冶", "en": "Corvée labour and mining"}, 15),
        ]
    elif year >= -500:
        return [
            ({"zh": "田赋与贡纳", "en": "Land tax and tribute"}, 45),
            ({"zh": "劳役征发", "en": "Corvée labor"}, 20),
            ({"zh": "贸易与关税", "en": "Trade and customs"}, 15),
            ({"zh": "矿冶与官营", "en": "Mining and state workshops"}, 10),
            ({"zh": "战利品与杂项", "en": "War spoils and miscellaneous"}, 10),
        ]
    else:
        return [
            ({"zh": "贡纳与实物缴纳", "en": "Tribute and in-kind payments"}, 45),
            ({"zh": "劳役与徭役", "en": "Corvée and labor dues"}, 25),
            ({"zh": "战利品与掠夺", "en": "War spoils and plunder"}, 15),
            ({"zh": "外交交换与礼品", "en": "Diplomatic exchange and gifts"}, 15),
        ]

def get_expenditure_breakdown_template(era_name, year):
    if year >= 2000:
        return [
            ({"zh": "社会保障与医疗", "en": "Social security and healthcare"}, 40),
            ({"zh": "教育", "en": "Education"}, 14),
            ({"zh": "国防", "en": "Defense"}, 10),
            ({"zh": "基础设施", "en": "Infrastructure"}, 10),
            ({"zh": "行政与公共服务", "en": "Administration and public services"}, 12),
            ({"zh": "债务利息", "en": "Debt interest"}, 8),
            ({"zh": "其他", "en": "Other"}, 6),
        ]
    elif year >= 1945:
        return [
            ({"zh": "社会保障与福利", "en": "Social security and welfare"}, 30),
            ({"zh": "国防", "en": "Defense"}, 20),
            ({"zh": "教育", "en": "Education"}, 12),
            ({"zh": "基础设施与交通", "en": "Infrastructure and transport"}, 12),
            ({"zh": "行政", "en": "Administration"}, 10),
            ({"zh": "债务偿还", "en": "Debt service"}, 10),
            ({"zh": "其他", "en": "Other"}, 6),
        ]
    elif year >= 1800:
        return [
            ({"zh": "军费与国防", "en": "Military and defense"}, 35),
            ({"zh": "行政与官僚", "en": "Administration and bureaucracy"}, 20),
            ({"zh": "债务偿还", "en": "Debt service"}, 15),
            ({"zh": "基础设施与公共工程", "en": "Infrastructure and public works"}, 12),
            ({"zh": "皇室与宫廷", "en": "Royal court and household"}, 8),
            ({"zh": "教育与社会", "en": "Education and social"}, 10),
        ]
    elif year >= 1500:
        return [
            ({"zh": "军费与边防", "en": "Military and frontier defense"}, 45),
            ({"zh": "官员俸禄与行政", "en": "Official salaries and administration"}, 20),
            ({"zh": "宫廷与礼仪", "en": "Court and ceremonies"}, 12),
            ({"zh": "公共工程与水利", "en": "Public works and irrigation"}, 13),
            ({"zh": "赈济与杂项", "en": "Relief and miscellaneous"}, 10),
        ]
    elif year >= 500:
        return [
            ({"zh": "军费与边防", "en": "Military and frontier defense"}, 50),
            ({"zh": "官员俸禄", "en": "Official salaries"}, 18),
            ({"zh": "宫廷与祭祀", "en": "Court and rituals"}, 12),
            ({"zh": "仓储与水利", "en": "Granaries and irrigation"}, 10),
            ({"zh": "赈济与特别支出", "en": "Relief and extraordinary expenses"}, 10),
        ]
    elif year >= -500:
        return [
            ({"zh": "防务与军事动员", "en": "Defense and military mobilization"}, 50),
            ({"zh": "官僚与行政", "en": "Bureaucracy and administration"}, 15),
            ({"zh": "祭祀与礼仪", "en": "Rituals and ceremonies"}, 15),
            ({"zh": "公共工程", "en": "Public works"}, 10),
            ({"zh": "宫廷与赈济", "en": "Court and relief"}, 10),
        ]
    else:
        return [
            ({"zh": "防务与动员", "en": "Defense and mobilization"}, 45),
            ({"zh": "祭祀与盟会", "en": "Rituals and assemblies"}, 20),
            ({"zh": "首领再分配", "en": "Chiefly redistribution"}, 20),
            ({"zh": "仓储与工匠", "en": "Storage and artisan support"}, 15),
        ]

# ============================================================================
# FISCAL POLICY & TREASURY DESCRIPTION TEMPLATES
# ============================================================================

def get_fiscal_policy_text(year, surplus_pct):
    if year >= 2000:
        if surplus_pct > 0:
            return {"zh": "财政政策总体稳健，政府维持预算盈余，注重债务可持续性与社会支出平衡。",
                    "en": "Fiscal policy is generally prudent, maintaining budget surpluses while balancing debt sustainability with social expenditure."}
        else:
            return {"zh": "财政政策呈扩张性倾向，政府赤字持续，依赖国际市场融资和央行协调来维持支出水平。",
                    "en": "Fiscal policy is expansionary, with persistent government deficits financed through international markets and central bank coordination."}
    elif year >= 1800:
        if surplus_pct > 0:
            return {"zh": "财政以审慎管理为主，注重金本位约束下的收支平衡，偿债义务优先。",
                    "en": "Fiscal management is prudent under gold standard discipline, prioritizing debt service and budget balance."}
        else:
            return {"zh": "财政支出受战争与帝国扩张驱动，赤字依靠国债与殖民收入弥补。",
                    "en": "Fiscal spending is driven by warfare and imperial expansion, with deficits covered by sovereign bonds and colonial revenue."}
    elif year >= 1000:
        return {"zh": "财政收支以维持军备与官僚体系为核心，田赋为主要收入来源，战争和宫廷开支常超出常规收入。",
                "en": "Fiscal policy centered on maintaining military and bureaucratic systems, with land tax as the primary revenue source; war and court expenses frequently exceeded regular income."}
    elif year >= 0:
        return {"zh": "财政体系以实物税收和贡纳为基础，军事支出占据主导地位，国库储备以谷物、金属和织物为主。",
                "en": "The fiscal system was based on in-kind taxation and tribute, military spending dominated, with treasury reserves held in grain, metals, and textiles."}
    else:
        return {"zh": "财政以贡纳和劳役为核心，收支记录有限，首领通过再分配维持权威和社会秩序。",
                "en": "Fiscal practice centered on tribute and corvée labor, with limited accounting; chiefs maintained authority through redistribution and ritual."}

def get_treasury_description_text(year, treasury_months):
    if year >= 2000:
        return {"zh": f"国库含外汇储备、主权基金和央行持有的黄金，流动储备约相当于{treasury_months:.0f}个月政府开支。",
                "en": f"Treasury includes foreign reserves, sovereign funds, and central bank gold holdings, with liquid reserves covering approximately {treasury_months:.0f} months of government expenditure."}
    elif year >= 1800:
        return {"zh": f"国库以金银储备和政府债券资产为主，可支持约{treasury_months:.0f}个月政府运营。",
                "en": f"Treasury consisted primarily of gold and silver reserves plus government bond assets, sufficient for about {treasury_months:.0f} months of operations."}
    elif year >= 1000:
        return {"zh": f"国库存有现钱、谷物、盐货、布帛及军需储备，约可支撑{treasury_months:.0f}个月常规支出。",
                "en": f"Treasury held cash, grain, salt, textiles, and military supplies, sufficient for approximately {treasury_months:.0f} months of regular expenditure."}
    elif year >= 0:
        return {"zh": f"国库以谷物仓储、金属储备和织物库存为主，储备水平约可维持{treasury_months:.0f}个月开支。",
                "en": f"Treasury was primarily grain granaries, metal reserves, and textile stocks, with reserves sufficient for about {treasury_months:.0f} months of spending."}
    else:
        return {"zh": '所谓"国库"主要表现为首领掌控的粮仓、金属器物和礼品储备。',
                "en": "The 'treasury' chiefly consisted of grain stores, metal objects, and prestige goods under chiefly control."}

# ============================================================================
# CORE PROCESSING LOGIC
# ============================================================================

def find_fiscal_ratios(region_id, era_name, era_year, fiscal_table, era_overrides=None):
    """Find best-matching fiscal ratios for a region."""
    # Try exact match in the era-specific override table
    if era_overrides:
        for key in era_overrides:
            if key in region_id:
                return era_overrides[key]
    # Try exact match in the fiscal table
    if fiscal_table:
        for key in fiscal_table:
            if key in region_id:
                return fiscal_table[key]
        # Try partial match (remove year suffixes like _1962, _1939 etc)
        base_id = region_id
        for suffix in ["_1962", "_1939", "_1900", "_1840", "_220", "_2000", "_1750",
                        "_1648", "_1500", "_1280", "_1200", "ai_", "modern_",
                        "north_america_", "south_america_", "east_asia_", "south_asia_"]:
            base_id = base_id.replace(suffix, "")
        for key in fiscal_table:
            if key in base_id or base_id in key:
                return fiscal_table[key]
    # Fall back to era defaults
    return ERA_DEFAULTS.get(era_name, (10.0, 12.0, 5.0))


def get_fiscal_table_for_era(era_name, era_year):
    if era_year >= 2020:
        return FISCAL_2023
    elif era_year >= 1990:
        return FISCAL_2000
    elif era_year >= 1950:
        return FISCAL_1962
    elif era_year >= 1930:
        return FISCAL_1939
    elif era_year >= 1870:
        return FISCAL_1900
    elif era_year >= 1800:
        return FISCAL_1840
    return None


def make_monetary(amount, unit_zh, unit_en, gold_kg, silver_kg=None):
    obj = {
        "amount": round(amount),
        "unit": {"zh": unit_zh, "en": unit_en},
        "goldKg": round(gold_kg)
    }
    if silver_kg is not None and silver_kg > 0:
        obj["silverKg"] = round(silver_kg)
    return obj


def build_breakdown(template, total_gold_kg, total_amount, unit_zh, unit_en, is_revenue=True):
    """Build a revenue or expenditure breakdown with goldKg amounts."""
    items = []
    for label, pct in template:
        item_gold_kg = total_gold_kg * pct / 100
        item_amount = total_amount * pct / 100
        entry = {
            ("source" if is_revenue else "category"): label,
            "amount": make_monetary(item_amount, unit_zh, unit_en, item_gold_kg),
            "percentage": pct,
        }
        items.append(entry)
    return items


def get_currency_info(region):
    """Extract currency unit info from the region."""
    econ = region.get("economy", {})
    currency = econ.get("currency", {})
    unit_name = currency.get("unitName", {})
    zh = unit_name.get("zh", "")
    en = unit_name.get("en", "")
    if not zh:
        gdp = econ.get("gdpEstimate", {})
        unit = gdp.get("unit", {})
        zh = unit.get("zh", "金衡单位")
        en = unit.get("en", "gold units")
    return zh, en


def normalise_finances_schema(finances):
    """Fix schema inconsistencies: revenue->annualRevenue, item->source/category etc."""
    changed = False
    # Fix top-level key names
    if "revenue" in finances and "annualRevenue" not in finances:
        finances["annualRevenue"] = finances.pop("revenue")
        changed = True
    if "expenditure" in finances and "annualExpenditure" not in finances:
        finances["annualExpenditure"] = finances.pop("expenditure")
        changed = True

    # Fix breakdown item keys
    for item in finances.get("revenueBreakdown", []):
        if "item" in item and "source" not in item:
            item["source"] = item.pop("item")
            changed = True
    for item in finances.get("expenditureBreakdown", []):
        if "item" in item and "category" not in item:
            item["category"] = item.pop("item")
            changed = True

    return changed


def ensure_gold_kg_on_breakdown(finances, total_gold_kg, total_amount, key):
    """Ensure all breakdown items have goldKg on their amount objects."""
    items = finances.get(key, [])
    if not items:
        return False
    changed = False
    for item in items:
        if not isinstance(item, dict):
            continue
        amt = item.get("amount")
        if amt is None:
            if "percentage" in item and total_gold_kg > 0:
                pct = item["percentage"]
                unit = finances.get("annualRevenue" if "Revenue" in key else "annualExpenditure", {}).get("unit", {"zh": "", "en": ""})
                item["amount"] = make_monetary(
                    total_amount * pct / 100, unit.get("zh", ""), unit.get("en", ""),
                    total_gold_kg * pct / 100
                )
                changed = True
        elif isinstance(amt, dict) and "goldKg" not in amt and total_gold_kg > 0:
            pct = item.get("percentage", 0)
            if pct > 0:
                amt["goldKg"] = round(total_gold_kg * pct / 100)
                changed = True
        elif isinstance(amt, str):
            # Some amount fields are strings; skip
            pass
    return changed


def process_region(region, era_name, era_year):
    """Process a single region: fill/fix all fiscal data. Returns change count."""
    changes = 0
    region_id = region["id"]

    gdp_estimate = region.get("economy", {}).get("gdpEstimate", {})
    gdp_gold_kg = gdp_estimate.get("goldKg", 0)
    if gdp_gold_kg is None or gdp_gold_kg <= 1:
        # Try to compute goldKg from amount if it's a USD-based modern era
        gdp_amount = gdp_estimate.get("amount", 0) or 0
        if gdp_amount > 100 and era_year >= 1800:
            gdp_gold_kg = usd_to_gold_kg(gdp_amount, era_year)
        else:
            gdp_gold_kg = 0

    # Determine currency unit from region
    unit_zh, unit_en = get_currency_info(region)

    # GDP in local currency
    gdp_amount = gdp_estimate.get("amount", 0) or 0

    # Get fiscal ratios
    fiscal_table = get_fiscal_table_for_era(era_name, era_year)
    era_overrides = PRE_MODERN_OVERRIDES.get(era_name)
    rev_pct, exp_pct, debt_pct = find_fiscal_ratios(
        region_id, era_name, era_year, fiscal_table, era_overrides
    )

    # Ensure finances object exists
    if "finances" not in region or not region["finances"]:
        region["finances"] = {}
        changes += 1

    fin = region["finances"]

    # Step 1: Normalise schema
    if normalise_finances_schema(fin):
        changes += 1

    # Step 2: Fill annualRevenue if missing or has goldKg=0
    rev_obj = fin.get("annualRevenue", {})
    rev_gold = rev_obj.get("goldKg") if isinstance(rev_obj, dict) else None
    if (rev_gold is None or rev_gold == 0) and gdp_gold_kg > 0:
        rev_gold_kg = gdp_gold_kg * rev_pct / 100
        rev_amount = gdp_amount * rev_pct / 100 if gdp_amount > 0 else rev_gold_kg
        if isinstance(rev_obj, dict) and rev_obj.get("amount", 0) and rev_obj["amount"] > 0:
            # Keep existing amount, just add goldKg
            rev_obj["goldKg"] = round(rev_gold_kg)
            fin["annualRevenue"] = rev_obj
        else:
            fin["annualRevenue"] = make_monetary(rev_amount, unit_zh, unit_en, rev_gold_kg)
        changes += 1
    elif "annualRevenue" not in fin:
        fin["annualRevenue"] = make_monetary(0, unit_zh, unit_en, 0)
        changes += 1

    # Step 3: Fill annualExpenditure if missing or has goldKg=0
    exp_obj = fin.get("annualExpenditure", {})
    exp_gold = exp_obj.get("goldKg") if isinstance(exp_obj, dict) else None
    if (exp_gold is None or exp_gold == 0) and gdp_gold_kg > 0:
        exp_gold_kg = gdp_gold_kg * exp_pct / 100
        exp_amount = gdp_amount * exp_pct / 100 if gdp_amount > 0 else exp_gold_kg
        if isinstance(exp_obj, dict) and exp_obj.get("amount", 0) and exp_obj["amount"] > 0:
            exp_obj["goldKg"] = round(exp_gold_kg)
            fin["annualExpenditure"] = exp_obj
        else:
            fin["annualExpenditure"] = make_monetary(exp_amount, unit_zh, unit_en, exp_gold_kg)
        changes += 1
    elif "annualExpenditure" not in fin:
        fin["annualExpenditure"] = make_monetary(0, unit_zh, unit_en, 0)
        changes += 1

    # Get final goldKg values
    final_rev_gold = fin.get("annualRevenue", {}).get("goldKg", 0) or 0
    final_exp_gold = fin.get("annualExpenditure", {}).get("goldKg", 0) or 0
    final_rev_amount = fin.get("annualRevenue", {}).get("amount", 0) or 0
    final_exp_amount = fin.get("annualExpenditure", {}).get("amount", 0) or 0

    # Step 4: Fix/fill surplus
    surplus_gold = final_rev_gold - final_exp_gold
    surplus_amount = final_rev_amount - final_exp_amount
    existing_surplus = fin.get("surplus", {})
    if not existing_surplus or existing_surplus.get("goldKg") is None or abs((existing_surplus.get("goldKg", 0) or 0) - surplus_gold) > 1:
        fin["surplus"] = make_monetary(surplus_amount, unit_zh, unit_en, surplus_gold)
        changes += 1

    # Step 5: Fill debtLevel if missing
    if "debtLevel" not in fin or not isinstance(fin.get("debtLevel"), dict) or fin.get("debtLevel", {}).get("goldKg") is None:
        if gdp_gold_kg > 0 and debt_pct > 0:
            debt_gold_kg = gdp_gold_kg * debt_pct / 100
            debt_amount = gdp_amount * debt_pct / 100 if gdp_amount > 0 else debt_gold_kg
            fin["debtLevel"] = make_monetary(debt_amount, unit_zh, unit_en, debt_gold_kg)
            changes += 1

    # Step 6: Fill treasury if missing
    if "treasury" not in fin or not fin.get("treasury") or fin.get("treasury", {}).get("goldKg") is None or fin.get("treasury", {}).get("goldKg", 0) == 0:
        if final_rev_gold > 0:
            # Treasury = 3-6 months of revenue depending on era
            if era_year >= 1800:
                months = 3
            elif era_year >= 500:
                months = 4
            else:
                months = 6
            treasury_gold = final_rev_gold * months / 12
            treasury_amount = final_rev_amount * months / 12 if final_rev_amount > 0 else treasury_gold
            fin["treasury"] = make_monetary(treasury_amount, unit_zh, unit_en, treasury_gold)
            changes += 1

    # Step 7: Fill revenue breakdown if missing
    if not fin.get("revenueBreakdown") and final_rev_gold > 0:
        template = get_revenue_breakdown_template(era_name, era_year)
        fin["revenueBreakdown"] = build_breakdown(
            template, final_rev_gold, final_rev_amount, unit_zh, unit_en, is_revenue=True
        )
        changes += 1
    elif fin.get("revenueBreakdown"):
        if ensure_gold_kg_on_breakdown(fin, final_rev_gold, final_rev_amount, "revenueBreakdown"):
            changes += 1

    # Step 8: Fill expenditure breakdown if missing
    if not fin.get("expenditureBreakdown") and final_exp_gold > 0:
        template = get_expenditure_breakdown_template(era_name, era_year)
        fin["expenditureBreakdown"] = build_breakdown(
            template, final_exp_gold, final_exp_amount, unit_zh, unit_en, is_revenue=False
        )
        changes += 1
    elif fin.get("expenditureBreakdown"):
        if ensure_gold_kg_on_breakdown(fin, final_exp_gold, final_exp_amount, "expenditureBreakdown"):
            changes += 1

    # Step 9: Fill treasuryDescription if missing
    if "treasuryDescription" not in fin or not fin.get("treasuryDescription"):
        treasury_gold = fin.get("treasury", {}).get("goldKg", 0) or 0
        monthly_exp = final_exp_gold / 12 if final_exp_gold > 0 else 1
        months = treasury_gold / monthly_exp if monthly_exp > 0 else 3
        fin["treasuryDescription"] = get_treasury_description_text(era_year, months)
        changes += 1

    # Step 10: Fill fiscalPolicy if missing
    if "fiscalPolicy" not in fin or not fin.get("fiscalPolicy"):
        surplus_pct = (surplus_gold / gdp_gold_kg * 100) if gdp_gold_kg > 0 else 0
        fin["fiscalPolicy"] = get_fiscal_policy_text(era_year, surplus_pct)
        changes += 1

    return changes


def validate_region_finances(region):
    """Validate consistency of a region's finances. Returns list of issues."""
    issues = []
    fin = region.get("finances", {})
    if not fin:
        return issues

    rev_gold = fin.get("annualRevenue", {}).get("goldKg", 0) or 0
    exp_gold = fin.get("annualExpenditure", {}).get("goldKg", 0) or 0
    surplus_gold = fin.get("surplus", {}).get("goldKg", 0) or 0
    expected_surplus = rev_gold - exp_gold

    if abs(surplus_gold - expected_surplus) > max(abs(expected_surplus) * 0.01, 1):
        issues.append(f"surplus mismatch: {surplus_gold} vs expected {expected_surplus}")

    for key, label in [("revenueBreakdown", "revenue"), ("expenditureBreakdown", "expenditure")]:
        items = fin.get(key, [])
        if items:
            pct_sum = sum(item.get("percentage", 0) for item in items if isinstance(item, dict))
            if abs(pct_sum - 100) > 2:
                issues.append(f"{label} breakdown pct sum = {pct_sum}")

    # Check for MonetaryValue objects without goldKg
    for field in ["annualRevenue", "annualExpenditure", "surplus", "treasury"]:
        val = fin.get(field)
        if val and isinstance(val, dict) and "goldKg" not in val:
            issues.append(f"{field} missing goldKg")

    if "debtLevel" in fin:
        dl = fin["debtLevel"]
        if isinstance(dl, dict) and "goldKg" not in dl and "zh" not in dl:
            issues.append("debtLevel is dict without goldKg")
        elif isinstance(dl, str):
            issues.append("debtLevel is string, needs conversion")

    return issues


# ============================================================================
# MAIN
# ============================================================================

def main():
    era_files = sorted(glob.glob(str(SEED_DIR / "era-*.json")))
    total_changes = 0
    total_regions = 0
    total_issues = 0
    era_stats = []

    for filepath in era_files:
        era_name = os.path.basename(filepath).replace(".json", "")
        with open(filepath, "r", encoding="utf-8") as f:
            era_data = json.load(f)

        era_year = era_data.get("timestamp", {}).get("year", 0)
        regions = era_data.get("regions", [])
        era_changes = 0
        era_issues = 0

        for region in regions:
            changes = process_region(region, era_name, era_year)
            era_changes += changes
            total_changes += changes
            total_regions += 1

            issues = validate_region_finances(region)
            if issues:
                era_issues += len(issues)
                total_issues += len(issues)
                if len(issues) > 0:
                    print(f"  WARN {region['id']}: {'; '.join(issues)}")

        era_stats.append((era_name, era_year, len(regions), era_changes, era_issues))

        if WRITE_MODE and era_changes > 0:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(era_data, f, ensure_ascii=False, indent=2)
            print(f"  WROTE {filepath}")

    print("\n" + "=" * 80)
    print(f"{'Era':<35} {'Year':>6} {'Regions':>8} {'Changes':>8} {'Issues':>8}")
    print("-" * 80)
    for name, year, count, changes, issues in era_stats:
        print(f"{name:<35} {year:>6} {count:>8} {changes:>8} {issues:>8}")
    print("-" * 80)
    print(f"{'TOTAL':<35} {'':>6} {total_regions:>8} {total_changes:>8} {total_issues:>8}")
    print(f"\nMode: {'WRITE' if WRITE_MODE else 'DRY-RUN'}")
    if not WRITE_MODE:
        print("Run with --write to apply changes.")


if __name__ == "__main__":
    main()
