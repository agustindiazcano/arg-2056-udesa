import json
import pytest
from pathlib import Path
from jsonschema import Draft202012Validator, ValidationError

SCHEMAS_DIR = Path("data/schemas")

SCHEMA_FILES = [
    "economy_series.schema.json",
    "resource_production.schema.json",
    "population.schema.json",
    "andes_events.schema.json"
]

@pytest.mark.parametrize("schema_name", SCHEMA_FILES)
def test_schema_is_valid_draft202012(schema_name):
    schema_path = SCHEMAS_DIR / schema_name
    assert schema_path.exists(), f"{schema_name} does not exist"
    with open(schema_path) as f:
        schema = json.load(f)
    Draft202012Validator.check_schema(schema)

def get_validator(schema_name):
    with open(SCHEMAS_DIR / schema_name) as f:
        schema = json.load(f)
    return Draft202012Validator(schema)

VALID_RECORDS = {
    "economy_series.schema.json": {
        "country": "ARG",
        "year": 2000,
        "indicator": "gdp_constant_usd",
        "value": 100.5,
        "unit": "USD",
        "source": "World Bank",
        "retrieved_at": "2023-10-01"
    },
    "resource_production.schema.json": {
        "resource": "lithium",
        "geo": "AR-J",
        "year": 2020,
        "value": 500.0,
        "unit": "tonnes",
        "source": "Secretaria de Mineria",
        "retrieved_at": "2023-10-01"
    },
    "population.schema.json": {
        "geo": "AR",
        "year": 2020,
        "value": 45000000,
        "unit": "people",
        "source": "INDEC",
        "retrieved_at": "2023-10-01"
    },
    "andes_events.schema.json": {
        "id": "event_1",
        "name": "Departure",
        "day_of_campaign": 10,
        "date": "1817-01-19",
        "date_precision": "day",
        "lat": -32.8,
        "lon": -69.2,
        "elevation_m": 2500.0,
        "forces": [
            {"side": "patriot", "men": 5000}
        ],
        "source": "Mitre",
        "retrieved_at": "2023-10-01"
    }
}

@pytest.mark.parametrize("schema_name", SCHEMA_FILES)
def test_valid_fixture_passes(schema_name):
    validator = get_validator(schema_name)
    record = VALID_RECORDS[schema_name]
    validator.validate([record])

@pytest.mark.parametrize("schema_name", SCHEMA_FILES)
def test_missing_source_fails(schema_name):
    validator = get_validator(schema_name)
    record = VALID_RECORDS[schema_name].copy()
    del record["source"]
    with pytest.raises(ValidationError):
        validator.validate([record])

@pytest.mark.parametrize("schema_name", SCHEMA_FILES)
def test_missing_retrieved_at_fails(schema_name):
    validator = get_validator(schema_name)
    record = VALID_RECORDS[schema_name].copy()
    del record["retrieved_at"]
    with pytest.raises(ValidationError):
        validator.validate([record])

@pytest.mark.parametrize("schema_name", SCHEMA_FILES)
def test_invalid_date_fails(schema_name):
    validator = get_validator(schema_name)
    record = VALID_RECORDS[schema_name].copy()
    record["retrieved_at"] = "yesterday"
    with pytest.raises(ValidationError):
        validator.validate([record])

@pytest.mark.parametrize("schema_name", SCHEMA_FILES)
def test_unknown_extra_field_fails(schema_name):
    validator = get_validator(schema_name)
    record = VALID_RECORDS[schema_name].copy()
    record["unknown_field"] = "bad"
    with pytest.raises(ValidationError):
        validator.validate([record])

@pytest.mark.parametrize("schema_name", SCHEMA_FILES)
def test_null_numeric_value_requires_note(schema_name):
    validator = get_validator(schema_name)
    record = VALID_RECORDS[schema_name].copy()
    
    if schema_name == "andes_events.schema.json":
        record["elevation_m"] = None
        with pytest.raises(ValidationError):
            validator.validate([record])
        record["note"] = "Elevation unknown"
        validator.validate([record])
        
        record2 = VALID_RECORDS[schema_name].copy()
        record2["forces"] = [{"side": "patriot", "men": None}]
        with pytest.raises(ValidationError):
            validator.validate([record2])
        record2["forces"][0]["note"] = "Men count unknown"
        validator.validate([record2])
    else:
        record["value"] = None
        with pytest.raises(ValidationError):
            validator.validate([record])
        record["note"] = "Data unavailable"
        validator.validate([record])
