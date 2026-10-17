# Task: `model-provinces`

Branch: `task/model-provinces`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/model-design.md` (section 2.4 is binding; decisions `D-prov-1` and `D-hdi-1`; section 1 for the coverage rule), `docs/decisions.md`, `docs/params.md` (`prov.kappa`), `docs/montecarlo.md`, `model/src/argmodel/scenarios/`, `model/src/argmodel/resources/`, `data/schemas/forecast_output.schema.json`, `data/schemas/population.schema.json`, `scripts/forecast_checks.py`, `web/src/types/province.ts` and `docs/data-dictionary.md` first.
Prerequisite: `model-montecarlo` is merged into `main`. The census shares come from the `population` dataset (`geo = AR-X`): the real ones arrive with `data-economy-population`; the task works on the mock.

## Goal

The province series of the forecast: population, GDP, GDP per capita and resource production for each of the 24 provinces, **consistent draw by draw with the national result**. There is no harmonized provincial GDP series, so the method is a stated proxy and its limits are part of the deliverable.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No provincial HDI (`D-hdi-1`). No GDP proxy other than the one in the design (no night lights, no electricity, no provincial statistics office GDP: they need datasets that do not exist). No new random draws: the provinces **reuse the national draws**.
- No change to the national model or the Monte Carlo. No UI (the forecast map already reads province series). No new dependency.
- Do not edit `docs/model-design.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Files

```
model/src/argmodel/scenarios/provinces.py    shares, population, GDP and production by province per draw
model/src/argmodel/scenarios/provinces_cli.py or an option of the Monte Carlo CLI that adds the province series
model/tests/test_provinces.py
docs/provinces-model.md                      the method, the proxy limits, the pre-registered drift test
```

## 2. Method (section 2.4, copied, not recalled)

- **Population**: `P_p,t = P_AR,t * share_p,t`; `share_p` held at the last census shares of the `population` dataset. The **drift variant** `log share_p,t = log share_p,t0 + kappa_prov * trend_p * (t - t0)` (with `prov.kappa` in [0, 1]; 0 means constant shares) is implemented, but it is **kept only if it passes the pre-registered test**: its 2005-origin population-share error at horizon 20 is below the constant-share error in at least 18 of the 24 provinces (decision `D-prov-1`). The test is written and tested here; it runs on real data in `backtest-run`'s time frame, and until then the constant shares are the default and the drift is reported as "not validated".
- **Shares sum to 1** at every year and draw (the drift variant renormalizes; the renormalization is stated and tested).
- **Resource production**: native by province (each project carries `geo`); the output of `model-resources` by `(resource, geo)` is used as it is.
- **GDP**: `Y_p,t = Y_core,t * share_p,t * phi_p + R_p,t` with `phi_p = 1` (equal core GDP per person across provinces, a stated limit) and `R_p,t = sum_r v_r * q_{r,p,t}`.
- **GDP per capita**: `Y_p,t / P_p,t`.
- **Draw by draw consistency**: for every draw, the sum of the provinces equals the national value (population, core GDP plus resources, production by resource), to a tolerance of `1e-9` relative. A province's p10, p50 and p90 are the quantiles of **its own** draws.
- **Output**: series with `geo` = `AR-A` to `AR-Z` as in the schema for `gdp_constant_usd`, `gdp_per_capita_usd`, `population` and `resource_production`; no province `hdi`.

## 3. Tests (write first)

- Shares sum to 1; constant shares reproduce the census shares; the drift variant with `kappa_prov = 0` equals the constant shares exactly.
- Hand-computed example with three provinces: shares, population, core GDP, resource value added and GDP per capita, with every number written in a comment.
- **Draw-by-draw consistency** on the mock: provinces sum to the national value for every draw and year (population, GDP, each resource).
- A province without resources gets the national core average per person (exact arithmetic) and no resource term.
- The pre-registered drift test: on constructed series where the drift variant is clearly better in 20 of 24 provinces it is kept; where it wins in 17 it is not (the exact threshold of 18); on a tie it is not kept.
- The series validate against `forecast_output.schema.json` and pass `check_forecast`; no province `hdi` exists.
- Determinism (same bytes for the same seed); no new random generator is created (a test asserts the province code uses only the draws it is given).

## 4. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] Provinces reuse the national draws and sum to the national value in every draw; no other proxy; no province HDI.
- [ ] `docs/provinces-model.md` states the proxy limits (equal core GDP per capita, no internal migration beyond the drift) and that the drift is "not validated" until the real test runs. `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (the proxy, the 18-of-24 rule, what the choropleth will and will not show).
