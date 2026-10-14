# Consolidation plan: 15 slides + simulator -> 7 slides (A-G)

Status: Phase 0, updated with the human decisions of 2026-10-14 (no code changed). Written 2026-10-14 from a read of `web/src/tour`, `web/src/tour3d`, `web/src/datasets`, `web/tests/unit`, `web/e2e` and `.github/workflows/ci.yml`.

## 0. Decisions (resolved by the human on 2026-10-14)

| # | Question | Decision |
|---|---|---|
| Q1 | 7 or 8 slides | 7 slides (A-G). The simulator is folded into B and stops being a separate app section. |
| Q2 | Branch prefix | `task/<slug>`, as in `AGENTS.md` and `CLAUDE.md`. No change to those files. (This PR keeps its original branch name `feat/consolidation-plan` because renaming would close it; every later PR uses `task/`.) |
| Q3 | Slide G | Short spike on the coverage of a sovereign-spread series (G2) and World Bank B-READY (G3). If neither can be fetched, drop the slide (G4). The 0-10 score is never migrated. The human decides after the spike. |
| Q4 | AI in slide B | One engine: AI is a simulator parameter (`ai` in `simModel.ts`). The "With AI" tab shows the same projection with the parameter on, over the same fan. No hand-drawn curve. |
| Q5 | Fan of slide B | Interim bootstrap on 1960-2025 World Bank volatility, tagged `partial`, replaced by `model-montecarlo` output when it lands. |
| Q6 | Exports year range | Ship with the years that exist (2024, 2025); the INDEC 2015-2023 series is a data request. |
| Q7 | Slide C without provincial data | Ship with the placeholder badge inside the chart and the list of missing data. |
| Q8 | Task order | The order of section 8. |

## 1. Current state (what exists today)

- **Navigation.** `TOUR_STEPS = 15` in `web/src/state/reducer.ts`; steps 0-14 are numbered buttons (`app/TourSteps.tsx`). The simulator is a separate section (`SECTIONS = andes, dashboard, tour, simulator, data`).
- **Routing of a step.** `tour/TourStep.tsx`: step 14 -> `ProductivityStep`, step 0 -> `WorldStep`, step 2 -> `ProvinceStep`, everything else -> `ChartStep` driven by `TOUR_CHARTS` in `tour/tourCharts.ts` (title, subtitle, `build()` returning an ECharts option and an optional 3D spec). Step 7 is a `kind: 'map'` entry of `ChartStep`.
- **Side text.** `tour/stepInfo.ts` (`STEP_INFO[step]`: heading, paragraphs, `data: real | parcial | prueba`, note, refs) rendered by `TourSidebar.tsx`.
- **Controls already present.** `ui/Segmented.tsx` (used in `WorldStep`, `ProvinceStep`, `ProductivityStep`, `Simulator`, `ChartStep`). No tabs component, no year selector component (the world replay has its own timeline in `WorldStep`/`useTimeline.ts`).
- **Data page.** `datasets/slides.ts` `buildSlides()` returns one `SlideData` per step id (`'0'..'14'`, `'sim'`) with `DataTable[]` and a single `mock` boolean per slide; references in `datasets/references.ts`. `DataTable` has no per-series quality, source or date; those live in the slide `refs` and in `stepInfo` notes.
- **Pipeline.** `data/processed/` has only `external_forecasts.json`. Everything else in the Recorrido is hand-curated TS/JSON in `web/src/tour` (`worldGdp.json`, `energyArgentina.json`, `agroArgentina.json`, `miningArminera.ts`, `productivityData.json`, `tourData.ts`).
- **Tests that pin the current structure** (will need migration, never deletion of assertions on values): `dataSection.test.tsx` (slide ids list, table counts), `tour.test.tsx`, `tourCharts.test.tsx`, `tourSidebar.test.tsx`, `simulator.test.tsx`, `productivity.test.tsx`, `gdpTour.test.tsx`, `gdpConsistency.test.ts`, `provinceMapBuilder.test.ts`, `worldAnim.test.ts`, `tourChart3d.test.tsx`, `tourIso.test.tsx`; e2e `scenes.spec.ts`, `keyboard.spec.ts`, `a11y*.spec.ts`, `viewports.spec.ts`.
- **CI** (`ci.yml`): `web` (lint, typecheck, `data:sync`, vitest), `e2e` (build, bundle budget, Playwright), `no-mock` and `release` only on tags/manual, plus Python and data jobs. Bundle budgets in `web/budgets.json` apply; the Recorrido is lazy-loaded.

## 2. Mapping: current slide -> new slide

| New slide | Absorbs (old #) | Real data it keeps | What stays placeholder | Gaps against the brief |
|---|---|---|---|---|
| A. Where Argentina was and is | 0 | World Bank real GDP 1960-2025 (constant 2015 USD), INDEC population | none | Basis toggle: **leave out** (see section 5). |
| B. GDP: history and projection | 1, 3, sim, 5 | History 1990-2025 (World Bank), 2026 (IMF growth), external projections tables (IMF/OECD/UN), indicators | Fan and projection from 2027 until Task 7; AI curve (becomes a parameter) | Investment and productivity assumptions need visible defaults; investment 13.1 vs 16.1 % conflict (H13) is open. |
| C. Productive structure | 2, 7, 12 | Hydrocarbons by province (Secretaría de Energía 2025), GDP composition by sector (INDEC 2025, prelim., 2004 prices) | Mining, agro, industry, services by province | **Blocked on real provincial data** for 4 of 5 sector buttons. Per-capita mode needs INDEC population by province (not in repo). GDP composition by province does not exist in the repo; the "filtered when a province is selected" panel can only filter the national chart if the province series exist. |
| D. Exports | 4, 11 | INDEC exports by complex 2024-2025, great items Jan-Jul 2026 | none | Year range 2015-2025 not available (only 2024-2025). |
| E. Resources | 8, 9, 10, 13 | Mining exports 2018-2024 and 2035 projection (ARMINERA, hand-transcribed), oil 2015-2025 and 1950-2025, gas 2015-2025, agro tonnes (MAGyP), oil and gas reserves | Hydrocarbon projection and band, resource stock value, agro potential, per-mineral time series for gold and silver | Mining by mineral: only 2024 shares exist for gold/silver/lithium; no copper exports series. Gas conventional/unconventional split and Vaca Muerta share only as 2025 figures in text. |
| F. Productivity | 14 | TFP and output per hour, 4 countries (sources to re-verify, D21) | none, but unverified | Country selector = existing hidden-set legend; becomes explicit buttons. |
| G. Investor view | 6 | none | the entire 0-10 score | Not migrated by decision. |

Old slides are removed from the nav only when the new slide covers all their real data (definition of done).

## 3. Shared components to extract (Task 2)

| Component | Replaces / generalizes | Notes |
|---|---|---|
| `DataQuality` badge | `tour-side-badge` in `TourSidebar`, the `gdp-mock` span in `ChartStep` | Renders inside every chart frame (not only the sidebar). Props: `quality`, `source`, `retrieved_at`. Placeholder charts get a visible diagonal label drawn in the chart area. |
| `TabbedChart` | `ProductivityStep` tablist, `ProvinceStep` sector buttons | Accessible tablist (roving tabindex, arrow keys), lazy panel mount. |
| `MetricToggle` | the `Segmented` instances with metric semantics (`WorldStep` region metric, GDP/per-capita) | Thin typed wrapper over `ui/Segmented.tsx`; do not duplicate it. |
| `YearSelector` | `useTimeline`/range input of `WorldStep` | Discrete years from the data (disabled outside the available range), keyboard support. |
| Series store | `tourData.ts`, `miningArminera.ts`, JSON files | Section 4. |

Constraints: each component gets unit tests first (render, keyboard, ARIA, quality visible); no new dependency; ECharts stays tree-shaken; check `npm run check:bundle` stays within `budgets.json`.

## 4. Data schema changes

Target record, as in the brief:

```
{ series_id, value, unit, year, quality: 'real' | 'partial' | 'placeholder', source, retrieved_at }
```

Plan:

1. Add `web/src/data/series.ts` with the `Series`/`SeriesPoint` types and a `toTable(series)` adapter that produces today's `DataTable` rows byte for byte.
2. Migration is **adapter-first**: existing constants stay where they are; a thin registry maps each to `series_id` + `quality` + `source` + `retrieved_at` (taken from the existing `STEP_INFO.data`, `refs` and notes). No value is retyped.
3. **No-value-change test:** a Vitest test snapshots, per Data table id, the current rows (generated once from `main` into a fixture committed in the same PR as the migration) and asserts the migrated rows equal them cell by cell. This is a value assertion, not a rendering snapshot.
4. Mapping of existing flags: `real -> real`, `parcial -> partial` (per series, not per slide: a slide with real history and placeholder projection yields two series), `prueba -> placeholder`. `SlideData.mock` becomes derived (`any series placeholder`).
5. Longer term, series move to `data/processed/` through the pipeline (`economy_series` is next per `LASTCONTEXT.md`); not part of this consolidation.
6. A CI test fails if any series lacks `source`, `retrieved_at` or `quality`, and if a `placeholder` series is rendered without the badge.

Data page: it is keyed by old step ids today. It will be re-keyed to the new slide ids (A-G) with **every existing table kept** (assert: the set of table ids before and after is a superset). Old ids stay as anchors for the CSV/download links until Task 9.

## 5. What cannot be built honestly today (flagged, not invented)

| Item in the brief | Status | Action |
|---|---|---|
| A: GDP basis toggle PPP / current | PPP is banned project-wide (standing decision); current USD is not in the repo and the project rule is a single real constant-2015 source | Leave the toggle out, as the brief allows. |
| B: calibrated fan | Possible from World Bank 1960-2025 volatility | Task 7; method documented in `docs/assumptions.md`. |
| C: mining, agro, industry, services by province; per-capita mode; GDP composition by province | No dataset in the repo; agro by province needs the MAGyP portal (H9), mining by province needs SIACAM | Ship with placeholder badge and list the data needed (below). |
| D: year selector 2015-2025 | Only 2024 and 2025 by complex | Selector with available years; request the INDEC series. |
| E: mining by mineral time series | Only totals 2018-2024 and 2024 shares | Per-mineral series needs ARMINERA/SIACAM detail (H3b verification also pending). |
| E: hydrocarbons conventional vs unconventional | Not in repo | Secretaría de Energía "producción no convencional" tables (datos abiertos); request. |
| F: sources | The cited PWT/FRED/INDEC links were never re-downloaded (D21) | Task 5 verifies and reports discrepancies before merging. |
| G: sovereign spread / B-READY | No data in repo | Section 6. |

Data to be requested (added to `docs/data-requests.md` in the task that needs it): INDEC exports by complex 2015-2023; Secretaría de Energía non-conventional oil and gas series; MAGyP agro by province; SIACAM mining by province and mineral; INDEC population by province; INDEC GVA by province (Cuentas de crecimiento y desigualdad / PBG provincial); a sovereign spread series (BCRA or JP Morgan EMBI via a public source).

## 6. Slide G: options (decision requested)

| Option | What it shows | Source | Pros | Cons |
|---|---|---|---|---|
| G1. Keep the 0-10 score | Invented factor scores | none | No work | Unfalsifiable, violates the data rules; rejected. |
| G2. Sovereign risk spread | EMBI-style spread for Argentina vs Brazil, Chile, Mexico, 2015-2026 | BCRA / public EMBI series (to be fetched) | One real number investors actually watch; falsifiable | Needs a fetchable public series; EMBI is a licensed index, check the license. |
| G3. World Bank B-READY | Business-environment scores by topic | World Bank B-READY 2024 | Multi-factor, matches the original idea | Argentina may not be in the first cohorts; verify coverage first. |
| G4. Drop the slide | none | none | Cleanest | Loses the investment angle (partly covered by RIGI tables in E). |

Recommendation: investigate G2 and G3 coverage in a short spike at Task 9; if neither is fetchable, G4. The 0-10 score is not migrated in any case.

## 7. Test strategy

- **TDD** per task: failing test first, same PR as the code.
- **Data correctness**: value-equality tests against fixtures from `main` (migration), plus invariants: shares sum to 100 (+/- rounding stated), totals equal sums where the source says so, `gdpConsistency.test.ts` unchanged (all GDP charts start from the same 2026 value).
- **Quality**: every series has the three fields; a placeholder series always renders the badge inside the chart (component test).
- **Components**: unit tests for `DataQuality`, `TabbedChart`, `MetricToggle`, `YearSelector` (keyboard, ARIA, disabled years).
- **Navigation**: reducer tests for the new `TOUR_STEPS`; keyboard e2e (`keyboard.spec.ts`) and a11y (`a11y*.spec.ts`, axe) updated, not weakened.
- **No snapshot-only tests** for data; Playwright screenshots stay as smoke only.
- All suites run in CI; locally only the touched files plus `python scripts/precheck.py` before pushing.

## 8. Task list, ordered by dependency

| # | Task (branch `task/...`) | Depends on | Blocked by | Output |
|---|---|---|---|---|
| 1 | `consolidation-plan` (this PR) | none | approval | This document |
| 2 | `shared-components-schema`: `DataQuality`, `TabbedChart`, `MetricToggle` (on top of `ui/Segmented.tsx`), `YearSelector`, series types + no-value-change migration | 1 | none | Components, adapter, tests |
| 3 | `slide-exports` (D) | 2 | none (data real) | Slide D; old 4 and 11 removed |
| 4a | `slide-resources-hydrocarbons-agro` (E part 1) | 2 | none (agro tonnes, oil and gas real) | E tabs Hydrocarbons and Agro |
| 4b | `slide-resources-mining` (E part 2) | 4a | H3b (verify ARMINERA transcription) | E tab Mining |
| 4c | `slide-resources-stock` (E part 3), then remove old 8, 9, 10, 13 | 4b | stock value is placeholder | E tab Stock |
| 5 | `slide-productivity` (F) | 2 | D21 re-download of sources | Slide F; discrepancy report in PR |
| 6 | `slide-structure` (C) | 2, 3 (for the composition panel) | provincial data (section 5); ships with the placeholder badge | Slide C with placeholder badge; data list |
| 7 | `slide-gdp` (B): tabs Base / With AI / Simulator, rule of 70 panel, bootstrap fan, visible assumptions; the simulator section is removed from the app nav | 2 | none (Q4, Q5 decided) | Slide B; old 1, 3, 5 and `sim` removed |
| 8 | `slide-world` (A) | 2 | none | Slide A; old 0 removed |
| 9 | `slide-investor` (G) | 2 | spike result and human decision (Q3) | Per decision |
| 10 | `nav-cleanup`: `TOUR_STEPS`, nav buttons, Data selector, `README.md`, `docs/data-requests.md`, `LASTCONTEXT.md`, `PENDING.md` | all slides | all | Final structure |

Each slide PR leaves the old steps in place until the new slide covers all their real data; Task 10 renumbers the navigation once. After every PR the work stops until the human approves.

## 9. Risks

| Risk | Mitigation |
|---|---|
| The app has 15 numbered steps hard-wired in the reducer, e2e and Data page tests. | Keep old steps until the replacing slide is complete; renumber once in Task 10. |
| Bundle budget (`web/budgets.json`) with tabbed lazy charts. | Lazy-load tab panels; run `check:bundle` in every PR. |
| 3D views (`tour3d`) exist for steps 3-13 and not for the interactive slides. | Keep 2D/3D toggle only where a 3D spec exists today; no new 3D work in this consolidation. |
| Hand-transcribed ARMINERA data is unverified. | Tagged `partial` until H3b is done. |
| Scope creep into the model (fan, AI). | Interim bootstrap fan only; real fan comes from `model-montecarlo`. |

## 10. Sidebar and references

Each new slide gets one `STEP_INFO`-style entry (heading, text, `how`, note, refs) merged from the old ones, with the quality shown per series. References (`datasets/references.ts`, `docs/references.md`) are carried over unchanged; new ones are added only with their source read. Nothing is dropped.

## 11. Working rules for every task PR

- One branch `task/<slug>` and one PR per task; never commit or push to `main`; stop after each PR and wait for explicit human approval.
- TDD; tests run in CI; locally only the touched tests plus `python scripts/precheck.py` before each push; never report CI green without reading the run.
- Never weaken or delete value assertions of existing tests; if a test is wrong, say so in the PR.
- Code, commits, comments and README in English; UI, Data and reference texts in Spanish.
- No invented numbers; every series carries `quality`, `source`, `retrieved_at`; placeholder data is labeled inside the chart.
- Permanent project rules: all GDP real at constant 2015 USD (World Bank), no PPP, every number of the Recorrido in Data with its reference (`references.ts`, `docs/references.md`), human data tasks in `docs/data-requests.md`.
- Budgets: `web/budgets.json` and `scripts/check_data_budget.py`; no new dependency without a justification in the PR.
- At the end of each task: overwrite `LASTCONTEXT.md` and update `PENDING.md`. Each PR description lists what changed, the data sources touched, what stays placeholder and what a human must verify.
