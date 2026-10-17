# LASTCONTEXT.md

## State
- **Branch**: `task/map-drill-transition` (from `main` @ `de32237`, after PR #119 C8 zoom limits).
- **Task**: C7 of `docs/action-plan-correcciones-nuevas.md`: smooth drill country > province > department.
- **Key changes**:
  - New `web/src/charts/drillTransition.ts`: `DRILL_MS` (450), `drillViewKey`, `cameraAnimation`, `useDrillTransition` (fires once per view change, never on first render, never with reduced motion, timer cleared on unmount).
  - `ProvinceMap.tsx`: zoom-to-province now interpolates (`animationDurationUpdate` + cubicInOut, 0 with reduced motion); the chart sits in `.map-drill-canvas`, which gets `is-drilling` for 450 ms when the drawn map swaps (country <-> departments). Triggered by state, not scroll/frame.
  - `dashboard.css`: `map-drill-in` keyframes (fade 0.2 -> 1, scale 0.97 -> 1); disabled under `prefers-reduced-motion`.
  - Tests: `drillTransition.test.tsx` (12), `mapDrillTransition.test.tsx` (4); `forecastMap.test.tsx` still green.
- Old local branch with a previous attempt renamed to `task/map-drill-transition-old` (based on an outdated main; superseded, not pushed again).
- Not checked visually in the browser.

## Next
- Human visual check of the drill on the forecast map (and with OS reduced motion on).
- Then C2 `res-sector-filter-panel`.
