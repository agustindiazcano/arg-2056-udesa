"""Reads the IMF World Economic Outlook (WEO) from the IMF SDMX API (api.imf.org) and compares it with the World Bank data the Recorrido uses.

The project uses REAL GDP at constant prices (human decision of 2026-10-13). The IMF does not publish real GDP in constant US dollars, so what is compared
is the real growth (NGDP_RPCH) of every country of step 0 against the growth that the World Bank series (constant 2015 US dollars) implies, and the
other indicators of Argentina. The IMF real growth of 2026 is the estimate that extends the real series of Argentina from 2025 to 2026.

Writes web/src/tour/imfWeo.json and prints the comparison. Run: python scripts/imf_compare.py
"""
import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOUR = ROOT / 'web' / 'src' / 'tour'
API = 'https://api.imf.org/external/sdmx/2.1/data/WEO'


def weo(indicator, countries=None, start=2010):
    key = '+'.join(countries) if countries else ''
    req = urllib.request.Request(f'{API}/{key}.{indicator}.A?startPeriod={start}', headers={'User-Agent': 'Mozilla/5.0'})
    root = ET.fromstring(urllib.request.urlopen(req, timeout=120).read())
    out, updated = {}, {}
    for s in root.iter('Series'):
        c = s.get('COUNTRY')
        updated[c] = s.get('COUNTRY_UPDATE_DATE')
        out[c] = {int(o.get('TIME_PERIOD')): float(o.get('OBS_VALUE')) for o in s.iter('Obs')}
    return out, updated


def main():
    wb = json.loads((TOUR / 'worldGdp.json').read_text(encoding='utf8'))
    years = wb['years']
    growth_imf, upd = weo('NGDP_RPCH')
    print('IMF vintage (update date of Argentina):', upd.get('ARG'))

    # 1) real growth of every country, World Bank (from the constant-dollar series) against IMF, 2015-2025
    print('\nCrecimiento real: la mayor diferencia por país entre Banco Mundial y FMI, 2015-2025 (puntos porcentuales)')
    rows = []
    for c in wb['countries']:
        code = c['code']
        if code not in growth_imf:
            rows.append((c['name'], None))
            continue
        worst = (0, None, None, None)
        for i, y in enumerate(years):
            if y < 2015 or i == 0 or c['gdp'][i] is None or c['gdp'][i - 1] is None:
                continue
            g_wb = (c['gdp'][i] / c['gdp'][i - 1] - 1) * 100
            g_imf = growth_imf[code].get(y)
            if g_imf is None:
                continue
            d = g_imf - g_wb
            if abs(d) > abs(worst[0]):
                worst = (d, y, g_wb, g_imf)
        rows.append((c['name'], worst))
    for name, worst in sorted(rows, key=lambda r: -(abs(r[1][0]) if r[1] else 0)):
        print(f'  {name:20s}', f'{worst[0]:+5.1f} pp en {worst[1]} (BM {worst[2]:.1f} %, FMI {worst[3]:.1f} %)' if worst and worst[1] else 'sin dato del FMI')

    # 2) Argentina, indicator by indicator
    arg = {}
    for ind in ('NGDPD', 'NGDPDPC', 'NGDP_RPCH', 'NID_NGDP', 'LP'):
        data, _ = weo(ind, ['ARG'], 2018)
        arg[ind] = data['ARG']
    a = next(c for c in wb['countries'] if c['code'] == 'ARG')
    i25 = years.index(2025)
    g25 = (a['gdp'][i25] / a['gdp'][i25 - 1] - 1) * 100
    print('\nArgentina 2025: Banco Mundial contra FMI')
    print(f"  PBI real (miles de millones de USD de 2015): BM {a['gdp'][i25]}; el FMI no lo publica en dólares constantes")
    print(f"  Crecimiento real (%): BM {g25:.2f}  FMI {arg['NGDP_RPCH'][2025]:.2f}  (2026, estimación del FMI: {arg['NGDP_RPCH'][2026]:.2f})")
    print(f"  Población (millones): INDEC {a['pop'][i25]}  FMI {arg['LP'][2025]:.3f}")
    print(f"  Inversión (% del PBI): FMI {arg['NID_NGDP'][2025]:.2f}")
    est = a['gdp'][i25] * (1 + arg['NGDP_RPCH'][2026] / 100)
    print(f"  PBI real 2026 (2025 por el crecimiento estimado por el FMI): {est:.1f}")

    keep_growth = {c['code']: {str(y): v for y, v in growth_imf[c['code']].items() if 2020 <= y <= 2027} for c in wb['countries'] if c['code'] in growth_imf}
    out = {
        'source': 'FMI, World Economic Outlook (SDMX api.imf.org): NGDP_RPCH, NGDPD, NGDPDPC, NID_NGDP, LP',
        'url': 'https://www.imf.org/external/datamapper/NGDP_RPCH@WEO/ARG',
        'retrieved_at': date.today().isoformat(),
        'vintage_update_date_argentina': upd.get('ARG'),
        'growth': keep_growth,
        'argentina': {k: {str(y): round(v, 3) for y, v in d.items()} for k, d in arg.items()},
    }
    (TOUR / 'imfWeo.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
    print('\nescrito', TOUR / 'imfWeo.json')


if __name__ == '__main__':
    main()
