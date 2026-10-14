"""Writes web/src/tour/externalProjections.json, the compact view of data/processed/external_forecasts.json that the Data section shows.

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
print('ok')
