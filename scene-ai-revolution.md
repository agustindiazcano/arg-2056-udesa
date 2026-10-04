# Task: `scene-ai-revolution`

Branch: `task/scene-ai-revolution`. One PR. Read `AGENTS.md` (section 1 describes this scene), `LASTCONTEXT.md`, `PENDING.md`, `design.md` (binding for every color, spacing and chart convention), `docs/model-design.md` section 2.5 (the AI overlay: what quantity it modifies, which estimates are admissible, why it is conditional), `docs/data-dictionary.md` (the `ai_estimates` section), `data/schemas/ai_estimates.schema.json`, `web/src/types/research.ts` (`AiOutcomeMetric`, `AiEstimate`, `selectAiEstimates`, `spreadByScenario`), `scene-forecast.md`, `scene-sandbox.md`, `storytelling-substeps.md` and the code they produced (`web/src/scenes/forecast/`, `web/src/charts/builders/fan.ts`, `EChart`, `DataTable`, `useDataset`, `formatValue`, `tokens.ts`, `web/src/story/`, `web/src/references/`, the data registry `web/src/data/registry.ts`) first.
Prerequisites: `scene-forecast`, `scene-sandbox`, `storytelling-substeps`, `references-page` and `performance-a11y` are merged into `main` (they are). `model-ai-overlay` is **not** required: this scene reads data and contracts, not the Python model.

## Goal

The scene where a visitor sees what AI could change in Argentina's long-run growth, honestly: as **one explicit, sourced range with its citations**, never as a point prediction, next to what the forecast looks like with and without that range. It answers three questions: how big is the sourced effect (a range, per source), what would it do to GDP per capita at 10 and 20 years, and what the evidence does **not** say (other quantities, other countries, effects that were measured differently).

Strict TDD for all logic (selectors, bounds, formatting). Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- **No new estimate and no invented number.** Every figure on screen comes from `ai_estimates.json` or `forecast_output.json` and is shown with its source. No simulation, no randomness, no model code, no port of the model.
- **No mixing of quantities.** Only records with `outcome_metric == tfp_growth_pp_per_year`, and `tfp_level_gain_pct_cumulative` through its stored `derived_annualized_pp`, are used for the range (the rule of `docs/model-design.md` section 2.5; read the exact enum values from the code). Records of any other metric (labor productivity, GDP, employment exposure, adoption) appear **only** in a separate "Context, not part of the range" list, are never converted, averaged or plotted on the range's axis.
- No new dependency (`echarts` is installed). No new scene, no change to the `Scene` union, `KeyAction`, `KEY_MAP` or the store shape. No light mode. No change to the forecast scene (its AI overlay toggle stays as it is).
- Do not edit `design.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker (`as unknown as`, `@ts-ignore`, `eslint-disable`).
- No color literal outside `web/src/styles/tokens.ts` and `tokens.css`. `null` must never be rendered as 0.

## 1. Data wiring

`ai_estimates.json` is produced by the research contracts but is **not** in `data/mock/` today (the mock generator writes it only when asked, and the tests generate it into a temporary directory). This task wires it:
- If `data/mock/ai_estimates.json` does not exist, generate it with the existing `scripts/gen_mock.py` (into a temporary directory first) and commit **only that file**, byte-identical to the generator's output. Do not edit the generator. Check that the mock gate (`scripts/check_no_mock.py`) flags it (`source: MOCK`), that `scripts/validate_data.py` passes and that the data budget (`scripts/check_data_budget.py`) still passes.
- Add `ai_estimates.json` to `web/src/data/registry.ts` with the typed parser of `types/research.ts` (`parseAiEstimates`) and `requiredBy: ['ai-revolution']`; update the data smoke test (`web/tests/unit/data-smoke.test.ts`) accordingly. `sync-data` must copy it (check `web/scripts/sync-data.mjs`).
- The forecast series (`forecast_output.json`) are already registered. If the mock lacks the series this scene needs (GDP per capita for `AR`, three scenarios, `ai_overlay` on and off), stop and tell me exactly what is missing; do not extend the mock.

## 2. What the scene shows

All text in the app's language constant; copy the wording rules from `design.md`. One idea per scene: the sourced range; the supporting elements are the effect on the forecast and the context list.

1. **Headline and caveat**: a headline (an `h1`, like the other scenes) and a visible caveat, on screen at all times: the effect is *conditional* ("if the sourced range holds"), is **not a prediction**, and applies to TFP growth only. Wording is placeholder-flagged like the story steps if the human has not written the real text; the release gate must still catch it (see 6).
2. **The range**: a horizontal range chart (one row per admissible record: its `value_low` to `value_high`, or a point when only `value` exists, in percentage points per year) with the overall `low` and `high` marked (the bounds of `spreadByScenario`), the record ids and the publisher on the row label, units on the axis title. Chart type from `design.md` (bars and ranges, no pie). Every row cites its source: the `source_id` is a link to `references.html#<source_id>` **only if that id is in the references registry**, otherwise plain text (load the registry the way `StoryCaption` does; read how it passes `registryIds`).
3. **Effect on GDP per capita**: for `AR` in the `expected` scenario (the scenario selector of the store applies, as in the forecast scene), two numbers at 10 and 20 years after the horizon's start year: the p50 without and with the overlay and their difference in percent, each with its p10 to p90, and the fan chart reusing `buildFan` with the overlay on (the "Without AI" dashed line of `design.md` section 4). If the series with `ai_overlay: on` is absent, say so ("the overlay is not available because no admissible estimate exists") and show nothing in its place.
4. **Context, not part of the range**: the list of the other records, grouped by `outcome_metric`, each with its value, geography, publisher and source link, under a heading that says why they are not combined with the range.
5. **Table view** for the range chart and for the effect numbers (the `aria-pressed` toggle of the other scenes, same component), a "no data" state per block, and the shared `MockBadge` behavior while the data is mock.
6. **Story steps**: the three placeholder steps of this scene already exist in `web/src/content/steps/index.ts`; keep them working (they drive only the shared store fields). Do not write real story text.

## 3. Files

```
web/src/scenes/ai-revolution/index.tsx        the scene (replaces the placeholder; keep the default export)
web/src/scenes/ai-revolution/selectors.ts     admissible records, bounds with provenance, context groups, effect at +10 and +20 years
web/src/charts/builders/aiRange.ts            buildAiRange(view, opts)
web/src/scenes/ai-revolution/StatTiles.tsx    the effect numbers (follow the other scenes' tiles)
web/tests/unit/aiSelectors.test.ts  aiRangeBuilder.test.ts  aiScene.test.tsx
```

## 4. Selectors (pure, tested)

- `admissibleRecords(estimates)` and `contextRecords(estimates)`: a partition by the rule above with a reason per excluded record; their counts add up to the input.
- `rangeBounds(admissible)`: `{ low, high, lowIds, highIds }`; `null` when there is no admissible record. Use `spreadByScenario` where it fits, and never catch its "mixed metric" error to hide it.
- `effectAt(view, years)`: the p10, p50 and p90 with and without the overlay at `start + years`, the absolute and percent difference of the p50; `null` entries stay `null`.
- A summary string for each chart (the `aria-label`), built from the numbers: "AI could add between X and Y percentage points per year to TFP growth, according to N sources".

## 5. Accessibility and performance (the rules `performance-a11y` set)

Chart containers carry `role="img"` and an `aria-label` on the chart element itself (not on a wrapper that also holds a table). The scene is loaded with `React.lazy` through the registry; the caveat and the "Loading scene" fallback are visible text. Contrast tests and axe e2e must pass without new exceptions. Interactive elements inside the scene are covered by the `pointer-events` rule in `tokens.css`. Any live region is `aria-live="polite"`.

## 6. Tests (write first)

- Selectors: the partition of a fixture with one record per `outcome_metric`; the bounds with ties, a point-value record and a single record; `null` when none; the effect numbers with a hand-computed fixture (spell the arithmetic); `null` stays `null`.
- Builder: exact option structure (one row per record, the markers for the overall bounds, units, no color literals, the summary text).
- Scene (jsdom, charts mocked like the other scene tests): the caveat is present; the range chart has its label; sources link only when in the registry; the context list is separate and absent from the chart data; the overlay-unavailable state; the table toggle works; the store scenario changes the numbers; no `NaN` and no "undefined" in the text.
- E2E (`web/e2e/scenes.spec.ts` is updated, the scene no longer has a placeholder text): the scene shows its heading and a chart with an accessible name; axe passes; the CSP spec still passes.
- The release gate behaviors that already exist keep working (`scripts/check_no_mock.py`).

## 7. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes; e2e run or "e2e not run locally". CI result read or "pushed, CI not checked".
- [ ] No estimate or number invented; only admissible quantities in the range; the other metrics only in the context list.
- [ ] `ai_estimates.json` wired (mock, registry, smoke test); data budget and mock gate still pass.
- [ ] Caveat visible; no color literal outside the token files; no `null` as 0; no new dependency.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (`scene-ai-revolution` done; visual debt listed). Initial bundle budget still passes.
- [ ] PR description: what changed, what was verified, what the human must verify (the wording of the caveat, the admissibility rule against the real records once they exist, the look against `design.md`).
