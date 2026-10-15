# Last Context

## State
- **PPP removed from the whole project** (human request 2026-10-13, `task/remove-ppp`): Maddison data and references deleted. All GDP is real at constant 2015 USD (`web/src/tour/worldGdp.json`).
- **Visual corrections (slides 1 & 6) and 1960 mode in AI slide (`task/visual-corrections-1-6`)**:
  - Slide 1 (`WorldStep`) & Slide 6 (`AiStep`): big year and value (`.world-year`) repositioned to the top-right corner (`top: var(--space-md); right: var(--space-md)`).
  - Main chart: `[ Gráfico | Tabla ]` (`.tour-view-switch`) positioned at the top-left corner (`top: 0; left: 0`). Excluded `.tour-view-switch` from 100% width/height in `.prov-map` so it doesn't stretch or cover canvas interactions.
  - Slide 1 region card (`.prov-bars`): `[ Gráfico | Tabla ]` switch repositioned to the top-right corner of the card (`top: var(--space-md); right: var(--space-md)`), in line with the title `Mayores economías de la región en [año]`, giving full vertical height back to the 3D/2D bars chart.
  - Slide 6 (`AiStep`): added button "Ver desde 1960" / "Ver desde 2026" to compare AI projections against historical observed GDP, GDP per capita and population from 1960 to 2056; milestones ("x2", "x3", "x4") remain anchored to 2026 base GDP.
  - Added `visual-corrections/` to `.gitignore`.
  - Added unit test `web/tests/unit/aiStep1960.test.tsx`.
- **Order of slides**: 0 index, 1 world, 2 Recursos (+ provinces), 3 rule of 70, 4 Composición+Exportaciones, 5 Productividad, 6 IA (`TOUR_ORDER` = 20, 0, 8, 5, 12, 14, 3).
- **Testing rule**: Do not run heavy test suites locally; push branches to GitHub to let CI run them.

## Next
- Push branch `task/visual-corrections-1-6` to GitHub for CI review.
- Human review of the visual changes on Slide 1 and Slide 6.
- Approve the consolidation plan (PR #81).
