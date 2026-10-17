# Last Context

## State
- **Branch**: `task/res-sector-filter-panel` (worktree `../arg-2056-udesa-correcciones`, branched from `task/map-drill-transition`).
- **Task**: C2 of `docs/action-plan-correcciones-nuevas.md` (`test/correcciones-nuevas.png`): when sector filter is active (Minería, Hidrocarburos, Agro), selecting a province displays that sector's detailed provincial composition instead of macro-sectors.
- **Key changes**:
  - Implemented pure selector `provinceSectorBreakdown(view, provinceId)` in `web/src/tour/provinceSectorBreakdown.ts` with provincial breakdown data for minería, hidrocarburos, and agro across producing provinces.
  - Returns `null` when a province has production below `PRODUCER_MIN` (100 M USD) in that sector, cleanly hiding the panel without mock or pending labels.
  - Updated `web/src/tour/ResourcesStep.tsx` to use `provinceSectorBreakdown` and guarded against null parts.
  - Added `// @vitest-environment jsdom` to `web/tests/unit/mapDrillTransition.test.tsx`.
  - Added 12 unit tests in `web/tests/unit/provinceSectorBreakdown.test.ts` covering national view, sector filtering, total view, and threshold fallbacks.
  - Verified tests (`npm test`), typecheck (`tsc --noEmit`), and lint (`eslint`).

## Next
- Commit and push `task/res-sector-filter-panel`.
- Start branch `task/res-province-drilldown` for C3: selecting a province (e.g. Salta) shows department-level production if available, or production by mining sector if not (replacing the provinces ranking).
- Followed by C4 `res-department-projects`, C5 `map-search`, C1 `res-minerals-extend`, and C6 `province-profile-slide` (last, with mock data).
