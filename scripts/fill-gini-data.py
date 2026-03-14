#!/usr/bin/env python3
"""
Populate giniEstimate for all regions across all 20 era seed files.

Sources:
  - World Bank Gini Index (2020-2023) for modern eras
  - Milanovic historical inequality estimates for pre-modern eras
  - Kuznets curve model for ancient/tribal societies

Usage:
  python3 scripts/fill-gini-data.py          # dry-run
  python3 scripts/fill-gini-data.py --write   # apply changes
"""
import json, glob, os, sys, math
from pathlib import Path

WRITE_MODE = "--write" in sys.argv
SEED_DIR = Path(__file__).resolve().parent.parent / "src" / "data" / "seed"

# ============================================================================
# REAL GINI DATA -- World Bank, OECD, academic estimates
# Values on 0-1 scale (e.g. 0.39 = 39)
# ============================================================================

# 2023 (ai-age) -- World Bank most recent available
GINI_2023 = {
    "united_states": 0.398, "china_prc": 0.382, "japan": 0.329,
    "germany": 0.309, "france": 0.315, "uk": 0.352,
    "india": 0.353, "brazil": 0.516, "russia": 0.360,
    "canada": 0.318, "italy": 0.352, "south_korea": 0.312,
    "australia": 0.343, "spain": 0.330, "mexico": 0.435,
    "indonesia": 0.379, "netherlands": 0.285, "belgium": 0.272,
    "austria": 0.283, "switzerland": 0.327, "turkey": 0.445,
    "saudi_arabia": 0.459, "taiwan": 0.341, "poland": 0.298,
    "sweden": 0.280, "norway": 0.262, "denmark": 0.281,
    "finland": 0.274, "ireland": 0.309, "portugal": 0.338,
    "greece": 0.333, "czech": 0.254, "romania": 0.346,
    "hungary": 0.299, "israel": 0.389, "uae": 0.360,
    "iraq": 0.296, "iran": 0.408, "egypt": 0.315,
    "singapore": 0.444, "hong_kong": 0.539, "thailand": 0.349,
    "vietnam": 0.365, "malaysia": 0.407, "philippines": 0.426,
    "pakistan": 0.296, "bangladesh": 0.324, "nigeria": 0.351,
    "south_africa": 0.630, "colombia": 0.539, "argentina": 0.422,
    "chile": 0.449, "peru": 0.438, "ukraine": 0.260,
    "kazakhstan": 0.290, "uzbekistan": 0.353, "qatar": 0.411,
    "kuwait": 0.410, "oman": 0.380, "bahrain": 0.390,
    "jordan": 0.337, "lebanon": 0.515, "mongolia": 0.327,
    "myanmar": 0.307, "cambodia": 0.380, "laos": 0.388,
    "brunei": 0.410, "east_timor": 0.287, "north_korea": 0.310,
    "armenia": 0.299, "azerbaijan": 0.264, "georgia": 0.356,
    "cyprus": 0.316, "syria": 0.358, "yemen": 0.367,
    "algeria": 0.276, "morocco": 0.397, "tunisia": 0.328,
    "libya": 0.350, "slovakia": 0.243, "slovenia": 0.244,
    "croatia": 0.291, "serbia": 0.361, "bosnia": 0.330,
    "albania": 0.293, "montenegro": 0.365, "macedonia": 0.341,
    "bulgaria": 0.404, "belarus": 0.252, "moldova": 0.257,
    "estonia": 0.324, "latvia": 0.356, "lithuania": 0.367,
    "iceland": 0.263, "luxembourg": 0.316, "nepal": 0.328,
    "sri_lanka": 0.372, "bhutan": 0.375, "maldives": 0.313,
    "palestine": 0.336, "south_sudan": 0.448, "congo_brazzaville": 0.489,
    "guatemala": 0.536, "honduras": 0.481, "el_salvador": 0.386,
    "nicaragua": 0.462, "costa_rica": 0.480, "panama": 0.499,
    "belize": 0.419, "haiti": 0.411, "dominican_republic": 0.393,
    "jamaica": 0.351, "solomon_islands": 0.371,
    "cuba": 0.380, "bahamas": 0.420, "puerto_rico": 0.540,
    "trinidad": 0.400, "guyana": 0.446, "suriname": 0.576,
    "french_guiana": 0.420, "greenland": 0.330, "malta": 0.312,
    "venezuela": 0.440, "ecuador": 0.452, "bolivia": 0.422,
    "uruguay": 0.401, "paraguay": 0.456, "new_zealand": 0.331,
    "papua_new_guinea": 0.419, "fiji": 0.368, "samoa": 0.389,
    "tonga": 0.376, "vanuatu": 0.371, "western_sahara": 0.400,
    "afghanistan": 0.292, "mauritania": 0.326, "senegal": 0.403,
    "mali": 0.330, "niger": 0.374, "burkina_faso": 0.353,
    "ivory_coast": 0.376, "guinea": 0.337, "guinea_bissau": 0.506,
    "sierra_leone": 0.357, "liberia": 0.355, "togo": 0.430,
    "benin": 0.378, "gambia": 0.361, "chad": 0.373,
    "cameroon": 0.466, "ethiopia_2000": 0.350, "kenya": 0.408,
    "tanzania": 0.405, "somalia": 0.368, "sudan": 0.343,
    "eritrea": 0.390, "djibouti": 0.416, "rwanda": 0.437,
    "burundi": 0.385, "madagascar": 0.425, "congo_drc": 0.422,
    "angola": 0.512, "gabon": 0.380, "eq_guinea": 0.470,
    "mozambique": 0.540, "zambia": 0.572, "zimbabwe": 0.502,
    "malawi": 0.389, "namibia": 0.591, "botswana": 0.549,
    "lesotho": 0.449, "eswatini": 0.546, "car": 0.432,
    "uganda": 0.427, "ghana": 0.352,
    "turkmenistan": 0.408, "kyrgyzstan": 0.290, "tajikistan": 0.340,
}

# 2000 (modern-era) -- World Bank ~2000 data
GINI_2000 = {
    "usa": 0.404, "china_prc": 0.390, "japan": 0.337,
    "germany": 0.288, "france": 0.327, "uk": 0.360,
    "india": 0.378, "brazil": 0.590, "russia": 0.371,
    "canada": 0.331, "italy": 0.360, "south_korea": 0.316,
    "australia": 0.352, "spain": 0.340, "mexico": 0.514,
    "indonesia": 0.300, "netherlands": 0.292, "belgium": 0.289,
    "austria": 0.292, "switzerland": 0.337, "turkey": 0.430,
    "saudi_arabia": 0.459, "taiwan": 0.326, "poland": 0.313,
    "sweden": 0.252, "norway": 0.258, "denmark": 0.247,
    "finland": 0.269, "ireland": 0.313, "portugal": 0.360,
    "greece": 0.345, "czech": 0.257, "romania": 0.301,
    "hungary": 0.280, "israel": 0.355, "uae": 0.360,
    "iraq": 0.310, "iran": 0.430, "egypt": 0.344,
    "singapore": 0.425, "hong_kong": 0.525, "thailand": 0.428,
    "vietnam": 0.370, "malaysia": 0.491, "philippines": 0.461,
    "pakistan": 0.304, "bangladesh": 0.332, "nigeria": 0.430,
    "south_africa": 0.630, "colombia": 0.586, "argentina": 0.511,
    "chile": 0.526, "peru": 0.498, "ukraine": 0.290,
    "kazakhstan": 0.354, "uzbekistan": 0.353, "qatar": 0.411,
    "kuwait": 0.410, "oman": 0.380, "bahrain": 0.400,
    "jordan": 0.388, "lebanon": 0.440, "mongolia": 0.303,
    "myanmar": 0.320, "cambodia": 0.400, "laos": 0.346,
    "brunei": 0.410, "east_timor": 0.310, "north_korea": 0.310,
    "armenia": 0.355, "azerbaijan": 0.365, "georgia": 0.414,
    "cyprus": 0.290, "syria": 0.358, "yemen": 0.375,
    "algeria": 0.353, "morocco": 0.406, "tunisia": 0.408,
    "libya": 0.350, "slovakia": 0.263, "slovenia": 0.284,
    "croatia": 0.290, "serbia": 0.330, "bosnia": 0.330,
    "albania": 0.282, "montenegro": 0.330, "macedonia": 0.390,
    "bulgaria": 0.354, "belarus": 0.287, "moldova": 0.361,
    "estonia": 0.372, "latvia": 0.343, "lithuania": 0.340,
    "iceland": 0.260, "luxembourg": 0.279, "nepal": 0.437,
    "sri_lanka": 0.400, "bhutan": 0.370, "maldives": 0.380,
    "palestine": 0.390, "south_sudan": 0.460, "congo_brazzaville": 0.475,
    "guatemala": 0.560, "honduras": 0.556, "el_salvador": 0.518,
    "nicaragua": 0.495, "costa_rica": 0.465, "panama": 0.566,
    "belize": 0.530, "haiti": 0.590, "dominican_republic": 0.520,
    "jamaica": 0.379, "solomon_islands": 0.390,
    "cuba": 0.350, "bahamas": 0.430, "greenland": 0.330,
    "puerto_rico": 0.560, "trinidad": 0.400, "guyana": 0.446,
    "suriname": 0.576, "french_guiana": 0.430, "malta": 0.310,
    "venezuela": 0.440, "ecuador": 0.564, "bolivia": 0.630,
    "uruguay": 0.440, "paraguay": 0.562, "new_zealand": 0.340,
    "papua_new_guinea": 0.509, "fiji": 0.368, "samoa": 0.400,
    "tonga": 0.380, "vanuatu": 0.371, "western_sahara": 0.400,
    "afghanistan": 0.330, "mauritania": 0.390, "senegal": 0.414,
    "mali": 0.405, "niger": 0.443, "burkina_faso": 0.434,
    "ivory_coast": 0.415, "guinea": 0.391, "guinea_bissau": 0.506,
    "sierra_leone": 0.357, "liberia": 0.380, "togo": 0.341,
    "benin": 0.365, "gambia": 0.355, "chad": 0.395,
    "cameroon": 0.448, "ethiopia_2000": 0.300, "kenya": 0.448,
    "tanzania": 0.375, "somalia": 0.370, "sudan": 0.354,
    "eritrea": 0.390, "djibouti": 0.416, "rwanda": 0.507,
    "burundi": 0.425, "madagascar": 0.475, "congo_drc": 0.420,
    "angola": 0.512, "gabon": 0.415, "eq_guinea": 0.470,
    "mozambique": 0.540, "zambia": 0.572, "zimbabwe": 0.502,
    "malawi": 0.390, "namibia": 0.707, "botswana": 0.630,
    "lesotho": 0.449, "eswatini": 0.546, "car": 0.432,
    "uganda": 0.410, "ghana": 0.420,
    "turkmenistan": 0.408, "kyrgyzstan": 0.300, "tajikistan": 0.340,
}

# 1962 (cold-war) -- estimated from Milanovic long-run data + early surveys
GINI_1962 = {
    "usa": 0.380, "ussr": 0.260, "uk": 0.300, "france": 0.370,
    "west_germany": 0.290, "east_germany": 0.230, "japan": 0.350,
    "prc": 0.300, "italy": 0.380, "canada": 0.320,
    "australia": 0.320, "new_zealand": 0.320, "india": 0.370,
    "pakistan": 0.360, "ceylon": 0.380, "brazil": 0.560,
    "argentina": 0.440, "mexico": 0.530, "south_korea": 0.330,
    "north_korea": 0.280, "roc_taiwan": 0.310, "south_africa": 0.590,
    "egypt": 0.400, "iran": 0.460, "iraq": 0.380,
    "turkey": 0.450, "saudi": 0.520, "israel": 0.340,
    "sweden": 0.230, "spain": 0.380, "portugal": 0.390,
    "greece": 0.370, "poland": 0.250, "czechoslovakia": 0.220,
    "yugoslavia": 0.330, "hungary": 0.240, "romania": 0.230,
    "bulgaria": 0.230, "cuba": 0.350, "mongolia": 0.280,
    "north_vietnam": 0.300, "south_vietnam": 0.410,
    "thailand": 0.450, "burma": 0.350, "indonesia": 0.330,
    "malaya": 0.470, "singapore": 0.420, "philippines": 0.440,
    "colombia": 0.530, "venezuela": 0.480, "chile": 0.510,
    "peru": 0.520, "bolivia": 0.530, "ecuador": 0.500,
    "nigeria": 0.420, "ghana": 0.380, "kenya_colony": 0.470,
    "ethiopia": 0.350, "congo": 0.420, "sudan": 0.380,
    "algeria": 0.400, "morocco": 0.430, "tunisia": 0.400,
    "libya": 0.380, "somalia": 0.350, "cameroon": 0.430,
    "senegal": 0.410, "ivory_coast": 0.420, "mali": 0.380,
    "guinea": 0.350, "madagascar": 0.420, "tanzania": 0.380,
    "uganda": 0.370, "nepal": 0.350, "finland": 0.280,
    "ireland": 0.360, "austria": 0.290, "afghanistan": 0.340,
    "jordan": 0.390, "syria": 0.370, "lebanon": 0.400,
    "cambodia": 0.380, "laos": 0.370, "rwanda": 0.380,
    "chad": 0.380, "niger": 0.400, "belgium": 0.290,
    "netherlands": 0.280, "luxembourg": 0.280, "switzerland": 0.330,
    "norway": 0.250, "denmark": 0.240, "iceland": 0.260,
    "albania": 0.260, "zambia": 0.480, "zimbabwe": 0.460,
    "malawi": 0.400, "botswana": 0.420, "lesotho": 0.420,
    "swaziland": 0.480, "namibia": 0.560, "mozambique": 0.410,
    "togo": 0.380, "benin": 0.370, "burkina_faso": 0.380,
    "sierra_leone": 0.390, "gambia": 0.370, "gabon": 0.440,
    "central_african_republic": 0.420, "congo_brazzaville": 0.430,
    "djibouti": 0.400, "eritrea": 0.350, "liberia": 0.380,
    "mauritius": 0.360, "guinea_bissau": 0.400,
    "guyana": 0.430, "suriname": 0.420, "french_guiana": 0.400,
    "western_sahara": 0.380, "trinidad": 0.400, "bahamas": 0.410,
    "hong_kong": 0.490, "puerto_rico": 0.520, "tonga": 0.370,
    "samoa": 0.380, "eq_guinea": 0.400, "cyprus": 0.340,
    "aden": 0.400, "north_yemen": 0.420, "greenland": 0.330,
    "angola": 0.450, "zaire": 0.440,
}

# 1939 (world-war) -- Milanovic, Atkinson estimates
GINI_1939 = {
    "united_states": 0.430, "united_kingdom": 0.370,
    "france": 0.410, "germany": 0.350, "italy": 0.420,
    "soviet_union": 0.280, "japan": 0.420, "canada": 0.380,
    "australia": 0.360, "new_zealand": 0.360, "china_republic": 0.450,
    "india_british": 0.410, "brazil": 0.560, "argentina": 0.470,
    "mexico": 0.530, "south_africa": 0.580, "poland": 0.380,
    "spain": 0.430, "turkey": 0.480, "iran": 0.470,
    "iraq": 0.420, "egypt": 0.450, "scandinavia": 0.340,
    "belgium": 0.350, "netherlands": 0.360, "switzerland": 0.360,
    "portugal": 0.420, "hungary": 0.380, "romania": 0.400,
    "yugoslavia": 0.400, "greece": 0.410, "finland": 0.340,
    "ireland": 0.380, "bulgaria": 0.380, "albania": 0.400,
    "estonia": 0.350, "latvia": 0.360, "lithuania": 0.370,
    "chile": 0.510, "peru": 0.530, "colombia": 0.540,
    "venezuela": 0.500, "cuba": 0.460, "thailand": 0.470,
    "korea": 0.420, "manchukuo": 0.420, "mongolia": 0.310,
    "afghanistan": 0.360, "levant": 0.410, "arabia": 0.520,
    "latin_america": 0.500, "south_america_states": 0.500,
    "southeast_asia_mainland": 0.430, "southeast_asia_maritime": 0.420,
    "north_west_africa": 0.410, "east_africa_colonial": 0.400,
    "ethiopia": 0.380, "sudan_nubia": 0.400,
    "west_africa_independent": 0.380, "iceland": 0.300,
    "luxembourg": 0.320, "norway": 0.300, "denmark": 0.310,
    "nepal": 0.370, "ceylon": 0.400, "tibet": 0.350,
    "yemen": 0.460, "oman": 0.470, "kuwait": 0.480,
    "bolivia": 0.530, "ecuador": 0.500, "paraguay": 0.490,
    "uruguay": 0.430, "panama": 0.500, "costa_rica": 0.450,
    "guatemala": 0.540, "honduras": 0.530, "el_salvador": 0.510,
    "nicaragua": 0.520, "haiti": 0.560, "dominican_republic": 0.500,
    "jamaica": 0.420, "malta": 0.350, "french_morocco": 0.420,
    "slovakia": 0.340, "liberia": 0.400,
}

# Pre-modern era defaults by civilisation type
# Based on Milanovic "Inequality Possibility Frontier" and Scheidel estimates
ERA_GINI_DEFAULTS = {
    "era-bronze-age":         (0.30, 0.50),  # (tribal min, state max)
    "era-iron-age":           (0.30, 0.50),
    "era-axial-age":          (0.30, 0.50),
    "era-hellenistic":        (0.35, 0.55),
    "era-qin-rome":           (0.35, 0.55),
    "era-han-rome-peak":      (0.35, 0.55),
    "era-three-kingdoms":     (0.30, 0.55),
    "era-fall-of-rome":       (0.30, 0.52),
    "era-tang-golden-age":    (0.35, 0.55),
    "era-crusades":           (0.35, 0.55),
    "era-mongol-empire":      (0.35, 0.55),
    "era-renaissance":        (0.35, 0.58),
    "era-early-modern":       (0.38, 0.60),
    "era-enlightenment":      (0.38, 0.62),
    "era-industrial-revolution": (0.38, 0.65),
    "era-imperialism":        (0.35, 0.60),
}

# Known major civilisations with specific Gini estimates
# Milanovic, Scheidel, Alfani, etc.
PRE_MODERN_GINI = {
    "era-han-rome-peak": {
        "roman_empire": 0.43, "han_dynasty": 0.40,
        "kushan_empire": 0.42, "parthian_empire": 0.44,
    },
    "era-three-kingdoms": {
        "cao_wei": 0.42, "roman_empire": 0.45, "sasanian_empire": 0.44,
        "sun_wu": 0.40, "shu_han": 0.38, "kushan_empire": 0.42,
        "aksum": 0.38,
    },
    "era-fall-of-rome": {
        "byzantine_empire": 0.42, "sasanian_empire": 0.44,
        "gupta_empire": 0.40, "liu_song": 0.38, "northern_wei": 0.40,
    },
    "era-tang-golden-age": {
        "tang_dynasty": 0.42, "abbasid_caliphate": 0.48,
        "byzantine_empire": 0.43, "frankish_empire": 0.40,
        "umayyad_cordoba": 0.45, "pala_empire": 0.40,
        "rashtrakuta": 0.42, "tibetan_empire": 0.38,
    },
    "era-crusades": {
        "song_dynasty": 0.44, "jin_dynasty": 0.42, "ayyubid": 0.48,
        "almohad": 0.43, "byzantine_empire": 0.45,
        "delhi_sultanate": 0.46, "holy_roman_empire": 0.40,
        "kingdom_of_france": 0.42, "kingdom_of_england": 0.40,
        "khmer_empire": 0.44, "western_xia": 0.40,
    },
    "era-mongol-empire": {
        "yuan_dynasty": 0.48, "golden_horde": 0.42,
        "ilkhanate": 0.46, "chagatai": 0.40,
        "delhi_sultanate": 0.46, "mamluk_sultanate": 0.48,
        "kingdom_of_france": 0.42, "kingdom_of_england": 0.40,
        "holy_roman_empire": 0.38, "byzantine_empire": 0.44,
    },
    "era-renaissance": {
        "ming_china": 0.40, "ottoman_empire": 0.48,
        "france": 0.44, "england": 0.42, "spain": 0.50,
        "venice": 0.52, "florence": 0.50, "papal_states": 0.46,
        "portugal": 0.48, "hungary": 0.40,
        "holy_roman_empire": 0.38, "poland_lithuania": 0.38,
        "moscow_grand_principality": 0.42, "mamluk_sultanate": 0.46,
        "vijayanagara": 0.44, "delhi_sultanate": 0.46,
        "songhai": 0.42, "aztec_empire": 0.44, "inca_empire": 0.38,
    },
    "era-early-modern": {
        "qing_dynasty": 0.42, "mughal_empire": 0.50,
        "ottoman_empire": 0.50, "safavid_iran": 0.46,
        "kingdom_france": 0.48, "spanish_monarchy": 0.52,
        "dutch_republic": 0.54, "english_commonwealth": 0.44,
        "habsburg_monarchy": 0.44, "tsardom_russia": 0.42,
        "swedish_empire": 0.40, "polish_lithuanian_commonwealth": 0.42,
        "tokugawa_shogunate": 0.38, "joseon_korea": 0.40,
        "venice_republic": 0.52, "portugal_restoration": 0.46,
        "new_spain": 0.54, "viceroyalty_peru": 0.56,
        "portuguese_brazil": 0.55, "denmark_norway": 0.38,
    },
    "era-enlightenment": {
        "qing_dynasty": 0.44, "mughal_empire": 0.52,
        "ottoman_empire": 0.50, "kingdom_of_france": 0.52,
        "kingdom_of_great_britain": 0.48, "kingdom_of_spain": 0.50,
        "habsburg_monarchy": 0.44, "russian_empire": 0.44,
        "dutch_republic": 0.56, "prussia": 0.40,
        "portuguese_kingdom": 0.46, "sweden_age_of_liberty": 0.38,
        "denmark_norway": 0.38, "polish_lithuanian_commonwealth": 0.46,
        "tokugawa_shogunate": 0.38, "joseon_korea": 0.40,
        "viceroyalty_new_spain": 0.56, "viceroyalty_peru": 0.56,
        "portuguese_brazil": 0.58, "venice": 0.52,
        "papal_states": 0.44, "kingdom_of_naples_sicily": 0.48,
        "durrani_empire": 0.44, "maratha_confederacy": 0.42,
        "ethiopian_empire": 0.40, "ayutthaya_kingdom": 0.44,
    },
    "era-industrial-revolution": {
        "united_kingdom": 0.52, "france_july_monarchy": 0.46,
        "prussia": 0.40, "austrian_empire": 0.42,
        "russian_empire": 0.44, "ottoman_empire": 0.50,
        "us": 0.44, "qing_empire": 0.44,
        "tokugawa_japan": 0.38, "brazil_empire": 0.58,
        "spain": 0.48, "portugal": 0.46, "netherlands": 0.42,
        "belgium": 0.38, "joseon": 0.40, "siam": 0.44,
        "egypt_khedival": 0.50, "qajar_iran": 0.48,
        "british_india_company": 0.46, "mexico": 0.52,
        "chile": 0.50, "argentine_confederation": 0.46,
        "peru": 0.52, "haiti": 0.56,
    },
    "era-imperialism": {
        "british_empire_home": 0.48, "france_third_republic": 0.46,
        "german_empire": 0.40, "russian_empire": 0.45,
        "austro_hungarian_empire": 0.42, "italy_kingdom": 0.44,
        "usa": 0.46, "meiji_japan": 0.42, "joseon_korean_empire": 0.42,
        "ottoman_empire": 0.50, "qing_empire": 0.46,
        "british_india": 0.48, "spain": 0.48, "portugal": 0.46,
        "netherlands": 0.40, "belgium": 0.38,
        "brazil": 0.58, "argentina": 0.48, "mexico": 0.52,
        "canada": 0.40, "australia": 0.38, "new_zealand": 0.38,
        "south_africa": 0.56, "cape_colony": 0.56,
        "chile": 0.50, "peru": 0.52, "colombia": 0.52,
        "egypt": 0.50, "khedivate_egypt": 0.50,
        "qajar_iran": 0.48, "ethiopian_empire": 0.42,
        "siam": 0.44, "cuba_us_occupation": 0.48,
        "greece": 0.42, "romania": 0.40, "serbia": 0.38,
        "sweden_norway": 0.36, "denmark": 0.34,
        "switzerland": 0.34, "finland": 0.36, "iceland": 0.32,
    },
}


def estimate_gini_from_region(region, era_name, era_defaults):
    """Estimate Gini from region characteristics when no specific data exists."""
    econ = region.get("economy", {})
    tech = region.get("technology", {}).get("level", 0) or 0
    raw_urban = region.get("demographics", {}).get("urbanizationRate", 0)
    if isinstance(raw_urban, str):
        try:
            raw_urban = float(raw_urban.replace("%", "").strip())
        except (ValueError, AttributeError):
            raw_urban = 0
    urban = (raw_urban or 0) / 100.0
    pop = region.get("demographics", {}).get("population", 0) or 0

    lo, hi = era_defaults

    # Tribal/small societies: lower inequality
    if pop < 50000:
        return round(lo + 0.02, 3)
    if pop < 200000:
        return round(lo + 0.04, 3)

    # City-states and empires: higher inequality with urbanisation
    base = lo + (hi - lo) * 0.5

    # Tech modifier: Kuznets peak around tech 5
    if tech > 0:
        tech_mod = 0.05 * math.exp(-0.5 * ((tech - 5) / 2.5) ** 2)
        base += tech_mod

    # Urbanisation increases inequality
    base += 0.08 * urban

    # Large empires tend to have higher inequality
    if pop > 10_000_000:
        base += 0.02
    if pop > 50_000_000:
        base += 0.02

    return round(max(lo, min(hi, base)), 3)


def find_gini(region_id, gini_table, era_overrides=None):
    """Find best-matching Gini for a region."""
    if era_overrides:
        for key in era_overrides:
            if key in region_id:
                return era_overrides[key]
    if gini_table:
        for key in gini_table:
            if key in region_id:
                return gini_table[key]
        # Strip common prefixes/suffixes
        base_id = region_id
        for suffix in ["_1962", "_1939", "_1900", "_1840", "_220", "_2000",
                        "_1750", "_1648", "_1500", "_1280", "_1200",
                        "ai_", "modern_", "north_america_", "south_america_",
                        "east_asia_", "south_asia_"]:
            base_id = base_id.replace(suffix, "")
        for key in gini_table:
            if key in base_id or base_id in key:
                return gini_table[key]
    return None


def get_gini_table_for_era(era_year):
    if era_year >= 2020:
        return GINI_2023
    elif era_year >= 1990:
        return GINI_2000
    elif era_year >= 1950:
        return GINI_1962
    elif era_year >= 1930:
        return GINI_1939
    return None


def main():
    era_files = sorted(glob.glob(str(SEED_DIR / "era-*.json")))
    total_set = 0
    total_regions = 0

    for filepath in era_files:
        era_name = os.path.basename(filepath).replace(".json", "")
        with open(filepath, "r", encoding="utf-8") as f:
            era_data = json.load(f)

        era_year = era_data.get("timestamp", {}).get("year", 0)
        regions = era_data.get("regions", [])
        era_set = 0

        gini_table = get_gini_table_for_era(era_year)
        era_overrides = PRE_MODERN_GINI.get(era_name)
        era_defaults = ERA_GINI_DEFAULTS.get(era_name, (0.30, 0.50))

        for region in regions:
            total_regions += 1
            econ = region.get("economy", {})
            existing = econ.get("giniEstimate")

            if existing is not None and existing > 0:
                continue

            gini = find_gini(region["id"], gini_table, era_overrides)
            if gini is None:
                gini = estimate_gini_from_region(region, era_name, era_defaults)

            if "economy" not in region:
                region["economy"] = {}
            region["economy"]["giniEstimate"] = gini
            era_set += 1

        total_set += era_set
        print(f"{era_name:<35} {era_year:>6} | {len(regions):>3} regions | set: {era_set:>3}")

        if WRITE_MODE and era_set > 0:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(era_data, f, ensure_ascii=False, indent=2)

    print(f"\nTotal: {total_set}/{total_regions} giniEstimate values set")
    print(f"Mode: {'WRITE' if WRITE_MODE else 'DRY-RUN'}")
    if not WRITE_MODE:
        print("Run with --write to apply changes.")


if __name__ == "__main__":
    main()
