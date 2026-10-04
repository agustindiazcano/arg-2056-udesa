Go to main, pull, and start task 11: `performance-a11y`.

Setup
- Create the branch `task/performance-a11y` from an up-to-date `main` (never push or merge to `main`).
- Read in this order: `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, then the brief `performance-a11y.md` in the repo ROOT (not in `docs/tasks/`), then `docs/design.md`, `docs/afaw-light.md`, `docs/release-checklist.md`, and the code the brief lists (`web/budgets.json`, `web/vite.config.ts`, `web/playwright.config.ts`, `web/e2e/`, `web/src/charts/EChart.tsx` and its tests, the chart builders, `web/src/scenes/registry.ts`, `tokens.css`, `tokens.ts`).
- Always check the project root folder for missing docs.

State of the repo
- Tasks 0-10 are merged (last: `integration`, PR #28). `main` passes `python scripts/precheck.py` (9 steps) and CI, including the new `e2e` job (20 Playwright tests).
- The prerequisite `integration` is merged. Its bundle measurement (`npm run check:bundle`, `web/scripts/lib/bundle.ts`) and e2e suite are the base of this task.
- Measured baseline, gzip level 9: initial `main` 503,824 B, `references` 112,749 B; budgets in `web/budgets.json` are 579,584 and 130,048 (x1.15, not yet confirmed by the human). The main JS is about 1.2 MB minified because every scene and the whole of ECharts load up front. There are no dynamic chunks today, so `chunk_max` (452,608) is not exercised yet. Put the before and after table in the PR.

Things to know before you start
- `web/e2e/` is typechecked and linted (`tsconfig.json`, `npm run lint`). `npm run test:e2e` runs `pretest:e2e` (data sync and `build_references.py`), then builds and serves with `vite preview` on port 4173. Chromium is installed locally; run the suite before the push.
- Hooks added by `integration`: `data-testid="scene"` on the scene container and `data-testid="hud-year"` (with `data-value`) on the HUD year. Lazy loading must keep both working; the e2e scene specs wait for the heading or the placeholder text, which will now appear after the "Loading scene" fallback.
- `integration` fixed a real bug: scene controls were not clickable because the overlay is `pointer-events: none` and the property is inherited. The rule is in `tokens.css` under `.scene-container` (selectors: button, input, select, textarea, a, `[role='img']`). If the accessibility work adds new interactive elements inside a scene, check they are covered.
- The e2e text check looks for `failed|error loading|undefined` and a case-sensitive `NaN`; plain "error" is legitimate copy ("error +0.2%" in the sandbox).
- The e2e fixture fails on console errors, page errors, failed requests and any request to another origin. Code splitting must not add a failing request.
- `ArrowRight` and `ArrowLeft` change the scene, not the year (`KEY_MAP`); do not change `KeyAction`, `KEY_MAP` or the store shape in this task.
- The reducer reads the static `STEPS`; `StoryCaption` and `StepRunner` are mounted in `App.tsx`. The caption panel is fixed at the bottom; keep it out of the way of the accessibility checks (focus order, landmarks).
- If a contrast check fails, do not change a color: stop and report the token pair and the ratio (the brief says the human decides).

How to work
- Strict TDD: a failing-test commit before each implementation commit. Atomic commits `type(scope): summary`, with the Co-Authored-By trailer.
- Dependencies allowed (devDependencies, exact versions): `@axe-core/playwright` and `eslint-plugin-jsx-a11y`. Nothing else; state why in the PR.
- No new features, no visual redesign, no Andes scene work (only the capability and quality infrastructure the brief describes).
- Never silence a checker (`as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`) without a one-line justification in the PR. No `continue-on-error`, no `|| true`.
- Windows notes: use the Write tool for large files (Git Bash heredocs with quotes and backslashes break; a `\b` in a Python string inside a heredoc becomes a backspace, use `chr(92)`); never `git add -A` inside `web/`; async tests need `configure({ asyncUtilTimeout: 4000 })`; long commands (full vitest, precheck, Playwright) go in the background with output to a file.
- Run `python scripts/precheck.py` and `npm run test:e2e` before every push. Read the CI run status before saying CI is green; otherwise write "pushed, CI not checked".
- If the brief conflicts with the code (as with the arrow keys and `sync-data` in `integration`), adapt, say so in the PR, and list the deviation. If something outside the brief is broken, ask before fixing it.

Finish
- Overwrite `LASTCONTEXT.md`, update `PENDING.md` and `TASKS.md` (mark `performance-a11y` done; the human step "confirm budgets" is rewritten with the new numbers).
- Push, open a PR with "what changed / what was verified / what the human must verify".
- Report in Spanish with tables and traffic lights.
