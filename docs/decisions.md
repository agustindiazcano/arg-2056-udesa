# Decisions

One entry per major design decision. Each entry: context, options, decision, consequences. The model entries were proposals of the design task; on 2026-10-04 the human accepted every recommendation (see the batch at the end of this file and section 9 of `docs/model-design.md`).

## D-scen-1: Scenario definition
- Context: AGENTS.md says the three scenarios are readings of the fan, not independent curves; the `forecast_output` contract still gives each scenario its own p10/p50/p90.
- Options: (a) conditional tercile of the TFP-growth driver `g_A` within one joint distribution; (b) regimes, meaning sets of structural assumptions; (c) quantiles of the output itself.
- Decision: (a). A scenario is fixed by a driver, not by an outcome, and the unconditional fan is fixed before observation.
- Consequences: one scenario driver only; the pre-registered criteria C4 (separation) and C3 (coverage) can reject the design; regimes for resources or demography are not scenario-specific.

## D-res-1: Resource sector treatment
- Context: the contract asks for physical production by resource and province; capital and TFP already account for the base-year economy.
- Options: separate additive block; exogenous paths from `production_projections`; folded into capital and TFP.
- Decision: separate additive block `Y_total = Y_core + R`, with `Y_core` calibrated on `Y_total - R`; project capex stays outside core investment.
- Consequences: a resource value-added history is needed to calibrate `g_A` on core growth cleanly; capex financing is not modeled; the block is not backtestable until project vintages exist.

## D-ai-1: AI overlay quantity
- Context: `ai_estimates` mixes TFP, labor productivity, GDP, employment and adoption metrics.
- Options: overlay on TFP growth; on GDP level; on labor input.
- Decision: TFP growth in pp per year. Admissible records are `tfp_growth_pp_per_year` and `tfp_level_gain_pct_cumulative` through the exact compounding already validated in the data. The overlay is independent of the scenario and uses the same random numbers for `on` and `off`.
- Consequences: other metrics are context only; if no admissible record exists, `ai_overlay: on` series are not produced; results are conditional, never predictions.

## D-prov-1: Provincial proxy
- Context: no harmonized provincial GDP series exists.
- Options: equal core GDP per capita plus native resource output; night-lights or electricity proxy; provincial statistical-office GDP.
- Decision: equal core GDP per capita (stated limit) plus provincial resource value added; population shares held at the last census, with an optional damped drift kept only if it wins the pre-registered 18-of-24 test.
- Consequences: provinces without resources look average; province fans reuse national draws.

## D-bt-1: Calibration window and success criteria
- Context: AGENTS.md fixes training up to 2005 and testing 2006-2025.
- Options: single origin 2005; rolling origins with recalibration.
- Decision: single origin 2005 for the gate (12 cases, criteria C1-C5 in section 5); rolling origins only as a secondary report. Criteria are written before any run and are not changed after seeing results.
- Consequences: low statistical power (12 cases); a failure is reported as a negative result and leads to a documented change of mechanism, not to tuning.

## D-pop-1: Negative cohorts
- Context: the existing `step_population` can return negative cohorts under large negative migration (audit F9).
- Options: raise an error; clamp at zero and record.
- Decision: raise an error.
- Consequences: inconsistent migration inputs fail loudly; the hardening task adds the check and the test.

## D-growth-1: Human capital
- Context: a schooling term adds parameters and a series that no contract provides.
- Options: omit it in v1; include it.
- Decision: omit it and fold it into TFP; adopt it only after a backtest shows an error that a mechanism change explains.
- Consequences: two fewer parameters and no schooling series needed now.

## D-res-3: Number of value-added constants `v_r`
- Context: section 2.3 of `docs/model-design.md` said 9 constants but listed ten resource names (`lithium copper gold silver oil gas soy wheat corn other`), and the `forecast_output` contract has `resource = other` too.
- Options: nine (leave `other` without a constant); ten (one per listed name, including `other`).
- Decision (human, 2026-10-04): ten. `other` needs its own `v_r` for `R_t = sum_r v_r q_r` to cover every resource in the contract.
- Consequences: resources have 20 entries (15 fixed, of which 10 data constants; 5 random) and the model 35 in all (23 fixed, 1 calibrated, 11 random); `2·11 + 23 + 1 = 46` fitted or assumed values. `model-params` transcribes 35 entries. The units of every `v_r` still depend on `D-gdp-1`.

## D-geo-1: National territory on the map
- Context: the province build (`docs/geo.md`) needs a human decision on how the national territory is drawn; the source layer may include the Antarctic sector and the southern islands.
- Options: continental provinces only; continental provinces plus the southern islands and the Antarctic sector in the same layer; continental provinces plus the Malvinas as a separate illustration.
- Decision (human, 2026-10-03): continental provinces and the Malvinas Islands, nothing else. The Malvinas are an imprecise hand-drawn outline, shown only as territory (no data, not selectable).
- Consequences: the registered input layer must exclude the Antarctic sector and far islands; the outline lives in `web/src/geo/malvinas.ts` and is labeled illustrative; no claim of precision is made.


## Human batch of 2026-10-04: every open decision answered with its recommendation

The human asked for every pending decision to be taken with the recommended option, so the project is fully specified; any of them can be reopened later. The entries below record each one. Two things cannot be decided by recommendation and stay open: the real red of the diverging ramp (a color the human must supply, never invented) and the competition deadline and criteria (a fact about the outside world). The 3D presentation is the priority of the visual work (D-3d-6).

### Model (section 9 of `docs/model-design.md`)
Confirmed as recommended: D-scen-1, D-res-1, D-ai-1, D-prov-1, D-bt-1, D-pop-1, D-growth-1 (entries above) and the ones below.

## D-scen-2: Separation threshold
- Context: criterion C4 needs a scenario separation threshold fixed before any run.
- Options: 20% of the pooled width at horizon 20; another value.
- Decision: 20%, revisited after the first run only by a new decision, never tuned on results.
- Consequences: assumption A31 keeps its range 10% to 30% as the sensitivity range, not as a tuning range.

## D-res-2: Project capex outside core investment
- Context: project capex could double count with the core investment rate `s·Y_core`.
- Options: outside; inside `s·Y_core`.
- Decision: outside.
- Consequences: no financing mechanism is modeled (A16); the resource block stays additive.

## D-ai-2: Admissible quantity of the AI overlay
- Context: AI estimates arrive in different quantities (TFP, labor productivity, output).
- Options: TFP growth in pp/year only, plus exact compounding; also labor productivity.
- Decision: TFP growth only.
- Consequences: other quantities are never converted except by exact arithmetic spelled out in the model (A26).

## D-gdp-1: GDP basis
- Context: every GDP level and every `v_r` needs one basis.
- Options: market-rate constant USD of the source's base year; PPP; another base year.
- Decision: market-rate constant USD of the source's base year, stated next to every GDP figure.
- Consequences: `data-economy-population` and the `v_r` units use this basis; the exact base year is the one of the registered source and is written in `docs/sources.md`.

## D-hdi-1: Provincial HDI
- Context: a provincial HDI needs provincial education and health series that no contract provides.
- Options: not produced; produced.
- Decision: not produced; HDI is national only.
- Consequences: the province view has no HDI indicator.

## D-data-1: Age-structured population contract
- Context: the population component cannot be calibrated without age-structured data.
- Options: create the task `population-age-contract`; skip it.
- Decision: create it (it is READY).
- Consequences: `model-population-drivers` and `data-economy-population` wait for it.

### Assumptions the human had to decide (`docs/assumptions.md`)
A10, A13, A15, A16, A24, A26, A31, A32 and A33 are accepted as written, with the ranges and rules in the register: A13 follows D-growth-1, A15 follows D-res-1 and D-res-3, A16 follows D-res-2, A24 follows D-prov-1, A26 follows D-ai-2, A31 follows D-scen-2, A32 keeps factor 1.25 at horizon 5 and 8 of 12 coverage (D-bt-1), A33 keeps 18 of 24 (D-prov-1). A10, A15 and A26 are accepted as the working design but still need a source for their values (status `needs_source`).

### 3D presentation (`presentation-3d.md`)
## D-3d-1: One 3D stack
- Decision: Three.js, bundled, the one 3D stack (not MapLibre). Already built (`web/src/three/`, `web/src/charts3d/`).

## D-3d-2: First load with 3D
- Decision: the 2D dashboard (or a poster) shows first and 3D streams in as its own chunk; `chunk_max` for the 3D chunk and the raised main budget in `web/budgets.json` are accepted on purpose (main 143,360 B, 3D chunk 409,600 B).
- Consequences: nothing else may be added to the main chunk without lazy loading; every 3D view keeps its table and a flat fallback without WebGL2.

## D-3d-3: Province geometry
- Decision: Natural Earth admin-1 (public domain) via `npm run build:geo`, plus the imprecise Malvinas outline (D-geo-1). Already committed in `web/public/geo/`.

## D-3d-4: Typeface
- Decision: the system sans stack for the UI and the 3D labels. No webfont, no CDN (the CSP allows `font-src 'self'` only). A bundled display face can be added later with its license on the References page.

## D-3d-5: Tour length and scenes
- Decision: the narrated tour is the six views drafted from the proof of concept: mining, mix, GDP, per capita, ranking and map. Recorrido (tour) is the default and Explorar (free) is the other mode.

## D-3d-6: 3D is the priority of the visual work
- Context: the human stated that 3D is important and key.
- Options: 3D and 2D in parallel; 3D first.
- Decision: 3D first. Before any 2D polish, the 3D presentation is completed in this order: (1) 3D versions of the views that are still flat (treemap with blocks, rank history, doubling curve); (2) fix the rough spots of the existing renderers (label collisions in the lines and fan, camera angles, wall thickness and lane spacing of the lines, map heights); (3) the country-to-zone 3D map (F5) and the Andes (F6, needs the terrain); (4) the narrated tour parts of `presentation-3d` and the live simulation (F7). 2D stays as the data view and the accessible alternative.
- Consequences: the 3D polish items lead the scope of D-polish-7.

### Andes (`andes-integration.md`)
## D-andes-1 to D-andes-4: Andes scene
- Decision: (1) the renderer is Three.js, bundled (the proof of concept's stack, same as D-3d-1); (2) the dependency is the `three` version already pinned for the 3D views (0.186.1), shared in the same chunk, not a second copy; the human re-checks the look against `test/map_test1.html`; (3) the geometry comes from the baked terrain of `web/src/terrain/` (real DEM), not the prototype's noise; (4) the scene is in Spanish with `APP_LOCALE = 'es-AR'`.
- Consequences: `andes-integration` still waits for the terrain outputs (the human's DEM step).

### Polish (`polish.md`)
## D-polish-1: UI language and locale
- Decision: Spanish, `APP_LOCALE = 'es-AR'`, `lang="es"` (already applied in F2b). Resolves open decision 1 of `design.md`.

## D-polish-2: Typeface
- Decision: the system sans stack (same as D-3d-4). Resolves open decision 2 of `design.md`.

## D-polish-3: Red arm of the diverging ramp
- Decision: not decided here. No color is invented: the placeholder stays until the human supplies the design color.
- Consequences: this is the one visual item that still waits for the human.

## D-polish-4: Focus ring color
- Decision: keep `--color-focus` #ffc107 (in use, passes contrast on the dark theme). It supersedes the #3987e5 value written in `design.md`.

## D-polish-5: `--state-critical` as text
- Decision: do not add a new color. Critical messages get an icon and a different treatment (weight and border), and `--state-critical` stays for fills, borders and icons, not for body text.
- Consequences: the "Error loading data." messages are restyled in the polish pass.

## D-polish-6: Motion library
- Decision: GSAP (already added at 3.15.0 exact, loaded where used); CSS only for trivial transitions; everything respects `prefers-reduced-motion`.

## D-polish-7: Scope of the pass
- Decision: every item of the "Visual debt" lists of `PENDING.md` is in scope, ordered by D-3d-6: the 3D items first, then the story panel, province map, forecast, economy and sandbox scenes, and the visits table.

### Other open points
- Voice of the Spanish UI text: keep the neutral impersonal forms (no voseo); one pass over the strings changes it later.
- `storytelling-substeps`: the defaults taken are confirmed (keys `PageDown`/`PageUp`/`Home`; entering a scene restarts its story at step 1; no story across scenes except the "Next scene" button; caption panel at the bottom, now a floating card in the right panel of the dashboard).
- `geo-provinces`: Natural Earth admin-1 confirmed; `target_max_bytes` and `max_area_change_pct` keep their config values until real results exist.
- `terrain-bake`: the dependency exception (numpy, rasterio, Pillow pinned, only under `scripts/terrain/`) and the local precheck SKIP when they are missing are accepted; the Earth radius 6,371,008.8 m is accepted.
- The "arrows move the year" acceptance item is dropped: `KEY_MAP` stays as it is (arrows change scene; the year moves with Space or the store).
- Bundle budgets: main 143,360 B and the 3D chunk 409,600 B in `web/budgets.json` are accepted; a later lazy-loading pass may tighten them.
- Still open (not decidable here): the competition deadline and criteria (block `docs-submission` and `demo-video`).
