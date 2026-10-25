"""The projection loop: the paths and patterns of `drivers` feeding the validated cohort step of `cohort`."""

from dataclasses import dataclass

import numpy as np

from .cohort import step_population
from .drivers import (
    WORKING_AGE,
    e0_path,
    fertility_by_age,
    migration_by_age,
    survival_for_e0,
    tfr_path,
)


@dataclass(frozen=True)
class PopulationParams:
    """The values of one draw of the population parameters (section 2.1 of the design). `tfr_0` and `e0_0` are data of the origin year."""

    tfr_0: float
    tfr_target: float
    kappa_f: float
    e0_0: float
    e0_max: float
    kappa_e: float
    mig_rate: float


@dataclass(frozen=True)
class ProjectionResult:
    """The projection, year 0 (the origin) to year `years`. All arrays are read-only."""

    n: np.ndarray  # (years + 1, A) people by age
    total: np.ndarray  # (years + 1,)
    working_age: np.ndarray  # (years + 1,) people of the ages in WORKING_AGE
    e0: np.ndarray  # (years + 1,) life expectancy at birth of the path
    tfr: np.ndarray  # (years + 1,)
    fertility: np.ndarray  # (years, A) the `f[a, t]` used in each step
    survival: np.ndarray  # (years, A) the `S[a, t]` used in each step
    migration: np.ndarray  # (years, A) the `M[a, t]` used in each step


def _frozen(a: np.ndarray) -> np.ndarray:
    a.setflags(write=False)
    return a


def project(
    n0: np.ndarray,
    params: PopulationParams,
    standard_survival: np.ndarray,
    shape_f: np.ndarray,
    female_share: np.ndarray,
    shape_m: np.ndarray,
    years: int,
) -> ProjectionResult:
    """
    Projects the population `years` years from `n0`. Each year the fertility, survival and migration vectors are built from the paths of
    that year (migration from the current total, so the vectors are built year by year) and the cohort step is applied.
    A negative cohort raises the step's error with the year (`D-pop-1`: nothing is clamped).
    """
    a_len = len(n0)
    tfr = tfr_path(params.tfr_0, params.tfr_target, params.kappa_f, years)
    e0 = e0_path(params.e0_0, params.e0_max, params.kappa_e, years)

    n = np.zeros((years + 1, a_len), dtype=float)
    n[0] = n0
    fertility = np.zeros((years, a_len), dtype=float)
    survival = np.zeros((years, a_len), dtype=float)
    migration = np.zeros((years, a_len), dtype=float)

    for t in range(years):
        fertility[t] = fertility_by_age(tfr[t], shape_f, female_share)
        survival[t] = survival_for_e0(standard_survival, e0[t])
        migration[t] = migration_by_age(params.mig_rate, float(np.sum(n[t])), shape_m)
        try:
            n[t + 1] = step_population(n[t], survival[t], fertility[t], migration[t])
        except ValueError as exc:
            raise ValueError(f"project: year {t}: {exc}") from None

    low, high = WORKING_AGE
    return ProjectionResult(
        n=_frozen(n),
        total=_frozen(np.sum(n, axis=1)),
        working_age=_frozen(np.sum(n[:, low : high + 1], axis=1)),
        e0=_frozen(e0),
        tfr=_frozen(tfr),
        fertility=_frozen(fertility),
        survival=_frozen(survival),
        migration=_frozen(migration),
    )
