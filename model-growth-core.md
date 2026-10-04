# Task: `model-growth-core`

Branch: `task/model-growth-core`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/model-design.md` (section 2.2 is binding, with the parameter table; sections 2.3 and 2.5 for how the resource block and the AI term attach; sections 5 and 7), `docs/assumptions.md`, `docs/decisions.md`, `docs/params.md`, `model/params/params.json`, `model/src/argmodel/params/` and `model/src/argmodel/population/` first.
Prerequisites: `model-params` and `model-population-hardening` are merged into `main`. If one is not, stop and tell me.

## Goal

The deterministic engine of growth accounting: output from capital, labor and productivity; capital accumulation; TFP growth; and GDP per capita. Pure functions that work on one number or on a vector of draws, so that `model-montecarlo` can run thousands of draws at once. No randomness here, no resource data, no population model: those arrive as inputs.

Strict TDD: hand-computed cases and property tests before code. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No human capital term (`D-growth-1`: omitted in v1). No resource block, no project data, no AI estimates (the AI term is an input array, zeros by default). No random draws, no calibration on real data, no scenarios.
- No literal parameter in the code: `alpha`, `delta` and the rest come from the arguments, which the callers read through the params loader.
- No new dependency (`numpy` only). Do not edit `docs/model-design.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Files

```
model/src/argmodel/growth/core.py        the functions below
model/src/argmodel/growth/__init__.py
model/tests/test_growth_core.py
docs/growth-model.md                     the equations, the inputs, the gaps
```

## 2. The functions (equations copied from section 2.2, not recalled)

All accept scalars or `numpy` arrays of the same shape (broadcasting rules stated in the docstring; a shape mismatch raises `ValueError` with the exact message `growth: {name} has shape {a}, expected {b}`). All reject `NaN` and infinities (`growth: {name} contains a value that is not finite`) and values outside their domain (`K`, `L`, `A` strictly positive; `alpha` in (0, 1); `delta` in [0, 1]; `s` in [0, 1]).

- `core_output(A, K, L, alpha)` = `A * K**alpha * L**(1 - alpha)`.
- `capital_step(K, delta, s, y_core)` = `(1 - delta) * K + s * y_core`.
- `tfp_step(A, g_A, ai_term=0.0)` = `A * (1 + g_A + ai_term)`; reject `1 + g_A + ai_term <= 0`.
- `labor_input(working_age_population, participation)` = `W * pi` with `pi` in (0, 1]. The participation series is **not in any contract today** (assumption A12 says "held at its last observed value"): it is an argument here and a gap to report in `docs/growth-model.md` (needs_source).
- `base_tfp(y_total_0, r_0, K_0, L_0, alpha)`: `A_0 = (Y_total,0 - R_0) / (K_0**alpha * L_0**(1 - alpha))`, an accounting identity, not a parameter; reject `Y_total,0 - R_0 <= 0` with the exact message `growth: core output in the base year is not positive`.
- `gdp_per_capita(y_core, r, population)` = `(y_core + r) / population`.
- `project_core(K_0, A_0, L_path, alpha, delta, s, g_A_path, ai_term_path=None)`: loops the three steps for `T = len(L_path) - 1` years and returns the arrays of `K`, `A` and `Y_core` (shape `(T + 1,)` or `(T + 1, N)` for N draws). `s` and `g_A_path` may be scalars, per-year arrays or per-draw arrays; the broadcasting is documented and tested.

The capital stock `K_0` has **no source and no contract** (assumption A14, `needs_source`; a perpetual-inventory series needs an investment series that is also missing). It is an argument. Real runs wait for it; tests use hand-picked values.

## 3. Tests (write first)

- **Hand-computed cases**: the capital step of the design (`K = 100`, `delta = 0.05`, `s = 0.2`, `Y = 50` gives `K' = 105`); `A_1 = A_0 * (1 + g_A + ai_term)` with numbers; `core_output` with `alpha = 0.5`, `A = 1`, `K = 4`, `L = 9` is `6` (write the arithmetic); `base_tfp` then `core_output` reproduces `Y_total,0 - R_0` exactly (round trip); `gdp_per_capita` with numbers.
- **Property tests** (fixed seeds, many cases, exact tolerances stated): constant returns to scale (scaling `K` and `L` by `k` scales `Y_core` by `k`); monotone response (a higher `A`, `K` or `L` never lowers `Y_core`); zero investment and zero depreciation keep `K` constant; with `g_A = 0`, `ai_term = 0`, `s = delta * K / Y` (steady state) the capital stays constant for many steps.
- **Vector equals scalar**: `project_core` with N draws equals N separate scalar runs, element by element.
- **The AI term is additive** and enters only the TFP step: with `ai_term` zero the result is identical to omitting it; with a constant `ai_term = x` it equals a `g_A` increased by `x`.
- Domain and shape errors: one test per rule with the exact message, and the positive case.
- Determinism: two runs give identical arrays; no clock and no global state.
- No literal parameter: a test greps `core.py` for numeric literals other than `0`, `1` and fails with the line.

## 4. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] Equations match section 2.2; no human capital, no resource data, no randomness; no literal parameter.
- [ ] The gaps (`K_0`, participation) stated in `docs/growth-model.md`; `LASTCONTEXT.md` overwritten; `PENDING.md` updated (`model-growth-core` done).
- [ ] PR description: what changed, what was verified, what the human must verify (the equations against the design, that `K_0` and participation have no source yet).
