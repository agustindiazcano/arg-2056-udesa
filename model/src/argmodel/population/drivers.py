"""The mechanisms of section 2.1 of `docs/model-design.md` that feed the cohort step: the fertility and life-expectancy paths, the
one-parameter relational life table, the fertility pattern and the migration pattern. Every parameter is an argument (drawn or read
through `argmodel.params` by the caller); nothing here is a number of the model, only named numerical constants of the method."""

import math

import numpy as np

# Working-age population is the people of ages 15 to 64 (both included). Assumption A35 of `docs/assumptions.md`, decided by the human.
WORKING_AGE = (15, 64)

# the patterns of fertility and migration must sum to 1 within this tolerance
SUM_TOLERANCE = 1e-9
# half: the mid-point rule of the closed age intervals and the 1/2 of the Brass logit
HALF = 0.5
# the relational life table is searched for a shift of the logit between -ALPHA_BRACKET and +ALPHA_BRACKET
ALPHA_BRACKET = 2.0
# bisection stops when life expectancy is this close to the target (years), or after MAX_ITERATIONS
E0_TOLERANCE = 1e-10
MAX_ITERATIONS = 200


def _check_years(name: str, years: int) -> None:
    if not isinstance(years, (int, np.integer)) or years < 0:
        raise ValueError(f"{name}: years must be a non-negative integer, got {years}")


def tfr_path(tfr_0: float, tfr_target: float, kappa_f: float, years: int) -> np.ndarray:
    """`TFR_t = TFR_T + (TFR_0 - TFR_T) * exp(-kappa_F * (t - t0))` for `t - t0 = 0..years`. Shape (years + 1,)."""
    _check_years("tfr_path", years)
    t = np.arange(years + 1, dtype=float)
    return tfr_target + (tfr_0 - tfr_target) * np.exp(-kappa_f * t)


def e0_path(e0_0: float, e0_max: float, kappa_e: float, years: int) -> np.ndarray:
    """`e0_t = e0_max - (e0_max - e0_0) * exp(-kappa_e * (t - t0))` for `t - t0 = 0..years`. Shape (years + 1,)."""
    _check_years("e0_path", years)
    t = np.arange(years + 1, dtype=float)
    return e0_max - (e0_max - e0_0) * np.exp(-kappa_e * t)


def fertility_by_age(tfr: float, shape_f: np.ndarray, female_share: np.ndarray) -> np.ndarray:
    """
    `f[a] = TFR * shape_f[a] * share_f[a]`: births per person (both sexes) of age `a`.

    `shape_f` is the age pattern of the births of one woman and sums to 1; `share_f` is the female share of each age group. The births
    per woman at age `a` are `f[a] / share_f[a] = TFR * shape_f[a]`, so over a lifetime they add up to `TFR`.
    """
    if len(shape_f) != len(female_share):
        raise ValueError("fertility_by_age: shape_f and share_f must have the same length")
    total = float(np.sum(shape_f))
    if abs(total - 1.0) > SUM_TOLERANCE:
        raise ValueError(f"fertility_by_age: shape_f must sum to 1, got {total:g}")
    return tfr * np.asarray(shape_f, dtype=float) * np.asarray(female_share, dtype=float)


def migration_by_age(m: float, total_population: float, shape_m: np.ndarray) -> np.ndarray:
    """`M[a] = m * P / 1000 * shape_m[a]`: net migrants of age `a` per year, `m` per 1,000 population and `shape_m` summing to 1."""
    total = float(np.sum(shape_m))
    if abs(total - 1.0) > SUM_TOLERANCE:
        raise ValueError(f"migration_by_age: shape_m must sum to 1, got {total:g}")
    return m * total_population / 1000 * np.asarray(shape_m, dtype=float)


def life_expectancy(survival: np.ndarray) -> float:
    """
    Life expectancy at birth from the survival `S[a]` (age `a` to `a + 1`) of ages 0 to A-1, the last one an open interval.

    `l_0 = 1`, `l_{a+1} = l_a * S_a`; closed intervals by the mid-point rule `L_a = 0.5 * (l_a + l_{a+1})`; the open interval
    `L_{A-1} = l_{A-1} / (1 - S_{A-1})`. The same formula as the consistency check of the `life_table` contract (`scripts/dataset_checks.py`).
    """
    s = np.asarray(survival, dtype=float)
    if s[-1] >= 1.0:
        raise ValueError("life_expectancy: survival of the open interval must be below 1")
    l_all = np.concatenate(([1.0], np.cumprod(s)))
    closed = HALF * (l_all[:-2] + l_all[1:-1])
    return float(np.sum(closed) + l_all[-2] / (1.0 - s[-1]))


def survival_for_e0(standard_survival: np.ndarray, e0: float) -> np.ndarray:
    """
    The one-parameter relational life table: the standard table shifted so that life expectancy at birth equals `e0`.

    A Brass relational model with the slope fixed at 1 (a mechanism, not a sourced number). From the survivorship `l_x` of the standard
    table take `Y_x = 0.5 * ln((1 - l_x) / l_x)` (x = 1..A; `l_0 = 1` never moves), shift every `Y_x` by one constant `alpha`, map back
    `l_x(alpha) = 1 / (1 + exp(2 * (Y_x + alpha)))` and derive `S_x = l_{x+1} / l_x`. `alpha` is found by bisection (life expectancy falls as
    `alpha` rises) to within `E0_TOLERANCE` years, in at most `MAX_ITERATIONS` steps; the search is deterministic.
    """
    if not math.isfinite(e0):
        raise ValueError(f"survival_for_e0: e0 must be finite, got {e0}")
    standard = np.asarray(standard_survival, dtype=float)
    l_std = np.cumprod(standard)
    if not np.all((l_std > 0.0) & (l_std < 1.0)):
        raise ValueError("survival_for_e0: the standard table needs 0 < l_x < 1 for every age above 0")
    y = HALF * np.log((1.0 - l_std) / l_std)

    def table(alpha: float) -> np.ndarray:
        l_all = np.concatenate(([1.0], 1.0 / (1.0 + np.exp(2 * (y + alpha)))))
        return l_all[1:] / l_all[:-1]

    low, high = -ALPHA_BRACKET, ALPHA_BRACKET
    e0_high, e0_low = life_expectancy(table(low)), life_expectancy(table(high))
    if not (e0_low <= e0 <= e0_high):
        raise ValueError(f"survival_for_e0: e0 {e0} is outside the reachable range [{e0_low:.3f}, {e0_high:.3f}]")
    for _ in range(MAX_ITERATIONS):
        mid = HALF * (low + high)
        e0_mid = life_expectancy(table(mid))
        if abs(e0_mid - e0) <= E0_TOLERANCE:
            return table(mid)
        if e0_mid > e0:
            low = mid
        else:
            high = mid
    raise ValueError(f"survival_for_e0: no shift found for e0 {e0} in [{-ALPHA_BRACKET}, {ALPHA_BRACKET}] after {MAX_ITERATIONS} iterations")
