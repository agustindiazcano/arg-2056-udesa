import json
import sys
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker, ValidationError

sys.path.append(str(Path(__file__).parent.parent.parent))
from scripts.dataset_checks import check_projections

SCHEMAS_DIR = Path("data/schemas")
PROJECTIONS_SCHEMA = SCHEMAS_DIR / "production_projections.schema.json"

def get_validator(schema_path):
    with open(schema_path) as f:
        schema = json.load(f)
    return Draft202012Validator(schema, format_checker=FormatChecker())

def test_projections_schema_exists():
    assert PROJECTIONS_SCHEMA.exists()

@pytest.fixture
def proj_valid():
    return {
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

def test_projections_valid(proj_valid):
    get_validator(PROJECTIONS_SCHEMA).validate([proj_valid])

def test_projections_project_null_id_fails(proj_valid):
    proj_valid["project_id"] = None
    with pytest.raises(ValidationError):
        get_validator(PROJECTIONS_SCHEMA).validate([proj_valid])

def test_projections_province_non_null_id_fails(proj_valid):
    proj_valid["entity_type"] = "province"
    with pytest.raises(ValidationError):
        get_validator(PROJECTIONS_SCHEMA).validate([proj_valid])

def test_projections_lithium_without_unit_basis_fails(proj_valid):
    proj_valid["unit_basis"] = None
    with pytest.raises(ValidationError):
        get_validator(PROJECTIONS_SCHEMA).validate([proj_valid])

def test_projections_value_low_set_high_null_fails(proj_valid):
    proj_valid["value"] = None
    proj_valid["value_low"] = 100
    proj_valid["value_high"] = None
    with pytest.raises(ValidationError):
        get_validator(PROJECTIONS_SCHEMA).validate([proj_valid])

def test_projections_all_values_null_without_note_fails(proj_valid):
    proj_valid["value"] = None
    proj_valid["value_low"] = None
    proj_valid["value_high"] = None
    with pytest.raises(ValidationError):
        get_validator(PROJECTIONS_SCHEMA).validate([proj_valid])

def test_projections_unit_other_without_note_fails(proj_valid):
    proj_valid["unit"] = "other"
    with pytest.raises(ValidationError):
        get_validator(PROJECTIONS_SCHEMA).validate([proj_valid])

def test_projections_unknown_metric_fails(proj_valid):
    proj_valid["metric"] = "unknown_metric"
    with pytest.raises(ValidationError):
        get_validator(PROJECTIONS_SCHEMA).validate([proj_valid])

def test_projections_production_actual_fails(proj_valid):
    proj_valid["metric"] = "production_actual"
    with pytest.raises(ValidationError):
        get_validator(PROJECTIONS_SCHEMA).validate([proj_valid])

def test_projections_negative_value_fails(proj_valid):
    proj_valid["value"] = -10
    with pytest.raises(ValidationError):
        get_validator(PROJECTIONS_SCHEMA).validate([proj_valid])

def test_projections_year_1989_fails(proj_valid):
    proj_valid["year"] = 1989
    with pytest.raises(ValidationError):
        get_validator(PROJECTIONS_SCHEMA).validate([proj_valid])

def test_projections_missing_source_fails(proj_valid):
    del proj_valid["source"]
    with pytest.raises(ValidationError):
        get_validator(PROJECTIONS_SCHEMA).validate([proj_valid])

def test_projections_missing_retrieved_at_fails(proj_valid):
    del proj_valid["retrieved_at"]
    with pytest.raises(ValidationError):
        get_validator(PROJECTIONS_SCHEMA).validate([proj_valid])

def test_projections_bad_source_url_fails(proj_valid):
    proj_valid["source_url"] = "://"
    with pytest.raises(ValidationError):
        get_validator(PROJECTIONS_SCHEMA).validate([proj_valid])

def test_projections_extra_field_fails(proj_valid):
    proj_valid["extra"] = "field"
    with pytest.raises(ValidationError):
        get_validator(PROJECTIONS_SCHEMA).validate([proj_valid])

def test_check_projections_duplicate_key():
    p1 = {
        "entity_type": "project", "project_id": "p1", "geo": "AR-J", "resource": "lithium",
        "metric": "forecast", "year": 2030, "scenario": "base", "source": "S1", "value": 10
    }
    p2 = dict(p1)
    projects = [{"id": "p1", "geo": "AR-J", "resource": "lithium", "start_year": 2025}]
    errors = check_projections([p1, p2], projects)
    assert len(errors) == 1
    assert "Duplicate key" in errors[0]

def test_check_projections_same_key_different_source_passes():
    p1 = {
        "entity_type": "project", "project_id": "p1", "geo": "AR-J", "resource": "lithium",
        "metric": "forecast", "year": 2030, "scenario": "base", "source": "S1", "value": 10
    }
    p2 = dict(p1)
    p2["source"] = "S2"
    projects = [{"id": "p1", "geo": "AR-J", "resource": "lithium", "start_year": 2025}]
    assert len(check_projections([p1, p2], projects)) == 0

def test_check_projections_value_low_gt_high():
    p = {
        "entity_type": "national", "geo": "AR", "resource": "lithium",
        "metric": "forecast", "year": 2030, "scenario": "base", "source": "S1",
        "value": None, "value_low": 20, "value_high": 10
    }
    errors = check_projections([p], [])
    assert len(errors) == 1
    assert "value_low > value_high" in errors[0]

def test_check_projections_value_outside_range():
    p = {
        "entity_type": "national", "geo": "AR", "resource": "lithium",
        "metric": "forecast", "year": 2030, "scenario": "base", "source": "S1",
        "value": 30, "value_low": 10, "value_high": 20
    }
    errors = check_projections([p], [])
    assert len(errors) == 1
    assert "lies outside [value_low, value_high]" in errors[0]

def test_check_projections_unknown_project():
    p = {
        "entity_type": "project", "project_id": "p2", "geo": "AR-J", "resource": "lithium",
        "metric": "forecast", "year": 2030, "scenario": "base", "source": "S1", "value": 10
    }
    errors = check_projections([p], [])
    assert len(errors) == 1
    assert "unknown project_id" in errors[0]

def test_check_projections_geo_resource_mismatch():
    p = {
        "entity_type": "project", "project_id": "p1", "geo": "AR-K", "resource": "lithium",
        "metric": "forecast", "year": 2030, "scenario": "base", "source": "S1", "value": 10
    }
    projects = [{"id": "p1", "geo": "AR-J", "resource": "copper", "start_year": 2025}]
    errors = check_projections([p], projects)
    assert len(errors) == 1
    assert "geo or resource mismatch" in errors[0]

def test_check_projections_production_before_start():
    p = {
        "entity_type": "project", "project_id": "p1", "geo": "AR-J", "resource": "lithium",
        "metric": "production_expected", "year": 2024, "scenario": "base", "source": "S1", "value": 10
    }
    projects = [{"id": "p1", "geo": "AR-J", "resource": "lithium", "start_year": 2025}]
    errors = check_projections([p], projects)
    assert len(errors) == 1
    assert "precedes project start_year" in errors[0]
