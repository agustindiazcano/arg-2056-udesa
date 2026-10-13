"""Builds web/src/tour/agroArgentina.json: national production of the main crops (soy, maize, wheat, sunflower), sown and harvested area and yield by
campaign, from the open series of the Ministerio de Agricultura (MAGyP, Dirección de Estimaciones Agrícolas) published in datos.gob.ar.
`indice_tiempo` is the year in which the campaign starts. It feeds the Data table of step 10. Run: python scripts/build_agro_data.py

The datos.gob.ar API answers 502 now and then: every request is retried.
"""
import csv
import io
import json
import time
import urllib.request
from datetime import date
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'web' / 'src' / 'tour' / 'agroArgentina.json'
CROPS = {'soja': 'Soja', 'maiz': 'Maíz', 'trigo': 'Trigo', 'girasol': 'Girasol'}
PACKAGES = {'maiz': 'maiz-siembra-cosecha-rendimiento-produccion'}  # the others are called <crop>-siembra-cosecha-produccion-rendimiento
FROM = 2014


def get(url, tries=10):
    for _ in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=90).read()
        except (OSError, ValueError):  # network errors (urllib raises OSError subclasses) and truncated answers
            time.sleep(6)
    raise SystemExit(f'could not read {url}')


def main():
    out = {}
    links = {}
    for key, name in CROPS.items():
        pkg = json.loads(get(f'https://datos.gob.ar/api/3/action/package_show?id={PACKAGES.get(key, key + "-siembra-cosecha-produccion-rendimiento")}'))['result']
        url = next(r['url'] for r in pkg['resources'] if 'anual' in r['url'])
        links[name] = url
        rows = list(csv.DictReader(io.StringIO(get(url).decode('utf-8-sig'))))
        out[name] = [
            {
                'campaign': int(r['indice_tiempo']),
                'sown_ha': float(r[f'superficie_sembrada_{key}_ha'] or 0),
                'harvested_ha': float(r[f'superficie_cosechada_{key}_ha'] or 0),
                'production_t': float(r[f'produccion_{key}_t'] or 0),
                'yield_kg_ha': float(r[f'rendimiento_{key}_kgxha'] or 0),
            }
            for r in rows
            if int(r['indice_tiempo']) >= FROM
        ]
        print(name, out[name][-1])
    OUT.write_text(json.dumps({
        'source': 'MAGyP, Dirección de Estimaciones Agrícolas, series anuales nacionales (datos.gob.ar)',
        'url': 'https://datos.gob.ar/dataset?q=siembra+cosecha+produccion+rendimiento',
        'files': links,
        'retrieved_at': date.today().isoformat(),
        'note': 'El año es el de inicio de la campaña (2024 es la campaña 2024/25).',
        'crops': out,
    }, ensure_ascii=False, separators=(',', ':')), encoding='utf8')


if __name__ == '__main__':
    main()
