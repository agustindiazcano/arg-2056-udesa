# Model Parameters Registry (`params.json`)

The model parameter registry at [`model/params/params.json`](file:///model/params/params.json) provides a central, machine-readable declaration of every parameter used in the Argentina 2056 forecasting engine. Its integrity is enforced by [`model/params/params.schema.json`](file:///model/params/params.schema.json) (Draft 2020-12) and verified programmatically via [`argmodel.params`](file:///model/src/argmodel/params/).

The core principle is: **no parameter is hardcoded as an ad hoc literal in the model equations, and no value exists without an explicit audit trail**.

---

## 1. Structure of a Parameter Entry

Every parameter in `params.json` contains exactly 14 required fields (`additionalProperties: false`):

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Unique parameter identifier (e.g. `pop.tfr_target`, `gro.alpha`, `res.va_unit_lithium`). Format: `^[a-z]{2,4}\.[a-z0-9_]+$`. |
| `symbol` | `string` | Mathematical notation used in equations and documentation (e.g. `TFR_T`, `alpha`, `v_r`). |
| `value` | `number \| null` | Deterministic point value. `null` if the parameter is a random variable in Monte Carlo, uncalibrated, or awaiting a source. |
| `unit` | `string` | Physical or economic measurement unit (e.g. `births per woman`, `1/year`, `fraction`, `constant USD per unit`). |
| `distribution` | `enum` | Distribution family: `"fixed"`, `"truncated_normal"`, `"triangular"`, or `"uniform"`. Fixed and calibrated parameters must use `"fixed"`. |
| `low` | `number \| null` | Lower bound (p10 of random distribution or lower sensitivity boundary). Must be `null` when `needs_source: true`. |
| `high` | `number \| null` | Upper bound (p90 of random distribution or upper sensitivity boundary). Must be `null` when `needs_source: true`. |
| `source_id` | `string \| null` | External citation ID from `data/processed/sources.json` (e.g. `wb:SP.DYN.TFRT.IN`). Must match `^[a-z0-9_-]+:[A-Za-z0-9_.-]+$`. |
| `assumption` | `boolean` | `true` if the parameter or its range is a declared working assumption. |
| `justification` | `string` | Explicit rationale for the chosen range, default value, or distribution family. |
| `component` | `enum` | Sub-model component: `"population"`, `"growth"`, `"hdi"`, `"resources"`, `"provinces"`, or `"ai"`. |
| `role` | `enum` | Parameter function: `"fixed"` (constant in baseline), `"calibrated"` (fitted in calibration window), or `"random"` (sampled in Monte Carlo). |
| `needs_source` | `boolean` | `true` if the parameter value/range has not yet been sourced or chosen. |
| `assumption_id` | `string \| null` | Assumption key from [`docs/assumptions.md`](file:///docs/assumptions.md) (e.g. `A01` to `A34`). |

---

## 2. Parameter States

To prevent unverified numbers from entering the model silently, each parameter must be in exactly one of three mutually exclusive states:

1. **`sourced`**:
   - `source_id`: non-null string matching source pattern.
   - `assumption`: `false`.
   - `needs_source`: `false`.
2. **`assumption`**:
   - `source_id`: `null`.
   - `assumption`: `true`.
   - `needs_source`: `false`.
   - `low` and `high`: defined range bounds (if random or evaluated in sensitivity analysis per `D-params-1`).
3. **`needs_source`**:
   - `source_id`: `null`.
   - `assumption`: `false`.
   - `needs_source`: `true`.
   - `value`: `null`, `low`: `null`, `high`: `null` (no value or range chosen yet).

Any other combination (e.g., having both a `source_id` and `assumption: true`, or lacking both without `needs_source: true`) is rejected by the schema and loader.

---

## 3. Parameter Budget and Counts

The model parameter budget is fixed by Section 3 of [`docs/model-design.md`](file:///docs/model-design.md):

### Breakdown by Component and Role

| Component | Entries | Fixed | Calibrated | Random | Notes |
|---|---|---|---|---|---|
| `population` | 5 | 1 | 1 | 3 | Cohort demographic drivers (`e0_max`, `kappa_F`, `TFR_T`, `kappa_e`, `m`) |
| `growth` | 5 | 3 | 0 | 2 | Production function & TFP (`alpha`, `delta`, `rho`, `s`, `g_A`) |
| `hdi` | 2 | 2 | 0 | 0 | Education target and convergence speed (`E_T`, `kappa_E`) |
| `resources` | 20 | 15 | 0 | 5 | Project pipeline (`a`, `b`, `ramp`, decline, delay, util), yields, and 10 $v_r$ (`D-res-3`) |
| `provinces` | 1 | 1 | 0 | 0 | Intercensal share damping (`kappa_prov`) |
| `ai` | 2 | 1 | 0 | 1 | AI TFP annual increment (`delta_AI`) and adoption lag (`lambda_years`) |
| **Total** | **35** | **23** | **1** | **11** | **35 entries in total** |

### Breakdown by Current State

| State | Count | Description |
|---|---|---|
| `sourced` | 0 | No entry has an external `source_id` prior to verified dataset integration. |
| `assumption` | 20 | Declared working ranges documented in [`docs/assumptions.md`](file:///docs/assumptions.md). |
| `needs_source` | 15 | Project pipeline base rates (`res.pi_a`, `res.pi_b`, decline), $v_r$ constants, and AI increment. |
| **Total** | **35** | |

---

## 4. Programmatic Access (`argmodel.params`)

The Python module [`argmodel.params`](file:///model/src/argmodel/params/) provides type-safe access:

```python
from argmodel.params import load_params, get, by_component, summary

# Load all parameters as an immutable mapping:
params = load_params()
alpha = params["gro.alpha"]
print(alpha.symbol, alpha.low, alpha.high)

# Access a single parameter directly:
tfr = get("pop.tfr_target")
print(tfr.unit, tfr.distribution)

# Filter by model component:
growth_params = by_component("growth")

# Obtain summary statistics across roles, components, and states:
s = summary()
assert s["total"] == 35
```

---

## 5. How to Source or Update a Parameter

1. **When empirical research or official statistics become available**:
   - Register the source in `data/processed/sources.json` (or verify existing entry).
   - In `model/params/params.json`, find the parameter entry:
     - Set `source_id` to the registered source key (e.g. `"indec:cuentas_nacionales_2025"`).
     - Set `assumption: false`.
     - Set `needs_source: false`.
     - Fill `value` with the point estimate and/or `low`/`high` with verified empirical confidence intervals.
     - Update `justification` with the specific table/page reference.
   - Run tests via GitHub Actions (`git push` on `task/<slug>`).

2. **When modifying an assumption**:
   - Update [`docs/assumptions.md`](file:///docs/assumptions.md) with the new range and justification.
   - Update the corresponding entry in `model/params/params.json`.
   - Update `DESIGN_RANGES` in [`model/tests/test_params.py`](file:///model/tests/test_params.py).
