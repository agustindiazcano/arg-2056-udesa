"""Builds web/src/tour/pisaSeries.json: PISA mean mathematics score (OECD) of Argentina and its peers in the editions 2012, 2018 and 2022, for the big chart
of the development slide. The values are the OECD PISA tables as published by Our World in Data (CSV of the grapher
"pisa-test-score-mean-performance-on-the-mathematics-scale"). An edition without a value stays null; nothing is filled in.
2015 is left out on purpose: Argentina did not take part nationally in that edition.

Run: python scripts/build_pisa_series.py
"""
import csv
import io
import json
import urllib.request
from datetime import date
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'web' / 'src' / 'tour' / 'pisaSeries.json'
URL = 'https://ourworldindata.org/grapher/pisa-test-score-mean-performance-on-the-mathematics-scale.csv?v=1&csvType=full&useColumnShortNames=true'
YEARS = [2012, 2018, 2022]
COUNTRIES = {'Argentina': 'Argentina', 'Brazil': 'Brasil', 'Chile': 'Chile', 'Uruguay': 'Uruguay', 'Mexico': 'México', 'Colombia': 'Colombia', 'Spain': 'España', 'United States': 'Estados Unidos'}


def main() -> None:
    with urllib.request.urlopen(URL, timeout=60) as r:
        rows = list(csv.DictReader(io.StringIO(r.read().decode('utf-8'))))
    column = [c for c in rows[0] if c.startswith('pisa_')][0]
    by = {(row['entity'], int(row['year'])): float(row[column]) for row in rows}
    data = {
        'source': 'OCDE, PISA (puntaje medio de matemática), publicado por Our World in Data',
        'sourceUrl': 'https://ourworldindata.org/grapher/pisa-test-score-mean-performance-on-the-mathematics-scale',
        'retrieved_at': date.today().isoformat(),
        'years': YEARS,
        'countries': {name: [round(by[(en, y)]) if (en, y) in by else None for y in YEARS] for en, name in COUNTRIES.items()},
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    print('wrote', OUT)


if __name__ == '__main__':
    main()
