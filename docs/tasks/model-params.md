# Task: `model-params`

Branch: `task/model-params`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/model-design.md` (every parameter table, sections 2, 3, 4 and 7 are binding), `docs/assumptions.md`, `docs/decisions.md`, `scripts/precheck.py`, `pytest.ini` and `model/src/argmodel/population/` (for the code style of the model package) first.
Prerequisite: `model-design` is merged into `main` (it is).

## Decided point (`D-res-3`, human, 2026-10-04): ten `res.va_unit_<r>` constants

The design listed ten resource names (`lithium copper gold silver oil gas soy wheat corn other`) but counted nine value-added constants `v_r`. The human decided **ten** (`other` needs a `v_r` for `R_t = sum_r v_r q_r`, and the `forecast_output` contract has `resource` = `other`). The totals are 20 resource entries and 35 in all (23 fixed). `docs/model-design.md` sections 2.3, 3 and 9 and `docs/decisions.md` already say so; the ten ids are `res.va_unit_lithium`, `res.va_unit_copper`, `res.va_unit_gold`, `res.va_unit_silver`, `res.va_unit_oil`, `res.va_unit_gas`, `res.va_unit_soy`, `res.va_unit_wheat`, `res.va_unit_corn` and `res.va_unit_other`. This task is no longer blocked by `D-res-3`.

## Goal

One machine-readable file with every parameter of the forecasting model, a JSON Schema that makes it impossible to add a number without a source or an explicit assumption flag, and a loader that every later model task uses. This task invents no value and no source: it transcribes `docs/model-design.md` exactly. The point is that the model code never contains a literal parameter, and that a reader can list every unsourced number in one place.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No model equations, no random draws, no Monte Carlo, no calibration. Only the file, its schema, its loader and its checks.
- Do not invent a value, a range or a `source_id`. `docs/sources.md` and `data/raw/research/` do not exist: no entry may have a `source_id` today. An entry the design marks `needs_source` has `value: null`, `source_id: null` and `needs_source: true`.
- No new dependency (`numpy` and the standard library only; the schema is validated with `jsonschema`, already in `requirements-dev.txt`). No TypeScript in this task.
- Do not change `docs/model-design.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Files

```
model/params/params.json                    the 35 entries
model/params/params.schema.json             JSON Schema, Draft 2020-12, additionalProperties: false
model/src/argmodel/params/__init__.py       load_params, Param, get, by_component, summary
model/src/argmodel/params/loader.py
model/tests/test_params.py
docs/params.md                              how to read the file, the counts table, how to add or source a parameter
```

## 2. The entries

The 35 ids of section 3 of the design, copied from the parameter tables of sections 2.1 to 2.6 (the design is the source, not memory):

| component | ids |
|---|---|
| `population` (5) | `pop.tfr_target`, `pop.kappa_f`, `pop.e0_max`, `pop.kappa_e`, `pop.mig_rate` |
| `growth` (5) | `gro.alpha`, `gro.delta`, `gro.rho`, `gro.s`, `gro.gA` |
| `hdi` (2) | `hdi.educ_target`, `hdi.kappa_educ` |
| `resources` (20) | `res.pi_a`, `res.pi_b`, `res.delay`, `res.util`, `res.ramp`, `res.decline_oil`, `res.decline_gas`, `res.yield_g_soy`, `res.yield_g_wheat`, `res.yield_g_corn`, and the ten `res.va_unit_<r>` (decision `D-res-3`, see above) |
| `provinces` (1) | `prov.kappa` |
| `ai` (2) | `ai.delta`, `ai.lag` |

Each entry has the fields of section 7 of the design: `name` (the id), `symbol`, `value`, `unit`, `distribution` (`fixed` | `truncated_normal` | `triangular` | `uniform`), `low`, `high`, `source_id` or `assumption: true`, `justification`, `component`. Add three fields the design implies but does not name: `role` (`fixed` | `calibrated` | `random`, from the `role` column), `needs_source` (boolean) and `assumption_id` (the `A..` id of `docs/assumptions.md` that covers it, or null).

Rules for the values, to be copied from the design, never chosen:
- Where the design gives a range (for example `gro.alpha` 0.30 to 0.45), `low` and `high` are that range and `value` is `null` (no point value was chosen). Section 7 of the design says `low`/`high` are null for `fixed`, but section 6 moves every `[F]` parameter to its `low` and `high` in the sensitivity analysis: **the schema therefore allows `low`/`high` on `fixed` entries**. Record this clarification as decision `D-params-1` in `docs/decisions.md` (one short entry) and tell me in the PR.
- Where the design gives only `needs_source`, `low`, `high` and `value` are `null`.
- `distribution` for a `fixed` entry is `fixed`. For a `random` entry the design says "truncated normal or triangular, the family is declared per parameter": use `triangular` for every random entry in this task and mark each family choice as an assumption in `justification` (a family needs data to be chosen; this is the least informative bounded choice).
- Units copied from the design (`births per woman`, `1/year`, `years`, `per 1,000 population per year`, `pp per year`, ...).

## 3. The schema and the loader

- Schema rules: every entry is in exactly one of three states. `sourced`: `source_id` not null, `assumption: false`, `needs_source: false`. `assumption`: `source_id: null`, `assumption: true`, `needs_source: false`. `needs_source`: `source_id: null`, `assumption: false`, `needs_source: true` (the value is not chosen yet). Any other combination is rejected. Also: `low <= value <= high` where all three are present; `low <= high`; `name` unique; `component` and `role` in their lists; a `random` entry has `low` and `high` not null and a distribution other than `fixed`.
- `load_params(path=default)` returns an immutable mapping of `Param` (frozen dataclass) by id. It raises `ParamsError` with the exact message of each violated rule. `get(name)`, `by_component(component)` and `summary()` (counts per component and role, and the number of entries per state: sourced, assumption, needs_source).
- The loader never reads the clock or the network and does no I/O except the file.

## 4. Tests (write first)

- The schema accepts one valid entry of each state and rejects each rule violation with the exact message (one test per rule, including the positive case).
- `params.json` has exactly the ids of section 2 above, no more, no fewer (read the list from this test, not from the file).
- `summary()` equals the table of section 3 of the design: 35 entries, 23 fixed, 1 calibrated, 11 random; per component 5, 5, 2, 20, 1, 2.
- Every entry with a range in the design has exactly those `low` and `high` (a table in the test, copied from the design).
- No entry has a `source_id` today (a test that will have to change when sources arrive, with a comment saying so).
- Every `assumption_id` exists in `docs/assumptions.md`.
- A test fails if any parameter lacks both `source_id` and `assumption: true` and is not marked `needs_source`.
- The loader raises `ParamsError` for a missing file, invalid JSON and a duplicate name.

## 5. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] 35 entries transcribed from the design; no value, range or source invented; counts match the design table.
- [ ] `D-params-1` recorded in `docs/decisions.md`; the answer to `D-res-3` (ten) applied and stated in the PR.
- [ ] `docs/params.md` written; `LASTCONTEXT.md` overwritten; `PENDING.md` updated (`model-params` done; the human lists A10, A13, A15, A16, A24, A26, A31, A32, A33 still decide).
- [ ] PR description: what changed, what was verified, what the human must verify (each range against the design, the `triangular` family choice, `D-params-1`).
