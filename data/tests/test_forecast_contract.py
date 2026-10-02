import json

# We will implement these in the next step
import sys
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, ValidationError

sys.path.append(str(Path(__file__).parent.parent.parent))
from scripts.forecast_checks import check_forecast

SCHEMAS_DIR = Path("data/schemas")
SCHEMA_PATH = SCHEMAS_DIR / "forecast_output.schema.json"

def get_validator():
    with open(SCHEMA_PATH) as f:
        schema = json.load(f)
    return Draft202012Validator(schema)

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
                    {"year": 2026, "p10": 100.0, "p50": 110.0, "p90": 120.0},
                    {"year": 2027, "p10": 105.0, "p50": 115.0, "p90": 125.0}
                ]
            },
            {
                "indicator": "resource_production",
                "resource": "lithium",
                "geo": "AR-J",
                "scenario": "pessimistic",
                "ai_overlay": "on",
                "unit": "tonnes",
                "points": [
                    {"year": 2026, "p10": 50.0, "p50": 60.0, "p90": 70.0}
                ]
            }
        ]
    }

def test_valid_doc_passes(valid_doc):
    validator = get_validator()
    validator.validate(valid_doc)
    errors = check_forecast(valid_doc)
    assert errors == []

def test_missing_p50_fails(valid_doc):
    validator = get_validator()
    del valid_doc["series"][0]["points"][0]["p50"]
    with pytest.raises(ValidationError):
        validator.validate(valid_doc)

def test_p50_null_fails(valid_doc):
    validator = get_validator()
    valid_doc["series"][0]["points"][0]["p50"] = None
    with pytest.raises(ValidationError):
        validator.validate(valid_doc)

def test_resource_production_without_resource_fails(valid_doc):
    validator = get_validator()
    del valid_doc["series"][1]["resource"]
    with pytest.raises(ValidationError):
        validator.validate(valid_doc)

def test_gdp_per_capita_usd_with_resource_fails(valid_doc):
    validator = get_validator()
    valid_doc["series"][0]["resource"] = "lithium"
    with pytest.raises(ValidationError):
        validator.validate(valid_doc)

def test_unknown_scenario_fails(valid_doc):
    validator = get_validator()
    valid_doc["series"][0]["scenario"] = "impossible"
    with pytest.raises(ValidationError):
        validator.validate(valid_doc)

def test_unknown_ai_overlay_fails(valid_doc):
    validator = get_validator()
    valid_doc["series"][0]["ai_overlay"] = "maybe"
    with pytest.raises(ValidationError):
        validator.validate(valid_doc)

def test_extra_property_fails(valid_doc):
    validator = get_validator()
    valid_doc["extra_field"] = "bad"
    with pytest.raises(ValidationError):
        validator.validate(valid_doc)

def test_invalid_geo_fails(valid_doc):
    validator = get_validator()
    valid_doc["series"][0]["geo"] = "AR-99"
    with pytest.raises(ValidationError):
        validator.validate(valid_doc)

def test_empty_points_fails(valid_doc):
    validator = get_validator()
    valid_doc["series"][0]["points"] = []
    with pytest.raises(ValidationError):
        validator.validate(valid_doc)

def test_check_p10_greater_than_p50(valid_doc):
    valid_doc["series"][0]["points"][0]["p10"] = 115.0 # p50 is 110.0
    errors = check_forecast(valid_doc)
    assert len(errors) > 0
    assert any("p10 <= p50" in e for e in errors)

def test_check_p50_greater_than_p90(valid_doc):
    valid_doc["series"][0]["points"][0]["p50"] = 125.0 # p90 is 120.0
    errors = check_forecast(valid_doc)
    assert len(errors) > 0
    assert any("p50 <= p90" in e for e in errors)

def test_check_years_not_increasing(valid_doc):
    valid_doc["series"][0]["points"][1]["year"] = 2026 # previous is 2026
    errors = check_forecast(valid_doc)
    assert len(errors) > 0
    assert any("strictly increasing" in e.lower() or "increasing" in e.lower() for e in errors)

def test_check_year_outside_horizon(valid_doc):
    valid_doc["series"][0]["points"][0]["year"] = 2025 # horizon start is 2026
    errors = check_forecast(valid_doc)
    assert len(errors) > 0
    assert any("within horizon" in e.lower() or "outside horizon" in e.lower() or "horizon" in e.lower() for e in errors)

def test_check_duplicate_series_key(valid_doc):
    # Duplicate the first series
    valid_doc["series"].append(valid_doc["series"][0].copy())
    errors = check_forecast(valid_doc)
    assert len(errors) > 0
    assert any("duplicate" in e.lower() or "share the same key" in e.lower() for e in errors)


