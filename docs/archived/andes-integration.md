# Task: `andes-integration`

Branch: `task/andes-integration`. One PR (split it into two if the diff passes about 1,500 changed lines: first the scene without particles, then the particles). Read `AGENTS.md` (the Andes scene, the stack and the frontend rules of sections 3 and 8), `LASTCONTEXT.md`, `PENDING.md`, `design.md`, `docs/terrain.md`, `docs/performance.md`, `docs/deploy.md` (the CSP: section 1), `docs/data-dictionary.md`, `data/schemas/andes_events.schema.json`, `data/mock/andes_events.json`, `web/src/terrain/` (loader, decoder, sampler), `web/src/runtime/` (`useQuality`, `QUALITY_PRESETS`, `WebGLRequired`, `useReducedMotion`), `web/src/state/` (store, reducer, `useTicker`, keys), `web/src/types/campaign.ts`, `web/src/story/`, `web/src/scenes/andes/index.tsx` (the placeholder) and the proof of concept `test/map_test1.html` first.
Prerequisites: `performance-a11y` and `deploy` are merged (they are). **Human inputs that must exist before this task starts, otherwise stop and tell me which:**
1. The terrain outputs committed in `web/public/terrain/` and verified against the Andes facts (`docs/terrain.md`, `PENDING.md` item 10b).
2. The renderer decision (see "Open decisions" below) and, if it is the proof of concept, the human's confirmation that it is the starting point.
3. The verified Andes event data for real runs (`data-andes`); the task works on the mock.

## Goal

The Andes scene of `AGENTS.md`: the crossing of the Andes in 1817 on real terrain, the army as moving particles, a side data panel, a speed control, battle selection with a camera fly-to. It must run inside the app's rules: the keyboard map, the state machine, the quality tiers, reduced motion, the Content-Security-Policy and the bundle budgets. This task is **integration**: the visual language and the art direction are the human's (the proof of concept shows them); this task makes them a tested, accessible, budgeted part of the app.

Strict TDD for every piece of logic (the path, the army positions, the timeline, the camera, the selectors). Rendering code is verified by its inputs and outputs and by the e2e run, not by pixels. Atomic commits. Before every push run `python scripts/precheck.py`.

## Open decisions (the human answers before the task starts; the recommendation is first)

| # | Decision | Options |
|---|---|---|
| D-andes-1 | The renderer | (a) Keep the proof of concept's stack: **Three.js**, bundled (not from the CDN it loads today), drawing the baked terrain; (b) the stack of `AGENTS.md`: MapLibre GL terrain + deck.gl layers, which adds two large dependencies and a map style that must be served from the same origin; (c) a mix. Recommendation: (a). It matches the prototype the human approved, adds one dependency, and avoids a map style and tiles under the CSP |
| D-andes-2 | The dependency | `three` pinned to an exact version, bundled only into the Andes chunk. The prototype uses r128 from a CDN; the integration uses the current stable release and the human re-checks the look |
| D-andes-3 | Terrain source of the geometry | the baked terrain of `web/src/terrain/` (real, from the DEM) replaces the prototype's procedural noise. Recommendation: yes, that is the point of the terrain task |
| D-andes-4 | Language | the prototype is in Spanish with `toLocaleString('es-AR')`; the app has `APP_LOCALE` and English labels today. Follow the app's constant (decision 1 of `design.md`) |

## Out of scope (do NOT do)

- No art direction: do not redesign the look of the prototype, invent a palette or restyle the panels beyond mapping them to the design tokens (colors only from `web/src/styles/tokens.ts` and `tokens.css`; the prototype's own colors become tokens only with the human's approval, listed in the PR).
- **Nothing from another origin**: no CDN scripts, no external tiles, fonts, glyphs, sprites or textures (the e2e fixture and the CSP both fail on it). `script-src 'self'`, no `unsafe-eval`: the renderer library and any shader code must work under that policy (`worker-src blob:` and `img-src blob:` are allowed for it). If the renderer needs a looser directive, stop and tell me; do not loosen the policy.
- No change to the `KeyAction` union, `KEY_MAP`, the store shape or the `Scene` type. Use the existing actions: `Space` play and pause, `+` and `-` speed, the arrow keys change scene (not the camera). Camera and battle selection use controls inside the scene (buttons, a list), keyboard operable, and the Escape behavior of the shell.
- No new data and no invented historical fact: every number on screen comes from `andes_events.json`, the terrain metadata or arithmetic on them; contested figures are shown as ranges with their note (the schema has `estimate_range` and `note`). No claim about the crossing that is not in the data.
- No per-frame projections (`AGENTS.md` section 8): the army positions come from **precomputed arrays** indexed by time; a test shows each frame reads from the array and computes nothing new. Heavy precomputation runs once at load or in a Web Worker.
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Files (adapt to the decision above)

```
web/src/scenes/andes/index.tsx            the scene (replaces the placeholder; default export; React.lazy as the registry does)
web/src/scenes/andes/data.ts              events, columns, the route as typed, validated data
web/src/scenes/andes/timeline.ts          campaign day to position, altitude, distance (pure)
web/src/scenes/andes/particles.ts         the precomputed army arrays and the per-frame lookup (pure)
web/src/scenes/andes/camera.ts            camera modes and the fly-to as a function of time (pure)
web/src/scenes/andes/Renderer.tsx         the only file that touches WebGL: creates, resizes, renders and disposes
web/src/scenes/andes/Panel.tsx            side data panel, battle list, speed, controls
web/tests/unit/andes*.test.ts(x)   web/e2e/andes.spec.ts
```

## 2. Behavior

- **Capability and quality**: the scene reads `useQuality()`. `WebGLRequired` renders when WebGL2 is missing (the scene then shows the data panel and the battle list without the 3D view, fully usable). `QUALITY_PRESETS[tier]` sets the particle count (`particleScale`), the pixel ratio cap (`pixelRatioCap`) and the terrain detail (`terrainDetail`); `downgrade(frameTimes)` is fed with measured frame times so the tier can drop when the median frame is slow; it never rises. `?quality=` and `?debug=1` keep working.
- **Reduced motion**: `useReducedMotion()` turns off camera flights, particle drift and the intro; the army still advances with the campaign clock (time playback is not decorative); selecting a battle jumps the camera.
- **Time**: the shared `playing`, `speed` and `yearFloat`-style clock drive the campaign day through `useTicker`; read how the other scenes map it and map the 1817 campaign days (`day_of_campaign` 0 to 365 in the schema) onto it without changing the store. A pause stops everything; the speed control is the shared one (`SPEEDS`).
- **Battle selection** with camera fly-to: a list and the markers; selecting one moves the camera (eased, 600 ms, none under reduced motion), shows the side panel for it (name, date and its precision, place, elevation, forces by side with their `note` when a count is `null`, the estimate range) and sets nothing else. `Escape` closes the panel and returns the focus to the control that opened it (the pattern of `ProvinceFilter`).
- **Army as particles**: positions along the route from the timeline, count scaled by `particleScale`, color and size from tokens; units are shown as numbers in the panel, never inferred from the particle count.
- **Cleanup**: the WebGL context, textures, geometries, listeners, the `ResizeObserver` and any timeline are disposed on unmount, and a test mounts and unmounts the scene several times and asserts nothing leaks (the same pattern as the `*SceneDispose` tests).
- **Loading and errors**: the terrain is fetched through `loadTerrain` with the `?v=` versioning; a failure shows a message and the data panel still works, never a blank screen or an unhandled error.
- **Accessibility**: the canvas has `role="img"` and an `aria-label` that states the current day and the main fact; every control is a real button or input with a name; focus order is logical; the table view of the events (the `DataTable`) is the text alternative of the whole scene; contrast and axe checks pass without new exceptions.

## 3. Tests (write first)

- **Timeline**: day to position, altitude and distance with hand-computed values on a three-point route; the endpoints; clamping outside the campaign; monotone distance.
- **Particles**: counts per tier; positions equal the precomputed array at the frame's index (no computation per frame, shown by a spy); determinism (fixed seed for any jitter, none in the positions).
- **Camera**: each mode's pose is a pure function of time and target; the fly-to reaches the target in the stated time and is instant under reduced motion.
- **Data**: the mock `andes_events.json` parses and the scene's selectors give the numbers a test computes by hand; `null` counts show their note and never 0.
- **Scene (jsdom, the renderer mocked behind `Renderer.tsx`)**: the panel for a selected battle; the keyboard (`Space`, `+`, `-`, `Escape`) behaves as the shell says; without WebGL2 the fallback shows; mount and unmount leak nothing; reduced motion removes the flights.
- **E2E** (software GL in headless Chromium): the scene loads under the real CSP (extend `web/e2e/csp.spec.ts` with the scene, no violation), the axe test passes, selecting a battle shows its panel, `?quality=low` shows the reduced-quality message, no console error and no request to another origin.
- **Budgets**: `npm run check:bundle` passes; the renderer library is in the Andes chunk only and is not in the initial load (the manifest assertion of `check:bundle` covers scene chunks; add the new vendor chunk to its list of forbidden initial files). Update `web/budgets.json` with the measured values in a separate commit and say so in the PR.

## 4. Acceptance checklist

- [ ] Tests committed failing first where applicable, then green. `python scripts/precheck.py` passes; the e2e suite run or "e2e not run locally". CI result read or "pushed, CI not checked".
- [ ] No request to another origin; the CSP spec passes with the scene; the bundle budgets pass; the initial load does not contain the renderer.
- [ ] Per-frame code reads precomputed arrays; cleanup verified; reduced motion and the quality tiers wired; keyboard map unchanged.
- [ ] Every figure comes from the data; nothing about the crossing invented; the prototype's colors listed in the PR if any became tokens.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (`scene-andes` and `andes-integration` done; visual debt listed). The dependency (D-andes-2) justified in the PR.
- [ ] PR description: what changed, what was verified, what the human must verify (the look against the prototype, the figures against the original sources, performance on a weak device with `?quality=low`).
