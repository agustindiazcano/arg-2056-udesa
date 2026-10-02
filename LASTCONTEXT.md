# LASTCONTEXT

Overwrite at the end of every task. Keep under 80 lines.

## State
- Date: 2026-10-01
- Branch: `main`
- Repo scaffolded: folder tree and context files only. No code, no CI, no dependencies yet.

## Decisions
- Stack: Vite + React + TypeScript, Zustand, MapLibre GL terrain + deck.gl, Three.js for custom layers, D3 + ECharts, GSAP.
- Model: Python reference (calibration, backtest, Monte Carlo fan) + reduced TS port with parity test.
- Workflow: one agent at a time, one branch per task, TDD, CI validation, human approval of every PR.
- Order: contract, data and model, shell, charts and map, Andes, visual polish last.
- Package manager: npm (not pnpm).
- Andes uses its own `DayOfCampaign` type, separate from `Year`.
- Task `contract` is delegated to a smaller agent via `docs/tasks/contract.md`; human reviews the PR closely (schemas strictness, test quality, CI not faked).

## Open questions
- Competition deadline and evaluation criteria (determines MVP scope).
- Which provinces and which time range have usable historical production data.

## Next step
- Task `contract`: define `Scene`, `Year`, `Scenario`, `Province`, `KeyAction` types, JSON Schemas for datasets, base CI (lint, typecheck, tests).
