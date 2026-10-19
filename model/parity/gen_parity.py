import json
import sys
from pathlib import Path

import numpy as np

# Ensure model/src is on sys.path when running script directly (audit F10)
SRC_DIR = Path(__file__).resolve().parent.parent / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from argmodel.population.cohort import project_population

PARITY_DIR = Path(__file__).parent


def build_population_parity_payload() -> dict:
    """Build the deterministic population parity dataset for cross-language validation."""
    rng = np.random.default_rng(42)

    A = 101  # Age 0 to 100+
    T = 5    # 5 years projection

    n_t0 = rng.uniform(5000, 100000, size=A).round()

    # Survival: ranges from 0.8 to 0.99
    survival = rng.uniform(0.8, 0.99, size=(T, A))
    # Oldest age open interval might have lower survival
    survival[:, -1] = rng.uniform(0.5, 0.7, size=T)

    # Fertility: only active between ages 15 and 50
    fertility = np.zeros((T, A))
    fertility[:, 15:51] = rng.uniform(0.01, 0.1, size=(T, 36))

    # Migration: can be positive or negative
    migration = rng.uniform(-1000, 1000, size=(T, A)).round()

    # Project
    res = project_population(n_t0, survival, fertility, migration)

    return {
        "n_t0": n_t0.tolist(),
        "survival": survival.tolist(),
        "fertility": fertility.tolist(),
        "migration": migration.tolist(),
        "expected": res.tolist(),
    }


def generate_population_parity() -> None:
    payload = build_population_parity_payload()
    output_path = PARITY_DIR / "population_parity.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)


def build_population_invalid_payload() -> list[dict]:
    """Build invalid input test cases matching the validation table in model-population-hardening.md."""
    return [
        {
            "name": "a_under_2_single_age",
            "func": "step_population",
            "inputs": {
                "n_t": [100.0],
                "survival": [0.9],
                "fertility": [0.1],
                "migration": [0.0],
            },
            "expected_error": "step_population needs at least 2 age groups, got 1",
        },
        {
            "name": "a_under_2_zero_age",
            "func": "step_population",
            "inputs": {
                "n_t": [],
                "survival": [],
                "fertility": [],
                "migration": [],
            },
            "expected_error": "step_population needs at least 2 age groups, got 0",
        },
        {
            "name": "survival_length_mismatch",
            "func": "step_population",
            "inputs": {
                "n_t": [100.0, 100.0],
                "survival": [0.9],
                "fertility": [0.1, 0.1],
                "migration": [0.0, 0.0],
            },
            "expected_error": "step_population: survival has length 1, expected 2",
        },
        {
            "name": "fertility_length_mismatch",
            "func": "step_population",
            "inputs": {
                "n_t": [100.0, 100.0],
                "survival": [0.9, 0.9],
                "fertility": [0.1],
                "migration": [0.0, 0.0],
            },
            "expected_error": "step_population: fertility has length 1, expected 2",
        },
        {
            "name": "migration_length_mismatch",
            "func": "step_population",
            "inputs": {
                "n_t": [100.0, 100.0],
                "survival": [0.9, 0.9],
                "fertility": [0.1, 0.1],
                "migration": [0.0, 0.0, 0.0],
            },
            "expected_error": "step_population: migration has length 3, expected 2",
        },
        {
            "name": "n_t_nan",
            "func": "step_population",
            "inputs": {
                "n_t": [100.0, "NaN"],
                "survival": [0.9, 0.9],
                "fertility": [0.1, 0.1],
                "migration": [0.0, 0.0],
            },
            "expected_error": "step_population: n_t contains a value that is not finite",
        },
        {
            "name": "survival_nan",
            "func": "step_population",
            "inputs": {
                "n_t": [100.0, 100.0],
                "survival": [0.9, "NaN"],
                "fertility": [0.1, 0.1],
                "migration": [0.0, 0.0],
            },
            "expected_error": "step_population: survival contains a value that is not finite",
        },
        {
            "name": "fertility_inf",
            "func": "step_population",
            "inputs": {
                "n_t": [100.0, 100.0],
                "survival": [0.9, 0.9],
                "fertility": [0.1, "Infinity"],
                "migration": [0.0, 0.0],
            },
            "expected_error": "step_population: fertility contains a value that is not finite",
        },
        {
            "name": "migration_neginf",
            "func": "step_population",
            "inputs": {
                "n_t": [100.0, 100.0],
                "survival": [0.9, 0.9],
                "fertility": [0.1, 0.1],
                "migration": [0.0, "-Infinity"],
            },
            "expected_error": "step_population: migration contains a value that is not finite",
        },
        {
            "name": "survival_above_one",
            "func": "step_population",
            "inputs": {
                "n_t": [100.0, 100.0],
                "survival": [0.9, 1.05],
                "fertility": [0.1, 0.1],
                "migration": [0.0, 0.0],
            },
            "expected_error": "step_population: survival must be between 0 and 1",
        },
        {
            "name": "survival_negative",
            "func": "step_population",
            "inputs": {
                "n_t": [100.0, 100.0],
                "survival": [0.9, -0.01],
                "fertility": [0.1, 0.1],
                "migration": [0.0, 0.0],
            },
            "expected_error": "step_population: survival must be between 0 and 1",
        },
        {
            "name": "fertility_negative",
            "func": "step_population",
            "inputs": {
                "n_t": [100.0, 100.0],
                "survival": [0.9, 0.9],
                "fertility": [0.1, -0.1],
                "migration": [0.0, 0.0],
            },
            "expected_error": "step_population: fertility must not be negative",
        },
        {
            "name": "n_t_negative",
            "func": "step_population",
            "inputs": {
                "n_t": [100.0, -10.0],
                "survival": [0.9, 0.9],
                "fertility": [0.1, 0.1],
                "migration": [0.0, 0.0],
            },
            "expected_error": "step_population: n_t must not be negative",
        },
        {
            "name": "negative_cohort_age_0",
            "func": "step_population",
            "inputs": {
                "n_t": [10.0, 10.0],
                "survival": [0.5, 0.5],
                "fertility": [0.0, 0.0],
                "migration": [-5.0, 0.0],
            },
            "expected_error": "step_population: negative population in age group 0: -5",
        },
        {
            "name": "negative_cohort_age_1",
            "func": "step_population",
            "inputs": {
                "n_t": [10.0, 10.0, 10.0],
                "survival": [1.0, 1.0, 1.0],
                "fertility": [0.0, 0.0, 0.0],
                "migration": [0.0, -50.0, 0.0],
            },
            "expected_error": "step_population: negative population in age group 1: -40",
        },
        {
            "name": "project_survival_shape",
            "func": "project_population",
            "inputs": {
                "n_t0": [100.0, 100.0, 100.0],
                "survival": [[0.9, 0.9], [0.9, 0.9]],
                "fertility": [[0.1, 0.1, 0.1], [0.1, 0.1, 0.1]],
                "migration": [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]],
            },
            "expected_error": "project_population: survival must have shape (2, 3), got (2, 2)",
        },
        {
            "name": "project_fertility_shape",
            "func": "project_population",
            "inputs": {
                "n_t0": [100.0, 100.0, 100.0],
                "survival": [[0.9, 0.9, 0.9], [0.9, 0.9, 0.9]],
                "fertility": [[0.1, 0.1, 0.1]],
                "migration": [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]],
            },
            "expected_error": "project_population: fertility must have shape (2, 3), got (1, 3)",
        },
        {
            "name": "project_migration_shape",
            "func": "project_population",
            "inputs": {
                "n_t0": [100.0, 100.0, 100.0],
                "survival": [[0.9, 0.9, 0.9], [0.9, 0.9, 0.9]],
                "fertility": [[0.1, 0.1, 0.1], [0.1, 0.1, 0.1]],
                "migration": [[0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0]],
            },
            "expected_error": "project_population: migration must have shape (2, 3), got (2, 4)",
        },
        {
            "name": "project_year_error_wrapped",
            "func": "project_population",
            "inputs": {
                "n_t0": [10.0, 10.0, 10.0],
                "survival": [[1.0, 1.0, 1.0], [1.0, 1.0, 1.0]],
                "fertility": [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]],
                "migration": [[0.0, 0.0, 0.0], [0.0, -50.0, 0.0]],
            },
            "expected_error": "project_population: year 1: step_population: negative population in age group 1: -40",
        },
    ]


def generate_population_invalid() -> None:
    payload = build_population_invalid_payload()
    output_path = PARITY_DIR / "population_invalid.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)


if __name__ == "__main__":
    generate_population_parity()
    generate_population_invalid()
