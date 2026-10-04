# Roadmap: single list of tasks and briefs

This file is the one list. `PENDING.md` (the agent's queue) must use these slugs. Brief status says whether `<slug>.md` exists in the repository root; it says nothing about whether the task was executed (`PENDING.md` and the status table in `TASKS.md` track that). `TASKS.md` holds the prompt of every task.

Legend: **core** = needed for the submission; **opt** = optional, cut first if time is short. **draft** = the brief exists but is blocked by input only the human has (it lists exactly what).

## A. Briefs written (49)

### A1. Foundations, data and scenes (21, all executed)

| # | Slug | What it also absorbed |
|---|---|---|
| 1 | `contract` | schemas for economy, resources, population, Andes events; CI base |
| 2 | `forecast-contract` | forecast output schema, checks, TS parser and selectors |
| 3 | `precheck` | local gate script |
| 4 | `mock-data` | deterministic mock, `no-mock` gate |
| 5 | `shell` | state, keyboard, tabs, HUD, MOCK badge, `build:release` |
| 6 | `composition-contract` | composition and projects schemas |
| 7 | `projections-contract` | projects migration, production projections, data dictionary |
| 8 | `scene-resources` | treemap, province bars, trend, projects table, `EChart`, `DataTable`, tokens |
| 9 | `data-pipeline` | raw manifest, adapters protocol, provenance, sources registry, `sync-data`, data size budget |
| 10 | `research-contracts` | five research-input schemas, checks, parsers, mocks |
| 11 | `model-design` | design document, assumptions register, decisions log |
| 12 | `audit` | reusable independent review (any target) |
| 13 | `scene-forecast` | fan chart, ranking, tiles, AI overlay toggle |
| 14 | `terrain-bake` | DEM baking tool, terrain loader and sampling in TS, verify command |
| 15 | `geo-provinces` | province geometry build, loader, metadata |
| 16 | `scene-forecast-map` | province choropleth inside the forecast scene |
| 17 | `scene-economy` | long-run chart, rank bars, rank history, placeholder eras and their release gate |
| 18 | `scene-sandbox` | rule-of-70 arithmetic, sliders, comparison with the model range |
| 19 | `references-page` | `build-references`, second Vite entry, release gate for empty references |
| 20 | `storytelling-substeps` | step state, three new keys, caption panel, placeholder steps and gate |
| 21 | `integration` | data smoke test, bundle budget, Playwright e2e, expected-failure CI step, release checklist |

### A2. Quality and delivery (3, executed except the optional one)

| # | Slug | Class | What it covers |
|---|---|---|---|
| 22 | `performance-a11y` | core, executed (PR #29) | scene code splitting, tree-shaken ECharts, quality tiers, reduced motion, axe, contrast, focus, landmarks |
| 23 | `deploy` | core, executed (PR #34) | metadata and its release gates, data cache busting, headers and CSP, precompiled validators, release job, smoke script |
| 24 | `mutation-testing` | opt | mutmut and Stryker with a no-regression gate |

### A3. Model, from `docs/model-design.md` section 8 (14, not executed)

| # | Slug | Class | Blocked by |
|---|---|---|---|
| 25 | `model-params` | core | nothing (`D-res-3` decided: ten value-added constants) |
| 26 | `model-population-hardening` | core | nothing (audit F5, F8, F9) |
| 27 | `population-age-contract` | core | nothing (decision `D-data-1`) |
| 28 | `model-population-drivers` | core | 25, 26, 27 |
| 29 | `model-growth-core` | core | 25, 26 |
| 30 | `model-hdi` | core | 25, 28, 29; the goalposts are `needs_source` |
| 31 | `model-resources` | core | 25 (mock data) |
| 32 | `model-ai-overlay` | core | 25 (29 should be merged) |
| 33 | `model-montecarlo` | core | 28 to 32; real runs need parameter values |
| 34 | `backtest-baselines` | core | nothing for the code; real runs need the series of 41 |
| 35 | `backtest-run` | core | 33, 34, verified real series 1990 to 2025 |
| 36 | `sensitivity` | core | 33; the published result needs real ranges |
| 37 | `model-provinces` | core | 33 |
| | `model-ts-port` | opt | 29, 32 (and 28, 30 for the full port) |

(The old line `model-population` of the first roadmap was split by the design into 26, 27, 28 and 30.)

### A4. Scenes (4)

| # | Slug | Class | Blocked by |
|---|---|---|---|
| 38 | `scene-ai-revolution` | core | nothing (works on mock data; the forecast scene keeps its own AI overlay toggle, this is the scene tab) |
| 39 | `andes-integration` | core | terrain outputs committed (`D-andes-1` to `D-andes-4` decided) |
| 40 | `scene-forecast-map-3d` | superseded | replaced by `presentation-3d` (3D is now the default presentation, not an optional map variant) |
| 48 | `presentation-3d` | core | F2b merged; decisions `D-3d-1` to `D-3d-6` taken; real province geometry for part 3 (`presentation-3d-shell` onward). A program of six PRs: engine, shell, charts A, story, charts B, Andes/zone map |
| 49 | `map-navigation` | core | nothing (dashboard D1 to D6 merged); 3D first (`D-3d-6`) |
| 50 | `fullscreen-viewer` | core | nothing; better after 49 (the popup reuses the navigable maps and 3D views) |

### A5. Real data (4, not executed; all need the human's research first)

| # | Slug | Class | Blocked by |
|---|---|---|---|
| 41 | `data-economy-population` | core | economy and population research verified; 27 (`D-gdp-1` decided) |
| 42 | `data-resources` | core | mining, energy and agro research verified |
| 43 | `data-andes` | core | Andes research verified |
| 44 | `data-research-inputs` | core | research of forecasts, vintages, base rates, AI estimates and catalog verified, with its format documented |

### A6. Delivery (3, not executed)

| # | Slug | Class | Blocked by |
|---|---|---|---|
| 45 | `polish` | core | `D-polish-3` color from the human (the rest decided); model and data tasks done, unless the human starts it earlier |
| 46 | `docs-submission` | core, draft | the contest's rules and criteria; 35 |
| 47 | `demo-video` | opt, draft | what the contest requires |

## B. Briefs still to write

None. Every task of the roadmap has a brief. The UI redesign (F1 to F8 of the approved plan: believable mock, Spanish shell, filters, motion and story, 3D, Andes, live simulation, polish) is tracked in `LASTCONTEXT.md`; F1 (PR #36) and F2a (PR #37) are merged, F2b is next. The two **draft** briefs (`docs-submission`, `demo-video`) are complete in structure and list the human inputs they wait for; rewrite them in place when those inputs arrive.

## C. Mapping from the coarse tasks in the agent's board to these slugs

| Board entry | Slugs |
|---|---|
| Model: Growth Accounting | `model-params`, `model-growth-core` (the TS port is `model-ts-port`, optional) |
| Model: Resources Pipeline | `model-resources` |
| Model: AI Multiplier | `model-ai-overlay` |
| Model: Monte Carlo Fan | `model-montecarlo` |
| Backtest & Calibration | `backtest-baselines`, `backtest-run`, `sensitivity` |
| Scene: Forecast | `scene-forecast` (done), `scene-forecast-map` (done) |
| Scene: Economy & Sandbox | `scene-economy`, `scene-sandbox` (done) |
| Scene: AI & Andes | `scene-ai-revolution`, `andes-integration`, `presentation-3d` |
| Polish | `performance-a11y` (done), `polish` |
| (not on the board) | `model-design`, `model-population-*`, `model-hdi`, `model-provinces`, `terrain-bake`, `geo-provinces`, `data-*`, `references-page`, `storytelling-substeps`, `integration`, `deploy`, `docs-submission` |

## D. Done outside the briefs (each one is a merged PR; no brief was written)

| PR | Slug | What |
|---|---|---|
| #30, #31 | `vercel-config` | `vercel.json` (install, build, output; the Python venv because the Vercel Python is externally managed) |
| #32 | `vercel-analytics` | Vercel Web Analytics and Speed Insights, on only in a Vercel build |
| #33 | `visits-archive` | `scripts/sync_visits.py`, the weekly workflow that opens a PR, the Visits section of the References page (`docs/visits.md`) |

## E. Human tasks (not briefs)

1. Run the six research sessions (`docs/research-prompts.md` does not exist yet), store results in `data/raw/research/<scope>/`, verify 10 URLs and 3 numbers per scope.
2. Download the DEM, register it, set the bounding boxes, run `terrain-bake`, verify against the Andes facts, commit the outputs.
3. Choose the province geometry source, register it, fill `id_map`, run `build:geo`, review, commit the outputs.
4. Write the real era list and the real story steps, with sources.
5. Decisions: all taken with their recommendations on 2026-10-04 (`docs/decisions.md`); what remains is the red arm of the diverging ramp (`D-polish-3`, a color you supply) and the competition's deadline and criteria.
6. Confirm the contest deadline and criteria; they unblock `docs-submission` and `demo-video`.
7. Confirm the budgets in `web/budgets.json` and the data budget.
8. Run the audit before merging model code and before submission.
9. Deploy: first Vercel deploy, `python scripts/smoke_deployed.py <url>`, the description, final URL, `og.png` and `favicon.svg` (`docs/deploy.md`).
10. Visits archive: the Vercel token and ids as GitHub secrets, the Actions permission, one manual run (`docs/visits.md`).
11. Run `docs/release-checklist.md` before submitting.
