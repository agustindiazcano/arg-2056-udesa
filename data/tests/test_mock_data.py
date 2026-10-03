import json
import subprocess
import sys
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker

# Add scripts to path for importing forecast checks
sys.path.append(str(Path(__file__).parent.parent.parent / "scripts"))
from forecast_checks import check_forecast

SCHEMAS_DIR = Path("data/schemas")

def load_schema(name):
    with open(SCHEMAS_DIR / f"{name}.schema.json") as f:
        return json.load(f)

def run_gen_mock(out_dir):
    subprocess.run([sys.executable, "scripts/gen_mock.py", str(out_dir)], check=True)

@pytest.fixture(scope="session")
def generated_mock_data(tmp_path_factory):
    out_dir = tmp_path_factory.mktemp("mock_data_test")
    run_gen_mock(out_dir)
    return out_dir

def test_determinism(tmp_path):
    dir1 = tmp_path / "dir1"
    dir2 = tmp_path / "dir2"
    dir1.mkdir()
    dir2.mkdir()
    
    run_gen_mock(dir1)
    run_gen_mock(dir2)
    
    files1 = sorted(dir1.glob("*.json"))
    files2 = sorted(dir2.glob("*.json"))
    
    assert len(files1) == 13
    assert len(files1) == len(files2)
    
    for f1, f2 in zip(files1, files2):
        assert f1.name == f2.name
        assert f1.read_bytes() == f2.read_bytes()

def test_schemas(generated_mock_data):
    files = ["economy_series", "resource_production", "population", "andes_events", "composition", "projects", "production_projections", "external_forecasts", "forecast_vintages", "base_rates", "ai_estimates", "dataset_catalog"]
    for fname in files:
        data_path = generated_mock_data / f"{fname}.json"
        assert data_path.exists(), f"{fname}.json not generated"
        with open(data_path) as f:
            data = json.load(f)
        schema = load_schema(fname)
        validator = Draft202012Validator(schema, format_checker=FormatChecker())
        validator.validate(data)
        
    # Check forecast separately
    forecast_path = generated_mock_data / "forecast_output.json"
    assert forecast_path.exists()
    with open(forecast_path) as f:
        forecast_data = json.load(f)
    forecast_schema = load_schema("forecast_output")
    Draft202012Validator(forecast_schema, format_checker=FormatChecker()).validate(forecast_data)

def _find_numeric_nulls_and_provenance(obj):
    errors = []
    if isinstance(obj, dict):
        if "source" in obj and obj["source"] not in ("MOCK", "MOCK2"): errors.append("source is not MOCK")
        if "retrieved_at" in obj and obj["retrieved_at"] != "2026-10-02": errors.append("retrieved_at is not 2026-10-02")
        if "value" in obj and obj["value"] is None and "value_low" in obj and obj["value_low"] is None and "value_high" in obj and obj["value_high"] is None and "note" not in obj:
            errors.append("null values but no note")
        elif "value" in obj and obj["value"] is None and "value_low" not in obj and "note" not in obj:
            errors.append("null value but no note")
        for v in obj.values():
            if isinstance(v, (dict, list)): errors.extend(_find_numeric_nulls_and_provenance(v))
    elif isinstance(obj, list):
        for item in obj: errors.extend(_find_numeric_nulls_and_provenance(item))
    return errors

def test_provenance_and_nulls(generated_mock_data):
    for p in generated_mock_data.glob("*.json"):
        with open(p) as f:
            data = json.load(f)
        errors = _find_numeric_nulls_and_provenance(data)
        assert not errors, f"Errors in {p.name}: {errors}"

def test_business_rules(generated_mock_data):
    # economy_series
    with open(generated_mock_data / "economy_series.json") as f:
        eco = json.load(f)
        # hdi absent before 1990
        for record in eco:
            if record["indicator"] == "hdi" and record["year"] < 1990:
                pytest.fail(f"HDI present before 1990: {record}")
                
    # resource_production
    with open(generated_mock_data / "resource_production.json") as f:
        rp = json.load(f)
        resource_prov_counts = {}
        for record in rp:
            if record["geo"] != "AR":
                resource_prov_counts.setdefault(record["resource"], set()).add(record["geo"])
        for r, provs in resource_prov_counts.items():
            assert 3 <= len(provs) <= 8, f"Resource {r} in {len(provs)} provinces, expected 3-8"

def test_forecast_invariants(generated_mock_data):
    with open(generated_mock_data / "forecast_output.json") as f:
        forecast = json.load(f)
        
    assert not check_forecast(forecast), "check_forecast returned errors"
    
    # check fan width and orderings
    series_map = {}
    for s in forecast["series"]:
        key_base = (s["indicator"], s.get("resource"), s["geo"])
        key = (key_base, s["scenario"], s["ai_overlay"])
        series_map[key] = s
        
        # fan width non-decreasing
        prev_width = -1
        for p in s["points"]:
            width = p["p90"] - p["p10"]
            assert width >= prev_width, "Fan width decreased"
            prev_width = width
            
    # Check scenario ordering
    for s in forecast["series"]:
        if s["scenario"] == "expected":
            key_base = (s["indicator"], s.get("resource"), s["geo"])
            ai = s["ai_overlay"]
            
            s_pes = series_map.get((key_base, "pessimistic", ai))
            s_opt = series_map.get((key_base, "optimistic", ai))
            
            if s_pes and s_opt:
                for pp, pe, po in zip(s_pes["points"], s["points"], s_opt["points"]):
                    assert pp["p50"] <= pe["p50"] <= po["p50"], "Scenario ordering violated"
                    
    # Check overlay ordering
    for s in forecast["series"]:
        if s["ai_overlay"] == "off":
            key_base = (s["indicator"], s.get("resource"), s["geo"])
            scen = s["scenario"]
            s_on = series_map.get((key_base, scen, "on"))
            
            if s_on:
                for poff, pon in zip(s["points"], s_on["points"]):
                    assert pon["p50"] >= poff["p50"], "Overlay ordering violated"

def test_gate_check_no_mock(tmp_path):
    check_script = "scripts/check_no_mock.py"
    
    # clean dir -> exit 0
    clean_dir = tmp_path / "clean"
    clean_dir.mkdir()
    with open(clean_dir / "valid.json", "w") as f:
        json.dump({"source": "real"}, f)
        
    res = subprocess.run([sys.executable, check_script, str(clean_dir)], check=False)
    assert res.returncode == 0
    
    # mock file name -> exit 1
    mock_name_dir = tmp_path / "mock_name"
    mock_name_dir.mkdir()
    with open(mock_name_dir / "my_mock_file.json", "w") as f:
        json.dump({"source": "real"}, f)
        
    res = subprocess.run([sys.executable, check_script, str(mock_name_dir)], capture_output=True, check=False)
    assert res.returncode == 1
    assert "mock" in res.stdout.decode().lower()
    
    # nested source: MOCK -> exit 1
    mock_src_dir = tmp_path / "mock_src"
    mock_src_dir.mkdir()
    with open(mock_src_dir / "valid.json", "w") as f:
        json.dump({"data": [{"source": "MOCK"}]}, f)
        
    res = subprocess.run([sys.executable, check_script, str(mock_src_dir)], capture_output=True, check=False)
    assert res.returncode == 1
    
    # broken JSON -> exit 2
    broken_dir = tmp_path / "broken"
    broken_dir.mkdir()
    with open(broken_dir / "broken.json", "w") as f:
        f.write("{broken")
        
    res = subprocess.run([sys.executable, check_script, str(broken_dir)], capture_output=True, check=False)
    assert res.returncode == 2

    # _manifest.json origin mock -> exit 1
    manifest_dir = tmp_path / "manifest"
    manifest_dir.mkdir()
    with open(manifest_dir / "_manifest.json", "w") as f:
        json.dump({"files": [{"name": "file.json", "origin": "mock"}]}, f)
    with open(manifest_dir / "file.json", "w") as f:
        json.dump({"source": "real"}, f)
        
    res = subprocess.run([sys.executable, check_script, str(manifest_dir)], capture_output=True, check=False)
    assert res.returncode == 1
    assert "file.json" in res.stdout.decode()

    # missing default dir -> skip without error
    res = subprocess.run([sys.executable, check_script, str(tmp_path / "missing")], capture_output=True, check=False)
    assert res.returncode == 0

def test_research_mock_files(generated_mock_data):
    # Verify presence
    files = ["external_forecasts", "forecast_vintages", "base_rates", "ai_estimates", "dataset_catalog"]
    for fname in files:
        data_path = generated_mock_data / f"{fname}.json"
        assert data_path.exists(), f"{fname}.json not generated"
        with open(data_path) as f:
            data = json.load(f)
            
        schema = load_schema(fname)
        validator = Draft202012Validator(schema, format_checker=FormatChecker())
        validator.validate(data)

    # Specific tests for external_forecasts
    with open(generated_mock_data / "external_forecasts.json") as f:
        ext = json.load(f)
        forecasters = {r["forecaster"] for r in ext}
        assert len(forecasters) >= 3
        indicators = {r["indicator"] for r in ext}
        assert "gdp_growth_real_pct" in indicators
        assert "population" in indicators
        assert "fertility_rate" in indicators
        
        pop_geos = {r["geo"] for r in ext if r["indicator"] == "population"}
        assert "AR" in pop_geos
        provs = [g for g in pop_geos if g.startswith("AR-")]
        assert len(provs) >= 3
        
        mappings = {r["scenario_mapping"] for r in ext}
        assert mappings.issuperset({"pessimistic", "expected", "optimistic", "not_stated"})
        
        not_stated_count = sum(1 for r in ext if r["scenario_mapping"] == "not_stated")
        assert not_stated_count >= 2
        
        null_value_count = sum(1 for r in ext if r.get("value") is None)
        assert null_value_count >= 3
        
        max_year = max(r["year"] for r in ext)
        assert max_year >= 2056
        
    # Specific tests for forecast_vintages
    with open(generated_mock_data / "forecast_vintages.json") as f:
        vint = json.load(f)
        forecasters = {r["forecaster"] for r in vint}
        assert len(forecasters) >= 2
        for r in vint:
            assert 2008 <= r["target_year"] <= 2020
            assert 1 <= r["horizon_years"] <= 5
            assert -10 <= r["forecast_value"] <= 10
            v_year = int(r["vintage_date"].split("-")[0])
            assert r["horizon_years"] == r["target_year"] - v_year

    # Specific tests for base_rates
    with open(generated_mock_data / "base_rates.json") as f:
        base = json.load(f)
        assert len(base) >= 6
        null_value_count = sum(1 for r in base if r.get("value") is None and r.get("note"))
        assert null_value_count >= 1

    # Specific tests for ai_estimates
    with open(generated_mock_data / "ai_estimates.json") as f:
        ai = json.load(f)
        assert len(ai) >= 14
        metrics = {r["outcome_metric"] for r in ai}
        assert len(metrics) >= 3
        geos = {r["geography"] for r in ai}
        assert len(geos) >= 3
        assert "argentina" in geos
        mappings = {r["scenario_mapping"] for r in ai}
        assert mappings == {"pessimistic", "expected", "optimistic", "not_stated"}
        pubs = {r["publisher_type"] for r in ai}
        assert len(pubs) >= 3
        conflict_notes = sum(1 for r in ai if r.get("sponsor_conflict_note") is not None)
        assert conflict_notes >= 2
        derived = sum(1 for r in ai if r.get("derived_annualized_pp") is not None)
        assert derived >= 3
        obs = sum(1 for r in ai if r["record_type"] == "observed")
        assert obs >= 2
        exp = sum(1 for r in ai if r["record_type"] == "exposure")
        assert exp >= 2
        
    # Specific tests for dataset_catalog
    with open(generated_mock_data / "dataset_catalog.json") as f:
        cat = json.load(f)
        assert len(cat) >= 5
        not_opened = [r for r in cat if r["access"] == "not_opened" and r.get("note")]
        assert len(not_opened) >= 1
        uses = {r.get("recommended_use") for r in cat if r.get("recommended_use")}
        assert uses == {"calibration", "baseline", "scenario_structure"}
