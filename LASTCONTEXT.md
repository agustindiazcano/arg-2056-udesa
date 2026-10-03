# Last Context

## State
- Task `scene-forecast` on branch `task/scene-forecast`: the forecast scene with mock data.
- New: `web/src/scenes/forecast/{selectors.ts,StatTiles.tsx,index.tsx}`, `web/src/charts/builders/{fan.ts,ranking.ts}`, `BAND_ALPHA` token (0.18) in `tokens.ts` and `--band-alpha` in `tokens.css`.
- Scene: indicator selector from the file, resource selector for `resource_production`, AI overlay button and scenario buttons bound to the store, fan chart, province ranking for the playhead year, stat tiles, table view for both charts, source line, caveat line.
- TDD: each test commit precedes its implementation commit (selectors, BAND_ALPHA, fan, ranking, scene). Tests: `forecastSelectors`, `bandAlpha`, `fanBuilder`, `rankingBuilder`, `forecastScene`, `forecastSceneDispose`.
- No dependency added; `KeyAction` and `KEY_MAP` unchanged; model, schemas and mock generator untouched.
- Also marked audit and model-design as done in `TASKS.md`.

## Decisions
- Province ranking is empty for GDP, GDP per capita, population and HDI because the mock has province series only for `resource_production`. The scene shows "No province series for this indicator in the data." Mock was not extended.
- When a selected province has no series, the fan shows the missing-series message instead of an empty chart.
- Rank change is `null` (shown as "no data") when a province has no point at the first year.
- Arrow keys change scene (`KEY_MAP`), so the year moves with play or the store; the brief's "arrows moving the year" was not implemented.

## Next step
- Human reviews the PR (look and feel against `design.md`, caveat and p10-p90 wording, mock coverage, AI overlay wording against `docs/model-design.md` section 2.5).
- Next in `TASKS.md`: `terrain-bake`. `scene-forecast-map` is blocked by province geometry.
- Pushed, CI not checked.
