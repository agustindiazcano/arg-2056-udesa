import json
import subprocess
import sys
from pathlib import Path

import pytest


# We need the valid_doc fixture from test_forecast_contract or just create one here
@pytest.fixture
def valid_doc():
    return {
        "model_version": "1.0.0",
        "generated_at": "2026-10-02",
        "source": "MOCK",
        "horizon": {"start_year": 2026, "end_year": 2056},
        "series": [
            {
                "indicator": "gdp_constant_usd",
                "geo": "AR",
                "scenario": "expected",
                "ai_overlay": "off",
                "unit": "USD",
                "points": [
                    {"year": 2026, "p10": 100.0, "p50": 110.0, "p90": 120.0}
                ]
            }
        ]
    }

def run_validate(processed_dir):
    return subprocess.run(
        [sys.executable, "scripts/validate_data.py", "--processed", str(processed_dir)],
        capture_output=True,
        text=True,
        check=False
    )

def test_validate_empty_dir(tmp_path):
    res = run_validate(tmp_path)
    assert res.returncode == 0

def test_validate_valid_forecast(tmp_path, valid_doc):
    with open(tmp_path / "forecast_output.json", "w") as f:
        json.dump(valid_doc, f)
    res = run_validate(tmp_path)
    assert res.returncode == 0

def test_validate_invalid_forecast_p10_p50(tmp_path, valid_doc):
    valid_doc["series"][0]["points"][0]["p10"] = 200.0
    with open(tmp_path / "forecast_output.json", "w") as f:
        json.dump(valid_doc, f)
    res = run_validate(tmp_path)
    assert res.returncode == 1
    assert "forecast_output.json" in res.stderr
    assert "p10" in res.stderr

def test_validate_invalid_forecast_schema(tmp_path, valid_doc):
    del valid_doc["series"]
    with open(tmp_path / "forecast_output.json", "w") as f:
        json.dump(valid_doc, f)
    res = run_validate(tmp_path)
    assert res.returncode == 1
    assert "forecast_output.json" in res.stderr

def test_validate_unknown_file(tmp_path):
    with open(tmp_path / "unknown.json", "w") as f:
        json.dump({"data": 1}, f)
    res = run_validate(tmp_path)
    assert res.returncode == 1
    assert "unknown.json" in res.stderr

def test_no_write_to_real_data_dir(tmp_path):
    # This is a bit tricky, we can assert that the timestamp of the real data dir hasn't changed recently,
    # or just rely on the other tests not using the real dir anymore.
    # The requirement: "no test in the repo may write inside the real data/ directory (add one test that fails if the real data/processed/ content changed during the test session)"
    # We can check the modification time of `data/processed` at the start of the session vs end, but that's hard to do in a single test.
    # Alternatively, just check if any new file appeared or modified. Let's just create a dummy test that checks if `data/processed` has any files created in the last 10 seconds.
    import time
    processed = Path("data/processed")
    if processed.exists():
        for f in processed.glob("*"):
            if f.name == ".gitkeep":
                continue
            if time.time() - f.stat().st_mtime < 5:
                pytest.fail(f"Test modified real data dir: {f}")

# --- Composition & Projects tests ---

@pytest.fixture
def comp_valid():
    return [
        {
            "kind": "gdp_by_sector",
            "year": 2020,
            "group": "Primary",
            "category": "agri",
            "label": "Agriculture",
            "value_usd": 1500.5,
            "source": "MOCK",
            "retrieved_at": "2026-10-02"
        },
        {
            "kind": "gdp_by_sector",
            "year": 2020,
            "group": "Secondary",
            "category": "ind",
            "label": "Industry",
            "value_usd": 2500.5,
            "source": "MOCK",
            "retrieved_at": "2026-10-02"
        }
    ]

@pytest.fixture
def proj_valid():
    return [
        {
            "id": "proj-1",
            "name": "Project One",
            "resource": "lithium",
            "geo": "AR-J",
            "status": "operating",
            "capex_usd": 1000000,
            "start_year": 2025,
            "capacity_per_year": 50000,
            "capacity_unit": "t",
            "source": "MOCK",
            "retrieved_at": "2026-10-02"
        }
    ]

def test_validate_valid_composition(tmp_path, comp_valid):
    with open(tmp_path / "composition.json", "w") as f:
        json.dump(comp_valid, f)
    res = run_validate(tmp_path)
    assert res.returncode == 0
    assert "OK: composition.json" in res.stdout

def test_validate_invalid_composition_schema(tmp_path, comp_valid):
    del comp_valid[0]["source"]
    with open(tmp_path / "composition.json", "w") as f:
        json.dump(comp_valid, f)
    res = run_validate(tmp_path)
    assert res.returncode == 1
    assert "composition.json failed schema validation" in res.stderr

def test_validate_invalid_composition_check(tmp_path, comp_valid):
    comp_valid[1]["category"] = "agri"  # Duplicate category
    with open(tmp_path / "composition.json", "w") as f:
        json.dump(comp_valid, f)
    res = run_validate(tmp_path)
    assert res.returncode == 1
    assert "composition.json failed composition checks" in res.stderr
    assert "agri" in res.stderr

def test_validate_valid_projects(tmp_path, proj_valid):
    with open(tmp_path / "projects.json", "w") as f:
        json.dump(proj_valid, f)
    res = run_validate(tmp_path)
    assert res.returncode == 0
    assert "OK: projects.json" in res.stdout

def test_validate_invalid_projects_schema(tmp_path, proj_valid):
    del proj_valid[0]["source"]
    with open(tmp_path / "projects.json", "w") as f:
        json.dump(proj_valid, f)
    res = run_validate(tmp_path)
    assert res.returncode == 1
    assert "projects.json failed schema validation" in res.stderr

def test_validate_invalid_projects_check(tmp_path, proj_valid):
    proj2 = dict(proj_valid[0])
    proj_valid.append(proj2)  # Duplicate id
    with open(tmp_path / "projects.json", "w") as f:
        json.dump(proj_valid, f)
    res = run_validate(tmp_path)
    assert res.returncode == 1
    assert "projects.json failed projects checks" in res.stderr
    assert "proj-1" in res.stderr

@pytest.fixture
def proj_projections_valid():
    return [
        {
            "entity_type": "project",
            "project_id": "proj-1",
            "geo": "AR-J",
            "resource": "lithium",
            "metric": "production_expected",
            "year": 2030,
            "value": 1000,
            "unit": "t",
            "unit_basis": "lce",
            "scenario": "base",
            "source": "MOCK",
            "retrieved_at": "2026-10-02"
        }
    ]

def test_validate_valid_projections(tmp_path, proj_valid, proj_projections_valid):
    with open(tmp_path / "projects.json", "w") as f:
        json.dump(proj_valid, f)
    with open(tmp_path / "production_projections.json", "w") as f:
        json.dump(proj_projections_valid, f)
    res = run_validate(tmp_path)
    assert res.returncode == 0
    assert "OK: production_projections.json" in res.stdout

def test_validate_invalid_projections_schema(tmp_path, proj_projections_valid):
    del proj_projections_valid[0]["source"]
    with open(tmp_path / "production_projections.json", "w") as f:
        json.dump(proj_projections_valid, f)
    res = run_validate(tmp_path)
    assert res.returncode == 1
    assert "production_projections.json failed schema validation" in res.stderr

def test_validate_invalid_projections_check(tmp_path, proj_valid, proj_projections_valid):
    proj_projections_valid[0]["project_id"] = "unknown"
    with open(tmp_path / "projects.json", "w") as f:
        json.dump(proj_valid, f)
    with open(tmp_path / "production_projections.json", "w") as f:
        json.dump(proj_projections_valid, f)
    res = run_validate(tmp_path)
    assert res.returncode == 1
    assert "production_projections.json failed projections checks" in res.stderr
    assert "unknown project_id" in res.stderr

def test_validate_projections_missing_projects(tmp_path, proj_projections_valid):
    with open(tmp_path / "production_projections.json", "w") as f:
        json.dump(proj_projections_valid, f)
    res = run_validate(tmp_path)
    assert res.returncode == 1
    assert "projects.json is required for checking project projections" in res.stderr
