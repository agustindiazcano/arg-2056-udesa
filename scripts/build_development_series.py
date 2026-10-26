"""Builds web/src/tour/developmentSeries.json: yearly series of the World Bank WDI for Argentina and its peers, for the big chart of the development slide
(life expectancy SP.DYN.LE00.IN, infant mortality SP.DYN.IMRT.IN, Gini SI.POV.GINI and, for education, secondary and tertiary enrollment,
school life expectancy and public spending on education). A year without a value stays null; nothing is filled in.

Run: python scripts/build_development_series.py
"""
import json
import urllib.request
from datetime import date
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'web' / 'src' / 'tour' / 'developmentSeries.json'
FIRST, LAST = 2005, 2024
COUNTRIES = {'ARG': 'Argentina', 'CHL': 'Chile', 'URY': 'Uruguay', 'BRA': 'Brasil', 'COL': 'Colombia', 'MEX': 'México', 'USA': 'Estados Unidos', 'ESP': 'España'}
INDICATORS = {'Esperanza de vida al nacer': 'SP.DYN.LE00.IN', 'Mortalidad infantil': 'SP.DYN.IMRT.IN', 'Índice de Gini': 'SI.POV.GINI',
    'Matrícula secundaria': 'SE.SEC.ENRR',
    'Matrícula terciaria': 'SE.TER.ENRR',
    'Escolaridad esperada': 'SE.SCH.LIFE',
    'Gasto público en educación': 'SE.XPD.TOTL.GD.ZS',
}


def fetch(code: str) -> dict:
    url = f"https://api.worldbank.org/v2/country/{';'.join(COUNTRIES)}/indicator/{code}?format=json&date={FIRST}:{LAST}&per_page=1000"
    with urllib.request.urlopen(url, timeout=60) as r:
        rows = json.load(r)[1] or []
    out = {name: {y: None for y in range(FIRST, LAST + 1)} for name in COUNTRIES.values()}
    for row in rows:
        out[COUNTRIES[row['countryiso3code']]][int(row['date'])] = row['value']
    return {name: [by_year[y] for y in range(FIRST, LAST + 1)] for name, by_year in out.items()}


def main() -> None:
    data = {
        'source': 'Banco Mundial, World Development Indicators (WDI)',
        'retrieved_at': date.today().isoformat(),
        'firstYear': FIRST,
        'lastYear': LAST,
        'indicators': {name: {'code': code, 'countries': fetch(code)} for name, code in INDICATORS.items()},
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    print('wrote', OUT)


if __name__ == '__main__':
    main()
