import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker, ValidationError

SCHEMAS_DIR = Path("data/schemas")
COMPOSITION_SCHEMA = SCHEMAS_DIR / "composition.schema.json"
PROJECTS_SCHEMA = SCHEMAS_DIR / "projects.schema.json"

def get_validator(schema_path):
    with open(schema_path) as f:
        schema = json.load(f)
    return Draft202012Validator(schema, format_checker=FormatChecker())

def test_composition_schema_exists():
    assert COMPOSITION_SCHEMA.exists()

def test_projects_schema_exists():
    assert PROJECTS_SCHEMA.exists()

@pytest.fixture
def comp_valid():
    return {
        "kind": "gdp_by_sector",
        "year": 2020,
        "group": "Primary",
        "category": "agriculture-1",
        "label": "Agriculture",
        "value_usd": 1500.5,
        "source": "MOCK",
        "retrieved_at": "2026-10-02"
    }

@pytest.fixture
def proj_valid():
    return {
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

def test_composition_valid(comp_valid):
    get_validator(COMPOSITION_SCHEMA).validate([comp_valid])

def test_composition_invalid_missing_source(comp_valid):
    del comp_valid["source"]
    with pytest.raises(ValidationError):
        get_validator(COMPOSITION_SCHEMA).validate([comp_valid])

def test_composition_invalid_missing_retrieved_at(comp_valid):
    del comp_valid["retrieved_at"]
    with pytest.raises(ValidationError):
        get_validator(COMPOSITION_SCHEMA).validate([comp_valid])

def test_composition_unknown_kind(comp_valid):
    comp_valid["kind"] = "unknown_kind"
    with pytest.raises(ValidationError):
        get_validator(COMPOSITION_SCHEMA).validate([comp_valid])

def test_composition_negative_value_usd(comp_valid):
    comp_valid["value_usd"] = -10
    with pytest.raises(ValidationError):
        get_validator(COMPOSITION_SCHEMA).validate([comp_valid])

def test_composition_value_null_without_note(comp_valid):
    comp_valid["value_usd"] = None
    with pytest.raises(ValidationError):
        get_validator(COMPOSITION_SCHEMA).validate([comp_valid])

def test_composition_bad_category_pattern(comp_valid):
    comp_valid["category"] = "Bad Category!"
    with pytest.raises(ValidationError):
        get_validator(COMPOSITION_SCHEMA).validate([comp_valid])

def test_composition_extra_field(comp_valid):
    comp_valid["extra"] = "field"
    with pytest.raises(ValidationError):
        get_validator(COMPOSITION_SCHEMA).validate([comp_valid])

def test_projects_valid(proj_valid):
    get_validator(PROJECTS_SCHEMA).validate([proj_valid])

def test_projects_geo_ar(proj_valid):
    proj_valid["geo"] = "AR"
    with pytest.raises(ValidationError):
        get_validator(PROJECTS_SCHEMA).validate([proj_valid])

def test_projects_capacity_without_unit(proj_valid):
    proj_valid["capacity_unit"] = None
    with pytest.raises(ValidationError):
        get_validator(PROJECTS_SCHEMA).validate([proj_valid])

def test_projects_extra_field(proj_valid):
    proj_valid["extra"] = "field"
    with pytest.raises(ValidationError):
        get_validator(PROJECTS_SCHEMA).validate([proj_valid])

# Tests for dataset_checks
import sys

sys.path.append(str(Path(__file__).parent.parent.parent))
from scripts.dataset_checks import check_composition, check_projects


def test_check_composition_duplicate_category():
    records = [
        {"kind": "gdp_by_sector", "year": 2020, "group": "Primary", "category": "cat1"},
        {"kind": "gdp_by_sector", "year": 2020, "group": "Secondary", "category": "cat1"}
    ]
    errors = check_composition(records)
    assert len(errors) == 1
    assert "cat1" in errors[0]

def test_check_composition_single_group():
    records = [
        {"kind": "gdp_by_sector", "year": 2020, "group": "Primary", "category": "cat1"}
    ]
    errors = check_composition(records)
    assert len(errors) == 1
    assert "group" in errors[0]

def test_check_composition_ok():
    records = [
        {"kind": "gdp_by_sector", "year": 2020, "group": "Primary", "category": "cat1"},
        {"kind": "gdp_by_sector", "year": 2020, "group": "Secondary", "category": "cat2"}
    ]
    assert len(check_composition(records)) == 0

def test_check_projects_duplicate_id():
    records = [
        {"id": "p1", "name": "Project 1"},
        {"id": "p1", "name": "Project 1 dup"}
    ]
    errors = check_projects(records)
    assert len(errors) == 1
    assert "p1" in errors[0]

def test_check_projects_ok():
    records = [
        {"id": "p1", "name": "Project 1"},
        {"id": "p2", "name": "Project 2"}
    ]
    assert len(check_projects(records)) == 0
