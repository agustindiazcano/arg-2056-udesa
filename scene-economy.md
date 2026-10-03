# Task: `scene-economy`

Branch: `task/scene-economy`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/design.md` (binding for every color, spacing and chart convention), `docs/data-dictionary.md`, `data/schemas/economy_series.schema.json`, `data/mock/economy_series.json`, `docs/tasks/scene-resources.md`, `docs/tasks/scene-forecast.md` and the code they produced (builders, `EChart`, `DataTable`, `useDataset`, `formatValue`, `tokens.ts`, the store and `PROVINCES`) first.
Prerequisites: `shell`, `mock-data`, `scene-resources` and `scene-forecast` are merged into `main`.

## Goal

The economy scene with mock data: Argentina's long-run economic path from 1880 to the present compared with the Latin American peers, with a playhead that moves through time, a ranking among peers at the playhead year, the rank history of Argentina, and era bands on the timeline. All chart logic lives in pure, tested builders and selectors. The human polishes the look afterwards.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No forecast, no resources treemap (they exist in other scenes), no map, no sub-step navigation, no light mode, no animation beyond what `design.md` section 5 allows.
- No new dependency (`echarts` is already installed). Do not change the `KeyAction` union or `KEY_MAP`. Use only store actions that already exist.
- Do not write historical claims as facts. The era list in section 4 is a placeholder structure; the human supplies the real periodization and sources later.
- Do not touch schemas, the mock generator or model code. Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

If the mock `economy_series` does not contain what this brief needs (country list, years from 1880, the indicators below), stop and tell me exactly what is missing. Do not invent data and do not extend the mock.

## 1. Files

```
web/src/charts/builders/longRun.ts         buildLongRun(view, opts)
web/src/charts/builders/rankBars.ts        buildRankBars(rows, opts)
web/src/charts/builders/rankHistory.ts     buildRankHistory(history, opts)
web/src/scenes/economy/selectors.ts        pure view-model functions
web/src/scenes/economy/index.tsx           the scene (replaces the placeholder)
web/src/scenes/economy/StatTiles.tsx       headline numbers
web/src/content/eras.ts                    typed placeholder era list (section 4)
```

Reuse `EChart`, `DataTable`, `useDataset`, `formatValue` and the table-view toggle pattern. The indicator list and the country list are not hard-coded: they come from the loaded dataset (use the schema and the mock to learn the field names). Argentina's id and the peer ids come from the dataset's geo codes.

## 2. Selectors (pure, `selectors.ts`)

- `countriesIn(records, indicator)`: sorted list of country ids that have at least one non-null value for the indicator.
- `longRunView(records, { indicator, countries, mode })` with `mode` equal to `'level'` or `'index'`: one series per requested country over the years present, sorted by year. In `'index'` mode every series is divided by its own value at a common base year and multiplied by 100; the base year is the first year in which **all** requested countries have a non-null positive value (returned as `baseYear`; `null` and an `indexUnavailable` flag when no such year exists, in which case the view falls back to `level` and says so). A `null` stays `null`.
- `clampYear(yearFloat, years)`: integer year inside the available range (reuse the function from `scene-forecast` if it is general enough; otherwise write this one and test it).
- `rankAt(records, { indicator, year, countries })`: rows `{ geo, value, rank, of }` among the countries that have a non-null value at that year, sorted descending by value (ties by geo); `of` is the number of countries ranked at that year; countries without a value are listed in `missing` and never ranked.
- `rankHistory(records, { indicator, country, countries })`: for each year, the rank and `of` of `country` among those with a value that year; years where `country` has no value are `null`.
- `peerMedian(records, { indicator, year, country, countries })`: median of the peers (all `countries` except `country`) with a value that year; `null` when fewer than 3 peers have a value.
- `gapPct(value, median)`: `(value - median) / median * 100`; `null` when either is `null` or the median is not positive.

## 3. Builders (pure, no DOM)

All return `{ option, excluded, summary }` as in the other scenes; colors only from `tokens.ts`.

- **`buildLongRun(view, { highlight, year, eras, hovered })`**: line chart. Argentina is drawn with the `ink` token and a thicker width; peers use the `muted` token and a thin width, so the chart never needs a categorical palette; a hovered or selected peer is drawn with `ink-2`. Direct labels at the end of each line (country name), no legend. `null` stays `null` with `connectNulls: false`. A vertical marker at the playhead `year`. Era bands (section 4) as `markArea` with the `grid` token at low opacity and the era label at the top; no era band when `eras` is empty. The y axis title is the unit, or "Index (base year = N)" in `index` mode. Tooltip uses `formatValue` for all series at the hovered year.
- **`buildRankBars(rows, { highlight })`**: horizontal bars of the value at the playhead year, in rank order, Argentina in the slot-1 blue token and the rest in `muted`; value label at the bar end; the category label shows `rank` and the country name; countries in `missing` are not drawn (they are listed in the summary).
- **`buildRankHistory(history, { year })`**: step line of Argentina's rank over the years with the y axis inverted (rank 1 at the top), integer ticks, a `null` rank as a gap; label "rank n of N" in the tooltip; the playhead marker.
- `summary` states the main takeaway (for example "Argentina ranks 3rd of 10 in 1913 and 8th of 10 in 2025 in GDP per capita" built only from the numbers in the view).

## 4. Eras (placeholder structure)

`web/src/content/eras.ts` exports `ERAS: readonly Era[]` with `Era = { id: string; startYear: number; endYear: number; label: string; source_id: string | null; placeholder: boolean }`. Create exactly three entries as demonstration, labeled "Era A (placeholder)", "Era B (placeholder)", "Era C (placeholder)", with consecutive non-overlapping ranges inside the data range, `source_id: null` and `placeholder: true`. Do not name real historical periods.

Release gate: extend the existing mechanism behind `build:release` (the same one that rejects mock data) so that it also fails when any entry in `web/src/content/` has `placeholder: true` (a Vitest or script check, following the existing style) and prints the entry ids. Show in the PR that a normal dev build still passes and that the release gate fails today because of the three placeholders. Keep the existing mock check working.

## 5. Scene layout

- Headline and one-line subtitle (placeholders in English).
- Controls: indicator selector (buttons, `aria-pressed`); mode toggle "Level" / "Index"; peer chips (buttons with `aria-pressed`) to add or remove peers, Argentina always included and not removable; at most 8 countries at once (a ninth press is ignored and a text message says so). Defaults: Argentina plus every peer available, up to the limit, ordered by id.
- Left (wide): the long-run chart. Right: the rank bars for the playhead year. Below: the rank history. The playhead year comes from `clampYear(yearFloat)` and is shown as text ("Year 1913"); playing (`playing`, `speed`) moves it through the store as in the other scenes.
- `StatTiles`: Argentina's value at the playhead year, its rank "n of N", and its gap to the peer median (`gapPct`); a tile whose number is `null` shows "no data".
- Source line: unique `source` values and latest `retrieved_at` of the displayed records; the MOCK badge from `shell` stays visible.
- Every chart has a "Table view" toggle (`aria-pressed`) swapping it for `DataTable` (long-run: year × country; rank bars: rank, country, value; rank history: year, rank, of). Containers have `role="img"` and the builder `summary` as `aria-label`. Loading and error states are visible text. The province filter does not apply to this scene and must not break it.

## 6. Tests (write first)

Pure functions, hand-built fixtures (no mock files):
- `countriesIn`, `longRunView` in both modes with hand-computed index values (exact), common base year selection, `indexUnavailable` fallback, `null` kept as `null`.
- `clampYear` below, inside, above, and non-integer input.
- `rankAt`: order, ties by geo, `of`, countries with `null` listed in `missing` and never ranked; `rankHistory`: rank changes as the number of countries with data changes, `null` years; `peerMedian` with 2 peers (`null`), 3 peers, even and odd counts (exact); `gapPct` exact and `null` cases.
- `buildLongRun`: Argentina color and width, peers `muted`, hovered `ink-2`, no legend, `connectNulls: false`, playhead marker year, era `markArea` count and bounds, no era area when `eras` is empty, y axis title in both modes.
- `buildRankBars`: order, colors, missing countries excluded and mentioned in the summary. `buildRankHistory`: inverted axis, integer ticks, gaps for `null`.
- Era list: ranges sorted, non-overlapping, inside the data range of the mock (read the years from the fixture, not the real file); every entry has `placeholder: true` today; the release gate fails with them and passes when they are removed in a test fixture.
- Token drift test still passes.

Component tests (jsdom, `vi.mock('echarts')` as in the other scenes):
- Loading, then charts and tiles; error state when `fetch` fails; a visible message when the dataset has no country for the selected indicator.
- Changing `yearFloat` in the store changes the rank bars, tiles and playhead; out-of-range values clamp.
- Peer chips add and remove series in the option; Argentina cannot be removed; the ninth country press is ignored with the message.
- Mode toggle switches between level and index options; the unavailable-index message appears for a fixture without a common base year.
- Table toggles swap chart for table and `null` cells show "no data".
- `EChart` disposed on unmount.

## 7. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes.
- [ ] No new dependency; no color literal outside `tokens.ts` and `tokens.css`; no `as unknown as`; `KeyAction` and `KEY_MAP` unchanged.
- [ ] `null` never rendered as 0 (tested for the long-run chart, the ranks, the tiles and the tables).
- [ ] No real historical claim in the code; the three placeholder eras are flagged and the release gate fails because of them.
- [ ] `npm run dev` shows the scene with mock data, the MOCK badge, the playhead moving with play, the peer chips and the table views.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (add "real era list with sources" as a human task before release).
- [ ] PR description: what changed, what was verified, what the human must verify (look and feel against `docs/design.md`; that Argentina in `ink` and peers in `muted` reads well; the cap of 8 countries; the base-year rule for the index; the choice to rank only among countries with data in each year; the placeholder eras and the release gate).
