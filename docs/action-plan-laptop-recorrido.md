# Plan: Recorrido on a laptop (1366x768, 1440x900, 1536x864)

Human request 2026-10-25: sweep the app for aesthetics and organisation using the `dataviz` guide, make the Recorrido read well on a laptop, do not touch the Andes. When things do not fit: small buttons with a title and a small drawing; a click shows that chart big.

## What the sweep found (1366x768, `Hacia el 2056`)

| Slide | Problem | Fix |
|---|---|---|
| 1 PBI mundial | three panels share the height; the region bars are 80 px tall, labels collide | one big panel + a rail (PBI, ranking, región) |
| 2 Recursos | reference chips (2 lines), three rows of tabs and the KPI strip take 300 px; treemap and bars are cut | rail (Composición, Barras, Mapa); chips hidden (the side panel lists them); KPI strip on one row |
| 3 Regla del 70 | fine | none |
| 4 Composición | fine | none |
| 5 Productividad | fine | none |
| 6 IA | two small charts unreadable (overlapping axis text) | rail (PBI, Otros gráficos, Indicadores) |
| 7 y 8 | bottom cut by a few px | none (tracked) |
| all with side panel | 22 rem panel takes a quarter of the width | 19 rem on a short screen |

## Design

- `compact` = `(max-height: 820px) and (min-width: 901px)`: a short laptop screen. At 900 px of width or less the existing mobile stacking is untouched.
- `PanelRail`: a row of small buttons (icon + title, `aria-pressed`) over the chart area. One panel is shown big; the others are `display: none` until picked.
- Only in compact mode. On a tall screen nothing changes.
- No colour literals outside `tokens.css` (AGENTS.md section 8). Reduced motion respected (no transitions added).

## Steps (TDD, one branch `task/laptop-recorrido-layout`)

1. Test + `tour/compact.ts` (`isCompact`, `useCompact`).
2. Test + `tour/PanelRail.tsx`.
3. Wire into WorldStep, ResourcesStep, AiStep.
4. CSS for compact in `ui.css`.
5. Look at it in a browser at the three sizes; push; read CI.

Not touched: `web/src/scenes/andes`.
