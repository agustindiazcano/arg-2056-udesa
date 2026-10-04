# Task: `model-hdi`

Branch: `task/model-hdi`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/model-design.md` (section 2.6 is binding; decision `D-hdi-1`), `docs/assumptions.md`, `docs/params.md`, `model/params/params.json`, `model/src/argmodel/params/`, `docs/population-model.md` and `docs/growth-model.md` first.
Prerequisites: `model-params` and `model-population-drivers` are merged into `main` (and `model-growth-core`, whose GDP per capita feeds the income index). If one is not, stop and tell me.

## Goal

The Human Development Index as a derived quantity, computed with the UNDP formula from three inputs the other components already produce: life expectancy (population), GDP per capita (growth accounting) and an education path. The contract requires an `hdi` series for `AR` and the design says it is derived, not forecast on its own.

Strict TDD: a hand-computed index before code. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- **Do not invent the goalposts.** The minimum and maximum of each dimension are constants of the index and are `needs_source` (the design says so). They are arguments with no default and no literal in the code; tests pass hand-picked values labelled as test values. If the human has already supplied the UNDP goalposts with a citation, they enter through `model/params/params.json` (a follow-up of `model-params`), not through this task.
- No provincial HDI (`D-hdi-1`: not produced). No time trend on `hdi` (rejected in the design). No calibration on real data. No randomness.
- No new dependency (`numpy` only). Do not edit `docs/model-design.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Files

```
model/src/argmodel/growth/hdi.py        or model/src/argmodel/hdi/ (follow the layout the earlier tasks used)
model/tests/test_hdi.py
docs/hdi-model.md                       the formula, the inputs, the assumptions, the open goalposts
```

## 2. The functions (formulas from section 2.6)

- `health_index(e0, e0_min, e0_max_goal)` = `(e0 - e0_min) / (e0_max_goal - e0_min)`.
- `income_index(gdp_per_capita, min_value, max_value)` = `(ln(gdp_per_capita) - ln(min_value)) / (ln(max_value) - ln(min_value))`. The design approximates gross national income per capita by GDP per capita (an assumption, record it in `docs/hdi-model.md` and as an assumption row in `docs/assumptions.md` if it has no row yet).
- `education_path(E_0, E_T, kappa_E, years)` = `E_T - (E_T - E_0) * exp(-kappa_E * (t - t0))`, with `E_T` and `kappa_E` the parameters `hdi.educ_target` and `hdi.kappa_educ`.
- `hdi(health, education, income)` = `(health * education * income) ** (1/3)`.
- `hdi_path(...)`: the three indices and the index for each year from the paths of life expectancy, GDP per capita and education. Each index is clipped to [0, 1] **by the UNDP rule** only if the design says so: read section 2.6; if it does not say, do not clip, and raise `ValueError` (`hdi: {name} index is outside [0, 1]: {value}`) so the caller sees a problem instead of a hidden correction.

## 3. Tests (write first)

- Hand-computed index: with test goalposts `e0_min = 20`, `e0_max_goal = 85`, income `min = 100`, `max = 75000` and inputs `e0 = 72.5`, `GDPpc = 5000`, `E = 0.8` write every intermediate (`health = 52.5 / 65 = 0.8077`, the `ln` values, the cube root) and assert to `1e-6`.
- Each index is monotone in its input; the geometric mean is zero if any index is zero and one if all are one.
- The education path: value at `t0`, at one year (hand-computed) and the limit at a very long horizon; `E_T` below `E_0` is allowed (a decreasing path) and tested.
- Round-trip at calibration (the design's falsifier): given observed `e0`, GDP per capita and education for the base year and the observed `hdi`, a function `check_base_year(...)` returns the difference; the test shows it equals zero for a constructed case and exceeds the stated tolerance (the observed index's rounding, 0.0005) for a perturbed one, with the exact message.
- Domain errors, one test each with the exact message (non-positive GDP per capita, goalposts reversed or equal, non-finite input) and the positive case.
- Determinism; no literal parameter or goalpost in the code (a grep test as in the other model tasks).

## 4. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] No invented goalpost, no provincial HDI, no clipping unless the design says so.
- [ ] `docs/hdi-model.md` lists the two open items: the goalposts (`needs_source`) and the GNI approximation. `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (the goalposts with their source, the approximation of income).
