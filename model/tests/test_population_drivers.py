import math

import numpy as np
import pytest
from argmodel.population.drivers import (
    WORKING_AGE,
    e0_path,
    fertility_by_age,
    life_expectancy,
    migration_by_age,
    survival_for_e0,
    tfr_path,
)

# A standard table of 101 ages (0 to 100+) with a Gompertz-like mortality: made up for the tests, not data.
AGES = np.arange(101)
STANDARD = 1.0 - np.minimum(0.0005 + 0.00004 * np.exp(0.095 * AGES), 0.9)


def test_tfr_path_values_at_origin_one_year_and_limit():
    path = tfr_path(tfr_0=4.0, tfr_target=2.0, kappa_f=0.5, years=3)
    assert path.shape == (4,)
    assert path[0] == 4.0
    # TFR_1 = 2 + (4 - 2) * exp(-0.5)
    assert path[1] == pytest.approx(2.0 + 2.0 * math.exp(-0.5), abs=1e-12)
    assert path[3] == pytest.approx(2.0 + 2.0 * math.exp(-1.5), abs=1e-12)
    long = tfr_path(tfr_0=4.0, tfr_target=2.0, kappa_f=0.5, years=100)
    assert long[-1] == pytest.approx(2.0, abs=1e-9)


def test_e0_path_values_at_origin_one_year_and_limit():
    path = e0_path(e0_0=70.0, e0_max=86.0, kappa_e=0.1, years=2)
    assert path[0] == 70.0
    # e0_1 = 86 - (86 - 70) * exp(-0.1)
    assert path[1] == pytest.approx(86.0 - 16.0 * math.exp(-0.1), abs=1e-12)
    assert path[2] == pytest.approx(86.0 - 16.0 * math.exp(-0.2), abs=1e-12)
    # 16 * exp(-0.1 * 400) is about 7e-17
    assert e0_path(70.0, 86.0, 0.1, 400)[-1] == pytest.approx(86.0, abs=1e-9)


def test_paths_reject_a_negative_horizon():
    with pytest.raises(ValueError, match="tfr_path: years must be a non-negative integer, got -1"):
        tfr_path(4.0, 2.0, 0.5, -1)
    with pytest.raises(ValueError, match="e0_path: years must be a non-negative integer, got -1"):
        e0_path(70.0, 86.0, 0.1, -1)


def test_fertility_by_age_lifetime_identity():
    shape_f = np.array([0.0, 0.25, 0.5, 0.25, 0.0])
    share_f = np.array([0.5, 0.5, 0.5, 0.5, 0.5])
    f = fertility_by_age(2.4, shape_f, share_f)
    # f[a] = TFR * shape_f[a] * share_f[a]
    assert f == pytest.approx(np.array([0.0, 0.3, 0.6, 0.3, 0.0]))
    # births per person of age a are births per woman times the female share, so births per woman over a lifetime are TFR
    assert np.sum(f / share_f) == pytest.approx(2.4, abs=1e-12)


def test_fertility_by_age_rejects_a_pattern_that_does_not_sum_to_one():
    with pytest.raises(ValueError, match="fertility_by_age: shape_f must sum to 1, got 0.9"):
        fertility_by_age(2.0, np.array([0.5, 0.4]), np.array([0.5, 0.5]))
    with pytest.raises(ValueError, match="fertility_by_age: shape_f and share_f must have the same length"):
        fertility_by_age(2.0, np.array([0.5, 0.5]), np.array([0.5]))


def test_migration_by_age_arithmetic_and_rejection():
    shape_m = np.array([0.1, 0.4, 0.5])
    m = migration_by_age(2.0, 5_000_000.0, shape_m)
    # M[a] = m * P / 1000 * shape_m[a]
    assert m == pytest.approx(np.array([1000.0, 4000.0, 5000.0]))
    assert migration_by_age(0.0, 5_000_000.0, shape_m) == pytest.approx(np.zeros(3))
    assert migration_by_age(-1.0, 1000.0, shape_m).sum() == pytest.approx(-1.0)
    with pytest.raises(ValueError, match="migration_by_age: shape_m must sum to 1, got 0.8"):
        migration_by_age(1.0, 1000.0, np.array([0.3, 0.5]))


def test_life_expectancy_by_hand():
    # l = [1, 0.9, 0.72]; closed intervals 0.5 * (1 + 0.9) + 0.5 * (0.9 + 0.72) = 1.76; open interval 0.72 / (1 - 0.5) = 1.44
    assert life_expectancy(np.array([0.9, 0.8, 0.5])) == pytest.approx(3.2, abs=1e-12)


def test_life_expectancy_needs_survival_below_one_in_the_open_interval():
    with pytest.raises(ValueError, match="life_expectancy: survival of the open interval must be below 1"):
        life_expectancy(np.array([0.9, 0.8, 1.0]))


def test_survival_for_the_standard_e0_is_the_standard():
    e0_standard = life_expectancy(STANDARD)
    s = survival_for_e0(STANDARD, e0_standard)
    assert s == pytest.approx(STANDARD, abs=1e-9)


def test_survival_for_e0_hits_the_target_and_is_monotone():
    e0_standard = life_expectancy(STANDARD)
    previous = None
    for target in (e0_standard - 8.0, e0_standard - 2.0, e0_standard + 3.0, e0_standard + 9.0):
        s = survival_for_e0(STANDARD, target)
        assert life_expectancy(s) == pytest.approx(target, abs=1e-6)
        assert np.all((s >= 0.0) & (s <= 1.0))
        if previous is not None:
            # a higher life expectancy never lowers survival at any age
            assert np.all(s >= previous - 1e-12)
        previous = s


def test_survival_for_e0_rejects_unreachable_and_invalid_targets():
    with pytest.raises(ValueError, match="survival_for_e0: e0 must be finite, got nan"):
        survival_for_e0(STANDARD, float("nan"))
    with pytest.raises(ValueError, match=r"survival_for_e0: e0 5.0 is outside the reachable range \["):
        survival_for_e0(STANDARD, 5.0)
    with pytest.raises(ValueError, match=r"survival_for_e0: e0 400.0 is outside the reachable range \["):
        survival_for_e0(STANDARD, 400.0)


def test_survival_for_e0_rejects_a_standard_table_with_no_survivors():
    broken = STANDARD.copy()
    broken[3] = 0.0
    with pytest.raises(ValueError, match="survival_for_e0: the standard table needs 0 < l_x < 1 for every age above 0"):
        survival_for_e0(broken, 70.0)


def test_working_age_is_a_named_pair():
    assert WORKING_AGE == (15, 64)


def test_is_deterministic():
    a = survival_for_e0(STANDARD, 78.0)
    b = survival_for_e0(STANDARD, 78.0)
    assert np.array_equal(a, b)
