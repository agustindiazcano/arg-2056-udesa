import copy
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker, ValidationError

from scripts.dataset_checks import (
    check_fertility_schedule,
    check_life_table,
    check_migration_schedule,
    check_population_by_age,
)

SCHEMAS_DIR = Path("data/schemas")


def get_validator(schema_name: str) -> Draft202012Validator:
    with open(SCHEMAS_DIR / schema_name, encoding="utf-8") as f:
        schema = json.load(f)
    return Draft202012Validator(schema, format_checker=FormatChecker())


# -------------------------------------------------------------------------
# Fixtures for schema tests
# -------------------------------------------------------------------------

valid_population_by_age_record = {
    "geo": "AR",
    "year": 2000,
    "age": 25,
    "sex": "both",
    "persons": 650000.0,
    "source": "MOCK",
    "retrieved_at": "2026-10-02",
    "note": "Test note",
}

valid_fertility_schedule_record = {
    "geo": "AR",
    "year": 2000,
    "age": 25,
    "shape_f": 0.05,
    "female_share": 0.49,
    "tfr": 2.4,
    "source": "MOCK",
    "retrieved_at": "2026-10-02",
    "note": "Test note",
}

valid_life_table_record = {
    "geo": "AR",
    "year": 2000,
    "age": 0,
    "survival": 0.985,
    "e0": 74.2,
    "source": "MOCK",
    "retrieved_at": "2026-10-02",
    "note": "Test note",
}

valid_migration_schedule_record = {
    "geo": "AR",
    "year": 2000,
    "age": 25,
    "shape_m": 0.03,
    "net_migrants": 5000.0,
    "source": "MOCK",
    "retrieved_at": "2026-10-02",
    "note": "Test note",
}


# -------------------------------------------------------------------------
# 1. Schema tests: population_by_age
# -------------------------------------------------------------------------


def test_population_by_age_schema_valid():
    validator = get_validator("population_by_age.schema.json")
    validator.validate([valid_population_by_age_record])


@pytest.mark.parametrize(
    "field", ["geo", "year", "age", "sex", "persons", "source", "retrieved_at"]
)
def test_population_by_age_schema_missing_required(field):
    validator = get_validator("population_by_age.schema.json")
    record = copy.deepcopy(valid_population_by_age_record)
    del record[field]
    with pytest.raises(ValidationError):
        validator.validate([record])


def test_population_by_age_schema_additional_properties():
    validator = get_validator("population_by_age.schema.json")
    record = copy.deepcopy(valid_population_by_age_record)
    record["extra_field"] = 123
    with pytest.raises(ValidationError):
        validator.validate([record])


@pytest.mark.parametrize(
    "patch",
    [
        {"age": -1},
        {"age": 101},
        {"sex": "male"},
        {"persons": -10.0},
        {"geo": "ARG"},
        {"geo": "invalid"},
        {"retrieved_at": "not-a-date"},
    ],
)
def test_population_by_age_schema_out_of_range(patch):
    validator = get_validator("population_by_age.schema.json")
    record = copy.deepcopy(valid_population_by_age_record)
    record.update(patch)
    with pytest.raises(ValidationError):
        validator.validate([record])


def test_population_by_age_schema_null_without_note():
    validator = get_validator("population_by_age.schema.json")
    record = copy.deepcopy(valid_population_by_age_record)
    record["persons"] = None
    del record["note"]
    with pytest.raises(ValidationError):
        validator.validate([record])


# -------------------------------------------------------------------------
# 2. Schema tests: fertility_schedule
# -------------------------------------------------------------------------


def test_fertility_schedule_schema_valid():
    validator = get_validator("fertility_schedule.schema.json")
    validator.validate([valid_fertility_schedule_record])


@pytest.mark.parametrize(
    "field",
    [
        "geo",
        "year",
        "age",
        "shape_f",
        "female_share",
        "tfr",
        "source",
        "retrieved_at",
    ],
)
def test_fertility_schedule_schema_missing_required(field):
    validator = get_validator("fertility_schedule.schema.json")
    record = copy.deepcopy(valid_fertility_schedule_record)
    del record[field]
    with pytest.raises(ValidationError):
        validator.validate([record])


def test_fertility_schedule_schema_additional_properties():
    validator = get_validator("fertility_schedule.schema.json")
    record = copy.deepcopy(valid_fertility_schedule_record)
    record["extra"] = "bad"
    with pytest.raises(ValidationError):
        validator.validate([record])


@pytest.mark.parametrize(
    "patch",
    [
        {"age": -1},
        {"age": 101},
        {"shape_f": -0.1},
        {"female_share": -0.01},
        {"female_share": 1.01},
        {"tfr": -1.0},
        {"geo": "INVALID"},
        {"retrieved_at": "yesterday"},
    ],
)
def test_fertility_schedule_schema_out_of_range(patch):
    validator = get_validator("fertility_schedule.schema.json")
    record = copy.deepcopy(valid_fertility_schedule_record)
    record.update(patch)
    with pytest.raises(ValidationError):
        validator.validate([record])


@pytest.mark.parametrize("field", ["shape_f", "female_share", "tfr"])
def test_fertility_schedule_schema_null_without_note(field):
    validator = get_validator("fertility_schedule.schema.json")
    record = copy.deepcopy(valid_fertility_schedule_record)
    record[field] = None
    del record["note"]
    with pytest.raises(ValidationError):
        validator.validate([record])


# -------------------------------------------------------------------------
# 3. Schema tests: life_table
# -------------------------------------------------------------------------


def test_life_table_schema_valid():
    validator = get_validator("life_table.schema.json")
    validator.validate([valid_life_table_record])


@pytest.mark.parametrize(
    "field", ["geo", "year", "age", "survival", "e0", "source", "retrieved_at"]
)
def test_life_table_schema_missing_required(field):
    validator = get_validator("life_table.schema.json")
    record = copy.deepcopy(valid_life_table_record)
    del record[field]
    with pytest.raises(ValidationError):
        validator.validate([record])


def test_life_table_schema_additional_properties():
    validator = get_validator("life_table.schema.json")
    record = copy.deepcopy(valid_life_table_record)
    record["extra"] = 42
    with pytest.raises(ValidationError):
        validator.validate([record])


@pytest.mark.parametrize(
    "patch",
    [
        {"age": -1},
        {"age": 101},
        {"survival": -0.01},
        {"survival": 1.01},
        {"e0": -5.0},
        {"geo": "AR_BA"},
        {"retrieved_at": "bad-date"},
    ],
)
def test_life_table_schema_out_of_range(patch):
    validator = get_validator("life_table.schema.json")
    record = copy.deepcopy(valid_life_table_record)
    record.update(patch)
    with pytest.raises(ValidationError):
        validator.validate([record])


@pytest.mark.parametrize("field", ["survival", "e0"])
def test_life_table_schema_null_without_note(field):
    validator = get_validator("life_table.schema.json")
    record = copy.deepcopy(valid_life_table_record)
    record[field] = None
    del record["note"]
    with pytest.raises(ValidationError):
        validator.validate([record])


# -------------------------------------------------------------------------
# 4. Schema tests: migration_schedule
# -------------------------------------------------------------------------


def test_migration_schedule_schema_valid():
    validator = get_validator("migration_schedule.schema.json")
    validator.validate([valid_migration_schedule_record])


@pytest.mark.parametrize(
    "field", ["geo", "year", "age", "shape_m", "net_migrants", "source", "retrieved_at"]
)
def test_migration_schedule_schema_missing_required(field):
    validator = get_validator("migration_schedule.schema.json")
    record = copy.deepcopy(valid_migration_schedule_record)
    del record[field]
    with pytest.raises(ValidationError):
        validator.validate([record])


def test_migration_schedule_schema_additional_properties():
    validator = get_validator("migration_schedule.schema.json")
    record = copy.deepcopy(valid_migration_schedule_record)
    record["foo"] = "bar"
    with pytest.raises(ValidationError):
        validator.validate([record])


@pytest.mark.parametrize(
    "patch",
    [
        {"age": -1},
        {"age": 101},
        {"geo": "123"},
        {"retrieved_at": "2026/10/02"},
    ],
)
def test_migration_schedule_schema_out_of_range(patch):
    validator = get_validator("migration_schedule.schema.json")
    record = copy.deepcopy(valid_migration_schedule_record)
    record.update(patch)
    with pytest.raises(ValidationError):
        validator.validate([record])


@pytest.mark.parametrize("field", ["shape_m", "net_migrants"])
def test_migration_schedule_schema_null_without_note(field):
    validator = get_validator("migration_schedule.schema.json")
    record = copy.deepcopy(valid_migration_schedule_record)
    record[field] = None
    del record["note"]
    with pytest.raises(ValidationError):
        validator.validate([record])


# -------------------------------------------------------------------------
# 5. Check tests: check_population_by_age
# -------------------------------------------------------------------------


def test_check_population_by_age_valid():
    records = [
        {
            "geo": "AR",
            "year": 2000,
            "age": a,
            "sex": "both",
            "persons": 1000.0,
            "source": "MOCK",
            "retrieved_at": "2026-10-02",
        }
        for a in range(101)
    ]
    # Total sum is 101 * 1000 = 101,000.
    pop_records = [{"geo": "AR", "year": 2000, "value": 101000}]
    errors = check_population_by_age(records, pop_records)
    assert errors == []


def test_check_population_by_age_incomplete_ages():
    records = [
        {
            "geo": "AR",
            "year": 2000,
            "age": a,
            "sex": "both",
            "persons": 1000.0,
            "source": "MOCK",
            "retrieved_at": "2026-10-02",
        }
        for a in range(50)  # only 50 ages
    ]
    errors = check_population_by_age(records)
    assert any("ages 0 to 100 do not appear exactly once" in e for e in errors)
    assert any("('AR', 2000)" in e or "(AR, 2000)" in e for e in errors)


def test_check_population_by_age_negative_persons():
    records = [
        {
            "geo": "AR",
            "year": 2000,
            "age": a,
            "sex": "both",
            "persons": -5.0 if a == 10 else 1000.0,
            "source": "MOCK",
            "retrieved_at": "2026-10-02",
        }
        for a in range(101)
    ]
    errors = check_population_by_age(records)
    assert any("negative persons -5.0 for age 10" in e for e in errors)


def test_check_population_by_age_mismatch_population_totals():
    records = [
        {
            "geo": "AR",
            "year": 2000,
            "age": a,
            "sex": "both",
            "persons": 1000.0,
            "source": "MOCK",
            "retrieved_at": "2026-10-02",
        }
        for a in range(101)
    ]
    # Total sum is 101,000. Population total is 120,000 (> 0.5% diff).
    pop_records = [{"geo": "AR", "year": 2000, "value": 120000}]
    errors = check_population_by_age(records, pop_records)
    assert any(
        "differs from population" in e
        and "('AR', 2000)" in e
        and "101000" in e
        and "120000" in e
        for e in errors
    )


def test_check_population_by_age_within_tolerance():
    records = [
        {
            "geo": "AR",
            "year": 2000,
            "age": a,
            "sex": "both",
            "persons": 1000.0,
            "source": "MOCK",
            "retrieved_at": "2026-10-02",
        }
        for a in range(101)
    ]
    # Total sum is 101,000. Population is 101,200 (diff 200 / 101200 = 0.19% < 0.5%).
    pop_records = [{"geo": "AR", "year": 2000, "value": 101200}]
    errors = check_population_by_age(records, pop_records)
    assert errors == []


# -------------------------------------------------------------------------
# 6. Check tests: check_fertility_schedule
# -------------------------------------------------------------------------


def test_check_fertility_schedule_valid():
    ages = range(15, 50)  # 35 ages
    share = 1.0 / len(ages)
    records = [
        {
            "geo": "AR",
            "year": 2000,
            "age": a,
            "shape_f": share,
            "female_share": 0.49,
            "tfr": 2.3,
            "source": "MOCK",
            "retrieved_at": "2026-10-02",
        }
        for a in ages
    ]
    errors = check_fertility_schedule(records)
    assert errors == []


def test_check_fertility_schedule_bad_shape_sum():
    ages = range(15, 50)
    share = 0.02  # sums to 0.70 != 1.0
    records = [
        {
            "geo": "AR",
            "year": 2000,
            "age": a,
            "shape_f": share,
            "female_share": 0.49,
            "tfr": 2.3,
            "source": "MOCK",
            "retrieved_at": "2026-10-02",
        }
        for a in ages
    ]
    errors = check_fertility_schedule(records)
    assert any("shape_f sum" in e and "!= 1.0 within 1e-9" in e for e in errors)


def test_check_fertility_schedule_bad_female_share():
    records = [
        {
            "geo": "AR",
            "year": 2000,
            "age": 20,
            "shape_f": 1.0,
            "female_share": 1.25,
            "tfr": 2.3,
            "source": "MOCK",
            "retrieved_at": "2026-10-02",
        }
    ]
    errors = check_fertility_schedule(records)
    assert any("female_share 1.25 outside [0, 1]" in e for e in errors)


def test_check_fertility_schedule_tfr_mismatch():
    records = [
        {
            "geo": "AR",
            "year": 2000,
            "age": 20,
            "shape_f": 0.5,
            "female_share": 0.49,
            "tfr": 2.3,
            "source": "MOCK",
            "retrieved_at": "2026-10-02",
        },
        {
            "geo": "AR",
            "year": 2000,
            "age": 21,
            "shape_f": 0.5,
            "female_share": 0.49,
            "tfr": 2.5,  # mismatch with 2.3
            "source": "MOCK",
            "retrieved_at": "2026-10-02",
        },
    ]
    errors = check_fertility_schedule(records)
    assert any("tfr mismatch" in e and "(2.5 != 2.3)" in e for e in errors)


# -------------------------------------------------------------------------
# 7. Check tests: check_life_table
# -------------------------------------------------------------------------


def _make_consistent_life_table(geo="AR", year=2000):
    survivals = [0.99] * 100 + [0.70]
    l = [1.0]
    for s in survivals[:100]:
        l.append(l[-1] * s)
    # L_a = 0.5 * (l_a + l_{a+1}) for a in 0..99
    sum_L = sum(0.5 * (l[a] + l[a + 1]) for a in range(100))
    # open interval 100+: l_100 / (1 - survival[100])
    L_open = l[100] / (1.0 - survivals[100])
    e0_implied = sum_L + L_open
    e0_rounded = round(e0_implied, 2)

    return [
        {
            "geo": geo,
            "year": year,
            "age": a,
            "survival": survivals[a],
            "e0": e0_rounded,
            "source": "MOCK",
            "retrieved_at": "2026-10-02",
        }
        for a in range(101)
    ], e0_rounded, e0_implied


def test_check_life_table_valid():
    records, _, _ = _make_consistent_life_table()
    errors = check_life_table(records)
    assert errors == []


def test_check_life_table_incomplete_ages():
    records, _, _ = _make_consistent_life_table()
    errors = check_life_table(records[:50])
    assert any("ages 0 to 100 do not appear exactly once" in e for e in errors)


def test_check_life_table_survival_out_of_range():
    records, _, _ = _make_consistent_life_table()
    records[10]["survival"] = 1.05
    errors = check_life_table(records)
    assert any("survival 1.05 outside [0, 1] for age 10" in e for e in errors)


def test_check_life_table_e0_mismatch():
    records, _, _ = _make_consistent_life_table()
    records[5]["e0"] = 99.0
    errors = check_life_table(records)
    assert any("e0 mismatch" in e for e in errors)


def test_check_life_table_e0_inconsistent_with_survival():
    records, e0, _ = _make_consistent_life_table()
    for r in records:
        r["e0"] = e0 + 5.0  # off by 5 years > 0.1
    errors = check_life_table(records)
    assert any("differs from implied life expectancy" in e and "by more than 0.1 years" in e for e in errors)


# -------------------------------------------------------------------------
# 8. Check tests: check_migration_schedule
# -------------------------------------------------------------------------


def test_check_migration_schedule_valid():
    records = [
        {
            "geo": "AR",
            "year": 2000,
            "age": a,
            "shape_m": 1.0 / 101,
            "net_migrants": 5000.0,
            "source": "MOCK",
            "retrieved_at": "2026-10-02",
        }
        for a in range(101)
    ]
    errors = check_migration_schedule(records)
    assert errors == []


def test_check_migration_schedule_bad_shape_sum():
    records = [
        {
            "geo": "AR",
            "year": 2000,
            "age": a,
            "shape_m": 0.005,  # sums to ~0.505 != 1.0
            "net_migrants": 5000.0,
            "source": "MOCK",
            "retrieved_at": "2026-10-02",
        }
        for a in range(101)
    ]
    errors = check_migration_schedule(records)
    assert any("shape_m sum" in e and "!= 1.0 within 1e-9" in e for e in errors)


def test_check_migration_schedule_net_migrants_mismatch():
    records = [
        {
            "geo": "AR",
            "year": 2000,
            "age": a,
            "shape_m": 1.0 / 101,
            "net_migrants": 6000.0 if a == 10 else 5000.0,
            "source": "MOCK",
            "retrieved_at": "2026-10-02",
        }
        for a in range(101)
    ]
    errors = check_migration_schedule(records)
    assert any("net_migrants mismatch" in e for e in errors)


# -------------------------------------------------------------------------
# 9. Provenance and null checks across all 4 datasets
# -------------------------------------------------------------------------


@pytest.mark.parametrize(
    "func,record",
    [
        (check_population_by_age, valid_population_by_age_record),
        (check_fertility_schedule, valid_fertility_schedule_record),
        (check_life_table, valid_life_table_record),
        (check_migration_schedule, valid_migration_schedule_record),
    ],
)
def test_missing_source_or_retrieved_at(func, record):
    rec1 = copy.deepcopy(record)
    del rec1["source"]
    assert any("missing source" in e for e in func([rec1]))

    rec2 = copy.deepcopy(record)
    del rec2["retrieved_at"]
    assert any("missing retrieved_at" in e for e in func([rec2]))
