# Performance and accessibility

What keeps the app light on first load, safe on weak devices and usable with keyboard and assistive technology,
and the checks that keep it that way. Written by the task `performance-a11y`.

## 1. Bundles

| What | How |
|---|---|
| Scene code splitting | Each scene is loaded with `React.lazy` in `web/src/scenes/registry.ts`; `SceneHost` shows the text "Loading scene" while the chunk loads. |
| Tree-shaken ECharts | `web/src/charts/echarts.ts` registers only the chart types and components the builders use. `EChart` and the province map import only from it. |
| Registry coverage | `tests/unit/echartsRegistry.test.ts` runs every builder and fails when a builder uses a series type or component that `echarts.ts` does not register (or when `echarts.ts` registers something no builder uses). |
| Vendor chunk | `manualChunks` in `web/vite.config.ts` puts `echarts` and `zrender` in one chunk named `echarts`; it loads with the first chart scene. |
| Initial-load assertions | `npm run check:bundle` fails (exit 1) and prints the file names when the initial load of `main` or `references` contains the `echarts` chunk or a scene chunk. |
| Budgets | `web/budgets.json` (gzip level 9 bytes): measured x 1.15, rounded up to the next 1024. The human confirms or tightens them. |

To measure: `npm run build && npm run check:bundle -- --report` in `web/`.

## 2. Quality tiers

`web/src/runtime/capabilities.ts` reads the device once (`readCapabilities`) and `qualityTier` maps it to a tier.
First matching row wins.

| Tier | When |
|---|---|
| `low` | no WebGL2, or `saveData`, or `deviceMemory` known and at most 2 GB, or `hardwareConcurrency` known and at most 2 |
| `medium` | coarse pointer, or `deviceMemory` known and at most 4 GB, or `hardwareConcurrency` known and at most 4 |
| `high` | everything else |

Unknown values (`null`) never lower the tier by themselves. **These thresholds are assumptions, not measurements:
the human tunes them on real devices.**

`nextTier(current, frameTimesMs)` lowers the tier one step when the median of the last 120 frame times is above
24 ms. It does nothing with fewer than 120 samples, never raises a tier, and `low` stays `low`.

### Presets

`QUALITY_PRESETS` (assumptions, to be tuned; the Andes scene will read them):

| Tier | `particleScale` | `pixelRatioCap` | `terrainDetail` |
|---|---|---|---|
| `high` | 1 | 2 | 1 |
| `medium` | 0.5 | 1.5 | 0.75 |
| `low` | 0.2 | 1 | 0.5 |

### Using it

- `CapabilityProvider` wraps the app (inside `App`). `useQuality()` returns `{ caps, tier, setTier, downgrade(frameTimes) }`.
- `WebGLRequired` shows "This view needs WebGL2. Your browser or device does not provide it." (with a link to the
  references page) when there is no WebGL2, and "This view runs in reduced quality on this device." when the tier is
  `low`. It renders nothing otherwise. No scene renders it yet; the Andes scene will.
- The WebGL2 probe context is released at once (`WEBGL_lose_context`).

### Testing on any machine

| Query | Effect |
|---|---|
| `?quality=low`, `?quality=medium`, `?quality=high` | forces the tier |
| `?debug=1` | shows a small line `quality: <tier>` in the HUD area |

Example: `http://localhost:4173/?quality=low&debug=1`. An invalid `quality` value is ignored.

## 3. Reduced motion

- `useReducedMotion()` follows `(prefers-reduced-motion: reduce)` and is false where `matchMedia` does not exist.
- `EChart` passes `animation: false` (on a copy of the option) when it is on.
- One rule in `web/src/styles/tokens.css` switches off all CSS transitions and animations under the media query. Do
  not add per-component copies.
- Playback of time (`playing`) is not decorative and is not affected.

## 4. Accessibility

| Check | Where |
|---|---|
| Contrast of the text tokens (4.5:1) and of marks (3:1) | `tests/unit/contrast.test.ts`, lists `TEXT_PAIRS` and `TEXT_PAIRS_LARGE` in `web/src/styles/contrast.ts` |
| Skip link, `main` and `nav` landmarks, `lang`, title per scene, `aria-pressed`, filter focus | `tests/unit/a11yShell.test.tsx` and `e2e/a11y-keyboard.spec.ts`, `e2e/runtime.spec.ts` |
| Live regions are polite, none is assertive | `tests/unit/liveRegions.test.ts` |
| Lint | `eslint-plugin-jsx-a11y` recommended rules (`web/eslint.config.js`), no rule turned off |
| Automated browser audit | `e2e/a11y.spec.ts` runs axe on every scene, on the open province filter, on a table view and on `references.html` |

### Running axe locally

```
cd web
npm run data:sync
npx playwright test e2e/a11y.spec.ts
```

The test fails on any `serious` or `critical` violation (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) that is
not listed in `web/e2e/axe-exceptions.ts`. Each exception is `{ ruleId, selector, reason }`; the selector is axe's own
selector for the node and is matched as a substring, and an exception without a reason fails a test.

### Axe exceptions

None.

### Open findings (for the human, no color was changed)

| Finding | Numbers |
|---|---|
| `--state-critical` (`#d03b3b`) is used as text color ("Error loading data." in the economy scene and on the references page) and is below 4.5:1 | 4.05:1 on `--page`, 3.62:1 on `--surface`, 3.93:1 on the body background `--color-bg` |
| `design.md` section 6 asks for a focus ring of 2px `#3987e5`; the stylesheet already used `--color-focus` (`#ffc107`) and it was kept (11.9:1 on the page) | design decision |
| `--page` (`#0d0d0d`) is not used by the stylesheet; the body background is `--color-bg` (`#111111`) | the text pairs were checked against both |
