import json
from pathlib import Path

import numpy as np
import pytest
from argmodel.population.cohort import project_population, step_population
from parity.gen_parity import build_population_parity_payload

PARITY_DIR = Path(__file__).resolve().parent.parent / "parity"


def parse_py_input(val):
    if isinstance(val, list):
        if val and isinstance(val[0], list):
            return np.array([[float(x) for x in row] for row in val], dtype=float)
        return np.array([float(x) for x in val], dtype=float)
    return float(val)


def test_cohort_step():
    # 5 age groups: 0, 1, 2, 3, 4
    # N_t is total population per age group
    n_t = np.array([100.0, 90.0, 80.0, 70.0, 60.0])

    # Survival rates: probability of surviving into the next age group
    # Older group (age 4) has 0.0 survival in this test.
    survival = np.array([0.9, 0.9, 0.9, 0.9, 0.0])

    # Fertility rates: births per person of this age
    fertility = np.array([0.0, 0.0, 1.0, 0.0, 0.0])

    # Net migration: absolute number of people entering/leaving
    migration = np.array([0.0, 10.0, 0.0, 0.0, 0.0])

    n_next = step_population(n_t, survival, fertility, migration)

    # Expected calculations:
    # Age 0: births from age 2 = 80 * 1.0 = 80
    # Age 1: age 0 survivors (100 * 0.9) + migration (10) = 100
    # Age 2: age 1 survivors (90 * 0.9) = 81
    # Age 3: age 2 survivors (80 * 0.9) = 72
    # Age 4: age 3 survivors (70 * 0.9) + age 4 survivors (60 * 0.0) = 63

    expected = np.array([80.0, 100.0, 81.0, 72.0, 63.0])
    np.testing.assert_allclose(n_next, expected)


def test_cohort_step_open_interval():
    # Test that the open interval (last age group) correctly accumulates survivors.
    n_t = np.array([10.0, 10.0, 100.0])
    survival = np.array([1.0, 1.0, 0.5])
    fertility = np.array([0.0, 0.0, 0.0])
    migration = np.array([0.0, 0.0, 5.0])

    n_next = step_population(n_t, survival, fertility, migration)

    # Age 0: 0 births
    # Age 1: age 0 survivors = 10 * 1.0 = 10
    # Age 2: age 1 survivors (10 * 1.0) + age 2 survivors (100 * 0.5) + mig (5) = 10 + 50 + 5 = 65

    expected = np.array([0.0, 10.0, 65.0])
    np.testing.assert_allclose(n_next, expected)


def test_project_population():
    n_t0 = np.array([100.0, 90.0, 80.0])

    # 2 years projection
    survival = np.array([
        [0.9, 0.9, 0.0],  # year 0 -> 1
        [0.8, 0.8, 0.0],  # year 1 -> 2
    ])
    fertility = np.array([
        [0.0, 1.0, 0.0],
        [0.0, 0.5, 0.0],
    ])
    migration = np.array([
        [0.0, 10.0, 0.0],
        [0.0, 0.0, 5.0],
    ])

    # Run projection
    res = project_population(n_t0, survival, fertility, migration)

    assert res.shape == (3, 3)  # t=0, t=1, t=2
    np.testing.assert_allclose(res[0], n_t0)

    # Manual step 1
    # births = 90 * 1 = 90
    # age 1 = 100 * 0.9 + 10 = 100
    # age 2 = 90 * 0.9 = 81
    expected_1 = np.array([90.0, 100.0, 81.0])
    np.testing.assert_allclose(res[1], expected_1)

    # Manual step 2
    # births = 100 * 0.5 = 50
    # age 1 = 90 * 0.8 + 0 = 72
    # age 2 = 100 * 0.8 + 5 = 85 (fixed typo in comment from audit F18)
    expected_2 = np.array([50.0, 72.0, 85.0])
    np.testing.assert_allclose(res[2], expected_2)


def test_f5_migration_zero_hand_computed():
    """Audit F5 / Mutation M1: verify non-zero migration[0] hand-computed case."""
    # Arithmetic:
    # n_t = [10, 20, 30], survival = [0.5, 0.5, 0.5], fertility = [0, 0.1, 0.1], migration = [4, 0, 0]
    # births = sum(n_t * fertility) = 10*0 + 20*0.1 + 30*0.1 = 5
    # n_next[0] = births + migration[0] = 5 + 4 = 9
    # n_next[1] = 10 * 0.5 + 0 = 5
    # n_next[2] = 20 * 0.5 + 30 * 0.5 + 0 = 10 + 15 = 25
    n_t = np.array([10.0, 20.0, 30.0])
    survival = np.array([0.5, 0.5, 0.5])
    fertility = np.array([0.0, 0.1, 0.1])
    migration = np.array([4.0, 0.0, 0.0])

    n_next = step_population(n_t, survival, fertility, migration)
    expected = np.array([9.0, 5.0, 25.0])
    np.testing.assert_allclose(n_next, expected)


def test_f5_golden_file_consumed_by_python():
    """Audit F5: ensure Python reads population_parity.json and reproduces expected outputs."""
    parity_file = PARITY_DIR / "population_parity.json"
    assert parity_file.exists(), f"Golden file not found at {parity_file}"

    with open(parity_file, encoding="utf-8") as f:
        data = json.load(f)

    n_t0 = np.array(data["n_t0"], dtype=float)
    survival = np.array(data["survival"], dtype=float)
    fertility = np.array(data["fertility"], dtype=float)
    migration = np.array(data["migration"], dtype=float)
    expected = np.array(data["expected"], dtype=float)

    actual = project_population(n_t0, survival, fertility, migration)
    np.testing.assert_allclose(actual, expected, rtol=1e-10, atol=1e-10)


def test_f5_golden_file_matches_generator():
    """Audit F5: assert that population_parity.json matches build_population_parity_payload()."""
    parity_file = PARITY_DIR / "population_parity.json"
    with open(parity_file, encoding="utf-8") as f:
        stored_data = json.load(f)

    generated_data = build_population_parity_payload()
    np.testing.assert_allclose(stored_data["n_t0"], generated_data["n_t0"])
    np.testing.assert_allclose(stored_data["survival"], generated_data["survival"])
    np.testing.assert_allclose(stored_data["fertility"], generated_data["fertility"])
    np.testing.assert_allclose(stored_data["migration"], generated_data["migration"])
    np.testing.assert_allclose(stored_data["expected"], generated_data["expected"])


def test_f8_age_group_boundary_two_accepted_one_zero_rejected():
    """Audit F8: A = 2 is accepted, A = 1 and A = 0 are rejected with exact error messages."""
    # A = 2 accepted case:
    # n_t = [100.0, 50.0], survival = [0.8, 0.5], fertility = [0.0, 0.2], migration = [10.0, 5.0]
    # births = 100 * 0.0 + 50 * 0.2 = 10.0
    # n_next[0] = 10.0 + 10.0 = 20.0
    # n_next[1] (open interval) = 100 * 0.8 + 50 * 0.5 + 5.0 = 80.0 + 25.0 + 5.0 = 110.0
    n_t_2 = np.array([100.0, 50.0])
    surv_2 = np.array([0.8, 0.5])
    fert_2 = np.array([0.0, 0.2])
    mig_2 = np.array([10.0, 5.0])
    res_2 = step_population(n_t_2, surv_2, fert_2, mig_2)
    np.testing.assert_allclose(res_2, np.array([20.0, 110.0]))

    # A = 1 rejected
    with pytest.raises(ValueError) as exc_1:
        step_population(
            np.array([100.0]),
            np.array([0.8]),
            np.array([0.1]),
            np.array([0.0]),
        )
    assert str(exc_1.value) == "step_population needs at least 2 age groups, got 1"

    # A = 0 rejected
    with pytest.raises(ValueError) as exc_0:
        step_population(
            np.array([]),
            np.array([]),
            np.array([]),
            np.array([]),
        )
    assert str(exc_0.value) == "step_population needs at least 2 age groups, got 0"


def test_f9_input_validation_and_negative_cohort_raise():
    """Audit F9: verify all invalid input cases from population_invalid.json raise exact ValueError."""
    invalid_file = PARITY_DIR / "population_invalid.json"
    assert invalid_file.exists(), f"Invalid parity file not found at {invalid_file}"

    with open(invalid_file, encoding="utf-8") as f:
        cases = json.load(f)

    for case in cases:
        func_name = case["func"]
        inputs = case["inputs"]
        expected_error = case["expected_error"]

        if func_name == "step_population":
            n_t = parse_py_input(inputs["n_t"])
            survival = parse_py_input(inputs["survival"])
            fertility = parse_py_input(inputs["fertility"])
            migration = parse_py_input(inputs["migration"])

            with pytest.raises(ValueError) as exc_info:
                step_population(n_t, survival, fertility, migration)
            assert str(exc_info.value) == expected_error, (
                f"Case '{case['name']}' failed:\nExpected: {expected_error}\nGot: {exc_info.value}"
            )
        elif func_name == "project_population":
            n_t0 = parse_py_input(inputs["n_t0"])
            survival = parse_py_input(inputs["survival"])
            fertility = parse_py_input(inputs["fertility"])
            migration = parse_py_input(inputs["migration"])

            with pytest.raises(ValueError) as exc_info:
                project_population(n_t0, survival, fertility, migration)
            assert str(exc_info.value) == expected_error, (
                f"Case '{case['name']}' failed:\nExpected: {expected_error}\nGot: {exc_info.value}"
            )


def test_hand_computed_terms_separately():
    """Cover each line of step_population separately with hand-computed arithmetic."""
    # 1. Births term only: fertility active, survival and migration zero
    # n_t = [100.0, 50.0, 20.0], fertility = [0.1, 0.2, 0.5]
    # births = 100*0.1 + 50*0.2 + 20*0.5 = 10 + 10 + 10 = 30.0
    # survivors = 0.0, migration = 0.0
    # expected = [30.0, 0.0, 0.0]
    n_t_b = np.array([100.0, 50.0, 20.0])
    surv_b = np.array([0.0, 0.0, 0.0])
    fert_b = np.array([0.1, 0.2, 0.5])
    mig_b = np.array([0.0, 0.0, 0.0])
    res_b = step_population(n_t_b, surv_b, fert_b, mig_b)
    np.testing.assert_allclose(res_b, np.array([30.0, 0.0, 0.0]))

    # 2. Ageing term (age 1 to A-2) only:
    # A = 4: ages 1 and 2 are ageing terms
    # n_t = [40.0, 60.0, 80.0, 100.0], survival = [0.5, 0.25, 0.0, 0.0]
    # age 0 = 0.0
    # age 1 = 40.0 * 0.5 = 20.0
    # age 2 = 60.0 * 0.25 = 15.0
    # age 3 = 80 * 0.0 + 100 * 0.0 = 0.0
    n_t_a = np.array([40.0, 60.0, 80.0, 100.0])
    surv_a = np.array([0.5, 0.25, 0.0, 0.0])
    fert_a = np.array([0.0, 0.0, 0.0, 0.0])
    mig_a = np.array([0.0, 0.0, 0.0, 0.0])
    res_a = step_population(n_t_a, surv_a, fert_a, mig_a)
    np.testing.assert_allclose(res_a, np.array([0.0, 20.0, 15.0, 0.0]))

    # 3. Open interval term (age A-1) only:
    # A = 3: open interval is age 2
    # n_t = [10.0, 20.0, 30.0], survival = [0.0, 0.8, 0.4]
    # age 0 = 0.0
    # age 1 = 10 * 0.0 = 0.0
    # age 2 = 20 * 0.8 + 30 * 0.4 = 16.0 + 12.0 = 28.0
    n_t_o = np.array([10.0, 20.0, 30.0])
    surv_o = np.array([0.0, 0.8, 0.4])
    fert_o = np.array([0.0, 0.0, 0.0])
    mig_o = np.array([0.0, 0.0, 0.0])
    res_o = step_population(n_t_o, surv_o, fert_o, mig_o)
    np.testing.assert_allclose(res_o, np.array([0.0, 0.0, 28.0]))

    # 4. Migration at each age:
    # n_t = [10.0, 10.0, 10.0], survival = [0.0, 0.0, 0.0], fertility = [0.0, 0.0, 0.0]
    # migration = [5.0, 7.0, 12.0]
    # expected = [5.0, 7.0, 12.0]
    n_t_m = np.array([10.0, 10.0, 10.0])
    surv_m = np.array([0.0, 0.0, 0.0])
    fert_m = np.array([0.0, 0.0, 0.0])
    mig_m = np.array([5.0, 7.0, 12.0])
    res_m = step_population(n_t_m, surv_m, fert_m, mig_m)
    np.testing.assert_allclose(res_m, np.array([5.0, 7.0, 12.0]))


def test_cohort_conservation_criterion_c5():
    """Criterion C5: sum(n_next) = births + survivors + migration within 1e-9 relative."""
    test_cases = [
        {
            "n_t": np.array([1000.0, 800.0, 600.0, 400.0, 200.0]),
            "survival": np.array([0.98, 0.95, 0.90, 0.80, 0.60]),
            "fertility": np.array([0.0, 0.05, 0.12, 0.02, 0.0]),
            "migration": np.array([50.0, -10.0, 20.0, 5.0, 2.0]),
        },
        {
            "n_t": np.array([500.0, 500.0, 500.0]),
            "survival": np.array([0.9, 0.85, 0.7]),
            "fertility": np.array([0.02, 0.08, 0.01]),
            "migration": np.array([15.0, 25.0, -5.0]),
        },
        {
            "n_t": np.array([25000.0, 20000.0, 15000.0, 10000.0]),
            "survival": np.array([0.99, 0.98, 0.92, 0.50]),
            "fertility": np.array([0.0, 0.15, 0.05, 0.0]),
            "migration": np.array([120.0, -40.0, 85.0, -10.0]),
        },
    ]

    for tc in test_cases:
        n_t = tc["n_t"]
        survival = tc["survival"]
        fertility = tc["fertility"]
        migration = tc["migration"]

        n_next = step_population(n_t, survival, fertility, migration)

        births = np.sum(n_t * fertility)
        survivors = np.sum(n_t[:-1] * survival[:-1]) + n_t[-1] * survival[-1]
        mig = np.sum(migration)
        expected_total = births + survivors + mig

        actual_total = np.sum(n_next)
        rel_diff = abs(actual_total - expected_total) / expected_total
        assert rel_diff < 1e-9, f"Conservation failed: rel_diff={rel_diff}"
