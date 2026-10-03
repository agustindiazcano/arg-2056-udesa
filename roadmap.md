# Roadmap: single list of tasks and briefs

This file is the one list. `PENDING.md` (the agent's queue) must use these slugs. Brief status says whether `docs/tasks/<slug>.md` exists; it says nothing about whether the task was executed (track that in `PENDING.md`).

Legend: **core** = needed for the submission; **opt** = optional, cut first if time is short.

## A. Briefs written (24)

| # | Slug | Brief | What it also absorbed |
|---|---|---|---|
| 1 | `contract` | written | schemas for economy, resources, population, Andes events; CI base |
| 2 | `forecast-contract` | written | forecast output schema, checks, TS parser and selectors |
| 3 | `precheck` | written | local gate script |
| 4 | `mock-data` | written | deterministic mock, `no-mock` gate |
| 5 | `shell` | written | state, keyboard, tabs, HUD, MOCK badge, `build:release` |
| 6 | `composition-contract` | written | composition and projects schemas |
| 7 | `projections-contract` | written | projects migration, production projections, data dictionary |
| 8 | `scene-resources` | written | treemap, province bars, trend, projects table, `EChart`, `DataTable`, tokens |
| 9 | `data-pipeline` | written | raw manifest, adapters protocol, provenance, sources registry, `sync-data`, data size budget |
| 10 | `research-contracts` | written | five research-input schemas, checks, parsers, mocks |
| 11 | `model-design` | written | design document, assumptions register, decisions log, replaces the model task list in `PENDING.md` |
| 12 | `audit` | written | reusable independent review (any target) |
| 13 | `scene-forecast` | written | fan chart, ranking, tiles, AI overlay toggle |
| 14 | `terrain-bake` | written | DEM baking tool, terrain loader and sampling in TS, verify command |
| 15 | `geo-provinces` | written | province geometry build, loader, metadata |
| 16 | `scene-forecast-map` | written | province choropleth inside the forecast scene |
| 17 | `scene-economy` | written | long-run chart, rank bars, rank history, placeholder eras and their release gate |
| 18 | `scene-sandbox` | written | rule-of-70 arithmetic, sliders, comparison with the model range (no model port needed) |
| 19 | `references-page` | written | `build-references` command, second Vite entry, release gate for empty references, shell footer link |
| 20 | `storytelling-substeps` | written | step state, three new keys, caption panel, play-range runner, placeholder steps and gate |
| 21 | `integration` | written | data smoke test, bundle budget, Playwright e2e, expected-failure CI step, release checklist |
| 22 | `performance-a11y` | written | scene code splitting, tree-shaken ECharts, quality tiers and WebGL fallback infrastructure, reduced motion, axe checks, contrast test, focus and landmarks |
| 23 | `deploy` | written | link-preview metadata and its release gates, data cache busting, host-neutral headers and CSP, release job, smoke script for a deployed URL |
| 24 | `mutation-testing` (opt) | written | mutmut and Stryker with a no-regression gate and a baseline |

## B. Briefs still to write (20)

| # | Slug | Class | Blocked by |
|---|---|---|---|
| 25 | `model-params` | core | content of `docs/model-design.md` |
| 26 | `model-population` | core | design |
| 27 | `model-growth-core` | core | design |
| 28 | `model-resources` | core | design |
| 29 | `model-ai-overlay` | core | design |
| 30 | `model-montecarlo` | core | design |
| 31 | `backtest-baselines` | core | design |
| 32 | `backtest-run` | core | design, verified economy data |
| 33 | `sensitivity` | core | design |
| 34 | `model-provinces` | core | design |
| 35 | `model-ts-port` | opt | design |
| 36 | `andes-integration` | core | the renderer of the Andes prototype; terrain outputs; `performance-a11y` (uses `useQuality`) |
| 37 | `data-andes` | core | verified Andes research |
| 38 | `data-resources` | core | verified mining, energy and agro research |
| 39 | `data-economy-population` | core | verified economy and population research |
| 40 | `data-research-inputs` | core | verified research (forecasts, vintages, base rates, AI estimates, dataset catalog) |
| 41 | `polish` | core | design decisions by the human |
| 42 | `docs-submission` | core | contest criteria; model results (methodology and limitations pages) |
| 43 | `scene-forecast-map-3d` | opt | renderer decision |
| 44 | `demo-video` | opt | contest requirements |

Core remaining: 17. Optional: 3 (`model-ts-port`, `scene-forecast-map-3d`, `demo-video`).

## C. Mapping from the coarse tasks in the agent's board to these slugs

| Board entry | Slugs |
|---|---|
| Model: Growth Accounting | `model-params`, `model-growth-core` (golden vectors are part of its tests; the TS port is `model-ts-port`, optional) |
| Model: Resources Pipeline | `model-resources` |
| Model: AI Multiplier | `model-ai-overlay` |
| Model: Monte Carlo Fan | `model-montecarlo` |
| Backtest & Calibration | `backtest-baselines`, `backtest-run`, `sensitivity` |
| Scene: Forecast | `scene-forecast` (done), `scene-forecast-map` |
| Scene: Economy & Sandbox | `scene-economy`, `scene-sandbox` |
| Scene: AI & Andes | `andes-integration`; the AI explainer is a toggle on the forecast scene, not a scene |
| Polish | `performance-a11y` (written), `polish` |
| (not on the board) | `model-design`, `model-population`, `model-provinces`, `terrain-bake`, `geo-provinces`, `data-*`, `references-page`, `storytelling-substeps`, `integration`, `deploy`, `docs-submission` |

## D. Human tasks (not briefs)

1. Run the six research sessions (`docs/research-prompts.md`), store results in `data/raw/research/<scope>/`, verify 10 URLs and 3 numbers per scope.
2. Download the DEM, register it, set the bounding boxes, run `terrain-bake`, verify against the passes, commit the outputs.
3. Choose the province geometry source, register it, fill `id_map`, run `build:geo`, review, commit the outputs.
4. Write the real era list and the real story steps, with sources.
5. Decide the open design decisions in `docs/design.md`.
6. Confirm the contest deadline and criteria.
7. Confirm the budgets in `web/budgets.json` and the data budget.
8. Run the audit before merging model code and before submission.
9. Run `docs/release-checklist.md` before submitting.