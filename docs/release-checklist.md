# Release checklist

The human runs this before submitting. Every item says what to run or where to look. Tick an item only after
you saw the result yourself. Items that other briefs hand to "the human" are collected here by name.

Run the commands from the repository root unless a path says otherwise.

## 1. Data is real

- [ ] **Replace the mock data and remove the expected-failure step.** The CI step `Release gate fails on mock data`
  (in `.github/workflows/ci.yml`, job `e2e`, runs `scripts/expect_failure.py`) passes only while the data is mock.
  When real data replaces the mock and the release gate starts passing, delete that step **at the same time**,
  or CI turns red. The Playwright tests that assert the mock (`MOCK DATA` badge in `web/e2e/boot.spec.ts`, the
  sample-data message in `web/e2e/references.spec.ts`) must change in the same PR.
- [ ] Every data file is `origin: processed`: `grep -c mock web/public/data/_manifest.json` prints `0`
  (run `npm run data:sync` in `web/` first).
- [ ] No `MOCK` anywhere: `python scripts/check_no_mock.py` exits 0.
- [ ] Data to verify: every number in the UI is confirmed against its original source (section "Data to verify" of
  `PENDING.md` is empty).
- [ ] Model assumptions decided by the human (A10, A13, A15, A16, A24, A26, A31, A32, A33 in
  `docs/assumptions.md`) and every assumption sourced.

## 2. Content is real

- [ ] `npm run build:release` (in `web/`) passes. It builds the references, runs the release gate and then the build.
- [ ] No `placeholder: true` in `web/src/content/`: `python scripts/check_no_mock.py --content web/src/content`
  exits 0 (it prints each remaining placeholder era and step).
- [ ] All story steps are written and sourced (`web/src/content/steps/index.ts`, `source_ids` filled, text reviewed).
- [ ] The era list is sourced (`web/src/content/eras.ts`).
- [ ] Sources are registered in `data/processed/sources.json`; the References page (`/references.html`) is not
  empty and every attribution is present (terrain, province geometry, each dataset).
- [ ] Province geometry committed in `web/public/geo/` (human step of `scene-forecast-map`, see `docs/geo.md`).
- [ ] Terrain committed in `web/public/terrain/` and verified against the Andes facts (human step before
  `andes-integration`, see `docs/terrain.md`).
- [ ] The placeholder red arm of the diverging ramp is replaced with the real design color (`DIVERGING` in
  `web/src/styles/tokens.ts`, `--div-1..5` in `tokens.css`).

## 3. Licenses

- [ ] A license or terms check is recorded for each data source (`license_or_terms` in the References page).
- [ ] License of the terrain source (DEM) and attribution text.
- [ ] License of the province geometry source and attribution text.
- [ ] Fonts, icons and libraries: nothing is loaded from another origin (the e2e suite fails on any request to
  another origin) and every bundled library license is acceptable.

## 3b. Human deliverables for the deploy

- [ ] Real description and final URL in `web/src/content/meta.ts`, `placeholder: false` (`docs/deploy.md`, section 3).
- [ ] Preview image `web/public/og.png`: PNG, 1200x630, at most 600 KB.
- [ ] `web/public/favicon.svg` (the placeholder text must be gone). `python scripts/check_release_assets.py` exits 0.
- [ ] Host decision confirmed (Vercel today): quota, build minutes, domain, preview deployments (`docs/deploy.md`, section 5).
- [ ] Tag pushed and the CI job `release` green (read its status), then
  `python scripts/smoke_deployed.py https://<domain> --expect-real-data` exits 0.
- [ ] Link previews checked in the social tools.
- [ ] The first Vercel deploy: browser console clean under the CSP (Analytics and Speed Insights scripts).
- [ ] When the province geometry is committed, remove `MISSING_FOR_NOW` from `web/e2e/csp.spec.ts`.

## 4. Budgets and performance

- [ ] **Confirm or tighten `web/budgets.json`.** Its first values were measured, not decided
  (`npm run build && npm run check:bundle -- --report` in `web/` prints the current sizes).
  Run `npm run check:bundle` and confirm exit 0.
- [ ] Data budget: `python scripts/check_data_budget.py` exits 0.
- [ ] Lighthouse run on the production build (`npx vite preview` in `web/`), scores for performance,
  accessibility, best practices recorded here: ____ / ____ / ____ (date: ____).

## 5. Manual checks

- [ ] Manual run in Chrome, Firefox and Safari: every scene, keyboard only, then mouse.
- [ ] Run on a low-end laptop: playback stays smooth.
- [ ] Run in a phone-size window: nothing overflows or is unreachable.
- [ ] Clicker keys (`PageDown`, `PageUp`, `Home`) work with the presenter hardware.
- [ ] Look and feel of every scene and of the story caption panel against `docs/design.md`.
- [ ] Screenshots of the `e2e` CI job (artifact `e2e-screenshots`) reviewed.
- [ ] The `e2e` CI job passes on the release commit (read the run status, do not assume it).

## 6. Hosting and delivery

- [ ] Hosting limits checked: transfer quota, file size limits, tile or terrain hosting.
- [ ] All links work (in the app, in the References page, in the README).
- [ ] Demo recorded, if the competition requires it.
- [ ] Competition deadline and evaluation criteria confirmed (`PENDING.md`, "Blocked / questions").
- [ ] Version tag created: `git tag v<version>` and pushed (CI job `no-mock` runs on `v*` tags).
