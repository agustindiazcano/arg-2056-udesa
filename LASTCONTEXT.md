# Last Context

## State
- Plan approved by the human (presentation first, in Spanish, dark cinematic). F1 (believable mock) merged in PR #36.
- **F2a done on branch `task/ui-foundation`**: tokens consolidated (legacy `--color-bg`, `--color-text`, `--color-primary` removed; spacing, radius, type and glass tokens added), `web/src/styles/ui.css` (no color literal, a test guards it), the shell redesigned and translated: `Header` (brand, tabs `Escenas`, badge "Datos ilustrativos", link "Fuentes y métodos"), control bar (play, year slider, speed, scenario segmented, AI toggle, province button), province dialog as a popover, `Segmented` component, Spanish loading and WebGL messages. Scene labels: Andes, Economía, Recursos, Pronóstico 2056, Revolución IA, Simulador.
- The debug HUD and the no-op 2D/3D button are gone (the `d` key still toggles `mode`; a view will use it in F5).
- Tables no longer scroll inside boxes (axe `scrollable-region-focusable`; the jsx-a11y rule forbids a focusable region): the scene rows grow with their content and the scene area scrolls.
- 924 unit tests, e2e adapted (names in Spanish). `docs/ui.md`. Pushed, CI not checked.

## Decisions
- Play/pause is one button whose name changes (no aria-pressed). Speed uses the existing speedUp/speedDown actions; no store or key change.
- The scenes, the story panel and the references page are still English: F2b (shared `SceneShell`, `TableToggle`, `FilterBar`, Spanish scenes and charts, `APP_LOCALE = es-AR`, `lang="es"`).

- **Direction decided after F2a**: 3D is the default presentation (a narrated tour of scenes with interactive text, plus a free explore mode); 2D stays unchanged as the data view and accessible alternative. Brief `presentation-3d.md` (replaces `scene-forecast-map-3d`) with six parts and decisions `D-3d-1` to `D-3d-5`. Reference look: `test/dashboard_3d_PoC.html`.
- The 2D province map still draws nothing (no geometry) and Economy and Resources ignore the province filter.

## Next step
- F2b, then F3 (unified filters and the province map as the main map mode), F4 (motion with GSAP and the story, built together with `presentation-3d` parts 1 to 4), F5 (3D map country to zone), F6 (Andes), F7 (live simulation), F8 (polish).
