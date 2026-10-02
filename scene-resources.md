# Task: `scene-resources`

Branch: `task/scene-resources`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md` and `docs/design.md` first. `docs/design.md` is binding for every color, spacing and chart convention.
Prerequisites: tasks `shell` and `composition-contract` are merged into `main`.

## Goal

The resources scene with mock data: an exports (or GDP) treemap, production by province for a selected resource, a national production trend, and an investment projects table. Chart logic lives in pure, tested builder functions; the human polishes the look afterwards.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No map, no choropleth, no forecast, no animation beyond what `design.md` section 5 allows, no sub-step navigation, no light mode.
- No dependency other than `echarts`. Use it directly (no React wrapper).
- Do not change the `KeyAction` union or `KEY_MAP`. Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`.
- Do not fake CI. Do not silence any checker.

## 1. Files

```
web/src/styles/tokens.ts                  hex values mirrored from tokens.css (ECharts needs JS values)
web/src/charts/format.ts                  formatValue(value, unit), APP_LOCALE constant
web/src/charts/builders/treemap.ts        buildTreemap(records, opts)
web/src/charts/builders/provinceBars.ts   buildProvinceBars(records, opts)
web/src/charts/builders/trend.ts          buildTrend(records, opts)
web/src/charts/EChart.tsx                 thin wrapper around echarts init, setOption, resize, dispose
web/src/charts/DataTable.tsx              accessible HTML table view
web/src/data/useDataset.ts                hook: fetch /data/<name>.json, parse, {status, data, error}
web/src/scenes/resources/selectors.ts     pure view-model functions
web/src/scenes/resources/index.tsx        the scene (replaces the placeholder)
```

## 2. Builders (pure functions, no DOM)

All return `{ option, excluded }` where `option` is an ECharts option object and `excluded` is the number of records dropped because their value was `null`. Colors come only from `tokens.ts` (and must match `design.md`).

- **`buildTreemap(records, { highlightGroup? })`**: `records` are the `selectComposition` result. Series type `treemap`; two levels (group, leaf); area equals `value_usd`; leaves sorted descending inside each group and groups sorted by total descending; `null` leaves excluded (counted in `excluded`); all tiles use the slot-1 blue; with `highlightGroup`, tiles of other groups use `muted`; 2px gap in `surface`; label shows name and share of the displayed total with one decimal.
- **`buildProvinceBars(records, { resource, year, topN = 10 })`**: horizontal bars, one per province for that resource and year, geo `AR` excluded (it is the national total, shown in the title), province names from `PROVINCES`; top `topN` descending, the rest folded into one bar "Other" so the sum is preserved; all bars slot-1 blue except "Other" in `muted`; 4px rounded data end; `null` excluded and counted.
- **`buildTrend(records, { resource, geo = 'AR' })`**: line over years, sorted by year; a `null` value stays `null` in the data (a gap) and the series has `connectNulls: false`; never converted to 0; y axis title is the unit.
- All three: a tooltip formatter that uses `formatValue`, an `aria`-friendly title string returned as part of the result (`summary: string`) stating the main takeaway (for example the largest group and its share).

## 3. Scene layout

- Headline and one-line subtitle (placeholders in English).
- Left: treemap with a selector for kind (exports / GDP) and the current `year` from the store, clamped to the years available.
- Right: resource selector (buttons, `aria-pressed`), province bars and the national trend for the selected resource.
- Bottom: projects table filtered by the selected resource, ordered by `capex_usd` descending with `null` last; columns name, province, status, capex, start year, capacity; status shown as text, never color alone.
- Source line listing the unique `source` and latest `retrieved_at` of the displayed data; the MOCK badge from `shell` stays visible.
- Every chart has a "Table view" toggle (`aria-pressed`) that swaps it for `DataTable`; containers have `role="img"` and the builder's `summary` as `aria-label`.
- Loading and error states are visible (text, not a blank panel).

## 4. EChart wrapper

`EChart` calls `echarts.init` in an effect, `setOption` when `option` changes, `resize` on window resize, and **`dispose` on unmount** (removing the resize listener). No echarts calls during render.

## 5. Tests (write first)

Pure builders, with small hand-built fixtures (no mock files):
- Treemap: totals preserved; nulls excluded and counted; ordering; all tile colors equal slot-1 blue without highlight; with highlight only that group keeps blue and the rest equals `muted`; labels show shares that sum to about 100.
- Province bars: top-N plus "Other" preserves the sum; `AR` excluded; unknown year gives an empty chart and `excluded` of 0 without throwing; province names resolved.
- Trend: sorted by year; `null` stays `null` and `connectNulls` is `false`.
- Selectors: filtering by kind, year and resource; clamping the year to the available range.
- `formatValue`: units, compact notation above 10,000, locale constant used.
- Token drift: every hex in `tokens.ts` also appears in `tokens.css` under the matching variable (parse both files).

Component tests (jsdom, with `vi.mock('echarts')` returning a fake with `init`, `setOption`, `resize`, `dispose`):
- `EChart` calls `setOption` with the given option; `resize` on window resize; `dispose` on unmount and the listener removed.
- Scene: shows loading, then renders the three charts and the table; the table toggle swaps chart for table; selecting a resource updates the province bars option; error state when `fetch` fails.

## 6. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes.
- [ ] Only `echarts` added; `package-lock.json` committed.
- [ ] No color literal outside `tokens.ts` and `tokens.css`.
- [ ] `null` data never renders as 0 anywhere (tested for the trend and the tables).
- [ ] `npm run dev` shows the scene with mock data and the MOCK badge; every chart has a working table view.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (look and feel against `docs/design.md`, mock plausibility).
