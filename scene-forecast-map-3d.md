# Task: `scene-forecast-map-3d` (optional)

Status: **draft brief, blocked by the renderer decision** (`D-andes-1` in `andes-integration.md`). It is optional and the first to cut if time is short. Do not start until `andes-integration` has chosen and shipped a renderer, so the app has one 3D stack, not two.

Branch: `task/scene-forecast-map-3d`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `design.md` (choropleth and magnitude conventions), `docs/geo.md`, `docs/performance.md`, `scene-forecast-map.md`, `andes-integration.md` and the code they produced (`web/src/scenes/forecast/ProvinceMap.tsx`, `mapSelectors.ts`, `web/src/charts/builders/provinceMap.ts`, `web/src/geo/`, `web/src/runtime/`, the store's `mode` field and the Andes renderer) first.
Prerequisites: `scene-forecast-map` and `andes-integration` are merged, the real province geometry is committed in `web/public/geo/` (the human step of `PENDING.md`), and the human has confirmed the 3D variant is wanted.

## Goal

The 2D/3D toggle of the shell (`mode`) is ignored by the province map today. This task gives it a meaning in the forecast scene: a 3D variant of the province map in which each province is extruded by the value the choropleth already shows. It is a different view of the same numbers, not a new analysis.

Strict TDD for the logic (extrusion heights, scaling, camera). Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No new data, no new indicator, no new selector: heights come from the existing `mapSelectors` output (`level` and `change` modes), with the same `null` handling: a province without data is not extruded and is drawn with the no-data fill, never as zero height.
- No second 3D library: use the renderer `andes-integration` shipped. If it cannot draw this, stop and tell me.
- No change to the `KeyAction` union, `KEY_MAP` or the store shape: the existing `toggle3D` action and `mode` field are the switch. The 2D map stays the default for `mode: '2d'`, and the fallback whenever WebGL2 is missing, the quality tier is `low` or reduced motion makes the camera flight impossible to read.
- Nothing from another origin; the CSP stays as it is. No color literal outside the token files. Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Behavior

- **Heights**: a pure function maps the plotted value of each province to an extrusion height with a stated scale (linear, from the same domain as the color ramp; the maximum height is a named constant). Diverging values (`change` mode) extrude upward for growth and downward for decline from the baseline plane, with the diverging ramp colors. A test covers `null`, zero, negative and the domain ends.
- **Same interaction as 2D**: hover and selection call the store's `selectProvince` exactly as the 2D map does; the selected province is highlighted; the table view (the text alternative) stays available and is the accessible description of the 3D view; the canvas has `role="img"` and an `aria-label` built from the same summary string as the 2D map.
- **Quality**: `useQuality` decides: `low` tier or no WebGL2 shows the 2D map with the `WebGLRequired` notice; `QUALITY_PRESETS` sets the pixel ratio cap and the geometry detail (province outlines simplified by `terrainDetail`).
- **Camera**: one fixed three-quarter pose and a reset; orbit controls only if the renderer gives them with keyboard access; under reduced motion no animated transition between 2D and 3D.
- **Cleanup**: the WebGL context and geometries are disposed on unmount and on switching back to 2D; a mount and unmount test as in the other scene dispose tests.
- **Bundle**: the 3D code loads only when `mode` is `3d` (dynamic import inside the forecast chunk) and is not in the initial load; `npm run check:bundle` passes.

## 2. Tests (write first)

Heights (exact values on a fixture), `null` handling, the selection wiring, the 2D fallback conditions (no WebGL2, `low` tier), disposal, the label string, a jsdom scene test with the renderer mocked, and an e2e test under the real CSP (toggle to 3D with software GL, select a province, no console error, no foreign request, axe clean).

## 3. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes; e2e run or "e2e not run locally". CI result read or "pushed, CI not checked".
- [ ] No new data or selector; `null` is never a height; 2D is the fallback; keys and store unchanged.
- [ ] CSP spec and bundle budgets pass. `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (the height scale and whether the 3D view adds understanding or only decoration).
