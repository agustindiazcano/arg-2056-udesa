# Task: `model-design` (design document only, no code)

Branch: `task/model-design`. One PR. Documentation only. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/afaw-light.md`, `docs/data-dictionary.md`, `docs/sources.md`, `docs/research-prompts.md`, `docs/tasks/forecast-contract.md`, the schemas in `data/schemas/`, and any file under `data/raw/research/` if it exists, first.
Run this task with the strongest model available. It decides what the other model tasks build.

## Why this task exists

The forecast to 2056 is the quantitative core of the project. If equations, parameters and scenario definitions are chosen by a coding agent while it writes code, the result is a model whose numbers cannot be defended. This task produces the design **before** any model code: what mechanisms are modeled, with which equations, which data, which parameters and where each one comes from, how uncertainty and scenarios are defined, how the model is calibrated and tested, and how the work is split into small implementation tasks.

## Principles the design must obey (binding)

1. **Mechanism first, mathematics second.** Each component starts from a real economic or demographic mechanism that can be observed (people are born and die, capital is accumulated from investment and wears out, projects start production on a schedule). The equations formalize that mechanism. A statistical patch without a mechanism is not allowed.
2. **Parsimony.** Of two designs that explain the same thing, the one with fewer parameters wins. The document must count parameters per component and justify each one that is kept.
3. **Falsifiability.** For every component, state what observation would show it wrong. A model that can explain both an outcome and its opposite is rejected. The tests and thresholds that decide success are fixed **in this document, before implementation**.
4. **No ad hoc corrections.** If the backtest shows an error, the fix is a change of mechanism, documented as a decision, never an extra fudge factor.
5. **Honest sourcing.** Every empirical claim and every parameter value has a `source_id` from `docs/sources.md` or `data/raw/research/*/sources.csv`, or is marked `needs_source`, or is declared an explicit assumption (`assumption: true`) with its range and its reason. Never write a number from memory as if it were sourced. Never convert between different quantities (for example TFP to GDP) except by exact arithmetic that the document spells out.

## Out of scope (do NOT do)

- No code, no schemas changes, no data files, no mock data, no UI.
- No web research beyond what is needed to verify a formula or a definition; data collection belongs to the research agents. If the design needs a number you cannot source, list it in `docs/assumptions.md` as `needs_source`.
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not claim CI is green.

## Deliverables

### 1. `docs/model-design.md` (at most about 6,000 words; use tables and equations rather than prose)

Sections, in this order:

**1. Claims and scope.** What the model outputs (indicators, geographies, years, scenarios, percentiles) exactly as the `forecast_output` contract defines them. What it explicitly does not model (inflation, exchange rate, fiscal, balance-of-payments crises, political regime) and how the fan is expected to reflect that omission. The two or three claims a reader can check against data.

**2. Components.** One subsection each for:
- Population (cohort-component: fertility, mortality, migration; baselines and variants).
- Growth accounting (output, capital accumulation, labor input, human capital, TFP).
- Resources (project pipeline: mining, energy, agro): how projects enter production by stage, ramp, probability of reaching production, and how the resource sector feeds exports and GDP **without double counting** with capital and TFP. State explicitly whether the resource sector is a separate block or an exogenous contribution, and why.
- Provincial allocation (how national results are downscaled to the 24 provinces, given that no harmonized provincial GDP series exists; the proxy used and its limits).
- AI overlay (how a sourced range enters the model, which quantity it modifies, and which estimates from `ai_estimates` are admissible because they measure that same quantity; the rest are context, not inputs).
- Uncertainty and scenarios (see section 4).

For every component give: the mechanism in plain words; variables with units; equations; inputs (dataset names as in `docs/data-dictionary.md`); parameters (table: name, symbol, unit, value or range, `source_id` or `assumption`, role); calibration method; at least two alternative designs considered and the reason each was rejected; known failure modes; what observation would falsify it.

**3. Parameter budget.** One table: parameters per component, total, and which ones are fixed from data, which are calibrated, which are scenario drivers, which are random in the Monte Carlo.

**4. Scenarios and uncertainty.** Define unambiguously:
- What a scenario (pessimistic, expected, optimistic) is: a set of structural assumptions (regimes) or a quantile of one distribution. Choose one, justify it, and show that the choice does not let the model explain both a result and its contradiction.
- Which quantities are random, their distributions and how each distribution is justified (past forecast errors from `forecast_vintages`, base rates, estimate spreads); whether shocks are correlated; how many draws; the seed policy.
- How p10/p50/p90 are produced and what they mean to a reader.
- How the AI overlay interacts with scenarios (on/off, range, and which scenario uses which part of the range).

**5. Calibration and backtest protocol (pre-registered).** Training window up to 2005; test window 2006-2025. Baselines that must be beaten or reported as not beaten: persistence, linear trend, and a simple time-series model on log GDP per capita; for population, the unadjusted external projection. Metrics: error at horizons 5, 10 and 20 years, bias, and coverage of the p10-p90 interval. State the success criteria **as relations to the baselines** (for example "lower error than the best baseline at horizon 10 in at least X of the Y cases"), written now, before any run. State what is reported if the criteria fail (a negative result is documented, not tuned away). Identify the data series needed for 1990-2025 and which ones are missing today.

**6. Sensitivity analysis plan.** Which method (one-at-a-time elasticities and a variance-based method if affordable), which outputs, and what the final tornado or ranking must show. Which parameters the sandbox exposes to the user and why those.

**7. Interfaces.** Input files and schemas, output file (`forecast_output`), the parameter file format (`model/params/params.json`: name, symbol, value, unit, distribution, low, high, `source_id` or `assumption: true`, justification, component) with its schema described, RNG and seeding, reproducibility rules, what the reduced TypeScript port includes and excludes (for the sandbox) and how parity with Python is tested (hand-computed minimal cases per mechanism plus property tests such as cohort conservation, monotonic responses and identities; golden vectors generated by the code are allowed only in addition to those).

**8. Implementation plan.** Replace the current coarse tasks by an ordered list where each task is one PR for a coding agent, with: slug, goal, inputs it needs, what it must not do, tests that define done, and a flag `can_start_now` (works with mock or declared assumptions) or `blocked_by` (verified research data, another task). Suggested split to evaluate and adjust: `model-params` (parameter file and its schema), `model-population`, `model-growth-core`, `model-resources`, `model-ai-overlay`, `model-montecarlo`, `backtest-baselines`, `backtest-run`, `sensitivity`, `model-ts-port`, `model-provinces`. Each task must be small enough for a low-cost agent.

**9. Open decisions for the human.** A list, each with the options, your recommendation, and what changes if the human chooses otherwise.

### 2. `docs/assumptions.md`

A register (table) of every assumption and every unsourced number: `id`, statement, component, why it is needed, range, sensitivity (high/medium/low, from reasoning, to be confirmed), status (`needs_source` | `assumption` | `sourced`), `source_id` or null, who decides (`human` | `design`).

### 3. `docs/decisions.md`

Append one entry per major design decision (scenario definition, resource sector treatment, AI overlay quantity, provincial proxy, calibration window), each with context, options, decision, consequences. If the file does not exist, create it with a short header.

### 4. `PENDING.md`

Replace the model-related queue lines by the task list of section 8, keeping the other entries. Overwrite `LASTCONTEXT.md`.

## Acceptance checklist

- [ ] Every parameter in the document is sourced, marked `needs_source`, or marked `assumption`; none is silently from memory.
- [ ] Parameter budget table present and consistent with the component sections.
- [ ] Success criteria of the backtest are written as relations to baselines, before implementation.
- [ ] At least two rejected alternatives per component, with reasons based on parsimony or the data available.
- [ ] No component can explain both an outcome and its opposite; the document says why for the scenario definition.
- [ ] Double counting between resources, capital and TFP is addressed explicitly.
- [ ] Implementation tasks are small, ordered, and each says whether it can start now.
- [ ] `docs/assumptions.md`, `docs/decisions.md`, `PENDING.md`, `LASTCONTEXT.md` updated.
- [ ] PR description: what changed, what was verified (formulas checked, definitions checked), what the human must verify (every open decision, every `assumption`, the pre-registered success criteria, the scenario definition).
