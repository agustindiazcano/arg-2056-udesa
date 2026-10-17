# Last Context

## State
- **Branch**: `task/map-search` (worktree `../arg-2056-udesa-correcciones`, branched from `task/res-province-drilldown`).
- **Task**: C5 (`map-search`) of `docs/action-plan-correcciones-nuevas.md` (`test/correcciones-nuevas.png`):
  - Created `web/src/geo/departmentsIndex.json` indexing 527 departments across all 24 provinces.
  - Implemented `web/src/ui/mapSearchLogic.ts` with searchGeo (accent & case normalization, prefix and substring scoring).
  - Implemented `web/src/ui/MapSearch.tsx` (combobox with keyboard navigation: arrows, Enter, Esc, a11y role="combobox" and role="option").
  - Integrated `MapSearch` directly into `web/src/tour/ResourcesStep.tsx` above the map.
  - Tests: `mapSearch.test.ts` (6 tests), `mapSearchUi.test.tsx` (3 tests), `resourcesStepSearch.test.tsx` (2 tests) all pass.
  - Typecheck and ESLint clean.

## Next
- Commit and push `task/map-search`.
- Start C1 (`res-minerals-extend`): add boron, copper, molybdenum, and the Taca Taca project.
- Finally C6 (`province-profile-slide`): implement last with mock data as instructed by user.
