# Last Context

## State
- Task `briefs` on branch `task/briefs`: documentation only, no code. Every task of the roadmap now has a brief in the repository root and a prompt in `TASKS.md`.
- Merged on `main` before this: `performance-a11y` (#29), `vercel-config` (#30, #31), `vercel-analytics` (#32), `visits-archive` (#33), `deploy` (#34). The app is deployed on Vercel with mock data.
- 24 briefs written: the 14 model tasks of `docs/model-design.md` section 8 (`model-params`, `model-population-hardening`, `population-age-contract`, `model-population-drivers`, `model-growth-core`, `model-hdi`, `model-resources`, `model-ai-overlay`, `model-montecarlo`, `backtest-baselines`, `backtest-run`, `sensitivity`, `model-ts-port`, `model-provinces`); `scene-ai-revolution`, `andes-integration`; the four `data-*` tasks; `polish`; and three **draft** briefs blocked by human input (`docs-submission`, `scene-forecast-map-3d`, `demo-video`).
- `TASKS.md`: new prompt sections for all of them, statuses fixed, and a new "Next Steps" table (DONE, READY, BLOCKED with what each needs). `roadmap.md` rewritten (48 briefs, nothing left to write; section D lists the work done outside the briefs; section E the human tasks). `PENDING.md` rewritten with the same statuses.

## Decisions and findings
- Briefs live in the repository root (`<slug>.md`); the old prompts said `docs/tasks/`.
- READY now: `model-population-hardening`, `population-age-contract`, `backtest-baselines` (code only), `scene-ai-revolution`, `mutation-testing`.
- Findings that need the human: `model-design` lists ten resource names for nine value-added constants (`D-res-3`, blocks `model-params`); the Andes proof of concept `test/map_test1.html` loads Three.js from a CDN, which the CSP forbids (it must be bundled, `D-andes-1` to `D-andes-4`); `docs/sources.md` and `docs/research-prompts.md` do not exist; research mocks are not in `data/mock/` (`scene-ai-revolution` wires `ai_estimates.json`); the age contract needs a `female_share` field that the design uses (added to `population-age-contract`).
- The three draft briefs are complete in structure and list what the human must supply; rewrite them in place when that arrives.
- Nothing was run (documentation task); no CI result was read. Pushed, CI not checked.

## Next step
- Human: review the briefs (above all `model-params`, `andes-integration`, `scene-ai-revolution`); answer `D-res-3`, `D-andes-1` to `D-andes-4`, `D-polish-1` to `D-polish-7`, `D-gdp-1`; supply the contest rules.
- Agent: start from the READY list. The first ones recommended: `scene-ai-revolution` (visible progress, no blocker) and `model-population-hardening` plus `population-age-contract` (unblock the model chain).
