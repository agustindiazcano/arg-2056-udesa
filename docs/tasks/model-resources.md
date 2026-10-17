# Task: `model-resources`

Branch: `task/model-resources`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/model-design.md` (section 2.3 is binding: the double-counting rules, the project pipeline, agriculture and the parameter table; sections 4 and 5 for how it is tested and drawn), `docs/assumptions.md`, `docs/decisions.md`, `docs/params.md`, `model/params/params.json`, `model/src/argmodel/params/`, `docs/data-dictionary.md`, `data/schemas/projects.schema.json`, `data/schemas/production_projections.schema.json`, `data/schemas/resource_production.schema.json`, `data/mock/projects.json`, `data/mock/production_projections.json` and `data/mock/resource_production.json` first.
Prerequisites: `model-params` is merged into `main`. The task works with the mock data and the assumption values; real runs wait for real data.

## Goal

The resource block of the model: physical production by resource and province from the project pipeline (minerals, oil and gas) and from area times yield (crops), and the value added `R_t` that this block adds to the core GDP. The block is **additive and separate** (`D-res-1`): it never enters capital or TFP, and the project capex stays outside the core investment (`D-res-2`). Pure, deterministic functions of project records and parameters; the random parts (delay, utilization, which projects get built) take their draws as arguments.

Strict TDD: every mechanism has a hand-computed case before code. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No price model, no exports, no royalties, no balance of payments (not modeled). No random number generation inside this task (arguments carry the draws; `model-montecarlo` makes them).
- No capex in `K`, no resource inside `A`. `production_projections` rows with `metric` `guidance` or `forecast` are **comparison only**: they are never added to the simulated output (they may set the p10 and p90 of delay and utilization in a later calibration, not here).
- The reserve constraint is inactive (`reserve_estimate` is "not modeled yet" in the data dictionary): the code reports it as inactive, it does not invent a reserve.
- No real data, no new dependency (`numpy` only), no UI. Do not edit `docs/model-design.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.
- Parameters without a source (`res.pi_a`, `res.pi_b`, `res.decline_*`, `res.va_unit_*`) are arguments and have no default value in the code. Tests use hand-picked values labelled as test values.

## 1. Files

```
model/src/argmodel/resources/pipeline.py      probability by stage, delay, ramp, plateau, decline
model/src/argmodel/resources/agriculture.py   area times yield
model/src/argmodel/resources/block.py         production by (resource, geo, year) and R_t
model/tests/test_resources_*.py
docs/resources-model.md                       mechanisms, units, the inactive reserve constraint, the "not backtested" label
```

## 2. The mechanisms (from section 2.3)

Read the stage list, the units and the field names from the schema and the data dictionary; do not recall them.

- **Probability of reaching production** `pi(stage) = logistic(a + b * rank(stage))`, `rank` 0 to 7 over the stages from `announced` to `operating`, `operating` always 1. `a` and `b` are arguments. The Bernoulli outcome of a project is an argument (a boolean per project and draw).
- **Delay and ramp**: the start is `start_year + D_p`; output grows linearly over `ramp` years to `u * capacity_per_year`.
- **Oil and gas decline**: after the plateau, output falls by `d_r` per year, exponentially.
- **Units**: `capacity_unit` of the project must match `production_projections.unit` and the contract unit of the resource; a mismatch raises `ValueError` with the exact message (`resources: project {id} has unit {u}, expected {e}`). No unit conversion is made except exact arithmetic spelled out in `docs/resources-model.md`.
- **Agriculture** (`soy`, `wheat`, `corn`): `q = area * yield`, area held at the last observed value, `yield_{t+1} = yield_t * (1 + g_y)`.
- **Value added**: `R_t = sum_r v_r * q_{r,t}` with `v_r` constant per resource (an argument).
- **Provincial output**: production carries the project's `geo`; the national total is the sum of the provinces (a test).
- **Double-counting rules 1 to 4 of the design**, as code or as a documented limit each: (1) the base-year `R_0` is what growth accounting subtracts; the function `base_year_resource_value(...)` returns it from the observed production and `v_r`. (2) Capex never appears in any returned array. (3) `R` is value added by construction. (4) The core-growth calibration overlap is a declared limitation in the doc.

## 3. Tests (write first)

- Hand-computed: the probability for each stage rank with `a` and `b` of the test; one project with delay 2, ramp 3, utilization 0.8 and capacity 100 gives the output per year (write the whole row of numbers); an oil project's decline with `d = 0.1` over four years; an agricultural path with `g_y`.
- Projects already `operating` produce from the base year with probability 1 and no delay.
- Not built (Bernoulli false) means zero production, never a missing value.
- A project whose `start_year + delay` is beyond the horizon contributes zero within it.
- Provinces sum to the national total; resources sum to `R_t` through `v_r` (exact arithmetic).
- **No double counting**: a test builds a scenario with capex set very high and shows no output array changes; a test shows `guidance` and `forecast` rows do not change the simulated output.
- The reserve constraint is reported inactive (a field in the result, with the reason text).
- Unit-mismatch, missing-field and non-finite inputs: one test each with the exact message, plus the positive case.
- The mock `projects.json` runs end to end and the result passes the structure checks used by `check_forecast` for `resource_production` series (positive, finite, by `resource` and `geo`).
- Determinism; no literal parameter in the code (grep test).

## 4. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] Additive block, capex outside, no forecast rows in the output, reserve constraint inactive and reported.
- [ ] The block is labelled "not backtested" in `docs/resources-model.md` (no project vintages exist). `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (units per resource, the stage ranks, the capex assumption `D-res-2`).
