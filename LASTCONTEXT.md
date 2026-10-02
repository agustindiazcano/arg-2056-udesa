# LASTCONTEXT

Overwrite at the end of every task. Keep under 80 lines.

## State
- Date: 2026-10-02
- Branch: `task/contract`
- Repo scaffolded with shared types, JSON Schemas, data validation scripts, and basic CI (web lint/typecheck/test, python ruff/pytest).

## Decisions
- Stack: Vite + React + TypeScript, Zustand, MapLibre GL terrain + deck.gl, Three.js for custom layers, D3 + ECharts, GSAP.
- Model: Python reference (calibration, backtest, Monte Carlo fan) + reduced TS port with parity test.
- Workflow: one agent at a time, one branch per task, TDD, CI validation, human approval of every PR.
- Package manager: npm (not pnpm).
- Task `contract`: `Scene`, `Year`, `DayOfCampaign`, `Scenario`, `Province`, `KeyAction` types defined and tested. Draft 2020-12 schemas created for `economy_series`, `resource_production`, `population`, and `andes_events`.

## Open questions
- Competition deadline and evaluation criteria (determines MVP scope).
- Which provinces and which time range have usable historical production data.

## Next step
- Task `data-pipeline`: scripts and processed datasets with `source` + `retrieved_at` (resources, economy, population, provinces).
