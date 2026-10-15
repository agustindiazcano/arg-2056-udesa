# Last Context

## State
- **Branch**: `task/visual-corrections-1-6`
- **Slide 1 & Slide 6 layout & typography**:
  - Repositioned `.gdp-chart:has(> .world-year) .tour-view-switch` to `top: -12px; left: -15px;`.
  - Replaced "PBI por habitante" with "PBI per cápita" across copy, tables, and metrics on Slide 6.
  - Spaced out years on Slide 6 mini-charts (`smallInterval = from1960 ? 25 : 10`) to eliminate overlapping labels.
  - Added "Ver desde 1960" toggle for historical comparison.
- **GDP Simulator & Fluid Animations**:
  - Simulator starts paused (`initialPlaying: false`).
  - Added prominent highlight milestones for GDP doubling multiples (x2, x3, x4).
  - Implemented 60fps continuous line animations with glowing head markers and interpolated trailing tips (`buildFluidLines`, `Lines3D`).
- **Sophisticated 3D & 2D Maps with Departmental / Municipal Drill-Down**:
  - **Subtle 3D relief**: Flat base (`0.05`) with gentle elevation variations (`0.14`) and embossed provincial boundary relief ridges.
  - **Aerial perspective**: Default camera at `UPRIGHT_PHI: 0.04` providing an aerial 2D view with rich 3D tactile depth and directional shadows.
  - **Department & Municipal Drill-Down**: Clicking any province loads official IGN/INDEC data (`web/public/geo/departments/*.json`, 527 departments), reveals department divisions, plots municipal cabeceras, and shows rich tooltips.
  - **Modern Breadcrumb Navigation**: Glassmorphic `Argentina › [Provincia]` header with `← Argentina` return button and department count pill.
- **Testing**: Typecheck clean (`tsc --noEmit` exit 0), targeted unit tests pass.

## Next
- Push branch `task/visual-corrections-1-6` to GitHub.
- Open/update PR for human review.
