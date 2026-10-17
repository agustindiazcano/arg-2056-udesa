# Task: `presentation-3d`

Status: **brief written, direction approved by the human**. It replaces `scene-forecast-map-3d` (superseded: that brief made 3D an optional variant of one map; the human decided 3D is the default presentation of the whole story). It is a program of several small PRs, not one. Each PR is its own branch `task/presentation-3d-<part>`.

Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `design.md`, `docs/ui.md`, `docs/performance.md`, `docs/geo.md`, `docs/archived/storytelling-substeps.md`, `andes-integration.md` and the code under `web/src/{app,scenes,story,charts,runtime,state}/` first. The visual and interaction reference is the proof of concept `test/dashboard_3d_PoC.html` (Three.js from a CDN, one HTML file, invented model). Read it for the look and the mechanics; do **not** copy its data model, its CDN, its Google font or its global-variable style.

Prerequisites: F2b merged (Spanish scenes, shared `SceneShell`, `TableToggle`, `FilterBar`, es-AR locale), and the human's confirmation of the open points in section 5.

## Goal

The app is a storytelling piece, not a statistics panel. The default experience is a **narrated 3D tour**: scenes the camera flies between, charts that transform into one another, and text that tells what is happening and reacts to what the visitor moves. The same 3D scene also has a free **explore** mode. The 2D charts stay exactly as they are: they are the data view and the accessible alternative.

| Layer | What it is |
|---|---|
| Tour (default) | A sequence of scenes with narration; play, pause, scrubber, jump to a step; camera, highlights and text defined per step. |
| Explore | The same 3D scene, free: filters, scenario sliders, click on a province, orbit. |
| 2D | Unchanged. Data tables remain the text alternative of every 3D chart. |

## Out of scope (do NOT do)

- No change to the 2D charts, their builders or their tests, except what a shared component needs (`SceneShell`, `TableToggle`).
- No new data, indicator or selector: every 3D chart draws what an existing selector or builder already yields. `null` is never a height or a size; it is drawn as no data.
- No second 3D library. Three.js, exact version, bundled; nothing from another origin (no CDN, no Google fonts); CSP unchanged (no `eval`).
- No change to `KeyAction`, `KEY_MAP` or the store shape beyond what the PRs below list; the existing `mode` field and `toggle3D` action are the switch.
- No final story text: drafts are written from the mock data, marked as drafts, and the human signs them off. Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence a checker.

## Parts (one PR each, in this order)

| # | Part | What | Depends on |
|---|---|---|---|
| 1 | `presentation-3d-engine` | A `web/src/three/` module: renderer, scene, orbital camera with presets and keyboard access, lights, canvas-texture labels, resize, disposal, tween helpers, `useQuality` presets, `WebGLRequired` fallback, reduced-motion rule. Pure logic (camera math, easing, label layout) under TDD. One chunk. | F2b |
| 2 | `presentation-3d-shell` | The tour/explore switch and the dock (play, scrubber, speed, step chips) on the existing control bar; `mode` decides 3D (default) or 2D; the 2D view is the fallback for no WebGL2, low tier and reduced motion. First-load budget decision (section 5). | 1 |
| 3 | `presentation-3d-charts-a` | 3D versions of the forecast fan, the province bars and the province map (extruded, heights from `mapSelectors`; reuse `web/src/geo/`). Transitions between them. | 1, 2; real province geometry for the map |
| 4 | `presentation-3d-story` | The step runner drives camera, highlight and caption in the tour; interactive text (readouts that change with the sliders); draft steps from mock data, marked for sign-off. | 2, 3 |
| 5 | `presentation-3d-charts-b` | The rest: long-run lines, treemap, simulator, AI scene. | 3 |
| 6 | `andes-integration` and the country-to-zone map | Reuse the engine; they keep their own briefs. | 1; terrain outputs |

## Behavior rules (all parts)

- **Accessibility**: each canvas has `role="img"` and an `aria-label` from the same summary string as its 2D chart; the table view stays one control away; every tour control is a real button; focus is never trapped; Space toggles play only when no control has focus.
- **Reduced motion**: no camera flights or scene transitions; steps change by cut. `prefers-reduced-motion` is read through `useReducedMotion`.
- **Quality**: `useQuality` and `QUALITY_PRESETS` set the pixel ratio cap, geometry detail and label count. Tier `low` or no WebGL2 shows the 2D view with the `WebGLRequired` notice.
- **Cleanup**: contexts, geometries, materials and textures disposed on unmount and on leaving 3D; a mount/unmount test per scene.
- **Data**: precomputed per frame where it is hot; no allocation per frame in the render loop.
- **No color literal** outside the token files; 3D materials read the tokens (`tokens.ts`).

## Tests (write first, per part)

Exact values for the pure logic (camera, easing, heights, scaling), selection wiring, fallback conditions, disposal, the aria-label strings, a jsdom test with the renderer mocked, and an e2e test under the real CSP (3D with software GL, play the tour, select a province, no console error, no foreign request, axe clean).

## 5. Human decisions to confirm before part 2

| Id | Question | Recommendation |
|---|---|---|
| D-3d-1 | Three.js bundled as the one 3D stack (not MapLibre) | Yes |
| D-3d-2 | The first load now carries Three.js: raise the `web/budgets.json` main or chunk budget on purpose, or show a light 2D/poster first and load 3D right after | Poster first, 3D streamed in; raise `chunk_max` deliberately |
| D-3d-3 | Province geometry source (needed by part 3). The PoC embeds 24 simplified provinces: confirm where they came from and their license, or use Natural Earth admin-1 | Natural Earth admin-1 (public domain), via `npm run build:geo` |
| D-3d-4 | Typeface for labels and UI (no Google fonts: self-hosted or system) | System stack for now |
| D-3d-5 | Tour length and which scenes belong to it | Draft from the PoC: mining, mix, GDP, per capita, ranking, map |

## Acceptance checklist (per PR)

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes; e2e run or "e2e not run locally". CI read or "pushed, CI not checked".
- [ ] 2D unchanged; no new data or selector; `null` never a height; keys and store unchanged beyond the listed.
- [ ] CSP spec and bundle budgets pass (or the raised budget is explicit and approved). `LASTCONTEXT.md` overwritten; `PENDING.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (the look against the PoC, the narration drafts, the budget).
