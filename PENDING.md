# PENDING

Every task below has a brief (`docs/tasks/<slug>.md`, historical briefs in `docs/archived/`) and a prompt (`docs/TASKS.md`). The list of all tasks, with their blockers, is `docs/roadmap.md`; the status table is "Next Steps" in `docs/TASKS.md`. READY = can start now. BLOCKED = needs what the line says.

## New corrections (`test/correcciones-nuevas.png`, plan in `docs/action-plan-correcciones-nuevas.md`)

- [x] Slide 4: use the existing Natural Earth 1:10m Malvinas outline on both Latin America maps, as non-selectable no-data geography. Branch `task/malvinas-slide4`.

Order: C8, C7, C2, C3, C4, C5, C1, C6.
- [x] C8 `map-zoom-limits`: ZOOM_MAX 8 -> 32 in `web/src/charts/navState.ts` (country and department maps); tests updated. Branch `task/map-zoom-limits`.
- [x] C7 `map-drill-transition`: smooth transition between country, province and department. Camera glides to the selected province (`animationDurationUpdate` 450 ms, cubicInOut) and the drawn map settles in (fade + scale) when it swaps country <-> departments; instant with reduced motion. `web/src/charts/drillTransition.ts`, tests `drillTransition.test.tsx`, `mapDrillTransition.test.tsx`. Branch `task/map-drill-transition`.
- [x] C2 `res-sector-filter-panel`: pure selector `provinceSectorBreakdown` in `provinceSectorBreakdown.ts` and updated `ResourcesStep.tsx` so selecting a province with a sector filter shows that sector's detailed provincial composition (e.g. minerals for mineria) instead of multi-sector breakdown; hidden cleanly when below threshold. 12 unit tests passing in `provinceSectorBreakdown.test.ts`. Branch `task/res-sector-filter-panel`.
- [x] C3 `res-province-drilldown`: selecting a province shows department ranking if department-level data exists (e.g. Salta, San Juan, Catamarca, Jujuy, Santa Cruz), otherwise falls back to mineral/sector breakdown of that province (e.g. Rio Negro). Implemented in `provinceDrilldown.ts` and `ResourcesStep.tsx`; 7 tests in `provinceDrilldown.test.ts`. Branch `task/res-province-drilldown`.
- [x] C4 `res-department-projects`: clicking a department (in chart bars or on the map) selects it and expands registered mining projects (name, company, mineral, status, investment/capacity); if no projects exist, nothing extra is shown. Integrated in `ProvinceMap.tsx` and `ResourcesStep.tsx`; tests in `resourcesStepDrilldown.test.tsx`. Branch `task/res-province-drilldown`.
- [x] C5 `map-search`: search by province or department with autocomplete, keyboard navigation, normalization (accents/case) and seamless drilldown on the map. Branch `task/map-search`.
- [x] C1 `res-minerals-extend`: added copper (116.7 Mt), boron (3rd world reserve), and molybdenum (2.2+ Mt) to mining totals and provincial breakdowns; added Taca Taca with NI 43-101 parameters; enabled search by mining project in MapSearch. Branch `task/res-minerals-extend`.
- [x] C6 `province-profile-slide`: replaced mock data with audited official series for all 24 provinces (PBG de DNAP/INDEC, Empleo privado y público de OEDE/SIPA, Pobreza e indigencia de EPH/INDEC, Coparticipación efectiva real de Min. Economía/DNAP, Tasa de criminalidad de SNIC/Min. Seguridad, Exportaciones OPEX/INDEC, Población Censo 2022). Branch `task/data-province-profile`.
- [x] `andes-uniform-models`: 3D GLB models for San Martín, blue soldiers, and red soldiers with muskets mounted on backs; "Modelos detallados" toggle button in Andes scene; "Ver uniformes" showcase popup in navbar (90vh height with zoom controls); 6-figure march formation (San Martín + 5 soldiers: 3 blue, 2 red) in AndesIntro above 1817; San Martín + 2 grenadiers escort on "Cruce de los Andes" button hover in Intro; README 3D model screenshots, index, repository links and Meshy AI free-to-use notice; slide 4 title updated to "El costo de acceder a la IA". Branch `task/andes-uniform-models`.
- [ ] **Data to verify (human)**:
  - Slide 1: the places in the ranking of the ten compared countries (`ranks` in `web/src/tour/worldGdp.json`, computed from the World Bank WDI by `scripts/build_world_gdp.py`) and the LCN aggregate growth (`regionAggregate`, World Bank `NY.GDP.MKTP.KD.ZG`): check a few years on the World Bank site.
  - C1: Recursos de cobre 116,7 Mt (Secretaría de Minería ARMINERA 2025 p. 8).
  - C1: Reservas y producción de boro (boratos): 3.ª reserva mundial (USGS Mineral Commodity Summaries / Secretaría de Minería).
  - C1: Potencial de molibdeno: 2,2+ Mt asociado a pórfidos de cobre (informes de Taca Taca, El Pachón, MARA).
  - C1: Taca Taca capex 4.232 M USD inicial (First Quantum NI 43-101 de 2026-02-19).
  - [x] C6: Figures for provincial profile slide (INDEC, Ministerio de Economía, Secretaría de Trabajo, SNIC - series oficiales S1 a S5 incorporadas y enlazadas con RefList).
  - [ ] Slide 7: Indicadores de desarrollo humano y social (Banco Mundial SP.DYN.LE00.IN, DEIS Min. Salud, PNUD HDR 2024, OCDE PISA 2022, INDEC EPH CBT, SEDLAC Gini, ref W1/D1/S3).
  - [ ] Slide 8: Rezagos históricos de difusión (CHAT/OWID), deflación de costos de inferencia (Stanford HAI AI Index 2025), cómputo de entrenamiento (Epoch AI) y desvíos de pronósticos PBI (FMI WEO/INDEC, ref D3/D6/D7/F1).


## Task queue (in order)

1. [x] `data-pipeline`: scripts and processed datasets with `source` + `retrieved_at` (resources, economy, population, provinces).
2. [x] `shell`: Vite app, tabs, Zustand store, keyboard map, scene state machine, 2D/3D toggle, province filter.
3. [ ] **Model** (`docs/model-design.md` section 8; the 14 tasks replace the old `model-py`, `backtest` and `model-ts` lines). Briefs written.
   1. [x] `model-params`: 35 parameter entries transcribed into `model/params/params.json` with Draft 2020-12 schema `params.schema.json`, frozen dataclass `Param`, loader and validation functions in `argmodel.params`, full unit test suite `test_params.py`, documentation `docs/params.md`, decision `D-params-1`. Branch `task/model-params`.
   2. [x] `model-population-hardening`: cohort model input validation and error raising (audit F5, F8, F9), identical error messages across Python and TS, hand-computed tests, parity tests against golden and invalid vectors. Branch `task/model-population-hardening`.
   3. [x] \population-age-contract\: 4 JSON Schemas, consistency checks in \scripts/dataset_checks.py\, deterministic mock in \scripts/gen_mock.py\, TypeScript types and parsers in \web/src/types/populationAge.ts\, schema registration in \web/src/validation/schemaNames.ts\ and regenerated validators, registry entries in \web/src/data/registry.ts\, documentation in \docs/data-dictionary.md\. Branch \	ask/population-age-contract\.
   4. [x] `model-population-drivers`: `drivers.py` (TFR and e0 paths, fertility and migration patterns, one-parameter relational life table), `projection.py` (loop over the validated cohort step), `calibrate.py` (`kappa_F`, training window only), tests, `docs/population-model.md`, assumption A35 (working age 15 to 64). Branch `task/model-population-drivers`. Human: check the relational table choice and A35; `kappa_F` needs real fertility data.
   5. [ ] `model-growth-core`: BLOCKED by 1, 2
   6. [ ] `model-hdi`: BLOCKED by 5 (1 and 4 are done); the goalposts are `needs_source`
   7. [ ] `model-resources`: BLOCKED by 1 (works on mock)
   8. [ ] `model-ai-overlay`: BLOCKED by 1 (5 should be merged)
   9. [ ] `model-montecarlo`: BLOCKED by 4 to 8; real runs need parameter values
   10. [ ] `backtest-baselines`: READY for the code; real runs need the series of `data-economy-population`
   11. [ ] `backtest-run`: BLOCKED by 9, 10 and the verified real series 1990 to 2025
   12. [ ] `sensitivity`: BLOCKED by 9 (the published result needs real ranges)
   13. [ ] `model-ts-port` (optional): BLOCKED by 5, 8
   14. [ ] `model-provinces`: BLOCKED by 9
4. [x] `scene-resources`, `scene-forecast`, `scene-economy`, `scene-sandbox`: merged.
   - [x] F3: the province map draws (Natural Earth geometry) and Recursos follows the province filter; Economía is national and says so.
   - [x] (done in F3 with Natural Earth admin-1, public domain; swap the source later with the same tool) **Human step before `scene-forecast-map` shows a map**: choose the source, register the file, fill `geo/config.json`, run `npm run build:geo`, review the metadata, commit the outputs in `web/public/geo/`. See `docs/geo.md`. When done, remove `MISSING_FOR_NOW` in `web/e2e/csp.spec.ts`.
   - [x] `scene-forecast-map`: province choropleth, level and change modes, markers, table view (with no geometry committed the scene shows the ranking and the fallback message). The `mode` field of the store (2D/3D) is ignored by the map.
   - [x] `scene-forecast-map-3d`: superseded by `presentation-3d` (item 5b).
   - [ ] **Human task before release**: the real era list with sources in `web/src/content/eras.ts` (three placeholders today; the release gate `scripts/check_no_mock.py --content` fails until they are replaced).
   - [ ] (optional) plug the sandbox into the reduced TS model (`model-ts-port`).
5a. [ ] **Dashboard** (`docs/dashboard.md`, phases D1 to D7; D1 to D6 done on `task/dashboard-shell`: 2D dashboard and 3D bars, map and lines; left: 3D treemap and others, polish, D7 Andes): one-screen layout, carousel of views, viewer with 1/2/4 views, right panel, filters in the bottom bar, no scroll; then the 3D renderer on the same dashboard. D1 to D3 are 2D; D4 to D6 are 3D; D7 is Andes.
5c. [ ] **Navigation (done: `map-navigation`, PR open) and big view of the maps and charts** (human request 2026-10-04; 3D first, `D-3d-6`): `map-navigation` (READY: zoom with wheel and `+`/`-` buttons, pan and reset on the 2D maps, which have `roam: false` today; free orbit, pan, wider zoom, reset and touch on the 3D views) and `fullscreen-viewer` (READY, after `map-navigation` if possible: a "Pantalla grande" button on every view opens a popup with the view large, a carousel over the scene's views, the view name at the top right with the scene's filters and statistics). Briefs `docs/archived/map-navigation.md` and `docs/tasks/fullscreen-viewer.md`; phases D8 and D9 of `docs/dashboard.md`.
5e. [ ] **Intro screen** (`task/intro-screen`, no PR yet): done, see `LASTCONTEXT.md`. Human: review the look and the subtitle; confirm the source and license of the province outlines in `web/src/intro/provinces.json` (copied from the prototype); decide whether the intro should come back from the app (a Header link).
5d. [ ] **Projection test** (`task/test-projection`, PR open): "Test proyección" button in 3D mode, map and bars with a projected title, beam and scan plane on made-up values. Human: review the look, then decide which effects (bloom, particles, fly-through) go into the real views; the dialog opens a third WebGL context (the fullscreen viewer must keep one alive).
5b. [ ] `presentation-3d` (human decision: 3D is the default presentation, a narrated tour plus a free explore mode; 2D stays as the data view and the accessible alternative). Six PRs: engine, shell, charts A (fan, province bars, province map), story, charts B, Andes and zone map. F2b and `D-3d-1` to `D-3d-6` are done or decided; 3D is the priority of the visual work (`D-3d-6`). The reference prototype `test/dashboard_3d_PoC.html` was removed from the repo by the human (2026-10-17).
5. [ ] `scene-ai-revolution`: READY. Brief written (works on mock data; wires `ai_estimates.json`).
6. [ ] **Human step before `andes-integration`**: download the DEM, register it with `python -m datapipe register`, set the bounding boxes in `terrain/config.json`, run `python -m terrain bake`, run `python -m terrain verify` against the Andes facts, commit the outputs in `web/public/terrain/`. See `docs/terrain.md`.
7. [ ] `andes-integration` (the old `scene-andes`): first cut merged (made-up terrain, route, events, panel, table, camera), then the column of figures (D-andes-6), procedural relief and the Cine camera (D-andes-7) (PR #51). **Done in PR #52 (merged, CI green)**: reworked figures (white horse and bicorn for the leader, brown and black horses, boots, blue uniforms, rifles, flag), day sky, glass interface over a full-screen canvas, cameras (follow, cine, aerial, far map), floating names of the places, minimap, altitude profile, progress of the crossing in percent in the bottom bar, SpO2 tile, graphics options, more clock time on the pass, open valley at the start. Left: attrition by day, optional `.glb` model; done on `task/andes-combat-clouds-victory`: dust behind the column, smoke and flashes at each combat, clouds, the «Victoria patriota» banner (to judge by eye), «Ver batalla» (full-screen 3D diorama of Chacabuco with a procedural field, textures made in code, both forces, San Martín with a telescope on a far hill; no map used; positions schematic until the Mitre plan is read; combat animation with numbers still to do), the side camera of the proof of concept, real terrain (blocked by the terrain outputs). **Human: review the merged PR #52 by eye** (flag colors, peak heights `RELIEF_AMPLITUDE`, storm haze, `DWELL_MAX`, SpO2 curve, uniform blue) and **measure on a weak device** (the graphics menu exists, its effect on speed is not measured) (the renderer decisions `D-andes-1` to `D-andes-4` are taken; the proof of concept `test/map_test1.html`, removed from the repo on 2026-10-17, loaded Three.js from a CDN, which the CSP forbids, so it is bundled). Must use `useQuality`, `QUALITY_PRESETS`, `WebGLRequired` and `useReducedMotion` (`web/src/runtime/`).
   - [ ] **Real Andes map** (`task/andes-real-map`, local, not pushed): MapLibre + MapTiler terrain and satellite, the Los Patos route and the miniature army as a custom layer; still to do: the human creates the GitHub secret `VITE_MAPTILER_KEY` and restricts the key by origin; follow the valleys between places (least-cost path over the DEM) instead of straight legs; check the places and dates against a primary source (the route cites a newspaper article); (the unused `Renderer.tsx`, `GraphicsMenu.tsx` and the relief chunks are deleted on `task/andes-cleanup-chacabuco`); run the e2e and `python scripts/precheck.py` before the PR.
   - [ ] **Columns, Curimón and references** (`task/andes-columns-sources`): human to verify against a primary or academic source the dates, places and figures listed in `docs/references.md` (section "Para verificar"), the positions of the four passes, and whether the columns met on 08 or 09 February; add the references of the data of the other scenes when they stop being test data; Chacabuco battle scene (camera, panel, two sides drawn as schematic) still to do.
   - [ ] **Sources update** (`task/andes-sources-update`): verify in the originals the figures marked "por informe" in `docs/references.md` (Estado general of 1816-12-31, the official coordinates of the passes, Academia de Historia Militar de Chile, Arre Caballo, Wikipedia Paso de Los Patos) and confirm their URLs; coordinates for the intermediate places of each route to trace the valleys; place the Espinacito pass; Chacabuco scene from the Mitre plan (**blocked: needs the plan's positions read by the human from Memoria Chilena; the agent could not open the image and does not invent them**).
8. [x] `references-page`, `storytelling-substeps`, `integration`: merged.
   - [ ] **Human task before release**: review and sign the 18 story drafts in `web/src/content/steps/index.ts`, add their sources and set `placeholder: false` (the gate fails until you do). Register real sources in `data/processed/sources.json`.
   - [ ] (later) let steps control scene-local settings; campaign day in `StepFocus` with `andes-integration`; load the references registry in the shell and pass `registryIds` to `StoryCaption`.
   - [ ] **Human: the main bundle is 133,255 B gzip against 134,144 B after gsap (F4); raise `budgets.json` on purpose or lazy-load gsap before adding anything to the main chunk.** Also confirm or tighten `web/budgets.json` (main is now about 102,293 B gzip against a 134,144 B budget after the precompiled validators; references 99,986 B against 131,072).
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
   1. [ ] `data-economy-population` (also needs `population-age-contract`; `D-gdp-1` decided)
   2. [ ] `data-resources`
   3. [ ] `data-andes`
   4. [ ] `data-research-inputs` (also needs the research files' format documented)
13. [ ] `mutation-testing` (optional): READY.
14. [ ] `polish`: decisions taken (`D-polish-3` color still the human's); 3D items first (`D-3d-6`); by `AGENTS.md` section 8 it starts after the model and data tasks unless the human starts it earlier for the scenes that exist.
15. [ ] `docs-submission` (draft brief) and `demo-video` (optional, draft brief): BLOCKED by the contest's rules.
16. [x] `development-indicators-maps`: diapositiva 7 conectada con series auditadas oficiales de salud (esperanza de vida y mortalidad infantil del Banco Mundial WDI), educación (resultados PISA OCDE, años promedio/esperados PNUD, graduación STEM) e igualdad (Gini del Banco Mundial/INDEC y pobreza EPH) en `web/src/tour/DevelopmentStep.tsx` y `developmentData.ts`.
17. [ ] `forecast-uncertainty`: interactive draft added as new slide 8 (`web/src/tour/ForecastUncertaintyStep.tsx`). Source historical innovations, AI model/cost evidence, forecast vintages and growth/development studies before adding data; do not invent a negative curve.

## Next on the Recorrido (human request 2026-10-12)

| # | | Task | Notes |
|---|---|---|---|
| 1 | 🔴 | **`real-data-review`: put real data in every slide** and, for what cannot be reached or found, **the AI writes the list of pending URLs, data needed and links it could not open** (`docs/data-requests.md`) so the human brings the data by hand. Never fill or invent a value. | Seed list in `docs/data-requests.md` (D1 to D22). Step 0 is done (World Bank real GDP). |
| 2 | 🟡 | **Natural resources, two slides with buttons instead of eight.** Today steps 2, 4, 7, 8, 9, 10, 11 and 13 touch the subject, all made-up, none with play or a resource filter. Plan: (A) *Minería e hidrocarburos*: buttons Minería / Hidrocarburos, a resource filter (oro, cobre, litio, petróleo, gas), measures production / exports / stock, a map + bars by province + province ranking + the national total as a line, projects by province, **play from 2025 to 2056**; (B) *Agro*: total production and its composition, exports, in tons and in dollars, same map, bars, ranking and play. | The mock contracts exist (`data/mock/resource_production.json` by province 1990-2025, `forecast_output.json` to 2056 with three scenarios, `projects.json`); real data are D12 to D18. |
| 3 | 🟢 | Step 15 and the old scene at step 14's neighbour still show a data scene; the INDEC 2016-2025 series as an extra step of the productivity slide. | |
| 4 | ✅ | **Slide 1 visual fixes and country comparison** (`test/corrections-1.png`, plan `docs/action-plan-slide1-visual.md`, decisions D1-D7). All six steps are done on two stacked branches, CI green, no PR: `task/help-lead-text` (step 1) then `task/slide1-main-metric` (steps 2 to 6: clickable ranking tables, flags to compare countries, log scale only when a line is squashed, flag + place at the tip of the lines, regional growth line, `lead` on the other slides). Human review by eye: position of the flags row, the muted dashed growth line, the 3D labels. | Added `web/public/flags/` (flag-icons 7.2.3, MIT), `ranks` and `regionAggregate` (LCN) in `worldGdp.json`; budget of the `src/tour/Simulator.tsx` chunk raised to 294912 on purpose. The regional growth line is 2D only (the 3D chart has one scale). |
| 5 | 🔴 | **`tour-nav-menu`: Hacia el 2056 dropdown.** The "Hacia el 2056" tab gets a chevron icon (so it reads as clickable) and, on hover or focus, a menu with the list of slides, slide 0 included as «Índice». Keyboard and touch accessible. | Done on `task/tour-nav-menu` (CI green, no PR yet). Opens on hover, click (pins) and Down arrow; the focus does not open it so Tab keeps walking the page. |
| 6 | 🟡 | **`nav-gold-palette`: one gold across the navbar and the intro.** Navbar buttons and the «2056» of the navbar logo take the gold of the «2056» of the home logo (`--intro-light`); the provinces lit all at once on hover of "Hacia el 2056" use that same gold, not the saturated yellow (`--gold`). | Done on `task/nav-gold-palette` (CI green, no PR yet; stacked on 5). Human: judge the muted gold by eye, it is now the same as the home «2056». |
| 7 | 🟡 | **`intro-load-lights`: the intro loading ends with every province lit.** The flat black map with outlines keeps its current duration and speed; during it the provinces light up one by one so that all are lit at the end, right before the tilt. | Done on `task/intro-load-lights` (CI green, no PR yet; stacked on 6, merge in order 5, 6, 7). Lights from 300 to 1300 ms, tilt at 2300 ms; reduced motion unchanged. |

| 8 | 🟡 | **`laptop-recorrido-layout`: the Recorrido on a laptop.** On a short screen (height up to 820 px, width over 900 px) slides 1, 2 and 6 show one chart big and the others behind small buttons (drawing + title). Plan in `docs/action-plan-laptop-recorrido.md`. | Merged in PR #151. Human: judge by eye on a real laptop; slides 7 and 8 scroll inside their cards at 768 px. Colors 9 to 16 of `tokens.categorical` are not validated (decide whether to keep 16). |

## Human requests of 2026-10-23 (queue, one branch per task)

| # | | Task | Status |
|---|---|---|---|
| 1 | ✅ | Slide 6 (IA): horizontal lines with flags for the compared countries on the GDP and GDP per capita charts | Done on `task/ai-country-reference-lines` (commit, CI not run) |
| 2 | ✅ | Slide 6: click a chart to see it big on the left, the other two small on the right; indicators scroll | Done on the same branch (CI not run) |
| 3 | 🟡 | Slides 9 to 14: slide 9 «¿Puede Argentina perderse la ola de la IA?» (cost of AI plans by country, taxes) and five outlines (10 to 14: shocks, resource limits, peer economies, forecast limits, usage pyramid); the human says what each one holds | Done on `task/new-draft-slides` (CI not run). Human: verify the list prices (A22) and the Argentine taxes (A20, A21) in ARCA and the official pricing pages; the VAT rates of the other countries are the general ones; wage share per plan not built (needs sourced wages) |
| 4 | ✅ | Slide 7 (desarrollo): small buttons on top, small indicator boxes, a big chart on the left with year-by-year lines for Argentina and seven peers (World Bank yearly series for life expectancy, infant mortality, Gini; the other indicators show Argentina's series), regional ranking table on the right | Done on `task/development-slide-layout` (CI not run). Human: the peers' yearly series are in `developmentSeries.json` (`scripts/build_development_series.py`); the PISA, HDI and schooling indicators have no yearly peer series yet |
| 5 | 🟡 | Slide 3 agro: livestock (beef, poultry, pork, milk) and «Otros cultivos», in tonnes, with official sources | Livestock done on `task/agro-livestock` (2025 estimates of the BCR with SAGyP and OCLA data, milk at 1.03 kg/l; human: check against the SAGyP and the Anuario Porcino). «Otros cultivos» (barley, sorghum, peanut, sugar cane...) not added: needs the MAGyP series |
| 6 | 🟡 | Slide 2: «Recursos» and «Producción por provincia» as one screen with the Recursos look; province indicator button (GDP, per capita, population, HDI, education, life expectancy) with traffic-light colours | Done on `task/province-semaphore` for what exists (GDP, per capita, exports, population, poverty, unemployment, jobs, crime; traffic light by thirds on bars, table and tiles); «Producción por provincia» removed because Recursos already shows it. HDI by province added on `task/province-hdi` (PNUD Argentina 2021, values taken from the Wikipedia table that reproduces it: human, check them against the PNUD report). Missing: education and life expectancy by province (not found in a quick search; needs INDEC Censo 2022 and DEIS series) |
| 7 | ✅ | RIGI map with the projects of `web/src/tour/rigiProjects.ts` | Done on `task/rigi-map`: third part «Mapa del RIGI» of the Recursos slide (province map by investment or projects, filter by status, project list per province). A project that crosses provinces counts in each and its investment is split equally (an assumption; human: confirm or give the split). Branches are stacked: ai-country-reference-lines, new-draft-slides, development-slide-layout, agro-livestock, province-semaphore, rigi-map (CI not run) |
| 8 | 🟢 | Audit the data documents against the slides and list what was not put in | Done in part: the unbuilt themes became slides 10 to 14; `web/src/tour/agroByProvince.json` (real MAGyP data, checked against the full series, no mismatch in 24 provinces) was not used by any slide, so the Agro by province was made up: now wired on `task/agro-by-province-real` (the four main crops at the FOB prices of the file; livestock, fruit and industrial crops by province are no longer shown until there is data). Still unused: the mock files in `data/mock` (by design) |

## Data to verify (human, against original source)

- [x] Mining exports by province (`web/src/tour/miningByProvince.ts`, Data slide 8): verified from the official treemaps of the Secretaría de Minería (informes 2026.01 y 2026.09); Catamarca (351 M USD en 2025, 419 M USD en ene-ago 2026) y Salta (498 M USD en 2025, 706 M USD en ene-ago 2026) están desagregadas y cierran con Jujuy, San Juan, Santa Cruz y Resto.

- [ ] Services exports 2025 (`web/src/tour/servicesExports.ts`, Data slide 4): read from the CEI (Cancillería) PDF, based on INDEC; check against the INDEC balance-of-payments table. The chart of the PDF shows other shares (34,6 % and 29,0 %) than its text (35,8 % and 26,9 %); the text matches value / total and was used.
- [x] Los Toldos II Este: 6.432 confirmed against the phases (1.635 + 1.268 + 3.529) in El Economista; still read the resolution itself in the Boletín Oficial.
- [x] RIGI list: verified against the Boletín Oficial (Resolución 1771/2026 for Los Toldos II Este by Tecpetrol, USD 6.432 M), official announcements of the Secretaría de Coordinación de Producción / Ministerio de Economía (reference R14), Taca Taca (NI 43-101 USD 4.232 M), and formal mining/oil&gas approvals in `web/src/tour/rigiProjects.ts`.

- [ ] Andes pop-up «Cómo fue el cruce» (`web/src/scenes/andes/CrossingInfo.tsx`): six columns (four secondary, the main force in two), the columns' roads and the meeting at Curimón (the sources give 8 or 9 February: H5, H16 of `docs/references.md`). Check the wording against a primary source.

- [ ] Recorrido step 1 GDP chart: the history 1990-2025 is real (World Bank, constant 2015 USD) and 2026 comes from the IMF real growth; from 2027 the projection and the fan are made up (`web/src/tour/gdpMock.ts`, labelled "Datos de prueba"); replace them with the model before release.

- [x] Recorrido steps 1 and 2 indicators box: real values of the World Bank (WDI, 2025, read 2026-10-12) in `web/src/tour/indicatorsMock.ts`; still to confirm against the INDEC (`docs/data-requests.md` D9).
- [ ] **Real data of the Recorrido, slide by slide**: the state of each slide is in section 0 of `docs/data-requests.md`; all GDP is real at constant 2015 prices (rules in section 0b). Human tasks (RIGI list, mining and agro by province, step 0 years, investment figure) are in section 3 of that file.
- [ ] **Slide 7, education vs peers (2026-10-25)**: four World Bank WDI series for Argentina and seven peers (`SE.SEC.ENRR`, `SE.TER.ENRR`, `SE.SCH.LIFE`, `SE.XPD.TOTL.GD.ZS`, in `developmentSeries.json`, `scripts/build_development_series.py`); check a few values on the World Bank site. PISA: mean mathematics score of Argentina and the seven peers in 2012, 2018 and 2022 (`web/src/tour/pisaSeries.json`, `scripts/build_pisa_series.py`; OECD tables as published by Our World in Data, 2015 left out because Argentina did not take part nationally); check a few values on the OECD PISA site. Reading and science are not compared yet.
- [ ] **Development slide** (`development-indicators-maps.md`): verify IDH, PISA scores by area/edition, university dropout definition, life expectancy, tertiary/STEM/postgraduate attainment, and Gini against original sources before publishing any figure. Candidate additions: schooling years, secondary completion, infant/healthy-life mortality, labor participation and digital access, subject to comparable series.
- [ ] **Province resource/project explorer** (`development-indicators-maps.md`): verify project names, coordinates, status, resource/reserve/production/capacity quantities and units against primary sources. Keep estimates, resources, reserves, production and capacity distinct.
- [ ] **Forecast uncertainty / AI slide** (`forecast-uncertainty.md`): source historical technology diffusion-to-productivity lags; model-size, inference and robotics hardware cost series; 6/12-month forecast vintages and errors; evidence connecting real PBI per capita, real wages and development outcomes; and studies decomposing growth into education/human capital and savings/investment. Verify the OpenAI/ChatGPT timeline. Define whether an adverse AI impact means negative incremental growth versus a no-AI counterfactual or a fall in the PBI level.
- [ ] **Draft slide 8 timeline claim**: verify the proposed account of OpenAI API experiments circulating in academic/AI circles at the beginning of 2021 and ChatGPT's arrival about 20 months later. Check dates and what “se viralizaban” can defensibly mean before retaining it in final copy.
- [ ] **Historical shifts, structural shocks, and forecast limits (nice to have / qualitative context for forecast & AI narrative)**:
  - [ ] **General Electric / Jack Welch doctrine**: dismantling industrial conglomerates, financialization, and aggressive outsourcing/offshoring to Asia and low-cost jurisdictions to cut costs and maximize shareholder returns.
  - [ ] **Collapse of the USSR and post-Soviet labor supply expansion**: the fall of the Soviet bloc and integration of former socialist economies into global markets, unlocking massive low-wage labor supply and altering global wage dynamics.
  - [ ] **Persistent hysteresis from deindustrialization**: historical evidence that countries and regions never fully recovered high-wage employment or manufacturing vitality after deindustrialization (rust belt dynamics).
  - [ ] **China's WTO accession (2001) and the "China Shock"**: cite foundational papers and articles (e.g. Autor, Dorn, & Hanson, *The China Syndrome: Local Labor Market Effects of Import Competition in the United States*, AER 2013) documenting rapid manufacturing dislocation, wage stagnation, and localized economic decay.
  - [ ] **Structural friction in labor reallocation (industry to services as precursor to AGI)**: historical evidence that displaced industrial workers do not transition easily or quickly into high-productivity services (friction, skill mismatches, structural stagnation); this historical reallocation failure serves as a preview/cautionary parallel of what could happen across service sectors under rapid transition toward Super AGI.
  - [ ] **Limitations of natural resources**: natural resource extraction is capital-intensive rather than labor-intensive; if operating firms do not reinvest or spend dividends domestically, the multiplier effect on the host nation remains low (enclave economy / Dutch disease).
  - [ ] **Argentina's entry into Mercosur and domestic deindustrialization**: structural deindustrialization of Argentine manufacturing following regional opening under Mercosur, with industrial scale and capacity shifting toward Brazil.
  - [ ] **Limits of data for inferring technological and political waves**: can historical data alone predict transformative waves? Consistently flawed forecasts by top analysts and institutions: Wall Street analysts and Warren Buffett dismissing crypto, Tesla, or SpaceX during their formative years; political consulting failures with political outsiders (raising the question of whether polling/consultancy projections are systemic modeling failures or deliberate publicity techniques to manufacture momentum).
  - [ ] **Ambiguity, sentiment, and rapid narrative rotation (Generative AI 2021 vs. today)**: analyzing ambiguities, emotionality, and market sentiment is necessary but insufficient; contrasting the negligible attention paid to generative AI across mainstream business and policy in 2021 with the universal focus on AI today.
  - [ ] **Benchmark of resource-rich developed economies with advanced human capital (nice to have comparative panel)**:
    - Comparative analysis of developed economies combining massive natural resource endowments with high human capital / human development (education, R&D, institutional quality, complex services).
    - Key metrics to benchmark: reserve-to-production/export ratios, export complexity, value-added per capita, and the institutional mechanism for capturing and reinvesting resource rents (sovereign wealth funds, education/STEM investments) versus suffering Dutch disease.
    - Reference peer economies:
      - **Norway**: oil & gas endowment combined with world-leading sovereign wealth governance (Government Pension Fund Global), top-tier education, low inequality, and comprehensive human capital reinvestment.
      - **Australia**: mining and energy powerhouse (iron ore, coal, lithium, LNG) paired with high tertiary education attainment, strong legal/regulatory framework, and high-value service exports.
      - **Canada**: vast reserves in energy, critical minerals, and agro-forestry backed by top global educational attainment (STEM & post-secondary), diversified advanced manufacturing, and technological hubs.
      - **Chile**: regional benchmark in copper and lithium reserves, fiscal rule on structural surplus, and sovereign stabilization funds, contrasting the transition hurdles toward high-income status.
  - [ ] **Global AI token consumption, LLM usage pyramid, and relative access cost & tax barrier (new slide)**:
    - **Global AI token volumes and programming usage**: global token consumption across frontier closed and open weights (OpenAI, Anthropic, Google Gemini, Meta Llama, DeepSeek, Hugging Face ecosystem), breaking down coding/software engineering workflows vs. general text/enterprise queries.
    - **LLM usage pyramid**: visual multi-tier hierarchy:
      - *Base*: Free web/consumer chat interfaces (massive query volume, lowest compute per interaction).
      - *Middle*: API developer integration, specialized coding assistants and IDEs (Cursor, GitHub Copilot, Claude Code, Aider), fine-tuned domain models.
      - *Apex*: High-compute test-time reasoning (o1/o3, extended thinking), autonomous multi-agent loops, and deep-search research/coding agents (lowest volume, highest compute and token expenditure).
    - **Global nominal vs. relative purchasing power cost**: benchmark subscription ($20–$200/month) and API rates (per million tokens) against developer wages across regions. In developed economies, frontier tools represent <0.5% of an average tech wage, whereas in developing nations they represent a substantial fraction of monthly income.
    - **Argentina's tax surcharge and structural access bottleneck (falling behind in the global race)**:
      - *The global AI acceleration*: Leading economies are engaged in an exponential race for AI capability, subsidizing infrastructure, compute access, open research, and developer ecosystems.
      - *Double penalty on developing nations*: For emerging and lower-income countries, baseline tool adoption is already challenging due to income disparities and dollar pricing.
      - *Self-imposed friction ("trabas en la rueda")*: Rather than incentivizing technological catch-up, Argentine policy has historically added severe domestic obstacles via foreign exchange taxes and digital service surcharges (digital VAT, PAIS tax, income/wealth tax prepayments, provincial stamp taxes) adding a 30% to 155% overhead on top of international card payments.
      - *Surrendering the frontier*: To access the exact same frontier models, Argentine researchers, students, and engineers face an artificial premium requiring vastly more working hours than peers abroad, disincentivizing local adoption of cutting-edge tooling and voluntarily falling behind in the global race.




- [ ] Recorrido step 14 «Productividad» (`web/src/tour/productivity.ts`, `productivityData.json`): PWT 11.0 via FRED, 1955-2023, four countries; the data come from the human's `productivity_slide_spec.html` and were not re-downloaded by us. Verify the 15 FRED series (IDs in `docs/references.md` P7), the Argentine hours anomaly in 2021-2023, and the AI estimates quoted in step 5 (Acemoglu, Anthropic: cited, not opened). The INDEC 2016-2025 figures are verified in the PDF (P1) but the charts end in 2023; an extra step with the INDEC series (cuadros 12 y 13) was offered. Baumann Fonay (P2) is not verified and contradicts INDEC on 2024.
- [ ] Simulador del PBI (`web/src/tour/simModel.ts`): plain arithmetic; every coefficient (AI ramp over 15 years, 0,1 pp per investment point, population around 0,5 %) and the 2025 GDP of 640 are made up; replace with the model's elasticities and sourced values and record them in `docs/assumptions.md`.

## Model assumptions (record in `docs/assumptions.md`)

- [ ] 35 entries A01-A35 in `docs/assumptions.md`, all unsourced. Accepted by the human on 2026-10-04: A10, A13, A15, A16, A24, A26, A31, A32, A33. A35 (working-age range 15 to 64) was added by `model-population-drivers`.

## Visual debt (deliberately left rough until `polish`)

- [ ] Sandbox scene: look and feel against `design.md`, slider layout, the band color (blue token at BAND_ALPHA), the worked-example panel.
- [ ] Economy scene: look and feel against `design.md` (home country in `ink` and peers in `muted`), era band styling, the chips, the year slider, country labels are ISO codes (the dataset has no names).
- [ ] Province map: the PLACEHOLDER red arm of the diverging ramp (`D-polish-3`), the hatch of the no-data fill (design.md asks for a hatched fill; only the baseline color is applied), the selected-province border may be partly covered by neighbours, the illustrative Malvinas outline.
- [ ] Argentina 2D and 3D maps: selecting a province should smoothly transition to its provincial framing, respecting `prefers-reduced-motion` and rapid/repeated selection.
- [ ] Resources map: selecting a province should zoom to it and show sourced resource locations and mining/hydrocarbon projects; map selections must sync with a named project/resource list and a detail card with verified quantities, units and periods.
- [ ] Forecast scene: look and feel against `design.md`, history line and "History | Forecast" divider (mock has no history), plain buttons, layout spacing.
- [ ] Forecast ranking: rows beyond top 10 are hidden, a selected province outside the top 10 is not shown.
- [ ] (F4 redid the panel as a floating card) Story caption panel: look and feel against `design.md`, dot hit targets are small, the "Provisorio" tag uses the warning token, no transition on collapse, the panel covers the bottom of the 3D stage.
- [ ] Visits section of the References page: plain table, flags are emoji (letters on Windows browsers).

## Blocked / questions

- [x] Voice of the Spanish UI text: neutral impersonal forms kept (decided 2026-10-04); voseo is one pass over the strings if wanted later.
- [x] `D-res-3` (decided by the human, 2026-10-04): ten value-added constants `v_r`, including `other`. Applied in `docs/model-design.md` (20 resource entries, 35 in all) and recorded in `docs/decisions.md`.
- [x] `D-3d-1` to `D-3d-5` decided with the recommendations (2026-10-04, `docs/decisions.md`): Three.js bundled, poster first with the 3D chunk budget accepted, Natural Earth geometry, system typeface, tour of six views. Added `D-3d-6`: 3D is the priority of the visual work.
- [x] `D-andes-1` to `D-andes-4` decided (2026-10-04): Three.js bundled, the shared `three` 0.186.1, baked terrain as geometry, Spanish. `andes-integration` still waits for the terrain outputs (human DEM step).
- [ ] `D-polish-1` to `D-polish-7` decided (2026-10-04) except `D-polish-3`: the real red arm of the diverging ramp is a color the human must supply (never invented). Spanish `es-AR`, system typeface, focus ring #ffc107, no new critical text color (icon plus treatment), GSAP, scope ordered with 3D first.
- [x] `D-gdp-1` decided (2026-10-04): market-rate constant USD of the source's base year.
- [ ] Competition deadline and evaluation criteria (block `docs-submission` and `demo-video`).
- [x] `storytelling-substeps` defaults confirmed (2026-10-04, `docs/decisions.md`).
- [ ] `geo-provinces` decisions (human): source dataset and license; `target_max_bytes` and `max_area_change_pct` after seeing real results. Decided: the territory is the continental provinces plus an imprecise Malvinas outline (`docs/decisions.md` D-geo-1); the registered layer must exclude the Antarctic sector and far islands.
- [x] `terrain-bake`: dependency exception and the Earth radius accepted (2026-10-04).
- [ ] Mock `forecast_output` has province series only for `resource_production` (18 provinces, 6 resources); GDP, GDP per capita, population and HDI have national series only, so the province ranking is empty for them. Not extended, per the brief.
- [x] Acceptance item "arrows moving the year" dropped: `KEY_MAP` unchanged (2026-10-04).
- [x] Open decisions D-scen-1 to D-data-1 of `docs/model-design.md` answered with the recommendations (2026-10-04); assumptions A10, A13, A15, A16, A24, A26, A31, A32, A33 accepted (A10, A15, A26 still need a source for their values).
- [ ] `docs/sources.md` and `docs/research-prompts.md` do not exist; no parameter can have a `source_id` yet. `data-andes`, `data-resources` and `data-economy-population` create or extend `docs/sources.md`.
- [ ] Adverse AI scenario: source/document ranges for adoption and training lags, labor displacement/reallocation, wage and demand effects, and distribution of productivity gains in `docs/assumptions.md`; distinguish contribution to growth relative to a no-AI counterfactual from a change in the PBI level.
- [ ] `data/mock/` has no research mocks (`ai_estimates.json` and the other four are generated only in tests); `scene-ai-revolution` wires `ai_estimates.json`.

## Done

- [x] `fix-slide2-map-click` (branch `task/fix-slide2-map-click`): fixed unclickable Argentina map on Slide 2 (`ResourcesStep.tsx`, `ProvinceStep.tsx`, `ProvinceProfileStep.tsx`) caused by `.res-grid .gdp-chart > .tour-chart > *` stretching `.tour-view-switch` (`z-index: 3; pointer-events: auto`) to 100%×100% over the map; added `:not(.tour-view-switch)` to `.res-grid`, `.tour-grid`, and `.ai-grid` chart child rules in `ui.css`; wired `selectedDepartment` and `onSelectDepartment` into `Map3DSpec` and `Map3D.tsx` so clicking departments in 3D selects/deselects them and updates the breadcrumb; fixed `Map3D` `flyTo` radius when switching from a smaller province to a larger one; enabled province selection when clicking bars in the national provinces chart on Slide 2; fixed `DataPage` (`DataPage-*.js` / `simModel-*.js`) 404 chunk failure after deploy by adding `DataPage` and `Simulator` to `CHART_LOADERS` in `prefetch.ts`, adding one-time reload recovery (`recoverChunkLoadError`, `vite:preloadError`, `consumeReloadSection`, `SectionErrorBoundary`), and adding unit (`shellUi.test.tsx`, `prefetch.test.ts`) and Playwright E2E (`boot.spec.ts`) tests verifying the `Data` button loads and renders the Data page.

- [x] `data-ai-usage` (branch `task/data-ai-usage`, PR #124): added "Uso de AI" tab (`AiUsageView.tsx`) in the Data section (`DataPage.tsx`); added canonical numbered reference chips (`[1] FMI`, `[2] Banco Mundial`, etc. via `RefLink.tsx` / `RefList`) across `Hacia el 2056` and `Data` with custom-styled hover tooltips showing the full citation and URL text and opening in a new tab on click; added custom-styled `?` explanation triggers (`ChartHelp.tsx`) on every slide/chart that show a styled explanation tooltip on hover and open a modal popup on click (zero native browser tooltips).

- [x] `treemap-pie-bars-2d` (branch `task/treemap-pie-bars-2d`, worktree `arg-2056-udesa-tree2d`): applied 2D flat treemap, doughnut pie (`Torta`), and rounded bar chart styles from the prototype `test/tree-example.html` (removed from the repo on 2026-10-17) to Slides 2 (`ResourcesStep.tsx`) and 4 (`CompositionStep.tsx` & `ExportsStep.tsx`), added `Torta` option to `CompositionStep.tsx`, expanded `tokens.categorical` to 16 vibrant colors, and gave all 2D and 3D bar charts across the app a wide multi-color gama.

- [x] `slide3-charts-restyle` (branch `task/intro-hover-effects`): restyled Slide 3 (Cuarta revolución industrial / IA) charts, palette, and card system to match Slide 5 (Regla del 70): solid clean Y-grid lines (`tokens.grid`), no X-grid lines, eliminated blurry `shadowBlur` glow and muddy overlapping `areaStyle` gradients, applied crisp vector line styling, unified cards and headers using `.rule70-card`, `.rule70-card-head`, `.rule70-legend`, `.rule70-key`, and `.rule70-table`, and set population series to `tokens.blue`.

- [x] `intro-hover-effects` (branch `task/intro-hover-effects`): enhanced 3D intro map interactions: hovering "Cruce de los Andes" button highlights only San Juan and Mendoza; hovering "Hacia el 2056" button illuminates all 24 provinces + Islas Malvinas lifted in gold (`var(--gold)`); hovering any province in the 3D map displays a floating tooltip with the province name. Fully covered in `intro.test.tsx`.

- [x] `data-page-tabs` (branch `task/data-page-tabs`): enhanced Data section with 3 view tabs (Data, Referencias, Metodología), JSON downloads for tables, slides, and references, added all 20 Cruce de los Andes references from README to `references.ts`, and added comprehensive methodology view covering general pipeline and slide-specific methods (Regla del 70, Simulador, PBI 2056).

- [x] `readme-methodology` (branch `task/readme-methodology`): added "Metodología y pipeline de datos" section to `README.md` documenting automated API ingesta, official document normalization, and decoupled architecture without hardcoded data.

- [x] `nav-gold-buttons` (branch `task/nav-gold-buttons`): unified button shape across the entire app to the rounded-rectangle form of the Simulador (`border-radius: var(--radius-md)`); refined gold color palette to warm radiant gold (`#dfa73f`) with champagne highlights (`#fae4b8`) and metallic gradient on the 2056 logo, removing harsh yellow tones.

- [x] `chart-aesthetics` (branch `task/chart-aesthetics`): refined chart-card surfaces, captions, legends, chart/table segmented controls, and data-table scanability with reduced-motion support. Follow-ups: matched simulator and Hacia el 2056 navbars, including gold active section/current-step pills; polished Andes UI. Previewed in the isolated browser; Andes terrain still needs `VITE_MAPTILER_KEY`.

- [ ] `recorrido-graficos` (branch `task/recorrido-graficos`, worktree `arg-2056-udesa-recorrido`, local, not pushed): indicators box on steps 1 and 2, step buttons next to the Recorrido tab, play/pause icons and speed on step 0, a Gráfico | Tabla switch on every chart, step 14 «Productividad» (five steps, real PWT data) and the «Simulador del PBI» section; sources in README and `docs/references.md` 4.1; a Data section (`web/src/datasets/`) with the tables of every slide, CSV downloads and the references. Human: check the new lazy chunk against `budgets.json` (`npm run check:bundle`, not run locally). Waiting for review; not seen in a browser; unit tests only.
- [ ] `tour-gdp-chart` (branch `task/tour-gdp-chart`): Recorrido step 1 shows a modern GDP chart (observed, projected to 2056, range) with 2D / 3D buttons, on made-up data. Waiting for CI and review; steps 2 to 15 still show the data scenes.
- [x] `F4` (branch `task/motion-story`): gsap 3.15.0; scene transition, counters, series draw-in, story panel redesigned; the 18 steps are now drafts (no figures, no sources) that keep `placeholder: true`.
- [x] `F3` (branch `task/filters-province-map`): one filter bar (scenario and AI only in the control bar), province geometry committed (`D-3d-3` decided by the agent: Natural Earth admin-1), Recursos follows the province, Economía shows a national note.
- [x] `F2b` (branch `task/ui-scenes-es`): scenes, charts, tables, story panel and references page in Spanish on the shared `SceneShell`, `TableToggle`, `FilterBar`; `APP_LOCALE = 'es-AR'` and `lang="es"`. See `docs/ui.md`.
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
- [ ] `intro-logos` (branch `task/intro-logos`): four equal-height logos in the intro footer (UdeSA, Data Science Lab, Contar con Datos, Secretaría); waiting for CI and review. Open: check sizes at several screen widths and on phones.
- [ ] `recorrido` (branch `task/recorrido`): intro polish (subtitle, black shortcut buttons, footer with the three institution logos as links) and a black navbar done; waiting for CI and review. Open: the Data Science Lab logo has a non-black background, and the footer logos need a minimum size on phones.
- [ ] `micro-fixes` (branch `task/micro-fixes`): nav sections, Recorrido mode and intro buttons done; waiting for CI and review. Open: the Recorrido has no sourced narrative yet (it reuses the data scenes), and the 3D charts of the reference image `test/recorrido-dashboard-2.png` (no longer in the repo) are not reproduced.
- [ ] `map3d-hover-zoom` (branch `task/map3d-hover-zoom`): the 3D charts of the Recorrido no longer grow, zoom or vanish by themselves (canvas laid over its box, `dashboard.css` loaded by the Recorrido, hover never navigates); step 0 with a timeline bar, GDP and GDP per capita tables (Argentina pinned) and region bars that follow the clock; all 3D bars open from almost the side; cleaner floor; only +, - and reset buttons; spinner and chunk prefetch; Data Dashboard hidden (flag `arg2056.showDashboard`). Waiting for CI and review. Open: delete the unused code (`tour3d/` still-camera and SVG versions, `TourChart.tsx` passes through to `tour3d/TourChart3D.tsx`), the other Recorrido slides still use made-up data, and the 3D lines of step 0 keep their own camera.

- [x] Remove the development deadline badge from the navbar (task/remove-dev-badge).

- [x] Enable scrolling in the lower-left RIGI projects list with constrained flex height and pointer events (task/rigi-projects-scroll).

- [x] Replace map search emoji with SVG and include all Data reference URLs in README (39 missing links added).

- [x] Generate black README banner from the two newest test images dated 2026-10-30 and place it above the title.

- [x] Department minimap labels appear only on hover or selection; idle municipality labels hidden (task/department-hover-labels). CI regression tests added; no local tests run.

## IA: acceso, adopción, tokens e I+D (2026-10-30)

### Done
- [x] Diapositiva 9: subtítulo de sobrecosto argentino, referencia mensual de 20 USD, niveles de 100/200 USD, mapa LATAM y tabla de precios API por millón de tokens.
- [x] Al final: adopción empresarial (27), consumo/percentiles (28), pirámide documentada (26, reemplaza el esquema previo) e I+D (29); menú, índice, Data y exportación conectados.
- [x] Fuentes AI30–AI55 incorporadas en Data y README. Registro metodológico: docs/ai-evidence-2026-10-30.md.
- [x] arXiv y cartografía archivados con SOURCE.md; agregación reproducible sin red. Tests escritos para CI, no ejecutados localmente.

### Data to verify (human)
- [ ] Claude Pro/Max/Ultra: 20/100/200 USD mensuales (AI30, consulta 30-10-2026), condiciones y nombres actuales; no equivalencia de cupos.
- [ ] Tarifas API, USD por millón, entrada/salida/lectura de caché: Sonnet 4.6 3/15/0,30; GPT-6.1 Sol Standard contexto corto 2/10/0,10; Gemini 2.5 Pro Standard prompt hasta 200k 1,25/10/0,125; Grok 4.7 2/6/caché null. Validar AI30–AI33 y tratamientos de contexto/herramientas.
- [ ] Cursor: 0,25 USD adicionales por millón en modelos elegibles Teams/Enterprise (AI34); no todos los planes.
- [ ] Semáforo conserva supuestos de Argentina 21+30=51 %, Chile 19 %, Uruguay 22 %, México 16 %; contrastar aplicación concreta al checkout y forma de pago con ARCA/SII/DGI/SAT (AI48–AI52). Otros países grises.
- [ ] Gallup IT Q4 2025: 77 % algún uso, 57 % frecuente, 31 % diario; crecimiento trimestral 76→77 % (AI35). Categorías anidadas.
- [ ] S&P 500 2025: 11 % integración profunda y 10 % adicional productiva (AI36, preprint, clasificación de 10-K).
- [ ] Encuestas nov. 2025–ene. 2026: aproximadamente 70 % adopción y 89 % sin impacto declarado en ventas por empleado en los tres años anteriores (AI37); no mezclar muestras.
- [ ] OpenAI: >50 millones de suscriptores de consumo y >900 millones de usuarios semanales (27-02-2026, AI38), no todos de 20 USD ni todos los LLM. ONU: 8.200 millones en 2024 (AI39). 50/8200≈0,61 % es comparación de escala con fechas distintas, no tasa exacta ni cota superior.
- [ ] Google: >3,2×10^15 tokens/mes, todos sus productos/APIs (junio 2026, AI41); OpenAI: >15.000 millones tokens/min en API (abril 2026, AI42). No ChatGPT/Gemini app exclusivamente.
- [ ] Investigadores internos de OpenAI, agosto 2026: mediana >600 y p90 >7.000 USD/día equivalentes a tarifa API (AI55), no tokens ni factura real. No extrapolar percentiles al público.
- [ ] Autor: 8.000 millones tokens Claude Code últimos 30 días, declarado el 30-10-2026; confirmar desglose entrada/salida/caché. Percentil y composición caché null.
- [ ] arXiv nuevos envíos 2020–2025: 178.329; 181.630; 185.692; 208.493; 244.031; 284.486 (AI44, CSV archivado). Preprints.org 31.691 publicados y SocArXiv 3.162 aceptados en 2025 (AI45–AI46); no sumables.
- [ ] AI co-scientist: reconstrucción de hipótesis con experimentos humanos previos, no reemplazo de todo el proceso; no afirmar genéricamente que meses de ciencia se vuelven días (AI47).
- [ ] LATAM IVA digital y recargos en tarjeta (AI63–AI65): verificar alícuotas vigentes en cada jurisdicción (Uruguay 22 %, Chile 19 %, Colombia 19 %, Perú 18 % D.L. 1623, Rep. Dominicana 18 %, México 16 %, Venezuela 16 %, Ecuador 15 %, Honduras 15 %, Nicaragua 15 %, Costa Rica 13 %, El Salvador 13 %, Bolivia 13 %, Guatemala 12 %, Paraguay 10 %, Panamá 7 %, Brasil 3,5 % IOF Decreto 12.499/2025) y retención B2B en Argentina (+48,5 % grossing-up RG AFIP 739/99 + IVA).
- [ ] Jellyfish 2026 Software Engineering Metrics Report (AI56): mediana 51 M, P90 380 M y P99 1.350 M tokens/mes por ingeniero de software; contrastar con telemetría de Claude Code y prompt caching (AI57, AI58).
- [ ] Contraste macroeconómico 4IR (AI59–AI62): Goldman Sachs (+7 % PBI global / +1,5 pp anuales en desarrollados, AI59), FMI WP/25/76 (+0,8 a +1,3 % PTF acumulada en avanzadas vs. +0,1 a +0,4 % en emergentes, AI60), FMI AIPI (0,68 avanzadas vs. 0,46–0,48 Argentina/LATAM, AI61) y Anthropic Economic Index arXiv:2511.15080 (elasticidad ingreso-uso ~0,7 %, AI62).
- [ ] Pirámide multi-modelo de adopción global de LLMs (AI66, AI67): Microsoft AI Economy Institute 2026 (~18,8 % de difusión global en edad activa; 28,8 % Norte Global vs. 16,2 % Sur Global, AI66) y Menlo Ventures 2025 (participación empresarial en LLMs: Anthropic Claude ~40 %, OpenAI ~27 %, Google Gemini ~21 %, AI67).
- [ ] Cola extrema P99 de consumo mensual de tokens en ingeniería de software (AI68–AI74): Jellyfish State of AI in Software Engineering y Tokenomics 2027 (mediana ~81 USD / 51 M tokens, quintil empresarial superior ~2.500 M/mes, top 2 % ~500 M/semana ≈ 2.000–2.200 M/mes, P99 de gasto ~2.452 USD/mes, AI68, AI69, AI73), VibeCafé Token Consumption Percentiles (P95–P99: 1.900–7.400 M/mes; Claude Code P99 ≈ 4.800 M/mes, AI70), Cursor Insights (top 10 % concentra ~2/3 de tokens, AI71), Epoch AI / OpenAI Coding Agent Spending (AI72) y The Pragmatic Engineer (AI74).

### Model assumptions
- [ ] Ratificar bandas visuales del semáforo (<20 verde, 20–25 ámbar, >25 rojo). No afectan escenarios.
- [ ] Pirámides conceptuales: anchos ilustrativos, no proporciones de población ni gasto. Falta una distribución pública comparable de tokens por usuario-mes; no se fabrican umbrales.

### Visual debt
- [ ] Revisión humana de cuatro nuevas láminas y mapa LATAM en 1366×768 y pantalla grande.

- [x] Revisión del agente en navegador a 1366×768: pirámides, adopción e I+D; corregido ancho de las bandas y scroll de costos. Captura local tmp/ai-evidence/research-preview.png. Se mantiene revisión humana pendiente.

## Done · Logos y capturas (2026-10-30)

- [x] Diapositiva 0: cuatro logos institucionales existentes debajo de Argentina 2056, sobre fondo negro.
- [x] Capturas de las 14 diapositivas (0–13) y dos vistas del cruce de los Andes; galería en docs/screenshots.md y selección en README.
- [ ] Revisión humana del tamaño de los logos y de la selección de capturas.

## Done · README institucional y autor (2026-10-30)

- [x] Enlace al hackathon Contar con Datos de UdeSA y los cuatro enlaces institucionales del footer.
- [x] Autor con la titulación indicada y enlaces confirmados de LinkedIn y portfolio.

## Done · Índice del README (2026-10-30)

- [x] Índice con enlaces a todas las secciones y subsecciones, anclas explícitas y títulos enlazados de vuelta al índice.


## Done · Modelos 3D de uniformes y Cruce de los Andes (2026-10-30)

- [x] Fusil de chispa (`musket.glb`) montado en diagonal sobre la espalda (`mixamorig:Spine2`) de los dos soldados (`soldier-blue.glb` y `soldier-red.glb`).
- [x] Botón `"Modelos detallados"` en los controles del Cruce de los Andes (`web/src/scenes/andes/index.tsx` y `MapLibreRenderer.tsx`) para activar los modelos 3D GLB en la infantería del cruce.
- [x] Botón `"Ver uniformes"` en la barra de navegación (`web/src/app/Header.tsx`) que abre el pop-up 3D (`web/src/app/UniformsModal.tsx`) con los 3 modelos (`San Martín`, `Soldado de Uniforme Azul`, `Soldado de Uniforme Rojo` con fusiles a la espalda).
- [x] En la pantalla de cielo celeste al abrir `"Cruce de los Andes"` (`web/src/scenes/andes/AndesIntro.tsx`), marcha 3D de San Martín adelante con 5 soldados detrás (3 azules y 2 rojos).
- [x] Al hacer hover sobre el botón `"Cruce de los Andes"` en la intro (`web/src/intro/Intro.tsx`), aparece a la derecha encima del mapa de Argentina San Martín escoltado por dos granaderos.
- [ ] Revisión humana visual de la escala y orientación del fusil en la espalda y las animaciones 3D en navegador.
- [x] `README.md`: agregada sección e índice de «Modelos 3D del Ejército de los Andes (Meshy AI)» con capturas (`docs/assets/models/*.jpg`), enlaces directos a cada `.glb` en el repositorio y mención explícita de que fueron hechos con Meshy AI y son *free to use* sin necesidad de dar créditos.
