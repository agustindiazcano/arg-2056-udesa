# Last Context

## State
- Task `scene-economy` on branch `task/scene-economy`: the economy scene with mock data.
- New: `web/src/scenes/economy/{selectors.ts,StatTiles.tsx,index.tsx}`, `web/src/charts/builders/{longRun.ts,rankBars.ts,rankHistory.ts}`, `web/src/types/economy.ts` (type and parser for `economy_series`), `web/src/content/eras.ts` (three placeholder eras), `ordinal` in `web/src/charts/format.ts`.
- Scene: indicator buttons from the dataset, Level / Index toggle, peer chips (Argentina always in and not removable, at most 8 countries with a visible message), a year slider bound to the existing `setYear` action, long-run chart (Argentina in `ink` and thick, peers in `muted` and thin, hovered peer in `ink-2`, era bands, playhead marker), rank bars for the playhead year, rank history of Argentina, tiles (value, rank "n of N", gap to the peer median), table view for each chart, source line.
- Release gate: `scripts/check_no_mock.py` now also takes `--content DIR` (and scans `web/src/content` in its default run) and fails while any entry has `placeholder: true`, printing the ids. `build:release` passes `--content src/content`. Today it fails because of the three placeholder eras; a normal dev build and `precheck` are unaffected.
- No new dependency; `KeyAction`, `KEY_MAP`, schemas, the mock generator and model code untouched.
- TDD: each test commit precedes its implementation commit. About 100 new tests (TS and Python).

## Decisions
- Country labels are the ISO codes of the dataset (it has no names); Argentina is the constant `ARG`.
- Ranks are computed only among the countries that have a value in each year; a country with no value is listed in `missing` and never ranked. Rank history entries without a value for Argentina are `null` (gaps).
- The playhead range is the data range (1880 to 2025 in the mock) while the store year starts at 2026 and `play` moves it upward, so pressing play alone barely moves the playhead here. I added a year slider (existing `setYear` action) so the scene can be explored; per-scene year ranges are a shell question.
- Era bands are clamped to the data range; eras outside it are dropped.
- Index base year: the first year in which all selected countries have a positive value; otherwise the view falls back to levels and says so.
- Era labels are placeholders only; the real periodization and sources are a human task before release.

## Next step
- Human: review the PR (look and feel against `docs/design.md`; Argentina in `ink` and peers in `muted`; the cap of 8; the base-year rule; ranking only among countries with data each year; the placeholder eras and the release gate; the year slider and the playhead range).
- Human before release: the real era list with sources.
- Next in `TASKS.md`: `scene-sandbox`, `references-page`.
- Pushed, CI not checked.
