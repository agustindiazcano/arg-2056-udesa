# UI: the shell and its design language

Dark and cinematic: frosted glass over a stage with a soft accent glow, one accent color (`--blue`), text in `--ink`
and `--ink-2`. The language of the interface is Spanish. The look is defined once and reused.

## Where things live

| What | File |
|---|---|
| Colors, spacing, radius, type scale, glass surfaces | `web/src/styles/tokens.css` (and `tokens.ts` for the chart code) |
| Component styles (header, tabs, control bar, buttons, segmented control, chips, popover, badge) | `web/src/styles/ui.css` |
| The shell | `web/src/app/` (`App`, `Header`, `TabBar`, `Hud` = the control bar, `ProvinceFilter`, `MockBadge`, `SceneHost`) |
| Shared controls | `web/src/ui/Segmented.tsx` |
| Shared scene components | `web/src/ui/` (`SceneShell`, `TableToggle`, `FilterBar` and `FilterChip`, `SceneLoading` and `SceneError`) |
| Spanish names (resources, scenarios, indicators, project statuses, position against the range) | `web/src/content/labels.ts` |
| Number and date formats | `web/src/charts/format.ts` (`APP_LOCALE = 'es-AR'`, `formatValue`, `formatNumber`, `formatDecimal`, `formatPercent`, `formatDate`, `ordinal`) |

Rules: no color literal outside `tokens.css` / `tokens.ts` (a test fails on one in any other stylesheet); `ui.css` builds
its surfaces with `color-mix()` from the tokens, so there is no new color to approve. Spacing follows the scale of
`design.md` (4, 8, 12, 16, 24, 32, 48) through the `--space-*` tokens, radius through `--radius-*`. Motion is a few
200 ms transitions that the global reduced-motion rule turns off.

## The control bar

Play or pause (one button whose name says what it will do), the year (a number and a slider), speed (two buttons and the
value), scenario (a segmented control: Pesimista, Esperado, Optimista), the AI effect (a toggle) and the province (a
button that opens a dialog with the 24 provinces). Keys are unchanged (`KEY_MAP`). There is no 2D/3D button until a view
uses it (the `d` key still toggles `mode`).

## The dashboard (docs/dashboard.md)

Every scene is a one-screen dashboard (`web/src/dashboard/`): names on the left, a carousel of views and the viewer in the
middle, indicators and the story on the right, the controls and the scene filters in a bottom bar. Nothing scrolls on
screens wider than 960 px (tables page to the room they have). The viewer shows 1, 2 or 4 views at once (the "Paneles a la
vez" buttons) and has two modes: Recorrido (the story, docked in the right panel) and Explorar (no story). The bottom bar
is the global shell; the scene filters reach it through a slot (`SlotPortal`). A scene gives `Dashboard` its views, tiles,
rail, filters and notes; its data hooks do not change.

## The scenes

Every scene is built on the same pieces, so a new scene or the 3D presentation reuses them:

- `SceneShell`: the one `h1`, a one-line subtitle, the content and the auditable source line ("Fuente: A, B, consultado
  el 2 de octubre de 2026"; `dateLabel="generado el"` for model output). It is the only place that writes that line.
- `TableToggle`: the "Ver tabla" button (`aria-pressed`) that swaps a chart for the table of the same data.
- `FilterBar` and `FilterChip`: a labelled group of pressed-state chips (indicator, mode, resource, countries, scenario).
- `SceneLoading` and `SceneError`: the two states of every scene that loads data. Both are `role="status"` because the
  project forbids assertive live regions (`liveRegions.test.ts`).

Scene rows grow with their content and `main.scene-container` scrolls; no table has its own scroll box (axe
`scrollable-region-focusable`).

## Language and formats

The whole interface is Spanish (Argentina): scenes, chart titles, axes, tooltips, `aria-label`s, tables, the story
panel, the references page and `lang="es"` in both HTML entries. Text avoids the second person (infinitives and
impersonal forms). Numbers and dates go through `format.ts` only: decimal comma, thousands dot, compact `10 k` and
`1,5 M`, `ordinal(2)` is `2.º`. The ICU spaces in compact numbers are non-breaking; tests normalize them.

Series and indicator names that the data carries (country codes, province names, source names, mock labels) are shown as
the data has them. The story steps, the era bands and the page description are provisional content in Spanish; the human
replaces them before the release (`PENDING.md`).
