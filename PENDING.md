# PENDING

## Task queue (in order)

1. [x] `data-pipeline`: scripts and processed datasets with `source` + `retrieved_at` (resources, economy, population, provinces).
2. [x] `shell`: Vite app, tabs, Zustand store, keyboard map, scene state machine, 2D/3D toggle, province filter.
3. [ ] `model-design`: written in `docs/model-design.md`; the 14 tasks below replace the old `model-py`, `backtest` and `model-ts` lines.
   1. [ ] `model-params` (can start now)
   2. [ ] `model-population-hardening` (can start now; audit F5, F8, F9)
   3. [ ] `population-age-contract` (can start now)
   4. [ ] `model-population-drivers` (blocked by 3)
   5. [ ] `model-growth-core` (can start now)
   6. [ ] `model-hdi` (blocked by 4)
   7. [ ] `model-resources` (can start now, mock)
   8. [ ] `model-ai-overlay` (can start now)
   9. [ ] `model-montecarlo` (blocked by 4, 5, 7, 8)
   10. [ ] `backtest-baselines` (blocked by real series 1990-2025)
   11. [ ] `backtest-run` (blocked by 9, 10)
   12. [ ] `sensitivity` (blocked by 9)
   13. [ ] `model-ts-port` (blocked by 5, 8)
   14. [ ] `model-provinces` (blocked by 9)
6. [x] `scene-resources`: treemap, bars, critical resources, investment and production.
7. [x] `scene-forecast`: 2056 fan, scenarios, province ranking, AI overlay, resource selector (PR open; choropleth moved to `scene-forecast-map`).
   - [ ] **Human step before `scene-forecast-map`**: choose the source, register the file, fill `geo/config.json`, run `npm run build:geo`, review the metadata, commit the outputs in `web/public/geo/`. See `docs/geo.md`.
   - [ ] `scene-forecast-map`: province choropleth. Blocked by the human step above (real geometry committed by the human).
8. [ ] `scene-economy`: growth since 1880s, LATAM ranking.
9. [ ] `scene-ai-revolution`: sourced multiplier range, 10 and 20 year horizons.
10. [ ] `scene-sandbox`: editable indicators, rule of 70 explainer, HDI and GDP per capita implications.
11. [ ] `scene-andes`: terrain map, army particles, animation, speed, battle selection, side panel.
12. [ ] `polish`: bloom, easing, palette, transitions, reduced-motion, performance pass.

## Data to verify (human, against original source)

- [ ] (empty; the forecast scene shows mock data only)

## Model assumptions (record in `docs/assumptions.md`)

- [ ] 34 entries A01-A34 in `docs/assumptions.md`, all unsourced. Human decides: A10, A13, A15, A16, A24, A26, A31, A32, A33.

## Visual debt (deliberately left rough until `polish`)

- [ ] Forecast scene: look and feel against `design.md`, history line and "History | Forecast" divider (mock has no history), plain buttons, layout spacing.
- [ ] Forecast ranking: rows beyond top 10 are hidden, a selected province outside the top 10 is not shown.

## Blocked / questions

- [ ] Competition deadline and evaluation criteria.
- [ ] `geo-provinces` decisions (human): source dataset and license; how the national territory is drawn; `target_max_bytes` and `max_area_change_pct` after seeing real results.
- [ ] Mock `forecast_output` has province series only for `resource_production` (18 provinces, 6 resources); GDP, GDP per capita, population and HDI have national series only, so the province ranking is empty for them. Not extended, per the brief.
- [ ] Acceptance item "arrows moving the year" conflicts with `KEY_MAP` (left and right arrows change scene); the year moves with play (Space) or the store. `KEY_MAP` was not changed.
- [ ] Open decisions D-scen-1 to D-data-1 in section 9 of `docs/model-design.md`.
- [ ] `docs/sources.md` and `docs/research-prompts.md` do not exist; no parameter can have a `source_id` yet.

## Done

- [x] `geo-provinces`: build tool (`web/scripts/geo`), schemas, typed loader (`web/src/geo`), `docs/geo.md`. No real geometry committed.
- [x] `research-contracts`: Draft 2020-12 schemas for research, TS types, mock data generation and precheck CI gates.
- [x] `projections-contract`: schemas, tests, checks, mock generation, types and docs for production projections.
- [x] `composition-contract`: schema, checks, types and mock data generator.
- [x] `precheck`: added local python verification script.
- [x] `mock-data`: deterministic mock data generator and CI gate.
- [x] `forecast-contract`: Draft 2020-12 schemas for forecast output.
- [x] `contract`: shared types (`Scene`, `Year`, `Scenario`, `Province`, `KeyAction`), dataset JSON Schemas, base CI (lint, typecheck, test, schema validation).
- [x] Folder tree and context files scaffolded.

- [x] model-population: Population cohorts model and TS port parity test.