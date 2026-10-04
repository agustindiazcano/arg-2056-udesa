# Task: `model-population-drivers`

Branch: `task/model-population-drivers`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/model-design.md` (section 2.1 is binding, with the parameter table, and sections 5 and 7), `docs/assumptions.md`, `docs/decisions.md`, `docs/params.md`, `model/params/params.json`, `model/src/argmodel/params/`, `model/src/argmodel/population/cohort.py`, `model/tests/test_population.py`, `population-age-contract.md` and the schemas and mock it produced first.
Prerequisites: `model-params`, `model-population-hardening` and `population-age-contract` are merged into `main`. If one is not, stop and tell me which.

## Goal

Put the mechanisms of section 2.1 on top of the validated cohort step: a fertility path, a life-expectancy path, a one-parameter relational life table, a migration pattern, and a projection loop that uses them. Every parameter comes from `model/params/params.json` through the loader; no literal parameter appears in the code. The result is the population projection (totals, working-age population, life expectancy) that growth accounting and HDI consume.

Strict TDD: hand-computed cases before code. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No change to `step_population` or `project_population`. No Monte Carlo, no scenarios, no random draws (the drivers take their parameter values as arguments; `model-montecarlo` draws them).
- No real data and no calibration on real data (none exists; the calibration function is written and tested on synthetic series and runs on the mock). No second sex, no Lee-Carter, no logistic growth of the total (all rejected in the design).
- No new dependency: `numpy` and the standard library (`statistics.NormalDist` is there if a normal quantile is ever needed; this task needs none). Do not edit `docs/model-design.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.
- Do not clamp negative cohorts: the step raises (`D-pop-1`); the drivers let that error through with its message.

## 1. Files

```
model/src/argmodel/population/drivers.py       the paths, the life table, the matrices
model/src/argmodel/population/projection.py    the loop that uses them with the cohort step
model/src/argmodel/population/calibrate.py     kappa_F by least squares on the training window
model/tests/test_population_drivers.py   test_population_projection.py   test_population_calibrate.py
docs/population-model.md                       what each function does, with the formulas of the design
```

## 2. The functions (formulas from the design, copied, not recalled)

- `tfr_path(tfr_0, tfr_target, kappa_f, years)`: `TFR_t = TFR_T + (TFR_0 - TFR_T) * exp(-kappa_F * (t - t0))` for `t - t0 = 0..years`.
- `e0_path(e0_0, e0_max, kappa_e, years)`: `e0_t = e0_max - (e0_max - e0_0) * exp(-kappa_e * (t - t0))`.
- `fertility_by_age(tfr, shape_f, female_share)`: `f[a] = TFR * shape_f[a] * female_share[a]`; `shape_f` sums to 1 (reject otherwise, exact message). Arithmetic check in a test: with `shape_f` and `female_share` of a toy population, births per woman over the lifetime equal `TFR` (state the arithmetic: the female share enters through the population weights, see the docstring and write the identity you test; if the identity in the design cannot be checked as written, stop and tell me).
- `survival_for_e0(standard_survival, e0)`: the **one-parameter relational life table**. Method (a Brass relational model with the slope fixed at 1, a mechanism and not a sourced number): from the standard table's survivorship `l_x` take `Y_x = 0.5 * ln((1 - l_x) / l_x)`, shift every `Y_x` by one constant `alpha`, map back `l_x(alpha) = 1 / (1 + exp(2 * (Y_x + alpha)))`, derive `S_x = l_{x+1} / l_x`, and find `alpha` by bisection so that life expectancy at birth equals `e0` within `1e-6` year (deterministic; at most 200 iterations; raise `ValueError` with the bracket if no root is found). Life expectancy uses the same discrete formula as the `life_table` contract of `population-age-contract` (one source of truth: import it, do not copy it).
- `migration_by_age(m, total_population, shape_m)`: `M[a] = m * total_population / 1000 * shape_m[a]`; `shape_m` sums to 1 (reject otherwise).
- `project(n0, params, standard_survival, shape_f, female_share, shape_m, years)`: for each year build `f`, `S`, `M` from the paths (migration uses the **current** total population, so the loop builds the vectors year by year) and call the validated cohort step. Returns a small immutable result with the cohort matrix, the total, the working-age population (ages `WORKING_AGE = (15, 64)`, a named constant, see below), life expectancy and TFR per year.
- `calibrate_kappa_f(observed_tfr_by_year, tfr_0, tfr_target, last_training_year)`: least squares of the observed fertility path **using only years up to `last_training_year`** (slice first, then fit; a test proves a value after the cutoff cannot change the result). Closed-form or a deterministic one-dimensional search; state which; result within the bracket of `pop.kappa_f`.

`WORKING_AGE = (15, 64)` is a definition the model needs (`L = W * pi`) that the design does not state: add it to `docs/assumptions.md` as a new assumption row (next free id, status `assumption`, decided by the human) and name that id in a comment at the constant.

## 3. Tests (write first)

- `tfr_path` and `e0_path`: values at `t0`, at one year, and the limit (`tfr_path(...)` at a very long horizon equals the target to `1e-9`); hand-computed numbers.
- Relational table: with the standard table itself and `e0 = e0(standard)`, `alpha` is 0 and the survival equals the standard within `1e-9`; a higher `e0` gives survival at every age not lower than before (monotone); the resulting life expectancy equals the target within `1e-6`; invalid `e0` (not finite, below the lowest or above the highest reachable) raises with the exact message.
- Fertility and migration vectors: the sum rules with exact arithmetic; rejection of a pattern that does not sum to 1.
- Projection: **conservation** each year (`sum N[t+1] = births + survivors + migration`); a hand-computed two-year case with three age groups and no randomness; with `m = 0` and `TFR` equal to replacement the total follows the cohort step; migration is proportional to the current total (a test with two different totals); negative-migration inputs that would empty a cohort raise the step's message with the year.
- Calibration: on a synthetic series generated by the formula with a known `kappa_F` the fit recovers it within `1e-6`; the cutoff test above; a series with a gap (`null`) is rejected with a message (no silent fill).
- No literal parameter in the code: a test greps `drivers.py`, `projection.py` and `calibrate.py` for numeric literals other than the named constants and `0`, `1`, `2`, `1000` and fails with the line.
- Determinism: two runs give identical arrays.

## 4. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] All parameters read through the loader; formulas match section 2.1; the cohort step untouched.
- [ ] The relational method, the working-age definition and the calibration method are stated in `docs/population-model.md` and, for the definition, in `docs/assumptions.md`.
- [ ] No real data, no random draws, no new dependency. `LASTCONTEXT.md` overwritten; `PENDING.md` updated (`model-hdi` unblocked).
- [ ] PR description: what changed, what was verified, what the human must verify (the relational life table choice, the 15-64 definition, the `kappa_F` fit once real fertility data exist).
