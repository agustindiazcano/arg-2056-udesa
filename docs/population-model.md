# Population model: the drivers

What each function of `model/src/argmodel/population/` does, with the formulas of section 2.1 of `docs/model-design.md`. The cohort step (`cohort.py`) is the validated one and is not changed. No parameter value is in the code: the caller passes the values of one draw (`PopulationParams`) or reads them through `argmodel.params`.

## `drivers.py`

| Function | Formula |
|---|---|
| `tfr_path(tfr_0, tfr_target, kappa_f, years)` | `TFR_t = TFR_T + (TFR_0 - TFR_T) * exp(-kappa_F * (t - t0))`, `t - t0 = 0..years` |
| `e0_path(e0_0, e0_max, kappa_e, years)` | `e0_t = e0_max - (e0_max - e0_0) * exp(-kappa_e * (t - t0))` |
| `fertility_by_age(tfr, shape_f, female_share)` | `f[a] = TFR * shape_f[a] * share_f[a]`; `shape_f` sums to 1 (within `1e-9`, otherwise it raises) |
| `migration_by_age(m, total_population, shape_m)` | `M[a] = m * P / 1000 * shape_m[a]`; `shape_m` sums to 1 |
| `life_expectancy(survival)` | `l_0 = 1`, `l_{a+1} = l_a * S_a`; `L_a = 0.5 * (l_a + l_{a+1})` for the closed ages; `L_{A-1} = l_{A-1} / (1 - S_{A-1})`; `e0 = sum L_a` |
| `survival_for_e0(standard_survival, e0)` | the one-parameter relational life table, below |

**Fertility identity.** `f[a]` is births per person of age `a`, both sexes. Births per woman at age `a` are `f[a] / share_f[a] = TFR * shape_f[a]`, so over a lifetime they add up to `TFR`. The test `test_fertility_by_age_lifetime_identity` states exactly this.

**Relational life table.** A Brass relational model with the slope fixed at 1: a mechanism, not a sourced number. From the survivorship `l_x` of the standard table take `Y_x = 0.5 * ln((1 - l_x) / l_x)` for `x = 1..A` (`l_0 = 1` never moves), shift every `Y_x` by one constant `alpha`, map back `l_x(alpha) = 1 / (1 + exp(2 * (Y_x + alpha)))` and derive `S_x = l_{x+1} / l_x`. Life expectancy falls as `alpha` rises, so `alpha` is found by bisection in `[-2, 2]` until life expectancy equals `e0` within `1e-10` years (at most 200 iterations; deterministic). A target outside the reachable range raises with the range. With the standard table's own `e0`, `alpha` is 0 and the survival is the standard one. The standard table of the contract has 101 ages; the code accepts any length of 2 or more (the tests use three ages to compute by hand).

`life_expectancy` is the same formula as the consistency check of the `life_table` contract (`scripts/dataset_checks.py`, `check_life_table`). It is written again in `argmodel` because the model package cannot import from `scripts/`; the two must be kept equal.

**Working-age population.** `WORKING_AGE = (15, 64)`, both ages included. The design needs it (`L = W * pi`) and does not define it: assumption A35 in `docs/assumptions.md`, decided by the human.

## `projection.py`

`project(n0, params, standard_survival, shape_f, female_share, shape_m, years)` builds, for each year `t`, `f` from `TFR_t`, `S` from `e0_t` by the relational table and `M` from the current total `P_t`, and applies `step_population`. The result (`ProjectionResult`, read-only arrays) has the cohort matrix `n`, `total`, `working_age`, `e0`, `tfr` for years `0..years`, and the `fertility`, `survival` and `migration` used in each step. Nothing is clamped: a negative cohort raises the step's message as `project: year t: step_population: negative population in age group i: x` (`D-pop-1`).

## `calibrate.py`

`calibrate_kappa_f(observed_tfr_by_year, tfr_0, tfr_target, last_training_year)` fits `kappa_F` by least squares of `tfr_path` against the observed fertility, **using only the years up to `last_training_year`** (the series is cut first, then fitted). The first year of the window is `t0`. A missing year inside the window raises (no silent fill). The path is not linear in `kappa_F`, so there is no closed form: a deterministic grid of 801 points over the bracket of `pop.kappa_f` and a golden-section refinement of the best cell. The result is clipped to that bracket (it is the bracket's edge when the data ask for a value outside). It is written and tested on synthetic series; there is no real fertility series yet.

## What a human must verify

- That the relational life table (slope fixed at 1) is the standard-table family wanted.
- The working-age range 15 to 64 (A35).
- `kappa_F` once real fertility data exist.
