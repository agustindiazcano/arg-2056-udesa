# Last Context

## State
- Task `scene-forecast-map` on branch `task/scene-forecast-map`: the province choropleth in the forecast scene.
- New: `web/src/scenes/forecast/mapSelectors.ts` (`provinceMapValues`, `smallestProvinces`, `mapSummary`), `web/src/charts/builders/provinceMap.ts` (`buildProvinceMap`, `MAP_NAME`), `web/src/scenes/forecast/ProvinceMap.tsx` (`useProvinces`, `ProvinceMap`), `web/src/geo/malvinas.ts` (illustrative outline), tokens `SEQUENTIAL_BLUE`, `DIVERGING`, `NO_DATA` (+ CSS variables), an `onClick` prop in `EChart`.
- Scene: the right column has two tabs, Map (default once the geometry loads) and Ranking (the default while loading or when the geometry is not available); Level and "Change since <first year>" toggle for the map; clicking a province or a marker dispatches the existing `selectProvince` action (a second click clears it); table view; the geometry source and attribution are shown under the forecast source line.
- Colors only from tokens. The color domain is computed over all years of the selected scenario so colors stay comparable while the playhead moves; the change domain is symmetric around 0.
- No new dependency; `KeyAction`, `KEY_MAP`, model, schemas, the mock generator and the geometry build tool are untouched. The store `mode` (2D/3D) is ignored by the map.
- TDD: each test commit precedes its implementation commit. About 90 new tests (selectors, builder, tokens, Malvinas, EChart click, scene).

## Decisions
- **National territory (human decision, recorded as D-geo-1):** continental provinces plus the Malvinas as an imprecise hand-drawn outline, only to appear as territory (no data, not selectable). The registered province layer must exclude the Antarctic sector and far islands.
- **Diverging ramp red arm is a PLACEHOLDER** (design.md gives only the midpoint and the blue hue). The human approved deriving it (hue 350, same saturation and lightness as the blue token), pinned by a test, to be replaced.
- No-data fill is the baseline token. The hatch asked for by design.md is not applied.
- Missing provinces are never painted with a ramp color; they get the no-data fill and a "No data" legend swatch.
- The map tab is the default only once the geometry is loaded; until then the ranking shows (so a failing geometry never leaves an empty panel).
- `rank` in the map is by p50 at the playhead year, in both modes.

## Next step
- Human: review the PR (look and feel against `docs/design.md`; small provinces readable through the markers; the ramp tokens and the red placeholder; the tooltip wording; that the mock covers all 24 provinces: it covers 18 for resource production only, so the manual check shows the rest as no data; the fixed color domain).
- Human: the geometry step (`docs/geo.md`) is needed for the manual check; until then the scene shows the ranking and "Province geometry is not available".
- Next in `TASKS.md`: `scene-economy`, `scene-sandbox`, `references-page`.
- Pushed, CI not checked.
