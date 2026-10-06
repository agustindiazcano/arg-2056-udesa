# Task: `scene-forecast`

Branch: `task/scene-forecast`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/design.md` (binding for every color, spacing and chart convention), `docs/tasks/forecast-contract.md`, `docs/tasks/scene-resources.md` and the code it produced (builders, `EChart`, `DataTable`, `useDataset`, `tokens.ts`) first.
Prerequisites: `shell`, `forecast-contract`, `mock-data` and `scene-resources` are merged into `main`.

## Goal

The 2056 forecast scene, with mock data: a scenario fan chart, an indicator selector, a province ranking for the year under the playhead, headline numbers for the horizon, and the AI overlay toggle. All chart logic lives in pure, tested builder and selector functions. The human polishes the look afterwards.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No map and no choropleth (province geometry does not exist yet; a later task `scene-forecast-map` adds it). The province view in this task is a ranking.
- No new dependency (use `echarts`, already installed). No animation beyond what `design.md` section 5 allows. No sandbox, no sub-step navigation, no light mode.
- Do not change the `KeyAction` union or `KEY_MAP`. Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not touch model code, schemas or the mock generator. If the mock `forecast_output` lacks a series this brief needs (province-level series, `ai_overlay` on and off, a given indicator), stop and tell me which; do not invent data and do not extend the mock.
- Do not fake CI. Do not silence any checker.

## 1. Files

```
web/src/charts/builders/fan.ts              buildFan(view, opts)
web/src/charts/builders/ranking.ts          buildRanking(rows, opts)
web/src/scenes/forecast/selectors.ts        pure view-model functions
web/src/scenes/forecast/index.tsx           the scene (replaces the placeholder)
web/src/scenes/forecast/StatTiles.tsx       headline numbers
web/src/styles/tokens.ts / tokens.css       add scenario colors and BAND_ALPHA only if missing (values from design.md; the drift test must cover them)
```

Reuse `EChart`, `DataTable`, `useDataset`, `formatValue` from `scene-resources`. The indicator list is not hard-coded: it comes from the indicators present in the loaded `forecast_output` (use the contract and the mock to learn the names); an indicator with a `resource` field gets a second selector for the resource.

## 2. Selectors (pure, `selectors.ts`)

Built on `selectSeries` and `parseForecastOutput` from the contract. All return plain data.

- `forecastView(output, { indicator, resource?, geo = 'AR', aiOverlay })`: the three scenario series (`pessimistic`, `expected`, `optimistic`) for the requested overlay state, plus, when `aiOverlay` is true, the matching `ai_overlay: off` series of the same scenario as `reference`. A missing series is reported in `missing: string[]` (scenario names) and never replaced by zeros or copies.
- `clampYear(yearFloat, points)`: integer year of the playhead clamped to the first and last year available in the series. Below the range returns the first year, above returns the last.
- `endpoint(series, year)`: `{ p10, p50, p90 }` at that year, or `null` if the point does not exist.
- `cagr(series, fromYear, toYear)`: compound annual growth of `p50` as a percentage, `((v_to / v_from) ** (1 / n) - 1) * 100`; `null` when either value is missing, not positive, or `n <= 0`.
- `aiDelta(onSeries, offSeries, year)`: relative difference of `p50` in percent, `(on - off) / off * 100`; `null` when either value is missing or `off == 0`.
- `rankProvinces(output, { indicator, resource?, year, scenario, aiOverlay, topN = 10 })`: rows `{ geo, name, p10, p50, p90, rank, baseRank, rankChange }` for geo ids `AR-X` only (national `AR` excluded), names from `PROVINCES`, sorted by `p50` descending, ties broken by `geo`; `baseRank` is the rank at the first year of the series; `rankChange = baseRank - rank` (positive means it climbed); provinces without a point at that year are excluded and counted in `excluded`.

## 3. Builders (pure, no DOM)

Both return `{ option, excluded, summary }` as in `scene-resources` (`excluded` counts dropped null points; `summary` is the accessible takeaway string). Colors only from `tokens.ts`.

- **`buildFan(view, { scenario, year })`**: line chart over years. Three `p50` lines, one per scenario, colored with the scenario tokens; direct label at the last point with the scenario name and its value (no legend). For the selected `scenario` (store) draw the `p10`-`p90` band (two stacked line series, the lower one transparent, the upper one with `BAND_ALPHA`), and give that scenario's line a thicker width; the other lines keep the normal width and the same hue. A vertical marker at `year` (the playhead) and a vertical dashed marker at the first forecast year labeled "forecast starts". When `reference` series exist (AI overlay on), draw the reference `p50` of the selected scenario dashed in `muted`, labeled "without AI". A `null` stays `null` with `connectNulls: false`. The y axis title is the unit. Tooltip uses `formatValue` and shows p10, p50 and p90 of the selected scenario at the hovered year, with the wording "p10-p90: 80% of simulated outcomes".
- **`buildRanking(rows, { scenario })`**: horizontal bars of `p50` per province, rank order, bar color the scenario color, a thin whisker from `p10` to `p90` (custom series or error-bar style available in ECharts without new dependencies), 4px rounded data end, value label at the bar end, province name on the axis. Rows with `rankChange != 0` get a small text marker in the category label ("up 3", "down 2"); never color alone.
- Both builders: text for any non-data labels in English placeholders; `summary` states the main takeaway (for example "Expected scenario, 2056: GDP per capita median X, p10-p90 Y to Z; AI overlay adds N% at the median").

## 4. Scene layout

- Headline and one-line subtitle (placeholders), plus the fixed caveat line: "Scenarios are conditional projections, not predictions." The line sits under the headline.
- Top bar inside the scene: indicator selector (buttons, `aria-pressed`), resource selector when applicable, a button `AI overlay` bound to `aiOverlay` in the store (`aria-pressed`), and the scenario selector as three buttons bound to `scenario` in the store. The keys `1`, `2`, `3` already change `scenario` through the shell; the scene only renders the store state.
- Left: the fan chart. Right: the province ranking for `clampYear(yearFloat)` and the selected scenario. The playhead year is shown as text above both ("Year 2041").
- Below: `StatTiles` for the selected scenario: value at the last year (p50 and p10-p90), growth between the first and last year (`cagr`), and, when `aiOverlay` is on, the AI effect at the last year (`aiDelta`). A tile whose number is `null` shows the text "no data", never a number.
- Province filter: when `province` in the store is not null, the ranking highlights that province (others in `muted`) and the fan switches to `geo = province`; when null, `geo = 'AR'`.
- Source line: `source`, `model_version`, `generated_at` and `horizon` from the file; the MOCK badge from `shell` stays visible. If any series is missing, a visible text lists which scenario series are missing for the current selection.
- Every chart has a "Table view" toggle (`aria-pressed`) swapping it for `DataTable` (fan: year × scenario with p10/p50/p90; ranking: rank, province, p10, p50, p90, change). Containers have `role="img"` and the builder `summary` as `aria-label`. Loading and error states are visible text.

## 5. Tests (write first)

Pure functions, with small hand-built fixtures (no mock files):
- `forecastView`: returns the three scenarios; with `aiOverlay` true returns `reference`; a missing scenario appears in `missing` and no series is fabricated.
- `clampYear`: below, inside and above the range; non-integer input floors.
- `endpoint`, `cagr` (hand-computed example, for instance 100 to 200 in 10 years gives 7.177...% to the displayed precision of your test; assert the exact value to 6 decimals), `cagr` null cases, `aiDelta` (exact value) and null cases.
- `rankProvinces`: sorted descending with deterministic ties, `AR` excluded, `rankChange` sign, province without a point excluded and counted, names resolved.
- `buildFan`: three `p50` series with scenario token colors; band present only for the selected scenario; reference series dashed and `muted` only with overlay; `null` kept as `null` and `connectNulls: false`; playhead and forecast-start markers at the right years; no legend; summary text contains the numbers.
- `buildRanking`: order, colors, whiskers carry p10 and p90, rank-change text markers, highlight of one province with the others `muted`.
- Token drift test still passes with the new tokens.

Component tests (jsdom, `vi.mock('echarts')` as in `scene-resources`):
- Scene shows loading, then fan, ranking and tiles; error state when `fetch` fails; a missing-series message instead of an empty chart.
- Pressing `2` on the document changes the store scenario and the fan option highlights the optimistic or expected line accordingly (assert the option, not pixels).
- Toggling `AI overlay` changes the series passed to the fan (the `ai_overlay: on` data plus the reference) and shows the AI tile.
- Moving `yearFloat` in the store changes the ranking year and the playhead; out-of-range values clamp.
- Selecting a province in the store switches the fan to that geo and highlights the ranking row.
- The table toggle swaps chart for table, and table cells for `null` show "no data".
- `EChart` is disposed on unmount (reuse the existing test pattern).

## 6. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes.
- [ ] No new dependency; no color literal outside `tokens.ts` and `tokens.css`; no `as unknown as`.
- [ ] `null` never rendered as 0 (tested for fan, ranking, tiles and tables).
- [ ] `KeyAction` and `KEY_MAP` unchanged; the scene only reads and writes the store through existing actions.
- [ ] `npm run dev` shows the scene with mock data, the MOCK badge, working `1/2/3`, arrows moving the year, the AI toggle and the table views.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (add `scene-forecast-map` blocked by province geometry).
- [ ] PR description: what changed, what was verified, what the human must verify (look and feel against `docs/design.md`; the wording of the caveat and of the p10-p90 label; whether the mock covers every indicator and province; that the AI overlay wording matches the model design once it exists).
