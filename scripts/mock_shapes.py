"""Shapes for the illustrative mock data: anchors by year, interpolation and the fixed tables the generator uses.

Every value here is an order of magnitude chosen so that the screens tell a believable story. None of them is a sourced
fact; the generated files keep `source: "MOCK"` and the app labels them as illustrative.
"""

import math
from itertools import pairwise

# ISO 3166-2:AR letters in the order of web/src/types/province.ts
PROVINCES = [
    "AR-A", "AR-B", "AR-C", "AR-D", "AR-E", "AR-F", "AR-G", "AR-H", "AR-J", "AR-K", "AR-L", "AR-M",
    "AR-N", "AR-P", "AR-Q", "AR-R", "AR-S", "AR-T", "AR-U", "AR-V", "AR-W", "AR-X", "AR-Y", "AR-Z",
]

COUNTRIES = ["ARG", "BRA", "CHL", "COL", "MEX", "PER", "URY"]

# gdp per capita in constant USD (illustrative), by year. Argentina leads around 1913 and falls behind later.
GDP_PC_ANCHORS = {
    "ARG": [(1880, 1700), (1913, 4400), (1929, 5000), (1950, 5600), (1974, 9800), (1988, 9000), (1998, 12800),
            (2008, 14800), (2017, 14600), (2025, 13200)],
    "BRA": [(1880, 900), (1913, 1200), (1950, 2100), (1980, 6500), (2000, 7200), (2010, 9600), (2025, 9800)],
    "CHL": [(1880, 1500), (1913, 3000), (1950, 3900), (1980, 6200), (2000, 10800), (2012, 15500), (2025, 17200)],
    "COL": [(1880, 800), (1913, 1300), (1950, 2300), (1980, 4600), (2000, 6200), (2015, 8800), (2025, 8300)],
    "MEX": [(1880, 1000), (1913, 2100), (1950, 3200), (1980, 8200), (2000, 9800), (2015, 11500), (2025, 12600)],
    "PER": [(1880, 700), (1913, 1100), (1950, 2000), (1980, 4300), (2000, 4800), (2015, 7600), (2025, 7900)],
    "URY": [(1880, 1800), (1913, 3500), (1950, 5100), (1980, 7600), (2000, 10400), (2015, 15200), (2025, 16400)],
}

# population in people (illustrative)
POPULATION_ANCHORS = {
    "ARG": [(1880, 2.5e6), (1913, 7.9e6), (1950, 17.2e6), (1980, 28.1e6), (2010, 40.8e6), (2025, 46.4e6)],
    "BRA": [(1880, 12e6), (1913, 24e6), (1950, 53e6), (1980, 122e6), (2010, 196e6), (2025, 216e6)],
    "CHL": [(1880, 2.3e6), (1913, 3.5e6), (1950, 6.1e6), (1980, 11.2e6), (2010, 17.1e6), (2025, 19.7e6)],
    "COL": [(1880, 3.5e6), (1913, 5.5e6), (1950, 11.6e6), (1980, 27.5e6), (2010, 44.9e6), (2025, 52.3e6)],
    "MEX": [(1880, 9.6e6), (1913, 15.5e6), (1950, 27.7e6), (1980, 67.6e6), (2010, 114e6), (2025, 130e6)],
    "PER": [(1880, 2.9e6), (1913, 4.0e6), (1950, 8.2e6), (1980, 17.3e6), (2010, 29.0e6), (2025, 34.4e6)],
    "URY": [(1880, 0.45e6), (1913, 1.2e6), (1950, 2.2e6), (1980, 2.9e6), (2010, 3.4e6), (2025, 3.5e6)],
}

# human development index in 1990 and 2025
HDI_ENDS = {
    "ARG": (0.71, 0.85), "BRA": (0.61, 0.76), "CHL": (0.70, 0.86), "COL": (0.60, 0.77),
    "MEX": (0.66, 0.78), "PER": (0.62, 0.76), "URY": (0.70, 0.83),
}

# exports and imports as a share of GDP in 1960 and 2025 (illustrative)
EXPORT_SHARE = {"ARG": (0.09, 0.17), "BRA": (0.06, 0.15), "CHL": (0.14, 0.33), "COL": (0.14, 0.18),
                "MEX": (0.10, 0.37), "PER": (0.17, 0.27), "URY": (0.12, 0.28)}
IMPORT_SHARE = {"ARG": (0.08, 0.15), "BRA": (0.06, 0.14), "CHL": (0.14, 0.30), "COL": (0.15, 0.22),
                "MEX": (0.10, 0.37), "PER": (0.19, 0.24), "URY": (0.13, 0.27)}

# a crisis is a dip in gdp per capita in its year that fades in a few years: year -> depth (fraction of the level)
CRISES = {
    "ARG": {1890: 0.10, 1930: 0.10, 1952: 0.05, 1975: 0.06, 1982: 0.07, 1989: 0.12, 2001: 0.13, 2018: 0.05},
    "BRA": {1930: 0.06, 1983: 0.06, 1990: 0.05, 2015: 0.06},
    "CHL": {1930: 0.12, 1975: 0.10, 1982: 0.12},
    "COL": {1999: 0.05},
    "MEX": {1982: 0.07, 1995: 0.09, 2009: 0.06},
    "PER": {1988: 0.10, 1990: 0.06},
    "URY": {1982: 0.10, 2002: 0.10},
}

# share of the national population in 2025 (relative weights, normalised by the generator)
PROVINCE_WEIGHT = {
    "AR-A": 33, "AR-B": 386, "AR-C": 66, "AR-D": 11, "AR-E": 30, "AR-F": 9, "AR-G": 21, "AR-H": 26,
    "AR-J": 17, "AR-K": 9, "AR-L": 8, "AR-M": 45, "AR-N": 27, "AR-P": 13, "AR-Q": 16, "AR-R": 17,
    "AR-S": 77, "AR-T": 39, "AR-U": 15, "AR-V": 4, "AR-W": 25, "AR-X": 87, "AR-Y": 16, "AR-Z": 8,
}
# growth of a province's share per year (positive: its share rises over time)
PROVINCE_DRIFT = {"AR-C": -0.006, "AR-B": 0.0005, "AR-V": 0.03, "AR-Z": 0.015, "AR-U": 0.012, "AR-Q": 0.012,
                  "AR-N": 0.006, "AR-R": 0.008, "AR-X": 0.002}
# income of a province relative to the average (before normalising)
PROVINCE_INCOME = {
    "AR-C": 2.3, "AR-Q": 1.6, "AR-Z": 1.5, "AR-V": 1.5, "AR-U": 1.3, "AR-B": 0.95, "AR-X": 0.95, "AR-S": 1.0,
    "AR-M": 1.0, "AR-D": 0.9, "AR-L": 0.9, "AR-R": 1.0, "AR-E": 0.8, "AR-T": 0.7, "AR-A": 0.75, "AR-J": 0.85,
    "AR-K": 0.8, "AR-F": 0.6, "AR-G": 0.55, "AR-H": 0.55, "AR-P": 0.5, "AR-N": 0.6, "AR-W": 0.6, "AR-Y": 0.6,
}

# where each resource is produced, with the share of the national output at the start (1990) and the end (2025)
RESOURCE_SHARES = {
    "lithium": {"AR-K": (1.0, 0.30), "AR-A": (0.0, 0.25), "AR-Y": (0.0, 0.45)},
    "copper": {"AR-K": (1.0, 0.70), "AR-J": (0.0, 0.25), "AR-A": (0.0, 0.05)},
    "gold": {"AR-Z": (0.9, 0.38), "AR-J": (0.0, 0.40), "AR-K": (0.1, 0.22)},
    "oil": {"AR-Q": (0.25, 0.55), "AR-U": (0.28, 0.15), "AR-Z": (0.2, 0.12), "AR-M": (0.15, 0.08),
            "AR-R": (0.12, 0.10)},
    "gas": {"AR-Q": (0.35, 0.65), "AR-V": (0.15, 0.08), "AR-A": (0.2, 0.12), "AR-Z": (0.3, 0.15)},
    "soy": {"AR-B": (0.27, 0.27), "AR-X": (0.25, 0.25), "AR-S": (0.24, 0.24), "AR-E": (0.12, 0.12),
            "AR-G": (0.07, 0.07), "AR-T": (0.05, 0.05)},
}
RESOURCE_UNITS = {"lithium": "kt LCE", "copper": "kt Cu", "gold": "t Au", "oil": "kbbl/d", "gas": "Mm3/d", "soy": "Mt"}
# national production (illustrative orders of magnitude), by year
RESOURCE_ANCHORS = {
    "lithium": [(1990, 0.0), (1997, 1.0), (2010, 3.0), (2015, 6.0), (2020, 30.0), (2025, 75.0)],
    "copper": [(1990, 0.0), (1998, 120.0), (2012, 150.0), (2018, 130.0), (2019, 8.0), (2025, 8.0)],
    "gold": [(1990, 0.5), (2000, 30.0), (2012, 65.0), (2025, 45.0)],
    "oil": [(1990, 450.0), (1998, 850.0), (2015, 520.0), (2025, 750.0)],
    "gas": [(1990, 70.0), (2004, 135.0), (2015, 120.0), (2025, 140.0)],
    "soy": [(1990, 11.0), (2000, 20.0), (2010, 50.0), (2025, 50.0)],
}
# yearly growth of each resource in the three forecast scenarios (pessimistic, expected, optimistic)
RESOURCE_GROWTH = {
    "lithium": (0.03, 0.06, 0.09), "copper": (-0.01, 0.03, 0.07), "gold": (-0.02, 0.005, 0.02),
    "oil": (-0.015, 0.01, 0.025), "gas": (-0.01, 0.012, 0.03), "soy": (-0.005, 0.01, 0.02),
}


def interp_log(anchors, year):
    """Log-linear interpolation between (year, value) anchors; flat outside them. A zero anchor is interpolated linearly."""
    if year <= anchors[0][0]:
        return float(anchors[0][1])
    for (y0, v0), (y1, v1) in pairwise(anchors):
        if y0 <= year <= y1:
            t = (year - y0) / (y1 - y0)
            if v0 <= 0 or v1 <= 0:
                return v0 + (v1 - v0) * t
            return math.exp(math.log(v0) + (math.log(v1) - math.log(v0)) * t)
    return float(anchors[-1][1])


def crisis_factor(country, year):
    """Multiplier of gdp per capita: 1 outside crises, a dip in the crisis year that fades in about three years."""
    factor = 1.0
    for start, depth in CRISES.get(country, {}).items():
        if year >= start:
            factor *= 1.0 - depth * math.exp(-(year - start) * 0.7)
    return factor


def province_shares(year):
    """Share of the national population by province in a year (sums to 1)."""
    raw = {p: PROVINCE_WEIGHT[p] * math.exp(PROVINCE_DRIFT.get(p, 0.0) * (year - 2025)) for p in PROVINCES}
    total = sum(raw.values())
    return {p: raw[p] / total for p in PROVINCES}


def province_income_shares():
    """Share of the national GDP by province, from the 2025 population shares and the relative income (sums to 1)."""
    pop = province_shares(2025)
    raw = {p: pop[p] * PROVINCE_INCOME[p] for p in PROVINCES}
    total = sum(raw.values())
    return {p: raw[p] / total for p in PROVINCES}


def resource_share(resource, province, year):
    start, end = RESOURCE_SHARES[resource][province]
    t = min(max((year - 1990) / (2025 - 1990), 0.0), 1.0)
    return start + (end - start) * t
