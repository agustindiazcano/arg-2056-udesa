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

Rules: no color literal outside `tokens.css` / `tokens.ts` (a test fails on one in any other stylesheet); `ui.css` builds
its surfaces with `color-mix()` from the tokens, so there is no new color to approve. Spacing follows the scale of
`design.md` (4, 8, 12, 16, 24, 32, 48) through the `--space-*` tokens, radius through `--radius-*`. Motion is a few
200 ms transitions that the global reduced-motion rule turns off.

## The control bar

Play or pause (one button whose name says what it will do), the year (a number and a slider), speed (two buttons and the
value), scenario (a segmented control: Pesimista, Esperado, Optimista), the AI effect (a toggle) and the province (a
button that opens a dialog with the 24 provinces). Keys are unchanged (`KEY_MAP`). There is no 2D/3D button until a view
uses it (the `d` key still toggles `mode`).

## Not done yet (next phases)

The scenes and the story panel are still in English with plain styling; the shared `SceneShell`, `TableToggle` and the
unified filter bar, the Spanish pass over the scenes and charts, and `APP_LOCALE = es-AR` come next.
