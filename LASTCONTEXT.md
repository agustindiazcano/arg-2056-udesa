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

## Decisions
- UI text avoids the second person (infinitives and impersonal forms) to stay neutral between voseo and tuteo. The human may want to change that: it is one pass over the strings.
- The story steps, the era bands, the page description and the two placeholder scenes (Andes, Revolución IA) are provisional content, now in Spanish ("(provisorio)", "Texto provisorio. Reemplazar antes del lanzamiento."). The release gate still keys on `placeholder: true`, not on the text. Real story text was not touched.
- The forecast and sandbox scenes still carry their own scenario and AI chips next to the control bar (same names as the bar): F3 unifies the filters.
- The 2D province map still draws nothing (no geometry) and Economy and Resources ignore the province filter (F3).
- 3D is the default presentation (narrated tour plus free explore mode); 2D stays as the data view and the accessible alternative. Brief `presentation-3d.md`, decisions `D-3d-1` to `D-3d-5`.

## Next step
- F3: unified filters and the province map as the main map mode (needs `D-3d-3`, the province geometry decision), then F4 (motion with GSAP and the story, together with `presentation-3d` parts 1 to 4), F5 (3D map country to zone), F6 (Andes), F7 (live simulation), F8 (polish).
