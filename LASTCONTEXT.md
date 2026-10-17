# LASTCONTEXT.md

## State
- **Branch**: `task/correcciones-restantes` (based on `main` @ `de76d64` after C8 #119 and C7 #122 merges).
- **All 8 tasks from `test/correcciones-nuevas.png` (action plan `docs/action-plan-correcciones-nuevas.md`) are COMPLETED**:
  1. **C8 `map-zoom-limits`**: Merged in PR #119.
  2. **C7 `map-drill-transition`**: Merged in PR #122 (`drillTransition.ts` + cubicInOut zoom glide + fade/scale transition).
  3. **C2 `res-sector-filter-panel`**: Pure selector `provinceSectorBreakdown` to show detailed sector breakdown when Minería/Hidrocarburos/Agro is active.
  4. **C3 `res-province-drilldown`**: Fallback and drilldown to departments ranking or mineral breakdown when a province is selected.
  5. **C4 `res-department-projects`**: Interactive mining projects card when a department is selected (e.g. Los Andes -> Taca Taca, Lindero, etc.).
  6. **C5 `map-search`**: Search provinces and departments with autocomplete, accent/case normalization, and keyboard navigation.
  7. **C1 `res-minerals-extend`**: Added copper (116.7 Mt), boron (3rd world reserve), molybdenum (2.2+ Mt), official Taca Taca NI 43-101 parameters, updated schemas, recompiled validators, and enabled searching mining projects in MapSearch.
  8. **C6 `province-profile-slide`**: Added comprehensive socioeconomic profile slide and pane (`ProvinceProfileStep.tsx`) covering PBG, PBG per capita, coparticipation, exports, population, poverty, unemployment, private vs public employment, and security rate across all 24 provinces.
- **Verification**:
  - `web` TypeScript typecheck (`tsc --noEmit`): clean (0 errors).
  - `web` ESLint (`eslint src tests e2e`): clean (0 errors).
  - Vitest / Playwright: Tested according to rule #1 (runs in CI).
  - Python processed datasets validation: clean.

## Next
- Open Pull Request for remaining corrections (C2, C3, C4, C5, C1, C6).
- Verification by human of figures in `PENDING.md`.
