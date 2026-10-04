# Task: `map-navigation`

Branch: `task/map-navigation`. One PR (split it into two, 2D first and then 3D, if the diff passes about 1,500 changed lines). Read `AGENTS.md` (section 8, the keyboard map and the WebGL cleanup rules), `LASTCONTEXT.md`, `PENDING.md`, `docs/dashboard.md`, `design.md` (binding for every color, spacing and control), `docs/performance.md`, `web/src/three/stage.ts`, `Map3D.tsx`, `Bars3D.tsx`, `Lines3D.tsx`, `Chart3D.tsx`, `web/src/charts3d/` (specs and layouts), `web/src/charts/builders/provinceMap.ts`, `web/src/charts/EChart.tsx`, `web/src/types/keys.ts`, `web/src/runtime/` (`useQuality`, `useReducedMotion`) and the e2e suite first.
Prerequisites: the dashboard phases D1 to D6 are merged (they are). Decisions `D-3d-1` to `D-3d-6` are taken (`docs/decisions.md`): 3D is the priority, so this task is done before any 2D polish.

## Current state (read from the code, 2026-10-04)

- 2D province maps (`provinceMap.ts`): `roam: false`. No zoom, no pan, no buttons.
- 3D (`stage.ts`): drag orbits (azimuth free, polar angle clamped to 0.3 to 1.5 rad), the wheel zooms between 0.45 and 1.8 times the start radius. No pan, no `+` and `-` buttons, no reset, no pinch, and the camera target is fixed.
- `+` and `-` on the keyboard are the playback speed (`KEY_MAP`). They are not zoom.

## Goal

Every map and every 3D view can be explored: zoom, move and, in 3D, turn freely. The human asked for it in these words: the 2D and 3D maps should zoom with the mouse wheel and with plus and minus signs, and the map should be movable; 3D should give more freedom of navigation and let the user turn it.

## Scope

1. **2D maps** (forecast province map, resources province map and any later 2D map): zoom with the wheel (centered on the cursor), zoom with `+` and `-` buttons, pan by dragging, reset button. ECharts' own roam (`roam: true`, `scaleLimit`, `geoRoam` actions) is the first thing to try; zoom limits 1 to 8 times, pan limited so the territory never leaves the frame.
2. **3D views** (bars, province map, lines, fan; every `Chart3DSpec` kind): wider freedom than today.
   - Rotate: drag turns the view with no azimuth limit; the polar angle goes from nearly top-down (0.05 rad) to almost horizontal (1.55 rad).
   - Pan: right-drag, or Shift-drag, or two-finger drag moves the camera target; the target is clamped to the bounding box of the data plus a margin.
   - Zoom: wheel (toward the cursor), pinch, and the same `+` and `-` buttons as 2D; the range is wider than today (0.25 to 3 times the start radius).
   - Reset: one button and a double click restore the start pose; a short animation, instant under reduced motion.
   - Optional presets next to reset: "Cenital" (top-down) and "Perspectiva" (the start pose).
3. **Controls** (`web/src/ui/NavControls.tsx`, shared by 2D and 3D): three buttons in a corner of the chart panel: `+` ("Acercar"), `-` ("Alejar") and reset ("Restablecer vista"; 3D adds the presets). Spanish accessible names, native `<button>`, tokens only, 44 px targets on touch, tab order after the chart. Hint text under the chart on first view only if `design.md` allows it, otherwise a `title` on the canvas.

## Rules and constraints

- Keyboard: `KeyAction` and `KEY_MAP` do not change. `+` and `-` stay as speed, so zoom by keyboard is the buttons (Tab to them, Enter or Space). No new global key. The table view (`TableToggle`) stays the accessible alternative to the spatial views.
- Drag or click: a pointer move of 4 px or less is a click (province selection keeps working exactly as today); more is a drag and must not select. Hover tooltips keep working.
- The navigation state (zoom, center or camera pose) lives in the view, not in the global store. It survives changes of year, scenario, filter and data (the year animation must not reset the camera), and it resets when the mode toggles 2D/3D or the scene changes.
- Camera and view math are pure functions in one module (`web/src/charts3d/camera.ts` for 3D, `web/src/charts/navState.ts` for the 2D limits): `orbit`, `pan`, `zoomAt`, `clamp`, `reset`. The renderer only applies their result. Per-frame code allocates nothing (`AGENTS.md` section 8).
- Extend `stage.ts` (it already has pointer and wheel handling) rather than importing three's `OrbitControls`: the 3D chunk budget in `web/budgets.json` stays as it is, and the math stays testable. If the chunk passes its budget, say so in the PR; do not raise the budget silently.
- Render on demand stays (no continuous loop). Damping or inertia only if it keeps on-demand rendering and is off under reduced motion and on the low quality tier.
- Pointer events only (one code path for mouse, touch and pen); `touch-action: none` on the canvas stays; the wheel handler calls `preventDefault` (the dashboard does not scroll).
- Cleanup: every listener added is removed in `dispose`; no WebGL context leaks (the existing cleanup test is extended).
- No new dependency. No change to data, selectors, the store shape, the story or the keyboard. No full screen popup (that is `fullscreen-viewer`). No new color: only tokens.

## Tests (write first, strict TDD for the math)

- **Pure functions, exact values**: `orbit` wraps the azimuth and clamps the polar angle at both limits; `pan` moves the target in the camera's right and up axes and clamps at the box; `zoomAt` keeps the point under the cursor fixed (check the world point before and after) and clamps at both radius limits; `reset` returns the start pose. Each with the positive case and each limit.
- **Click or drag**: a 3 px move selects, a 5 px move does not (3D map and 2D map, with the event sequences simulated).
- **Component (jsdom, renderer mocked)**: the three buttons exist with their Spanish names; `+` then `-` returns to the same zoom; reset restores the start state; changing the year prop leaves the pose unchanged; toggling the mode resets it.
- **2D**: the map option has `roam` on with the stated limits; the buttons dispatch the zoom actions (spy on the chart instance).
- **Cleanup**: unmounting a 3D view removes every listener added by the controls.
- **E2E** (software GL in headless Chromium, 1440x810 and 390x844): wheel on the 3D map changes the camera (expose it through one `data-` attribute, list it in the PR), reset restores it, the axe test passes with the buttons, the CSP spec still passes, nothing scrolls.

## Acceptance checklist

- [ ] Tests committed failing first where applicable, then green. `python scripts/precheck.py` passes; the e2e suite run or "e2e not run locally". CI result read or "pushed, CI not checked".
- [ ] 2D maps zoom (wheel and buttons) and pan; 3D views rotate with no azimuth limit, pan, zoom wider than before, and reset; selection by click still works.
- [ ] `KeyAction`, `KEY_MAP`, the store shape and the data code unchanged; no new dependency; the 3D chunk budget passes.
- [ ] The camera survives the year animation and filter changes; listeners and contexts are cleaned up on unmount; reduced motion respected.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (the feel of the controls on a real GPU and on a touch device, the zoom and pan limits, the label sizes at the new zoom range).
