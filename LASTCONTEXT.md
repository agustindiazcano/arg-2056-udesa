# LASTCONTEXT.md

## State
- **Branch**: `task/model-population-drivers` (from `main` after PR #152; PRs #153 laptop/dataviz review is open). Pushed, CI not checked yet.
- **Task done**: the mechanisms of section 2.1 on top of the validated cohort step. No change to `step_population` or `project_population`. No real data, no random draws, no new dependency.
  - `model/src/argmodel/population/drivers.py`: `tfr_path`, `e0_path`, `fertility_by_age`, `migration_by_age`, `life_expectancy`, `survival_for_e0` (one-parameter relational life table, Brass with slope 1, bisection on the logit shift in [-2, 2], tolerance 1e-10 years), `WORKING_AGE = (15, 64)`.
  - `projection.py`: `PopulationParams`, `ProjectionResult` (read-only arrays), `project`; a negative cohort raises `project: year t: step_population: ...`.
  - `calibrate.py`: `calibrate_kappa_f` (training window only; grid of 801 points over the bracket of `pop.kappa_f` plus golden-section refinement; a gap in the window raises).
  - Tests: `model/tests/test_population_drivers.py`, `test_population_projection.py`, `test_population_calibrate.py` (includes a scan that fails on a numeric literal outside a named constant in the three modules). Written before the code; not run locally (RULE #1), only a scratch check of the reachable e0 range of the test standard table (29.8 to 94.7 years).
  - Docs: `docs/population-model.md`; assumption A35 (working age 15 to 64) in `docs/assumptions.md`.
- **Deviation from the brief**: `life_expectancy` is written again in `argmodel` (the model package cannot import from `scripts/`); it is the same formula as `check_life_table`; the doc says they must stay equal.
- Earlier today: PR #151 (laptop layout) merged, PR #152 (the stack of slides 21 to 26, agro, RIGI, HDI) merged, PR #153 open (development chart and province profile).

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente (solo los tests puntuales de lo tocado).
- Nunca mergear ni pushear a `main`; un humano aprueba cada PR.
- Commits atómicos: `test(...)`, `feat(...)`, `data(...)`, `docs(...)`, `fix(...)`.

## Human checks pending
- Relational life table choice, working age 15 to 64 (A35), `kappa_F` once real fertility data exist.
- Slides: AI plan prices and Argentine taxes, livestock figures, provincial HDI, RIGI split among provinces (see `PENDING.md`).

## Next
- Read the CI run of `task/model-population-drivers`; fix what fails; open the PR.
- Then `backtest-baselines` (READY for the code) or `model-growth-core` (blocked by 1 and 2, which are done: check the brief).
