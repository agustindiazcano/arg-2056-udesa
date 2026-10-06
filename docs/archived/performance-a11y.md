# Task: `performance-a11y`

Branch: `task/performance-a11y`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/design.md`, `docs/afaw-light.md`, `docs/release-checklist.md`, `web/budgets.json`, `web/vite.config.ts`, `web/package.json`, `web/playwright.config.ts`, the e2e suite, `web/src/charts/EChart.tsx` and its tests, every chart builder, the scene registry in the shell, `tokens.css` and `tokens.ts` first.
Prerequisite: `integration` is merged into `main` (its bundle measurement and e2e suite are the base of this task). If it is not, stop and tell me.

## Goal

Make the application light on first load, safe on weak devices, and usable with keyboard and assistive technology, with automated checks that keep it that way. Four parts: (1) smaller bundles through code splitting and tree-shaken ECharts; (2) device capability detection with quality tiers and a WebGL fallback, as infrastructure the Andes scene will use; (3) reduced-motion support; (4) accessibility fixes and automated checks.

Strict TDD where it applies. Atomic commits. Before every push run `python scripts/precheck.py`. Browser checks run in CI.

## Out of scope (do NOT do)

- No new features and no visual redesign. Do not change colors, spacing or typography: if a contrast check fails, stop and tell me which token pair and ratio; the human decides the design change.
- No Andes scene work and no particle code: this task only provides the capability and quality infrastructure.
- Dependencies allowed (devDependencies, exact versions): `@axe-core/playwright` and `eslint-plugin-jsx-a11y`. Nothing else.
- Do not change the `KeyAction` union, `KEY_MAP` or the store shape. Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Bundle size

1. **Scene code splitting.** Load each scene module with `React.lazy` and a `Suspense` fallback that shows visible text ("Loading scene"). The scene registry stays the single source of truth; the shell tests keep passing (adapt them to await lazy loading, without weakening assertions).
2. **Tree-shaken ECharts.** Create `web/src/charts/echarts.ts` that imports from `echarts/core` and registers only what the builders use (chart types, components, renderer) and re-exports `init`, `registerMap` and the types the wrappers need. `EChart` and the map code import only from this module. The tests that mock ECharts mock this module instead of `'echarts'`, with the same assertions as before.
3. **Registry coverage test.** A unit test runs every builder on its fixtures, collects every `series[].type` and every top-level component key used in the produced options (`tooltip`, `grid`, `visualMap`, `geo`, `markArea`, `markLine`, `aria`, `dataset` and so on), and asserts that each one is registered in `echarts.ts` (export the registered set from the module for this purpose). Adding a builder that uses an unregistered type fails this test.
4. **Chunking.** In `vite.config.ts` put ECharts in its own vendor chunk through `build.rollupOptions.output.manualChunks` (function form, no plugin) so it loads only with the first chart scene.
5. **Manifest assertions** (extend the bundle script from `integration`): the initial load of `main` must not contain the ECharts chunk or any scene chunk (they appear only under `dynamicImports`); the initial load of `references` must not contain ECharts. Failing prints the offending file names. Then re-measure and rewrite `web/budgets.json` (measured times 1.15, rounded up to the next 1024 bytes, `_note` updated) and put the before and after table in the PR description. If the new initial `main` is not smaller than the old one, explain why in the PR.

## 2. Device capabilities and quality tiers

New module `web/src/runtime/capabilities.ts` (pure functions plus a thin browser reader):
- `readCapabilities(env)` where `env` is injected (`window`, `navigator`, `matchMedia`, a canvas factory) returns `{ webgl2: boolean, cores: number | null, memoryGb: number | null, coarsePointer: boolean, reducedMotion: boolean, saveData: boolean }`. Each field is `null` or `false` when the browser does not expose it; never throw.
- `qualityTier(caps)`: `'low' | 'medium' | 'high'`. Rules, written as a table in the code and the docs: `low` when `webgl2` is false, or `saveData`, or `memoryGb` is known and at most 2, or `cores` known and at most 2; `medium` when `coarsePointer` or `memoryGb` known and at most 4 or `cores` known and at most 4; otherwise `high`. These thresholds are assumptions to be tuned by the human on real devices; mark them with a comment and list them in the PR.
- `nextTier(current, frameTimesMs)`: given the last frame times (a window of 120 samples, in ms) returns a lower tier when the median exceeds 24 ms, the same tier otherwise; never raises a tier automatically; `low` stays `low`.
- `QUALITY_PRESETS` constant: per tier `{ particleScale: number, pixelRatioCap: number, terrainDetail: number }` with `high` = `{ 1, 2, 1 }`, `medium` = `{ 0.5, 1.5, 0.75 }`, `low` = `{ 0.2, 1, 0.5 }` (assumptions, flagged; the Andes task will use them).
- React: `CapabilityProvider` and `useQuality()` returning `{ caps, tier, setTier, downgrade(frameTimes) }`; a query parameter `?quality=low|medium|high` overrides the detected tier (for testing on any machine); a small debug line "quality: <tier>" shown only with `?debug=1`.
- `WebGLRequired` component: visible message "This view needs WebGL2. Your browser or device does not provide it." with a link to the references page and, when the tier is `low` because of memory or cores, a different message that the view runs in reduced quality. The Andes scene will render it; this task adds it with its own tests and does not wire it into any scene.

## 3. Reduced motion

- `useReducedMotion()` (reads `matchMedia('(prefers-reduced-motion: reduce)')`, subscribes to changes, SSR-safe).
- `EChart` passes `animation: false` to every option when reduced motion is on; CSS transitions and animations are disabled under the same media query through one rule in the global stylesheet (no per-component duplicates). Playback of time (`playing`) is not decorative and is not affected.
- Tests: the hook follows media query changes; `EChart` disables animation when reduced motion is on and keeps the builder's setting otherwise.

## 4. Accessibility

1. **Contrast test (pure).** `contrastRatio(hexA, hexB)` per WCAG relative luminance, tested with known values (white on black 21, identical colors 1, a hand-computed mid pair). A unit test reads `tokens.ts` and checks the list `TEXT_PAIRS` (text token on the background token where it is used: `ink` and `ink-2` and `muted` on `page` and on `surface`, per `design.md`) for at least 4.5, and `TEXT_PAIRS_LARGE` for at least 3. A failing pair stops the task with the numbers (see out of scope).
2. **Focus.** A visible focus indicator on every interactive element using a token color (add the token only if `design.md` already defines it; otherwise reuse an existing token) with at least 3:1 against its background; a "Skip to main content" link as the first focusable element, visible on focus, targeting the `main` landmark.
3. **Landmarks and titles.** One `main`, the tab bar in a `nav` with an accessible name, `lang="en"` on the document, and `document.title` updated per scene as `<scene label> | <APP_TITLE>` (use the existing title constant; do not choose a new one).
4. **Lint.** Add `eslint-plugin-jsx-a11y` with its recommended rules to the ESLint config. Fix the causes of every error it reports; do not disable rules.
5. **Automated browser check.** Add `@axe-core/playwright`. An e2e test runs axe on every scene and on `references.html` (with `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` tags) and fails on any `serious` or `critical` violation. Exceptions go in `web/e2e/axe-exceptions.ts` as explicit entries `{ ruleId, selector, reason }`; each exception must have a reason and the PR lists them all. The ECharts canvas containers already have `role="img"` and a label; do not except them without a reason.
6. **Keyboard operability.** E2E: every interactive control is reachable with Tab in a logical order in each scene; Enter or Space activates buttons; the province filter traps no focus and `Escape` returns focus to the control that opened it; toggles expose `aria-pressed` with the right state after activation.
7. **Live regions.** Check and test that status changes announced by earlier tasks (caption title, filter result counts, copy confirmation) use `aria-live="polite"` and never `assertive`.

## 5. Tests (write first where applicable)

Unit (Vitest): capabilities reader with injected environments (all features present; none present; `getContext` throwing; `deviceMemory` undefined), `qualityTier` table (exact result for at least one case per rule and one boundary case each), `nextTier` (median exactly 24 does not downgrade; 24.1 does; fewer than 120 samples do not downgrade; `low` stays), `QUALITY_PRESETS` shape, the `?quality=` override and the debug line, `WebGLRequired` messages, `useReducedMotion`, the `EChart` animation behavior, the registry coverage test, the contrast tests, the skip link and title updates, lazy scene loading with the fallback text, the manifest assertions of section 1 with fixtures (an entry that statically imports ECharts fails; one that imports it dynamically passes).

E2E (Playwright, run in CI): axe on all scenes and the references page; keyboard operability; skip link works; document title per scene; with `?quality=low` the debug line shows `low`; with reduced motion emulated no CSS transition is running on the tab bar (check computed `transition-duration`).

All tests assert exact values and messages. Tests never write inside the real `data/` or `web/public/`.

## 6. Acceptance checklist

- [ ] Tests committed failing first where applicable, then green. `python scripts/precheck.py` passes. The CI e2e job passed, or the PR says "pushed, CI not checked" and "e2e not run locally" if that is the case.
- [ ] Only `@axe-core/playwright` and `eslint-plugin-jsx-a11y` added; no rule disabled; no checker silenced; no `as unknown as`; `KeyAction`, `KEY_MAP` and the store shape unchanged.
- [ ] `main` initial load excludes ECharts and every scene chunk (asserted); `budgets.json` rewritten; before and after table in the PR.
- [ ] No color or typography changed; contrast failures, if any, reported instead of fixed.
- [ ] `docs/performance.md` written: the tier table, the presets, how to test with `?quality=` and `?debug=1`, how to run axe locally, the list of axe exceptions.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (the Andes task uses `useQuality`, `QUALITY_PRESETS` and `WebGLRequired`).
- [ ] PR description: what changed, what was verified, what the human must verify (the tier thresholds and presets on real weak devices, every axe exception, the new budgets, the contrast results, that lazy loading shows acceptable loading states).
