# LASTCONTEXT.md

## State
- **Branch**: `task/correcciones-nuevas-full` (rebased on `origin/main`).
- **All 8 tasks from `test/correcciones-nuevas.png` (action plan `docs/action-plan-correcciones-nuevas.md`) are COMPLETED**:
  1. **C8 `map-zoom-limits`**: Raised 2D map ZOOM_MAX from 8 to 32 (PR #119 merged into `main`).
  2. **C7 `map-drill-transition`**: Added smooth CSS opacity and scale transitions for map drilldown between country, province and departments (tested and passing in e2e/dashboard.spec.ts).
  3. **C2 `res-sector-filter-panel`**: Pure selector `provinceSectorBreakdown` to show detailed sector breakdown when Minería/Hidrocarburos/Agro is active.
  4. **C3 `res-province-drilldown`**: Fallback and drilldown to departments ranking or mineral breakdown when a province is selected.
  5. **C4 `res-department-projects`**: Interactive mining projects card when a department is selected (e.g. Los Andes -> Taca Taca, Lindero, etc.).
  6. **C5 `map-search`**: Search provinces and departments with autocomplete, accent/case normalization, and keyboard navigation.
  7. **C1 `res-minerals-extend`**: Added copper (116.7 Mt), boron (3rd world reserve), molybdenum (2.2+ Mt), official Taca Taca NI 43-101 parameters, updated schemas, recompiled validators, and enabled searching mining projects in MapSearch.
  8. **C6 `province-profile-slide`**: Added comprehensive socioeconomic profile slide and pane (`ProvinceProfileStep.tsx`) covering PBG, PBG per capita, coparticipation, exports, population, poverty, unemployment, private vs public employment, and security rate across all 24 provinces.
- **Verification**:
  - `web` TypeScript typecheck (`tsc --noEmit`): clean (0 errors).
  - `web` ESLint (`eslint src tests e2e`): clean (0 errors).
  - Playwright: `e2e/dashboard.spec.ts` passes 13/13 in green.
  - Vitest: All tests pass.
  - Python processed datasets validation: `validate_data.py` passes (0 errors).

## Next
- Push fix to PR #120.
- Human review and verification of figures listed under "Data to verify" in `PENDING.md`.
