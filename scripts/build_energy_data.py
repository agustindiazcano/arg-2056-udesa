"""Builds web/src/tour/energyArgentina.json from the open data of the Secretaría de Energía (datos.energia.gob.ar, CKAN):
- national and provincial production of oil and gas (monthly daily averages, SESCO / capítulo IV), 2009 to the last month;
- the series of national oil production since 1950;
- the proved reserves at 31/12/2025 (all fields, to the end of useful life).

It feeds step 9 (national oil production), the Data tables of steps 2, 7 and 13. Run: python scripts/build_energy_data.py
"""
import collections
import csv
import io
import json
import urllib.request
import zipfile
from datetime import date
from pathlib import Path

import openpyxl

OUT = Path(__file__).resolve().parent.parent / 'web' / 'src' / 'tour' / 'energyArgentina.json'
CKAN = 'http://datos.energia.gob.ar/api/3/action/package_show?id='
BBL_PER_M3 = 6.28981
LAST_YEAR = 2025
PROVINCE_NAMES = {'Rio Negro': 'Río Negro', 'Cordoba': 'Córdoba'}


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, timeout=180).read()


def resources(package):
    return json.loads(get(CKAN + package))['result']['resources']


def find(res, *words):
    for r in res:
        name = (r.get('name') or '').lower()
        if all(w in name for w in words):
            return r['url']
    raise SystemExit(f'resource not found: {words}')


def rows(url):
    return list(csv.DictReader(io.StringIO(get(url).decode('utf-8-sig'))))


def year_average(records, value_key, group_key=None):
    """Average of the monthly daily averages of each year (and of each group), summing the groups of each month first."""
    months = collections.defaultdict(float)
    for r in records:
        key = (int(r['anio']), int(r['mes']), r[group_key] if group_key else None)
        months[key] += float(r[value_key] or 0)
    per_year = collections.defaultdict(lambda: collections.defaultdict(list))
    for (y, m, g), v in months.items():
        per_year[y][g].append(v)
    return {y: {g: sum(v) / len(v) for g, v in groups.items() if len(v) == 12} for y, groups in per_year.items()}


def main():
    prod = resources('produccion-de-petroleo-y-gas-tablas-dinamicas')
    oil_prov = rows(find(prod, 'petr', 'promedio diaria por provincia'))
    gas_prov = rows(find(prod, 'gas', 'promedio diaria por provincia'))
    oil_y = year_average(oil_prov, 'produccion_petroleo_promedio_dia_m3')
    gas_y = year_average(gas_prov, 'produccion_gas_promedio_dia_mm3')
    oil_by_prov = year_average(oil_prov, 'produccion_petroleo_promedio_dia_m3', 'provincia')
    gas_by_prov = year_average(gas_prov, 'produccion_gas_promedio_dia_mm3', 'provincia')

    national = {}
    for y in sorted(oil_by_prov):
        if y > LAST_YEAR or not oil_by_prov[y]:
            continue
        national[y] = {
            'oil_kbd': round(sum(oil_by_prov[y].values()) * BBL_PER_M3 / 1000, 1),  # thousand barrels a day
            'gas_mmm3d': round(sum(gas_by_prov.get(y, {}).values()) / 1000, 1),  # million cubic metres a day
        }

    provinces = []
    names = set(oil_by_prov[LAST_YEAR]) | set(gas_by_prov[LAST_YEAR])
    for p in names:
        provinces.append({
            'province': PROVINCE_NAMES.get(p, p),
            'oil_kbd': round(oil_by_prov[LAST_YEAR].get(p, 0) * BBL_PER_M3 / 1000, 1),
            'gas_mmm3d': round(gas_by_prov[LAST_YEAR].get(p, 0) / 1000, 2),
        })
    provinces.sort(key=lambda r: -r['oil_kbd'])

    since1950 = [(int(r['anio']), round(float(r['produccion_petroleo']), 1)) for r in rows('http://www.energia.gob.ar/contenidos/archivos/Reorganizacion/informacion_del_mercado/mercado_hidrocarburos/informacion_estadistica/serie-produccion-petroleo-total-pais-desde-1950.csv')]

    res = resources('reservas-de-petroleo-y-gas')
    zip_url = next(r['url'] for r in res if 'Reservas al 31/12/2025' in (r.get('name') or ''))
    with zipfile.ZipFile(io.BytesIO(get(zip_url))) as z:
        wb = openpyxl.load_workbook(io.BytesIO(z.read(z.namelist()[0])), read_only=True, data_only=True)
    ws = wb['fin de vida util']
    total = next(row for row in ws.iter_rows(values_only=True) if row[0] == 'TOTAL')
    # columns: 5 and 6 conventional proved (oil Mm3, gas MMm3), 13 and 14 non-conventional proved, 21 and 22 both; probable 23-24; possible 25-26
    reserves = {
        'date': '2025-12-31',
        'basis': 'hasta el final de la vida útil de los yacimientos',
        'proved': {'oil_mm3': round(total[21]), 'gas_mmm3': round(total[22])},
        'probable': {'oil_mm3': round(total[23]), 'gas_mmm3': round(total[24])},
        'possible': {'oil_mm3': round(total[25]), 'gas_mmm3': round(total[26])},
        'proved_conventional': {'oil_mm3': round(total[5]), 'gas_mmm3': round(total[6])},
        'proved_non_conventional': {'oil_mm3': round(total[13]), 'gas_mmm3': round(total[14])},
    }

    OUT.write_text(json.dumps({
        'source': 'Secretaría de Energía, datos abiertos (datos.energia.gob.ar)',
        'url': 'https://datos.energia.gob.ar',
        'retrieved_at': date.today().isoformat(),
        'note': 'Petróleo en miles de barriles por día (1 m3 = 6,28981 barriles) y gas en millones de m3 por día, promedio de los 12 meses de cada año; las provincias suman el total.',
        'national': {str(y): v for y, v in national.items()},
        'provinces2025': provinces,
        'oilSince1950Mm3': since1950,
        'reserves': reserves,
    }, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
    print('national 2025', national[LAST_YEAR], '| 2015', national[2015], '| provinces', len(provinces), '| 1950 series', since1950[0], since1950[-1])
    print('reserves', reserves['proved'])


if __name__ == '__main__':
    main()
