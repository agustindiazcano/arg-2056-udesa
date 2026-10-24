"""Builds web/src/tour/agroOtherCrops.json: national production (tonnes) of the crops of the MAGyP series other than soja, maiz, trigo and girasol,
for one campaign (the year it starts), to show them as "Otros cultivos" next to the four main ones.

Source: MAGyP, Estimaciones agricolas (datos.magyp.gob.ar), the full series by campaign, province and department. Components that are already part of a
total of the file ("soja 1ra", "soja 2da", "poroto negro", "poroto alubia", "poroto otros") and wheat (which the slide already has) are left out;
"trigo candeal" is left out as well because the file does not say whether "trigo total" already includes it. Sugar cane is not in the file.

Run: python scripts/build_agro_other_crops.py [campaign_start_year]
"""
import csv
import io
import json
import sys
import urllib.request
from collections import defaultdict
from datetime import date
from pathlib import Path

URL = 'https://datos.magyp.gob.ar/dataset/9e1e77ba-267e-4eaa-a59f-3296e86b5f36/resource/95d066e6-8a0f-4a80-b59d-6f28f88eacd5/download/estimaciones-agricolas-2026-03.csv'
OUT = Path(__file__).resolve().parent.parent / 'web' / 'src' / 'tour' / 'agroOtherCrops.json'
MAIN = {'soja total', 'maiz', 'maíz', 'trigo total', 'girasol'}
COMPONENTS = {'soja', 'soja 1ra', 'soja 2da', 'poroto negro', 'poroto alubia', 'poroto otros', 'trigo candeal'}


def main(year: int) -> None:
    with urllib.request.urlopen(URL, timeout=300) as r:
        text = r.read().decode('utf-8-sig')
    totals: dict = defaultdict(float)
    for row in csv.DictReader(io.StringIO(text)):
        if row['anio'] == str(year) and row['produccion_tm']:
            totals[row['cultivo'].strip().lower()] += float(row['produccion_tm'])
    crops = {name: round(t) for name, t in totals.items() if name not in MAIN | COMPONENTS}
    data = {
        'campaign': f'{year}/{str(year + 1)[2:]}',
        'source': 'MAGyP, Estimaciones agrícolas (datos.magyp.gob.ar), serie completa por campaña, provincia y departamento',
        'url': URL,
        'retrieved_at': date.today().isoformat(),
        'note': 'Sin soja, maíz, trigo ni girasol; sin los componentes de totales del archivo ni trigo candeal; la caña de azúcar no está en el archivo.',
        'crops_t': dict(sorted(crops.items(), key=lambda kv: -kv[1])),
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    print('wrote', OUT, 'total', sum(crops.values()))


if __name__ == '__main__':
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2024)
