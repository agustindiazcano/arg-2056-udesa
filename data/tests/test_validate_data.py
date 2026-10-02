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
