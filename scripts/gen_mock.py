import datetime
import json
import math
import random
import sys
from pathlib import Path

from mock_shapes import (
    COUNTRIES,
    EXPORT_SHARE,
    GDP_PC_ANCHORS,
    HDI_ENDS,
    IMPORT_SHARE,
    POPULATION_ANCHORS,
    PROVINCES,
    RESOURCE_ANCHORS,
    RESOURCE_GROWTH,
    RESOURCE_SHARES,
    RESOURCE_UNITS,
    crisis_factor,
    interp_log,
    province_income_shares,
    province_shares,
    resource_share,
)

SEED = 2056
RETRIEVED_AT = "2026-10-02"
YEARS = range(2026, 2057)

def dump_json(data, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, sort_keys=True, ensure_ascii=False)
        f.write("\n")

def dump_json_compact(data, path):
    """Same content as dump_json without indentation: used for the one file that would pass the per-file budget."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")


def gen_economy(rng):
    """Seven countries, six indicators. GDP is gdp per capita times population, so the three always agree."""
    # a few holes on purpose (the app must show a gap, never a zero); the note says so
    holes = {
        ("COL", "gdp_per_capita_usd", 1921), ("PER", "population", 1941),
        ("MEX", "gdp_constant_usd", 1916), ("BRA", "hdi", 1995),
    }
    units = {"gdp_constant_usd": "USD", "gdp_per_capita_usd": "USD", "population": "personas", "hdi": "índice",
             "exports_usd": "USD", "imports_usd": "USD"}
    data = []

    for country in COUNTRIES:
        gdp_pc, population, gdp = {}, {}, {}
        for year in range(1880, 2026):
            noise = math.exp(rng.gauss(0, 0.012))
            gdp_pc[year] = interp_log(GDP_PC_ANCHORS[country], year) * crisis_factor(country, year) * noise
            population[year] = interp_log(POPULATION_ANCHORS[country], year)
            gdp[year] = gdp_pc[year] * population[year]

        values = {"gdp_constant_usd": {}, "gdp_per_capita_usd": {}, "population": {}, "hdi": {},
                  "exports_usd": {}, "imports_usd": {}}
        for year in range(1880, 2026):
            if not (country == "URY" and 1900 <= year <= 1905):  # a multi-year gap
                values["gdp_constant_usd"][year] = round(gdp[year])
            values["gdp_per_capita_usd"][year] = round(gdp_pc[year])
            values["population"][year] = round(population[year])
        h90, h25 = HDI_ENDS[country]
        for year in range(1990, 2026):
            values["hdi"][year] = round(h90 + (h25 - h90) * ((year - 1990) / 35) ** 0.9, 3)
        for year in range(1960, 2026):
            t = (year - 1960) / 65
            for key, shares in (("exports_usd", EXPORT_SHARE), ("imports_usd", IMPORT_SHARE)):
                lo, hi = shares[country]
                values[key][year] = round(gdp[year] * (lo + (hi - lo) * t) * math.exp(rng.gauss(0, 0.05)))

        for indicator in ("gdp_constant_usd", "gdp_per_capita_usd", "population", "hdi", "exports_usd", "imports_usd"):
            for year, value in sorted(values[indicator].items()):
                record = {"country": country, "indicator": indicator, "year": year, "value": value,
                          "unit": units[indicator], "source": "MOCK", "retrieved_at": RETRIEVED_AT}
                if (country, indicator, year) in holes:
                    record["value"] = None
                    record["note"] = "Dato faltante (mock ilustrativo)"
                data.append(record)
    return data


def gen_resource_production(rng):
    """Production by resource and province, 1990 to 2025, in the units of the sector. The national row is the sum."""
    holes = {("oil", "AR-M", 1995), ("soy", "AR-T", 2003), ("gold", "AR-K", 1996)}
    data = []
    resource_provs = {}
    for resource in ("lithium", "copper", "gold", "oil", "gas", "soy"):
        provinces = list(RESOURCE_SHARES[resource])
        resource_provs[resource] = provinces
        unit = RESOURCE_UNITS[resource]
        for year in range(1990, 2026):
            national = interp_log(RESOURCE_ANCHORS[resource], year) * math.exp(rng.gauss(0, 0.03))
            if national < 0:
                national = 0.0
            parts = {p: round(national * resource_share(resource, p, year), 2) for p in provinces}
            data.append({"geo": "AR", "resource": resource, "year": year, "value": round(sum(parts.values()), 2),
                         "unit": unit, "source": "MOCK", "retrieved_at": RETRIEVED_AT})
            for p in provinces:
                record = {"geo": p, "resource": resource, "year": year, "value": parts[p], "unit": unit,
                          "source": "MOCK", "retrieved_at": RETRIEVED_AT}
                if (resource, p, year) in holes:
                    record["value"] = None
                    record["note"] = "Dato faltante (mock ilustrativo)"
                data.append(record)
    return data, resource_provs


def gen_population(rng):
    """The country and its 24 provinces every five years. The provinces add up to the country."""
    data = []
    for year in range(1950, 2026, 5):
        national = interp_log(POPULATION_ANCHORS["ARG"], year)
        data.append({"geo": "AR", "year": year, "value": round(national), "unit": "personas", "source": "MOCK",
                     "retrieved_at": RETRIEVED_AT})
        for province, share in province_shares(year).items():
            data.append({"geo": province, "year": year, "value": round(national * share), "unit": "personas",
                         "source": "MOCK", "retrieved_at": RETRIEVED_AT})
    return data


# The march of the main column (San Martín, Soler, O'Higgins) by the Los Patos route, from El Plumerillo to Chacabuco:
# name, day of the campaign, longitude, latitude, elevation in meters. The days follow the dates of the crossing
# (departure 1817-01-19, San Martín in Manantiales on 01-31, Chile on 02-05, Chacabuco on 02-12) and the places of the
# itinerary of the column; the days between them are estimates. The positions are approximate (place names of OpenStreetMap
# through the MapTiler geocoder); the elevations were read from the MapTiler Terrain-RGB v2 DEM at those positions.
ANDES_ROUTE = [
    ("El Plumerillo", 0, -68.807, -32.847, 706),
    ("Valle de Uspallata", 3, -69.348, -32.591, 1884),
    ("Valle de Calingasta", 6, -69.450, -31.850, 1871),
    ("Río de los Patos", 8, -69.694, -31.903, 1905),
    ("Manantiales", 12, -69.880, -31.920, 2564),
    ("Campo del Mercedario", 13, -70.215, -32.084, 3175),
    ("Paso de Las Llaretas", 14, -70.317, -32.150, 3448),
    ("Valle Hermoso", 15, -70.222, -32.363, 3486),
    ("Las Achupallas (combate)", 16, -70.713, -32.630, 802),
    ("Las Coimas (combate)", 19, -70.725, -32.691, 696),
    ("San Felipe", 20, -70.725, -32.751, 648),
    ("Curimón (reunión con la columna de Las Heras)", 21, -70.684, -32.786, 710),
    ("Batalla de Chacabuco", 24, -70.684, -32.993, 794),
]
# The two skirmishes before Chacabuco, with the forces the sources give (Wikipedia, «Paso de Los Patos»: 200 granaderos under Arcos at Achupallas, about 100
# royalists in ambush; 140 Granaderos a Caballo under Necochea at Las Coimas against about 700 royalists with 2 pieces under Atero, 30 royalist dead;
# El Arcón de la Historia: the chief of the San Felipe garrison attacked Arcos with more than 100 men and Lieutenant Lavalle came with 25 granaderos).
ANDES_SKIRMISHES = {
    "Las Achupallas (combate)": [
        {"side": "Ejército de los Andes (avanzada de Arcos)", "men": 200, "note": "200 granaderos con el sargento mayor Antonio Arcos; el teniente Juan Lavalle llegó a tiempo con 25 granaderos"},
        {"side": "Fuerzas realistas", "men": 100, "note": "más de 100 hombres de la guarnición de San Felipe, que atacaron a Arcos; fueron rechazados y dejaron Putaendo y San Felipe"},
    ],
    "Las Coimas (combate)": [
        {"side": "Ejército de los Andes (vanguardia de Necochea)", "men": 140, "note": "140 Granaderos a Caballo con Mariano Necochea (65 a 100 según otras fuentes)"},
        {"side": "Fuerzas realistas", "men": 700, "note": "unos 700 (400 de caballería y 300 de infantería, con 2 piezas) al mando de Miguel María de Atero; unos 30 muertos; se retiraron hacia Santiago"},
    ],
}
# The report of the battle and of the two combats: who won and what each side lost (None: the sources do not give it).
# Chacabuco: Wikipedia «Batalla de Chacabuco» (12 patriot dead and 120 wounded; 500 royalist dead and 600 prisoners), H3 of docs/references.md.
# Achupallas and Las Coimas: Wikipedia «Paso de Los Patos» (about 30 royalist dead at Las Coimas), El Arcón de la Historia («el primer triunfo de la campaña»).
ANDES_OUTCOMES = {
    "Las Achupallas (combate)": {
        "result": "Victoria patriota",
        "sides": [
            {"side": "Ejército de los Andes", "units": "Granaderos a Caballo: la avanzada de Arcos y los 25 de Lavalle", "killed": None, "wounded": None, "prisoners": None, "note": "Las fuentes no dan las bajas"},
            {"side": "Fuerzas realistas", "units": "Guarnición de San Felipe", "killed": None, "wounded": None, "prisoners": None, "note": "Se retiraron y dejaron Putaendo y San Felipe; las fuentes no dan las bajas"},
        ],
    },
    "Las Coimas (combate)": {
        "result": "Victoria patriota",
        "sides": [
            {"side": "Ejército de los Andes", "units": "Granaderos a Caballo de Necochea", "killed": None, "wounded": None, "prisoners": None, "note": "Las fuentes no dan las bajas patriotas"},
            {"side": "Fuerzas realistas", "units": "Caballería e infantería con 2 piezas", "killed": 30, "wounded": None, "prisoners": None, "note": "Unos 30 muertos (Wikipedia, por informe); se retiraron hacia Santiago"},
        ],
    },
    "Batalla de Chacabuco": {
        "result": "Victoria patriota",
        "sides": [
            {"side": "Ejército de los Andes", "units": "Batallones 1 (Cazadores), 7, 8 y 11 · Granaderos a Caballo · artillería", "killed": 12, "wounded": 120, "prisoners": None, "note": "12 muertos y 120 heridos (Wikipedia, por informe)"},
            {"side": "Fuerzas realistas", "units": "Talavera, Chiloé y Valdivia · caballería de la Concordia y de Abascal · artillería", "killed": 500, "wounded": None, "prisoners": 600, "note": "500 muertos y 600 prisioneros (Wikipedia, por informe)"},
        ],
    },
}
ANDES_SOURCE = (
    "UNCuyo, Historia virtual de Mendoza, «Cruce de los Andes»; Diario de Cuyo, «Crónica de una epopeya» (2017); Wikipedia, «Rutas sanmartinianas» y «Paso de Los Patos»; "
    "coordenadas: MapTiler Geocoding (OpenStreetMap) y lista oficial de pasos (argentina.gob.ar); altitud: MapTiler Terrain-RGB v2"
)


# The other columns of the crossing, drawn on the map next to the main one. Waypoints: name, longitude, latitude, elevation (m, DEM),
# and the date when the sources give it (None: estimated by distance between the dated waypoints around it). Passes are placed
# by their general location. Days are counted from the departure of the main column (1817-01-19), so a column that left earlier has negative days.
ANDES_COLUMNS = [
    {
        "id": "las-heras",
        "name": "Columna de Las Heras (camino de Uspallata)",
        "men": None,
        "men_note": "770 (Academia de Historia Militar de Chile), 800 (UNCuyo) o 1.700 (Wikipedia) hombres según la fuente; el Batallón 11 de Las Heras tenía 683 (Municipalidad de Chacabuco)",
        "range": (770, 1700),
        "waypoints": [
            ("El Plumerillo", -68.807, -32.847, 706, "1817-01-18"),
            ("Potrerillos", -69.197, -32.961, 1426, None),
            ("Uspallata", -69.348, -32.591, 1883, None),
            ("Punta de Vacas", -69.755, -32.851, 2398, None),
            ("Puente del Inca", -69.910, -32.825, 2728, None),
            ("Las Cuevas", -70.049, -32.814, 3159, None),
            ("Paso de la Cumbre", -70.083, -32.825, 3550, None),
            ("Guardia Vieja", -70.269, -32.903, 1602, "1817-02-04"),
            ("Santa Rosa de los Andes", -70.599, -32.853, 812, "1817-02-08"),
            ("Curimón (reunión con la columna principal)", -70.684, -32.786, 710, "1817-02-09"),
            ("Batalla de Chacabuco", -70.684, -32.993, 794, "1817-02-12"),
        ],
    },
    {
        "id": "cabot",
        "name": "Columna de Cabot (paso de Guana)",
        "men": 140,
        "men_note": "140 según Wikipedia y 65, con 20 granaderos, según la Municipalidad de Chacabuco; más milicianos reclutados en el camino; las fuentes dan el 12 o el 18 de enero como salida",
        "waypoints": [
            ("San Juan", -68.525, -31.537, 636, "1817-01-12"),
            ("Talacasto", -68.639, -31.099, 954, None),
            ("Pismanta", -69.230, -30.277, 1889, None),
            ("Paso de Guana", -70.267, -30.733, 4092, "1817-02-05"),
            ("La Serena", -71.252, -29.903, 28, "1817-02-15"),
        ],
    },
    {
        "id": "freire",
        "name": "Columna de Freire (paso del Planchón)",
        "men": 100,
        "men_note": "100 a 110 soldados según la fuente (75 u 80 infantes y 25 o 30 granaderos), más guerrilleros y reclutas",
        "waypoints": [
            ("Mendoza (El Plumerillo)", -68.807, -32.847, 706, "1817-01-14"),
            ("Luján de Cuyo", -68.880, -33.039, 955, None),
            ("San Carlos", -69.048, -33.774, 955, None),
            ("San Rafael", -68.331, -34.613, 701, None),
            ("Paso del Planchón", -70.521, -35.206, 2503, "1817-02-01"),
            ("Talca", -71.666, -35.427, 96, "1817-02-12"),
        ],
    },
    {
        "id": "lemos",
        "name": "Columna de Lemos (paso del Portillo)",
        "men": 55,
        "pace_of": "freire",
        "waypoints": [
            ("San Carlos", -69.048, -33.774, 955, "1817-01-19"),
            ("Paso del Portillo", -69.950, -33.650, 3198, None),
            ("San Gabriel", -70.237, -33.783, 1261, None),
        ],
    },
    {
        "id": "zelada",
        "name": "Columna de Zelada (paso de Come-Caballos)",
        "men": 130,
        "waypoints": [
            ("Guandacol", -68.563, -29.525, 1076, "1817-01-05"),
            ("Laguna Brava", -68.862, -28.332, 4257, None),
            ("Paso de Come-Caballos", -69.300, -28.200, 4418, None),
            ("Copiapó", -70.332, -27.366, 385, "1817-02-13"),
        ],
    },
]
ANDES_COLUMNS_SOURCE = (
    "UNCuyo, Historia virtual de Mendoza, «Cruce de los Andes»; Wikipedia, «Rutas sanmartinianas»; El Arcón de la Historia; Diario de Cuyo (Cabot en Guana, 05-02); "
    "coordenadas: MapTiler Geocoding (OpenStreetMap) y lista oficial de pasos (argentina.gob.ar); altitud: MapTiler Terrain-RGB v2"
)


def _km(a, b):
    """Great-circle distance in km between two (lon, lat) points."""
    r = 6371.0088
    p1, p2 = math.radians(a[1]), math.radians(b[1])
    dp, dl = p2 - p1, math.radians(b[0] - a[0])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def _day(date):
    return (datetime.date.fromisoformat(date) - datetime.date(1817, 1, 19)).days


def _column_days(column, pace=None):
    """Day of each waypoint: the dated ones from their date, the others by distance between the dated ones around them.
    A column with no date at its end (`pace`) walks at that many km per day. Returns the days and which of them are estimated."""
    pts = column["waypoints"]
    dists = [0.0]
    for i in range(1, len(pts)):
        dists.append(dists[-1] + _km(pts[i - 1][1:3], pts[i][1:3]))
    days = [None if w[4] is None else _day(w[4]) for w in pts]
    if pace is not None:
        for i in range(1, len(pts)):
            if days[i] is None:
                days[i] = round(days[0] + dists[i] / pace)
    known = [i for i, d in enumerate(days) if d is not None]
    out = list(days)
    for i, d in enumerate(days):
        if d is None:
            a = max(k for k in known if k < i)
            b = min(k for k in known if k > i)
            t = (dists[i] - dists[a]) / (dists[b] - dists[a])
            out[i] = round(days[a] + (days[b] - days[a]) * t)
    return out, [w[4] is None for w in pts]


def gen_andes_column_events():
    freire = next(c for c in ANDES_COLUMNS if c["id"] == "freire")
    fdays, _ = _column_days(freire)
    fkm = sum(_km(freire["waypoints"][i - 1][1:3], freire["waypoints"][i][1:3]) for i in range(1, 5))
    freire_pace = fkm / (fdays[4] - fdays[0])  # km per day from Mendoza to the Planchón
    events = []
    for column in ANDES_COLUMNS:
        pace = freire_pace if column.get("pace_of") else None
        days, estimated = _column_days(column, pace)
        for i, ((name, lon, lat, elevation, _date), day, est) in enumerate(zip(column["waypoints"], days, estimated), start=1):
            force = {"side": column["name"], "men": column["men"]}
            if column.get("men_note"):
                force["note"] = column["men_note"]
            event = {
                "id": f"andes-{column['id']}-{i:02d}",
                "column_id": column["id"],
                "column_name": column["name"],
                "name": name,
                "day_of_campaign": day,
                "date": (datetime.date(1817, 1, 19) + datetime.timedelta(days=day)).isoformat(),
                "date_precision": "approximate" if est else "day",
                "lat": lat,
                "lon": lon,
                "elevation_m": elevation,
                "forces": [force],
                "source": ANDES_COLUMNS_SOURCE,
                "retrieved_at": "2026-10-09",
                "note": "Posición aproximada; la altitud es la del modelo de elevación en ese punto.",
            }
            if est:
                event["note"] += (
                    " Sin fecha en las fuentes: se supone el ritmo de la columna de Freire."
                    if column.get("pace_of")
                    else " Fecha estimada por distancia entre las fechas documentadas."
                )
            if column.get("range") and i == 1:
                event["estimate_range"] = {"min": column["range"][0], "max": column["range"][1]}
            events.append(event)
    return events


def gen_andes_events(rng):
    for _ in range(10):  # the old illustrative route drew ten random numbers; keeping the draws keeps the other mock files as they were
        rng.random()
    start = datetime.date(1817, 1, 19)
    data = []
    last = len(ANDES_ROUTE)
    for i, (name, day, lon, lat, elevation) in enumerate(ANDES_ROUTE, start=1):
        event = {
            "id": f"andes-{i:02d}",
            "name": name,
            "day_of_campaign": day,
            "date": (start + datetime.timedelta(days=day)).isoformat(),
            "date_precision": "day" if day in (0, 12, 14, 16, 19, 20, 21, 24) else "approximate",
            "lat": lat,
            "lon": lon,
            "elevation_m": elevation,
            "forces": [{"side": "Ejército de los Andes", "men": 3987, "note": "Estado general del 31-12-1816: 3.778 de tropa, 14 jefes y 195 oficiales; con milicianos y auxiliares, unos 5.000"}],
            "source": ANDES_SOURCE,
            "retrieved_at": "2026-10-08",
            "note": "Posición aproximada; la altitud es la del modelo de elevación en ese punto.",
        }
        if name in ANDES_OUTCOMES:
            event["outcome"] = ANDES_OUTCOMES[name]
        if name in ANDES_SKIRMISHES:
            event["forces"] = ANDES_SKIRMISHES[name]
            event["note"] += " Combate de la vanguardia, no de todo el ejército."
        if i == 1:
            event["note"] += " 3.987 soldados (sin los 1.200 milicianos y arrieros); la columna de Los Patos era una parte del ejército."
        if i == last:
            event["forces"] = [
                {"side": "Ejército de los Andes", "men": 3500, "note": "unos 3.500 en la batalla (Wikipedia, Todo Argentina; los 3.987 del estado de 1816 son todo el ejército al partir, con las columnas que fueron por otros pasos), o unos 3.600 sumando el despliegue de la Municipalidad de Chacabuco (Soler 2.100 y O'Higgins 1.500), con 9 piezas de artillería"},
                {"side": "Fuerzas realistas", "men": None, "note": "Cifra en disputa: 2.080 (Municipalidad de Chacabuco), 2.450 (Atlas Militar) o unos 2.500 (Wikipedia), con 2 a 5 piezas; hay fuentes secundarias con cifras menores"},
            ]
            event["estimate_range"] = {"min": 2080, "max": 2500}
        if i == last - 1:
            event["note"] += " Aquí se reúne con la columna de Las Heras, cuya artillería y parque (fray Luis Beltrán) salieron un día después por el mismo camino (las fuentes dan el 8 o el 9 de febrero)."
        data.append(event)
    return data + gen_andes_column_events()


def _finish(p50s, spread, digits, scale=1.0, absolute=False):
    """Points with a fan that widens every year (strictly, so it still does after rounding) and a longer lower tail."""
    unit = 10 ** digits
    points, prev = [], 0
    for i, (year, p50) in enumerate(zip(YEARS, p50s), start=1):
        raw = (spread * math.sqrt(i) if absolute else p50 * spread * math.sqrt(i)) * scale
        mid = round(p50 * unit)
        width = max(round(raw * unit), prev + 2)
        prev = width
        low, high = mid - round(0.58 * width), mid + (width - round(0.58 * width))
        points.append({"year": year, "p10": low / unit, "p50": mid / unit, "p90": high / unit})
    return points


def _growth_path(base, rate_by_year):
    out, level = [], base
    for rate in rate_by_year:
        level *= math.exp(rate)
        out.append(level)
    return out


def gen_forecast(rng, economy, resources):
    """Scenarios, the AI overlay and the provinces, all continuing from the last observed value of 2025."""
    last = {r["indicator"]: r["value"] for r in economy if r["country"] == "ARG" and r["year"] == 2025}
    n = len(YEARS)
    gdp_pc_rate = {"pessimistic": 0.003, "expected": 0.016, "optimistic": 0.028}
    pop_rate = {"pessimistic": (0.004, -0.002), "expected": (0.006, 0.001), "optimistic": (0.008, 0.003)}
    hdi_target = {"pessimistic": 0.89, "expected": 0.93, "optimistic": 0.95}
    series = []

    def add(indicator, geo, scenario, ai, unit, points, resource=None):
        s = {"indicator": indicator, "geo": geo, "scenario": scenario, "ai_overlay": ai, "unit": unit,
             "points": points}
        if resource:
            s["resource"] = resource
        series.append(s)

    ar = {}
    for scenario in ("pessimistic", "expected", "optimistic"):
        pop_p50 = _growth_path(last["population"], [pop_rate[scenario][0] + (pop_rate[scenario][1] - pop_rate[scenario][0]) * k / n for k in range(1, n + 1)])
        for ai in ("off", "on"):
            uplift = [sum(0.004 * min(j, 15) / 15 for j in range(1, k + 1)) for k in range(1, n + 1)] if ai == "on" else [0.0] * n
            pc_p50 = [last["gdp_per_capita_usd"] * math.exp(gdp_pc_rate[scenario] * k + uplift[k - 1]) for k in range(1, n + 1)]
            gdp_p50 = [a * b for a, b in zip(pc_p50, pop_p50)]
            h25 = last["hdi"]
            hdi_p50 = [h25 + (hdi_target[scenario] - h25) * (1 - math.exp(-0.045 * k)) + (0.004 * min(k, 15) / 15 if ai == "on" else 0.0) for k in range(1, n + 1)]
            wide = 1.15 if ai == "on" else 1.0
            ar[(scenario, ai)] = {
                "gdp_per_capita_usd": _finish(pc_p50, 0.045, 0, wide), "gdp_constant_usd": _finish(gdp_p50, 0.05, 0, wide),
                "population": _finish(pop_p50, 0.012, 0), "hdi": _finish(hdi_p50, 0.012, 4, wide, absolute=True),
            }
            for indicator, unit in (("gdp_constant_usd", "USD"), ("gdp_per_capita_usd", "USD"), ("population", "personas"), ("hdi", "índice")):
                add(indicator, "AR", scenario, ai, unit, ar[(scenario, ai)][indicator])
            # the provinces: constant shares of the national population and GDP
            pop_share = province_shares(2025)
            gdp_share = province_income_shares()
            for province in PROVINCES:
                add("population", province, scenario, ai, "personas", _finish([v * pop_share[province] for v in pop_p50], 0.012, 0))
                add("gdp_constant_usd", province, scenario, ai, "USD", _finish([v * gdp_share[province] for v in gdp_p50], 0.05, 0, wide))
                factor = gdp_share[province] / pop_share[province]
                add("gdp_per_capita_usd", province, scenario, ai, "USD", _finish([v * factor for v in pc_p50], 0.045, 0, wide))

    # resources: the 2025 value of each province and of the country grown at the rate of the scenario
    for resource, provinces in RESOURCE_SHARES.items():
        base = {r["geo"]: r["value"] for r in resources if r["resource"] == resource and r["year"] == 2025}
        for scenario, rate in zip(("pessimistic", "expected", "optimistic"), RESOURCE_GROWTH[resource]):
            for geo in ["AR", *provinces]:
                p50 = [max(base[geo], 0.001) * math.exp(rate * k) for k in range(1, n + 1)]
                points = _finish(p50, 0.06, 3)
                for ai in ("off", "on"):
                    add("resource_production", geo, scenario, ai, RESOURCE_UNITS[resource], points, resource)

    return {
        "model_version": "1.0.0-mock",
        "generated_at": RETRIEVED_AT,
        "source": "MOCK",
        "horizon": {"start_year": 2026, "end_year": 2056},
        "series": series,
    }


# (group, category id, label, weight in the economy) and, for GDP, the year the category starts to exist
GDP_SECTORS = [
    ("Agro", "agricultura-y-ganaderia", "Agricultura y ganadería", 7.5, 0),
    ("Agro", "pesca-y-forestal", "Pesca y forestal", 1.0, 0),
    ("Industria", "alimentos-y-bebidas", "Alimentos y bebidas", 7.5, 0),
    ("Industria", "quimica-y-plasticos", "Química y plásticos", 3.0, 0),
    ("Industria", "automotriz", "Industria automotriz", 2.0, 0),
    ("Industria", "otras-industrias", "Otras industrias", 6.0, 0),
    ("Industria", "construccion", "Construcción", 4.0, 0),
    ("Energía y minería", "petroleo-y-gas", "Petróleo y gas", 3.5, 0),
    ("Energía y minería", "mineria", "Minería", 1.0, 0),
    ("Energía y minería", "electricidad-y-agua", "Electricidad y agua", 2.5, 0),
    ("Servicios", "comercio", "Comercio", 13.0, 0),
    ("Servicios", "transporte-y-comunicaciones", "Transporte y comunicaciones", 8.0, 0),
    ("Servicios", "finanzas-e-inmobiliario", "Finanzas e inmobiliario", 12.0, 0),
    ("Servicios", "administracion-publica", "Administración pública", 6.0, 0),
    ("Servicios", "educacion-y-salud", "Educación y salud", 8.0, 0),
    ("Servicios", "servicios-del-conocimiento", "Servicios del conocimiento", 5.0, 2005),
    ("Servicios", "otros-servicios", "Otros servicios", 9.5, 0),
]
EXPORT_PRODUCTS = [
    ("Agro", "complejo-sojero", "Soja y derivados", 27.0),
    ("Agro", "maiz", "Maíz", 9.0),
    ("Agro", "trigo", "Trigo", 5.0),
    ("Agro", "carnes", "Carnes", 5.0),
    ("Industria", "automotriz", "Vehículos y autopartes", 8.0),
    ("Industria", "quimica", "Química", 5.0),
    ("Industria", "alimentos-industriales", "Alimentos industriales", 5.0),
    ("Energía", "petroleo-y-gas", "Petróleo y gas", 8.0),
    ("Minería", "litio", "Litio", 3.0),
    ("Minería", "oro-y-plata", "Oro y plata", 5.0),
    ("Minería", "cobre", "Cobre", 1.0),
]


def gen_composition(rng, economy):
    """GDP by sector and exports by product of Argentina, 2000 to 2025, as shares of the totals of the economy file."""
    by_year = {(r["indicator"], r["year"]): r["value"] for r in economy if r["country"] == "ARG"}
    data = []
    nulls_added = 0
    for kind, indicator, table in (("gdp_by_sector", "gdp_constant_usd", GDP_SECTORS),
                                   ("exports_by_product", "exports_usd", EXPORT_PRODUCTS)):
        rows = [(*t, 0) if len(t) == 4 else t for t in table]
        weights = {t[1]: t[3] for t in rows}
        drift = {t[1]: rng.uniform(0.992, 1.008) for t in rows}
        for year in range(2000, 2026):
            for key in weights:
                weights[key] *= drift[key]
            present = [t for t in rows if year >= t[4]]
            total = sum(weights[t[1]] for t in present)
            for group, category, label, _weight, _start in present:
                record = {"kind": kind, "year": year, "group": group, "category": category, "label": label,
                          "value_usd": round(by_year[(indicator, year)] * weights[category] / total),
                          "source": "MOCK", "retrieved_at": RETRIEVED_AT}
                if nulls_added < 2 and year == 2012 and category in ("mineria", "cobre"):
                    record["value_usd"] = None
                    record["note"] = "Dato faltante (mock ilustrativo)"
                    nulls_added += 1
                data.append(record)
    return data


PROJECT_NAMES = {
    "lithium": ["Salar del Norte", "Salar Altiplano", "Laguna Verde", "Salinas Grandes", "Cuenca Austral"],
    "copper": ["Cerro Alto", "Mina del Oeste", "Pórfido Andino", "Cordón Rojo"],
    "gold": ["Veta Dorada", "Cerro Brillante", "Quebrada Seca", "Mesa Austral"],
    "oil": ["Bloque Meseta", "Área Cuenca Sur", "Yacimiento Costa", "Formación Profunda"],
    "gas": ["Campo del Valle", "Bloque Austral", "Planta Cordillera", "Gasoducto Sur"],
}
PROJECT_COMPANIES = ["Compañía Andina", "Minera Austral", "Energía del Sur", "Recursos Patagonia", "Grupo Cordillera",
                     "Explotaciones del Norte"]


def gen_projects(rng, resource_provs):
    data = []
    nulls_added = 0
    resources = ["lithium", "copper", "gold", "oil", "gas"]
    statuses = ["operating", "ramp_up", "construction", "approved", "feasibility", "prefeasibility", "exploration", "announced"]

    status_pool = statuses * 2 + [rng.choice(statuses) for _ in range(30 - 16)]
    rng.shuffle(status_pool)

    for i in range(30):
        r = rng.choice(resources)
        geo = rng.choice(resource_provs[r])
        has_capacity = rng.choice([True, False])
        names = PROJECT_NAMES[r]
        company = PROJECT_COMPANIES[i % len(PROJECT_COMPANIES)]

        record = {
            "id": f"mock-proj-{i}",
            "name": f"{names[i % len(names)]} {i // len(names) + 1}",
            "resource": r,
            "geo": geo,
            "status": status_pool[i],
            "company": f"{company} (ilustrativa)",
            "owners": [f"{company} (ilustrativa)", f"Socio {i % 4 + 1} (ilustrativo)"],
            "capex_usd": round(rng.uniform(1e6, 1e9), 2),
            "start_year": rng.randint(2020, 2035),
            "capacity_per_year": round(rng.uniform(1000, 50000), 2) if has_capacity else None,
            "capacity_unit": "t_per_year" if has_capacity else None,
            "source": "MOCK",
            "retrieved_at": RETRIEVED_AT
        }

        if not has_capacity:
            record["note"] = "Capacidad faltante (mock ilustrativo)"

        if nulls_added < 3 and rng.random() < 0.2:
            record["capex_usd"] = None
            if "note" in record:
                record["note"] += "; capex faltante (mock ilustrativo)"
            else:
                record["note"] = "Capex faltante (mock ilustrativo)"
            nulls_added += 1

        data.append(record)

    while nulls_added < 3:
        idx = rng.randint(0, len(data) - 1)
        if data[idx].get("capex_usd") is not None:
            data[idx]["capex_usd"] = None
            data[idx]["note"] = "Capex faltante (mock ilustrativo)"
            nulls_added += 1

    return data

def gen_projections(rng, projects, resource_provs):
    data = []
    
    def get_unit_basis(resource):
        if resource == "lithium": return "lce"
        if resource == "copper": return "contained_cu"
        return None

    # Projects
    advanced_statuses = {"operating", "ramp_up", "construction", "approved"}
    null_bounds_added = 0
    disagreements_added = 0

    for proj in projects:
        ub = get_unit_basis(proj["resource"])
        base_record = {
            "entity_type": "project",
            "project_id": proj["id"],
            "geo": proj["geo"],
            "resource": proj["resource"],
            "unit": proj["capacity_unit"] or "t_per_year",
            "scenario": "base",
            "source": "MOCK",
            "retrieved_at": RETRIEVED_AT
        }
        if ub: base_record["unit_basis"] = ub

        start_year = proj["start_year"] or 2025
        nameplate = proj["capacity_per_year"] or 10000

        if proj["status"] in advanced_statuses:
            end_year = min(start_year + 14, 2040)
            for y in range(start_year, end_year + 1):
                # ramp linearly to nameplate in 3 years
                ramp_factor = min((y - start_year + 1) / 3, 1.0)
                val = nameplate * ramp_factor
                rec = dict(base_record)
                rec.update({"metric": "production_expected", "year": y, "value": val})
                
                # add disagreement
                if disagreements_added < 4 and y == start_year + 2 and rng.random() < 0.3:
                    rec["confidence"] = "high"
                    rec2 = dict(rec)
                    rec2["source"] = "MOCK2"
                    rec2["value"] = val * 0.8
                    rec2["confidence"] = "medium"
                    data.append(rec2)
                    disagreements_added += 1
                
                data.append(rec)
            
            # capacity_nameplate row at start_year + 3
            cap_rec = dict(base_record)
            cap_rec.update({"metric": "capacity_nameplate", "year": start_year + 3, "value": nameplate})
            data.append(cap_rec)
        else:
            # only capacity_nameplate row
            cap_rec = dict(base_record)
            cap_rec.update({"metric": "capacity_nameplate", "year": start_year + 3, "value": nameplate})
            
            if null_bounds_added < 3 and rng.random() < 0.3:
                cap_rec["value"] = None
                cap_rec["value_low"] = nameplate * 0.8
                cap_rec["value_high"] = nameplate * 1.2
                null_bounds_added += 1
                
            data.append(cap_rec)
            
    while null_bounds_added < 3:
        # find an early-stage project row to modify
        for row in data:
            if row["metric"] == "capacity_nameplate" and row.get("value") is not None:
                v = row["value"]
                row["value"] = None
                row["value_low"] = v * 0.8
                row["value_high"] = v * 1.2
                null_bounds_added += 1
                if null_bounds_added >= 3:
                    break

    while disagreements_added < 4:
        # force disagreement on an existing production_expected row
        for row in data:
            if row["metric"] == "production_expected" and row["source"] == "MOCK":
                row["confidence"] = "high"
                r2 = dict(row)
                r2["source"] = "MOCK2"
                r2["value"] = row["value"] * 0.9
                r2["confidence"] = "medium"
                data.append(r2)
                disagreements_added += 1
                if disagreements_added >= 4:
                    break

    # Provinces forecast
    resources_selected = rng.sample(["lithium", "copper", "gold", "oil", "gas"], 3)
    pairs = []
    for r in resources_selected:
        pairs.extend((p, r) for p in rng.sample(sorted(RESOURCE_SHARES[r]), 2))
    for p, r in pairs:
            ub = get_unit_basis(r)
            for y in range(2026, 2036):
                val_base = 1000 + (y - 2026) * 50
                for scen, mul in [("low", 0.8), ("base", 1.0), ("high", 1.2)]:
                    rec = {
                        "entity_type": "province",
                        "geo": p,
                        "resource": r,
                        "metric": "forecast",
                        "year": y,
                        "value": val_base * mul,
                        "unit": "t_per_year",
                        "scenario": scen,
                        "source": "MOCK",
                        "retrieved_at": RETRIEVED_AT
                    }
                    if ub: rec["unit_basis"] = ub
                    data.append(rec)

    # National forecast
    for r in ["lithium", "copper", "oil"]:
        ub = get_unit_basis(r)
        for y in range(2026, 2036):
            rec = {
                "entity_type": "national",
                "geo": "AR",
                "resource": r,
                "metric": "forecast",
                "year": y,
                "value": 50000 + (y - 2026) * 2000,
                "unit": "t_per_year",
                "scenario": "base",
                "source": "MOCK",
                "retrieved_at": RETRIEVED_AT
            }
            if ub: rec["unit_basis"] = ub
            data.append(rec)
            
    # National agriculture forecast
    for r in ["soy", "corn", "wheat"]:
        for y in range(2026, 2036):
            period = f"{y-1}/{str(y)[2:]}"
            rec = {
                "entity_type": "national",
                "geo": "AR",
                "resource": r,
                "metric": "forecast",
                "year": y,
                "period_label": period,
                "value": 30000000 + (y - 2026) * 1000000,
                "unit": "t",
                "scenario": "base",
                "source": "MOCK",
                "retrieved_at": RETRIEVED_AT
            }
            data.append(rec)

    return data

def gen_external_forecasts(rng):
    forecasters = ["MOCK_IMF", "MOCK_WB", "MOCK_OECD"]
    indicators = ["gdp_growth_real_pct", "population", "fertility_rate"]
    variants = ["low", "medium", "high"]
    mappings = ["pessimistic", "expected", "optimistic"]
    
    data = []
    i = 0
    base_record = {
        "publication_title": "Report",
        "vintage": "2026",
        "price_basis": None,
        "mapping_rationale": None,
        "scenario_by_source": None,
        "variant": None,
        "assumptions": None,
        "source_url": None,
        "locator": None,
        "snippet": None,
        "confidence": "high",
        "retrieved_at": RETRIEVED_AT
    }
    for f in forecasters:
        for ind in indicators:
            geos = ["AR"]
            if ind == "population":
                geos.extend(["AR-A", "AR-B", "AR-C"])
            
            for geo in geos:
                for y in range(2025, 2057):
                    # UN-style rows
                    if ind == "population":
                        base_val = 45.0 + (y - 2025) * 0.1
                        for v, m in zip(variants, mappings):
                            val = base_val
                            if v == "low": val -= 1.0
                            if v == "high": val += 1.0
                            i += 1
                            rec = dict(base_record)
                            rec.update({
                                "id": f"ef{i}",
                                "forecaster": f,
                                "indicator": ind,
                                "geo": geo,
                                "year": y,
                                "value": round(val, 2),
                                "value_low": None,
                                "value_high": None,
                                "unit": "millions",
                                "scenario_mapping": m,
                                "mapping_rationale": "mock rationale",
                                "variant": v,
                                "source_id": f"mock:M{i:03d}",
                                "source": "MOCK"
                            })
                            data.append(rec)
                    else:
                        # other indicators
                        val_opt = 3.0
                        val_exp = 2.0
                        val_pes = 1.0
                        
                        i += 1
                        rec_pes = dict(base_record)
                        rec_pes.update({
                            "id": f"ef{i}_pes", "forecaster": f, "indicator": ind, "geo": geo, "year": y,
                            "value": val_pes, "value_low": None, "value_high": None, "unit": "pct", "scenario_mapping": "pessimistic", "mapping_rationale": "r", "source_id": f"mock:M{i:03d}p", "source": "MOCK"
                        })
                        data.append(rec_pes)
                        
                        rec_exp = dict(base_record)
                        rec_exp.update({
                            "id": f"ef{i}_exp", "forecaster": f, "indicator": ind, "geo": geo, "year": y,
                            "value": val_exp, "value_low": None, "value_high": None, "unit": "pct", "scenario_mapping": "expected", "mapping_rationale": "r", "source_id": f"mock:M{i:03d}e", "source": "MOCK"
                        })
                        data.append(rec_exp)
                        
                        rec_opt = dict(base_record)
                        rec_opt.update({
                            "id": f"ef{i}_opt", "forecaster": f, "indicator": ind, "geo": geo, "year": y,
                            "value": val_opt, "value_low": None, "value_high": None, "unit": "pct", "scenario_mapping": "optimistic", "mapping_rationale": "r", "source_id": f"mock:M{i:03d}o", "source": "MOCK"
                        })
                        data.append(rec_opt)

    # at least 2 rows with not_stated
    rec_ns1 = dict(base_record)
    rec_ns1.update({
        "id": "ef_ns1", "forecaster": "MOCK_IMF", "indicator": "gdp_growth_real_pct", "geo": "AR", "year": 2026,
        "value": 1.0, "value_low": None, "value_high": None, "unit": "pct", "scenario_mapping": "not_stated", "source_id": "mock:NS1", "source": "MOCK"
    })
    data.append(rec_ns1)
    
    rec_ns2 = dict(base_record)
    rec_ns2.update({
        "id": "ef_ns2", "forecaster": "MOCK_IMF", "indicator": "gdp_growth_real_pct", "geo": "AR", "year": 2026,
        "value": 1.0, "value_low": None, "value_high": None, "unit": "pct", "scenario_mapping": "not_stated", "source_id": "mock:NS2", "source": "MOCK"
    })
    data.append(rec_ns2)

    # at least 3 rows with value: null and a range or a note
    for j in range(3):
        rec_null = dict(base_record)
        rec_null.update({
            "id": f"ef_null_{j}", "forecaster": "MOCK_IMF", "indicator": "gdp_growth_real_pct", "geo": "AR", "year": 2026,
            "value": None, "value_low": None, "value_high": None, "unit": "pct", "scenario_mapping": "not_stated", "source_id": f"mock:NULL{j}", "source": "MOCK", "note": "null value"
        })
        data.append(rec_null)

    return data

def gen_forecast_vintages(rng):
    data = []
    i = 0
    base_record = {
        "source_url": None,
        "locator": None,
        "snippet": None
    }
    for f in ["MOCK_IMF", "MOCK_WB"]:
        for ty in range(2008, 2021):
            for hy in range(1, 6):
                i += 1
                vy = ty - hy
                rec = dict(base_record)
                rec.update({
                    "id": f"fv{i}",
                    "forecaster": f,
                    "vintage_date": f"{vy}-04-01",
                    "indicator": "gdp_growth_real_pct",
                    "target_year": ty,
                    "horizon_years": hy,
                    "forecast_value": round(rng.uniform(-5.0, 8.0), 1),
                    "unit": "pct",
                    "source_id": f"mock:M{i:03d}",
                    "source": "MOCK",
                    "confidence": "high",
                    "retrieved_at": RETRIEVED_AT
                })
                data.append(rec)
    return data

def gen_base_rates(rng):
    data = []
    base_record = {
        "source_url": None,
        "locator": None,
        "snippet": None
    }
    for i in range(5):
        rec = dict(base_record)
        rec.update({
            "id": f"br{i}",
            "description": "desc",
            "country_or_group": "AR",
            "period": "1990-2000",
            "metric": "gdp",
            "value": 2.0,
            "unit": "pct",
            "definition": "def",
            "source_id": f"mock:M{i:03d}",
            "source": "MOCK",
            "confidence": "high",
            "retrieved_at": RETRIEVED_AT
        })
        data.append(rec)
    
    rec_null = dict(base_record)
    rec_null.update({
        "id": "br_null",
        "description": "desc",
        "country_or_group": "AR",
        "period": "1990-2000",
        "metric": "gdp",
        "value": None,
        "unit": "pct",
        "definition": "def",
        "source_id": "mock:M_null",
        "source": "MOCK",
        "confidence": "high",
        "retrieved_at": RETRIEVED_AT,
        "note": "null value"
    })
    data.append(rec_null)
    return data

def gen_ai_estimates(rng):
    data = []
    
    base_record = {
        "sponsor_conflict_note": None,
        "geography_detail": None,
        "value_low": None,
        "value_high": None,
        "scenario_by_source": None,
        "mapping_rationale": None,
        "key_assumptions": None,
        "derived_annualized_pp": None,
        "derivation": None,
        "source_url": None,
        "locator": None,
        "snippet": None
    }
    
    metrics = ["tfp_level_gain_pct_cumulative", "labor_productivity_gain_pct_cumulative", "employment_exposed_pct"]
    geos = ["argentina", "global", "us"]
    pubs = ["peer_reviewed", "consultancy", "think_tank"]
    
    for i in range(6):
        rec = dict(base_record)
        rec.update({
            "id": f"a{i}", "authors_or_institution": "A", "title": "T", "publication_date": "2026-01-01",
            "publisher_type": pubs[i % 3], "record_type": "projection", "geography": geos[i % 3],
            "outcome_metric": metrics[0], "horizon_start_year": 2026, "horizon_end_year": 2036,
            "value": 10.0, "unit": "pct", "scenario_mapping": "not_stated", "method": "expert_judgment",
            "time_profile": "linear", "derived_annualized_pp": 0.96, "derivation": "d",
            "source_id": f"mock:M{i:03d}", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
        })
        data.append(rec)
    
    # 2 sponsor conflicts
    data[0]["sponsor_conflict_note"] = "C1"
    data[1]["sponsor_conflict_note"] = "C2"
    
    rec_pes = dict(base_record)
    rec_pes.update({
        "id": "a_pes", "authors_or_institution": "A", "title": "T", "publication_date": "2026-01-01",
        "publisher_type": "consultancy", "record_type": "projection", "geography": "argentina",
        "outcome_metric": "tfp_level_gain_pct_cumulative", "horizon_start_year": 2026, "horizon_end_year": 2036,
        "value": 1.0, "value_low": 0.5, "value_high": 1.5, "unit": "pct", "scenario_mapping": "pessimistic", "mapping_rationale": "r", "method": "expert_judgment",
        "time_profile": "linear", "source_id": "mock:M_pes", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
    })
    data.append(rec_pes)
    
    rec_opt = dict(base_record)
    rec_opt.update({
        "id": "a_opt", "authors_or_institution": "A", "title": "T", "publication_date": "2026-01-01",
        "publisher_type": "consultancy", "record_type": "projection", "geography": "argentina",
        "outcome_metric": "tfp_level_gain_pct_cumulative", "horizon_start_year": 2026, "horizon_end_year": 2036,
        "value": 6.0, "value_low": 5.0, "value_high": 7.0, "unit": "pct", "scenario_mapping": "optimistic", "mapping_rationale": "r", "method": "expert_judgment",
        "time_profile": "linear", "source_id": "mock:M_opt", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
    })
    data.append(rec_opt)
    
    rec_exp = dict(base_record)
    rec_exp.update({
        "id": "a_exp", "authors_or_institution": "A", "title": "T", "publication_date": "2026-01-01",
        "publisher_type": "consultancy", "record_type": "projection", "geography": "argentina",
        "outcome_metric": "tfp_level_gain_pct_cumulative", "horizon_start_year": 2026, "horizon_end_year": 2036,
        "value": 3.0, "unit": "pct", "scenario_mapping": "expected", "mapping_rationale": "r", "method": "expert_judgment",
        "time_profile": "linear", "source_id": "mock:M_exp", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
    })
    data.append(rec_exp)
    
    # 2 observed
    for i in range(2):
        rec_obs = dict(base_record)
        rec_obs.update({
            "id": f"a_obs{i}", "authors_or_institution": "A", "title": "T", "publication_date": "2026-01-01",
            "publisher_type": "consultancy", "record_type": "observed", "geography": "global",
            "outcome_metric": "tfp_growth_pp_per_year", "horizon_start_year": 2020, "horizon_end_year": 2025,
            "value": 0.5, "unit": "pp", "scenario_mapping": "not_stated", "method": "expert_judgment",
            "time_profile": "linear", "source_id": f"mock:M_obs{i}", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
        })
        data.append(rec_obs)
        
    # 2 exposure
    for i in range(3):
        rec_expo = dict(base_record)
        rec_expo.update({
            "id": f"a_expo{i}", "authors_or_institution": "A", "title": "T", "publication_date": "2026-01-01",
            "publisher_type": "consultancy", "record_type": "exposure", "geography": "global",
            "outcome_metric": "employment_exposed_pct", "horizon_start_year": 2026, "horizon_end_year": 2036,
            "value": 20.0, "unit": "pct", "scenario_mapping": "not_stated", "method": "expert_judgment",
            "time_profile": "not_stated", "source_id": f"mock:M_expo{i}", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
        })
        data.append(rec_expo)
        
    return data

def gen_dataset_catalog(rng):
    data = []
    base_record = {
        "version": None,
        "direct_download_url": None,
        "license_or_terms": None,
        "revisions_or_rebasing_notes": None,
        "recommended_use": None,
        "source_url": None,
        "locator": None,
        "snippet": None
    }
    
    uses = ["calibration", "baseline", "scenario_structure"]
    for i in range(4):
        rec = dict(base_record)
        rec.update({
            "dataset_name": f"D{i}", "publisher": "P", "landing_url": "https://a.com",
            "variables": ["v"], "geographies": ["g"], "years_covered": "y", "frequency": "f",
            "format": "csv", "access": "opened", "recommended_use": uses[i % 3],
            "source_id": f"mock:M{i:03d}", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
        })
        data.append(rec)
        
    rec_no = dict(base_record)
    rec_no.update({
        "dataset_name": "D_not_opened", "publisher": "P", "landing_url": "https://a.com",
        "variables": ["v"], "geographies": ["g"], "years_covered": "y", "frequency": "f",
        "format": "csv", "access": "not_opened", "recommended_use": "calibration",
        "note": "need request",
        "source_id": "mock:M_no", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
    })
    data.append(rec_no)
    return data

def main(out_dir: str):
    rng = random.Random(SEED)
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    
    eco = gen_economy(rng)
    dump_json(eco, out / "economy_series.json")

    rp, rprovs = gen_resource_production(rng)
    dump_json(rp, out / "resource_production.json")
    
    pop = gen_population(rng)
    dump_json(pop, out / "population.json")
    
    andes = gen_andes_events(rng)
    dump_json(andes, out / "andes_events.json")
    
    fc = gen_forecast(rng, eco, rp)
    dump_json_compact(fc, out / "forecast_output.json")
    
    comp = gen_composition(rng, eco)
    dump_json(comp, out / "composition.json")
    
    proj = gen_projects(rng, rprovs)
    dump_json(proj, out / "projects.json")
    
    projs = gen_projections(rng, proj, rprovs)
    dump_json(projs, out / "production_projections.json")
    
    ext = gen_external_forecasts(rng)
    dump_json(ext, out / "external_forecasts.json")
    
    vint = gen_forecast_vintages(rng)
    dump_json(vint, out / "forecast_vintages.json")
    
    base = gen_base_rates(rng)
    dump_json(base, out / "base_rates.json")
    
    ai = gen_ai_estimates(rng)
    dump_json(ai, out / "ai_estimates.json")
    
    cat = gen_dataset_catalog(rng)
    dump_json(cat, out / "dataset_catalog.json")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "data/mock"
    main(out)
