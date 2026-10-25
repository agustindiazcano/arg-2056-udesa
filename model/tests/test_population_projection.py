import numpy as np
import pytest
from argmodel.population.drivers import WORKING_AGE, life_expectancy
from argmodel.population.projection import PopulationParams, project

# three age groups (0, 1, 2+): the open interval is the last one
TOY_SURVIVAL = np.array([0.9, 0.8, 0.5])
TOY_E0 = 3.2  # life_expectancy(TOY_SURVIVAL), by hand in test_population_drivers
SHAPE_F = np.array([0.0, 0.6, 0.4])
SHARE_F = np.array([0.5, 0.5, 0.5])
SHAPE_M = np.array([0.2, 0.3, 0.5])


def toy_params(m=0.0, tfr_0=2.0, tfr_target=2.0, e0_0=TOY_E0, e0_max=TOY_E0):
    return PopulationParams(tfr_0=tfr_0, tfr_target=tfr_target, kappa_f=0.05, e0_0=e0_0, e0_max=e0_max, kappa_e=0.02, mig_rate=m)


def test_toy_life_expectancy_matches_the_constant():
    assert life_expectancy(TOY_SURVIVAL) == pytest.approx(TOY_E0, abs=1e-12)


def test_two_year_case_by_hand_with_no_migration_and_constant_paths():
    n0 = np.array([100.0, 80.0, 60.0])
    r = project(n0, toy_params(), TOY_SURVIVAL, SHAPE_F, SHARE_F, SHAPE_M, years=2)
    # f = 2 * [0, 0.6, 0.4] * 0.5 = [0, 0.6, 0.4]
    # year 1: births 80 * 0.6 + 60 * 0.4 = 72; age 1 = 100 * 0.9 = 90; age 2 = 80 * 0.8 + 60 * 0.5 = 94
    assert r.n[1] == pytest.approx([72.0, 90.0, 94.0], rel=1e-5)
    # year 2: births 90 * 0.6 + 94 * 0.4 = 91.6; age 1 = 72 * 0.9 = 64.8; age 2 = 90 * 0.8 + 94 * 0.5 = 119
    assert r.n[2] == pytest.approx([91.6, 64.8, 119.0], rel=1e-5)
    assert r.total == pytest.approx([240.0, 256.0, 275.4], rel=1e-5)


def test_conservation_every_year():
    n0 = np.array([100.0, 80.0, 60.0])
    r = project(n0, toy_params(m=3.0, tfr_0=3.0, tfr_target=1.5, e0_0=TOY_E0, e0_max=TOY_E0), TOY_SURVIVAL, SHAPE_F, SHARE_F, SHAPE_M, years=5)
    for t in range(5):
        births = float(np.sum(r.n[t] * r.fertility[t]))
        survivors = float(np.sum(r.n[t][:-1] * r.survival[t][:-1]) + r.n[t][-1] * r.survival[t][-1])
        migration = float(np.sum(r.migration[t]))
        assert r.total[t + 1] == pytest.approx(births + survivors + migration, rel=1e-12)


def test_migration_is_proportional_to_the_current_total():
    small = project(np.array([100.0, 80.0, 60.0]), toy_params(m=10.0), TOY_SURVIVAL, SHAPE_F, SHARE_F, SHAPE_M, years=1)
    big = project(np.array([1000.0, 800.0, 600.0]), toy_params(m=10.0), TOY_SURVIVAL, SHAPE_F, SHARE_F, SHAPE_M, years=1)
    # M = m * P / 1000: ten times the population, ten times the migrants
    assert big.migration[0].sum() == pytest.approx(10.0 * small.migration[0].sum(), rel=1e-12)
    assert small.migration[0].sum() == pytest.approx(10.0 * 240.0 / 1000.0, rel=1e-12)


def test_working_age_population_uses_the_named_range():
    n0 = np.arange(101, dtype=float) + 1.0
    standard = 1.0 - np.minimum(0.0005 + 0.00004 * np.exp(0.095 * np.arange(101)), 0.9)
    shape_f = np.zeros(101)
    shape_f[25:35] = 0.1
    r = project(n0, toy_params(e0_0=life_expectancy(standard), e0_max=life_expectancy(standard)), standard, shape_f, np.full(101, 0.5), np.full(101, 1 / 101), years=0)
    low, high = WORKING_AGE
    assert r.working_age[0] == pytest.approx(n0[low : high + 1].sum())


def test_negative_cohort_error_carries_the_year():
    n0 = np.array([100.0, 80.0, 60.0])
    with pytest.raises(ValueError, match=r"project: year 0: step_population: negative population in age group"):
        project(n0, toy_params(m=-5000.0), TOY_SURVIVAL, SHAPE_F, SHARE_F, SHAPE_M, years=1)


def test_the_paths_are_returned():
    r = project(np.array([100.0, 80.0, 60.0]), toy_params(tfr_0=3.0, tfr_target=2.0), TOY_SURVIVAL, SHAPE_F, SHARE_F, SHAPE_M, years=3)
    assert r.tfr[0] == 3.0
    assert r.tfr.shape == (4,)
    assert r.e0[0] == pytest.approx(TOY_E0)
    assert r.n.shape == (4, 3)


def test_two_runs_are_identical():
    args = (np.array([100.0, 80.0, 60.0]), toy_params(m=1.0, tfr_0=3.0), TOY_SURVIVAL, SHAPE_F, SHARE_F, SHAPE_M)
    a = project(*args, years=4)
    b = project(*args, years=4)
    assert np.array_equal(a.n, b.n)


def test_the_result_is_read_only():
    r = project(np.array([100.0, 80.0, 60.0]), toy_params(), TOY_SURVIVAL, SHAPE_F, SHARE_F, SHAPE_M, years=1)
    with pytest.raises(ValueError):
        r.n[0, 0] = 1.0
