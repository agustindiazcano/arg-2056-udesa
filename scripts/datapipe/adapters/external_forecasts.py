"""Adapter of the dataset `external_forecasts_macro`: projections of the IMF, the OECD and the United Nations.

Reads only the three raw files written by `scripts/fetch_external_forecasts.py`; no network, no randomness. Output: `external_forecasts.json`.
Arithmetic is limited to unit changes written here: thousands of people to millions (United Nations) and people to millions (OECD).
"""
import csv
from datetime import datetime

DATASET_ID = "external_forecasts_macro"
OUTPUTS = {"external_forecasts.json": "external_forecasts.schema.json"}

GEO = {"ARG": "AR", "BRA": "BR", "CHL": "CL", "MEX": "MX", "COL": "CO", "URY": "UY", "USA": "US", "CHN": "CN", "IND": "IN", "KOR": "KR", "ESP": "ES"}

IMF = {
    "NGDP_RPCH": ("gdp_growth_real_pct", "pct", "Real GDP growth, annual percent change", 1.0, "constant prices"),
    "NID_NGDP": ("investment_rate_pct_gdp", "pct_gdp", "Total investment, percent of GDP", 1.0, None),
    "LP": ("population", "millions", "Population", 1e-6, None),
}
# OECD: measure -> (indicator, unit, description, factor, price_basis, note)
OECD = {
    "GDPV": ("gdp_real_level", "national currency, constant prices", "GDP, volume, market prices", 1.0, "constant prices of the national currency", None),
    "GDPVTR": ("other", "national currency, constant prices", "Potential output, volume", 1.0, "constant prices of the national currency", "Potential output (level), OECD measure GDPVTR."),
    "KTPV_AV": ("other", "national currency, constant prices", "Productive capital stock, volume, annual average", 1.0, "constant prices of the national currency", "Productive capital stock (level), OECD measure KTPV_AV."),
    "ETPT": ("other", "millions", "Potential employment of the total economy", 1e-6, None, "Potential employment (people), OECD measure ETPT."),
    "POP": ("population", "millions", "Total population", 1e-6, None, None),
    "POPS_1574": ("working_age_population", "millions", "Trend working-age population, 15 to 74", 1e-6, None, None),
}
OECD_SCENARIOS = {
    "BAU1": "business-as-usual energy transition, median climate damage curve, no carbon mitigation costs",
    "BAU2": "business-as-usual energy transition, high damage curve, no carbon mitigation costs",
    "ET1": "accelerated energy transition, median damage curve, slow reduction in carbon mitigation costs",
    "ET2": "accelerated energy transition, median damage curve, fast reduction in carbon mitigation costs",
    "ET3": "accelerated energy transition, high damage curve, slow reduction in carbon mitigation costs",
    "ET4": "accelerated energy transition, high damage curve, fast reduction in carbon mitigation costs",
}
UN = {
    "population_thousands": ("population", "millions", "Total population on 1 July", 1e-3),
    "tfr": ("fertility_rate", "births per woman", "Total fertility rate", 1.0),
    "life_expectancy": ("life_expectancy_at_birth", "years", "Life expectancy at birth, both sexes", 1.0),
}


def _rows(path):
    with open(path, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def _retrieved(manifest, name):
    for e in manifest.get("files", []):
        if e["path"] == name:
            return e["retrieved_at"]
    raise ValueError(f"{name} is not in the manifest")


def _num(text, factor):
    return round(float(text) * factor, 6)


def _record(rid, forecaster, title, vintage, indicator, geo, year, value, unit, price_basis, scenario_by_source, mapping, rationale, variant, assumptions, source_id, source, url, locator, retrieved_at, note=None):
    rec = {
        "id": rid, "forecaster": forecaster, "publication_title": title, "vintage": vintage, "indicator": indicator, "geo": geo, "year": year,
        "value": value, "value_low": None, "value_high": None, "unit": unit, "price_basis": price_basis,
        "scenario_by_source": scenario_by_source, "scenario_mapping": mapping, "mapping_rationale": rationale, "variant": variant,
        "assumptions": assumptions, "source_id": source_id, "source": source, "source_url": url, "locator": locator, "snippet": None,
        "confidence": "high", "retrieved_at": retrieved_at,
    }
    if note:
        rec["note"] = note
    return rec


def build(files, manifest):
    out = []
    # IMF: one projection per country, the single baseline of the WEO
    name = "imf_weo_selected.csv"
    retrieved = _retrieved(manifest, name)
    for r in _rows(files[name]):
        if r["indicator"] not in IMF or r["iso3"] not in GEO or int(r["year"]) < 2025:
            continue
        indicator, unit, desc, factor, basis = IMF[r["indicator"]]
        vintage = datetime.strptime(r["country_update_date"], "%m/%d/%Y").date().isoformat()
        out.append(_record(
            f"imf-{r['indicator']}-{GEO[r['iso3']]}-{r['year']}", "IMF", "World Economic Outlook", vintage, indicator, GEO[r["iso3"]], int(r["year"]),
            _num(r["value"], factor), unit, basis, None, "expected", "Single baseline projection of the source (the WEO publishes no scenarios)", None,
            f"{desc}. Observed values may appear for the first years; the projection starts where the IMF marks it.",
            f"imf:weo_{r['indicator'].lower()}", "IMF World Economic Outlook (SDMX API)", "https://www.imf.org/en/Publications/WEO",
            f"api.imf.org WEO {r['iso3']}.{r['indicator']}.A", retrieved))

    # OECD: six long-term scenarios, none of them mapped to ours (the model task decides)
    name = "oecd_ltb_selected.csv"
    retrieved = _retrieved(manifest, name)
    for r in _rows(files[name]):
        if r["measure"] not in OECD or r["iso3"] not in GEO or r["scenario"] not in OECD_SCENARIOS or int(r["year"]) < 2025:
            continue
        indicator, unit, desc, factor, basis, note = OECD[r["measure"]]
        out.append(_record(
            f"oecd-{r['measure']}-{GEO[r['iso3']]}-{r['year']}-{r['scenario']}", "OECD", "Economic Outlook 117 long-term scenarios", "EO117", indicator, GEO[r["iso3"]], int(r["year"]),
            _num(r["value"], factor), unit, basis, r["scenario"], "not_stated", f"{r['scenario']}: {OECD_SCENARIOS[r['scenario']]}", None,
            f"{desc}. The scenarios differ in energy transition and climate damages.",
            f"oecd:eo_ltb_{r['measure'].lower()}", "OECD Economic Outlook 117 long-term scenarios (DSD_EO_LTB)",
            "https://sdmx.oecd.org/public/rest/dataflow/OECD.ECO.MAD/DSD_EO_LTB@DF_EO_LTB/1.0",
            f"DSD_EO_LTB {r['iso3']}.{r['measure']}.{r['scenario']}.A", retrieved, note))

    # United Nations: Medium is the central projection; Low and High are fertility variants
    name = "un_wpp_selected.csv"
    retrieved = _retrieved(manifest, name)
    for r in _rows(files[name]):
        if r["iso3"] not in GEO or int(r["year"]) < 2025:
            continue
        for col, (indicator, unit, desc, factor) in UN.items():
            medium = r["variant"] == "Medium"
            out.append(_record(
                f"un-{col}-{GEO[r['iso3']]}-{r['year']}-{r['variant'].lower()}", "UN", "World Population Prospects 2024", "WPP2024", indicator, GEO[r["iso3"]], int(r["year"]),
                _num(r[col], factor), unit, None, r["variant"], "expected" if medium else "not_stated",
                "Medium variant: the central projection of the United Nations" if medium else "Fertility variant of the United Nations, not a pessimistic or optimistic case",
                r["variant"].lower(), f"{desc}.", f"un:wpp2024_{col}", "United Nations World Population Prospects 2024", "https://population.un.org/wpp/downloads",
                f"WPP2024 Demographic Indicators, {r['iso3']}, {r['variant']}", retrieved))
    return {"external_forecasts.json": out}
