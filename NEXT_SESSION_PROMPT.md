Go to main, pull, and start **F2b**: scenes and charts in Spanish with shared components. Branch `task/ui-scenes-es`.

Setup
- Create the branch from an up-to-date `main` (never push or merge to `main`).
- Read in this order: `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `roadmap.md`, `docs/ui.md`, `design.md`, then `presentation-3d.md` (context only: F2b is its prerequisite) and the plan `C:\Users\agusd\.claude\plans\a-ver-falta-armar-moonlit-bunny.md` (phase F2, plus the final section "el 3D es la presentación por defecto").
- Always check the project root folder for missing docs.

State of the repo
- Merged: F1 believable mock (PR #36), F2a Spanish shell and design tokens (PR #37), docs for the 3D direction (PR #38: `presentation-3d.md`, `test/dashboard_3d_PoC.html`).
- The shell is Spanish (Header, TabBar, control bar, province dialog, `Segmented`, `WebGLRequired`, `MockBadge`, scene labels in `web/src/scenes/registry.ts`). The scenes, their charts, the story panel and the references page are still English.
- Tables no longer scroll inside boxes (axe `scrollable-region-focusable`): scene rows grow with content and `main.scene-container` scrolls. Keep that.
- Baseline: 924 unit tests, 62 e2e, `python scripts/precheck.py` OK, main bundle about 104,385 B gzip (`npm run check:bundle`). CI was never read.
- Tokens: only `tokens.css` and `tokens.ts` may hold color literals; `ui.css` uses `color-mix()` from tokens; spacing scale 4/8/12/16/24/32/48.

F2b scope
- Shared `SceneShell` (title, subtitle, source), `TableToggle` (about 8 copies today) and `FilterBar`, used by every scene.
- Translate the scenes, chart builders (titles, axes, aria-labels, tooltips), data tables, story caption panel and references page to Spanish.
- `APP_LOCALE = 'es-AR'` for every number and date format; `lang="es"` in `index.html` and the references entry.
- Update the unit tests and the e2e specs (scene headings are still English in `web/e2e/fixtures.ts`).
- Out of scope: new charts, 3D, motion, filters behavior (that is F3), real data, story text rewriting.

Things to know
- Do not change `KeyAction`, `KEY_MAP` or the store shape.
- jsx-a11y forbids `tabIndex` on non-interactive elements; do not add scroll boxes.
- The e2e fixture fails on console errors, failed requests and any request to another origin. The text check looks for `failed|error loading|undefined` and a case-sensitive `NaN`.
- CSP is strict (no CDN, no eval, no Google fonts). Validators are precompiled: after editing a schema run `npm run gen:validators` in `web/`.
- Mock data is illustrative (`source: "MOCK"`); the release gate `scripts/check_no_mock.py` stays.
- If a contrast check fails, do not change a color: stop and report the token pair and ratio.

How to work
- Strict TDD: a failing-test commit before each implementation commit. Atomic commits `type(scope): summary`, with the Co-Authored-By trailer.
- No new dependencies. Never silence a checker (`as unknown as`, `@ts-ignore`, `eslint-disable`, `# noqa`).
- Windows notes: use the Write tool for large files (Write needs a prior Read of an existing file; Git Bash heredocs with quotes and backslashes break); normalize CRLF in text comparisons; open Python files with `encoding="utf-8"`; never `git add -A` inside `web/`; long commands (full vitest, precheck, Playwright) go in the background with output to a file.
- Run `python scripts/precheck.py` and `npm run test:e2e` before every push. Read the CI status before saying it is green; otherwise write "pushed, CI not checked".

Finish
- Overwrite `LASTCONTEXT.md`, update `PENDING.md`. Push, open a PR with "what changed / what was verified / what the human must verify".
- Report in Spanish with tables and traffic lights.

After F2b (order): F3 filters and province map (needs the province geometry decision `D-3d-3`), then `presentation-3d` parts 1 to 4 together with F4 (motion and story), then Andes and zone map, live simulation, polish.
