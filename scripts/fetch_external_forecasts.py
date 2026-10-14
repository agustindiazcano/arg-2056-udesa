"""Downloads the projections of other institutions (IMF, OECD, United Nations) and writes the three raw files of the dataset `external_forecasts_macro`.

Network access lives here, never in the adapter (`scripts/datapipe/adapters/external_forecasts.py`), which only reads the raw files.
After running it, register the files with `python -m datapipe register` (the script prints the commands) and build with `python -m datapipe run external_forecasts_macro`.

Sources:
- IMF, World Economic Outlook (SDMX API api.imf.org): real GDP growth (NGDP_RPCH), total investment (NID_NGDP, % of GDP), population (LP, millions), 2025-2031.
- OECD, Economic Outlook 117 long-term scenarios (SDMX sdmx.oecd.org, dataflow DSD_EO_LTB@DF_EO_LTB): Argentina only, GDP volume and potential output (national currency, constant prices), population and working-age population, 2025-2056, six scenarios.
- United Nations, World Population Prospects 2024 (CSV files of the demographic indicators): Argentina only: population, fertility rate, life expectancy, 2025-2056 (the data budget of the app is 1.5 MB per file), variants Medium, Low and High.

Run: python scripts/fetch_external_forecasts.py
"""
import csv
import gzip
import io
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data' / 'raw' / 'external_forecasts_macro'
COUNTRIES = ['ARG', 'BRA', 'CHL', 'MEX', 'COL', 'URY', 'USA', 'CHN', 'IND', 'KOR', 'ESP']
UA = {'User-Agent': 'Mozilla/5.0'}

IMF_API = 'https://api.imf.org/external/sdmx/2.1/data/WEO'
IMF_INDICATORS = ['NGDP_RPCH', 'NID_NGDP', 'LP']
OECD_URL = 'https://sdmx.oecd.org/public/rest/data/OECD.ECO.MAD,DSD_EO_LTB@DF_EO_LTB,1.0/{areas}.{measures}..A?startPeriod=2025&endPeriod=2056'
OECD_MEASURES = ['GDPV', 'GDPVTR', 'POP', 'POPS_1574']  # volumes in national currency: the PPP measures are not used
WPP = 'https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Demographic_Indicators_{name}.csv.gz'


def get(url, headers=None, timeout=300):
    req = urllib.request.Request(url, headers={**UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def write_csv(path, header, rows):
    with open(path, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f, lineterminator='\n')
        w.writerow(header)
        w.writerows(rows)
    print('escrito', path, len(rows), 'filas')


def imf():
    rows, vintage = [], ''
    for ind in IMF_INDICATORS:
        root = ET.fromstring(get(f"{IMF_API}/{'+'.join(COUNTRIES)}.{ind}.A?startPeriod=2024"))
        for s in root.iter('Series'):
            vintage = max(vintage, s.get('COUNTRY_UPDATE_DATE') or '')
            for o in s.iter('Obs'):
                if int(o.get('TIME_PERIOD')) <= 2031:
                    rows.append((s.get('COUNTRY'), ind, o.get('TIME_PERIOD'), o.get('OBS_VALUE'), s.get('COUNTRY_UPDATE_DATE') or ''))
    rows.sort()
    write_csv(OUT / 'imf_weo_selected.csv', ['iso3', 'indicator', 'year', 'value', 'country_update_date'], rows)


def oecd():
    raw = get(OECD_URL.format(areas='ARG', measures='+'.join(OECD_MEASURES)), {'Accept': 'application/vnd.sdmx.data+csv'}).decode('utf-8')
    rows = [(r['REF_AREA'], r['MEASURE'], r['SCENARIO'], r['TIME_PERIOD'], r['OBS_VALUE'], r['UNIT_MEASURE']) for r in csv.DictReader(io.StringIO(raw)) if r['OBS_VALUE'] != '']
    rows.sort()
    write_csv(OUT / 'oecd_ltb_selected.csv', ['iso3', 'measure', 'scenario', 'year', 'value', 'unit_measure'], rows)


def wpp():
    rows = []
    for name in ('Medium', 'OtherVariants'):
        text = gzip.decompress(get(WPP.format(name=name))).decode('utf-8-sig')
        for r in csv.DictReader(io.StringIO(text)):
            if r['ISO3_code'] == 'ARG' and r['Variant'] in ('Medium', 'Low', 'High') and 2025 <= int(r['Time']) <= 2056:
                rows.append((r['ISO3_code'], r['Variant'], r['Time'], r['TPopulation1July'], r['TFR'], r['LEx'], r['MedianAgePop'], r['NetMigrations']))
    rows.sort()
    write_csv(OUT / 'un_wpp_selected.csv', ['iso3', 'variant', 'year', 'population_thousands', 'tfr', 'life_expectancy', 'median_age', 'net_migration_thousands'], rows)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    imf()
    oecd()
    wpp()
    today = date.today().isoformat()
    print('\nRegistrar:')
    for f, src, url in (
        ('imf_weo_selected.csv', 'IMF World Economic Outlook (SDMX API)', 'https://www.imf.org/en/Publications/WEO'),
        ('oecd_ltb_selected.csv', 'OECD Economic Outlook 117 long-term scenarios (DSD_EO_LTB)', 'https://sdmx.oecd.org/public/rest/dataflow/OECD.ECO.MAD/DSD_EO_LTB@DF_EO_LTB/1.0'),
        ('un_wpp_selected.csv', 'United Nations World Population Prospects 2024', 'https://population.un.org/wpp/downloads'),
    ):
        print(f'python -m datapipe register external_forecasts_macro {OUT / f} --source "{src}" --source-url {url} --retrieved-at {today} --replace')


if __name__ == '__main__':
    main()
