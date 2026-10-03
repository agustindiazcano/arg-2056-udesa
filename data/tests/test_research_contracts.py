import json
import pytest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker, ValidationError

SCHEMAS_DIR = Path("data/schemas")

def get_validator(schema_name):
    with open(SCHEMAS_DIR / schema_name) as f:
        schema = json.load(f)
    return Draft202012Validator(schema, format_checker=FormatChecker())

valid_external_forecast = {
    "id": "f1",
    "forecaster": "IMF",
    "publication_title": "WEO",
    "vintage": "April 2026",
    "indicator": "gdp_growth_real_pct",
    "geo": "AR",
    "year": 2026,
    "value": 2.5,
    "value_low": 1.0,
    "value_high": 4.0,
    "unit": "pct",
    "price_basis": None,
    "scenario_by_source": "Baseline",
    "scenario_mapping": "expected",
    "mapping_rationale": "Central scenario",
    "variant": "medium",
    "assumptions": None,
    "source_id": "economy:S01",
    "source": "IMF WEO",
    "source_url": "https://example.com",
    "locator": "Page 10",
    "snippet": "Growth is projected to be 2.5%.",
    "confidence": "high",
    "retrieved_at": "2026-10-01",
    "note": "Some note"
}

def test_external_forecasts_valid():
    validator = get_validator("external_forecasts.schema.json")
    validator.validate([valid_external_forecast])

def test_external_forecasts_missing_field():
    validator = get_validator("external_forecasts.schema.json")
    record = valid_external_forecast.copy()
    del record["forecaster"]
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_external_forecasts_extra_field():
    validator = get_validator("external_forecasts.schema.json")
    record = valid_external_forecast.copy()
    record["extra"] = "bad"
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_external_forecasts_bad_enum():
    validator = get_validator("external_forecasts.schema.json")
    record = valid_external_forecast.copy()
    record["confidence"] = "super_high"
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_external_forecasts_bad_date():
    validator = get_validator("external_forecasts.schema.json")
    record = valid_external_forecast.copy()
    record["retrieved_at"] = "not-a-date"
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_external_forecasts_bad_url():
    validator = get_validator("external_forecasts.schema.json")
    record = valid_external_forecast.copy()
    record["source_url"] = "not a url"
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_external_forecasts_bad_source_id():
    validator = get_validator("external_forecasts.schema.json")
    record = valid_external_forecast.copy()
    record["source_id"] = "S01" # missing prefix
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_external_forecasts_value_low_without_high():
    validator = get_validator("external_forecasts.schema.json")
    record = valid_external_forecast.copy()
    record["value_high"] = None
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_external_forecasts_all_values_null_without_note():
    validator = get_validator("external_forecasts.schema.json")
    record = valid_external_forecast.copy()
    record["value"] = None
    record["value_low"] = None
    record["value_high"] = None
    del record["note"]
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_external_forecasts_mapping_rationale_null_when_not_stated():
    validator = get_validator("external_forecasts.schema.json")
    record = valid_external_forecast.copy()
    record["mapping_rationale"] = None
    # scenario_mapping is 'expected' (not 'not_stated') so it should fail
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_external_forecasts_indicator_other_without_note():
    validator = get_validator("external_forecasts.schema.json")
    record = valid_external_forecast.copy()
    record["indicator"] = "other"
    del record["note"]
    with pytest.raises(ValidationError):
        validator.validate([record])

