"""Calibration of `kappa_F` (section 2.1 of the design): least squares of the observed fertility path, using only the training window."""

from collections.abc import Mapping

import numpy as np

from ..params import get
from .drivers import tfr_path

# the search is a grid over the bracket of the parameter followed by a golden-section refinement of the best cell
GRID_POINTS = 801
GOLDEN_RATIO_CONJUGATE = 0.6180339887498949
REFINE_ITERATIONS = 100


def calibrate_kappa_f(
    observed_tfr_by_year: Mapping[int, float | None],
    tfr_0: float,
    tfr_target: float,
    last_training_year: int,
) -> float:
    """
    The `kappa_F` that minimises the sum of squared errors between the observed total fertility rate and `tfr_path`, within the bracket
    of `pop.kappa_f` (the result is that bracket's edge if the data want a value outside it).

    The observed series is cut to the years up to `last_training_year` first, then fitted: a later value cannot change the result. The
    first year of the window is the origin `t0` of the path. A missing (`None`) year in the window is an error, never filled.
    Method: a deterministic grid search over the bracket and a golden-section refinement of the best cell (no closed form: the path is
    not linear in `kappa_F`).
    """
    years = sorted(y for y in observed_tfr_by_year if y <= last_training_year)
    if len(years) < 2:
        raise ValueError(f"calibrate_kappa_f: needs at least 2 years up to {last_training_year}")
    t0 = years[0]
    last = years[-1]
    observed = []
    for y in range(t0, last + 1):
        v = observed_tfr_by_year.get(y)
        if v is None:
            raise ValueError(f"calibrate_kappa_f: observed TFR is missing for year {y}")
        observed.append(float(v))
    target = np.array(observed)

    def error(kappa: float) -> float:
        return float(np.sum((tfr_path(tfr_0, tfr_target, kappa, last - t0) - target) ** 2))

    param = get("pop.kappa_f")
    assert param.low is not None and param.high is not None
    grid = np.linspace(param.low, param.high, GRID_POINTS)
    best = int(np.argmin([error(k) for k in grid]))
    low = float(grid[max(best - 1, 0)])
    high = float(grid[min(best + 1, GRID_POINTS - 1)])

    a = high - GOLDEN_RATIO_CONJUGATE * (high - low)
    b = low + GOLDEN_RATIO_CONJUGATE * (high - low)
    fa, fb = error(a), error(b)
    for _ in range(REFINE_ITERATIONS):
        if fa < fb:
            high, b, fb = b, a, fa
            a = high - GOLDEN_RATIO_CONJUGATE * (high - low)
            fa = error(a)
        else:
            low, a, fa = a, b, fb
            b = low + GOLDEN_RATIO_CONJUGATE * (high - low)
            fb = error(b)
    return float(min(max((low + high) / 2, param.low), param.high))
