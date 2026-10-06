# Task: `fullscreen-viewer`

Branch: `task/fullscreen-viewer`. One PR. Read `AGENTS.md` (section 8, the keyboard map, WebGL cleanup), `LASTCONTEXT.md`, `PENDING.md`, `docs/dashboard.md`, `design.md` (binding), `docs/archived/map-navigation.md` (the controls this popup reuses), `web/src/ui/ChartPanel.tsx`, `TableToggle.tsx`, `FilterBar.tsx`, `Tile.tsx`, `web/src/dashboard/` (`Dashboard`, `Viewer`, `ViewCarousel`, `Thumb`, `types.ts`, `prefs.ts`), `web/src/charts3d/Chart2D3D.tsx`, `web/src/three/Chart3D.tsx`, `web/src/app/ProvinceFilter.tsx` (the existing dialog pattern), `web/src/types/keys.ts`, `web/src/state/` and the e2e suite first.
Prerequisites: the dashboard phases D1 to D6 are merged (they are). `map-navigation` should be merged first, because the popup shows the same navigable maps and 3D views; if it is not merged, the popup shows them as they are and the PR says so. Decisions `D-3d-1` to `D-3d-6` are taken.

## Current state (read from the code, 2026-10-04)

- A view is a `DashView` (`id`, `name`, `thumb`, `content`) wrapped by `ChartPanel` (title, optional `actions`, `TableToggle`). The carousel (`ViewCarousel`) lists the views of the scene; the viewer shows 1, 2 or 4 of them. There is no way to see one chart bigger than its slot, and no full screen or popup.
- A scene (`DashScene`) already carries what the popup needs: `views`, `filters` (the scene filter controls), `tiles` (the indicator tiles), `legend`, `sources`, `retrievedAt`, `dateLabel`.
- `Esc` and the arrows are global keys (`KEY_MAP`): arrows change scene, `Esc` goes back or closes.

## Goal

Every map and every chart has a "Pantalla grande" button that opens a popup with that view large. In the popup the user moves through the views of the scene like a carousel, and at the top right sees which chart it is, with its filters and its statistics. The human asked for it in these words: maps and charts should have a big-screen button that opens a popup with the charts, switchable like a carousel, with a text at the top right saying which chart it is, plus filters or statistics data.

## Scope

1. **Button**: in the `ChartPanel` header, next to "Ver tabla": an icon button with the accessible name "Ver en pantalla grande" (`aria-haspopup="dialog"`). It appears on every view of every scene (the five data scenes; the Andes and Revolución IA placeholders get it when their views exist). It is one change in the shared `ChartPanel`, not one per scene.
2. **Popup** (`web/src/dashboard/BigViewer.tsx`, loaded with `React.lazy` so the main chunk budget does not grow; it opens in about the same time as a scene change):
   - A modal `role="dialog"` with `aria-modal="true"`, about 94% of the viewport width and 90% of its height (full screen under 960 px), a dimmed backdrop, a close button and `Esc`.
   - **Chart area**: the selected view large, the same `Chart2D3D` content as the dashboard (2D or 3D follows the current mode; the mode switch "2D/3D" is in the popup header too), with the navigation controls of `map-navigation` and the table toggle.
   - **Top right**: the name of the view as the heading (the `DashView.name` and the scene title), and under it the filters and the statistics: the scene's `filters` (live controls, they change the same global state, so the chart in the popup updates) and the scene's `tiles` (the indicator figures), the `legend`, and one line with the source and date (`sources`, `retrievedAt` or `dateLabel`).
   - **Carousel**: previous and next arrow buttons on the sides of the chart and a row of thumbnails (`Thumb`) at the bottom; the selected view is marked; it wraps from the last view to the first. The thumbnails and the arrows use the same view list and order as the dashboard carousel.
   - **Playback**: a compact control line (play or pause, the year, the scenario) so a 3D view can be animated in the popup; it dispatches the same store actions as the bottom bar.
   - **Optional**: a button in the popup that asks the browser for real full screen (the Fullscreen API) for the dialog. If the browser refuses, nothing changes. Listed as optional; skip it if it complicates the focus handling.
3. **State**: which view is open is local state of the dashboard (a small context), not the global store; closing returns to the same dashboard state. The navigation pose of a view (from `map-navigation`) is shared by the dashboard and the popup, so opening the popup keeps the camera; if that is not done, the popup starts from the start pose and the PR says so.

## Rules and constraints

- Keyboard: `KeyAction` and `KEY_MAP` do not change. While the popup is open it handles `ArrowLeft`, `ArrowRight` (previous and next view), `Esc` (close) and `Tab` itself, in the capture phase with `stopPropagation`, so the global handler does not also change the scene or leave the page. The other global keys (`Space`, `+`, `-`, `1/2/3`, `D`, `P`) keep working. When the popup closes the global behavior is restored; a test proves both.
- Accessibility: the focus moves into the popup on open (to the heading or the close button), is trapped inside it (Tab and Shift+Tab cycle) and returns to the button that opened it on close; the page behind is `inert` or `aria-hidden`; the dialog has an accessible name (the view name); `role="status"` messages follow the rule of `liveRegions.test.ts` (no `role="alert"`); contrast and sizes follow `design.md`; the axe test passes with the dialog open.
- WebGL: only one WebGL context may be alive. When the popup opens, the 3D stages behind it are disposed or paused; when it closes they are back. A test counts the stages created and disposed.
- Motion: opening and closing are a fade of 200 ms or less with GSAP or CSS (`design.md` section 5), and no animation under `prefers-reduced-motion`. No scroll inside the popup except in a long table.
- The popup reads the scene's data only through what the scene already provides (`DashScene`); it adds no data, no selector and no claim. A view with no `filters` or `tiles` simply omits that block.
- Tokens only for color; no new dependency; no change to the model, the schemas or the mock; the main chunk budget passes (`npm run check:bundle`).

## Tests (write first)

- **ChartPanel**: every panel renders the "Ver en pantalla grande" button with that exact name; clicking it calls `onExpand` with the view id.
- **BigViewer (jsdom, renderer mocked)**: it renders the heading with the view name; the filters and tiles of the scene appear (compare with the scene object); a view without them omits the block; next and previous move through the view list in order and wrap at both ends; clicking a thumbnail selects that view; the 2D/3D switch changes the content kind.
- **Keyboard**: with the popup open, `ArrowRight` changes the view and the store's scene is unchanged; `Esc` closes it and the scene is unchanged; after closing, `ArrowRight` changes the scene again (global map restored); `Space`, `+`, `-` still dispatch their actions while it is open.
- **Focus**: focus enters the dialog, Tab and Shift+Tab stay inside it, and focus returns to the opening button on close.
- **WebGL**: opening the popup on a 3D view leaves exactly one stage alive; closing restores the dashboard's.
- **E2E** (software GL, 1440x810 and 390x844): open the popup from the Recursos map in 3D and from a Pronóstico chart in 2D, move through the carousel, close with `Esc`; the axe test passes with the dialog open; the CSP spec passes; a screenshot of each is stored for the human's review.

## Acceptance checklist

- [ ] Tests committed failing first where applicable, then green. `python scripts/precheck.py` passes; the e2e suite run or "e2e not run locally". CI result read or "pushed, CI not checked".
- [ ] Every view has the button; the popup shows the view large, the name and the scene's filters and statistics at the top right, the carousel (arrows and thumbnails), the table toggle and the playback line.
- [ ] `KeyAction`, `KEY_MAP` and the store shape unchanged; the popup's keys do not leak to the global handler and are restored on close; one WebGL context at a time; focus trapped and returned; reduced motion respected.
- [ ] The popup is a lazy chunk and the bundle budgets pass; no new dependency; every figure comes from the scene's data.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (visual debt listed).
- [ ] PR description: what changed, what was verified, what the human must verify (the look and the size of the popup against `design.md`, the order and wording of the header block, the feel of the carousel on a real GPU and on a touch device, whether the optional browser full screen is wanted).
