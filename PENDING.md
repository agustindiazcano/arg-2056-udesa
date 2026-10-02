# PENDING

## Task queue (in order)

1. [ ] `data-pipeline`: scripts and processed datasets with `source` + `retrieved_at` (resources, economy, population, provinces).
2. [ ] `shell`: Vite app, tabs, Zustand store, keyboard map, scene state machine, 2D/3D toggle, province filter.
3. [ ] `model-py`: population cohorts, growth accounting, resource pipeline, scenarios, AI multiplier, Monte Carlo fan.
4. [ ] `backtest`: calibrate to 2005, evaluate 2006-2025, store baseline, CI gate.
5. [ ] `model-ts`: reduced TS port with parity test against golden vectors.
6. [ ] `scene-resources`: treemap, bars, critical resources, investment and production.
7. [ ] `scene-forecast`: 2056 fan, scenarios, province choropleth, rankings, resource selector.
8. [ ] `scene-economy`: growth since 1880s, LATAM ranking.
9. [ ] `scene-ai-revolution`: sourced multiplier range, 10 and 20 year horizons.
10. [ ] `scene-sandbox`: editable indicators, rule of 70 explainer, HDI and GDP per capita implications.
11. [ ] `scene-andes`: terrain map, army particles, animation, speed, battle selection, side panel.
12. [ ] `polish`: bloom, easing, palette, transitions, reduced-motion, performance pass.

## Data to verify (human, against original source)

- [ ] (empty)

## Model assumptions (record in `docs/assumptions.md`)

- [ ] (empty)

## Visual debt (deliberately left rough until `polish`)

- [ ] (empty)

## Blocked / questions

- [ ] Competition deadline and evaluation criteria.

## Done

- [x] `precheck`: added local python verification script.
- [x] `mock-data`: deterministic mock data generator and CI gate.
- [x] `forecast-contract`: Draft 2020-12 schemas for forecast output.
- [x] `contract`: shared types (`Scene`, `Year`, `Scenario`, `Province`, `KeyAction`), dataset JSON Schemas, base CI (lint, typecheck, test, schema validation).
- [x] Folder tree and context files scaffolded.
