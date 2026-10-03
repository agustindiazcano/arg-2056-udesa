# Decisions

One entry per major design decision. Each entry: context, options, decision, consequences. All entries below are proposals of the design task and wait for human confirmation (see section 9 of `docs/model-design.md`).

## D-scen-1: Scenario definition
- Context: AGENTS.md says the three scenarios are readings of the fan, not independent curves; the `forecast_output` contract still gives each scenario its own p10/p50/p90.
- Options: (a) conditional tercile of the TFP-growth driver `g_A` within one joint distribution; (b) regimes, meaning sets of structural assumptions; (c) quantiles of the output itself.
- Decision: (a). A scenario is fixed by a driver, not by an outcome, and the unconditional fan is fixed before observation.
- Consequences: one scenario driver only; the pre-registered criteria C4 (separation) and C3 (coverage) can reject the design; regimes for resources or demography are not scenario-specific.

## D-res-1: Resource sector treatment
- Context: the contract asks for physical production by resource and province; capital and TFP already account for the base-year economy.
- Options: separate additive block; exogenous paths from `production_projections`; folded into capital and TFP.
- Decision: separate additive block `Y_total = Y_core + R`, with `Y_core` calibrated on `Y_total - R`; project capex stays outside core investment.
- Consequences: a resource value-added history is needed to calibrate `g_A` on core growth cleanly; capex financing is not modeled; the block is not backtestable until project vintages exist.

## D-ai-1: AI overlay quantity
- Context: `ai_estimates` mixes TFP, labor productivity, GDP, employment and adoption metrics.
- Options: overlay on TFP growth; on GDP level; on labor input.
- Decision: TFP growth in pp per year. Admissible records are `tfp_growth_pp_per_year` and `tfp_level_gain_pct_cumulative` through the exact compounding already validated in the data. The overlay is independent of the scenario and uses the same random numbers for `on` and `off`.
- Consequences: other metrics are context only; if no admissible record exists, `ai_overlay: on` series are not produced; results are conditional, never predictions.

## D-prov-1: Provincial proxy
- Context: no harmonized provincial GDP series exists.
- Options: equal core GDP per capita plus native resource output; night-lights or electricity proxy; provincial statistical-office GDP.
- Decision: equal core GDP per capita (stated limit) plus provincial resource value added; population shares held at the last census, with an optional damped drift kept only if it wins the pre-registered 18-of-24 test.
- Consequences: provinces without resources look average; province fans reuse national draws.

## D-bt-1: Calibration window and success criteria
- Context: AGENTS.md fixes training up to 2005 and testing 2006-2025.
- Options: single origin 2005; rolling origins with recalibration.
- Decision: single origin 2005 for the gate (12 cases, criteria C1-C5 in section 5); rolling origins only as a secondary report. Criteria are written before any run and are not changed after seeing results.
- Consequences: low statistical power (12 cases); a failure is reported as a negative result and leads to a documented change of mechanism, not to tuning.

## D-pop-1: Negative cohorts
- Context: the existing `step_population` can return negative cohorts under large negative migration (audit F9).
- Options: raise an error; clamp at zero and record.
- Decision: raise an error.
- Consequences: inconsistent migration inputs fail loudly; the hardening task adds the check and the test.

## D-growth-1: Human capital
- Context: a schooling term adds parameters and a series that no contract provides.
- Options: omit it in v1; include it.
- Decision: omit it and fold it into TFP; adopt it only after a backtest shows an error that a mechanism change explains.
- Consequences: two fewer parameters and no schooling series needed now.

## D-geo-1: National territory on the map
- Context: the province build (`docs/geo.md`) needs a human decision on how the national territory is drawn; the source layer may include the Antarctic sector and the southern islands.
- Options: continental provinces only; continental provinces plus the southern islands and the Antarctic sector in the same layer; continental provinces plus the Malvinas as a separate illustration.
- Decision (human, 2026-10-03): continental provinces and the Malvinas Islands, nothing else. The Malvinas are an imprecise hand-drawn outline, shown only as territory (no data, not selectable).
- Consequences: the registered input layer must exclude the Antarctic sector and far islands; the outline lives in `web/src/geo/malvinas.ts` and is labeled illustrative; no claim of precision is made.

