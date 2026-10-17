# Task: `sensitivity`

Branch: `task/sensitivity`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/model-design.md` (section 6 is binding: the method, the outputs, what the final report must show, which parameters the sandbox exposes), `docs/assumptions.md` (the sensitivity column was filled from reasoning, this task replaces it with measurement), `docs/params.md`, `model/params/params.json`, `docs/montecarlo.md`, `model/src/argmodel/` and the component docs first.
Prerequisite: `model-montecarlo` is merged into `main`. With the placeholder parameters the run is a test of the tool; the published result needs the real parameter values and ranges (see "What the human supplies").

## Goal

Find out which parameters actually move the answers, with numbers instead of reasoning: one-at-a-time elasticities and variance-based Sobol' indices over the model's parameters, on the outputs the app shows. The result decides which parameters the sandbox exposes, which assumptions deserve a source first, and which parameters can be removed (parsimony).

Strict TDD for the tool, on analytic functions whose answers are known. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- **Do not change any parameter, range or mechanism because of a result.** The task measures. Suggested changes go in the report as lines the human can turn into tasks.
- No new dependency: `numpy` and the standard library (the Sobol' estimators are implemented here, no `SALib`, no `scipy`). No UI.
- Do not edit `docs/model-design.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Files

```
model/sensitivity/oat.py          one-at-a-time elasticities and the tornado data
model/sensitivity/sobol.py        Saltelli sampling and the first-order and total-effect estimators
model/sensitivity/run.py          python -m sensitivity.run --params ... --out ...
model/sensitivity/report.py       docs/sensitivity-report.md
model/tests/test_sensitivity_*.py
docs/sensitivity-report.md        written by the runner
```

## 2. Behavior (section 6 of the design)

- **Deterministic mode**: a run of the model with every random draw replaced by the value the sensitivity sample gives (no inner Monte Carlo): a closed-form loop over the components, one run per sample. State in `docs/sensitivity-report.md` what is held fixed (the project Bernoulli outcomes at their expected value) and why.
- **One-at-a-time**: every parameter moved to its `low` and `high` with all others at their median (the value, or the midpoint of `low` and `high` when the value is `null`, said in the report); the elasticity is `(output(high) - output(low)) / output(median) / ((high - low) / median)` with its sign; a parameter whose median is zero uses the absolute change and the report says so.
- **Sobol'**: Saltelli sampling over all random and fixed parameters that have a range, `N_s = 1,024` base samples, `k` parameters, cost `N_s * (k + 2)` runs (36,864 for `k = 34`); the **Jansen** (total effect) and **Saltelli 2010** (first order) estimators; base samples from a seeded `numpy` generator (seed 2056). Confidence intervals by bootstrap (`B = 200`) so the report shows how sure each index is.
- **Outputs measured**: `gdp_per_capita_usd` AR in 2056, `population` AR in 2056, `resource_production` for lithium and soy in 2056, `hdi` AR in 2056.
- **The report shows**: a tornado (top 10 parameters per output, elasticity with sign) and a table of first-order and total indices with their intervals; the parameters whose total index is below `0.01` for every output, listed as removal candidates; and the sandbox recommendation (which of `gro.s`, `gro.gA`, `pop.tfr_target`, `pop.mig_rate`, `ai.delta` and the growth rate of the rule-of-70 explainer rank high, **measured**, not assumed).

## 3. What the human supplies

Parameters with `value: null` and no range cannot be sampled (`sensitivity: parameter {name} has no range`). The published report needs the ranges from sourced values; until then the report is generated and labelled "PLACEHOLDER RANGES" in its first line, and the result must not be quoted.

## 4. Tests (write first)

- **Known analytic functions**: for the linear function `f(x) = a1*x1 + a2*x2 + a3*x3` with independent uniform inputs the first-order and total indices equal `ai^2 * var(xi) / sum(...)` (hand-computed); for the Ishigami function the first-order indices converge to the published values (`S1 = 0.3139`, `S2 = 0.4424`, `S3 = 0`, total `ST3 = 0.2437`) within the bootstrap interval at `N_s = 2,048`; the sum of first-order indices is at most `1 + tolerance`.
- Saltelli sampling shape, the matrices' reuse and determinism (same seed, same bytes).
- One-at-a-time on `f(x) = x^2` at the median gives the known elasticity (hand-computed) and the sign convention; a zero median uses the absolute change.
- The tornado ranking and the removal-candidate rule on a fixed fixture, with exact output.
- A parameter without a range stops the run with the exact message (positive case: a complete parameter file runs).
- The report writer: exact structure, the "PLACEHOLDER RANGES" first line when any range is a placeholder.
- A tiny model run (`k = 3`, `N_s = 16`) completes in seconds; the full run is selected by an environment variable and never runs in `precheck`.

## 5. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] The estimators reproduce the known indices; nothing in the model changed; no parameter touched.
- [ ] `docs/sensitivity-report.md` generated and labelled; `docs/assumptions.md` sensitivity column updated **only** from the measured indices (a separate commit that quotes the report). `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (that the ranges are real before anyone quotes the ranking; the sandbox recommendation).
