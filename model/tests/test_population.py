import numpy as np
from argmodel.population.cohort import step_population


def test_cohort_step():
    # 5 age groups: 0, 1, 2, 3, 4
    # N_t is total population per age group
    N_t = np.array([100.0, 90.0, 80.0, 70.0, 60.0])
    
    # Survival rates: probability of surviving into the next age group
    # Older group (age 4) has 0.0 survival in this test.
    survival = np.array([0.9, 0.9, 0.9, 0.9, 0.0])
    
    # Fertility rates: births per person of this age
    fertility = np.array([0.0, 0.0, 1.0, 0.0, 0.0])
    
    # Net migration: absolute number of people entering/leaving
    migration = np.array([0.0, 10.0, 0.0, 0.0, 0.0])
    
    N_next = step_population(N_t, survival, fertility, migration)
    
    # Expected calculations:
    # Age 0: births from age 2 = 80 * 1.0 = 80
    # Age 1: age 0 survivors (100 * 0.9) + migration (10) = 100
    # Age 2: age 1 survivors (90 * 0.9) = 81
    # Age 3: age 2 survivors (80 * 0.9) = 72
    # Age 4: age 3 survivors (70 * 0.9) + age 4 survivors (60 * 0.0) = 63
    
    expected = np.array([80.0, 100.0, 81.0, 72.0, 63.0])
    np.testing.assert_allclose(N_next, expected)


def test_cohort_step_open_interval():
    # Test that the open interval (last age group) correctly accumulates survivors.
    N_t = np.array([10.0, 10.0, 100.0])
    survival = np.array([1.0, 1.0, 0.5])
    fertility = np.array([0.0, 0.0, 0.0])
    migration = np.array([0.0, 0.0, 5.0])
    
    N_next = step_population(N_t, survival, fertility, migration)
    
    # Age 0: 0 births
    # Age 1: age 0 survivors = 10 * 1.0 = 10
    # Age 2: age 1 survivors (10 * 1.0) + age 2 survivors (100 * 0.5) + mig (5) = 10 + 50 + 5 = 65
    
    expected = np.array([0.0, 10.0, 65.0])
    np.testing.assert_allclose(N_next, expected)

from argmodel.population.cohort import project_population


def test_project_population():
    N_t0 = np.array([100.0, 90.0, 80.0])
    
    # 2 years projection
    survival = np.array([
        [0.9, 0.9, 0.0],  # year 0 -> 1
        [0.8, 0.8, 0.0]   # year 1 -> 2
    ])
    fertility = np.array([
        [0.0, 1.0, 0.0],
        [0.0, 0.5, 0.0]
    ])
    migration = np.array([
        [0.0, 10.0, 0.0],
        [0.0, 0.0, 5.0]
    ])
    
    # Run projection
    res = project_population(N_t0, survival, fertility, migration)
    
    assert res.shape == (3, 3) # t=0, t=1, t=2
    np.testing.assert_allclose(res[0], N_t0)
    
    # Manual step 1
    # births = 90 * 1 = 90
    # age 1 = 100 * 0.9 + 10 = 100
    # age 2 = 90 * 0.9 = 81
    expected_1 = np.array([90.0, 100.0, 81.0])
    np.testing.assert_allclose(res[1], expected_1)
    
    # Manual step 2
    # births = 100 * 0.5 = 50
    # age 1 = 90 * 0.8 + 0 = 72
    # age 2 = 100 * 0.8 = 80
    expected_2 = np.array([50.0, 72.0, 85.0])
    np.testing.assert_allclose(res[2], expected_2)
