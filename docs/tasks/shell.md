# Task: `shell`

Branch: `task/shell`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md` first.
Prerequisites: tasks `contract`, `forecast-contract` and `mock-data` are merged into `main`.

## Goal

A runnable app skeleton, the first thing the human can open in a browser: Vite + React + TypeScript, six scene tabs, a Zustand store driven by a pure reducer, keyboard control through `KEY_MAP`, a playback ticker, 2D/3D mode (state only), a province filter (simple list), mock data loading with a visible MOCK badge, and one placeholder component per scene.
Strict TDD for all logic. Atomic commits.

## Out of scope (do NOT do)

- No real charts, no map, no WebGL, no GSAP, no D3 / ECharts / MapLibre / deck.gl / Three.js. Do not install them.
- No real data, no model code, no Playwright, no mutation-testing setup (deferred to a later task).
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`.
- Do not fake CI.
- No visual design beyond tokens and a legible dark layout. Polish comes last.

## Allowed new dependencies (npm only)

`react`, `react-dom`, `@types/react`, `@types/react-dom`, `zustand`, `vite`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`. Nothing else. Commit `package-lock.json`.

## 1. Files

```
web/index.html
web/vite.config.ts
web/src/main.tsx
web/src/styles/tokens.css          CSS variables only: colors, spacing, type scale, focus ring
web/src/state/reducer.ts           pure reducer + tick (all logic here)
web/src/state/store.ts             Zustand store wrapping the reducer
web/src/state/useKeyboard.ts       keyboard hook
web/src/state/useTicker.ts         requestAnimationFrame hook calling tick
web/src/data/load.ts               loadForecast(), isMock()
web/src/app/App.tsx
web/src/app/TabBar.tsx
web/src/app/Hud.tsx
web/src/app/ProvinceFilter.tsx
web/src/app/MockBadge.tsx
web/src/scenes/registry.ts         SCENE_COMPONENTS and SCENE_LABELS
web/src/scenes/<scene>/index.tsx   one placeholder per scene (6 folders already exist)
web/scripts/sync-mock.mjs          copies ../data/mock/*.json to public/data/ (Node fs only)
```

Add `web/public/data/` to `.gitignore`.

## 2. State — `reducer.ts`

State:

```ts
{
  scene: Scene;            // default 'andes'
  yearFloat: number;       // default 2026, always within [YEAR_MIN, YEAR_MAX]
  scenario: Scenario;      // default 'expected'
  speed: number;           // one of SPEEDS, default 1
  playing: boolean;        // default false
  mode: '2d' | '3d';       // default '3d'
  province: ProvinceId | null;   // default null
  provinceFilterOpen: boolean;   // default false
  aiOverlay: 'off' | 'on';       // default 'off'
}
```

Derived (selector, not stored): `year = parseYear(Math.floor(yearFloat))`.

`SPEEDS = [0.25, 0.5, 1, 2, 4, 8]`, `YEARS_PER_SECOND = 2`.

`reduce(state, action)` handles `KeyAction` from `contract`:
- `nextScene` / `prevScene`: use the contract functions (clamped).
- `togglePlay`: flip `playing`.
- `speedUp` / `speedDown`: move one step in `SPEEDS`, clamped at both ends.
- `setScenario`: set `scenario`.
- `toggle3D`: flip `mode`.
- `openProvinceFilter`: toggle `provinceFilterOpen`.
- `back`: if `provinceFilterOpen` → close it; else if `province !== null` → set `province` to `null`; else no change.

Extra UI actions (a separate union `UiAction`): `setScene(scene)`, `selectProvince(id | null)` (also closes the filter), `setYear(year)`, `setAiOverlay('off' | 'on')`.

`tick(state, dtSeconds)`: if not `playing`, return the same state. Otherwise `yearFloat += speed * YEARS_PER_SECOND * dtSeconds`; when it reaches `YEAR_MAX`, clamp to `YEAR_MAX` and set `playing: false`. Negative or `NaN` `dtSeconds` → state unchanged.

The reducer never mutates its input.

## 3. Keyboard — `useKeyboard.ts`

Window `keydown` listener, removed on unmount.
- Ignore events with `ctrlKey`, `metaKey` or `altKey`, and events with `event.repeat === true`.
- Ignore events whose target is `input`, `textarea`, `select` or a `contenteditable` element.
- For Space and Enter, also ignore when the target is a `button` or `a` (so activating a focused button does not toggle playback).
- Otherwise `resolveKey(event.key)`; if it resolves, call `event.preventDefault()` and dispatch the action.

## 4. UI

- **Layout:** full viewport. A fixed `div#stage` (z-index 0) is the future canvas slot. The HUD and tabs overlay it with `pointer-events: none`, and only interactive elements get `pointer-events: auto`.
- **TabBar:** `role="tablist"`, six `role="tab"` buttons in `SCENES` order, `aria-selected` on the active one, click calls `setScene`. Labels come from `SCENE_LABELS` in `registry.ts` (English placeholders, single constants file, because the UI language is not decided yet).
- **Hud:** shows scene, year, scenario, speed, mode (2D/3D), selected province, AI overlay, plus buttons for play/pause, 2D/3D, province filter and AI overlay toggle. Every button has an accessible label.
- **ProvinceFilter:** when `provinceFilterOpen`, a list of the 24 `PROVINCES` as buttons plus a "All provinces" button. Choosing one calls `selectProvince`.
- **Scenes:** each placeholder renders its label, one line saying what will be there, and one line of data summary from the loaded mock (for example the number of series in the forecast). `SCENE_COMPONENTS: Record<Scene, ComponentType>` must be exhaustive (adding a `Scene` without a component must be a compile error).
- **Transition:** only a CSS opacity fade on scene change, disabled under `prefers-reduced-motion: reduce`.
- **Ticker:** `useTicker` runs `tick` with the real elapsed seconds on each animation frame while `playing`, and cancels on unmount.

## 5. Data — `load.ts` and scripts

- `loadForecast(url: string): Promise<ForecastOutput>`: `fetch`, check `response.ok`, `parseForecastOutput`. Errors propagate with a clear message.
- `isMock(doc: { source: string }): boolean` is true when `source === 'MOCK'`.
- `MockBadge`: a fixed corner badge "MOCK DATA", rendered whenever the loaded forecast is mock. It is absent for any other source.
- `web/scripts/sync-mock.mjs` copies every `*.json` from `../data/mock/` into `public/data/`.
- `package.json` scripts:
  - `data:mock`: runs the sync script.
  - `predev`: runs `data:mock`.
  - `dev`: `vite`.
  - `build`: `tsc --noEmit && vite build` (no mock check, development builds).
  - `build:release`: `python ../scripts/check_no_mock.py ../data/processed public/data && tsc --noEmit && vite build`. It must NOT run `data:mock`.

## 6. Tests (write first)

Vitest. Pure logic runs in the default node environment. Component and hook tests use jsdom by adding `// @vitest-environment jsdom` at the top of each such file.

- **Reducer:** every `KeyAction`; `back` priority (filter closed first, then province cleared, then no-op); speed clamps at both ends and moves one step at a time; `setScenario` for all three; `tick` advances proportionally to speed and `dt`, clamps at `YEAR_MAX` and stops playback there, does nothing when paused, ignores negative or `NaN` `dt`; the input state object is never mutated (deep-freeze it in the test).
- **Keyboard hook:** a key press changes the store; no change with focus in an `input`; no change with `ctrlKey`; no change on `repeat`; Space ignored when the target is a `button`; `preventDefault` called for resolved keys only; the listener is removed on unmount.
- **TabBar:** six tabs in order, `aria-selected` follows the store, click changes scene.
- **ProvinceFilter:** `P` opens it, choosing a province sets it and closes the list, `Esc` closes it, then a second `Esc` clears the province.
- **MockBadge:** visible for `source: "MOCK"`, absent for `source: "argmodel@0.1.0"`.
- **load.ts:** valid mock JSON parses (mock `fetch`); invalid JSON content throws; non-OK response throws; `isMock` cases.
- **Registry:** every `Scene` has a component and a label (type-level and runtime).

## 7. CI

The existing `web` job (lint, typecheck, test) must cover everything. Add no job. Deferred jobs stay commented out.

## 8. Acceptance checklist

- [ ] Tests committed failing first, then green (visible in `git log`).
- [ ] No dependency outside the allowed list.
- [ ] `npm run dev` opens the app; arrows switch scenes, Space toggles play and the year advances, `+`/`-` change speed, `1`/`2`/`3` change scenario, `D` toggles 2D/3D, `P` opens the province list, `Esc` closes it.
- [ ] The "MOCK DATA" badge is visible in dev.
- [ ] `npm run build` passes; `npm run build:release` fails while mock files are present in `public/data/`.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (the shell task moved to Done).
- [ ] PR description: what changed, what was verified, what the human must verify (use the `dev` checklist above, and the UI-language decision for `SCENE_LABELS`).
