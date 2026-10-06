# Task: `integration`

Branch: `task/integration`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/design.md`, `docs/afaw-light.md`, `docs/data-pipeline.md`, `scripts/precheck.py`, `.github/workflows/*.yml`, `web/package.json`, `web/vite.config.ts`, `scripts/check_data_budget.py`, the shell code (store, `KEY_MAP`, `TabBar`, `Hud`, `MockBadge`, scene registry), `web/src/data/useDataset.ts` and the parsers in `web/src/types/` first.
Prerequisites: `shell`, `scene-resources`, `scene-forecast`, `scene-economy`, `scene-sandbox`, `storytelling-substeps`, `references-page` and `data-pipeline` are merged into `main`. If any is missing, stop and tell me which.

## Goal

Make the whole application verifiable as one system, automatically: (1) every published data file parses with its parser and every scene's required files exist; (2) an end-to-end smoke suite drives the production build in a real browser with keyboard and mouse; (3) size budgets for data and for the JavaScript bundles are enforced; (4) a release checklist exists for the human steps that cannot be automated. The tests run on mock data today and must keep working unchanged when real data replaces the mock.

Strict TDD where it applies (library and script code). Atomic commits. Before every push run `python scripts/precheck.py`. Heavy checks (browser tests, build) run in CI, not in `precheck.py` (decision of `docs/afaw-light.md`).

## Out of scope (do NOT do)

- No new features, no UI changes, no refactors of scenes. If a test needs a stable hook the UI lacks (for example a test id), add the smallest possible attribute and list each one in the PR description.
- No visual-regression pixel assertions (screenshots are only saved as artifacts for the human).
- No accessibility audit tooling (that is `performance-a11y`), no bundle splitting work (also `performance-a11y`; this task only measures and records the current sizes).
- No dependency other than `@playwright/test` (devDependency, exact version). Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Data registry and data smoke test (Vitest, node)

Create `web/src/data/registry.ts` exporting `DATASETS: readonly { file: string; parse: (json: unknown) => unknown; requiredBy: readonly Scene[] }[]` that lists every data file the app can load, with the parser it already uses (reuse the existing parsers; do not duplicate schemas). If `useDataset` or the scenes already hold such a mapping, move it here and make them use it, with their tests still passing.

Test `web/tests/unit/data-smoke.test.ts` reads `web/public/data/` (read-only; it fails with the message `web/public/data is missing: run npm run sync-data` if the folder does not exist):
- Every file not starting with `_` has a registry entry; every registry entry whose `requiredBy` is not empty exists in the folder (an entry with an empty `requiredBy` is optional and only parsed when present).
- Every present file parses with its parser (the error message names the file).
- `_manifest.json` lists exactly the files present (excluding itself and `_version.json`) and each `origin` is `mock` or `processed`; `_version.json` matches the recomputed hash.
- Every scene in the `Scene` union has at least one registry entry in `requiredBy` or is explicitly listed as `noData` in the test with a comment saying why.
- The data budget (`scripts/check_data_budget.py`) passes: run it through a child process and assert exit code 0.

## 2. Bundle budget

Enable `build.manifest: true` in `web/vite.config.ts`.

`web/scripts/check-bundle.ts` (run with `tsx`, already available from `geo-provinces`; if it is not installed, stop and tell me):
- Reads `web/dist/.vite/manifest.json` and computes, with Node `zlib` gzip level 9, the gzip size in bytes of: (a) the **initial load** of each HTML entry (`main` and `references`): the entry file plus its transitive static `imports` plus its css, each file counted once; (b) every dynamic chunk (files reachable only through `dynamicImports`), reported individually.
- Reads `web/budgets.json` `{ "initial": { "main": N, "references": N }, "chunk_max": N }`; exits 1 and prints a table when an initial load or a chunk exceeds its budget; exit 0 otherwise; exit 2 for usage errors or a missing manifest. `--report` prints the table and exits 0 regardless.
- Creating `budgets.json`: build the app, run `--report`, set each initial budget to the measured value times 1.15 rounded up to the next 1024 bytes and `chunk_max` likewise from the largest chunk. Mark the file with a `"_note"` key: "Initial values: measured, not decided. The human confirms or tightens them." Put the measured table in the PR description.

Pure functions (`closureOf(manifest, entryKey)`, `gzipSizes(files)`, `compare(sizes, budgets)`) live in `web/scripts/lib/bundle.ts` and are unit-tested with a fixture manifest and small temporary files: closure includes transitive static imports and css and excludes dynamic imports; a chunk shared by two entries is counted once per entry; exact membership lists; sums equal the independent sum of `gzipSync` lengths computed in the test; over-budget and under-budget cases return the expected rows; a missing file named by the manifest is an error.

## 3. End-to-end smoke suite (Playwright)

Dependencies and config:
- `@playwright/test` exact version. `web/playwright.config.ts`: `webServer` runs `npm run build` then `vite preview` on a fixed port; `testDir: 'e2e'`; Chromium only; viewport 1440x900; `colorScheme: 'dark'`; `reducedMotion: 'reduce'`; `trace: 'retain-on-failure'`; one retry only in CI; screenshots saved to `web/e2e/screenshots/` (git-ignored) at the end of each scene test for human review, with no assertions on pixels.
- If the Chromium binary cannot be run in your environment, say so explicitly in `LASTCONTEXT.md` and the PR ("e2e not run locally") and do not claim it passes. An optional `PW_CHROMIUM_PATH` environment variable may set `launchOptions.executablePath`; do not hard-code any path.
- Add npm scripts `test:e2e` and `test:e2e:report`. Add a CI job `e2e` that installs the browser (`npx playwright install --with-deps chromium`), runs `npm run test:e2e`, and uploads the Playwright report and the screenshots as artifacts (always, also on failure). The job always runs on pull requests; never use `continue-on-error`.

Shared fixture (`e2e/fixtures.ts`): every test collects `console.error` messages, `pageerror` events and failed requests; at the end of each test the lists must be empty; any request whose origin differs from the preview server fails the test (this proves there are no external tile servers, fonts or scripts).

Tests (assert exact texts and attributes from the application; read the real labels and ids from the code):
1. **Boot**: `/` loads; non-empty document title; the MOCK badge is visible when the build contains mock data; the tab bar lists the scenes in the order of the `Scene` union.
2. **Scenes**: for each scene, click its tab and also reach it with the keyboard method the shell provides; the active tab is marked (`aria-selected` or `aria-current`, as implemented); the scene heading is visible; no visible text matching `/failed|error|undefined|NaN/i` in the main region; for the chart scenes (`resources`, `economy`, `forecast`, `sandbox`) at least one element with `role="img"` has a non-empty `aria-label`; one chart's "Table view" button toggles `aria-pressed` and shows a table element. Tolerate scenes that are still placeholders: they must show the placeholder text, not crash. Save a screenshot per scene.
3. **Keyboard**: ArrowRight and ArrowLeft change the displayed year in the HUD by the amount the shell defines (read `YEARS_PER_SECOND` and the step from the code; assert the exact new text); `+` and `-` change the displayed speed to the neighbor value in `SPEEDS`; `Space` toggles the playing indicator; in the forecast scene `1`, `2`, `3` set the scenario shown in the HUD; `p` opens the province filter and `Escape` closes it; `PageDown` and `PageUp` change the caption text from "Step 1 of N" to "Step 2 of N" and back; `Home` returns to step 1.
4. **Input isolation**: in the sandbox scene focus a range slider and press ArrowRight: the slider value changes and the HUD year does not.
5. **Playback with a controlled clock**: `page.clock.install()`, press `Space`, `page.clock.runFor(1000)`; the year advanced by `YEARS_PER_SECOND` times the current speed within 0.1 year; press `Space` again, run the clock another second, the year does not change.
6. **References page**: `/references.html` loads, shows the heading "Sources and attributions" and, on mock data, the sample-data message; the link back to the app works; the shell footer link opens it.
7. **Viewports**: at 1280x720 and 1920x1080 there is no horizontal page scroll (`document.documentElement.scrollWidth <= window.innerWidth`) on each scene.

Keep each test independent and under 30 seconds; the whole suite should take no more than a few minutes. Use role- and label-based locators, not CSS paths. Add `data-testid` attributes only where nothing semantic exists (list them in the PR).

## 4. Expected-failure check for the release gate

`scripts/expect_failure.py <command...> --stderr-contains "<text>" [--stdout-contains "<text>"]`: runs the command and exits 0 only if the command exits non-zero **and** the given text appears; exits 1 otherwise, printing what happened. Tests (pytest, with small commands such as `python -c`): command fails with the text (exit 0), command fails without the text (exit 1), command succeeds (exit 1), usage error (exit 2). In CI add a step after the build: `python scripts/expect_failure.py npm --prefix web run build:release --stdout-contains "<the exact mock message the release gate prints>"` (read the real message from the existing gate). While the data is mock the step must pass; the PR description states that when real data replaces mock the step is deleted by the human at the same time the release gate starts passing, and that `docs/release-checklist.md` item 1 says so.

## 5. Release checklist (`docs/release-checklist.md`)

A checkbox document the human runs before submitting, each item with the command or place to look: all data files `origin: processed` in `_manifest.json`; no `MOCK` anywhere; `npm run build:release` passes; references page non-empty and every attribution present; no `placeholder: true` in `web/src/content/`; all story steps written and sourced; era list sourced; license check for each data source and for terrain and geometry; budgets confirmed; Lighthouse run and scores recorded; manual run in Chrome, Firefox and Safari; run on a low-end laptop and on a phone-size window; hosting limits checked (transfer quota, tile hosting); links checked; demo recorded if required; version tag created. Items that other briefs defer to "the human" are collected here by name.

## 6. Tests summary (write first where the code is a library or script)

Data smoke (section 1); bundle library and script exit codes (section 2); `expect_failure.py` (section 4); the Playwright suite itself is the test for the application and is written together with the minimal hooks it needs. Every script test includes the positive case, asserts exact values, exit codes and messages, and never writes inside the real `web/public/` or `data/` directories (the bundle tests use temporary folders).

## 7. Acceptance checklist

- [ ] Tests committed failing first where applicable, then green. `python scripts/precheck.py` passes (the browser suite is not part of precheck).
- [ ] Only `@playwright/test` added; no checker silenced; no `as unknown as`; no `continue-on-error` or `|| true` anywhere.
- [ ] CI job `e2e` runs on every pull request and uploads artifacts; its status was read from the run, or the PR says "pushed, CI not checked".
- [ ] `web/budgets.json` created from measured values and marked as initial; the measured table is in the PR description.
- [ ] `docs/release-checklist.md` written.
- [ ] No UI behavior changed; every added `data-testid` is listed in the PR description.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (add `performance-a11y` as next and the human step "confirm budgets").
- [ ] PR description: what changed, what was verified, what the human must verify (the budgets, the list of added test ids, the screenshots artifact, that the e2e suite passes in CI, the expected-failure step and when to remove it).
