# Last context

Task `scene-resources` completed.

## What changed
- Created pure chart builders (`treemap.ts`, `provinceBars.ts`, `trend.ts`) returning ECharts options and extracting data per specifications.
- Extracted and defined EChart React wrapper component `EChart.tsx`.
- Created accessible `DataTable.tsx` for table views.
- Implemented `web/src/scenes/resources/index.tsx` mapping state (`useStore`), data (`useDataset`), selectors, and builders to the scene UI.
- Implemented corresponding Vitest integration and unit tests for the scene, components, selectors, formatting, and charts.
- Included token extraction script in `tokens.test.ts` to ensure UI matches the spec design in `docs/design.md`.

## Decisions made
- Kept `resource_production.ts` parser basic since strict validation happens via Python offline.
- Fixed testing environment for `echart.test.tsx` and `resourcesScene.test.tsx` setting them explicitly to `@vitest-environment jsdom`.

## Next step
Submit the PR for review, then proceed to the next unchecked item in `PENDING.md`.
