"""Builds the real data of step 0 of the Recorrido (the GDP of Argentina since 1900 and the rankings of the world).

Reads the Maddison Project Database 2020 (GGDC, University of Groningen), the Argentine series of the World Bank (WDI) and the
real GDP of Argentina of the Penn World Table 11.0 from FRED, and writes two files for the web app:

    web/src/tour/worldRealData.json    Maddison: Argentina, rankings of the world by year, economies of the region
    web/src/tour/worldReference.json   World Bank and FRED series of Argentina (for the Data section)

Standard library only. Run it from the repository root: ``python scripts/build_world_data.py``. It downloads the sources (the
Maddison file is 1.7 MB and is not kept in the repository); pass ``--mpd path/to/mpd2020.xlsx`` to use a local copy.
Sources and states: docs/references.md, section 4.2.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "web" / "src" / "tour"
MPD_URL = "https://www.rug.nl/ggdc/historicaldevelopment/maddison/data/mpd2020.xlsx"
WB_URL = "https://api.worldbank.org/v2/country/ARG/indicator/{ind}?format=json&per_page=100&date=1960:2025"
FRED_URL = "https://fred.stlouisfed.org/data/RGDPNAARA666NRUG.txt"
RETRIEVED_AT = "2026-10-12"
FIRST_YEAR = 1900
TOP = 21  # 20 others are listed even when Argentina is among the first 21

# a state that broke up is one entity until it broke up and its successors after; counting both would count one economy twice
AGGREGATES = {
    "Former USSR": (
        1991,
        {
            "Russian Federation",
            "Ukraine",
            "Belarus",
            "Kazakhstan",
            "Armenia",
            "Azerbaijan",
            "Georgia",
            "Kyrgyzstan",
            "Republic of Moldova",
            "Tajikistan",
            "Turkmenistan",
            "Uzbekistan",
            "Estonia",
            "Latvia",
            "Lithuania",
        },
    ),
    "Czechoslovakia": (1993, {"Czech Republic", "Slovakia"}),
    "Former Yugoslavia": (
        1991,
        {
            "Serbia",
            "Croatia",
            "Slovenia",
            "Bosnia and Herzegovina",
            "TFYR of Macedonia",
            "Montenegro",
        },
    ),
}

REGION = [
    "Brazil",
    "Mexico",
    "Argentina",
    "Colombia",
    "Chile",
    "Peru",
    "Venezuela (Bolivarian Republic of)",
    "Ecuador",
]

ES = {
    "Argentina": "Argentina",
    "Australia": "Australia",
    "Austria": "Austria",
    "Bahrain": "Baréin",
    "Belgium": "Bélgica",
    "Brazil": "Brasil",
    "Canada": "Canadá",
    "Chile": "Chile",
    "China": "China",
    "China, Hong Kong SAR": "Hong Kong",
    "Colombia": "Colombia",
    "Czechoslovakia": "Checoslovaquia",
    "Denmark": "Dinamarca",
    "Equatorial Guinea": "Guinea Ecuatorial",
    "Finland": "Finlandia",
    "Former USSR": "Unión Soviética",
    "Former Yugoslavia": "Yugoslavia",
    "France": "Francia",
    "Germany": "Alemania",
    "Greece": "Grecia",
    "Hungary": "Hungría",
    "Iceland": "Islandia",
    "India": "India",
    "Indonesia": "Indonesia",
    "Iran (Islamic Republic of)": "Irán",
    "Ireland": "Irlanda",
    "Italy": "Italia",
    "Japan": "Japón",
    "Kuwait": "Kuwait",
    "Luxembourg": "Luxemburgo",
    "Mexico": "México",
    "Netherlands": "Países Bajos",
    "New Zealand": "Nueva Zelanda",
    "Norway": "Noruega",
    "Oman": "Omán",
    "Panama": "Panamá",
    "Philippines": "Filipinas",
    "Poland": "Polonia",
    "Qatar": "Catar",
    "Republic of Korea": "Corea del Sur",
    "Russian Federation": "Rusia",
    "Saudi Arabia": "Arabia Saudita",
    "Singapore": "Singapur",
    "Slovenia": "Eslovenia",
    "Spain": "España",
    "Sweden": "Suecia",
    "Switzerland": "Suiza",
    "Taiwan, Province of China": "Taiwán",
    "Thailand": "Tailandia",
    "Turkey": "Turquía",
    "Ukraine": "Ucrania",
    "United Arab Emirates": "Emiratos Árabes Unidos",
    "United Kingdom": "Reino Unido",
    "United States": "Estados Unidos",
    "Uruguay": "Uruguay",
    "Venezuela (Bolivarian Republic of)": "Venezuela",
    "Ecuador": "Ecuador",
    "Peru": "Perú",
    "Pakistan": "Pakistán",
    "Bangladesh": "Bangladés",
    "Egypt": "Egipto",
    "South Africa": "Sudáfrica",
    "Nigeria": "Nigeria",
    "Viet Nam": "Vietnam",
    "Malaysia": "Malasia",
    "Israel": "Israel",
    "Portugal": "Portugal",
    "Romania": "Rumania",
    "Bulgaria": "Bulgaria",
    "Czech Republic": "República Checa",
    "Slovakia": "Eslovaquia",
    "Cuba": "Cuba",
}


CACHE: Path | None = None


def fetch(url: str) -> bytes:
    if CACHE is not None:
        # files saved beforehand (with curl) when a host drops the connection: wb_<indicator>.json, fred_arg.txt
        name = (
            "fred_arg.txt"
            if "fred.stlouisfed" in url
            else "wb_" + re.search(r"indicator/([A-Z.]+)\?", url).group(1) + ".json"
        )
        if (CACHE / name).exists():
            return (CACHE / name).read_bytes()
    request = urllib.request.Request(
        url, headers={"User-Agent": "Mozilla/5.0 (argentina-2056 data build)"}
    )
    for attempt in range(1, 4):
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                return response.read()
        except (TimeoutError, urllib.error.URLError):
            # some hosts (FRED) answer curl and not urllib: try curl before giving up
            done = subprocess.run(
                ["curl", "-sSL", "-m", "90", "-A", "Mozilla/5.0", url],
                capture_output=True,
                check=False,
            )
            if done.returncode == 0 and done.stdout:
                return done.stdout
            if attempt == 3:
                raise
            time.sleep(5 * attempt)
    raise AssertionError("unreachable")


def _text(node: ET.Element | None) -> str:
    return "".join(node.itertext()) if node is not None else ""


def read_xlsx_sheet(path: Path, sheet_name: str) -> list[list[str | None]]:
    """The rows of a sheet of an .xlsx as text (None for an empty cell), with the standard library only."""
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    rel_ns = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
    with zipfile.ZipFile(path) as z:
        shared = [
            _text(si)
            for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", ns)
        ]
        workbook = ET.fromstring(z.read("xl/workbook.xml"))
        rels = {
            r.get("Id"): r.get("Target")
            for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        }
        target = next(
            s.get(rel_ns)
            for s in workbook.find("m:sheets", ns)
            if s.get("name") == sheet_name
        )
        name = rels[target]
        sheet = ET.fromstring(
            z.read(name if name.startswith("xl/") else "xl/" + name.lstrip("/"))
        )
    rows: list[list[str | None]] = []
    for row in sheet.find("m:sheetData", ns):
        cells: dict[int, str | None] = {}
        for c in row:
            col = 0
            for ch in re.match(r"[A-Z]+", c.get("r")).group():
                col = col * 26 + ord(ch) - 64
            v = c.find("m:v", ns)
            if v is None:
                cells[col - 1] = _text(c.find("m:is", ns)) or None
            else:
                cells[col - 1] = shared[int(v.text)] if c.get("t") == "s" else v.text
        rows.append([cells.get(i) for i in range(max(cells) + 1)] if cells else [])
    return rows


def maddison(path: Path) -> dict[str, dict[int, tuple[float, float]]]:
    """country -> year -> (GDP per capita in 2011 international dollars, population in thousands), only where both exist."""
    rows = read_xlsx_sheet(path, "Full data")
    head = rows[0]
    col = {name: head.index(name) for name in ("country", "year", "gdppc", "pop")}
    out: dict[str, dict[int, tuple[float, float]]] = {}
    for r in rows[1:]:
        if (
            len(r) <= max(col.values())
            or r[col["gdppc"]] is None
            or r[col["pop"]] is None
        ):
            continue
        year = int(float(r[col["year"]]))
        if year >= FIRST_YEAR:
            out.setdefault(r[col["country"]], {})[year] = (
                float(r[col["gdppc"]]),
                float(r[col["pop"]]),
            )
    return out


def in_pool(country: str, year: int) -> bool:
    """False for an aggregate after it broke up and for a successor before that."""
    if country in AGGREGATES:
        return year < AGGREGATES[country][0]
    for until, successors in AGGREGATES.values():
        if country in successors:
            return year >= until
    return True


def build_world(mpd: dict[str, dict[int, tuple[float, float]]]) -> dict:
    last = max(max(v) for v in mpd.values())
    years = list(range(FIRST_YEAR, last + 1))
    gdp = {
        c: {y: g * p / 1e6 for y, (g, p) in s.items()} for c, s in mpd.items()
    }  # thousand million 2011 int-$
    ranks: dict[str, list] = {"gdp": [], "gdppc": []}
    for year in years:
        for metric, table, digits in (
            ("gdp", gdp, 1),
            ("gdppc", {c: {y: v[0] for y, v in s.items()} for c, s in mpd.items()}, 0),
        ):
            pool = sorted(
                (
                    (c, s[year])
                    for c, s in table.items()
                    if year in s and in_pool(c, year)
                ),
                key=lambda t: -t[1],
            )
            home = next(i for i, (c, _) in enumerate(pool) if c == "Argentina")
            ranks[metric].append(
                {
                    "n": len(pool),
                    "top": [[ES.get(c, c), round(v, digits)] for c, v in pool[:TOP]],
                    "arg": [home + 1, round(pool[home][1], digits)],
                }
            )
    arg = mpd["Argentina"]
    return {
        "firstYear": FIRST_YEAR,
        "lastYear": last,
        "years": years,
        "argentina": {
            "gdp": [round(gdp["Argentina"][y], 1) for y in years],
            "gdppc": [round(arg[y][0], 0) for y in years],
            "pop": [round(arg[y][1], 0) for y in years],
        },
        "ranks": ranks,
        "region": {
            "countries": [ES[c] for c in REGION],
            "gdp": [
                [round(gdp[c][y], 1) if y in gdp[c] else None for y in years]
                for c in REGION
            ],
        },
    }


def world_bank() -> dict:
    out = {}
    for ind, name in (
        ("NY.GDP.MKTP.KD", "PBI (dólares constantes de 2015)"),
        ("NY.GDP.PCAP.KD", "PBI per cápita (dólares constantes de 2015)"),
        ("SP.POP.TOTL", "Población"),
    ):
        data = json.loads(fetch(WB_URL.format(ind=ind)))[1]
        out[ind] = {
            "name": name,
            "values": {
                int(r["date"]): r["value"] for r in data if r["value"] is not None
            },
        }
    return out


def fred() -> dict[int, float]:
    html = fetch(FRED_URL).decode("utf-8")
    rows = re.findall(
        r'<th scope="row" class="pe-5">(\d{4})-01-01</th>\s*<td class="pe-5">([\d.]+)</td>',
        html,
    )
    return {int(y): float(v) for y, v in rows}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mpd", type=Path, help="a local copy of mpd2020.xlsx")
    parser.add_argument(
        "--cache",
        type=Path,
        help="a folder with wb_<indicator>.json and fred_arg.txt saved with curl",
    )
    args = parser.parse_args()
    global CACHE
    CACHE = args.cache
    path = args.mpd
    if path is None:
        path = ROOT / ".mpd2020.tmp.xlsx"
        path.write_bytes(fetch(MPD_URL))
    try:
        world = build_world(maddison(path))
    finally:
        if args.mpd is None:
            path.unlink(missing_ok=True)
    (OUT_DIR / "worldRealData.json").write_text(
        json.dumps(world, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )

    wb = world_bank()
    reference = {
        "retrieved_at": RETRIEVED_AT,
        "worldBank": {
            k: {
                "name": v["name"],
                "values": {str(y): x for y, x in v["values"].items()},
            }
            for k, v in wb.items()
        },
        "fred": {
            "series": "RGDPNAARA666NRUG",
            "unit": "millones de dólares de 2021",
            "values": {str(y): v for y, v in fred().items()},
        },
    }
    (OUT_DIR / "worldReference.json").write_text(
        json.dumps(reference, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(
        f"wrote {len(world['years'])} years ({world['firstYear']} to {world['lastYear']}) and the reference series"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
