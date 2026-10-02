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
    
    assert len(files1) == 5
    assert len(files1) == len(files2)
    
    for f1, f2 in zip(files1, files2):
        assert f1.name == f2.name
        assert f1.read_bytes() == f2.read_bytes()

def test_schemas(generated_mock_data):
    files = ["economy_series", "resource_production", "population", "andes_events"]
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
    # Recursively check for provenance and numeric nulls
    errors = []
    
    # Check provenance if it looks like a record with source
    if isinstance(obj, dict):
        if "source" in obj and obj["source"] != "MOCK":
            errors.append("source is not MOCK")
        if "retrieved_at" in obj and obj["retrieved_at"] != "2026-10-02":
            errors.append("retrieved_at is not 2026-10-02")
                
        # Check null numeric values
        for k, v in obj.items():
            if v is None:
                # If a field is None and it is a numeric field that requires note (based on schema)
                # But schemas enforce this, we just need to verify that 'note' is at the same level
                if "note" not in obj:
                    errors.append(f"null value for {k} but no 'note' found at same level")
            elif isinstance(v, (dict, list)):
                errors.extend(_find_numeric_nulls_and_provenance(v))
    elif isinstance(obj, list):
        for item in obj:
            errors.extend(_find_numeric_nulls_and_provenance(item))
            
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

    # missing default dir -> skip without error
    res = subprocess.run([sys.executable, check_script, str(tmp_path / "missing")], capture_output=True, check=False)
    assert res.returncode == 0
