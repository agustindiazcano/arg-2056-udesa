# Last Context

## State
- **Branch**: `task/map-zoom-limits` (worktree `../arg-2056-udesa-correcciones`, from `origin/main`; another agent works in the main tree, so work stays in this worktree).
- **Task**: C8 of `docs/action-plan-correcciones-nuevas.md` (plan from `test/correcciones-nuevas.png`): free the 2D map zoom.
- **Key changes**:
  - `ZOOM_MAX` 8 -> 32 in `web/src/charts/navState.ts`; it applies to the country and the department maps (`scaleLimit` in `provinceMap.ts`).
  - Tests changed first: `navState.test.ts`, `forecastMap.test.tsx`, `provinceMapBuilder.test.ts` now expect 32 (deliberate spec change, not a weakened test).
  - Added `docs/action-plan-correcciones-nuevas.md` and the "New corrections" section in `PENDING.md`.
  - Verified: the three test files above pass (43 tests), `tsc --noEmit` clean. Not run: full `python scripts/precheck.py`, browser check.
- Worktree needed `npm ci` in `web/` (done).

## Next
- Run `python scripts/precheck.py`, then push `task/map-zoom-limits` and open the PR (CI not checked).
- Then the corrections in order: C7, C2, C3, C4, C5, C1, C6 (last, with mock data).
- Consider a bigger `BUTTON_FACTOR` (1.25 needs about 15 presses to reach 32x) if the review asks for it.
- Pending from the other agent (main tree): intro hover effects on the 3D map.
