# Task: `scene-forecast-map`

Branch: `task/scene-forecast-map`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/design.md` (binding for every color, spacing and chart convention), `docs/tasks/scene-forecast.md`, `docs/geo.md`, and the code from `scene-forecast`, `scene-resources` and `geo-provinces` (selectors, builders, `EChart`, `DataTable`, `tokens.ts`, `web/src/geo/`, the `ProvinceFilter` component and the store reducer) first.
Prerequisites: `scene-forecast` and `geo-provinces` are merged into `main`. The code and tests can be finished before the real geometry files exist; the manual check at the end needs `web/public/geo/provinces.geojson` and `provinces.meta.json` committed by the human.

## Goal

Add the province choropleth to the forecast scene: the map colors each province by the selected indicator at the playhead year, with level and change modes, hover details, click selection that updates the store, markers for the smallest provinces, and a table view. All map logic lives in pure, tested functions.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No 3D map, no extrusion, no terrain, no deck.gl, no MapLibre. The scene ignores the store `mode` field (the map is always 2D); say this in the PR description. A 3D variant is a later task.
- No new dependency (`echarts` has the `map` and `geo` components). No animation beyond what `design.md` section 5 allows.
- Do not fabricate geometry for development or tests beyond tiny hand-built fixtures. If the real geometry files are absent, the scene shows the ranking and a visible message (section 5) and must not crash.
- Do not change the `KeyAction` union or `KEY_MAP`. Use only store actions that already exist; if selecting a province needs an action that does not exist, stop and tell me which.
- Do not touch model code, schemas, the mock generator or the geometry build tool. Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Files

```
web/src/charts/builders/provinceMap.ts       buildProvinceMap(input, opts)
web/src/scenes/forecast/mapSelectors.ts      pure view-model functions for the map
web/src/scenes/forecast/ProvinceMap.tsx      map panel (chart + legend text + table toggle)
web/src/scenes/forecast/index.tsx            integrate the panel (edit)
web/src/styles/tokens.ts / tokens.css        add sequential and diverging ramps and NO_DATA color only if missing (values from design.md; drift test must cover them)
```

## 2. Selectors (pure, `mapSelectors.ts`)

Built on `selectSeries`, `clampYear`, `endpoint`, `cagr` from `scene-forecast` and on `ProvincesGeo`.

- `provinceMapValues(output, geo, { indicator, resource?, year, scenario, aiOverlay, metric })`, with `metric` equal to `'level'` or `'change'`:
  - `level`: for each province id, `{ p10, p50, p90 }` at `year`; the plotted value is `p50`.
  - `change`: the plotted value is `cagr(series, firstYear, year)` where `firstYear` is the first year of that province's series; `null` when `year <= firstYear` or the values are missing.
  - Returns `{ values: Record<id, { plotted: number, p10, p50, p90, rank }>, missing: string[], domain: [min, max], excluded: number }`. `missing` lists the ids with no usable value (never replaced by 0 or by a neighbor). `rank` is the rank by `p50` at `year` among provinces that have a value (ties by id).
  - `domain` is computed over **all years of the series of the selected scenario** (not just the current year) so colors stay comparable while the playhead moves. For `change` the domain is symmetric around 0: `[-m, m]` with `m = max(|min|, |max|)`. If no values exist, `domain` is `null`.
- `smallestProvinces(geo, n = 3)`: ids of the `n` provinces with the smallest `area_km2`, ordered ascending by area (ties by id), used for markers.
- `mapSummary(values, metric, indicatorLabel, year)`: the accessible takeaway text (highest and lowest province with their plotted values, count of provinces with no data).

## 3. Builder (pure, no DOM)

`buildProvinceMap({ geo, values, domain, centroids, smallIds }, { metric, selectedId, scenario, year })` returns `{ option, excluded, summary, mapName }`.

- The map is registered by the component under `mapName` (a constant such as `'ar-provinces'`) from the GeoJSON; the builder only describes the option and never calls `echarts` functions. Use the `geo` component plus a `map` series bound with `geoIndex` and `nameProperty: 'id'`, so features are matched by the `AR-X` id.
- Data: one item per province **that has a value**; provinces in `missing` have no item and are painted with the `NO_DATA` token through the geo `itemStyle`, never with the low end of the ramp. The legend text includes a "no data" swatch whenever `missing` is not empty.
- Color: `visualMap` continuous, `min`/`max` from `domain`; `level` uses the sequential blue ramp tokens; `change` uses the diverging blue-red ramp tokens centered on 0. Colors only from `tokens.ts`. The color scale is never reversed between modes in a way that makes high values look low.
- Border between provinces: the `surface` token, 1px; the selected province gets a 2px `ink` border and the rest keep their colors; a non-selected province is never dimmed by changing hue (selection is shown by the border, not by color alone).
- Markers: for each id in `smallIds`, a scatter point at its centroid (`coordinateSystem: 'geo'`), a small ring in the `ink-2` token with the province name as a label; clicking a marker behaves like clicking the province. Markers are drawn only if the province has a value or is selected.
- Tooltip (provinces and markers): name, plotted value formatted with `formatValue`, `p10 to p90` for `level` ("80% of simulated outcomes"), rank, and the scenario name. Provinces with no data show "no data" only.
- `excluded` counts provinces dropped for a missing value. `summary` comes from `mapSummary`.
- No animation on data change except the one that `design.md` section 5 allows; `animationDurationUpdate` follows the token if present.

## 4. Component and scene integration

- `ProvinceMap.tsx`: loads provinces with `loadProvinces` (from `geo-provinces`) inside an effect/hook with `{ status, data, error }`, registers the map once per module load (guard against double registration), renders `EChart` with the builder's option, handles `click` events on provinces and markers by dispatching the existing store action that sets `province` (clicking the selected province again clears it if the existing reducer supports clearing; otherwise only sets), and shows a "Table view" toggle (`aria-pressed`) swapping the chart for `DataTable` (rank, province, p10, p50, p90, plotted value; `null` shown as "no data").
- In `index.tsx` the right column gets two tabs, "Map" (default) and "Ranking" (the existing ranking), implemented as buttons with `aria-pressed`; a metric toggle "Level" / "Change since <first year>" appears only for the map. The scene reads `province`, `scenario`, `yearFloat`, `aiOverlay` from the store exactly as before; selecting a province in the map and selecting it in the existing `ProvinceFilter` produce the same store state and the same highlight in the fan and the ranking.
- Container: `role="img"` with the builder `summary` as `aria-label`. The map is never the only way to select a province (the existing `ProvinceFilter` stays). Loading and error states are visible text.
- Source line: add the geometry `source` and `attribution` from `provinces.meta.json` next to the forecast source line.

## 5. Missing geometry

If fetching `provinces.geojson` or its meta fails (404 or network) or `checkProvinceIds` reports problems, the map tab shows the text "Province geometry is not available" (plus the first problem if any), the "Ranking" tab becomes the default and stays fully working, and no exception escapes to the console as an unhandled error.

## 6. Tests (write first)

Pure functions, hand-built fixtures (no mock files, no real geometry):
- `provinceMapValues`: level values and ranks (ties by id); `missing` lists provinces without a point and they never appear in `values`; `change` equals the exact `cagr` for a hand-computed case and is `null` when `year <= firstYear`; `domain` covers all years of the scenario, not only the current one (assert with a fixture whose maximum occurs in a different year than the current one); the `change` domain is symmetric around 0; empty input gives `domain: null`.
- `smallestProvinces`: order by area ascending, ties by id, `n` larger than the count.
- `buildProvinceMap`: `nameProperty: 'id'`; items only for provinces with values; `visualMap` min/max equal the domain; ramp colors equal the tokens for `level` and `change`; the `NO_DATA` token is used for missing provinces and appears in the legend text; the selected province gets the `ink` 2px border and no color change; markers exist only for `smallIds` with a value or selected; tooltip formatter output for a province with and without data (exact strings); no color literal.
- Token drift test still passes with the new tokens.

Component tests (jsdom, `vi.mock('echarts')` with `registerMap` added to the fake):
- Map tab renders after loading, `registerMap` called once with the fixture geometry even after re-renders; the option passed to `setOption` matches the selectors for the store state.
- Changing `scenario`, `aiOverlay` or `yearFloat` in the store changes the plotted values but keeps the `domain` stable across years.
- A click event (simulated through the fake chart's registered handler) on a province dispatches the store action and the same selection happens when using `ProvinceFilter`.
- Metric toggle switches between `level` and `change` options.
- Table toggle swaps chart for table; `null` cells show "no data".
- Missing geometry (fetch 404) shows the message, the Ranking tab is the default and works; an invalid id set shows the message with the first problem.
- `EChart` disposed on unmount.

## 7. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes.
- [ ] No new dependency; no color literal outside `tokens.ts` and `tokens.css`; no `as unknown as`; `KeyAction` and `KEY_MAP` unchanged.
- [ ] Provinces without data are never painted as zero or as the low end of the scale (tested).
- [ ] With the real geometry committed, `npm run dev` shows the map with mock forecast data, hover and click work, the table view works, the MOCK badge is visible. Without it, the fallback message appears and nothing crashes.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (add the later tasks `scene-forecast-map-3d` and a note that `mode` is ignored here).
- [ ] PR description: what changed, what was verified, what the human must verify (look and feel against `docs/design.md`; that small provinces such as the capital are readable through the markers; the ramp tokens; the wording of the tooltip; that the mock forecast covers all 24 provinces; the decision to fix the color domain over all years).
