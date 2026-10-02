# LASTCONTEXT

Overwrite at the end of every task. Keep under 80 lines.

## State
- Date: 2026-10-02
- Branch: `task/precheck`
- `scripts/precheck.py` implemented as a local CI gate to prevent pushing broken code. `validate_data.py` hardened with `--processed` and explicit error codes. TypeScript bypass (`as unknown as`) removed by using `ajv.compile<ForecastOutput>`. Mock data generation script (`gen_mock.py`) and gate (`check_no_mock.py`) merged.

## Decisions
- Stack: Vite + React + TypeScript, Zustand, MapLibre GL terrain + deck.gl, Three.js for custom layers, D3 + ECharts, GSAP.
- Model: Python reference (calibration, backtest, Monte Carlo fan) + reduced TS port with parity test.
- Workflow: one agent at a time, one branch per task, TDD, CI validation, human approval of every PR.
- Package manager: npm (not pnpm).
- `forecast-contract`: Schema uses Draft 2020-12 to enforce exact shapes for the model output, and `check_forecast.py` handles the non-expressible cross-point constraints.
- `mock-data`: Deterministic generator creates realistic mock JSONs (including nulls, gaps, crises) so UI development can proceed. A `check_no_mock.py` script guards `data/processed` and `web/public/data`.
- `precheck`: Run `python scripts/precheck.py` locally before every push. It runs ruff, pytest, validate_data, and web lint/typecheck/test.

## Open questions
- Competition deadline and evaluation criteria (determines MVP scope).
- Which provinces and which time range have usable historical production data.

## Next step
- `shell`: Vite app, tabs, Zustand store, keyboard map, scene state machine, 2D/3D toggle, province filter.
