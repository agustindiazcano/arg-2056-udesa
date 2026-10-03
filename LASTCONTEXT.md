# Last Context

## State
- Task `scene-sandbox` on branch `task/scene-sandbox`: the sandbox scene with mock data. It is illustrative arithmetic on the visitor's assumptions, not the forecasting model.
- New: `web/src/scenes/sandbox/{arithmetic.ts,selectors.ts,state.ts,config.ts,Sliders.tsx,StatTiles.tsx,index.tsx}`, `web/src/charts/builders/{sandboxPath.ts,doublingCurve.ts}` (the latter exports `DOUBLING_RATES` for the table view).
- Scene: three sliders with number inputs (GDP per capita growth, population growth, AI uplift), presets "Match pessimistic / expected / optimistic" (the compound growth of the model p50 between the first and last forecast year), Reset, the AI overlay button bound to the store field `aiOverlay` (the AI row is disabled while it is off and the uplift only counts while it is on), a path chart (visitor path in `ink`, model range as a band, model expected as a dashed line), the doubling curve (exact against rule of 70), a worked example at 7%, six tiles (GDP per capita multiple, population, GDP multiple, doubling time with the rule-of-70 error, position against the model range, required per-capita rate for a chosen multiple), table views, the caveat line, the reference source line.
- Arithmetic is exact and pure (`compound`, `doublingYears`, `rule70`, `rule70ErrorPct`, `requiredRatePct`, `combinedGrowthPct`, `effectiveGpcPct`); the AI uplift is added in percentage points to the per-capita rate.
- Local state only: no store fields or actions added; `KeyAction`, `KEY_MAP`, schemas, the mock generator and model code untouched. No new dependency.
- Keyboard isolation: `useKeyboard` already ignores events from inputs; a test proves it for the range and number inputs (arrows, digits, p, d, +, -, space, Escape).
- TDD: each test commit precedes its implementation commit. About 95 new tests; the whole web suite was run three times in a row.

## Decisions
- The starting point (first forecast year, p50 of GDP per capita and population for AR) is taken from the expected scenario without the overlay, whatever the store scenario is.
- The initial slider state is the expected preset without the overlay, rounded to the 0.1 step, available from the first render (no flash of zeros); Reset returns to it.
- Presets use the overlay series when the overlay is on (the AI uplift stays 0, as the brief says). With the mock the overlay series have lower growth than the off series, a quirk of the mock data.
- The "rule of 7" panel of the brief is worded "Rule of 70: worked example at 7%" (AGENTS.md says rule of 70, not rule of 7).
- Slider bounds are interface limits, not model claims (`config.ts`).

## Next step
- Human: review the PR (look and feel against `docs/design.md`; slider bounds; the additive convention for the AI uplift; the wording of the caveat and of the position labels; the worked-example wording; whether the preset values look right against the mock).
- Next in `TASKS.md`: `references-page`, then `storytelling-substeps` (needs this merged) and `integration`.
- Pushed, CI not checked.
