"""Reads the IMF World Economic Outlook (WEO) from the IMF SDMX API (api.imf.org) and compares it with the World Bank data the Recorrido uses.

Writes web/src/tour/imfWeo.json (the IMF values the app needs: nominal GDP 2025 and 2026 of the countries of step 0, and Argentina's indicators)
and prints the comparison. IMF: nominal GDP (NGDPD, billions of current USD), GDP per capita (NGDPDPC), real growth (NGDP_RPCH), investment
(NID_NGDP, % of GDP), population (LP, millions). World Bank: web/src/tour/worldNominal.json (scripts/build_world_nominal.py).

Run: python scripts/imf_compare.py
"""
import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOUR = ROOT / 'web' / 'src' / 'tour'
API = 'https://api.imf.org/external/sdmx/2.1/data/WEO'


def weo(indicator, countries=None, start=1980):
    key = '+'.join(countries) if countries else ''
    req = urllib.request.Request(f'{API}/{key}.{indicator}.A?startPeriod={start}', headers={'User-Agent': 'Mozilla/5.0'})
    root = ET.fromstring(urllib.request.urlopen(req, timeout=120).read())
    out, updated = {}, {}
    for s in root.iter('Series'):
        c = s.get('COUNTRY')
        scale = int(s.get('SCALE') or 0)
        updated[c] = s.get('COUNTRY_UPDATE_DATE')
        out[c] = {int(o.get('TIME_PERIOD')): float(o.get('OBS_VALUE')) / (10 ** scale if scale else 1) * (10 ** scale if scale else 1) for o in s.iter('Obs')}
    return out, updated


def main():
    wb = json.loads((TOUR / 'worldNominal.json').read_text(encoding='utf8'))
    years = wb['years']
    gdp_imf, upd = weo('NGDPD')  # raw USD; the scale attribute says 9 (billions) but the observations are in units
    # the observations are in raw units (e.g. 683589271000): bring them to billions
    gdp_imf = {c: {y: v / 1e9 for y, v in d.items()} for c, d in gdp_imf.items()}
    print('IMF vintage (update date of Argentina):', upd.get('ARG'))

    # 1) the nominal GDP of every country of step 0: World Bank against IMF, every year both have it
    rows = []
    for c in wb['countries']:
        code = c['code']
        if code not in gdp_imf:
            rows.append((c['name'], 'sin dato del FMI', None, None))
            continue
        worst = (0, None, None, None)
        for i, y in enumerate(years):
            a, b = c['gdp'][i], gdp_imf[code].get(y)
            if a is None or b is None or y < 1980 or a < 1:
                continue
            d = (b - a) / a * 100
            if abs(d) > abs(worst[0]):
                worst = (d, y, a, b)
        rows.append((c['name'], 'ok', worst, None))
    print('\nPBI nominal: la mayor diferencia por país entre Banco Mundial y FMI (1980-2025, en %)')
    for name, status, worst, _ in sorted(rows, key=lambda r: -(abs(r[2][0]) if r[2] else 0)):
        if worst:
            print(f'  {name:20s} {worst[0]:+7.1f} % en {worst[1]} (BM {worst[2]:.1f}, FMI {worst[3]:.1f})')
        else:
            print(f'  {name:20s} {status}')

    # 2) Argentina, indicator by indicator
    arg = {}
    for ind in ('NGDPD', 'NGDPDPC', 'NGDP_RPCH', 'NID_NGDP', 'LP'):
        data, _ = weo(ind, ['ARG'], 2018)
        arg[ind] = data['ARG']
    arg['NGDPD'] = {y: v / 1e9 for y, v in arg['NGDPD'].items()}
    i25 = years.index(2025)
    a = next(c for c in wb['countries'] if c['code'] == 'ARG')
    print('\nArgentina 2025: Banco Mundial contra FMI')
    print(f"  PBI nominal (miles de millones de USD): BM {a['gdp'][i25]}  FMI {arg['NGDPD'][2025]:.1f}")
    print(f"  Población (millones): BM {a['pop'][i25]}  FMI {arg['LP'][2025] / (1e6 if arg['LP'][2025] > 1e5 else 1):.3f}")
    print(f"  PBI per cápita (USD): BM {a['gdp'][i25] * 1000 / a['pop'][i25]:.0f}  FMI {arg['NGDPDPC'][2025]:.0f}")
    print(f"  Crecimiento real (%): FMI {arg['NGDP_RPCH'][2025]:.2f} (2026: {arg['NGDP_RPCH'][2026]:.2f})")
    print(f"  Inversión (% del PBI): FMI {arg['NID_NGDP'][2025]:.2f}")
    print(f"  PBI nominal 2026 (estimación del FMI): {arg['NGDPD'][2026]:.1f}")

    # 3) what the app keeps: 2025 and 2026 nominal GDP of the countries of step 0, and Argentina
    keep = {c['code']: {'2025': round(gdp_imf[c['code']][2025], 2), '2026': round(gdp_imf[c['code']][2026], 2)} for c in wb['countries'] if c['code'] in gdp_imf and 2026 in gdp_imf[c['code']]}
    out = {
        'source': 'FMI, World Economic Outlook (SDMX api.imf.org): NGDPD, NGDPDPC, NGDP_RPCH, NID_NGDP, LP',
        'url': 'https://www.imf.org/external/datamapper/NGDPD@WEO/ARG',
        'retrieved_at': date.today().isoformat(),
        'vintage_update_date_argentina': upd.get('ARG'),
        'gdp': keep,
        'argentina': {k: {str(y): round(v, 3) for y, v in d.items()} for k, d in arg.items()},
    }
    (TOUR / 'imfWeo.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
    print('\nescrito', TOUR / 'imfWeo.json', len(keep), 'países')


if __name__ == '__main__':
    main()
