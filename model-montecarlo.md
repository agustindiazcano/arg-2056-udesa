# Task: `model-montecarlo`

Branch: `task/model-montecarlo`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/model-design.md` (section 4 is binding: scenarios as terciles of `g_A`, the random quantities, the correlation, the draws and the seed, the meaning of p10, p50 and p90; sections 1, 5 and 7 for the output contract and the interfaces), `docs/assumptions.md`, `docs/decisions.md`, `docs/params.md`, `model/params/params.json`, the docs of the component tasks (`docs/population-model.md`, `docs/growth-model.md`, `docs/hdi-model.md`, `docs/resources-model.md`, `docs/ai-overlay.md`), `data/schemas/forecast_output.schema.json`, `scripts/forecast_checks.py` (`check_forecast`), `data/mock/forecast_output.json` and `docs/data-dictionary.md` first.
Prerequisites: `model-population-drivers`, `model-growth-core`, `model-hdi`, `model-resources` and `model-ai-overlay` are merged into `main`. If one is not, stop and tell me which.

## Goal

Run the components together many times with random parameters and write the result in the exact format of the `forecast_output` contract: for each indicator, geography, scenario and overlay setting, the p10, p50 and p90 by year. This is the task that turns the mechanisms into the fan the app draws. It adds **no mechanism**: it draws parameters, calls the components, and summarizes.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No change to any component's equations. No new mechanism, no multiplicative correction, no tuning to make the output look reasonable. No provincial downscaling (`model-provinces`), no calibration against the backtest window, no UI.
- No wall clock in the logic (`generated_at` is passed in), no global random state, no network, no new dependency (`numpy` and the standard library; the normal quantile function is `statistics.NormalDist().inv_cdf`, no scipy).
- Do not edit `docs/model-design.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Files

```
model/src/argmodel/scenarios/draws.py        the random parameters: families, inverse CDFs, stratification, correlation
model/src/argmodel/scenarios/run.py          one draw through the components, vectorized over draws
model/src/argmodel/scenarios/summarize.py    quantiles and the forecast_output writer
model/src/argmodel/scenarios/cli.py          python -m argmodel.scenarios --params ... --out ...
model/tests/test_scenarios_*.py
docs/montecarlo.md                           the design as implemented, with the numbers N and the seed
```

## 2. Behavior (section 4 of the design, copied, not recalled)

- **Parameters**: read every entry through the loader; the random ones are `pop.tfr_target`, `pop.kappa_e`, `pop.mig_rate`, `gro.s`, `gro.gA`, `res.delay`, `res.util`, `res.yield_g_*`, `ai.delta`, plus one Bernoulli draw per project of reaching production. Each has `low` and `high` (p10 and p90) and a `distribution`; the family in `params.json` is `triangular` (see `model-params`). Map p10 and p90 to the distribution's bounds exactly as the docstring states (a triangular distribution is specified by its minimum, mode and maximum: the task writes down, in `docs/montecarlo.md`, how p10, p90 and the mode are turned into them, and a test shows the draws then have those quantiles within the sampling error). If this mapping needs a choice the design does not make, stop and tell me.
- **A parameter with `value: null` and no range** (`needs_source` with no bracket) cannot be drawn: the run stops with `ValueError` naming the parameter (`montecarlo: parameter {name} has no value or range`). The task never fills it. Until the human supplies values, the end-to-end test uses a **test parameter file** built in the test from the design's brackets, never committed under `model/params/`.
- **Scenarios**: stratified draws on `u_gA` inside `(0, 1/3)`, `(1/3, 2/3)`, `(2/3, 1)` mapped through the inverse CDF of `g_A`; `N = 3,000` per scenario, 9,000 in all (arguments with these defaults). The unconditional fan is the union of the three groups with equal weights.
- **Correlation**: only `(g_A, s)` with `rho` from `gro.rho` (a Gaussian copula: correlated normals, mapped to uniforms with the normal CDF, then to the marginals; state it). Everything else independent.
- **Seed**: `numpy.random.Generator(PCG64)` from `SeedSequence(2056).spawn`, one stream per component and per scenario; **the same random numbers for `ai_overlay` on and off and for all geographies** (a test proves it).
- **Output**: for each year, `p10`, `p50`, `p90` are the empirical quantiles (method stated; `numpy.quantile` with an explicit `method`) of the `N` draws of the scenario. Indicators and coverage as in section 1 of the design: `gdp_constant_usd`, `gdp_per_capita_usd`, `population` and `resource_production` for `AR` (province series come from `model-provinces`); `hdi` for `AR` only. Series with `ai_overlay: on` exist **only** if `delta_bounds` is not `None`; otherwise they are omitted. `source` is `argmodel@<version>`, `generated_at` and `model_version` are arguments.
- **Units and values**: copy the units and the series key `(indicator, resource, geo, scenario, ai_overlay)` from the schema; `p10 <= p50 <= p90` at every point; no `NaN`.

## 3. Tests (write first)

- The draws: for each family the empirical p10 and p90 of a large fixed-seed sample are within `2%` of the bracket; the stratification puts exactly a third of the draws in each tercile of `g_A`; the realised `(g_A, s)` correlation is within `0.03` of `rho`.
- **Determinism**: two runs with the same seed give **byte-identical** output files; a different seed gives different output.
- **Same random numbers**: the on and off series differ only by the overlay term (compare against a run with a zero overlay), and the draws of the same component are identical across geographies.
- Scenario separation measured as in criterion C4 (medians strictly ordered; the gap measure is reported as a number, not asserted against the threshold: the threshold is the backtest's).
- The output validates against `forecast_output.schema.json` and passes `check_forecast` (run both in the test); a deliberately broken output fails each with its message.
- `p10 <= p50 <= p90`; no `NaN`; the ranges of the years equal `horizon`.
- A parameter without value or range stops the run with the exact message (positive case: with a complete test file it runs).
- With `N` small (for example 60) the whole pipeline runs in seconds so the test suite stays fast; a separate, **not default**, test runs `N = 3,000` and is selected by an environment variable (never in `precheck`).
- Cohort conservation and the identities of section 7 hold on every run (a test that recomputes `gdp_per_capita = gdp / population` on the output).

## 4. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] No mechanism added; no tuning; no fill of a missing parameter; same seed, same bytes.
- [ ] The output validates against the schema and `check_forecast`; `ai_overlay: on` omitted when there are no admissible estimates.
- [ ] `docs/montecarlo.md` states the distribution mapping and the quantile method. `LASTCONTEXT.md` overwritten; `PENDING.md` updated (`backtest-run`, `sensitivity` and `model-provinces` unblocked).
- [ ] PR description: what changed, what was verified, what the human must verify (the triangular mapping, that no real run is possible until the missing parameters have values, the wording of the p10 to p90 meaning).
