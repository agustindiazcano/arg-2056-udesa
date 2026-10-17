# Task: `model-ai-overlay`

Branch: `task/model-ai-overlay`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/model-design.md` (section 2.5 is binding; decisions `D-ai-1` and `D-ai-2`), `docs/assumptions.md`, `docs/decisions.md`, `docs/params.md`, `model/params/params.json`, `docs/data-dictionary.md` (the `ai_estimates` section), `data/schemas/ai_estimates.schema.json`, `web/src/types/research.ts` (`AiOutcomeMetric`, `spreadByScenario`, `selectAiEstimates`) and the generator `gen_ai_estimates` in `scripts/gen_mock.py` first.
Prerequisites: `model-params` is merged into `main`. `model-growth-core` should be merged (the overlay enters its TFP step); if it is not, say so in the PR.

## Goal

The AI overlay of the forecast: a sourced range of how much AI may add to TFP growth, an adoption lag, and the rule that decides which estimates may enter at all. The overlay changes **one quantity only**, TFP growth in percentage points per year (`g_A,t = g_A,base,t + lambda_t * delta_AI`). Records that measure anything else are context, never inputs. The result is conditional ("if the sourced range holds"), never a prediction, and when no admissible estimate exists the overlay is not produced.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No conversion between different quantities, no averaging across metrics, no weighting of sources. Admissible means exactly what section 2.5 says; nothing else is converted.
- No overlay on GDP level and none on labor input (rejected in the design). No scenario-dependent overlay (`D-ai-1`: independent of the scenario).
- No random draws here (`delta_AI` is drawn by `model-montecarlo` between the bounds this task computes). No UI. No real data. No new dependency (`numpy` and the standard library).
- Do not edit `docs/model-design.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Files

```
model/src/argmodel/ai_multiplier/admissible.py   which records may enter, and why the others do not
model/src/argmodel/ai_multiplier/overlay.py      bounds of delta_AI, lambda_t, the TFP term
model/tests/test_ai_overlay.py
docs/ai-overlay.md                               the rule, the range, what is excluded and why, the "not backtestable" statement
```

## 2. Behavior

- **Admissible records** (read the field names and enum values from the schema and from `research.ts`; do not recall them): records with `outcome_metric == tfp_growth_pp_per_year`, with their `value_low` and `value_high` (or `value` when there is no range); and records with `outcome_metric == tfp_level_gain_pct_cumulative` **only** through the annualized value already carried in the record (`derived_annualized_pp`, formula `((1 + value/100)^(1/n) - 1) * 100` with `n = horizon_end_year - horizon_start_year`). Do not recompute it differently; do check that the stored value equals the formula within `1e-9` and reject the record (and say so) when it does not.
- **Inadmissible**: `labor_productivity_*`, `gdp_*`, `employment_*`, `adoption_rate_pct` and anything else. `partition(records)` returns `(admissible, context)` with one reason string per excluded record; nothing is dropped silently.
- **Range**: `delta_bounds(admissible)` returns `(low, high)` = the lowest `value_low` and the highest `value_high` among admissible records, plus the ids of the records at each end (provenance). A record with a point value only uses it for both ends. If there is no admissible record the function returns `None` and the overlay is **not produced** (the Monte Carlo task omits the `ai_overlay: on` series; it does not fill them).
- **Lag**: `lambda_t = min(1, max(0, (t - t0) / lambda_years))` (linear from 0 to 1), `lambda_years` from `ai.lag` (a parameter, 5 to 15).
- **The term**: `tfp_term(delta_ai, lambda_path)` = `lambda_t * delta_ai` per year, as an array to pass to `tfp_step(..., ai_term=...)` of `model-growth-core`. Units are percentage points per year in the data and fractions in `tfp_step`: convert once, at one named function (`pp_to_fraction`), tested.
- **On and off use the same random numbers** (design 2.5): a function `paired_terms(delta_draws, lambda_path)` returns the zero term for `off` and the term for `on`; a test shows that growth paths for on and off differ only by the term (same `g_A_base`, same everything else).
- **Provenance**: every output of `delta_bounds` can be traced to record ids and `source_id`s so the UI can cite them (`scene-ai-revolution`).

## 3. Tests (write first)

- Admissibility: one fixture record per `outcome_metric` value of the schema; only the two allowed metrics pass; each excluded record has its reason; the counts add up.
- The annualized formula: hand-computed (for example a 10% cumulative gain over 10 years is `((1.1)^(1/10) - 1) * 100 = 0.9569...` pp: write the number to 6 digits), accepted when the stored value matches, rejected with the exact message when it does not.
- Bounds: lowest `value_low` and highest `value_high` with ties; point-value records; a single admissible record; none gives `None`; the ids at the ends.
- Lag: `lambda` at `t0`, halfway and after `lambda_years` (hand-computed); `lambda_years <= 0` raises.
- `pp_to_fraction` and the term: exact values.
- On and off differ only by the term (a growth-core projection with and without it).
- With the **mock** `ai_estimates` the pipeline runs end to end and returns the bounds the test computes by hand from the mock file (the test reads the mock and spells out the arithmetic in comments; the mock is generated, so generate it into a temporary directory with `scripts/gen_mock.py`, never into `data/`).
- Determinism; no literal parameter in the code.

## 4. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes. CI result read or "pushed, CI not checked".
- [ ] Only the two admissible metrics enter; nothing converted except the validated annualization; no silent drops.
- [ ] `docs/ai-overlay.md` states that the overlay is not backtestable and conditional. `LASTCONTEXT.md` overwritten; `PENDING.md` updated (`scene-ai-revolution` may now show the range).
- [ ] PR description: what changed, what was verified, what the human must verify (the admissibility rule on real records once they exist; `ai.lag` range; that the bounds cite their records).
