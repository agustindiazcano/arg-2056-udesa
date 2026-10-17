# Task: `backtest-baselines`

Branch: `task/backtest-baselines`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/model-design.md` (section 5 is binding: the window, the baselines B1 to B4, the metrics, the 12 cases, the criteria C1 to C5), `docs/decisions.md` (`D-bt-1`), `docs/data-dictionary.md`, `data/schemas/economy_series.schema.json`, `data/schemas/population.schema.json`, `data/schemas/external_forecasts.schema.json`, `web/src/types/economy.ts`, `scripts/dataset_checks.py` and `model/backtest/` first.
Prerequisites: the real series of `data-economy-population` for 1990 to 2025 are **not** required to start: the code is written and tested on synthetic series and on the mock. Real runs wait for them.

## Goal

The yardstick the model will be judged against, written and tested **before** the model is ever run on the test window: the baselines, the error metrics and the data slicing that guarantees the test window is never read during calibration. This is the code of section 5 of the design; the criteria it measures were written down before any implementation and do not change here.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No run of the model, no report (that is `backtest-run`), no tuning of anything. No criteria changes: C1 to C5 and their numbers (`1.25`, `8 of 12`, `20%`) are the design's, decided by the human (`D-bt-1`).
- No new dependency: `numpy` and the standard library only. The ARIMA baseline is implemented here (see below), not imported from `statsmodels`.
- Do not edit `docs/model-design.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Files

```
model/backtest/window.py        training and test windows, the slicing that cannot leak
model/backtest/baselines.py     B1, B2, B3, B4
model/backtest/metrics.py       absolute log error, bias, coverage
model/backtest/cases.py         the 12 cases and the horizons
model/tests/test_backtest_*.py
docs/backtest.md                the protocol as implemented, the limits of each baseline
```

## 2. Behavior (section 5 of the design, copied, not recalled)

- **Windows**: training up to **2005**, test 2006 to 2025, origin 2005, horizons 5, 10 and 20 years (2010, 2015, 2025). The constants live in one place. `train_slice(series, last_year)` returns only the observations up to the origin and **raises** if asked for a later year; there is no function that returns the test window to calibration code. A test proves a value in 2006 cannot reach any baseline fit (mutate the value and compare the output).
- **B1 persistence**: the last observed value held constant (for growth, the last observed growth held).
- **B2 linear trend** on log GDP per capita fitted on the training window by ordinary least squares.
- **B3 ARIMA(1,1,0) with drift** on log GDP per capita: `d_t = y_t - y_{t-1}`, `d_t = c + phi * d_{t-1} + e_t` fitted by **conditional least squares** on the training window (not maximum likelihood: state it), forecast by iterating the recursion. A test recovers known `c` and `phi` from a long synthetic series.
- **B4** the unadjusted `medium` variant of the `external_forecasts` of the 2005 vintage for population, if such a vintage exists in the data; otherwise `None` and the population claim is reported as "not compared with an external baseline" (a string constant).
- **Metrics**: absolute log error of the p50 at each horizon; bias (mean signed log error); coverage (the fraction of observed values inside `[p10, p90]`). A forecast with a non-positive value or an observed value that is not positive raises (`backtest: log error needs positive values`).
- **Cases**: 4 indicators with observed series (`gdp_constant_usd`, `gdp_per_capita_usd`, `population`, `hdi`) times 3 horizons for `AR` is 12 cases; `cases()` returns them with the exact ids used by the report.
- **Missing data**: an observed value that is `null` in the contract makes that case "not available" with the note, never zero and never interpolated.

## 3. Tests (write first)

- The slicing: `train_slice` returns exactly the years up to the origin; asking for 2006 raises with the exact message; the no-leak test above.
- B1: hand-computed forecasts for a short series. B2: a series generated as an exact line in logs is forecast exactly; a hand-computed slope on three points. B3: recovery of `c` and `phi` within `1e-3` on 500 synthetic points from a fixed seed; a hand-computed one-step forecast.
- B4 present and absent.
- Metrics: hand-computed log error, bias and coverage on a six-point example; the positive and non-positive cases; the 12 cases list is exactly the one in the design.
- `null` observations are "not available" with the note.
- Determinism and no literal window year outside the constants (grep test).

## 4. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] The test window cannot be read by any fit; the criteria and their numbers untouched.
- [ ] `docs/backtest.md` states that B3 uses conditional least squares and what each baseline cannot do. `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (the estimation method of B3, the treatment of missing observations).
