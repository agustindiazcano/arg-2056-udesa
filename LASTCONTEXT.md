# Last Context

## State
- Plan approved by the human (presentation first, in Spanish, dark cinematic). Merged: F1 believable mock (PR #36), F2a Spanish shell and design tokens (PR #37), docs for the 3D direction (PR #38).
- **F2b done on branch `task/ui-scenes-es`**: every scene, chart builder, table, the story panel and the references page are in Spanish, on shared components. Pushed state and CI: see the PR (CI not checked unless the PR says so).
  - Shared components in `web/src/ui/`: `SceneShell` (title, subtitle, source line; `dateLabel` for model output), `TableToggle` ("Ver tabla"), `FilterBar` + `FilterChip`, `SceneLoading` + `SceneError` (both `role="status"`: `liveRegions.test.ts` forbids `role="alert"`). All five data scenes and the references page use them.
  - `web/src/content/labels.ts`: Spanish names for resources, project statuses, scenarios, indicators, position against the range, and `indicatorSentence` ("producción de recursos (oro)").
  - `web/src/charts/format.ts`: `APP_LOCALE = 'es-AR'`, `formatValue`, `formatNumber`, `formatDecimal`, `formatPercent`, `formatDate`, `ordinal` (`2.º`). No `toFixed` is left in `src`. `lang="es"` in `index.html` and `references.html`.
  - Province names in tables and sentences come from `PROVINCES`; country names in the visits table come from `Intl.DisplayNames('es-AR')`.
  - `docs/ui.md` describes the shared pieces and the language rules.
- Tests: unit and e2e updated to Spanish (headings in `web/e2e/fixtures.ts` too). Compact numbers contain non-breaking spaces (`10 k`): tests normalize them.

- **F3 done on `task/filters-province-map`**: geometry from Natural Earth admin-1 in `web/public/geo/` (`D-3d-3` decided by the agent; the human can swap it with `npm run build:geo`); Forecast and Sandbox lost their own scenario and AI chips (the control bar owns them); Recursos follows the selected province (bars highlight it, trend uses its series or says it falls back to national); Economía and the Recursos composition are national and say so (`ScopeNote`).

- **F4 done on `task/motion-story`** (stacked on F3): gsap 3.15.0 (exact). `web/src/motion/` has `timings.ts` (design.md section 5), `SceneTransition` (400 ms fade + 24 px on scene change), `CountUp` (value tiles of Economía and Pronóstico count once on mount; later values snap). `EChart` draws series in over 600 ms and updates at once. `StoryCaption` fades the text per step and is a floating glass card; the 18 steps are drafts without figures or sources, still `placeholder: true` (tag "Borrador"). Everything is skipped under `prefers-reduced-motion` (tests import `tests/unit/reducedMotionStub.ts` to read final numbers). Main bundle 133,255 B of 134,144 B.

- **Recursos map** (`task/resources-map`, stacked on F4): a province map of the selected resource and year under the charts in Recursos, from observed production (`scenes/resources/mapValues.ts`, no range, `observed` mode of `ProvinceMap`). Clicking a province selects it for the whole app.

## Decisions
- UI text avoids the second person (infinitives and impersonal forms) to stay neutral between voseo and tuteo. The human may want to change that: it is one pass over the strings.
- The story steps, the era bands, the page description and the two placeholder scenes (Andes, Revolución IA) are provisional content, now in Spanish ("(provisorio)", "Texto provisorio. Reemplazar antes del lanzamiento."). The release gate still keys on `placeholder: true`, not on the text. Real story text was not touched.
- 3D is the default presentation (narrated tour plus free explore mode); 2D stays as the data view and the accessible alternative. Brief `presentation-3d.md`, decisions `D-3d-1` to `D-3d-5`.

## Next step
- `presentation-3d` parts 1 to 4 (needs `D-3d-1`, `D-3d-2`, `D-3d-4`, `D-3d-5`; `D-3d-3` is answered), F5 (3D map country to zone), F6 (Andes), F7 (live simulation), F8 (polish).
