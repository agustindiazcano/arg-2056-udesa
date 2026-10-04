# Model design: Argentina 2056

Status: design only, written before any model implementation beyond `population`. No code, schema or data was changed to write it.
Source policy: `docs/sources.md` and `docs/research-prompts.md` do not exist in the repository and `data/raw/research/` is empty, so **no parameter below has a `source_id`**. Every value is marked `needs_source` or `assumption: true` (range and reason given). Mechanism definitions and accounting identities are marked `identity` and need no source. Nothing here is a claim about Argentina.
Contract names are copied from `data/schemas/*.json` and `docs/data-dictionary.md`.

## 1. Claims and scope

**Output** (exactly the `forecast_output` contract): one object with `model_version`, `generated_at`, `source` (`argmodel@<version>`), `horizon {start_year, end_year}` and `series[]`. Each series has `indicator` in {`gdp_constant_usd`, `gdp_per_capita_usd`, `population`, `hdi`, `resource_production`}, `resource` (only for `resource_production`; one of `lithium copper gold silver oil gas soy wheat corn other`), `geo` (`AR` or `AR-A`..`AR-Z`), `scenario` in {`pessimistic`, `expected`, `optimistic`}, `ai_overlay` in {`off`, `on`}, `unit`, and `points[] {year, p10, p50, p90}`. Series key: `(indicator, resource, geo, scenario, ai_overlay)`.

**Coverage rule:** `hdi` is produced for `AR` only; provinces get `gdp_constant_usd`, `gdp_per_capita_usd`, `population`, `resource_production`.

**Not modeled:** inflation, exchange rate, fiscal accounts, balance-of-payments crises, political regime, commodity price paths, trade. The fan reflects these omissions only through one calibration: the dispersion of the TFP-growth driver (`sigma_gA`, section 2.2) is set so that the implied GDP-growth error at horizons 1-10 matches the spread of past forecast errors in `forecast_vintages` (which contain those shocks). The left tail may still be too thin; that is a declared failure mode, tested by the coverage criteria of section 5.

**Claims a reader can check against data:**
1. Population: the `expected` p50 for `AR` population in 2025, run from the 2005 origin, is compared with the observed value and with the unadjusted external projection (section 5).
2. GDP per capita: the p10-p90 interval from the 2005 origin contains the observed 2025 value, and the p50 error is lower than the best baseline at horizon 10 and 20 (section 5, criteria C1-C2).
3. Doubling time: for any growth path shown, doubling time = 70 / growth rate in percent (rule of 70, `identity`, approximation of ln 2 / ln(1+g)).

## 2. Components

Notation: `t` is the year, `t0` the base year (last observed year), `T` the end year. `[F]` fixed, `[C]` calibrated, `[R]` random in Monte Carlo, `[S]` scenario driver. Parameter ids are used in `model/params/params.json` (section 7).

### 2.1 Population

**Mechanism.** People are born, age one year at a time, die with an age-specific probability and migrate. Nothing else changes a cohort.

**Variables.** `N[a,t]` people of age `a` = 0..100+ (persons); `S[a,t]` survival from age `a` to `a+1` (fraction; the open interval 100+ keeps its own survivors); `f[a,t]` births per person of age `a` (births per person-year, both sexes of the parent age group combined); `M[a,t]` net migrants of age `a` (persons per year).

**Equations** (identical to `model/src/argmodel/population/cohort.py`, `identity`):
- `N[0,t+1] = sum_a N[a,t]·f[a,t] + M[0,t]`
- `N[a,t+1] = N[a-1,t]·S[a-1,t] + M[a,t]` for `a = 1..A-2`
- `N[A-1,t+1] = N[A-2,t]·S[A-2,t] + N[A-1,t]·S[A-1,t] + M[A-1,t]`
- `f[a,t] = TFR_t · shape_f[a] · share_f[a]`, where `shape_f` sums to 1 (age pattern of fertility, data) and `share_f` is the female share of age group `a` (data). Exact arithmetic: births per woman over a lifetime = `TFR`.
- `TFR_t = TFR_T + (TFR_0 − TFR_T)·exp(−kappa_F·(t − t0))`.
- Survival from a one-parameter relational life table: `S[a,t] = S_std(a; e0_t)`, the standard table family interpolated so that life expectancy at birth equals `e0_t`; `e0_t = e0_max − (e0_max − e0_0)·exp(−kappa_e·(t − t0))`.
- `M[a,t] = m_t · P_t/1000 · shape_m[a]`, with `shape_m` summing to 1 (data), `m_t` constant per draw.

**Inputs** (dataset names as in the data dictionary): `population` (totals by `geo`, `year`; **no age structure**), `external_forecasts` (indicators `population`, `fertility_rate`, `life_expectancy_at_birth`, `working_age_population`; variants `low/medium/high`), `dataset_catalog` (pointer to the age-structured source). **Gap:** the age-by-year population, fertility schedule, standard life table and migration age pattern are not in any contract; a new dataset contract is needed (task `population-age-contract`, section 8).

**Parameters.**

| id | symbol | unit | value or range | source | role |
|---|---|---|---|---|---|
| pop.tfr_target | `TFR_T` | births per woman | 1.2 to 2.1 | assumption: bracket between very low observed fertility and replacement level (2.1, definition of replacement); to be replaced by the `external_forecasts` spread | [R] |
| pop.kappa_f | `kappa_F` | 1/year | 0.02 to 0.10 | needs_source; fitted to the 1990-2005 fertility path | [C] |
| pop.e0_max | `e0_max` | years | 85 to 90 | assumption: asymptote of life expectancy; reason: parsimony, one level parameter | [F] |
| pop.kappa_e | `kappa_e` | 1/year | 0.01 to 0.04 | assumption; spread of `life_expectancy_at_birth` variants once loaded | [R] |
| pop.mig_rate | `m` | per 1,000 population per year | -1.0 to 2.0 | assumption: wide bracket around zero; reason: no verified series yet | [R] |

Count: 5 entries (1 fixed, 1 calibrated, 3 random).

**Calibration.** `kappa_F` by least squares on the observed total fertility path up to 2005; `e0_0`, `TFR_0`, `N[.,t0]` are data. The random parameters get their p10/p90 from the spread of the `external_forecasts` variants and, where available, past population-projection errors (not available today, see section 5).

**Alternatives rejected.**
- Logistic or exponential growth of the total: no mechanism, cannot give age structure (needed for working-age labor) and cannot reproduce momentum.
- Two-sex cohort model: doubles the survival and migration parameters and adds a sex ratio at birth; the outputs (totals, working-age population) do not need it; reconsider only if the backtest shows a sex-specific error.
- Lee-Carter stochastic mortality: more parameters (one per age plus a time index), data for 100 ages not available; rejected by parsimony.

**Failure modes.** Negative cohorts under large negative migration (the code does not clamp; see decision D-pop-1 in `docs/decisions.md`); fertility rebounds; migration shocks.

**Falsified if** the observed total population in 2015 or 2025 lies outside p10-p90 from the 2005 origin and the error exceeds the unadjusted external projection at horizons 10 and 20; or if cohort conservation fails in any test (`sum N[t+1] = births + survivors + migration`).

### 2.2 Growth accounting

**Mechanism.** Output is made by workers using capital; capital accumulates from investment and wears out; productivity (TFP) is the part of output growth not explained by inputs.

**Variables.** `Y_core` GDP excluding the resource block (constant USD per year); `K` capital stock (constant USD); `L` labor input (persons) `= W_t · pi`, `W` working-age population from the population component, `pi` participation held at its last observed value (data); `A` TFP (index); `s` investment rate (fraction of `Y_core`); `g_A` TFP growth (fraction per year).

**Equations** (`identity` unless noted):
- `Y_core,t = A_t · K_t^alpha · L_t^(1−alpha)` (constant returns to scale).
- `K_{t+1} = (1 − delta)·K_t + s·Y_core,t`.
- `A_{t+1} = A_t · (1 + g_A,t)`; `g_A,t = gA_draw + AI term` (section 2.5).
- Base year: `A_0 = Y_core,0 / (K_0^alpha · L_0^(1−alpha))`, with `Y_core,0 = Y_total,0 − R_0` (section 2.3). `A_0` is an accounting identity, not a parameter.
- `gdp_per_capita_usd = (Y_core + R) / population`.
- Human capital is not modeled separately (folded into `A`): decision D-growth-1.

**Inputs:** `economy_series` (`gdp_constant_usd`, `gdp_per_capita_usd`, `population`, `hdi`; from 1810 in the schema), `population` component output, `base_rates`, `external_forecasts` (`tfp_growth_pct`, `investment_rate_pct_gdp`, `potential_growth_pct`), `forecast_vintages`. **Gap:** an initial capital stock `K_0` series is not in any contract (needs_source; perpetual inventory from investment needs an investment series also missing).

**Parameters.**

| id | symbol | unit | value or range | source | role |
|---|---|---|---|---|---|
| gro.alpha | `alpha` | fraction | 0.30 to 0.45 | assumption: usual bracket for the capital share; needs_source | [F] |
| gro.delta | `delta` | 1/year | 0.03 to 0.08 | assumption: bracket for depreciation of mixed capital; needs_source | [F] |
| gro.rho | `rho(g_A, s)` | correlation | 0.0 to 0.5 | assumption: weak positive co-movement; reason: avoids independent extremes | [F] |
| gro.s | `s` | fraction of `Y_core` | 0.12 to 0.25 | assumption; to be replaced by the historical distribution | [R] |
| gro.gA | `g_A` | fraction per year | -0.005 to 0.020 | assumption; dispersion set from `forecast_vintages` errors, location from `base_rates` | [R][S] |

Count: 5 entries (3 fixed, 2 random; `g_A` is the scenario driver).

**Calibration.** `alpha` and `delta` fixed from literature once sourced (not fitted: fitting both and `g_A` on one short series is not identified). Location and scale of `g_A`: location from `base_rates` (growth episodes of peers), scale `sigma_gA` so that the simulated one-year-ahead GDP-growth error SD equals the SD of one-year-ahead errors in `forecast_vintages` (exact arithmetic, stated in the backtest report).

**Alternatives rejected.**
- ARIMA on log GDP per capita as the forecasting engine: no mechanism, no link to population or resources; kept only as a baseline.
- Growth with explicit human capital (schooling term): +2 parameters and a schooling series not in any contract; adopt only if the backtest shows an error a mechanism change can explain.
- Cross-country convergence regression: an empirical pattern without a mechanism for Argentina; its information enters through `base_rates`.

**Failure modes.** Fan too narrow in crisis decades (no crisis mechanism); `K_0` error scales into all years; the participation rate is not constant in reality.

**Falsified if** the observed GDP per capita in 2025 lies outside p10-p90 from the 2005 origin, or if the best baseline beats the model p50 at all three horizons (criteria C1-C2).

### 2.3 Resources

**Decision (D-res-1): a separate additive block, not folded into capital and TFP.** `Y_total,t = Y_core,t + R_t`, `R_t = sum_r v_r · q_{r,t}` (`identity`).
- Why: the contract needs physical `resource_production` by resource and province, which an aggregate production function cannot give; and projects have their own schedule, probability and capex.
- Alternatives rejected: (a) all resources inside `K` and `A`: no physical output, and project timing becomes an ad hoc TFP jump; (b) exogenous production paths copied from `production_projections`: no uncertainty, mixes sources of different quality, cannot give a fan.

**Double counting rules (explicit):**
1. `Y_core` is calibrated on `Y_total − R` in the base year, so the base-year resource output is not in `A` or `K`.
2. Project capex is not part of `s·Y_core` and does not enter `K`; it is a cost financed outside the core investment rate (assumption D-res-2, flagged to the human).
3. `v_r` is the value added per unit, so `R` adds value added, not gross output or exports; exports, royalties and the balance of payments are not modeled.
4. `g_A` is calibrated on core growth only (non-resource), using the same `R_0` subtraction on history; until a resource value-added history exists, the overlap in the calibration window is a declared limitation (`needs_source`).

**Mechanism: project pipeline** (for `lithium copper gold silver oil gas` and `other`). A project `p` (dataset `projects`: `status`, `capex_usd`, `start_year`, `capacity_per_year`, `capacity_unit`, `geo`) moves toward production:
- Reaches production with probability `pi(stage) = logistic(a + b·rank(stage))`, `rank` 0..7 over {`announced` … `operating`}; `operating` has probability 1.
- Start is delayed by `D_p` years from `start_year`.
- Output ramps linearly over `ramp` years to `u · capacity_per_year`, with `u` the utilization.
- Oil and gas: after the plateau, output declines by `d_r` per year (exponential).
- Physical constraint: cumulative output of a project cannot exceed its reserve estimate once available (metric `reserve_estimate` is "not modeled yet" in the data dictionary; **blocked by data**; until then the constraint is inactive and reported as such).
- Volumes in the units of `production_projections.unit`; `production_projections` rows with `metric` `guidance`/`forecast` are used only as comparison and to set the p10/p90 of `D_p` and `u`, never added to the simulated output.

**Mechanism: agriculture** (`soy wheat corn`). `q = area · yield`; area held at its last observed value (`ha`), `yield_{t+1} = yield_t·(1 + g_y)`.

**Inputs:** `projects`, `production_projections`, `resource_production` (history), `composition`.

**Parameters.**

| id | symbol | unit | value or range | source | role |
|---|---|---|---|---|---|
| res.pi_a | `a` | logit | needs_source | needs_source: base rate of reaching production by stage | [F] |
| res.pi_b | `b` | logit per rank | needs_source | needs_source | [F] |
| res.delay | `D_p` | years | 0 to 6 | assumption: p10/p90 of the delay of a project | [R] |
| res.util | `u` | fraction | 0.5 to 1.0 | assumption: utilization after ramp | [R] |
| res.ramp | `ramp` | years | 1 to 5 | assumption | [F] |
| res.decline_oil, res.decline_gas | `d_oil`, `d_gas` | 1/year | needs_source | needs_source | [F] x2 |
| res.yield_g_soy, _wheat, _corn | `g_y` | 1/year | -0.005 to 0.020 | assumption; replace by observed trend per crop | [R] x3 |
| res.va_unit_{r} | `v_r` | constant USD per unit | needs_source | needs_source; data constant per resource, 10 entries (`lithium copper gold silver oil gas soy wheat corn other`; decision D-res-3) | [F] x10 |

Count: 20 entries (15 fixed, of which 10 data constants; 5 random).

**Calibration.** `a`, `b` from base rates of project advancement by stage (research data, not yet available); `v_r` from the composition and production data; `g_y` from the history in `resource_production`. No quantity is calibrated on the backtest window.

**Alternatives rejected** are listed above (a), (b); additionally a statistical trend per resource and province is rejected as a model (kept as a baseline).

**Failure modes.** Pipeline probabilities not transferable across commodities; price swings change which projects are built (no price model); reserve limits inactive.

**Falsified if**, once data exists, the 2005-vintage project list implies a 2025 volume outside p10-p90 for at least half of the resources, or a trend baseline beats the pipeline at horizon 10 for most resources. **Not testable today** (no historical project vintages); until then the block carries the label "not backtested" in the UI and the PR.

### 2.4 Provincial allocation

**Problem.** No harmonized provincial GDP series exists.

**Method (v1).**
- Population: `P_p,t = P_AR,t · share_p,t`; `share_p` held at the last census shares (`population` dataset, `geo = AR-X`); variant with damped drift: `log share_p,t = log share_p,t0 + kappa_prov · trend_p · (t − t0)`, retained only if it beats constant shares in the pre-registered test below.
- Resource production: native (projects carry `geo`).
- GDP: `Y_p,t = Y_core,t · share_p,t · phi_p + R_p,t`, with `phi_p = 1` (equal core GDP per person across provinces, a stated limit) and `R_p,t = sum_r v_r q_{r,p,t}`.
- Province fans reuse the national draws (the same random numbers), so province results are consistent with the national ones draw by draw.

**Proxy limits.** Equal core GDP per capita ignores real income differences; provinces without resources get the national core average; shares ignore internal migration beyond the optional drift.

**Parameters.**

| id | symbol | unit | value or range | source | role |
|---|---|---|---|---|---|
| prov.kappa | `kappa_prov` | fraction | 0 to 1 | assumption: damping of the intercensal share trend; 0 means constant shares | [F] |

Count: 1 entry.

**Alternatives rejected.** Night-lights or electricity as GDP proxy: needs a new dataset and a calibration with no harmonized target to fit against. Provincial statistical-office GDP: not harmonized across provinces.

**Falsified if** the drift variant is not better than constant shares: pre-registered rule, drift is kept only if its 2005-origin population share error at horizon 20 is below constant shares in at least 18 of 24 provinces (arithmetic: 75% of provinces; criterion chosen by design, decided by the human, D-prov-1).

### 2.5 AI overlay

**Quantity modified:** TFP growth, in percentage points per year: `g_A,t = g_A,base,t + lambda_t · delta_AI` where `delta_AI` (pp per year, sourced range) and `lambda_t` ramps linearly from 0 to 1 over `lambda_years` (adoption lag).
- **Admissible estimates:** records of `ai_estimates` with `outcome_metric == tfp_growth_pp_per_year`, plus records with `tfp_level_gain_pct_cumulative` only through the exact compounding already validated in the data (`derived_annualized_pp`, formula `((1 + value/100)^(1/n) − 1)·100`, `n = horizon_end_year − horizon_start_year`). Records of `labor_productivity_*`, `gdp_*`, `employment_*` and `adoption_rate_pct` measure different quantities: they are context, never inputs, and are never converted or averaged.
- **Range:** `delta_AI` is drawn between the lowest `value_low` and the highest `value_high` among admissible records (`spreadByScenario` bounds); in the absence of admissible records the overlay is not produced (series with `ai_overlay: on` are omitted, not filled).
- **Interaction with scenarios (D-ai-1):** the overlay draw is independent of the scenario; all three scenarios use the full admissible range. Reason: no evidence links low AI gains to pessimistic base growth; tying them would add an unsourced correlation. Overlay `on` and `off` use the same random numbers, so the difference between them is the overlay effect alone.
- **Not backtestable** (the effect post-dates the training window): results with `ai_overlay: on` are conditional ("if the sourced range holds"), never predictions; the UI must show the full range and citations.

**Parameters.**

| id | symbol | unit | value or range | source | role |
|---|---|---|---|---|---|
| ai.delta | `delta_AI` | pp per year | needs_source (from admissible `ai_estimates`) | needs_source | [R] |
| ai.lag | `lambda_years` | years | 5 to 15 | assumption: adoption lag | [F] |

Count: 2 entries.

**Alternatives rejected.** Overlay on GDP level (different quantity, would double count with growth accounting); overlay on labor input (displacement estimates are exposure, not outcomes).
**Falsified if** any later observed TFP path lies outside the sourced range for the same horizon (reported when data exist).

### 2.6 HDI (derived)

`hdi = (I_health · I_educ · I_income)^(1/3)` (UNDP formula, `identity`); `I_health = (e0 − e0_min)/(e0_max_goal − e0_min)` from the population component; `I_income = (ln(GDPpc) − ln(min))/(ln(max) − ln(min))`, gross national income approximated by GDP per capita (assumption); `I_educ` follows `I_educ,t = E_T − (E_T − E_0)·exp(−kappa_E·(t − t0))`. Goalposts (min, max) are constants of the index, `needs_source`.

| id | symbol | unit | value or range | source | role |
|---|---|---|---|---|---|
| hdi.educ_target | `E_T` | index 0-1 | 0.85 to 1.00 | assumption | [F] |
| hdi.kappa_educ | `kappa_E` | 1/year | 0.01 to 0.05 | assumption | [F] |

Count: 2 entries. Alternatives rejected: a time trend on `hdi` (no mechanism); omitting `hdi` (the contract requires it). Falsified if the formula with observed inputs does not reproduce the observed `hdi` within its rounding in the base year (checked at calibration).

## 3. Parameter budget

| Component | Entries | Fixed | Calibrated | Random in MC | Scenario driver |
|---|---|---|---|---|---|
| Population | 5 | 1 | 1 | 3 | 0 |
| Growth accounting | 5 | 3 | 0 | 2 | 1 (`g_A`, counted among random) |
| HDI | 2 | 2 | 0 | 0 | 0 |
| Resources | 20 | 15 | 0 | 5 | 0 |
| Provincial | 1 | 1 | 0 | 0 | 0 |
| AI overlay | 2 | 1 | 0 | 1 | 0 |
| **Total** | **35** | **23** | **1** | **11** | **1** |

Hyperparameter numbers: each random entry carries `low` and `high` (p10 and p90 of its distribution), so the number of fitted or assumed values is `23 + 1 + 2·11 = 46`. Data constants: 10 of the fixed entries are `v_r`; the `shape_*` schedules and `S_std` are data, not parameters. Every parameter is justified in its component section; a parameter with no justification is removed from the design.

## 4. Scenarios and uncertainty

**Scenario definition (D-scen-1).** One joint distribution over all random parameters. A scenario is a **conditional reading of that distribution** by the tercile of the TFP-growth driver `g_A` (before the AI term):
- `pessimistic`: draws with `g_A` in its lowest third; `expected`: middle third; `optimistic`: top third.
- Implemented by stratified draws: `u_gA` is sampled uniformly inside `(0,1/3)`, `(1/3,2/3)`, `(2/3,1)` and mapped through the inverse CDF.
- Within a scenario, the p10-p90 interval is produced by all other random parameters and by the spread of `g_A` inside its third.
- The unconditional fan is the union of the three groups (equal weights) and is the object tested by the coverage criterion.

**Why this cannot explain both an outcome and its opposite.** The unconditional p10-p90 is fixed before any observation. A realised path is assigned to a scenario *after the fact* by the realised value of `g_A` (computed from the observed data by the same accounting identity), not by looking at the outcome level. Pre-registered separation criterion (section 5, C4): scenario medians must be strictly ordered and the gap between neighbouring medians must be at least 20% of the pooled p10-p90 width at horizon 20 (the 20% is a design choice, decided by the human, D-scen-2). A design where the three curves overlap fully fails C4; one where each scenario is wide enough to contain any outcome fails C3.

**Random quantities** (parameter ids in sections 2.x): `pop.tfr_target`, `pop.kappa_e`, `pop.mig_rate`, `gro.s`, `gro.gA`, `res.delay`, `res.util`, `res.yield_g_*`, `ai.delta`, plus per-project Bernoulli draws of reaching production. Distributions: truncated normal or triangular between `low` and `high` (p10/p90); the family is declared per parameter in `params.json`. Justification of each distribution: past forecast errors (`forecast_vintages`) for `g_A` scale; spread of `external_forecasts` variants for population drivers; base rates for project outcomes; spread of admissible `ai_estimates` for `delta_AI`.
**Correlations:** only `(g_A, s)` with `rho` from `gro.rho`; everything else independent (a stated simplification; correlated commodity shocks are not modeled).
**Draws and seed:** `N = 3,000` per scenario (9,000 total), assumption: with this N the standard error of a p10 or p90 estimate is about 1.5% of the interval width (to be confirmed by the sensitivity task); master seed `2056`; `numpy.random.SeedSequence(2056).spawn` gives one stream per component and per scenario; the same random numbers are reused for `ai_overlay` on/off and for all geographies.
**p10/p50/p90:** empirical quantiles over the `N` draws of the scenario for each year. Reader meaning: "among simulated futures consistent with this scenario and with the stated assumptions, 10% end below p10 and 10% above p90." They are not probabilities about the real world beyond the model's assumptions.

## 5. Calibration and backtest protocol (pre-registered)

Training window: data up to **2005**. Test window: **2006-2025**. The test window is never read during calibration; code must slice the inputs by year before fitting.

**Baselines.**
- B1 persistence: last observed value held constant (for growth: last observed growth held).
- B2 linear trend on log GDP per capita fitted on the training window.
- B3 ARIMA(1,1,0) with drift on log GDP per capita fitted on the training window.
- For population: B4, the unadjusted external projection of the 2005 vintage (`external_forecasts`, variant `medium`), if a vintage from that period is available; otherwise B1-B2 only and the population claim is reported as "not compared with an external baseline".

**Metrics:** absolute log error of p50 at horizons 5, 10, 20 (years 2010, 2015, 2025 from origin 2005); bias (mean signed log error); coverage of p10-p90 (fraction of observed values inside).
**Cases:** 4 indicators with observed series (`gdp_constant_usd`, `gdp_per_capita_usd`, `population`, `hdi`) x 3 horizons for `AR` = 12 cases.

**Success criteria (relations to baselines, written before any run):**
- **C1.** For `gdp_per_capita_usd` and for `population`, the model has lower p50 absolute log error than the best of B1-B3 (B1-B4 for population) at horizon 10 **and** at horizon 20.
- **C2.** For the same two indicators the model error at horizon 5 is not more than 1.25 times the best baseline error (the factor is a design choice, D-bt-1).
- **C3.** Coverage: at least 8 of the 12 observed values lie inside p10-p90. Arithmetic: if the model is calibrated (true coverage 0.8) it passes with probability 0.927; if true coverage is 0.65 it passes with probability 0.583; if 0.5, 0.194 (binomial, n = 12). The test has low power; it is a screen, not proof.
- **C4.** Scenario separation as defined in section 4.
- **C5.** Cohort conservation and the identities of section 7 hold in every test run.
- **Resources:** no criterion until project vintages exist; reported as "not testable".

**If a criterion fails:** the report states which, with the numbers, and the design is changed only by a documented change of mechanism in `docs/decisions.md`; no parameter is tuned on the test window and no multiplicative correction is added. A negative result is published as is.

**Series needed for 1990-2025 and status.**

| Series | Needed for | Status |
|---|---|---|
| `economy_series` real, `gdp_constant_usd`, `gdp_per_capita_usd`, `population`, `hdi`, 1990-2025 | metrics, B1-B3 | schema exists; real data missing (only mock) |
| Age-structured population, fertility schedule, life tables, 1990-2025 | population component, B4 | no contract; missing |
| Population projection vintage ~2005 | B4 | missing |
| Investment series and capital stock | `K_0` | no contract; missing |
| `forecast_vintages` for GDP growth | `sigma_gA` | schema exists; real data missing |
| Resource value added history and project vintages | resource block, `g_A` core calibration | missing |
| `resource_production` history 1990-2025 | agriculture, baselines | schema exists; real data missing |

## 6. Sensitivity analysis plan

- **Method:** (1) one-at-a-time elasticities: each parameter moved to its `low` and `high` with the others at the median, deterministic mode (no Monte Carlo); (2) variance-based first-order and total Sobol' indices using Saltelli sampling over all `[R]` and `[F]` parameters with ranges, `N_s = 1,024` base samples, `k = 34` parameters, cost `N_s·(k+2) = 36,864` deterministic runs (affordable because each run is a closed-form loop, no inner Monte Carlo).
- **Outputs:** `gdp_per_capita_usd` AR in 2056, `population` AR in 2056, `resource_production` for lithium and soy in 2056, `hdi` AR in 2056.
- **Final report must show:** a tornado (top 10 parameters per output, elasticity with sign) and a table of Sobol' first-order and total indices; parameters whose total index is below 0.01 for every output are candidates for removal (parsimony).
- **Sandbox exposes** (few, high expected sensitivity, policy-meaningful, in the TS port): `gro.s`, `gro.gA`, `pop.tfr_target`, `pop.mig_rate`, `ai.delta` (overlay on/off and range position), the rule-of-70 explainer input (growth rate). Others stay hidden: they need data the user cannot judge. Confirmation of the expected-high-sensitivity claim comes from this task, not from reasoning.

## 7. Interfaces

**Inputs:** `population`, `economy_series`, `projects`, `production_projections`, `resource_production`, `composition`, `external_forecasts`, `forecast_vintages`, `base_rates`, `ai_estimates`, `dataset_catalog` (schemas in `data/schemas/`), plus the missing age-structured population dataset (new contract). **Output:** `forecast_output.json` validated by `forecast_output.schema.json` and `check_forecast`; `source` = `argmodel@<version>`; `generated_at` = run date.

**Parameter file** `model/params/params.json`: array of objects with `name`, `symbol`, `value` (point value or null), `unit`, `distribution` (`fixed` | `truncated_normal` | `triangular` | `uniform`), `low`, `high` (p10, p90 of the distribution; null for `fixed`), `source_id` **or** `assumption: true`, `justification` (string), `component` (`population` | `growth` | `hdi` | `resources` | `provinces` | `ai`). Its JSON Schema (`additionalProperties: false`, rule: `source_id` xor `assumption: true`, `low <= value <= high` where present) is created in task `model-params`. A test fails if any parameter lacks both `source_id` and `assumption`.

**RNG and reproducibility:** `numpy.random.Generator(PCG64)` from `SeedSequence(2056)`, spawned per component and scenario; no wall clock, no global random state, no network. Same seed gives byte-identical output; a different seed gives different output.

**TypeScript port (sandbox).** Included: population cohort step, growth accounting step (`K`, `A`, `Y_core`), the AI term, HDI formula, rule-of-70, the deterministic expected path. Excluded: Monte Carlo, per-project draws, provinces, calibration. **Parity:** (1) hand-computed minimal cases per mechanism (for example one year of capital accumulation: `K=100, delta=0.05, s=0.2, Y=50 -> K'=105`); (2) property tests: cohort conservation, constant returns to scale (scaling `K` and `L` by `k` scales `Y_core` by `k`), monotone response of output to `A`, identities (`gdp_per_capita = GDP/population`, `hdi` formula); (3) golden vectors generated by Python, **only in addition to** (1)-(2), since they prove stability, not correctness.

## 8. Implementation plan

Order is dependency order. `can_start_now` means it works with mock data or declared assumptions.

| # | slug | goal | inputs | must not | tests define done | flag |
|---|---|---|---|---|---|---|
| 1 | `model-params` | `params.json` + schema + loader with the section 2 ids | this document, `docs/assumptions.md` | invent values or sources; every entry has `source_id` xor `assumption: true` | schema accepts/rejects each case; every id of this document present; ranges consistent | can_start_now |
| 2 | `model-population-hardening` | fix audit findings in `cohort.py`/`population.ts`: reject `A < 2`, validate shapes, non-zero `migration[0]` test, test that reads the golden file | audit F5, F8, F9 | change equations | new failing tests first; conservation test; TS and Python agree for `A = 2` | can_start_now |
| 3 | `population-age-contract` | schema, check and mock for age-structured population, fertility, life table | data dictionary | real data | schema/checks tests, deterministic mock | can_start_now |
| 4 | `model-population-drivers` | `TFR_t`, `e0_t`, relational life table, migration pattern on top of the cohort step | tasks 1-3 | clamp negatives silently | hand-computed TFR and survival cases | blocked_by: 3 (and real data for calibration) |
| 5 | `model-growth-core` | `Y_core`, `K`, `A`, `L`, `gdp_per_capita` | tasks 1, 2 | add human capital; use resource data | hand-computed capital step; CRS and monotonicity property tests | can_start_now (assumption values) |
| 6 | `model-hdi` | HDI from e0, GDPpc and education path | 1, 4, 5 | invent goalposts | hand-computed index case | blocked_by: 4; goalposts `needs_source` |
| 7 | `model-resources` | project pipeline and agriculture volumes, `R_t` | 1, `projects` mock | add capex to `K`; use `forecast` rows as output | hand-computed ramp, delay, decline, probability cases; no double counting test | can_start_now (mock) |
| 8 | `model-ai-overlay` | `delta_AI` range from admissible estimates, `lambda_t` | 1, 5, `ai_estimates` mock | use inadmissible metrics; convert quantities | admissibility test; on/off use same random numbers | can_start_now |
| 9 | `model-montecarlo` | scenarios by `g_A` terciles, draws, quantiles, `forecast_output` writer | 4-8 | change mechanisms | determinism (byte-identical), seeds differ, schema + `check_forecast` pass, `p10 <= p50 <= p90` | blocked_by: 4, 5, 7, 8 |
| 10 | `backtest-baselines` | B1-B4 and metrics code on a fixed window | real series 1990-2025 | read the test window in calibration | slicing test, hand-computed errors | blocked_by: verified research data |
| 11 | `backtest-run` | run protocol of section 5 and write the report | 9, 10 | tune on the test window | report lists C1-C5 pass/fail with numbers | blocked_by: 9, 10 |
| 12 | `sensitivity` | tornado and Sobol' of section 6 | 9 | change parameters | indices sum checks on a known analytic function | blocked_by: 9 |
| 13 | `model-ts-port` | TS port of section 7 | 5, 8 | include Monte Carlo | parity tests of section 7 | blocked_by: 5, 8 |
| 14 | `model-provinces` | downscaling of section 2.4 | 9 | add GDP proxies not in this document | shares sum to 1, draw-by-draw consistency with national | blocked_by: 9 |

## 9. Open decisions for the human

| id | decision | options | recommendation | if the human chooses otherwise |
|---|---|---|---|---|
| D-scen-1 | Scenario definition | (a) conditional tercile of `g_A`; (b) regimes (sets of structural assumptions); (c) quantiles of the output | (a) | (b) needs a documented list of regime parameters and a rule to avoid tuning them to outcomes; (c) removes the structural reading |
| D-scen-2 | Separation threshold | 20% of the pooled width (design) vs another value | 20%, revisit after first run | thresholds change only by decision, not after seeing results |
| D-res-1 | Resources as separate additive block | separate block / exogenous / inside TFP | separate block | exogenous loses the fan; inside TFP loses physical output |
| D-res-2 | Project capex outside core investment | outside / inside `s·Y_core` | outside | inside needs a financing mechanism (not modeled) |
| D-ai-1 | Overlay independent of scenario, full range | independent / low gains with pessimistic | independent | correlation needs a sourced link |
| D-ai-2 | Admissible quantity | TFP growth pp/year only (+ exact compounding) / also productivity | TFP growth | adding labor productivity would mix different quantities |
| D-prov-1 | Provincial proxy and the 18-of-24 rule | equal core GDPpc / other proxy | equal core GDPpc with the limit stated | another proxy needs a new dataset |
| D-res-3 | Number of value-added constants `v_r` | nine (without `other`) / ten (with `other`) | ten | DECIDED (human, 2026-10-04): ten. Nine would leave `other` out of `R_t = sum_r v_r q_r` and out of the `forecast_output` resource list |
| D-gdp-1 | GDP basis (constant USD base year, market vs PPP) | needs the human to choose | market-rate constant USD of the source's base year | affects every level and `v_r` units |
| D-bt-1 | Success criteria numbers (1.25, 8 of 12) | as written / stricter | as written | stricter lowers the pass probability of a calibrated model (section 5) |
| D-growth-1 | Human capital omitted in v1 | omitted / included | omitted | included adds 2 parameters and a series |
| D-pop-1 | Negative cohorts | raise error / clamp at zero and record | raise error | clamping hides inconsistent migration inputs |
| D-hdi-1 | Provincial HDI | not produced / produced | not produced | needs provincial education and health data |
| D-data-1 | Age-structured population contract | new task `population-age-contract` | create it | without it the population component cannot be calibrated |

All decisions of this table were answered by the human on 2026-10-04 with the recommendation in the fourth column; see `docs/decisions.md`.
