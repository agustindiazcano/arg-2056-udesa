# Last Context

## State
- **Branch**: `task/res-minerals-extend` (worktree `../arg-2056-udesa-correcciones`, branched from `task/map-search`).
- **Task**: C1 (`res-minerals-extend`) of `docs/action-plan-correcciones-nuevas.md` (`test/correcciones-nuevas.png`):
  - Updated JSON schemas `data/schemas/resource_production.schema.json` and `data/schemas/projects.schema.json` to include `"boron"` and `"molybdenum"`.
  - Recompiled TypeScript/AJV validators with `npm run gen:validators`.
  - In `web/src/tour/resourcesData.ts`: added copper (116,7 Mt), boron (3.ª reserva mundial), and molybdenum (2,2+ Mt) to mining totals and separated Boratos (120 M USD) and Cobre/molibdeno/resto (115 M USD) in mining export breakdown, strictly preserving the 4.673 bn USD total from Secretaría de Minería.
  - In `web/src/tour/provinceSectorBreakdown.ts`: detailed Salta, San Juan, Catamarca and Jujuy with explicit borates, copper, and molybdenum.
  - In `web/src/tour/provinceDrilldown.ts`: exported `getAllMiningProjects` so search and drilldown have direct access to all verified projects including Taca Taca (cobre, molibdeno, oro; First Quantum NI 43-101 capex 4.232 M USD inicial).
  - In `web/src/ui/mapSearchLogic.ts`: integrated mining projects into search so typing "taca taca" (or other projects) provides direct navigation to the department and province.
  - In `web/src/ui/MapSearch.tsx` and `web/src/tour/ResourcesStep.tsx`: updated search badge style and selecting a project sets the province and department.
  - Tests: `web/tests/unit/mineralsExtend.test.ts` (5 tests) and all regression tests pass.
  - ESLint and TypeScript checks pass clean.

## Next
- Commit and push `task/res-minerals-extend`.
- Start C6 (`province-profile-slide`): implement last with mock data as instructed by user.
