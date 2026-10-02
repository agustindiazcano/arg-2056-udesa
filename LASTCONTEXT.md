# LASTCONTEXT

Overwrite at the end of every task. Keep under 80 lines.

## State
- Date: 2026-10-02
- Branch: `task/shell`
- Implemented the `web` shell: Vite + React setup, Zustand store with reducer, keyboard hook, requestAnimationFrame ticker, and basic component scaffolding (TabBar, Hud, MockBadge, ProvinceFilter, Scenes placeholders). Test coverage for all logic is 100% green. Lint and typecheck are green.

## Decisions
- Stack: Vite + React + TypeScript, Zustand, MapLibre GL terrain + deck.gl, Three.js for custom layers, D3 + ECharts, GSAP.
- Model: Python reference (calibration, backtest, Monte Carlo fan) + reduced TS port with parity test.
- Workflow: one agent at a time, one branch per task, TDD, CI validation, human approval of every PR.
- Package manager: npm (not pnpm).
- `forecast-contract`: Schema uses Draft 2020-12 to enforce exact shapes for the model output.
- `mock-data`: Deterministic generator creates realistic mock JSONs so UI development can proceed. 
- `precheck`: Run `python scripts/precheck.py` locally before every push.
- `shell`: Basic React tree set up. All game loop logic inside `reducer.ts` for predictability. `useKeyboard` handles keybindings. `useTicker` handles time progression. Components built.

## Open questions
- Competition deadline and evaluation criteria (determines MVP scope).
- Which provinces and which time range have usable historical production data.

## Next step
- `model-py`: population cohorts, growth accounting, resource pipeline, scenarios, AI multiplier, Monte Carlo fan. OR `data-pipeline`.
