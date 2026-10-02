# AGENTS.md — Argentina 2056

Canonical instructions for every coding agent working in this repository.
`CLAUDE.md` and `GEMINI.md` only point here. If they conflict with this file, this file wins.

## 1. Project

Interactive, keyboard-driven data story: Argentina from 1810 to 2056.

Scenes (top tabs):

| Scene | Content |
|---|---|
| `andes` | Crossing of the Andes (1817). 3D terrain map, army as moving particles, side data panel, speed control, battle selection with camera fly-to. |
| `economy` | 1880s to today. Growth of the economy and ranking against Latin American peers. |
| `resources` | Storytelling with charts: treemaps (GDP / exports composition), bars (mining, oil and gas, agro), critical resources, current investment and production. |
| `forecast` | Time travel to 2056. Pessimistic / expected / optimistic scenarios, per-province production map, rankings, selectable by resource. |
| `ai-revolution` | Automation and AI impact as an explicit, sourced multiplier with a wide uncertainty range. |
| `sandbox` | User changes indicators and sees the projected effect. Includes growth-compounding explainer (rule of 70) with HDI and GDP per capita implications. |

Global controls: tabs, 2D/3D toggle, province filter, play/pause, speed, scenario, full keyboard control.

Goal: win a competition. That means visual polish **and** defensible numbers. Defensible numbers come first.

## 2. Core principle

**The AI decides, the engine measures.** No claim, number or model is accepted because it looks plausible. It is accepted because a test, a backtest, a schema validation or a human check passed.

Scientific stance (applies to the forecast model):
- Model real mechanisms first, math second. Fewest parameters that explain the data.
- Falsifiable only. Every model has a backtest. No ad hoc patches per error.
- Uncertainty is shown as a fan (percentiles). The three scenarios are readings of that fan, not independent curves.
- Assumptions are visible in the UI and in `docs/assumptions.md`.

## 3. Stack

- `web/`: Vite + React + TypeScript (strict), Zustand, MapLibre GL (terrain) + deck.gl, Three.js only for custom layers / intro, D3 + ECharts, GSAP, Vitest, Playwright.
- `model/`: Python 3.12, pytest, mutmut, numpy / pandas. Calibration, backtest, Monte Carlo fan.
- Package manager: npm (commit `package-lock.json`). Do not use pnpm or yarn.
- `data/`: versioned raw and processed datasets, JSON Schemas.
- CI: GitHub Actions.
- No SSR, no Next.js, no Astro. Do not introduce them.

## 4. Repository layout

```
data/raw/           untouched source files, one folder per source, with SOURCE.md
data/processed/     reproducible outputs of scripts/, never hand-edited
data/schemas/       JSON Schemas for every processed dataset
model/src/argmodel/ population, growth, resources, scenarios, ai_multiplier
model/tests/        unit tests
model/backtest/     calibration window, holdout, error metrics, reports
model/parity/       golden vectors consumed by the TS parity test
web/src/types/      shared contract: Scene, Year, Scenario, Province, KeyAction
web/src/state/      Zustand store (scene, year, speed, scenario, province, mode)
web/src/scenes/     one folder per scene
web/src/map/        MapLibre + deck.gl setup and layers
web/src/charts/     reusable chart components
web/src/model-ts/   reduced TS port of the model for live sliders
web/tests/{unit,visual,parity}
scripts/            data pipeline entry points
docs/               assumptions.md, sources.md, decisions.md
```

## 5. Workflow (non-negotiable)

1. One agent at a time. One branch per task: `task/<short-slug>`.
2. Strict TDD for logic: write the failing test, then the code, then refactor. Commit atomically.
3. Heavy validation runs in CI, not locally. Locally run only the fast tests for the files you touched. Before every push run `python scripts/precheck.py` (same cheap checks as CI: ruff, pytest, validate_data, web lint, typecheck, tests). Never push if it fails. Heavy validation (mutation testing, backtest, visual snapshots) runs only in CI.
4. Mutation testing runs on the diff for `model/` and `web/src/state`, `web/src/model-ts`.
5. A human approves every pull request. Never merge. Never push to `main`.
6. Small PRs: one chart, one layer, one dataset, one model component.
7. Never bypass hooks, skip tests, lower thresholds or weaken a test to make CI pass. If a test is wrong, say so in the PR and fix it explicitly.
8. Never claim CI is green. Report "pushed, CI not checked" unless you read the run status.
9. Tests of scripts assert the exact exit code and a message fragment, and always include the positive case (exit 0).
10. Tests never write inside the real `data/` directory; use temporary directories.
11. Never silence a checker (`as unknown as`, `@ts-ignore`, `# noqa`, `--unsafe-fixes`) without a one-line justification in the PR.

Commit format: `type(scope): imperative summary` (types: feat, fix, test, refactor, data, docs, chore, ci).

## 6. Data rules

- Every record in `data/processed/` has `source` (name + URL or citation) and `retrieved_at` (ISO date). A CI test fails if any record lacks them.
- Never invent, interpolate silently or "fill in" a figure. Gaps are explicit `null` with a `note`.
- Historical figures with disagreement between historians (Andes crossing: columns, dates, troop and mule counts) use one primary source, mark the range and list alternatives in `docs/sources.md`.
- Every number you add that will appear in the UI is listed under "Data to verify" in `PENDING.md` until a human confirms it against the original source.
- Preferred sources: Secretaria de Energia, Secretaria de Mineria, MAGyP, INDEC, BCRA, World Bank, UN WPP, Maddison Project, IMF, USGS, UNDP (HDI).

## 7. Model rules

- Components: population (cohort model, UN WPP baseline), GDP (growth accounting: capital, labor, TFP), resources (project pipeline, reserves, capex, price, physical constraints), AI multiplier (explicit, sourced range).
- Backtest is mandatory: calibrate on data up to 2005, report error 2006-2025. A CI gate fails if backtest error regresses beyond the stored tolerance in `model/backtest/baseline.json`.
- Python is the reference implementation. `web/src/model-ts` must reproduce the golden vectors in `model/parity/` within the stated tolerance. A CI test enforces it.
- Rule of 70 (doubling time = 70 / growth rate in %), not "rule of 7".
- AI impact is shown as a range with citations, never as a point prediction.

## 8. Frontend rules

- Canvas / map is fixed full viewport; HTML overlay on top with `pointer-events: none` except interactive elements.
- Scene transitions are driven by a state machine (current scene, year, speed). GSAP timelines are triggered by state changes and key events, not by scroll.
- Never compute projections per frame. Read from precomputed arrays; heavy Monte Carlo runs in Python offline or in a Web Worker.
- Clean up WebGL contexts, listeners and GSAP timelines on unmount.
- Charts: treemap for composition, bars for rankings, choropleth for provinces, line + fan for series. No pie charts.
- Keyboard map (defaults): `←/→` previous/next scene, `Space` play/pause, `+/-` speed, `1/2/3` scenario, `D` toggle 2D/3D, `P` province filter, `Esc` back/close.
- Accessible by keyboard, readable contrast, respects `prefers-reduced-motion`.
- Visual polish (bloom, easing, palette) comes last. Do not start it before the model and data tasks in `PENDING.md` are done.

## 9. Testing by layer

| Layer | Tool | What is asserted |
|---|---|---|
| Model (Python) | pytest, mutmut | numerical behavior, invariants, backtest gate |
| Model port (TS) | Vitest | parity with golden vectors |
| State / logic | Vitest, mutation on diff | store transitions, key map, scene state machine |
| Data | pytest / ajv | schemas, `source` + `retrieved_at` present, no silent gaps |
| Visual | Playwright (headless Chromium, software GL) | few keyframe snapshots with tolerance |
| Animation | Vitest | each frame reads from the precomputed array |

## 10. Definition of done

- Failing test written first, now green; CI green.
- No unsourced numbers; `PENDING.md` updated.
- `LASTCONTEXT.md` updated.
- PR description states: what changed, what was verified, what still needs human verification.

## 11. Context files protocol

- `LASTCONTEXT.md`: read it first in every session. Overwrite it at the end of every task with the current state, decisions and next step. Keep it under 80 lines.
- `PENDING.md`: the task queue and the three standing lists (data to verify, model assumptions, visual debt). Update, never delete history silently; move finished items to "Done".

## 12. Do not

- Do not add dependencies without stating why in the PR.
- Do not commit secrets or API keys. Do not commit large raw files without a `SOURCE.md`.
- Do not hand-edit anything under `data/processed/`.
- Do not change a scenario parameter without recording it in `docs/assumptions.md`.
- Do not describe unverified facts as certain, in code, copy or docs.
