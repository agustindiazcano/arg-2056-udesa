"""Writes web/src/tour/externalProjections.json and web/src/tour/imfCountries.json, the compact views of data/processed/external_forecasts.json that the Data section shows.

Run after `python -m datapipe run external_forecasts_macro`: python scripts/build_external_summary.py
The only arithmetic is the average annual growth of the OECD GDP volume between 2026 and 2056, (V2056 / V2026)^(1/30) - 1.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
recs = json.loads((ROOT / 'data' / 'processed' / 'external_forecasts.json').read_text(encoding='utf-8'))


def pick(forecaster, indicator, year, key=None):
    out = [r for r in recs if r['forecaster'] == forecaster and r['indicator'] == indicator and r['geo'] == 'AR' and r['year'] == year and (key is None or r['scenario_by_source'] == key)]
    assert len(out) == 1, (forecaster, indicator, year, key, len(out))
    return out[0]


scenarios = sorted({r['scenario_by_source'] for r in recs if r['forecaster'] == 'OECD'})
oecd = []
for s in scenarios:
    a, b = pick('OECD', 'gdp_real_level', 2026, s)['value'], pick('OECD', 'gdp_real_level', 2056, s)['value']
    oecd.append({
        'scenario': s,
        'description': pick('OECD', 'gdp_real_level', 2056, s)['mapping_rationale'].split(': ', 1)[1],
        'growth': round(((b / a) ** (1 / 30) - 1) * 100, 2),
        'population2056': pick('OECD', 'population', 2056, s)['value'],
    })
out = {
    'source': 'data/processed/external_forecasts.json (dataset external_forecasts_macro)',
    'imf': {
        'vintage': pick('IMF', 'gdp_growth_real_pct', 2026)['vintage'],
        'growth': {str(y): pick('IMF', 'gdp_growth_real_pct', y)['value'] for y in range(2026, 2032)},
        'investment': {str(y): pick('IMF', 'investment_rate_pct_gdp', y)['value'] for y in (2025, 2031)},
    },
    'oecd': oecd,
    'un': [
        {
            'variant': v,
            'population2056': pick('UN', 'population', 2056, v)['value'],
            'tfr2056': pick('UN', 'fertility_rate', 2056, v)['value'],
            'e0_2056': pick('UN', 'life_expectancy_at_birth', 2056, v)['value'],
        }
        for v in ('Low', 'Medium', 'High')
    ],
}
(ROOT / 'web' / 'src' / 'tour' / 'externalProjections.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

# the real GDP growth the IMF projects for every country of the data, 2025 to 2031, for the rule-of-70 slide (web/src/tour/imfCountries.json)
NAMES = {'AR': 'Argentina', 'BR': 'Brasil', 'CL': 'Chile', 'CN': 'China', 'CO': 'Colombia', 'ES': 'España', 'IN': 'India', 'KR': 'Corea del Sur', 'MX': 'México', 'US': 'Estados Unidos', 'UY': 'Uruguay'}
imf = [r for r in recs if r['forecaster'] == 'IMF' and r['indicator'] == 'gdp_growth_real_pct']
countries = []
for geo in sorted(NAMES, key=lambda g: NAMES[g]):
    rows = sorted((r for r in imf if r['geo'] == geo), key=lambda r: r['year'])
    assert rows, geo
    countries.append({
        'code': geo,
        'name': NAMES[geo],
        'vintage': rows[0]['vintage'],
        'growth': {str(r['year']): round(r['value'], 3) for r in rows},
    })
imf_out = {
    'source': 'FMI, World Economic Outlook (SDMX), crecimiento real del PBI (NGDP_RPCH), via data/processed/external_forecasts.json',
    'url': 'https://www.imf.org/en/Publications/WEO',
    'retrieved_at': imf[0]['retrieved_at'],
    'countries': countries,
}
(ROOT / 'web' / 'src' / 'tour' / 'imfCountries.json').write_text(json.dumps(imf_out, ensure_ascii=False, indent=1) + chr(10), encoding='utf-8')

# the UN population of Argentina, 2025 to 2056, medium variant (the path the AI slide uses for the GDP per person; web/src/tour/unPopulation.json)
un = sorted((r for r in recs if r['forecaster'] == 'UN' and r['geo'] == 'AR' and r['indicator'] == 'population' and r['variant'] == 'medium' and 2025 <= r['year'] <= 2056), key=lambda r: r['year'])
assert [r['year'] for r in un] == list(range(2025, 2057))
un_out = {
    'source': 'ONU, World Population Prospects 2024, variante media, via data/processed/external_forecasts.json',
    'url': 'https://population.un.org/wpp/downloads',
    'retrieved_at': un[0]['retrieved_at'],
    'unit': 'millions',
    'population': {str(r['year']): r['value'] for r in un},
}
(ROOT / 'web' / 'src' / 'tour' / 'unPopulation.json').write_text(json.dumps(un_out, ensure_ascii=False, indent=1) + chr(10), encoding='utf-8')
print('ok')
