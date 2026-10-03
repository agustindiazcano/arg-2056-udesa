# Last Context

## State
- Task `performance-a11y` on branch `task/performance-a11y` (PR to open; pushed state: see below).
- Bundles: each scene is `React.lazy` (`SceneHost`, "Loading scene"); ECharts only through `web/src/charts/echarts.ts` (registry coverage test); `manualChunks` puts echarts+zrender in the `echarts` chunk; `check:bundle` fails if main/references load it or a scene statically. Initial main 503,824 -> ~117,000 B gzip; references 112,749 -> ~113,600 B. `web/budgets.json` rewritten (134,144 / 131,072 / chunk_max 277,504).
- Runtime (`web/src/runtime/`): `capabilities.ts` (readCapabilities, qualityTier, nextTier, QUALITY_PRESETS, `?quality=`, `?debug=1`), `CapabilityProvider` (mounted in `App`) with `useQuality`, `WebGLRequired` (not wired into any scene), `useReducedMotion` (EChart animation off; one global CSS rule).
- A11y: skip link, `main#main`, `nav` "Scenes", title `<scene> | Argentina 2056` (`app/title.ts`), `aria-pressed` on HUD toggles, province filter is a named dialog with focus in/out, links in `--blue`, resources charts labelled, `eslint-plugin-jsx-a11y` (override for eslint 10 peer), `@axe-core/playwright` (e2e `a11y.spec.ts`, `axe-exceptions.ts`: none), contrast tests (`styles/contrast.ts`).
- Docs: `docs/performance.md`. precheck OK, 50 Playwright tests pass locally.

## Decisions
- No `APP_TITLE` existed: created it equal to the `<title>` of `index.html`. Two e2e title asserts adapted.
- Link color: human approved option A (`--blue`). `--color-focus` (#ffc107) kept although design.md says #3987e5.
- Nothing silenced; the `@ts-ignore` in EChart was replaced by a typed cast.

## Next step
- Human: review PR; tier thresholds/presets on real devices; decide `--state-critical` text contrast; confirm budgets; Lighthouse.
- Next tasks: `scene-ai-revolution`, `scene-andes` (uses `useQuality`, `QUALITY_PRESETS`, `WebGLRequired`).
- CI not checked unless stated in the PR.
