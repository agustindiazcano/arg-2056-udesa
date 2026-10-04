# PENDING

Every task below has a brief (`<slug>.md` in the repository root) and a prompt (`TASKS.md`). The list of all tasks, with their blockers, is `roadmap.md`; the status table is "Next Steps" in `TASKS.md`. READY = can start now. BLOCKED = needs what the line says.

## Task queue (in order)

1. [x] `data-pipeline`: scripts and processed datasets with `source` + `retrieved_at` (resources, economy, population, provinces).
2. [x] `shell`: Vite app, tabs, Zustand store, keyboard map, scene state machine, 2D/3D toggle, province filter.
3. [ ] **Model** (`docs/model-design.md` section 8; the 14 tasks replace the old `model-py`, `backtest` and `model-ts` lines). Briefs written.
   1. [ ] `model-params`: BLOCKED, the human answers `D-res-3` (nine or ten value-added constants; the design lists ten names and counts nine)
   2. [ ] `model-population-hardening`: READY (audit F5, F8, F9)
   3. [ ] `population-age-contract`: READY
   4. [ ] `model-population-drivers`: BLOCKED by 1, 2, 3
   5. [ ] `model-growth-core`: BLOCKED by 1, 2
   6. [ ] `model-hdi`: BLOCKED by 1, 4, 5; the goalposts are `needs_source`
   7. [ ] `model-resources`: BLOCKED by 1 (works on mock)
   8. [ ] `model-ai-overlay`: BLOCKED by 1 (5 should be merged)
   9. [ ] `model-montecarlo`: BLOCKED by 4 to 8; real runs need parameter values
   10. [ ] `backtest-baselines`: READY for the code; real runs need the series of `data-economy-population`
   11. [ ] `backtest-run`: BLOCKED by 9, 10 and the verified real series 1990 to 2025
   12. [ ] `sensitivity`: BLOCKED by 9 (the published result needs real ranges)
   13. [ ] `model-ts-port` (optional): BLOCKED by 5, 8
   14. [ ] `model-provinces`: BLOCKED by 9
4. [x] `scene-resources`, `scene-forecast`, `scene-economy`, `scene-sandbox`: merged.
   - [ ] **Human step before `scene-forecast-map` shows a map**: choose the source, register the file, fill `geo/config.json`, run `npm run build:geo`, review the metadata, commit the outputs in `web/public/geo/`. See `docs/geo.md`. When done, remove `MISSING_FOR_NOW` in `web/e2e/csp.spec.ts`.
   - [x] `scene-forecast-map`: province choropleth, level and change modes, markers, table view (with no geometry committed the scene shows the ranking and the fallback message). The `mode` field of the store (2D/3D) is ignored by the map.
   - [ ] `scene-forecast-map-3d` (optional, draft brief): BLOCKED by `andes-integration`, the real geometry and the human's go.
   - [ ] **Human task before release**: the real era list with sources in `web/src/content/eras.ts` (three placeholders today; the release gate `scripts/check_no_mock.py --content` fails until they are replaced).
   - [ ] (optional) plug the sandbox into the reduced TS model (`model-ts-port`).
5. [ ] `scene-ai-revolution`: READY. Brief written (works on mock data; wires `ai_estimates.json`).
6. [ ] **Human step before `andes-integration`**: download the DEM, register it with `python -m datapipe register`, set the bounding boxes in `terrain/config.json`, run `python -m terrain bake`, run `python -m terrain verify` against the Andes facts, commit the outputs in `web/public/terrain/`. See `docs/terrain.md`.
7. [ ] `andes-integration` (the old `scene-andes`): BLOCKED by the terrain outputs and the renderer decision (`D-andes-1` to `D-andes-4`; the proof of concept in `test/map_test1.html` is Three.js loaded from a CDN, which the CSP forbids, so it must be bundled). Must use `useQuality`, `QUALITY_PRESETS`, `WebGLRequired` and `useReducedMotion` (`web/src/runtime/`).
8. [x] `references-page`, `storytelling-substeps`, `integration`: merged.
   - [ ] **Human task before release**: write the real story steps with sources in `web/src/content/steps/index.ts` (18 placeholders; the gate fails until they are replaced). Register real sources in `data/processed/sources.json`.
   - [ ] (later) let steps control scene-local settings; campaign day in `StepFocus` with `andes-integration`; load the references registry in the shell and pass `registryIds` to `StoryCaption`.
   - [ ] **Human step: confirm or tighten `web/budgets.json`** (main is now about 102,293 B gzip against a 134,144 B budget after the precompiled validators; references 99,986 B against 131,072).
   - [ ] At release: delete the CI step `Release gate fails on mock data` and the mock assertions in `web/e2e/boot.spec.ts` and `web/e2e/references.spec.ts` (release-checklist item 1).
   - [ ] (later) the sandbox shows "(error +0.2%)" in its copy; the e2e text check therefore looks for "error loading", not "error".
9. [x] `performance-a11y` (PR #29): scene code splitting, tree-shaken ECharts, quality tiers, reduced motion, accessibility and axe in e2e.
   - [ ] **Human: tune the tier thresholds and `QUALITY_PRESETS` on real weak devices** (assumptions, `docs/performance.md`).
   - [ ] **Human: decide `--state-critical` (#d03b3b) as text color: 4.05:1 on `--page`, 3.62:1 on `--surface`, 3.93:1 on `--color-bg` (below 4.5).** Used by the "Error loading data." messages. Also `D-polish-5`.
   - [ ] **Human: design.md asks for a 2px #3987e5 focus ring; the code uses `--color-focus` #ffc107 (kept).** Also `D-polish-4`.
   - [ ] Lighthouse run on the production build (release checklist, section 4).
10. [x] `deploy` (PR #34, host: Vercel): header config, strict CSP, precompiled validators, data cache busting, page metadata, release job, smoke script (`docs/deploy.md`).
   - [ ] **Human deliverables**: description and final URL (`web/src/content/meta.ts`), `web/public/og.png` (1200x630 PNG), `web/public/favicon.svg`.
   - [ ] **Human: first Vercel deploy, then `python scripts/smoke_deployed.py <url>`**; check the console for CSP violations from Analytics and Speed Insights.
   - [ ] Not verified on Vercel: precedence of overlapping header rules (`/data/_version.json` must be `no-cache`).
   - [ ] After editing a schema in `data/schemas/`, run `npm run gen:validators` in `web/` and commit `src/validation/generated.js`.
11. [x] Done outside the briefs: `vercel-config` (PRs #30, #31), `vercel-analytics` (PR #32), `visits-archive` (PR #33).
   - [ ] **Human: enable Web Analytics and Speed Insights in the Vercel project.**
   - [ ] **Human setup of the visits archive: Vercel token and ids as GitHub secrets, enable PR creation for Actions, run the workflow once by hand** (`docs/visits.md`). Not verified against the real Vercel API (same-day `since` and `until`, response fields, `limit`, plan).
12. [ ] **Real data** (all BLOCKED by the human's research and verification of 10 URLs and 3 numbers per scope):
   1. [ ] `data-economy-population` (also needs `D-gdp-1` and `population-age-contract`)
   2. [ ] `data-resources`
   3. [ ] `data-andes`
   4. [ ] `data-research-inputs` (also needs the research files' format documented)
13. [ ] `mutation-testing` (optional): READY.
14. [ ] `polish`: BLOCKED by `D-polish-1` to `D-polish-7` and by the model and data tasks.
15. [ ] `docs-submission` (draft brief) and `demo-video` (optional, draft brief): BLOCKED by the contest's rules.

## Data to verify (human, against original source)

- [ ] (empty; the app shows mock data only)

## Model assumptions (record in `docs/assumptions.md`)

- [ ] 34 entries A01-A34 in `docs/assumptions.md`, all unsourced. Human decides: A10, A13, A15, A16, A24, A26, A31, A32, A33. `model-population-drivers` will add one more (the working-age range 15 to 64).

## Visual debt (deliberately left rough until `polish`)

- [ ] Sandbox scene: look and feel against `design.md`, slider layout, the band color (blue token at BAND_ALPHA), the worked-example panel.
- [ ] Economy scene: look and feel against `design.md` (home country in `ink` and peers in `muted`), era band styling, the chips, the year slider, country labels are ISO codes (the dataset has no names).
- [ ] Province map: the PLACEHOLDER red arm of the diverging ramp (`D-polish-3`), the hatch of the no-data fill (design.md asks for a hatched fill; only the baseline color is applied), the selected-province border may be partly covered by neighbours, the illustrative Malvinas outline.
- [ ] Forecast scene: look and feel against `design.md`, history line and "History | Forecast" divider (mock has no history), plain buttons, layout spacing.
- [ ] Forecast ranking: rows beyond top 10 are hidden, a selected province outside the top 10 is not shown.
- [ ] Story caption panel: look and feel against `design.md`, dot hit targets are small, the "Placeholder" tag uses the warning token, no transition on collapse, the panel covers the bottom of the 3D stage.
- [ ] Visits section of the References page: plain table, flags are emoji (letters on Windows browsers).

## Blocked / questions

- [ ] `D-res-3` (blocks `model-params`): ten value-added constants `v_r` (recommended, includes `other`) or nine as the design counts.
- [ ] `D-andes-1` to `D-andes-4` (block `andes-integration`): renderer (Three.js bundled, MapLibre + deck.gl, or a mix), its dependency, the terrain as geometry source, the language of the scene.
- [ ] `D-polish-1` to `D-polish-7` (block `polish`): UI language and locale, typeface, the real red arm, focus ring color, `--state-critical` as text, motion library (GSAP), scope of the pass.
- [ ] `D-gdp-1` (blocks `data-economy-population`): GDP basis (constant USD and its base year, market versus PPP).
- [ ] Competition deadline and evaluation criteria (block `docs-submission` and `demo-video`).
- [ ] `storytelling-substeps` decisions (human), default taken in brackets: keys `PageDown`/`PageUp`/`Home` [taken]; entering a scene restarts its story at step 1 [taken]; the story does not cross scenes except the "Next scene" button on the last step [taken]; caption panel at the bottom [taken]. Resolves open decision 5 of `docs/design.md` once confirmed (the file was not edited).
- [ ] `geo-provinces` decisions (human): source dataset and license; `target_max_bytes` and `max_area_change_pct` after seeing real results. Decided: the territory is the continental provinces plus an imprecise Malvinas outline (`docs/decisions.md` D-geo-1); the registered layer must exclude the Antarctic sector and far islands.
- [ ] `terrain-bake`: dependency exception (numpy, rasterio, Pillow pinned, only under `scripts/terrain/`) and the local precheck SKIP when they are missing: human decision. Earth radius 6,371,008.8 m for the hillshade was chosen by the tool.
- [ ] Mock `forecast_output` has province series only for `resource_production` (18 provinces, 6 resources); GDP, GDP per capita, population and HDI have national series only, so the province ranking is empty for them. Not extended, per the brief.
- [ ] Acceptance item "arrows moving the year" conflicts with `KEY_MAP` (left and right arrows change scene); the year moves with play (Space) or the store. `KEY_MAP` was not changed.
- [ ] Open decisions D-scen-1 to D-data-1 in section 9 of `docs/model-design.md`.
- [ ] `docs/sources.md` and `docs/research-prompts.md` do not exist; no parameter can have a `source_id` yet. `data-andes`, `data-resources` and `data-economy-population` create or extend `docs/sources.md`.
- [ ] `data/mock/` has no research mocks (`ai_estimates.json` and the other four are generated only in tests); `scene-ai-revolution` wires `ai_estimates.json`.

## Done

- [x] `deploy`: header config, strict CSP, precompiled validators (Ajv standalone), data cache busting, metadata, release job, smoke script, `docs/deploy.md`.
- [x] `visits-archive`, `vercel-analytics`, `vercel-config`: see item 11.
- [x] `performance-a11y`: see item 9.
- [x] `integration`: data registry and smoke test, bundle budgets, Playwright suite, `expect_failure.py`, CI job `e2e`, `docs/release-checklist.md`. Fixed a real bug found by the suite: scene controls were not clickable with the mouse (`pointer-events` inherited from the overlay).
- [x] `storytelling-substeps`: story layer (types, `applyFocus`, `stepDeviates`, `validateSteps`, step actions, three keys, caption panel, runner, 18 placeholder steps) and the extended placeholder gate.
- [x] `scene-sandbox`: sandbox scene (sliders, presets, doubling curve, tiles, table views); illustrative arithmetic, not the model.
- [x] `scene-economy`: economy scene and the placeholder era list with its release gate.
- [x] `scene-forecast-map`: province map in the forecast scene. Needs the real geometry for the manual check.
- [x] `geo-provinces`: build tool (`web/scripts/geo`), schemas, typed loader (`web/src/geo`), `docs/geo.md`. No real geometry committed.
- [x] `terrain-bake`: terrain baking tool (`scripts/terrain`), metadata schema, web loader (`web/src/terrain`), CI job `terrain`, `docs/terrain.md`. No real terrain committed.
- [x] `references-page`: sources and attributions page, build step and release gate.
- [x] `research-contracts`: Draft 2020-12 schemas for research, TS types, mock data generation and precheck CI gates.
- [x] `projections-contract`, `composition-contract`, `forecast-contract`, `contract`, `mock-data`, `precheck`: see their briefs.
- [x] `model-design` and `audit`: `docs/model-design.md`, `docs/assumptions.md`, `docs/decisions.md`, `docs/audits/main.md`.
- [x] The 24 remaining briefs and their prompts (`task/briefs`).
- [x] Folder tree and context files scaffolded.
- [x] model-population: population cohorts model and TS port parity test (to be hardened by `model-population-hardening`).
