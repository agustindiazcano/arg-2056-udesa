# Dashboard: one screen, no scroll, 2D and 3D alike

Direction given by the human with the reference image `design.png` (kept by the human; this file records what it asks).
The app is a **data analytics dashboard**: everything fits one screen, nothing scrolls, the filters are always at hand,
and the 3D view and the 2D view are the **same dashboard**. 2D draws flat charts (the accessible view for people who
prefer everything flat, and the fallback without WebGL); 3D draws the same views in space. Same layout, same data, same
controls: only the renderer of the viewer changes.

## Layout (one grid, no page scroll)

```
+----------------------------------------------------------------------------------------------+
| ARGENTINA 2056   [Andes] [Economía] [Recursos] [Pronóstico 2056] [Revolución IA] [Simulador]  |   tabs = the stages
+------------------+---------------------------------------------------------+-----------------+
| SCENE TITLE      |  <  [thumb] [thumb] [thumb] [thumb]  >   carousel         | INDICATORS      |
| subtitle, legend |      name    name    name    name                        |  tiles          |
|                  +---------------------------------------------------------+ (value, trend)  |
| LIST OF VIEWS    |                                                         |                 |
|  - name          |   THE SELECTED VIEW, BIG  (1, 2 or 4 at once)           | NARRATIVE       |
|  - name          |                                         [Recorrido|Explorar]  "If we follow  |
|  - name          |                                                         |  this path..."   |
|                  |                                                         | SCENARIO        |
|                  |                                                         |  buttons+sliders |
+------------------+---------------------------------------------------------+-----------------+
| (play)  ================o======================  year        FILTERS (chips)   speed  2D | 3D |
+----------------------------------------------------------------------------------------------+
```

- **Tabs on top** are the stages (scenes). **Bottom bar**: play, timeline, year, speed, the scene filters and the global
  ones (scenario, AI, province), and the 2D/3D switch.
- **Carousel** of the views of the scene (charts and maps), with arrows and a name under each thumbnail. The thumbnails are
  small live renderings of the view itself. Choosing one puts it in the viewer; up to four can be shown at once (layout
  1, 2 or 4).
- **Left rail**: scene title, subtitle, legend and the list of view names (the same list as the carousel, for keyboard and
  screen readers).
- **Right panel**: indicator tiles (the stat tiles of the scene), the narrative ("Recorrido": the story step; in
  "Explorar" mode the narrative hides and the panel keeps the indicators and the scenario controls) and the scenario
  controls and sliders where the scene has them (Simulador).
- **No scroll anywhere.** Tables are paginated to the room they have; charts and maps fill the viewer. The page does not
  scroll and no box scrolls (axe `scrollable-region-focusable` stays satisfied).

## Architecture

- `web/src/dashboard/`: `Dashboard` (the grid), `ViewCarousel`, `ViewList`, `Viewer` (1/2/4 panes), `IndicatorPanel`,
  `types.ts`. A scene builds a `DashScene` (title, subtitle, legend, `views`, `tiles`, `narrative`, `side`, `filters`,
  sources) and renders `<Dashboard {...} />`. The data hooks and selectors of the scenes do not change.
- A `DashView` is `{ id, name, thumb, content }`: `thumb` is a chart option (rendered small, not interactive) or a node;
  `content` is what the viewer shows. 2D and 3D share the list; the viewer asks the renderer (`2d` or `3d`) for the
  content.
- The bottom bar is the global shell (`Hud`); the scene filters reach it through a slot (`FiltersSlot`), so each scene
  keeps owning its filters while the page layout stays one grid.
- 3D: Three.js bundled in its own lazy chunk (D-3d-1), loaded after the 2D dashboard is on screen (D-3d-2, poster first).
  Renderers: bars (the reference image), province map extruded, lines and fan as ribbons, treemap as blocks. The 3D
  viewer has a text alternative: the same table as the 2D view.

## State

D1 to D6 are built. 3D: `three` 0.186.1 in its own lazy chunk (`web/src/three/`, 3D chunk budget in `budgets.json`), a "Vista" 2D/3D switch (same as the D key; 3D by default when the device has WebGL2, flat otherwise), a 3D version of: the rankings (bars, the reference look), the province maps (extruded, click selects, shared with the flat map), and the line charts (long run, trend, fan, simulator path: one wall per series in its own lane, translucent band). Data and selection are the same in 2D and 3D; every 3D view keeps its table. Not 3D yet: the treemap, the rank history, the doubling curve and the Andes (they stay flat in both modes). D1 to D3 (2D): the grid with no scroll, the carousel, the viewer with 1, 2 or 4 views, Recorrido and Explorar,
the right panel with the story docked, the bottom bar with the scene filters, paged tables, and the five scenes on it
(Andes and Revolución IA with one placeholder view). D4 onward (3D) is next.

## Phases (one PR each, red then green)

| # | PR | Content |
|---|---|---|
| D1 | `dashboard-shell` | Grid with no scroll, header tabs, bottom bar with filters slot, carousel, list, viewer (1 view), right panel; Economía migrated as the template; paginated `DataTable`; tests and e2e |
| D2 | `dashboard-scenes` | Recursos, Pronóstico and Simulador migrated; Andes and Revolución IA as one-view placeholders |
| D3 | `dashboard-viewer` | 2 and 4 views at once, Recorrido and Explorar, story in the right panel, keyboard for the carousel |
| D4 | `view-3d-engine` | Three.js chunk, 2D/3D switch, poster first, 3D bars (the reference image) |
| D5 | `view-3d-map` | Extruded province map in 3D, same selection as 2D |
| D6 | `view-3d-rest` | Ribbons for lines and fan, blocks for the treemap, text alternative |
| D7 | `andes` | Andes scene on the same dashboard (needs the terrain and `D-andes-1` to `D-andes-4`) |
| D8 | `map-navigation` | Zoom (wheel, `+` and `-` buttons), pan and reset on the 2D maps; free orbit, pan, wider zoom and reset on every 3D view; brief `map-navigation.md` |
| D9 | `fullscreen-viewer` | A "Pantalla grande" button on every view that opens a popup with the view large, a carousel over the scene's views, and at the top right the view name with the scene's filters and statistics; brief `fullscreen-viewer.md` |

D8 and D9 were asked for by the human on 2026-10-04 (3D is the priority, `D-3d-6`): today the 2D maps have no zoom or pan (`roam: false`), the 3D views orbit and zoom with the wheel only, and there is no big view. They come before the 3D polish.

## Rules

- Same data and same selection in 2D and 3D; switching mode keeps the view, the year and the filters.
- No new scroll box, no `tabIndex` on non-interactive elements. Reduced motion: no tweens, no auto-rotate.
- Colors only from `tokens.css` / `tokens.ts`; the 3D materials read the same tokens.
- The main bundle stays under `web/budgets.json`; everything 3D loads on demand.
