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
    record["source_url"] = 123
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


valid_forecast_vintage = {
    "id": "v1",
    "forecaster": "IMF",
    "vintage_date": "2020-04-01",
    "indicator": "gdp_growth_real_pct",
    "target_year": 2021,
    "horizon_years": 1,
    "forecast_value": 3.0,
    "unit": "pct",
    "source_id": "economy:V01",
    "source": "IMF WEO",
    "source_url": None,
    "locator": None,
    "snippet": None,
    "confidence": "high",
    "retrieved_at": "2026-10-01",
    "note": "Some note"
}

def test_forecast_vintages_valid():
    validator = get_validator("forecast_vintages.schema.json")
    validator.validate([valid_forecast_vintage])

def test_forecast_vintages_missing_field():
    validator = get_validator("forecast_vintages.schema.json")
    record = valid_forecast_vintage.copy()
    del record["target_year"]
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_forecast_vintages_extra_field():
    validator = get_validator("forecast_vintages.schema.json")
    record = valid_forecast_vintage.copy()
    record["extra"] = "bad"
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_forecast_vintages_bad_enum():
    validator = get_validator("forecast_vintages.schema.json")
    record = valid_forecast_vintage.copy()
    record["indicator"] = "population"
    with pytest.raises(ValidationError):
        validator.validate([record])

valid_base_rate = {
    "id": "b1",
    "description": "Historical growth episodes",
    "country_or_group": "Latin America",
    "period": "1990-2010",
    "metric": "gdp_growth_real_pct",
    "value": 3.5,
    "unit": "pct",
    "definition": "Average 10-year growth",
    "source_id": "economy:B01",
    "source": "Maddison",
    "source_url": None,
    "locator": None,
    "snippet": None,
    "confidence": "high",
    "retrieved_at": "2026-10-01",
    "note": "Some note"
}

def test_base_rates_valid():
    validator = get_validator("base_rates.schema.json")
    validator.validate([valid_base_rate])

def test_base_rates_missing_field():
    validator = get_validator("base_rates.schema.json")
    record = valid_base_rate.copy()
    del record["definition"]
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_base_rates_extra_field():
    validator = get_validator("base_rates.schema.json")
    record = valid_base_rate.copy()
    record["extra"] = "bad"
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_base_rates_null_value_without_note():
    validator = get_validator("base_rates.schema.json")
    record = valid_base_rate.copy()
    record["value"] = None
    del record["note"]
    with pytest.raises(ValidationError):
        validator.validate([record])

valid_ai_estimate = {
    "id": "a1",
    "authors_or_institution": "Goldman Sachs",
    "title": "AI Impact",
    "publication_date": "2023-04-01",
    "publisher_type": "investment_bank",
    "sponsor_conflict_note": None,
    "record_type": "projection",
    "geography": "global",
    "geography_detail": None,
    "outcome_metric": "gdp_growth_pp_per_year",
    "horizon_start_year": 2024,
    "horizon_end_year": 2034,
    "value": 1.5,
    "value_low": 1.0,
    "value_high": 2.0,
    "unit": "pp",
    "scenario_by_source": "Baseline",
    "scenario_mapping": "expected",
    "mapping_rationale": "Central case",
    "method": "expert_judgment",
    "key_assumptions": None,
    "time_profile": "s_curve",
    "derived_annualized_pp": None,
    "derivation": None,
    "source_id": "ai:A01",
    "source": "GS Report",
    "source_url": None,
    "locator": None,
    "snippet": None,
    "confidence": "medium",
    "retrieved_at": "2026-10-01",
    "note": "Some note"
}

def test_ai_estimates_valid():
    validator = get_validator("ai_estimates.schema.json")
    validator.validate([valid_ai_estimate])

def test_ai_estimates_missing_field():
    validator = get_validator("ai_estimates.schema.json")
    record = valid_ai_estimate.copy()
    del record["method"]
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_ai_estimates_extra_field():
    validator = get_validator("ai_estimates.schema.json")
    record = valid_ai_estimate.copy()
    record["extra"] = "bad"
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_ai_estimates_null_values_without_note():
    validator = get_validator("ai_estimates.schema.json")
    record = valid_ai_estimate.copy()
    record["value"] = None
    record["value_low"] = None
    record["value_high"] = None
    del record["note"]
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_ai_estimates_other_without_note():
    validator = get_validator("ai_estimates.schema.json")
    record = valid_ai_estimate.copy()
    record["outcome_metric"] = "other"
    del record["note"]
    with pytest.raises(ValidationError):
        validator.validate([record])

valid_dataset_catalog = {
    "dataset_name": "WDI",
    "version": "2026",
    "publisher": "World Bank",
    "landing_url": "https://example.com",
    "direct_download_url": None,
    "variables": ["GDP"],
    "geographies": ["World"],
    "years_covered": "1960-2025",
    "frequency": "annual",
    "format": "csv",
    "license_or_terms": None,
    "access": "opened",
    "revisions_or_rebasing_notes": None,
    "recommended_use": "calibration",
    "source_id": "catalog:C01",
    "source": "WB",
    "source_url": None,
    "locator": None,
    "snippet": None,
    "confidence": "high",
    "retrieved_at": "2026-10-01",
    "note": "Some note"
}

def test_dataset_catalog_valid():
    validator = get_validator("dataset_catalog.schema.json")
    validator.validate([valid_dataset_catalog])

def test_dataset_catalog_missing_field():
    validator = get_validator("dataset_catalog.schema.json")
    record = valid_dataset_catalog.copy()
    del record["dataset_name"]
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_dataset_catalog_extra_field():
    validator = get_validator("dataset_catalog.schema.json")
    record = valid_dataset_catalog.copy()
    record["extra"] = "bad"
    with pytest.raises(ValidationError):
        validator.validate([record])

def test_dataset_catalog_empty_variables():
    validator = get_validator("dataset_catalog.schema.json")
    record = valid_dataset_catalog.copy()
    record["variables"] = []
    with pytest.raises(ValidationError):
        validator.validate([record])

