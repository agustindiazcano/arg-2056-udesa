# Last Context

## State
- **Branch**: `task/res-province-drilldown` (worktree `../arg-2056-udesa-correcciones`, branched from `task/res-sector-filter-panel`).
- **Tasks**: C3 (`res-province-drilldown`) and C4 (`res-department-projects`) of `docs/action-plan-correcciones-nuevas.md` (`test/correcciones-nuevas.png`):
  - When a province is selected (e.g. Salta, San Juan, Catamarca, Jujuy, Santa Cruz), the bottom-left chart switches from national provinces ranking to department-level production ranking.
  - If a province lacks department-level production data (e.g. Río Negro), it falls back to showing production by mineral/sector of that province.
  - Clicking a department (via chart bar or on the department map) selects the department and expands registered mining projects (e.g. Taca Taca, Centenario-Ratones, Lindero in Los Andes, Salta).
  - Cleanly displays nothing extra if the department has no registered projects.
- **Key changes**:
  - Implemented `web/src/tour/provinceDrilldown.ts` with department production data, department projects mapping, and fallback selector `provinceDrilldownData`.
  - Updated `web/src/scenes/forecast/ProvinceMap.tsx` with `selectedDepartment` and `onSelectDepartment` props, department click dispatch in department view, and breadcrumb navigation.
  - Updated `web/src/tour/ResourcesStep.tsx` with drilldown bars and interactive department projects list card.
  - Added unit tests in `web/tests/unit/provinceDrilldown.test.ts` (7 tests) and `web/tests/unit/resourcesStepDrilldown.test.tsx` (2 tests).
  - Verified tests (`npm test`), typecheck (`tsc --noEmit`), and lint (`eslint`).

## Next
- Commit and push `task/res-province-drilldown`.
- Start branch `task/map-search` for C5: search by province or department with keyboard navigation.
- Followed by C1 `res-minerals-extend` and C6 `province-profile-slide` (last, with mock data).
