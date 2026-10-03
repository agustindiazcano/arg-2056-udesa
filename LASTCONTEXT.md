# Last Context

## State
- Task `integration` on branch `task/integration`: the whole app can be verified as one system, automatically.
- Data: `web/src/data/registry.ts` (`DATASETS`: file, parser, `requiredBy`) and `web/tests/unit/data-smoke.test.ts` (every file registered and parsed, manifest and `_version.json` consistent, every scene has data or is in `NO_DATA`, scene sources match the registry, `check_data_budget.py` exits 0). `andes_events.json` and `population.json` had no TS parser, so the registry builds one from their existing schema. `references.json` is optional and is the only file not in the manifest.
- Bundle: `web/scripts/lib/bundle.ts` (`closureOf`, `dynamicChunks`, `gzipSizes`, `measure`, `compare`, `suggestedBudget`), `web/scripts/check-bundle.ts` (`npm run check:bundle`, exit 0/1/2, `--report`), `web/budgets.json` (measured values, marked initial), `build.manifest: true`.
- E2E: `@playwright/test` 1.63.0 (only new dependency), `web/playwright.config.ts`, `web/e2e/*.spec.ts`, fixture that fails on console errors, page errors, failed requests and other origins. `npm run test:e2e` (its `pretest:e2e` syncs data and builds references). CI job `e2e` runs on every PR: data sync, build, `check:bundle`, the expected-failure step, Playwright, artifacts `playwright-report` and `e2e-screenshots`. Web job now syncs data and has Python (the smoke test needs both).
- `scripts/expect_failure.py` (exit 0 only if the command fails with the text; 1 mismatch; 2 usage). `docs/release-checklist.md` written.
- Hooks added to the UI: `data-testid="scene"` (scene container) and `data-testid="hud-year"` with `data-value` (HUD year). No other UI change except the bug fix below.
- Bug found and fixed: scene controls were not clickable with the mouse (overlay `pointer-events: none` is inherited). Rule in `tokens.css` for interactive elements inside `.scene-container`, separate commit `fix(shell)`.

## Decisions
- The brief's arrow-key e2e test was adapted: ArrowRight/Left change the scene (KEY_MAP), the year moves with Space. The brief's missing script `sync-data` is `data:sync`.
- The e2e text check uses "error loading", not "error" (legitimate copy contains "error"), and `NaN` case-sensitive.
- `chunk_max` applies to dynamic chunks only; none exist today, so it was set from the largest emitted file and is not exercised yet.
- E2E locally: Chromium installed with `npx playwright install chromium` and run. Result: see the PR.

## Next step
- Human: review the PR; confirm budgets; check the `e2e` job and screenshots in CI; decide whether to keep the `fix(shell)` commit.
- Next: `performance-a11y`.
- Pushed, CI not checked.
