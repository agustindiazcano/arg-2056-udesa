# Last Context

## State
- **UI polish on `task/hover-transitions`** (human requests 2026-10-12):
  - The hover of the "Argentina 2056" title (intro and nav logo) only changes color (Argentina gold, 2056 white), with a slow `ease-in-out` transition (0.6 s intro, 0.5 s nav) and no glow; the intro title has `cursor: pointer`.
  - Data section: the bar sits flush under the site nav; the page flows in the document (`.app-screen:has(.data-page)` in `ui.css`), so the window is the only page scroll, the nav (`.chrome`) and the Data bar are sticky; the tables are cards in a grid (`.data-cards`, min 24rem) that fit the screen width; each table keeps its own inner scroll (max 16rem).
- Not run locally (tests go to CI). Checked by hand in Chromium at 1366x768.

## Open
- The story caption ("Paso 1 de 3") floats over the Data page and covers content; hide it in Data (human to confirm).
- The intro title is not clickable, only shows the hand cursor; the human may want a target.
