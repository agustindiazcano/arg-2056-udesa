# Task: `scene-sandbox`

Branch: `task/scene-sandbox`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/design.md` (binding for every color, spacing and chart convention), `docs/tasks/forecast-contract.md`, `docs/tasks/scene-forecast.md` and the code from `shell`, `scene-resources` and `scene-forecast` (store, `useKeyboard`, selectors, builders, `EChart`, `DataTable`, `useDataset`, `formatValue`, `tokens.ts`) first.
Prerequisites: `shell` and `scene-forecast` are merged into `main`.

## Goal

A sandbox where the visitor changes a few growth assumptions with sliders and sees, immediately, what they imply by 2056, how that compares with the range of the forecasting model, and what the rule of 70 says. The sandbox is **illustrative arithmetic on the visitor's assumptions, not the forecasting model**. It does not simulate economics; it compounds the rates the visitor chooses, so its results are exact consequences of those inputs. All logic lives in pure, tested functions.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No port of the forecasting model, no simulation, no randomness, no Monte Carlo, no model code.
- No new dependency (`echarts` is already installed). No animation beyond what `design.md` section 5 allows. No light mode, no sub-step navigation.
- Do not change the `KeyAction` union or `KEY_MAP`, and do not add store fields or actions: the sandbox state is local to the scene. Use only existing store actions and fields.
- Do not touch schemas, the mock generator or model code. Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

If the mock `forecast_output` lacks what this brief needs (GDP per capita and population series for `AR` in the three scenarios, with and without the AI overlay), stop and tell me exactly what is missing. Do not invent data and do not extend the mock.

## 1. Files

```
web/src/scenes/sandbox/arithmetic.ts       exact arithmetic (compounding, doubling, rule of 70, required rate)
web/src/scenes/sandbox/selectors.ts        paths, envelope, presets, comparison with the model range
web/src/scenes/sandbox/state.ts            local reducer for the slider values (clamping, reset, presets)
web/src/scenes/sandbox/config.ts           SLIDER_BOUNDS and labels
web/src/charts/builders/sandboxPath.ts     buildSandboxPath(view, opts)
web/src/charts/builders/doublingCurve.ts   buildDoublingCurve(opts)
web/src/scenes/sandbox/index.tsx           the scene (replaces the placeholder)
web/src/scenes/sandbox/Sliders.tsx         accessible slider + number input rows
web/src/scenes/sandbox/StatTiles.tsx       result tiles
```

Reuse `EChart`, `DataTable`, `useDataset`, `formatValue` and the table-view toggle pattern.

## 2. Arithmetic (`arithmetic.ts`, pure, exact)

All rates are percentages per year (7 means 7%).
- `compound(base, ratePct, years)` = `base * (1 + ratePct/100) ** years`.
- `doublingYears(ratePct)` = `ln 2 / ln(1 + ratePct/100)`; `null` when `ratePct <= 0`.
- `rule70(ratePct)` = `70 / ratePct`; `null` when `ratePct <= 0`.
- `rule70ErrorPct(ratePct)` = `(rule70 - doublingYears) / doublingYears * 100`; `null` when either is `null`.
- `requiredRatePct(multiple, years)` = `(multiple ** (1/years) - 1) * 100`; `null` when `multiple <= 0` or `years <= 0`.
- `combinedGrowthPct(gpcPct, popPct)` = `((1 + gpcPct/100) * (1 + popPct/100) - 1) * 100` (GDP growth from per-capita growth and population growth, an exact identity).
- `effectiveGpcPct(gpcPct, aiPp)` = `gpcPct + aiPp`: the AI uplift is **added in percentage points** to the per-capita growth rate; write this convention in a comment and in the UI help text.

## 3. Selectors (`selectors.ts`, pure)

- `basePoint(output, { scenario })`: the first forecast year and the `p50` values of GDP per capita and population for `AR` at that year (the starting point of every path), or `null` with a reason string if missing.
- `userPath({ base, years, gpcPct, popPct, aiPp })`: arrays by year of GDP per capita, population and GDP (per capita times population), compounded from `base` with `effectiveGpcPct` and `popPct`; year offsets from the first year.
- `modelEnvelope(output, { aiOverlay })`: for each year, `lower = min` of the three scenarios' `p10` and `upper = max` of their `p90` for GDP per capita, plus the `expected` `p50` line. Arithmetic min and max only. A year where any needed point is missing yields `null` bounds (never 0), and the year is listed in `missing`.
- `positionVsRange(value, lower, upper)`: `'below' | 'inside' | 'above' | null` (`null` if any argument is `null`).
- `scenarioPreset(output, { scenario, aiOverlay })`: slider values that reproduce the model's central path for that scenario: `gpcPct` = compound growth of GDP per capita `p50` between the first and last forecast year, `popPct` the same for population, `aiPp` = 0. Uses the `cagr` selector from `scene-forecast`.
- `summaryText(...)`: the accessible takeaway string built only from the numbers in the view (for example "At 2.5% per-capita growth, GDP per capita in 2056 is 2.1 times its 2026 level and sits above the model range").

## 4. Local state (`state.ts`, `config.ts`)

Reducer with actions `set` (field, value), `applyPreset`, `reset`. Fields: `gpcPct`, `popPct`, `aiPp`. Values are clamped to `SLIDER_BOUNDS` and rounded to the field step (0.1). Bounds and steps live in `config.ts` as constants with a comment saying they are interface limits chosen for readability and are **assumptions, not model claims**: suggested `gpcPct` from -2 to 8, `popPct` from -1 to 3, `aiPp` from 0 to 3. A non-finite value is ignored (state unchanged). The initial state is the `expected` preset when the forecast is loaded, otherwise zeros.

## 5. Builders (pure, no DOM)

Both return `{ option, excluded, summary }` like the other scenes; colors only from `tokens.ts`.

- **`buildSandboxPath(view, { year })`**: GDP per capita over the years. The visitor path as a thick `ink` line; the model range as a band between `lower` and `upper` (two stacked line series, the lower one transparent, the upper one with `BAND_ALPHA`) labeled directly "model range (all scenarios, p10 to p90)"; the model central path as a dashed `muted` line labeled "model, expected". Years with `null` bounds are gaps (`connectNulls: false`). Direct labels at the end of lines, no legend. A vertical marker at the playhead `year`. Tooltip with `formatValue`, showing the visitor value, the range and the position ("above", "inside", "below"). y axis title is the unit.
- **`buildDoublingCurve({ ratePct })`**: doubling time against growth rate from 0.5% to 12% in 0.5% steps, two lines: exact (`ink`) and rule of 70 (`muted`, dashed), with a marker at `ratePct` when it is inside the range, and direct labels. The difference between the lines is the visual point of the chart.

## 6. Scene layout

- Headline, one-line subtitle (placeholders in English) and the fixed caveat line under the headline: "Illustrative arithmetic on your assumptions. It is not the forecasting model."
- Left column, controls (`Sliders.tsx`): three rows (per-capita growth, population growth, AI uplift), each with a label, a slider (`input type="range"`), a number input with the same value, the unit, and a help text; buttons "Match pessimistic", "Match expected", "Match optimistic" (the presets), and "Reset". The AI uplift row is disabled with an explanatory text when the store `aiOverlay` is false; turning the overlay on is done with the existing toggle of the forecast scene, so provide a button here bound to the same store field with `aria-pressed`.
- Center: the visitor path chart. Right: the doubling curve for the effective per-capita rate and a "rule of 7" panel computed with the same functions: "7% for 10 years multiplies by X (exact)" and "rule of 70 says Y years, exact is Z years".
- Tiles: GDP per capita at the last year as a multiple of the first year; population at the last year; GDP at the last year (multiple); doubling time (exact) and the rule-of-70 value with its error; the position against the model range at the last year; the required per-capita rate to reach a visitor-chosen multiple (a small control "Target multiple of today's GDP per capita by <last year>" with a number input, default 2) from `requiredRatePct`. A tile whose number is `null` shows "no data" (or "never" for doubling when the rate is not positive), never a number.
- Source line: `source`, `model_version`, `generated_at` of the forecast file for the reference range; the MOCK badge from `shell` stays visible.
- Table view toggle (`aria-pressed`) on the path chart (year, visitor value, lower, upper, model expected, position) and on the doubling curve. Containers have `role="img"` and the builder `summary` as `aria-label`. Loading and error states are visible text.

## 7. Keyboard isolation (critical)

The slider and number inputs use the arrow keys. The global keyboard handler must not react to key events whose target is an `input`, `select`, `textarea` or a `contenteditable` element. Check `useKeyboard` from `shell`:
- If it already ignores those targets, add a test in this PR that proves it for `input type="range"` and `input type="number"` (ArrowLeft, ArrowRight and the digits `1`, `2`, `3` do not dispatch any store action while a slider has focus).
- If it does not, stop and tell me; do not change the shell in this PR.

## 8. Tests (write first)

Pure functions, hand-built fixtures (no mock files):
- `arithmetic`: `compound(100, 7, 10)` to 6 decimals (196.715136); `doublingYears(7)` (10.244768 to 6 decimals), `rule70(7)` equals 10, `rule70ErrorPct(7)`, `rule70ErrorPct` at 1% and 10% (hand-computed), `null` for rates `<= 0`; `requiredRatePct(2, 10)` (7.177346 to 6 decimals) and `null` cases; `combinedGrowthPct(2, 1)` equals 3.02; `effectiveGpcPct` is a plain sum.
- `userPath`: first point equals the base; each following point equals the compounded value; GDP equals per capita times population at every year.
- `modelEnvelope`: min of `p10` and max of `p90` across scenarios (exact on a fixture where the extremes come from different scenarios), missing point gives `null` bounds and an entry in `missing`, reference line equals the expected `p50`; with `aiOverlay` the `ai_overlay: on` series are used.
- `positionVsRange`: below, inside, above, boundary equality counts as inside, `null` arguments.
- `scenarioPreset`: exact growth rates for a fixture and equality with the `cagr` selector.
- Reducer: clamping at both bounds, step rounding, non-finite ignored, `applyPreset`, `reset`.
- `buildSandboxPath`: visitor line `ink` and thick; band between lower and upper; reference dashed `muted`; gaps for `null` bounds with `connectNulls: false`; playhead marker; no legend. `buildDoublingCurve`: two series with the exact and approximate values at hand-computed points (for example at 7% and 10%), marker present only inside the range.
- Token drift test still passes.

Component tests (jsdom, `vi.mock('echarts')` as in the other scenes):
- Loading then charts and tiles; error state when `fetch` fails; a visible message when the base point cannot be built.
- Moving a slider (change event) updates the option and the tiles with exact expected numbers; the number input and slider stay in sync; out-of-range typed values clamp.
- Preset buttons set the three fields to the selector results; Reset restores the initial state.
- The AI row is disabled when `aiOverlay` is false and enabled when true; the button bound to the store toggles it.
- Keyboard isolation as in section 7.
- Table toggles swap chart for table and `null` cells show "no data".
- `EChart` disposed on unmount.

## 9. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes.
- [ ] No new dependency; no color literal outside `tokens.ts` and `tokens.css`; no `as unknown as`; `KeyAction`, `KEY_MAP` and the store shape unchanged.
- [ ] `null` never rendered as 0 (tested for the chart, the tiles and the tables).
- [ ] The caveat line is visible and the sandbox never uses the word "forecast" for the visitor's own path.
- [ ] `npm run dev` shows the scene with mock data and the MOCK badge; sliders, presets, reset, the AI row and the table views work; arrow keys on a focused slider change the slider and not the year.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (add "plug the sandbox into the reduced TS model" as an optional later task).
- [ ] PR description: what changed, what was verified, what the human must verify (look and feel against `docs/design.md`; the slider bounds; the additive convention for the AI uplift; the wording of the caveat and of the position labels; the rule-of-7 panel wording; whether the preset values look right against the mock).
