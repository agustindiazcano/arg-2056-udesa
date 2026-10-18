"""Builds web/src/tour/worldGdp.json: REAL GDP (constant 2015 US dollars, "precios constantes") and population of the world's economies, 1960 to the
last year, from the World Bank WDI API (NY.GDP.MKTP.KD, SP.POP.TOTL). It feeds step 0 of the Recorrido (the world ranking and the region).

Real GDP at constant prices is the one the project uses (human decision of 2026-10-13). The file keeps the countries that were among the 25 largest economies, or among the 25 richest per
person (with at least one million people), in any year, plus the ten largest of Latin America and the Caribbean today and Uruguay; and, for Argentina, its place
among every country of the World Bank in each year, computed here. It also keeps that place (`ranks`) for the countries the big chart of slide 1 compares, and the
World Bank aggregate of Latin America and the Caribbean (`LCN`: real GDP and its annual growth, `regionAggregate`).

Run: python scripts/build_world_gdp.py
"""
import json
import urllib.request
from datetime import date
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'web' / 'src' / 'tour' / 'worldGdp.json'
FIRST, LAST = 1960, 2025
API = 'https://api.worldbank.org/v2'

ES = {
    'USA': 'Estados Unidos', 'CHN': 'China', 'DEU': 'Alemania', 'JPN': 'Japón', 'IND': 'India', 'GBR': 'Reino Unido', 'FRA': 'Francia',
    'ITA': 'Italia', 'BRA': 'Brasil', 'CAN': 'Canadá', 'RUS': 'Rusia', 'MEX': 'México', 'KOR': 'Corea del Sur', 'AUS': 'Australia',
    'ESP': 'España', 'IDN': 'Indonesia', 'TUR': 'Turquía', 'NLD': 'Países Bajos', 'SAU': 'Arabia Saudita', 'CHE': 'Suiza', 'POL': 'Polonia',
    'TWN': 'Taiwán', 'BEL': 'Bélgica', 'THA': 'Tailandia', 'SWE': 'Suecia', 'IRL': 'Irlanda', 'ARG': 'Argentina', 'COL': 'Colombia',
    'CHL': 'Chile', 'PER': 'Perú', 'ECU': 'Ecuador', 'DOM': 'Rep. Dominicana', 'GTM': 'Guatemala', 'PAN': 'Panamá', 'URY': 'Uruguay',
    'VEN': 'Venezuela', 'NOR': 'Noruega', 'DNK': 'Dinamarca', 'AUT': 'Austria', 'FIN': 'Finlandia', 'ISR': 'Israel', 'ARE': 'Emiratos Árabes',
    'SGP': 'Singapur', 'HKG': 'Hong Kong', 'LUX': 'Luxemburgo', 'IRN': 'Irán', 'EGY': 'Egipto', 'NGA': 'Nigeria', 'ZAF': 'Sudáfrica',
    'PHL': 'Filipinas', 'MYS': 'Malasia', 'VNM': 'Vietnam', 'BGD': 'Bangladés', 'PAK': 'Pakistán', 'GRC': 'Grecia', 'PRT': 'Portugal',
    'CZE': 'Chequia', 'ROU': 'Rumania', 'HUN': 'Hungría', 'KWT': 'Kuwait', 'QAT': 'Qatar', 'ISL': 'Islandia', 'NZL': 'Nueva Zelanda',
    'BHR': 'Baréin', 'OMN': 'Omán', 'LBY': 'Libia', 'IRQ': 'Irak', 'DZA': 'Argelia', 'KAZ': 'Kazajistán', 'UKR': 'Ucrania', 'CUB': 'Cuba',
    'BHS': 'Bahamas', 'CYP': 'Chipre', 'MLT': 'Malta', 'SVN': 'Eslovenia', 'EST': 'Estonia', 'BRN': 'Brunéi', 'TTO': 'Trinidad y Tobago',
    'GAB': 'Gabón', 'GNQ': 'Guinea Ecuatorial', 'PRI': 'Puerto Rico', 'CRI': 'Costa Rica', 'BOL': 'Bolivia', 'PRY': 'Paraguay', 'SVK': 'Eslovaquia',
    'LTU': 'Lituania', 'LVA': 'Letonia', 'HRV': 'Croacia', 'BGR': 'Bulgaria', 'SRB': 'Serbia', 'MAC': 'Macao', 'LKA': 'Sri Lanka',
    'MAR': 'Marruecos', 'KEN': 'Kenia', 'ETH': 'Etiopía', 'GHA': 'Ghana', 'AGO': 'Angola', 'TUN': 'Túnez', 'SYR': 'Siria', 'JOR': 'Jordania',
    'LBN': 'Líbano', 'SLV': 'El Salvador', 'HND': 'Honduras', 'NIC': 'Nicaragua', 'CIV': 'Costa de Marfil', 'COD': 'Rep. Dem. del Congo',
    'BLR': 'Bielorrusia', 'AZE': 'Azerbaiyán', 'TKM': 'Turkmenistán', 'UZB': 'Uzbekistán', 'MMR': 'Myanmar', 'PRK': 'Corea del Norte',
    'SUN': 'Unión Soviética', 'CHI': 'Islas del Canal', 'GIB': 'Gibraltar', 'IMN': 'Isla de Man',
}


# Argentina's own population is the official one: INDEC, "Estimaciones y proyecciones de población, por sexo y edad. Total del país. Años 2022-2040"
# (Censo 2022, published in October 2025, mid-year, in millions). The World Bank has 45.85 for 2025 (the UN estimate) and the IMF 47.47 (the old INDEC
# projection of 2010, before the census). Before 2022 the World Bank series is kept, so there is a break of about 1 % at 2022.
# The countries whose place in the ranking the big chart of slide 1 shows at the tip of their line.
COMPARED = ['ARG', 'BRA', 'MEX', 'USA', 'AUS', 'JPN', 'DEU', 'CHL', 'URY', 'ESP']

ARG_POP_INDEC = {2022: 46.136, 2023: 46.214, 2024: 46.302, 2025: 46.387}


def fetch(path):
    with urllib.request.urlopen(f'{API}/{path}', timeout=90) as r:
        return json.load(r)


def series(indicator):
    data = fetch(f'country/all/indicator/{indicator}?format=json&per_page=20000&date={FIRST}:{LAST}')[1]
    out = {}
    for row in data:
        if row['value'] is None:
            continue
        out.setdefault(row['countryiso3code'], {})[int(row['date'])] = row['value']
    return out


def main():
    meta = fetch('country?format=json&per_page=400')[1]
    countries = {c['id']: c for c in meta if c['region']['id'] != 'NA'}  # the aggregates (World, regions, income groups) have region "NA"
    gdp_all = series('NY.GDP.MKTP.KD')
    pop_all = series('SP.POP.TOTL')
    gdp = {c: v for c, v in gdp_all.items() if c in countries}
    pop = {c: v for c, v in pop_all.items() if c in countries}
    years = list(range(FIRST, LAST + 1))

    chosen = set()
    rank_gdp, rank_pc = {}, {}
    ranks = {c: {'gdp': [], 'perCapita': []} for c in COMPARED}
    for y in years:
        by_gdp = sorted(((v[y], c) for c, v in gdp.items() if y in v), reverse=True)
        chosen.update(c for _, c in by_gdp[:25])
        pc = sorted(((gdp[c][y] / pop[c][y], c) for c in gdp if y in gdp[c] and y in pop.get(c, {}) and pop[c][y] >= 1_000_000), reverse=True)
        chosen.update(c for _, c in pc[:25])
        rank_gdp[y] = [c for _, c in by_gdp].index('ARG') + 1 if any(c == 'ARG' for _, c in by_gdp) else None
        rank_pc[y] = [c for _, c in pc].index('ARG') + 1 if any(c == 'ARG' for _, c in pc) else None
        for c in COMPARED:
            ranks[c]['gdp'].append([k for _, k in by_gdp].index(c) + 1 if any(k == c for _, k in by_gdp) else None)
            ranks[c]['perCapita'].append([k for _, k in pc].index(c) + 1 if any(k == c for _, k in pc) else None)
    lac = [c for c, m in countries.items() if m['region']['id'] == 'LCN' and c in gdp and LAST in gdp[c]]
    lac = [c for c in lac if c != 'PRI']  # a territory, not a country
    region = sorted(lac, key=lambda c: -gdp[c][LAST])[:10]
    if 'URY' not in region:  # Uruguay is always in the comparison of the region (human request)
        region = sorted(region + ['URY'], key=lambda c: -gdp[c][LAST])
    chosen.update(region)
    chosen.add('ARG')

    lcn_gdp = {y: v for y, v in gdp_all.get('LCN', {}).items()}
    lcn_growth = series('NY.GDP.MKTP.KD.ZG').get('LCN', {})
    for y, v in ARG_POP_INDEC.items():
        pop['ARG'][y] = v * 1e6
    out_countries = []
    for c in sorted(chosen, key=lambda c: -(gdp.get(c, {}).get(LAST) or 0)):
        out_countries.append({
            'code': c,
            'name': ES.get(c) or countries[c]['name'],
            'gdp': [round(gdp[c][y] / 1e9, 2) if y in gdp.get(c, {}) else None for y in years],
            'pop': [round(pop[c][y] / 1e6, 3) if y in pop.get(c, {}) else None for y in years],
        })
    missing = [c['name'] for c in out_countries if c['code'] not in ES]
    OUT.write_text(json.dumps({
        'source': 'Banco Mundial, WDI: NY.GDP.MKTP.KD (PBI en dólares constantes de 2015) y SP.POP.TOTL (población)',
        'url': 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.KD',
        'retrieved_at': date.today().isoformat(),
        'unit': 'miles de millones de USD de 2015 (PBI real, a precios constantes)',
        'argentinaPopulationSource': 'INDEC, Estimaciones y proyecciones de población 2022-2040 (Censo 2022), 2022 a 2025; antes, Banco Mundial',
        'firstYear': FIRST, 'lastYear': LAST, 'years': years,
        'region': region,
        'argentinaRank': {'gdp': [rank_gdp[y] for y in years], 'perCapita': [rank_pc[y] for y in years]},
        'ranks': ranks,
        'regionAggregate': {
            'code': 'LCN',
            'name': 'América Latina y el Caribe',
            'source': 'Banco Mundial, WDI, agregado LCN: NY.GDP.MKTP.KD (PBI en dólares constantes de 2015) y NY.GDP.MKTP.KD.ZG (crecimiento anual, %)',
            'gdp': [round(lcn_gdp[y] / 1e9, 2) if y in lcn_gdp else None for y in years],
            'growth': [round(lcn_growth[y], 3) if y in lcn_growth else None for y in years],
        },
        'countries': out_countries,
    }, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
    print(f'{len(out_countries)} countries, {OUT.stat().st_size // 1024} KB; region: {region}; English names left: {missing}')


if __name__ == '__main__':
    main()
