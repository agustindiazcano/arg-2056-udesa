# Last Context

## Current task — chart styling
- Branch `task/chart-aesthetics`, isolated worktree `C:\Users\agusd\.codex\worktrees\chart-aesthetics\arg-2056-udesa`.
- CSS-only refinements in `web/src/styles/ui.css`: richer chart-card depth and focus state, clearer captions/legends, pill-style Gráfico | Tabla switch, more readable striped tables, and reduced-motion handling.
- Follow-up for the simulator navbar: scoped matching glass header, title-case logo, and gold hover/selected tab treatments under `data-section='simulator'`.
- Andes UI polish: matching header/logo and selected tabs, refined title card, force chips, camera controls, event list, right panel, playback bar, and credits button in `web/src/dashboard/dashboard.css`.
- Navbar follow-up: Andes section tab now has a filled gold pill and rounded controls for a more visible active state; verified in the 5176 preview.
- Hacia el 2056 now uses the same filled gold active section tab and current-step pill, with title-case branding; visually verified on the index at 5176.
- No chart data or behavior changed. `git diff --check` passed. No tests run (CSS only).
- Browser preview remains unverified: this checkout has no local `node_modules`; attempting to borrow dependencies from the primary checkout was blocked by worktree permissions. Primary checkout had pre-existing edits and was not altered by this task.
- Next: inspect the chart in a browser with this branch's assets, then commit the style change.

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
