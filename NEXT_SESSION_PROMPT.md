Go to main, pull, and start the next 3D task of the Andes scene: **the combat animation** (branch `task/andes-combat`), unless the human names another task first.

Setup
- Create the branch from an up-to-date `main` (never push or merge to `main`; a human approves every PR).
- Read in this order: `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md` (item 7), `andes-integration.md`, `docs/terrain.md` (only if you touch the terrain), `docs/decisions.md` (`D-3d-6`: 3D is the priority of the visual work; `D-andes-1` to `D-andes-7`).
- Always check the project root folder for missing docs.

State of the repo
- Merged: the Andes scene with the made-up terrain (PR #49), the cinematic stage with the column of figures (PRs #50 and #51), and PR #52 (`task/andes-army-models`, CI green: web, e2e, python, data, terrain): reworked figures, day sky, the interface in glass over a full-screen canvas, cameras (`free | follow | cine | aerial | map`), floating names of the places, minimap, altitude profile, progress of the crossing in percent in the bottom bar, an oxygen saturation (SpO2) tile, graphics options, a light snowstorm, more clock time on the pass.
- Where things are (`web/src/scenes/andes/`): `Renderer.tsx` is the only file that touches WebGL (lazy chunk); everything else is pure and tested: `camera.ts` (poses, modes, `rigFor`, `steered`, `lookPoint`), `column.ts` and `figureParts.ts` and `figures3d.ts` (the column of figures as one instanced mesh), `reliefField.ts` and `relief.ts` (procedural ground, trail, patches), `detail3d.ts` (chunks and pines), `timeline.ts` (`paceClock`, `paceProgress`), `snow.ts`, `graphics.ts`, `labels.ts`, `minimap.ts`, `profile.ts`, `physiology.ts`. The shell side: `web/src/app/Hud.tsx` (the `progress` slot replaces the year in the Andes; `hud-year` stays in the page, hidden, because the clock and e2e read it), `App.tsx` (`#overlay[data-scene]` and the measured `--chrome-h` and `--bar-h`), `dashboard.css` (the Andes block at the end).
- The data is still mock (`source: "MOCK"`, events "(ilustrativo)") and the terrain is made up: the real DEM is a human step (`PENDING.md` item 6).
- Open decisions that are the human's, not yours: flag colors, the height of the peaks (`RELIEF_AMPLITUDE`), `DWELL_MAX`, the SpO2 curve, the blue of the uniforms, `D-polish-3`.

Combat animation: scope
- Forces from the data (`forces` of the events, `men` per side) as two groups of figures that clash at the event of the combat. No invented battle detail: the screen must say the picture is schematic (reuse `figuresNote`) and a count that is not known says "sin dato", never 0.
- Reuse the figures and the level of detail of the column; keep it one instanced mesh per group; respect `useQuality`, `QUALITY_PRESETS`, `useReducedMotion` and the graphics options (`resolveGraphics`).
- Out of scope: Chile and Peru, army particles beyond the combat, a `.glb` model, real terrain, the model and data tasks.

Things to know
- Do not change `KeyAction`, `KEY_MAP` or the store shape.
- The e2e fixture fails on console errors, failed requests and any request to another origin. CSP is strict (no CDN, no eval, no Google fonts): the proof of concepts in `test/` load Three.js from a CDN, so copy ideas, not code.
- Nothing historical is claimed by the figures (colors, mix, counts are a schematic picture); keep that note. The SpO2 tile is an estimate by altitude and says it depends on the person.
- If a contrast check fails, do not change a color: stop and report the token pair and ratio.
- WebGL pitfalls found: a `Points` material takes the scene fog by default (set `fog: false` or the flakes vanish in the haze); the camera has no change hook, so scene-side work that must follow it runs in the stage `beforeRender`; a continuous loop (`stage.loop`) renders every frame, start it only while it is needed.

How to work
- Strict TDD: a failing test before each implementation, pure logic in its own module with tests; only the renderer is untested by unit tests (check it by eye).
- Atomic commits `type(scope): summary` with the Co-Authored-By trailer. No new dependencies. Never silence a checker (`as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`).
- Tests: run only the test files of what you changed, plus `tsc` and `eslint` on the folders you touched, with the output filtered (`grep`/`tail`). Do NOT run the full vitest suite or the full Playwright run locally, and never both at once: the full suite takes about 3 minutes and under load `liveRegions`, `economyScene` and `resourcesScene` time out at 5 s (alone they pass). Push and let the CI run the rest; read its status (`gh pr checks`) before saying it is green, otherwise write "pushed, CI not checked".
- To see the scene: a temporary Playwright spec in `web/e2e/` plus a copy of `playwright.config.ts` with another port (for example 4199, because 4173 may already serve an old build), screenshots into the scratchpad folder, and delete both files before committing. Use `?quality=high` and the buttons of the scene; set the progress slider with the native value setter and an `input` event.
- Windows notes: long Git Bash heredocs with quotes break: write scripts and large files with the Write tool (Write needs a prior Read of an existing file) and run them; normalize CRLF in text comparisons; open Python files with `encoding="utf-8"`; never `git add -A` inside `web/`; the local `main` can be stale: `git fetch` and compare with `origin/main` before saying something is or is not merged.

Finish
- Overwrite `LASTCONTEXT.md`, update `PENDING.md` and this file. Push the branch, open a PR with "what changed / what was verified / what the human must verify", then check its CI.
- Report in Spanish, with tables and traffic lights (🔴 blocking, 🟡 next, 🟢 later, ⚪ backlog); answer a single fact in a sentence.

After this task (order of `LASTCONTEXT.md`): `fullscreen-viewer` (D9), review the projection test and decide which effects go into the real views, the flat 3D views (treemap, rank history, doubling curve), then F5 (3D map country to zone), F7 (live simulation), F8 (polish). The model and data tasks wait for the human's research (`PENDING.md` items 3 and 12).
