import json
import sys
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))
from dataset_checks import check_external_forecasts

from scripts.datapipe.adapters import external_forecasts as adapter

MANIFEST = {"files": [{"path": n, "retrieved_at": "2026-10-14"} for n in ("imf_weo_selected.csv", "oecd_ltb_selected.csv", "un_wpp_selected.csv")]}


@pytest.fixture
def files(tmp_path):
    (tmp_path / "imf_weo_selected.csv").write_text(
        "iso3,indicator,year,value,country_update_date\n"
        "ARG,NGDP_RPCH,2025,4.48,9/30/2026\nARG,NGDP_RPCH,2027,3.46,9/30/2026\nARG,LP,2027,48427983,9/30/2026\nXXX,NGDP_RPCH,2027,1,9/30/2026\n", encoding="utf-8")
    (tmp_path / "oecd_ltb_selected.csv").write_text(
        "iso3,measure,scenario,year,value,unit_measure\n"
        "ARG,GDPV,BAU1,2056,1372400000000.0,XDC\nARG,POP,BAU1,2056,49985042.332,PS\nARG,GDPV,BAU1,2024,1,XDC\nARG,GDPV,NOPE,2056,1,XDC\n", encoding="utf-8")
    (tmp_path / "un_wpp_selected.csv").write_text(
        "iso3,variant,year,population_thousands,tfr,life_expectancy,median_age,net_migration_thousands\n"
        "ARG,Medium,2056,48047.358,1.5452,82.2538,40,0.5\nARG,Low,2056,43224.849,1.0452,82.2538,40,0.5\n", encoding="utf-8")
    return {p.name: p for p in tmp_path.iterdir()}


def records(files):
    return adapter.build(files, MANIFEST)["external_forecasts.json"]


def test_validates_against_the_schema_and_the_checks(files):
    schema = json.loads((ROOT / "data/schemas/external_forecasts.schema.json").read_text(encoding="utf-8"))
    recs = records(files)
    assert not list(Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(recs))
    assert check_external_forecasts(recs) == []


def test_units_and_filters(files):
    by_id = {r["id"]: r for r in records(files)}
    assert by_id["imf-LP-AR-2027"]["value"] == 48.427983  # people to millions
    assert by_id["oecd-POP-AR-2056-BAU1"]["value"] == 49.985042
    assert by_id["oecd-GDPV-AR-2056-BAU1"]["value"] == 1372400000000.0
    assert by_id["un-population_thousands-AR-2056-medium"]["value"] == 48.047358  # thousands to millions
    assert not [i for i in by_id if "2024" in i or "XXX" in i or "NOPE" in i]  # earlier years, unknown country and scenario are dropped


def test_mapping_and_no_ppp(files):
    by_id = {r["id"]: r for r in records(files)}
    assert by_id["imf-NGDP_RPCH-AR-2027"]["vintage"] == "2026-09-30"
    assert by_id["imf-NGDP_RPCH-AR-2027"]["scenario_mapping"] == "expected"
    assert by_id["oecd-GDPV-AR-2056-BAU1"]["scenario_mapping"] == "not_stated"
    assert by_id["un-tfr-AR-2056-medium"]["scenario_mapping"] == "expected"
    assert by_id["un-tfr-AR-2056-low"]["scenario_mapping"] == "not_stated"
    assert not [r for r in by_id.values() if "ppp" in json.dumps(r).lower() or "purchasing" in json.dumps(r).lower()]


def test_deterministic(files):
    assert records(files) == records(files)
